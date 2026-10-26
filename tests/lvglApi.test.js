// Checks the generated code against the real LVGL APIs (see scripts/lvgl-api):
// every C symbol must exist in LVGL 9.6 without deprecated aliases and no
// LV_DEPRECATED function may be called; every MicroPython class, method, enum
// and function must exist in the lv_micropython firmware (LVGL 9.3).

import { spawnSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import cSymbolsFixture from './fixtures/lvgl-c-symbols.json';
import mpyApi from './fixtures/lvgl-micropython-api.json';
import { allWidgetsProject, hostileProject } from './fixtures/projects';
import { widgetDefinitions } from '../src/core/widgetDefinitions';
import { generateCCode } from '../src/generators/cGenerator';
import { generateMicroPythonCode } from '../src/generators/micropythonGenerator';
import { buildProjectCode } from '../src/generators/core/project';
import { functionOwner } from '../src/generators/core/emit';
import { SUPPORTED_WIDGET_TYPES } from '../src/generators/core/widgets';
import { clearTemplateCache } from '../src/generators/templateLoader';
import { readTemplate } from '../src/main/templateStore';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..');
const C_SYMBOLS = new Set(cSymbolsFixture.symbols);
const C_DEPRECATED = new Set(cSymbolsFixture.deprecated);
const PROJECTS = { 'all widgets': allWidgetsProject, hostile: hostileProject };
const ARCHITECTURES = ['unix', 'stm32', 'esp32'];
const STRUCT_TYPES = { anim: 'anim_t', style: 'style_t', span: 'span_t', event: 'event_t' };
const CTYPE_CLASSES = {
  'lv_obj_t *': 'obj',
  'lv_chart_series_t *': 'chart_series_t',
  'lv_span_t *': 'span_t',
  'lv_style_t *': 'style_t',
};

const methodsOf = (cls) =>
  new Set([...(mpyApi.classes[cls] ? mpyApi.classes.obj.methods : []), ...(mpyApi.classes[cls]?.methods ?? []), ...(mpyApi.structs[cls] ?? [])]);

/** Remove string literals and comments, which may legitimately contain anything. */
function stripLiteralsAndComments(code, language) {
  const strings = /"(?:[^"\\\n]|\\.)*"/g;
  const comments = language === 'c' ? /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g : /#[^\n]*/g;
  const docstrings = /"""[\s\S]*?"""/g;
  return code.replace(docstrings, '').replace(strings, '""').replace(comments, '');
}

function useBundledTemplates() {
  vi.stubGlobal('window', {
    electronAPI: {
      readTemplate: async (architecture, name) => readTemplate({ bundledDir: REPO_ROOT }, architecture, name),
    },
  });
}

beforeEach(() => {
  clearTemplateCache();
  useBundledTemplates();
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearTemplateCache();
});

describe('generator coverage', () => {
  it('every editor widget type has a code builder', () => {
    expect(Object.keys(widgetDefinitions).filter((type) => !SUPPORTED_WIDGET_TYPES.includes(type))).toEqual([]);
  });
});

describe.each(Object.entries(PROJECTS))('%s project', (_label, makeProject) => {
  describe.each(ARCHITECTURES)('%s templates', (architecture) => {
    it('C uses only LVGL 9.6 symbols and no deprecated function', async () => {
      const code = stripLiteralsAndComments(await generateCCode(makeProject(), architecture), 'c');
      const used = [...new Set(code.match(/\b(?:lv|LV)_[A-Za-z0-9_]+\b/g))];
      // ui_* handles and helpers are ours; everything lv_/LV_ must be LVGL's
      expect(used.filter((name) => !C_SYMBOLS.has(name))).toEqual([]);
      expect(used.filter((name) => C_DEPRECATED.has(name))).toEqual([]);
    });

    it('MicroPython uses only names exported by the lv_micropython binding', async () => {
      const code = stripLiteralsAndComments(await generateMicroPythonCode(makeProject(), architecture), 'py');
      const problems = [];

      for (const [, name] of code.matchAll(/\blv\.([a-z_0-9]+)\b(?!\.)/g)) {
        const known = mpyApi.classes[name] || mpyApi.module.functions.includes(name) ||
          mpyApi.structs[name] || mpyApi.module.blobs.includes(name);
        if (!known) problems.push(`lv.${name}`);
      }
      for (const [, constant] of code.matchAll(/\blv\.([A-Z][A-Z_0-9]*)\b(?!\.)/g)) {
        if (!mpyApi.module.int_constants.includes(constant)) problems.push(`lv.${constant}`);
      }
      for (const [, enumName, member] of code.matchAll(/\blv\.([A-Z][A-Z_0-9]*)\.([A-Z_0-9]+)\b/g)) {
        if (!mpyApi.module.enums[enumName]?.includes(member)) problems.push(`lv.${enumName}.${member}`);
      }
      for (const [, cls, enumName, member] of code.matchAll(/\blv\.([a-z_]+)\.([A-Z][A-Z_0-9]*)\.([A-Z_0-9]+)\b/g)) {
        const enums = { ...mpyApi.classes.obj.enums, ...(mpyApi.classes[cls]?.enums ?? {}) };
        if (!enums[enumName]?.includes(member)) problems.push(`lv.${cls}.${enumName}.${member}`);
      }
      for (const [, struct, method] of code.matchAll(/\blv\.([a-z_]+_t)\.([a-z_0-9]+)\b/g)) {
        if (!mpyApi.structs[struct]?.includes(method)) problems.push(`lv.${struct}.${method}`);
      }
      for (const [, method] of code.matchAll(/\be\.([a-z_]+)\(/g)) {
        if (!mpyApi.structs.event_t.includes(method)) problems.push(`event_t.${method}`);
      }
      expect(problems).toEqual([]);
    });
  });

  it('every MicroPython method call exists on the class of its target', () => {
    const { model } = buildProjectCode(makeProject(), 'micropython');
    const problems = [];

    model.pages.forEach((page) => {
      const classes = new Map([['parent', 'obj']]);
      page.nodes.forEach((node) => {
        node.ops.forEach((op) => {
          if (op.op === 'create' || op.op === 'construct') {
            if (!mpyApi.classes[op.cls]) problems.push(`unknown class lv.${op.cls}`);
            classes.set(op.name, op.cls);
          } else if (op.op === 'struct') {
            classes.set(op.name, op.pyType);
          } else if (op.op === 'call') {
            const { owner, method } = functionOwner(op.fn);
            const targetClass = classes.get(op.target.name);
            const expectedOwner = STRUCT_TYPES[owner] ?? owner;
            const ownerOk = expectedOwner === 'obj' ? Boolean(mpyApi.classes[targetClass]) : expectedOwner === targetClass;
            if (!ownerOk || !methodsOf(targetClass).has(method)) {
              problems.push(`${op.fn} -> ${targetClass}.${method}`);
            }
            if (op.assign) classes.set(op.assign.name, CTYPE_CLASSES[op.assign.ctype] ?? 'unknown');
          }
        });
      });
    });
    expect(problems).toEqual([]);
  });

  it('creates every parent before its children', () => {
    const { model } = buildProjectCode(makeProject(), 'c');
    model.pages.forEach((page) => {
      const created = new Set(['parent']);
      page.nodes.forEach((node) => {
        node.ops
          .filter((op) => op.op === 'create')
          .forEach((op) => {
            expect(created.has(op.parent.name)).toBe(true);
            created.add(op.name);
          });
      });
    });
  });

  it('declares every identifier once', async () => {
    const code = await generateCCode(makeProject(), 'unix');
    const functions = [...code.matchAll(/^(?:void|int|static void) ([a-z_0-9]+)\(/gm)].map((m) => m[1]);
    const handles = [...code.matchAll(/^lv_obj_t \* (ui_[a-z_0-9]+);/gm)].map((m) => m[1]);
    // forward declarations repeat callback names once
    const definitions = functions.filter((name, i) => functions.indexOf(name) !== i);
    expect(new Set(handles).size).toBe(handles.length);
    expect(new Set(definitions).size).toBe(definitions.length);
    expect(functions.every((name) => /^[a-z_][a-z_0-9]*$/.test(name))).toBe(true);
  });
});

const hasPython = !spawnSync('python3', ['--version']).error;

describe.runIf(hasPython).each(Object.entries(PROJECTS))('%s project: Python syntax', (_label, makeProject) => {
  it.each(ARCHITECTURES)('%s', async (architecture) => {
    const code = await generateMicroPythonCode(makeProject(), architecture);
    const result = spawnSync('python3', ['-c', 'import ast,sys; ast.parse(sys.stdin.read())'], { input: code, encoding: 'utf-8' });
    expect(result.stderr).toBe('');
  });
});

describe('hostile project', () => {
  it('escapes strings and comments', async () => {
    const c = await generateCCode(hostileProject(), 'unix');
    expect(c).toContain('"Quote \\" backslash \\\\ newline\\nend */ \\"\\"\\" ?\\?= tab\\t"');
    expect(c).not.toContain('evil()');
    const py = await generateMicroPythonCode(hostileProject(), 'unix');
    expect(py).toContain('"Quote \\" backslash \\\\ newline\\nend */ \\"\\"\\" ??= tab\\t"');
    expect(py).not.toContain('evil()');
  });

  it('keeps separate handlers when the same callback name has different code', () => {
    const { eventCallbacks } = buildProjectCode(hostileProject(), 'c');
    const names = eventCallbacks.map((handler) => handler.name);
    expect(names).toHaveLength(2);
    expect(new Set(names).size).toBe(2);
    expect(names.some((name) => name === 'print')).toBe(false);
  });

  it('ignores unknown event codes', () => {
    const { eventCallbacks } = buildProjectCode(hostileProject(), 'c');
    expect(eventCallbacks.flatMap((h) => h.body)).not.toContain('BOGUS');
  });

  it('keeps zero values and replaces invalid numbers and colors', async () => {
    const c = await generateCCode(allWidgetsProject(), 'unix');
    expect(c).toMatch(/lv_slider_set_value\(ui_slider_widget, 0, LV_ANIM_OFF\)/);
    const hostile = await generateCCode(hostileProject(), 'unix');
    expect(hostile).toMatch(/lv_slider_set_range\(ui_bad_slider, 0, 100\)/);
    expect(hostile).not.toMatch(/lv_obj_set_style_bg_color\(ui_bad_slider, lv_color_hex\(0x[0-9A-F]+\), LV_PART_MAIN\)/);
  });
});
