import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateCCode } from '../src/generators/cGenerator';
import { generateMicroPythonCode } from '../src/generators/micropythonGenerator';
import { clearTemplateCache, indentText } from '../src/generators/templateLoader';
import { readTemplate } from '../src/main/templateStore';

const REPO_ROOT = path.resolve(__dirname, '..');
const ARCHITECTURES = ['unix', 'stm32', 'esp32'];

const widget = (id, type, name, props, extra = {}) => ({ id, type, name, props, events: [], ...extra });

// Reference project: one page with nesting, an event with multi-line code
// containing characters that HTML-escaping would mangle, and an animation.
const referenceProject = () => ({
  projectName: 'Demo & Co',
  pages: [
    {
      id: 'p1',
      name: 'Main',
      canvasSize: { width: 480, height: 320 },
      widgets: [
        widget('panel1', 'panel', 'panel_main', { x: 10, y: 10, width: 200, height: 100 }),
        widget('label1', 'label', 'title', { x: 5, y: 5, width: 100, height: 20, text: 'Hello' }, { parentId: 'panel1' }),
        widget('btn1', 'button', 'ok_button', { x: 20, y: 150, width: 80, height: 40, text: 'OK' }, {
          events: [
            {
              id: 'e1',
              type: 'LV_EVENT_CLICKED',
              callback: 'on_ok',
              code: 'if count > 0 and count < 10:\n    count = count + 1\nprint("a & b")',
            },
          ],
          animations: [
            { id: 'anim_0001', type: 'move_x', duration: 500, delay: 0, repeat: 0, playback: false, startValue: 0, endValue: 100, path: 'lv_anim_path_linear' },
          ],
        }),
      ],
    },
  ],
});

// Serve the real template files through the same API the Electron preload exposes
function useBundledTemplates() {
  vi.stubGlobal('window', {
    electronAPI: {
      readTemplate: async (architecture, name) => readTemplate({ bundledDir: REPO_ROOT }, architecture, name),
    },
  });
}

function pythonSyntaxError(source) {
  const result = spawnSync('python3', ['-c', 'import ast,sys; ast.parse(sys.stdin.read())'], {
    input: source,
    encoding: 'utf-8',
  });
  if (result.error) return null; // python3 not available: skip the check
  return result.status === 0 ? null : result.stderr;
}

const hasPython = !spawnSync('python3', ['--version']).error;

beforeEach(() => {
  clearTemplateCache();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  clearTemplateCache();
});

describe('indentText', () => {
  it('indents every line after the first', () => {
    expect(indentText('a = 1\nif a:\n    b = 2', 4)).toBe('a = 1\n    if a:\n        b = 2');
  });

  it('normalizes CRLF and keeps blank lines empty', () => {
    expect(indentText('a\r\n\r\nb', 2)).toBe('a\n\n  b');
  });

  it('handles empty and missing code', () => {
    expect(indentText('', 8)).toBe('');
    expect(indentText(undefined, 8)).toBe('');
  });
});

describe.each([
  ['default templates', () => {}],
  ['bundled template files', useBundledTemplates],
])('code generation with %s', (_label, setup) => {
  beforeEach(() => setup());

  describe.each(ARCHITECTURES)('architecture %s', (architecture) => {
    it('C output does not HTML-escape user code or the project name', async () => {
      const code = await generateCCode(referenceProject(), architecture);

      expect(code).toContain('if count > 0 and count < 10:');
      expect(code).toContain('print("a & b")');
      expect(code).toContain('Demo & Co');
      expect(code).not.toMatch(/&(amp|lt|gt|quot|#x27|#x3D|#x60);/);
    });

    it('MicroPython output does not HTML-escape user code', async () => {
      const code = await generateMicroPythonCode(referenceProject(), architecture);

      expect(code).toContain('print("a & b")');
      expect(code).not.toMatch(/&(amp|lt|gt|quot|#x27|#x3D|#x60);/);
    });

    it.runIf(hasPython)('MicroPython output is valid Python syntax', async () => {
      const code = await generateMicroPythonCode(referenceProject(), architecture);

      expect(pythonSyntaxError(code)).toBeNull();
    });

    it.runIf(hasPython)('MicroPython output is valid with an empty event handler', async () => {
      const project = referenceProject();
      project.pages[0].widgets[2].events[0].code = '';

      const code = await generateMicroPythonCode(project, architecture);

      expect(pythonSyntaxError(code)).toBeNull();
    });
  });
});

describe('reference project snapshots (unix, bundled templates)', () => {
  beforeEach(() => useBundledTemplates());

  it('C', async () => {
    expect(await generateCCode(referenceProject(), 'unix')).toMatchSnapshot();
  });

  it('MicroPython', async () => {
    expect(await generateMicroPythonCode(referenceProject(), 'unix')).toMatchSnapshot();
  });
});
