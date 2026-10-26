// Custom fonts of the Asset Manager in the generated code.
//
// Code generation runs in two passes: the first one collects the fonts used by
// the widgets (font asset, size, characters), which the main process converts
// with lv_font_conv (src/main/fontConverter.js); the second one uses them.
// Fonts that could not be converted fall back to Montserrat.

import { commentText } from './emit';

// Printable ASCII: always included, so digits and punctuation of values set
// at run time (bound labels, application code) are available
export const BASE_CHARACTERS = Array.from({ length: 0x7f - 0x20 }, (_, i) => String.fromCharCode(0x20 + i)).join('');

export const MIN_FONT_SIZE = 4;
export const MAX_FONT_SIZE = 200;

/** Characters of the text props of a widget, which its font must contain. */
export function widgetCharacters(widget) {
  const texts = Object.values(widget.props ?? {}).filter((value) => typeof value === 'string');
  if (widget.binding?.format) texts.push(widget.binding.format);
  return [...new Set(texts.join('').replace(/[\n\r\t]/g, ''))].join('');
}

// Conditions of lv_font_conv's output for older LVGL versions, as LVGL 9 evaluates them
const LVGL9_CONDITIONS = {
  'LVGL_VERSION_MAJOR == 8': false,
  'LVGL_VERSION_MAJOR >= 8': true,
  '!(LVGL_VERSION_MAJOR == 6 && LVGL_VERSION_MINOR == 0)': true,
  'LV_VERSION_CHECK(7, 4, 0) || LVGL_VERSION_MAJOR >= 8': true,
  'LV_VERSION_CHECK(8, 2, 0) || LVGL_VERSION_MAJOR >= 9': true,
};

/** Keep only the LVGL 9 branch of the version conditionals; other #if blocks stay. */
function resolveVersionConditionals(code) {
  const stack = []; // per open #if: { known, active } (unknown ones are kept as is)
  const output = [];
  const emitting = () => stack.every((entry) => !entry.known || entry.active);
  code.split('\n').forEach((line) => {
    const directive = /^\s*#\s*(if|ifdef|ifndef|else|endif)\b\s*(.*?)\s*$/.exec(line);
    const keyword = directive?.[1];
    if (keyword === 'if' || keyword === 'ifdef' || keyword === 'ifndef') {
      const condition = keyword === 'if' ? directive[2] : null;
      const known = condition !== null && condition in LVGL9_CONDITIONS;
      if (!known && emitting()) output.push(line);
      stack.push({ known, active: known && LVGL9_CONDITIONS[condition] });
    } else if (keyword === 'else' && stack.length) {
      const entry = stack[stack.length - 1];
      if (entry.known) entry.active = !entry.active;
      else if (emitting()) output.push(line);
    } else if (keyword === 'endif' && stack.length) {
      const entry = stack.pop();
      if (!entry.known && emitting()) output.push(line);
    } else if (emitting()) {
      output.push(line);
    }
  });
  return output.join('\n');
}

/**
 * C source of a font converted by lv_font_conv, ready to be pasted in the
 * generated file: without its #include lines, #if guard and code for older
 * LVGL versions, and with the names of its static tables prefixed by the font
 * name, so that several fonts can live in the same file.
 */
export function embedCFont(source, symbol) {
  let code = String(source)
    .replace(/^\/\*{5,}[\s\S]*?\*{5,}\/\s*/, '')
    .replace(/#ifdef LV_LVGL_H_INCLUDE_SIMPLE[\s\S]*?#endif\s*/, '')
    .replace(/#ifndef (\w+)\s+#define \1 1\s+#endif\s+#if \1\s*/, '')
    .replace(/\s*#endif \/\*#if \w+\*\/\s*$/, '');
  code = resolveVersionConditionals(code)
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const statics = new Set(
    [...code.matchAll(/^static\b[^=;[]*?\b([A-Za-z_]\w*)\s*(?:\[[^\]]*\])?\s*[=;]/gm)].map((match) => match[1])
  );
  statics.forEach((name) => {
    // Not after `.` (designated initializers use the same names)
    code = code.replace(new RegExp(`(?<![.\\w])${name}\\b`, 'g'), `${symbol}_${name}`);
  });
  return code;
}

/** Message of an error, without the prefix added by Electron's IPC. */
function errorMessage(error) {
  return String(error?.message ?? error).replace(/^Error invoking remote method '[^']*': (?:Error: )?/, '');
}

function fontConverter() {
  return typeof window !== 'undefined' ? window.electronAPI?.convertFont : undefined;
}

/**
 * Convert the fonts requested by the first pass.
 * @param {object[]} requests - `fontRequests` of buildProjectCode()
 * @param {'c'|'micropython'} language
 * @returns {Promise<Map<string, { output?: string|Uint8Array, missing?: string, error?: string }>>} by request key
 */
export async function convertFonts(requests, language) {
  const convert = fontConverter();
  const results = new Map();
  await Promise.all(
    requests.map(async ({ key, data, size, characters, symbol }) => {
      if (!convert) {
        results.set(key, { error: 'fonts are converted by the desktop app' });
        return;
      }
      try {
        results.set(key, await convert({ data, size, characters, symbol, format: language === 'c' ? 'lvgl' : 'bin' }));
      } catch (error) {
        results.set(key, { error: errorMessage(error) });
      }
    })
  );
  return results;
}

/** Notes about fonts that were not converted or miss some characters. */
export function fontNotes(fonts, open, close) {
  return fonts.flatMap(({ name, size, result }) => {
    const label = `Font "${commentText(name)}" ${size} px`;
    if (result?.error) return [`${open} ${label} not converted (${commentText(result.error)}): Montserrat is used instead${close}`];
    if (result?.missing) {
      const missing = [...result.missing].map((char) => `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
      return [`${open} ${label} has no glyph for: ${missing.join(' ')}${close}`];
    }
    return [];
  });
}
