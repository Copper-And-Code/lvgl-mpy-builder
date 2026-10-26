// Typed values used by the widget operations. Every value coming from the
// project file is validated here, so nothing typed by the user can end up in
// the generated code unescaped.

export function toInt(value, fallback = 0) {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? Math.round(number) : fallback;
}

/** Parse '#RGB' or '#RRGGBB' (with or without '#'); returns null if invalid. */
export function parseColor(value) {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value ?? '').trim());
  if (!match) return null;
  let hex = match[1];
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return parseInt(hex, 16);
}

// Montserrat sizes built into LVGL (must be enabled in lv_conf.h)
export const C_FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48];
// Montserrat sizes compiled into the default lv_micropython firmware
export const MICROPYTHON_FONT_SIZES = [14, 16, 24];

export function nearestFontSize(size, available) {
  const wanted = toInt(size, 14);
  return available.reduce((best, current) =>
    Math.abs(current - wanted) < Math.abs(best - wanted) ? current : best
  );
}

const ANIM_PATHS = ['linear', 'ease_in', 'ease_out', 'ease_in_out', 'overshoot', 'bounce', 'step'];

// Value constructors
export const v = {
  int: (value, fallback = 0) => ({ k: 'int', value: toInt(value, fallback) }),
  str: (value) => ({ k: 'str', value: String(value ?? '') }),
  bool: (value) => ({ k: 'bool', value: Boolean(value) }),
  /** Returns null for invalid colors: callers skip the call. */
  color: (value) => {
    const color = parseColor(value);
    return color === null ? null : { k: 'color', value: color };
  },
  /** LVGL enum constant, e.g. enumValue('LABEL_LONG_MODE', 'DOTS') -> LV_LABEL_LONG_MODE_DOTS */
  enum: (enumName, member) => ({ k: 'enum', enumName, member }),
  /** Style selector: part plus optional state, e.g. sel('INDICATOR', 'CHECKED') */
  sel: (part = 'MAIN', state = null) => ({ k: 'sel', part, state }),
  /** Font size; the emitter maps it to an available Montserrat font */
  font: (size) => ({ k: 'font', size: toInt(size, 14) }),
  /** Reference to an identifier declared by the generated code */
  ref: (name) => ({ k: 'ref', name }),
  null: () => ({ k: 'null' }),
  /** Percentage size: lv_pct(n) */
  pct: (value) => ({ k: 'pct', value: toInt(value, 100) }),
  /** Integer constant of the LVGL module, e.g. constant('SIZE_CONTENT') -> LV_SIZE_CONTENT */
  constant: (name) => ({ k: 'constant', name }),
  /** lv_anim_enable_t: LV_ANIM_ON/OFF in C, True/False in MicroPython */
  animEnable: (on) => ({ k: 'animEnable', value: Boolean(on) }),
  /** Built-in animation path, e.g. 'lv_anim_path_ease_in' */
  animPath: (path) => {
    const name = String(path ?? '').replace(/^lv_anim_path_/, '');
    return { k: 'animPath', name: ANIM_PATHS.includes(name) ? name : 'linear' };
  },
  /**
   * Image source: an image embedded in the code (`symbol` of its
   * lv_image_dsc_t) or, without symbol, a path read through an LVGL file system driver
   */
  image: (source, symbol = null) => ({ k: 'image', source: String(source ?? ''), symbol }),
};

/**
 * Map a property value such as 'LV_FLEX_FLOW_ROW' or 'ROW' onto a member of
 * an enum, accepting only the listed members. Returns null for anything else.
 */
export function enumMember(value, enumName, members) {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  const member = raw.startsWith(`LV_${enumName}_`) ? raw.slice(`LV_${enumName}_`.length) : raw.toUpperCase();
  return members.includes(member) ? member : null;
}
