// Converts the fonts of the Asset Manager (TTF, OTF, WOFF) to LVGL fonts with
// lv_font_conv, the converter LVGL uses for its own built-in fonts:
//   - 'lvgl': C source of an lv_font_t (C generator)
//   - 'bin':  LVGL binary font, loaded at run time with
//             lv_binfont_create_from_buffer() (MicroPython generator)
// It runs in the main process because lv_font_conv needs Node.

const crypto = require('node:crypto');
const path = require('node:path');
const convert = require('lv_font_conv/lib/convert');

// opentype.js is bundled inside lv_font_conv
const opentype = require(require.resolve('opentype.js', {
  paths: [path.dirname(require.resolve('lv_font_conv/package.json'))],
}));

const FORMATS = ['lvgl', 'bin'];
const MIN_SIZE = 4;
const MAX_SIZE = 200;
const MAX_FONT_BYTES = 16 * 1024 * 1024;
const MAX_CHARACTERS = 4096;

/** Bytes of a base64 data URL (or a plain base64 string). */
function decodeFontData(data) {
  if (typeof data !== 'string') throw new Error('Font data must be a base64 data URL');
  const base64 = data.startsWith('data:') ? data.slice(data.indexOf(',') + 1) : data;
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length === 0) throw new Error('The font file is empty');
  if (bytes.length > MAX_FONT_BYTES) throw new Error('The font file is too large');
  return bytes;
}

/**
 * Convert one font at one size.
 * @param {object} request
 * @param {string} request.data - font file as a data URL
 * @param {number} request.size - height in pixels
 * @param {string} request.characters - characters to include
 * @param {'lvgl'|'bin'} request.format
 * @param {string} request.symbol - C name of the font (format 'lvgl')
 * @returns {Promise<{ output: string|Uint8Array, missing: string }>} the C
 *   source (lvgl) or the font bytes (bin), and the requested characters that
 *   the font does not have
 */
async function convertFont({ data, size, characters, format, symbol }) {
  if (!FORMATS.includes(format)) throw new Error(`Unknown font format: ${format}`);
  if (!Number.isInteger(size) || size < MIN_SIZE || size > MAX_SIZE) {
    throw new Error(`Font size must be an integer between ${MIN_SIZE} and ${MAX_SIZE}`);
  }
  if (typeof symbol !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(symbol)) throw new Error('Invalid font name');
  const bytes = decodeFontData(data);

  let font;
  try {
    font = opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  } catch (error) {
    throw new Error(`Not a TrueType, OpenType or WOFF font: ${error.message}`, { cause: error });
  }

  // lv_font_conv rejects characters missing from the font: keep only the
  // ones it has, once each
  const requested = [...new Set(String(characters ?? ''))].slice(0, MAX_CHARACTERS);
  const available = requested.filter((char) => font.charToGlyphIndex(char) > 0);
  if (available.length === 0) throw new Error('The font has none of the characters used by the project');

  const files = await convert({
    font: [{ source_path: 'font', source_bin: bytes, ranges: [{ symbols: available.join('') }] }],
    size,
    bpp: 4,
    format,
    output: symbol,
    lv_font_name: symbol,
    opts_string: `--size ${size} --bpp 4 --no-compress`,
    // Compressed binary fonts crash LVGL 9.3 (lv_micropython) when drawn
    no_compress: true,
    lcd: false,
    lcd_v: false,
    use_color_info: false,
  });
  const output = files[symbol];
  return {
    output: format === 'lvgl' ? String(output) : new Uint8Array(output),
    missing: requested.filter((char) => !available.includes(char)).join(''),
  };
}

// lv_font_conv's FreeType state is global: one conversion at a time
let queue = Promise.resolve();

function queuedConvertFont(request) {
  const result = queue.then(() => convertFont(request));
  queue = result.catch(() => {});
  return result;
}

// The code preview regenerates the code often: keep the recent conversions
const MAX_CACHE = 32;
const cache = new Map(); // key -> Promise of the result

function cachedConvertFont(request) {
  const key = crypto
    .createHash('sha256')
    .update(JSON.stringify([request.format, request.size, request.symbol, request.characters]))
    .update(String(request.data))
    .digest('hex');
  let result = cache.get(key);
  if (!result) {
    result = queuedConvertFont(request);
    result.catch(() => cache.delete(key));
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
    cache.set(key, result);
  }
  return result;
}

module.exports = { convertFont: queuedConvertFont, cachedConvertFont };
