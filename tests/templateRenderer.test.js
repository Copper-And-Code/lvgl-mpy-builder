import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { allWidgetsProject, hostileProject } from './fixtures/projects';
import { generateCCode } from '../src/generators/cGenerator';
import { generateMicroPythonCode } from '../src/generators/micropythonGenerator';
import { indentText } from '../src/generators/indent';
import { clearTemplateCache } from '../src/generators/templateLoader';
import { checkTemplate, indentText as mainIndentText, renderTemplate } from '../src/main/templateRenderer';
import { isCustomized, readTemplate, resetTemplate, writeTemplate } from '../src/main/templateStore';

const REPO_ROOT = path.resolve(__dirname, '..');
const bundled = { bundledDir: REPO_ROOT };

// The two ways the app renders templates: in the Electron main process
// (renderTemplate IPC) and locally (browser during development, tests)
const mainProcessApi = {
  renderTemplate: async (architecture, name, data, builtin) =>
    renderTemplate(readTemplate(bundled, architecture, name) ?? builtin, structuredClone(data)),
};
const localApi = {
  readTemplate: async (architecture, name) => readTemplate(bundled, architecture, name),
};

async function generateWith(api, generate, project, architecture) {
  clearTemplateCache();
  vi.stubGlobal('window', { electronAPI: api });
  try {
    return await generate(project, architecture);
  } finally {
    vi.unstubAllGlobals();
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});
afterEach(() => vi.useRealTimers());

describe('template rendering in the main process', () => {
  it('indents like the renderer helper', () => {
    for (const text of ['a\nb', 'x\r\n  y\n\nz', '', undefined, 'one']) {
      expect(mainIndentText(text, 4)).toBe(indentText(text, 4));
    }
  });

  describe.each([
    ['C', generateCCode],
    ['MicroPython', generateMicroPythonCode],
  ])('%s', (_language, generate) => {
    it.each(['unix', 'stm32', 'esp32', 'rp2040'])('gives the same output as local rendering (%s)', async (architecture) => {
      for (const project of [allWidgetsProject(), hostileProject()]) {
        const fromMain = await generateWith(mainProcessApi, generate, project, architecture);
        const local = await generateWith(localApi, generate, project, architecture);
        expect(fromMain).toBe(local);
      }
    });
  });

  it('rejects templates that do not compile', () => {
    expect(() => checkTemplate('{{#if pages}} unclosed')).toThrow(/Template error/);
    expect(() => checkTemplate('{{#each pages}}{{this.name}}{{/each}}')).not.toThrow();
  });
});

describe('customized templates', () => {
  let userDir;
  beforeEach(() => {
    userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lvgl-user-'));
  });
  afterEach(() => fs.rmSync(userDir, { recursive: true, force: true }));

  it('reports and resets the customized copy', () => {
    expect(isCustomized(userDir, 'unix', 'c')).toBe(false);
    writeTemplate(userDir, 'unix', 'c', 'custom');
    expect(isCustomized(userDir, 'unix', 'c')).toBe(true);
    expect(readTemplate({ userDir, bundledDir: REPO_ROOT }, 'unix', 'c')).toBe('custom');

    resetTemplate(userDir, 'unix', 'c');
    expect(isCustomized(userDir, 'unix', 'c')).toBe(false);
    expect(readTemplate({ userDir, bundledDir: REPO_ROOT }, 'unix', 'c')).toContain('#include "lvgl.h"');
  });
});
