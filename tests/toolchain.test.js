// Compiles and runs the generated code with the real toolchains. Skipped
// unless the paths below are provided (CI sets them, see .github/workflows):
//   LVGL_96_DIR                LVGL 9.6 source tree (lvgl repository root)
//   MICROPYTHON_LVGL           lv_micropython unix firmware (ports/unix VARIANT=lvgl)
//   MICROPYTHON_LVGL_BINFONT   optional: the same firmware with the binary font
//                              loader (custom fonts), see the README

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { allWidgetsProject, hostileProject } from './fixtures/projects';
import { generateCCode } from '../src/generators/cGenerator';
import { generateMicroPythonCode } from '../src/generators/micropythonGenerator';
import { buildProjectCode } from '../src/generators/core/project';
import { clearTemplateCache } from '../src/generators/templateLoader';
import { readTemplate } from '../src/main/templateStore';
import { convertFont } from '../src/main/fontConverter';

const REPO_ROOT = path.resolve(__dirname, '..');
const PROJECTS = { 'all widgets': allWidgetsProject, hostile: hostileProject };
const ARCHITECTURES = ['unix', 'stm32', 'esp32'];

const FONT_FLAGS = Array.from({ length: 21 }, (_, i) => `-DLV_FONT_MONTSERRAT_${8 + i * 2}=1`);

let workDir;
beforeAll(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lvgl-gen-'));
});
afterAll(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
});
beforeEach(() => {
  clearTemplateCache();
  vi.stubGlobal('window', {
    electronAPI: {
      readTemplate: async (architecture, name) => readTemplate({ bundledDir: REPO_ROOT }, architecture, name),
      convertFont,
    },
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  clearTemplateCache();
});

function compile(lvglDir, file) {
  const includeDir = path.join(lvglDir, 'include', 'lvgl');
  const args = [
    '-fsyntax-only', '-std=c99', '-Wall', '-Wno-unused-variable',
    '-Werror=implicit-function-declaration', '-Werror=incompatible-pointer-types', '-Werror=int-conversion',
    // No aliases and no LV_DEPRECATED functions: the code must also build with LVGL 10
    '-Werror=deprecated-declarations', '-DLV_CONF_SKIP', '-DLV_DISABLE_API_MAPPING', ...FONT_FLAGS,
    '-I', path.join(REPO_ROOT, 'tests', 'c-stubs'),
    '-I', fs.existsSync(includeDir) ? includeDir : lvglDir, '-I', lvglDir,
    file,
  ];
  return spawnSync('gcc', args, { encoding: 'utf-8' });
}

const LVGL_TREES = [['9.6', process.env.LVGL_96_DIR]].filter(([, dir]) => dir);

describe.runIf(LVGL_TREES.length > 0).each(LVGL_TREES)('C compiles against LVGL %s', (_version, lvglDir) => {
  describe.each(Object.entries(PROJECTS))('%s project', (label, makeProject) => {
    it.each(ARCHITECTURES)('%s templates', async (architecture) => {
      const file = path.join(workDir, `${label.replace(/\W/g, '_')}_${architecture}_${_version}.c`);
      fs.writeFileSync(file, await generateCCode(makeProject(), architecture));
      const result = compile(lvglDir, file);
      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
    });
  });
});

// Headless display, then the generated module, then exercise it
function harness(generated, baseName, pageCount, extra = '') {
  return `import lvgl as lv
import gc
_disp = lv.display_create(800, 480)
_buf = bytearray(800 * 40 * 4)
_disp.set_buffers(_buf, None, len(_buf), lv.DISPLAY_RENDER_MODE.PARTIAL)
_disp.set_flush_cb(lambda d, area, px: d.flush_ready())

${generated}

def _run(ms):
    for _ in range(ms // 10):
        lv.tick_inc(10)
        lv.timer_handler()
        gc.collect()

${baseName}_init()
_run(300)
for _page in range(${pageCount}):
    ${baseName}_load_page(_page)
    _run(100)
for _obj in list(objects.values()):
    for _code in (lv.EVENT.CLICKED, lv.EVENT.PRESSED, lv.EVENT.LONG_PRESSED, lv.EVENT.VALUE_CHANGED):
        _obj.send_event(_code, None)
_run(500)
${extra}
print("RUN_OK", len(objects))
`;
}

const FIRMWARES = [
  ['default', process.env.MICROPYTHON_LVGL],
  ['binfont', process.env.MICROPYTHON_LVGL_BINFONT],
].filter(([, file]) => file);
const firmware = process.env.MICROPYTHON_LVGL;

// CI sets REQUIRE_TOOLCHAIN so that a missing path fails instead of skipping
describe.runIf(Boolean(process.env.REQUIRE_TOOLCHAIN))('toolchain configuration', () => {
  it('has LVGL 9.6 and the lv_micropython firmware', () => {
    expect(fs.existsSync(path.join(process.env.LVGL_96_DIR ?? '', 'lvgl.h'))).toBe(true);
    expect(fs.existsSync(firmware ?? '')).toBe(true);
    expect(fs.existsSync(process.env.MICROPYTHON_LVGL_BINFONT ?? '')).toBe(true);
  });
});

const PROJECT_FIRMWARES = Object.entries(PROJECTS).flatMap(([label, makeProject]) =>
  FIRMWARES.map(([name, file]) => [label, name, makeProject, file])
);

describe.runIf(FIRMWARES.length > 0).each(PROJECT_FIRMWARES)('MicroPython runs on lv_micropython: %s project, %s firmware', (label, _name, makeProject, firmware) => {
  it('creates every page and widget, runs animations and events', async () => {
    const project = makeProject();
    const { baseName, pages } = buildProjectCode(project, 'micropython');
    const widgetCount = project.pages.reduce((sum, page) => sum + page.widgets.length, 0);
    const file = path.join(workDir, `${label.replace(/\W/g, '_')}_${_name}.py`);
    // With variables: change one and print the widgets bound to it
    const bindingCheck = project.variables?.length
      ? [
          'var_level.set_int(2)',
          'var_enabled.set_int(0)',
          '_run(100)',
          'print("BOUND", objects["slider_widget"].get_value(), objects["arc_widget"].get_value(),',
          '      objects["roller_widget"].get_selected(), objects["label_widget"].get_text(),',
          '      objects["switch_widget"].has_state(lv.STATE.CHECKED), objects["checkbox_widget"].has_state(lv.STATE.CHECKED))',
          'objects["slider_widget"].set_value(7, False)',
          'objects["slider_widget"].send_event(lv.EVENT.VALUE_CHANGED, None)',
          'print("FROM_WIDGET", var_level.get_int())',
          // Custom font: loaded when the firmware can, Montserrat otherwise
          '_f = font_dejavusans_latin1_14',
          '_m = lv.font_montserrat_14',
          'print("FONT", hasattr(lv, "binfont_create_from_buffer"), (_f.line_height, _f.base_line) != (_m.line_height, _m.base_line))',
        ].join('\n')
      : '';
    const binfont = spawnSync(firmware, ['-c', 'import lvgl as lv; print(hasattr(lv, "binfont_create_from_buffer"))'], { encoding: 'utf-8' });
    fs.writeFileSync(file, harness(await generateMicroPythonCode(project, 'unix'), baseName, pages.length, bindingCheck));

    const result = spawnSync(firmware, [file], { encoding: 'utf-8', timeout: 60000 });
    expect(result.stderr).toBe('');
    const expected = project.variables?.length
      ? ['BOUND 2 2 2 Level: 2 False False', 'FROM_WIDGET 7', `FONT ${binfont.stdout.trim()} ${binfont.stdout.trim()}`, `RUN_OK ${widgetCount}`]
      : [`RUN_OK ${widgetCount}`];
    expect(result.stdout.trim().split('\n')).toEqual(expected);
  });
});
