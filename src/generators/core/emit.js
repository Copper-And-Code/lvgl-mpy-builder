// Emitters: turn the language-neutral widget operations into C or MicroPython.
//
// Calls are described with their C function name (e.g. 'lv_slider_set_range').
// The MicroPython binding exposes the same function as a method of the class
// that owns it (slider.set_range), so one description serves both languages.

import { C_FONT_SIZES, MICROPYTHON_FONT_SIZES, nearestFontSize } from './values';

// LVGL widget classes, i.e. the lv.<class> types of the MicroPython binding
export const LVGL_CLASSES = [
  'animimg', 'arc', 'bar', 'button', 'buttonmatrix', 'calendar', 'canvas', 'chart', 'checkbox',
  'dropdown', 'image', 'imagebutton', 'keyboard', 'label', 'led', 'line', 'list', 'menu',
  'menu_cont', 'menu_page', 'menu_section', 'menu_separator', 'msgbox', 'obj', 'roller', 'scale',
  'slider', 'spangroup', 'spinbox', 'spinner', 'switch', 'table', 'tabview', 'textarea',
  'tileview', 'win',
];

// Structs whose functions become methods too (lv.anim_t.set_duration, ...)
const STRUCT_OWNERS = ['anim', 'style', 'span', 'event', 'subject'];

const byLengthDesc = (a, b) => b.length - a.length;
const FUNCTION_OWNERS = [...LVGL_CLASSES, ...STRUCT_OWNERS].sort(byLengthDesc);
const ENUM_OWNERS = [...LVGL_CLASSES].sort(byLengthDesc);

/** 'lv_slider_set_range' -> { owner: 'slider', method: 'set_range' } */
export function functionOwner(fn) {
  const owner = FUNCTION_OWNERS.find((name) => fn.startsWith(`lv_${name}_`));
  if (!owner) throw new Error(`No MicroPython owner class for ${fn}`);
  const method = fn.slice(`lv_${owner}_`.length);
  return { owner, method: method === 'del' ? 'delete' : method };
}

/**
 * Python path of an LVGL enum constant. Enums named after a widget class are
 * attached to that class by the binding (LV_LABEL_LONG_MODE_DOTS ->
 * lv.label.LONG_MODE.DOTS); the others live in the module (lv.PART.MAIN).
 */
export function pythonEnumPath(enumName, member) {
  const lower = enumName.toLowerCase();
  const owner = ENUM_OWNERS.find((name) => lower.startsWith(`${name}_`));
  const pyMember = /^[0-9]/.test(member) ? `_${member}` : member;
  return owner
    ? `lv.${owner}.${enumName.slice(owner.length + 1)}.${pyMember}`
    : `lv.${enumName}.${pyMember}`;
}

// ---------------------------------------------------------------------------
// String literals

function octal(char) {
  return '\\' + char.charCodeAt(0).toString(8).padStart(3, '0');
}

export function cString(text) {
  const escaped = String(text)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, octal)
    .replace(/\?\?/g, '?\\?'); // no trigraphs
  return `"${escaped}"`;
}

export function pyString(text) {
  const escaped = String(text)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, (c) => '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0'));
  return `"${escaped}"`;
}

/** Single-line comment text that cannot terminate the comment early. */
export function commentText(text) {
  return String(text ?? '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\*\//g, '* /')
    .replace(/"""/g, '"​""')
    .trim();
}

const hex6 = (color) => '0x' + color.toString(16).toUpperCase().padStart(6, '0');

// ---------------------------------------------------------------------------

class BaseEmitter {
  constructor(context) {
    // context.isWidget(name): identifier is a widget handle
    // context.fonts / context.images: collected declarations
    this.context = context;
  }

  args(values) {
    return values.map((value) => this.value(value)).join(', ');
  }

  emit(ops, indent = '    ') {
    return ops.flatMap((op) => this.op(op)).map((line) => (line ? indent + line : '')).join('\n');
  }
}

export class CEmitter extends BaseEmitter {
  name(identifier) {
    return this.context.isWidget(identifier) ? `ui_${identifier}` : identifier;
  }

  value(value) {
    switch (value.k) {
      case 'int': return String(value.value);
      case 'str': return cString(value.value);
      case 'bool': return value.value ? 'true' : 'false';
      case 'color': return `lv_color_hex(${hex6(value.value)})`;
      case 'enum': return `LV_${value.enumName}_${value.member}`;
      case 'sel': return [`LV_PART_${value.part}`, value.state && `LV_STATE_${value.state}`].filter(Boolean).join(' | ');
      case 'font': {
        if (value.symbol) return `&${value.symbol}`;
        const size = nearestFontSize(value.size, C_FONT_SIZES);
        this.context.fonts.add(size);
        return `&lv_font_montserrat_${size}`;
      }
      case 'ref': return value.struct ? `&${this.name(value.name)}` : this.name(value.name);
      case 'fn': return value.name;
      case 'null': return 'NULL';
      case 'pct': return `lv_pct(${value.value})`;
      case 'constant': return `LV_${value.name}`;
      case 'animEnable': return value.value ? 'LV_ANIM_ON' : 'LV_ANIM_OFF';
      case 'animPath': return `lv_anim_path_${value.name}`;
      case 'image': return value.symbol ? `&${value.symbol}` : cString(value.source);
      case 'point': return `{${value.x}, ${value.y}}`;
      default: throw new Error(`Unknown value kind ${value.k}`);
    }
  }

  op(op) {
    switch (op.op) {
      case 'blank': return [''];
      case 'comment': return [`/* ${commentText(op.text)} */`];
      case 'create': return [`${this.name(op.name)} = lv_${op.cls}_create(${this.value(op.parent)});`];
      case 'construct': return [`lv_obj_t * ${this.name(op.name)} = ${op.fn}(${this.args(op.args)});`];
      case 'call': {
        const call = `${op.fn}(${this.args([op.target, ...op.args])});`;
        return [op.assign ? `${op.assign.ctype} ${this.name(op.assign.name)} = ${call}` : call];
      }
      case 'struct': return [`${op.ctype} ${op.name};`];
      case 'array': return [`static ${op.ctype} ${op.name}[] = {${this.args(op.items)}};`];
      case 'animExec': {
        const setter = {
          opa: () => this.context.opaHelper(),
          rotation: () => '(lv_anim_exec_xcb_t)lv_arc_set_rotation',
        }[op.prop]?.() ?? `(lv_anim_exec_xcb_t)lv_obj_set_${op.prop}`;
        return [`lv_anim_set_exec_cb(&${op.anim}, ${setter});`];
      }
      default: throw new Error(`Unknown operation ${op.op}`);
    }
  }
}

export class PythonEmitter extends BaseEmitter {
  value(value) {
    switch (value.k) {
      case 'int': return String(value.value);
      case 'str': return pyString(value.value);
      case 'bool': return value.value ? 'True' : 'False';
      case 'color': return `lv.color_hex(${hex6(value.value)})`;
      case 'enum': return pythonEnumPath(value.enumName, value.member);
      case 'sel': return [`lv.PART.${value.part}`, value.state && `lv.STATE.${value.state}`].filter(Boolean).join(' | ');
      case 'font': {
        if (value.symbol) return value.symbol;
        const size = nearestFontSize(value.size, MICROPYTHON_FONT_SIZES);
        this.context.fonts.add(size);
        return `lv.font_montserrat_${size}`;
      }
      case 'ref': return value.name;
      case 'fn': return value.name;
      case 'null': return 'None';
      case 'pct': return `lv.pct(${value.value})`;
      case 'constant': return `lv.${value.name}`;
      case 'animEnable': return value.value ? 'True' : 'False';
      case 'animPath': return `lv.anim_t.path_${value.name}`;
      case 'image': return value.symbol ?? pyString(value.source);
      case 'point': return `{"x": ${value.x}, "y": ${value.y}}`;
      default: throw new Error(`Unknown value kind ${value.k}`);
    }
  }

  op(op) {
    switch (op.op) {
      case 'blank': return [''];
      case 'comment': return [`# ${commentText(op.text)}`];
      case 'create': return [
        `${op.name} = lv.${op.cls}(${this.value(op.parent)})`,
        `objects[${pyString(op.name)}] = ${op.name}`,
      ];
      case 'construct': return [`${op.name} = lv.${op.cls}(${this.args(op.args)})`];
      case 'call': {
        const { method } = functionOwner(op.fn);
        const call = `${this.value(op.target)}.${method}(${this.args(op.args)})`;
        return [op.assign ? `${op.assign.name} = ${call}` : call];
      }
      case 'struct': return [`${op.name} = lv.${op.pyType}()`];
      case 'array': return [`${op.name} = [${this.args(op.items)}]`];
      case 'animExec': {
        const setter = {
          x: `${op.target.name}.set_x(value)`,
          y: `${op.target.name}.set_y(value)`,
          width: `${op.target.name}.set_width(value)`,
          height: `${op.target.name}.set_height(value)`,
          opa: `${op.target.name}.set_style_opa(value, lv.PART.MAIN)`,
          rotation: `${op.target.name}.set_rotation(value)`,
        }[op.prop];
        return [`${op.anim}.set_custom_exec_cb(lambda _anim, value: ${setter})`];
      }
      default: throw new Error(`Unknown operation ${op.op}`);
    }
  }
}
