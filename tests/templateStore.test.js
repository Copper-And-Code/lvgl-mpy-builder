import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readTemplate, resolveTemplatePath, writeTemplate } from '../src/main/templateStore';

let userDir;
let bundledDir;

beforeEach(() => {
  userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lvgl-user-'));
  bundledDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lvgl-app-'));
  fs.mkdirSync(path.join(bundledDir, 'templates', 'unix'), { recursive: true });
  fs.writeFileSync(path.join(bundledDir, 'templates', 'unix', 'c_template.hbs'), 'bundled');
});

afterEach(() => {
  fs.rmSync(userDir, { recursive: true, force: true });
  fs.rmSync(bundledDir, { recursive: true, force: true });
});

describe('templateStore', () => {
  it.each([
    ['../../etc', 'c'],
    ['unix', '../../../.bashrc'],
    ['unix/../..', 'c'],
    ['', 'c'],
    ['unix', 'c_template.hbs'],
    [undefined, undefined],
  ])('rejects architecture %j / template %j', (architecture, templateName) => {
    expect(() => resolveTemplatePath(userDir, architecture, templateName)).toThrow();
    expect(() => writeTemplate(userDir, architecture, templateName, 'x')).toThrow();
  });

  it('reads the bundled template when there is no user copy', () => {
    expect(readTemplate({ userDir, bundledDir }, 'unix', 'c')).toBe('bundled');
  });

  it('returns null when no template exists', () => {
    expect(readTemplate({ userDir, bundledDir }, 'esp32', 'micropython')).toBeNull();
  });

  it('writes to the user directory and prefers the user copy', () => {
    writeTemplate(userDir, 'unix', 'c', 'custom');

    expect(fs.readFileSync(path.join(userDir, 'templates', 'unix', 'c_template.hbs'), 'utf-8')).toBe('custom');
    expect(fs.readFileSync(path.join(bundledDir, 'templates', 'unix', 'c_template.hbs'), 'utf-8')).toBe('bundled');
    expect(readTemplate({ userDir, bundledDir }, 'unix', 'c')).toBe('custom');
  });

  it('rejects non-string or oversized content', () => {
    expect(() => writeTemplate(userDir, 'unix', 'c', { evil: true })).toThrow();
    expect(() => writeTemplate(userDir, 'unix', 'c', 'x'.repeat(1024 * 1024 + 1))).toThrow();
  });
});
