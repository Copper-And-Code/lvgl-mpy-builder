// Identifier allocation shared by the C and MicroPython generators.
//
// Every name the generated code declares (functions, widget handles,
// temporaries, callbacks) is allocated here, so names are valid in both
// languages, never collide with keywords, builtins, LVGL symbols or the names
// used by the templates, and are unique across the whole project.

const C_KEYWORDS = [
  'auto', 'bool', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double',
  'else', 'enum', 'extern', 'false', 'float', 'for', 'goto', 'if', 'inline', 'int', 'long',
  'register', 'restrict', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch',
  'true', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while', 'null', 'main',
];

const PYTHON_KEYWORDS = [
  'and', 'as', 'assert', 'async', 'await', 'break', 'case', 'class', 'continue', 'def', 'del',
  'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'match', 'none', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'true', 'false',
  'try', 'type', 'while', 'with', 'yield',
];

const PYTHON_BUILTINS = [
  'abs', 'all', 'any', 'bool', 'bytearray', 'bytes', 'callable', 'chr', 'dict', 'dir', 'divmod',
  'enumerate', 'eval', 'exec', 'filter', 'float', 'format', 'getattr', 'globals', 'hasattr',
  'hash', 'help', 'hex', 'id', 'input', 'int', 'isinstance', 'iter', 'len', 'list', 'locals',
  'map', 'max', 'memoryview', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 'print',
  'property', 'range', 'repr', 'reversed', 'round', 'set', 'setattr', 'slice', 'sorted', 'str',
  'sum', 'super', 'tuple', 'vars', 'zip', 'const', 'micropython', 'machine', 'time', 'sys', 'gc',
];

// Names used by the code templates (parameters, globals, module names)
const TEMPLATE_NAMES = [
  'lv', 'lvgl', 'e', 'code', 'obj', 'parent', 'screen', 'screens', 'current_screen',
  'objects', 'page_index', 'i', 'display_driver',
];

export const RESERVED_NAMES = new Set([
  ...C_KEYWORDS,
  ...PYTHON_KEYWORDS,
  ...PYTHON_BUILTINS,
  ...TEMPLATE_NAMES,
]);

const MAX_IDENTIFIER_LENGTH = 48;

/**
 * Turn arbitrary text into a lowercase identifier valid in C and Python.
 * Does not check for collisions: use IdentifierAllocator for that.
 */
export function sanitizeIdentifier(text, fallback = 'obj') {
  let name = String(text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, MAX_IDENTIFIER_LENGTH)
    .replace(/_+$/g, '');

  if (!name) name = fallback;
  // Must not start with a digit, and must not look like an LVGL symbol
  if (/^[0-9]/.test(name) || /^lv(_|$)/.test(name)) name = `${fallback}_${name}`;
  if (RESERVED_NAMES.has(name)) name = `${name}_${fallback}`;
  return name;
}

export class IdentifierAllocator {
  constructor(reserved = []) {
    this.used = new Set([...RESERVED_NAMES, ...reserved]);
  }

  isUsed(name) {
    return this.used.has(name);
  }

  /** Mark names as taken (for example the C global that wraps an identifier). */
  reserve(...names) {
    names.forEach((name) => this.used.add(name));
  }

  /**
   * Allocate a unique identifier derived from `text`.
   * @param {string} text - user provided name
   * @param {string} fallback - used when `text` has no usable characters
   * @param {(name: string) => string[]} [alsoReserve] - extra names that must
   *   be free too and are reserved together with the identifier
   */
  allocate(text, fallback = 'obj', alsoReserve = () => []) {
    const base = sanitizeIdentifier(text, fallback);
    let candidate = base;
    for (let n = 2; this.isTaken(candidate, alsoReserve); n++) {
      candidate = `${base}_${n}`;
    }
    this.reserve(candidate, ...alsoReserve(candidate));
    return candidate;
  }

  isTaken(name, alsoReserve) {
    return this.used.has(name) || alsoReserve(name).some((extra) => this.used.has(extra));
  }
}
