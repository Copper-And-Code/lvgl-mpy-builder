// Custom fonts: conversion with lv_font_conv (main process) and their use in
// the generated code. The toolchain tests compile and run the result.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import { FONT_DATA_URL, FONT_NAME } from './fixtures/projects';
import { createWidget } from '../src/core/widgetDefinitions';
import { BASE_CHARACTERS, embedCFont, widgetCharacters } from '../src/generators/core/fonts';
import { buildProjectCode } from '../src/generators/core/project';
import { generateCCode } from '../src/generators/cGenerator';
import { generateMicroPythonCode } from '../src/generators/micropythonGenerator';
import { clearTemplateCache } from '../src/generators/templateLoader';
import { convertFont } from '../src/main/fontConverter';
import { readTemplate } from '../src/main/templateStore';

const REPO_ROOT = path.resolve(__dirname, '..');

function project(widgets, fonts = [{ id: 'f1', name: FONT_NAME, data: FONT_DATA_URL }]) {
  return {
    projectName: 'Fonts',
    pages: [{ id: 'p1', name: 'Main', widgets }],
    assets: { images: [], fonts },
  };
}

const label = (id, props) => ({ ...createWidget('label', id, props), name: id });

function stubElectron(withConverter = true) {
  vi.stubGlobal('window', {
    electronAPI: {
      readTemplate: async (architecture, name) => readTemplate({ bundledDir: REPO_ROOT }, architecture, name),
      ...(withConverter ? { convertFont } : {}),
    },
  });
}

beforeEach(() => clearTemplateCache());
afterEach(() => {
  vi.unstubAllGlobals();
  clearTemplateCache();
});

describe('convertFont (main process)', () => {
  it('converts to C source and to an LVGL binary font', async () => {
    const c = await convertFont({ data: FONT_DATA_URL, size: 20, characters: 'Aè', format: 'lvgl', symbol: 'my_font' });
    expect(c.output).toContain('const lv_font_t my_font = {');
    expect(c.output).toContain('U+00E8 "è"');
    expect(c.missing).toBe('');

    const bin = await convertFont({ data: FONT_DATA_URL, size: 20, characters: 'Aè', format: 'bin', symbol: 'my_font' });
    expect(bin.output).toBeInstanceOf(Uint8Array);
    // Binary fonts start with the size of the header table and "head"
    expect(new TextDecoder().decode(bin.output.subarray(4, 8))).toBe('head');
  });

  it('reports the characters missing from the font', async () => {
    const result = await convertFont({ data: FONT_DATA_URL, size: 14, characters: 'aΩ▶b', format: 'lvgl', symbol: 'f' });
    expect(result.missing).toBe('Ω▶');
  });

  it('rejects invalid requests', async () => {
    const base = { data: FONT_DATA_URL, size: 14, characters: 'a', format: 'lvgl', symbol: 'f' };
    await expect(convertFont({ ...base, size: 1000 })).rejects.toThrow(/size/);
    await expect(convertFont({ ...base, format: 'dump' })).rejects.toThrow(/format/);
    await expect(convertFont({ ...base, symbol: 'x; evil()' })).rejects.toThrow(/name/);
    await expect(convertFont({ ...base, data: 'data:font/ttf;base64,AAAA' })).rejects.toThrow(/font/);
    await expect(convertFont({ ...base, characters: 'Ω' })).rejects.toThrow(/none of the characters/);
  });
});

describe('embedCFont', () => {
  it('keeps the LVGL 9 code only, without includes, and prefixes the static tables', async () => {
    const { output } = await convertFont({ data: FONT_DATA_URL, size: 16, characters: BASE_CHARACTERS + 'é', format: 'lvgl', symbol: 'font_x_16' });
    const code = embedCFont(output, 'font_x_16');
    expect(code).not.toMatch(/#include|LVGL_VERSION_MAJOR|LV_VERSION_CHECK|#if FONT_X_16/);
    expect(code).toContain('const lv_font_t font_x_16 = {');
    expect(code).toContain('static const lv_font_fmt_txt_dsc_t font_x_16_font_dsc = {');
    // Designated initializers keep the field names
    expect(code).toContain('.glyph_bitmap = font_x_16_glyph_bitmap,');
    expect(code).toContain('.dsc = &font_x_16_font_dsc,');
    const statics = [...code.matchAll(/^static\b.*?\b(\w+)\s*(?:\[\])?\s*=/gm)].map((match) => match[1]);
    expect(statics.length).toBeGreaterThan(3);
    expect(statics.every((name) => name.startsWith('font_x_16_'))).toBe(true);
  });
});

describe('widgetCharacters', () => {
  it('collects the characters of the text props and of the binding format', () => {
    const widget = { props: { text: 'Città\nè', x: 10, color: '#fff' }, binding: { variableId: 'v', format: '%d °C' } };
    const chars = widgetCharacters(widget);
    expect(chars).toContain('à');
    expect(chars).toContain('°');
    expect(chars).not.toContain('\n');
    expect(new Set(chars).size).toBe(chars.length);
  });
});

describe('generated code', () => {
  it('lists one conversion per font and size, with the characters of the widgets using it', () => {
    const { fontRequests } = buildProjectCode(
      project([
        label('a', { text: 'Città', font: FONT_NAME, fontSize: 20 }),
        label('b', { text: 'Perché', font: FONT_NAME, fontSize: 20 }),
        { ...label('c', { text: 'x', font: FONT_NAME, fontSize: '' }), customStyles: { text_font_size: 30 } },
        label('d', { text: 'Ω', fontSize: 20 }),
      ], [{ id: 'f1', name: FONT_NAME, data: FONT_DATA_URL, characters: '°' }]),
      'c'
    );
    expect(fontRequests.map(({ symbol, size }) => [symbol, size])).toEqual([
      ['font_dejavusans_latin1_20', 20],
      // Without a size the custom font is used at the default size
      ['font_dejavusans_latin1_14', 14],
      ['font_dejavusans_latin1_30', 30],
    ]);
    const [first] = fontRequests;
    expect(first.data).toBe(FONT_DATA_URL);
    for (const char of ['à', 'é', '°', 'A', '~']) expect(first.characters).toContain(char);
    // Label d does not use the custom font
    expect(first.characters).not.toContain('Ω');
  });

  it('uses the converted fonts in C', async () => {
    stubElectron();
    const code = await generateCCode(project([label('title', { text: 'Città', font: FONT_NAME, fontSize: 20 })]), 'unix');
    expect(code).toContain('/* Font "DejaVuSans-Latin1.ttf" 20 px, converted with lv_font_conv */');
    expect(code).toContain('const lv_font_t font_dejavusans_latin1_20 = {');
    expect(code).toContain('lv_obj_set_style_text_font(ui_title, &font_dejavusans_latin1_20, LV_PART_MAIN);');
    expect(code).not.toContain('lv_font_montserrat_20');
  });

  it('loads the converted fonts at run time in MicroPython, with Montserrat as fallback', async () => {
    stubElectron();
    const code = await generateMicroPythonCode(project([label('title', { text: 'Città', font: FONT_NAME, fontSize: 20 })]), 'unix');
    expect(code).toContain('import binascii');
    expect(code).toMatch(/if hasattr\(lv, "binfont_create_from_buffer"\):\n {4}font_dejavusans_latin1_20_data = binascii\.a2b_base64\("[A-Za-z0-9+/=]+"\)\n/);
    expect(code).toContain('    font_dejavusans_latin1_20 = lv.binfont_create_from_buffer(font_dejavusans_latin1_20_data, len(font_dejavusans_latin1_20_data))');
    expect(code).toContain('else:\n    font_dejavusans_latin1_20 = lv.font_montserrat_16');
    expect(code).toContain('title.set_style_text_font(font_dejavusans_latin1_20, lv.PART.MAIN)');
  });

  it('falls back to Montserrat when a font cannot be converted', async () => {
    stubElectron(false);
    const widgets = [label('title', { text: 'Hi', font: FONT_NAME, fontSize: 20 })];
    const c = await generateCCode(project(widgets), 'unix');
    expect(c).toContain('/* Font "DejaVuSans-Latin1.ttf" 20 px not converted (fonts are converted by the desktop app): Montserrat is used instead */');
    expect(c).toContain('lv_obj_set_style_text_font(ui_title, &lv_font_montserrat_20, LV_PART_MAIN);');

    stubElectron();
    const broken = project(widgets, [{ id: 'f1', name: FONT_NAME, data: 'data:font/ttf;base64,AAAA' }]);
    const py = await generateMicroPythonCode(broken, 'unix');
    expect(py).toMatch(/# Font "DejaVuSans-Latin1\.ttf" 20 px not converted \(Not a TrueType, OpenType or WOFF font: .*\): Montserrat is used instead/);
    expect(py).toContain('title.set_style_text_font(lv.font_montserrat_16, lv.PART.MAIN)');
    expect(py).not.toContain('binfont');
  });

  it('notes the characters missing from a font', async () => {
    stubElectron();
    const code = await generateCCode(project([label('title', { text: 'Play ▶', font: FONT_NAME, fontSize: 20 })]), 'unix');
    expect(code).toContain('/* Font "DejaVuSans-Latin1.ttf" 20 px has no glyph for: U+25B6 */');
  });

  it('ignores fonts that are not in the Asset Manager', async () => {
    stubElectron();
    const code = await generateCCode(project([label('title', { text: 'Hi', font: 'missing.ttf', fontSize: 20 })]), 'unix');
    expect(code).toContain('lv_obj_set_style_text_font(ui_title, &lv_font_montserrat_20, LV_PART_MAIN);');
    expect(code).not.toContain('missing.ttf');
  });
});
