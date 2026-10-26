// Language-neutral description of how each editor widget is built with LVGL.
//
// Each builder receives the widget, its identifier and a context, and records
// operations (create, call, ...) that the C and MicroPython emitters print.
// Only non-deprecated LVGL functions valid in both 9.3 (MicroPython binding)
// and 9.6 (C) may be used: tests check every name against the API fixtures.

import { enumMember, toInt, v } from './values';

const ANIM_PROPS = { move_x: 'x', move_y: 'y', width: 'width', height: 'height', fade_in: 'opa', fade_out: 'opa' };

class Ops {
  constructor(context, name) {
    this.context = context;
    this.name = name;
    this.self = v.ref(name);
    this.ops = [];
    this.language = context.language;
  }

  get isC() {
    return this.language === 'c';
  }

  push(op) {
    this.ops.push(op);
    return this;
  }

  comment(text) {
    return this.push({ op: 'comment', text });
  }

  create(cls, parent) {
    return this.push({ op: 'create', name: this.name, cls, parent });
  }

  /** Call `fn` on `target`; skipped when an argument is null (e.g. invalid color). */
  on(target, fn, ...args) {
    if (args.some((arg) => arg === null || arg === undefined)) return this;
    return this.push({ op: 'call', fn, target, args });
  }

  /** Call `fn` on this widget. */
  set(fn, ...args) {
    return this.on(this.self, fn, ...args);
  }

  /** `ctype name = fn(target, args)`; returns the new identifier. */
  assign(base, ctype, fn, target, ...args) {
    const name = this.context.temp(base);
    this.push({ op: 'call', fn, target, args, assign: { name, ctype } });
    return name;
  }

  /** Objects created by a function other than lv_<cls>_create (lv.<cls>(args) in Python). */
  construct(base, fn, cls, ...args) {
    const name = this.context.temp(base);
    this.push({ op: 'construct', name, fn, cls, args });
    return name;
  }

  array(base, ctype, items) {
    const name = this.context.temp(base);
    this.push({ op: 'array', name, ctype, items });
    return name;
  }

  style(prop, value, selector = v.sel()) {
    return this.set(`lv_obj_set_style_${prop}`, value, selector);
  }

  font(size, target = this.self) {
    if (size === undefined || size === null || size === '') return this;
    return this.on(target, 'lv_obj_set_style_text_font', v.font(size), v.sel());
  }

  pos(props) {
    return this.set('lv_obj_set_pos', v.int(props.x), v.int(props.y));
  }

  size(props) {
    return this.set('lv_obj_set_size', v.int(props.width, 100), v.int(props.height, 100));
  }
}

const lines = (text) =>
  String(text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

const csv = (text) => String(text ?? '').split(',').map((item) => item.trim());

const has = (value) => value !== undefined && value !== null && value !== '';

/** Integers of a comma separated list, skipping invalid entries. */
const intList = (text) =>
  csv(text)
    .filter((item) => item !== '' && Number.isFinite(Number(item)))
    .map((item) => Math.round(Number(item)));

// Child label used by buttons and image buttons
function addButtonLabel(b, props) {
  if (!props.text) return;
  const label = b.construct(`${b.name}_label`, 'lv_label_create', 'label', b.self);
  const labelRef = v.ref(label);
  b.on(labelRef, 'lv_label_set_text', v.str(props.text));
  b.on(labelRef, 'lv_obj_center');
  b.on(labelRef, 'lv_obj_set_style_text_color', v.color(props.textColor), v.sel());
  b.font(props.fontSize, labelRef);
}

// Container laid out as a flex column (replacement for the deprecated widgets)
function flexColumn(b, p) {
  b.create('obj', b.parent).pos(p).size(p);
  b.set('lv_obj_set_flex_flow', v.enum('FLEX_FLOW', 'COLUMN'));
}

// Full-width button with a label, as lv_list_add_button() used to create
function itemButton(b, base, text, p) {
  const button = b.construct(base, 'lv_button_create', 'button', b.self);
  b.on(v.ref(button), 'lv_obj_set_width', v.pct(100));
  const label = b.construct(`${base}_label`, 'lv_label_create', 'label', v.ref(button));
  b.on(v.ref(label), 'lv_label_set_text', v.str(text));
  b.on(v.ref(label), 'lv_obj_set_style_text_color', v.color(p.textColor), v.sel());
  b.font(p.fontSize, v.ref(label));
}

/** Animation of one property of this widget (see ANIM_PROPS for `prop`). */
function animate(b, { prop, start, end, duration, delay = 0, repeat = null, reverse = false, path = 'linear' }) {
  const anim = b.context.temp(`${b.name}_anim`);
  const target = v.ref(anim);
  target.struct = true;
  b.push({ op: 'struct', name: anim, ctype: 'lv_anim_t', pyType: 'anim_t' });
  b.on(target, 'lv_anim_init');
  b.on(target, 'lv_anim_set_var', b.self);
  b.on(target, 'lv_anim_set_values', v.int(start), v.int(end));
  b.on(target, 'lv_anim_set_duration', v.int(duration, 1000));
  if (toInt(delay) > 0) b.on(target, 'lv_anim_set_delay', v.int(delay));
  if (repeat) b.on(target, 'lv_anim_set_repeat_count', repeat);
  if (reverse) b.on(target, 'lv_anim_set_reverse_duration', v.int(duration, 1000));
  b.on(target, 'lv_anim_set_path_cb', v.animPath(path));
  b.push({ op: 'animExec', anim, target: b.self, prop });
  b.on(target, 'lv_anim_start');
}

const LABEL_LONG_MODES = ['WRAP', 'DOTS', 'SCROLL', 'SCROLL_CIRCULAR', 'CLIP'];
const TEXT_ALIGNS = ['AUTO', 'LEFT', 'CENTER', 'RIGHT'];
const DIRS = ['NONE', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM', 'HOR', 'VER', 'ALL'];
const BAR_MODES = ['NORMAL', 'SYMMETRICAL', 'RANGE'];
const ARC_MODES = ['NORMAL', 'SYMMETRICAL', 'REVERSE'];
const FLEX_FLOWS = ['ROW', 'COLUMN', 'ROW_WRAP', 'ROW_REVERSE', 'ROW_WRAP_REVERSE', 'COLUMN_WRAP', 'COLUMN_REVERSE', 'COLUMN_WRAP_REVERSE'];
const FLEX_ALIGNS = ['START', 'END', 'CENTER', 'SPACE_EVENLY', 'SPACE_AROUND', 'SPACE_BETWEEN'];
const SCROLLBAR_MODES = ['OFF', 'ON', 'ACTIVE', 'AUTO'];

// Built-in symbols compiled into the Montserrat fonts are not needed here;
// widget builders keyed by editor widget type.
const builders = {
  button(b, p) {
    b.create('button', b.parent).pos(p).size(p);
    b.style('bg_color', v.color(p.bgColor));
    if (has(p.radius)) b.style('radius', v.int(p.radius));
    addButtonLabel(b, p);
  },

  label(b, p) {
    b.create('label', b.parent).pos(p).size(p);
    b.set('lv_label_set_text', v.str(p.text ?? 'Label'));
    b.style('text_color', v.color(p.textColor));
    b.font(p.fontSize);
    const longMode = enumMember(p.longMode, 'LABEL_LONG_MODE', LABEL_LONG_MODES);
    if (longMode && longMode !== 'WRAP') b.set('lv_label_set_long_mode', v.enum('LABEL_LONG_MODE', longMode));
    const align = enumMember(p.textAlign, 'TEXT_ALIGN', TEXT_ALIGNS);
    if (align) b.style('text_align', v.enum('TEXT_ALIGN', align));
    if (p.recolor) b.set('lv_label_set_recolor', v.bool(true));
  },

  slider(b, p) {
    b.create('slider', b.parent).pos(p).size(p);
    b.set('lv_slider_set_range', v.int(p.min, 0), v.int(p.max, 100));
    const mode = p.mode === 'range' || p.isRange ? 'RANGE' : p.mode === 'symmetrical' ? 'SYMMETRICAL' : null;
    if (mode) b.set('lv_slider_set_mode', v.enum('SLIDER_MODE', mode));
    b.set('lv_slider_set_value', v.int(p.value, 50), v.animEnable(false));
    if (mode === 'RANGE' && has(p.leftValue)) b.set('lv_slider_set_start_value', v.int(p.leftValue), v.animEnable(false));
    b.style('bg_color', v.color(p.bgColor));
    b.style('bg_color', v.color(p.indicatorColor), v.sel('INDICATOR'));
    b.style('bg_color', v.color(p.knobColor), v.sel('KNOB'));
  },

  switch(b, p) {
    b.create('switch', b.parent).pos(p).size(p);
    if (p.checked) b.set('lv_obj_add_state', v.enum('STATE', 'CHECKED'));
    b.style('bg_color', v.color(p.offColor));
    b.style('bg_color', v.color(p.onColor), v.sel('INDICATOR', 'CHECKED'));
    b.style('bg_color', v.color(p.knobColor), v.sel('KNOB'));
  },

  checkbox(b, p) {
    b.create('checkbox', b.parent).pos(p);
    b.set('lv_checkbox_set_text', v.str(p.text ?? 'Checkbox'));
    if (p.checked) b.set('lv_obj_add_state', v.enum('STATE', 'CHECKED'));
    b.style('text_color', v.color(p.textColor));
    b.font(p.fontSize);
    b.style('bg_color', v.color(p.checkedColor), v.sel('INDICATOR', 'CHECKED'));
  },

  textarea(b, p) {
    b.create('textarea', b.parent).pos(p).size(p);
    if (p.oneLine) b.set('lv_textarea_set_one_line', v.bool(true));
    if (p.password) b.set('lv_textarea_set_password_mode', v.bool(true));
    if (toInt(p.maxLength) > 0) b.set('lv_textarea_set_max_length', v.int(p.maxLength));
    if (p.acceptedChars) b.set('lv_textarea_set_accepted_chars', v.str(p.acceptedChars));
    if (p.text) b.set('lv_textarea_set_text', v.str(p.text));
    if (p.placeholder) b.set('lv_textarea_set_placeholder_text', v.str(p.placeholder));
    b.style('bg_color', v.color(p.bgColor));
    b.style('text_color', v.color(p.textColor));
    b.font(p.fontSize);
  },

  dropdown(b, p) {
    b.create('dropdown', b.parent).pos(p).size(p);
    if (p.options) b.set('lv_dropdown_set_options', v.str(lines(p.options).join('\n')));
    if (toInt(p.selected) > 0) b.set('lv_dropdown_set_selected', v.int(p.selected));
    const dir = enumMember(p.dir, 'DIR', DIRS);
    if (dir && dir !== 'BOTTOM') b.set('lv_dropdown_set_dir', v.enum('DIR', dir));
    b.style('bg_color', v.color(p.bgColor));
    b.style('text_color', v.color(p.textColor));
    b.font(p.fontSize);
  },

  roller(b, p) {
    b.create('roller', b.parent).pos(p).size(p);
    if (p.options) {
      b.set('lv_roller_set_options', v.str(lines(p.options).join('\n')), v.enum('ROLLER_MODE', p.infinite ? 'INFINITE' : 'NORMAL'));
    }
    if (toInt(p.selected) > 0) b.set('lv_roller_set_selected', v.int(p.selected), v.animEnable(false));
    if (toInt(p.visibleRows) > 0) b.set('lv_roller_set_visible_row_count', v.int(p.visibleRows));
    b.style('bg_color', v.color(p.bgColor));
    b.style('bg_color', v.color(p.selectedColor), v.sel('SELECTED'));
    b.style('text_color', v.color(p.textColor));
    b.font(p.fontSize);
  },

  spinbox(b, p) {
    b.create('spinbox', b.parent).pos(p).size(p);
    const digits = Math.min(Math.max(toInt(p.digitCount, 4), 1), 10);
    const separator = Math.min(Math.max(toInt(p.separatorPos, 0), 0), digits);
    b.set('lv_spinbox_set_digit_format', v.int(digits), v.int(separator));
    b.set('lv_spinbox_set_range', v.int(p.min, 0), v.int(p.max, 999));
    b.set('lv_spinbox_set_value', v.int(p.value, 0));
    if (toInt(p.step, 1) > 1) b.set('lv_spinbox_set_step', v.int(p.step));
    if (p.rollover) b.set('lv_spinbox_set_rollover', v.bool(true));
    b.style('bg_color', v.color(p.bgColor));
    b.style('text_color', v.color(p.textColor));
    b.font(p.fontSize);
  },

  keyboard(b, p) {
    b.create('keyboard', b.parent).pos(p).size(p);
    const mode = { text_lower: 'TEXT_LOWER', text_upper: 'TEXT_UPPER', text_special: 'SPECIAL', number: 'NUMBER' }[p.mode];
    if (mode && mode !== 'TEXT_LOWER') b.set('lv_keyboard_set_mode', v.enum('KEYBOARD_MODE', mode));
    if (p.popover === false) b.set('lv_keyboard_set_popovers', v.bool(false));
  },

  panel(b, p) {
    b.create('obj', b.parent).pos(p).size(p);
    b.style('bg_color', v.color(p.bgColor));
    if (has(p.borderWidth)) b.style('border_width', v.int(p.borderWidth));
    if (toInt(p.borderWidth) > 0) b.style('border_color', v.color(p.borderColor));
    if (has(p.radius)) b.style('radius', v.int(p.radius));
  },

  bar(b, p) {
    b.create('bar', b.parent).pos(p).size(p);
    b.set('lv_bar_set_range', v.int(p.min, 0), v.int(p.max, 100));
    const mode = enumMember(p.mode, 'BAR_MODE', BAR_MODES);
    if (mode && mode !== 'NORMAL') b.set('lv_bar_set_mode', v.enum('BAR_MODE', mode));
    b.set('lv_bar_set_value', v.int(p.value, 50), v.animEnable(false));
    if (mode === 'RANGE' && has(p.startValue)) b.set('lv_bar_set_start_value', v.int(p.startValue), v.animEnable(false));
    b.style('bg_color', v.color(p.bgColor));
    b.style('bg_color', v.color(p.indicatorColor), v.sel('INDICATOR'));
  },

  arc(b, p) {
    b.create('arc', b.parent).pos(p).size(p);
    if (toInt(p.rotation)) b.set('lv_arc_set_rotation', v.int(p.rotation));
    if (has(p.startAngle) && has(p.endAngle)) b.set('lv_arc_set_bg_angles', v.int(p.startAngle), v.int(p.endAngle));
    const mode = enumMember(p.mode, 'ARC_MODE', ARC_MODES);
    if (mode && mode !== 'NORMAL') b.set('lv_arc_set_mode', v.enum('ARC_MODE', mode));
    b.set('lv_arc_set_range', v.int(p.min, 0), v.int(p.max, 100));
    b.set('lv_arc_set_value', v.int(p.value, 50));
    if (toInt(p.lineWidth) > 0) {
      b.style('arc_width', v.int(p.lineWidth));
      b.style('arc_width', v.int(p.lineWidth), v.sel('INDICATOR'));
    }
    b.style('arc_color', v.color(p.bgColor));
    b.style('arc_color', v.color(p.indicatorColor), v.sel('INDICATOR'));
    b.style('bg_color', v.color(p.knobColor), v.sel('KNOB'));
  },

  spinner(b, p) {
    if (b.isC) {
      b.create('spinner', b.parent).pos(p).size(p);
      b.set('lv_spinner_set_anim_params', v.int(p.speed, 1000), v.int(p.arcLength, 60));
    } else {
      // lv_micropython does not export lv.spinner: an arc rotated by an endless animation
      b.create('arc', b.parent).pos(p).size(p);
      b.set('lv_arc_set_bg_angles', v.int(0), v.int(360));
      b.set('lv_arc_set_angles', v.int(0), v.int(p.arcLength, 60));
      b.set('lv_obj_remove_style', v.null(), v.sel('KNOB'));
      b.set('lv_obj_remove_flag', v.enum('OBJ_FLAG', 'CLICKABLE'));
      animate(b, { prop: 'rotation', start: 0, end: 360, duration: toInt(p.speed, 1000), repeat: v.constant('ANIM_REPEAT_INFINITE') });
    }
    if (toInt(p.lineWidth) > 0) {
      b.style('arc_width', v.int(p.lineWidth));
      b.style('arc_width', v.int(p.lineWidth), v.sel('INDICATOR'));
    }
    b.style('arc_color', v.color(p.color), v.sel('INDICATOR'));
  },

  led(b, p) {
    b.create('led', b.parent).pos(p).size(p);
    b.set('lv_led_set_color', v.color(p.color));
    if (has(p.brightness)) b.set('lv_led_set_brightness', v.int(p.brightness, 255));
  },

  chart(b, p) {
    b.create('chart', b.parent).pos(p).size(p);
    const type = { line: 'LINE', bar: 'BAR', scatter: 'SCATTER' }[p.chartType] ?? 'LINE';
    b.set('lv_chart_set_type', v.enum('CHART_TYPE', type));
    if (toInt(p.pointCount) > 0) b.set('lv_chart_set_point_count', v.int(p.pointCount));
    if (has(p.divLineCount)) b.set('lv_chart_set_div_line_count', v.int(p.divLineCount, 3), v.int(p.divLineCountSec, 5));
    b.set('lv_chart_set_axis_range', v.enum('CHART_AXIS', 'PRIMARY_Y'), v.int(p.rangeYMin, 0), v.int(p.rangeYMax, 100));
    if (p.updateMode === 'circular') b.set('lv_chart_set_update_mode', v.enum('CHART_UPDATE_MODE', 'CIRCULAR'));
    b.style('bg_color', v.color(p.bgColor));
    const series = [
      [p.data, p.lineColor ?? '#2196F3'],
      [p.data2, p.lineColor2 ?? '#FF5722'],
    ];
    series.forEach(([data, color], index) => {
      if (index > 0 && !data) return;
      const serVar = b.assign(
        `${b.name}_series_${index + 1}`,
        'lv_chart_series_t *',
        'lv_chart_add_series',
        b.self,
        v.color(color) ?? v.color('#2196F3'),
        v.enum('CHART_AXIS', 'PRIMARY_Y')
      );
      intList(data).forEach((value) => b.set('lv_chart_set_next_value', v.ref(serVar), v.int(value)));
    });
  },

  table(b, p) {
    b.create('table', b.parent).pos(p).size(p);
    const cols = Math.max(toInt(p.cols, 3), 1);
    b.set('lv_table_set_column_count', v.int(cols));
    intList(p.colWidths)
      .slice(0, cols)
      .forEach((width, column) => b.set('lv_table_set_column_width', v.int(column), v.int(width)));
    const rows = [];
    if (p.headerRow) rows.push(csv(p.headerRow));
    lines(p.cellData).forEach((row) => rows.push(csv(row)));
    rows.forEach((cells, row) =>
      cells.slice(0, cols).forEach((cell, column) => b.set('lv_table_set_cell_value', v.int(row), v.int(column), v.str(cell)))
    );
    b.style('bg_color', v.color(p.bgColor), v.sel('ITEMS'));
    b.style('text_color', v.color(p.textColor), v.sel('ITEMS'));
    b.style('border_color', v.color(p.borderColor), v.sel('ITEMS'));
    b.font(p.fontSize);
  },

  scale(b, p) {
    b.create('scale', b.parent).pos(p).size(p);
    const mode = { horizontal: 'HORIZONTAL_BOTTOM', vertical: 'VERTICAL_LEFT', round_inner: 'ROUND_INNER', round_outer: 'ROUND_OUTER' }[p.mode] ?? 'HORIZONTAL_BOTTOM';
    b.set('lv_scale_set_mode', v.enum('SCALE_MODE', mode));
    const min = toInt(p.min, 0);
    const max = toInt(p.max, 100);
    b.set('lv_scale_set_range', v.int(min), v.int(max));
    // majorTickEvery is in value units; LVGL counts ticks
    const majorStep = Math.max(toInt(p.majorTickEvery, 10), 1);
    const minorPerMajor = Math.max(toInt(p.minorTickCount, 4), 0) + 1;
    const majorCount = Math.max(Math.round(Math.abs(max - min) / majorStep), 1);
    b.set('lv_scale_set_total_tick_count', v.int(majorCount * minorPerMajor + 1));
    b.set('lv_scale_set_major_tick_every', v.int(minorPerMajor));
    if (p.labelShow === false) b.set('lv_scale_set_label_show', v.bool(false));
    if (has(p.majorTickLength)) b.style('length', v.int(p.majorTickLength), v.sel('INDICATOR'));
    if (has(p.minorTickLength)) b.style('length', v.int(p.minorTickLength), v.sel('ITEMS'));
    b.style('line_color', v.color(p.lineColor), v.sel('INDICATOR'));
    b.style('text_color', v.color(p.textColor), v.sel('INDICATOR'));
  },

  image(b, p) {
    b.create('image', b.parent).pos(p).size(p);
    if (p.src) b.set('lv_image_set_src', b.context.image(p.src));
    if (toInt(p.rotation)) b.set('lv_image_set_rotation', v.int(p.rotation));
    if (has(p.zoom) && toInt(p.zoom, 256) !== 256) b.set('lv_image_set_scale', v.int(p.zoom, 256));
    if (toInt(p.pivotX) || toInt(p.pivotY)) b.set('lv_image_set_pivot', v.int(p.pivotX), v.int(p.pivotY));
    if (p.antialias === false) b.set('lv_image_set_antialias', v.bool(false));
  },

  imagebutton(b, p) {
    b.create('imagebutton', b.parent).pos(p).size(p);
    if (p.src) {
      b.set('lv_imagebutton_set_src', v.enum('IMAGEBUTTON_STATE', 'RELEASED'), v.null(), b.context.image(p.src), v.null());
    }
    b.style('bg_color', v.color(p.bgColor));
    if (has(p.radius)) b.style('radius', v.int(p.radius));
    addButtonLabel(b, p);
  },

  tabview(b, p) {
    b.create('tabview', b.parent).pos(p).size(p);
    const position = { top: 'TOP', bottom: 'BOTTOM', left: 'LEFT', right: 'RIGHT' }[p.tabPosition] ?? 'TOP';
    b.set('lv_tabview_set_tab_bar_position', v.enum('DIR', position));
    b.set('lv_tabview_set_tab_bar_size', v.int(p.tabBarSize, 40));
    const tabs = lines(p.tabs);
    tabs.forEach((tab, index) => b.assign(`${b.name}_tab_${index + 1}`, 'lv_obj_t *', 'lv_tabview_add_tab', b.self, v.str(tab)));
    const active = toInt(p.activeTab, 0);
    if (active > 0 && active < tabs.length) b.set('lv_tabview_set_active', v.int(active), v.animEnable(false));
    b.style('bg_color', v.color(p.bgColor));
  },

  tileview(b, p) {
    b.create('tileview', b.parent).pos(p).size(p);
    const rows = Math.min(Math.max(toInt(p.rows, 2), 1), 16);
    const cols = Math.min(Math.max(toInt(p.cols, 2), 1), 16);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        b.set('lv_tileview_add_tile', v.int(col), v.int(row), v.enum('DIR', 'ALL'));
      }
    }
    b.style('bg_color', v.color(p.bgColor));
  },

  // lv_menu, lv_win and lv_list are deprecated in LVGL 9.6 (and lv.list is
  // missing in lv_micropython): they are built from base widgets in a flex
  // column, as recommended by LVGL.
  menu(b, p) {
    flexColumn(b, p);
    b.style('bg_color', v.color(p.bgColor));
    const title = b.construct(`${b.name}_title`, 'lv_label_create', 'label', b.self);
    b.on(v.ref(title), 'lv_label_set_text', v.str(p.headerTitle ?? 'Menu'));
    b.on(v.ref(title), 'lv_obj_set_style_text_color', v.color(p.textColor), v.sel());
    lines(p.items).forEach((item, index) => itemButton(b, `${b.name}_item_${index + 1}`, item, p));
  },

  win(b, p) {
    flexColumn(b, p);
    b.style('pad_all', v.int(0));
    b.style('pad_row', v.int(0));
    b.style('bg_color', v.color(p.bgColor));
    const header = b.construct(`${b.name}_header`, 'lv_obj_create', 'obj', b.self);
    const headerRef = v.ref(header);
    b.on(headerRef, 'lv_obj_set_size', v.pct(100), v.int(p.headerHeight, 40));
    b.on(headerRef, 'lv_obj_set_style_bg_color', v.color(p.headerBgColor), v.sel());
    b.on(headerRef, 'lv_obj_set_style_radius', v.int(0), v.sel());
    const title = b.construct(`${b.name}_title`, 'lv_label_create', 'label', headerRef);
    b.on(v.ref(title), 'lv_label_set_text', v.str(p.title ?? ''));
    b.on(v.ref(title), 'lv_obj_set_style_text_color', v.color(p.titleColor), v.sel());
    b.on(v.ref(title), 'lv_obj_align', v.enum('ALIGN', 'LEFT_MID'), v.int(0), v.int(0));
    const content = b.construct(`${b.name}_content`, 'lv_obj_create', 'obj', b.self);
    b.on(v.ref(content), 'lv_obj_set_width', v.pct(100));
    b.on(v.ref(content), 'lv_obj_set_flex_grow', v.int(1));
  },

  list(b, p) {
    flexColumn(b, p);
    b.style('bg_color', v.color(p.bgColor));
    lines(p.items).forEach((item, index) => itemButton(b, `${b.name}_item_${index + 1}`, item, p));
  },

  msgbox(b, p) {
    b.create('msgbox', b.parent).pos(p).size(p);
    b.assign(`${b.name}_title`, 'lv_obj_t *', 'lv_msgbox_add_title', b.self, v.str(p.title ?? 'Notice'));
    if (p.text) b.assign(`${b.name}_text`, 'lv_obj_t *', 'lv_msgbox_add_text', b.self, v.str(p.text));
    lines(p.buttons).forEach((button, index) =>
      b.assign(`${b.name}_button_${index + 1}`, 'lv_obj_t *', 'lv_msgbox_add_footer_button', b.self, v.str(button))
    );
    if (p.closeButton) b.assign(`${b.name}_close`, 'lv_obj_t *', 'lv_msgbox_add_close_button', b.self);
    b.style('bg_color', v.color(p.bgColor));
  },

  buttonmatrix(b, p) {
    b.create('buttonmatrix', b.parent).pos(p).size(p);
    const rows = lines(p.map).map((row) => csv(row).filter((button) => button !== ''));
    if (rows.length > 0) {
      const items = [];
      rows.forEach((row, index) => {
        row.forEach((button) => items.push(v.str(button)));
        if (index < rows.length - 1) items.push(v.str('\n'));
      });
      items.push(v.str(''));
      const map = b.array(`${b.name}_map`, 'const char *', items);
      b.set('lv_buttonmatrix_set_map', v.ref(map));
    }
    if (p.oneCheck) b.set('lv_buttonmatrix_set_one_checked', v.bool(true));
    b.style('bg_color', v.color(p.bgColor));
    b.style('bg_color', v.color(p.btnColor), v.sel('ITEMS'));
    b.style('text_color', v.color(p.textColor), v.sel('ITEMS'));
    b.font(p.fontSize);
  },

  calendar(b, p) {
    b.create('calendar', b.parent).pos(p).size(p);
    const year = toInt(p.year, 2026);
    const month = Math.min(Math.max(toInt(p.month, 1), 1), 12);
    const day = Math.min(Math.max(toInt(p.day, 1), 1), 31);
    b.set('lv_calendar_set_today_date', v.int(year), v.int(month), v.int(day));
    b.set('lv_calendar_set_month_shown', v.int(year), v.int(month));
    if (p.showHeader) b.assign(`${b.name}_header`, 'lv_obj_t *', 'lv_calendar_add_header_arrow', b.self);
    b.style('bg_color', v.color(p.bgColor));
  },

  line(b, p) {
    b.create('line', b.parent).pos(p);
    const points = String(p.points ?? '')
      .trim()
      .split(/\s+/)
      .map((pair) => pair.split(',').map(Number))
      .filter((pair) => pair.length === 2 && pair.every(Number.isFinite))
      .map(([x, y]) => ({ k: 'point', x: Math.round(x), y: Math.round(y) }));
    if (points.length >= 2) {
      const array = b.array(`${b.name}_points`, 'lv_point_precise_t', points);
      b.set('lv_line_set_points', v.ref(array), v.int(points.length));
    }
    b.style('line_color', v.color(p.lineColor));
    if (has(p.lineWidth)) b.style('line_width', v.int(p.lineWidth));
    if (p.rounded) b.style('line_rounded', v.bool(true));
  },

  span(b, p) {
    b.create('spangroup', b.parent).pos(p).size(p);
    const mode = { wrap: 'FIXED', expand: 'EXPAND', break: 'BREAK', clip: 'FIXED' }[p.mode];
    if (b.isC) {
      // LVGL 9.6: LV_SIZE_CONTENT width expands, content height breaks lines
      if (mode === 'EXPAND') b.set('lv_obj_set_size', v.constant('SIZE_CONTENT'), v.constant('SIZE_CONTENT'));
      if (mode === 'BREAK') b.set('lv_obj_set_height', v.constant('SIZE_CONTENT'));
    } else if (mode && mode !== 'FIXED') {
      b.set('lv_spangroup_set_mode', v.enum('SPAN_MODE', mode));
    }
    if (p.mode === 'clip') b.set('lv_spangroup_set_overflow', v.enum('SPAN_OVERFLOW', 'CLIP'));
    b.style('bg_color', v.color(p.bgColor));
    lines(p.spans).forEach((definition, index) => {
      const [text = '', size, color] = definition.split('|').map((part) => part.trim());
      const span = b.assign(`${b.name}_span_${index + 1}`, 'lv_span_t *', 'lv_spangroup_add_span', b.self);
      b.on(v.ref(span), 'lv_span_set_text', v.str(text));
      const style = b.assign(`${span}_style`, 'lv_style_t *', 'lv_span_get_style', v.ref(span));
      b.on(v.ref(style), 'lv_style_set_text_color', v.color(color));
      if (size) b.on(v.ref(style), 'lv_style_set_text_font', v.font(size));
    });
    b.set('lv_spangroup_refresh');
  },
};

// Styles and flags shared by every widget (from the editor's common props)
function commonStyles(b, p) {
  if (has(p.opacity) && toInt(p.opacity, 255) !== 255) b.style('opa', v.int(p.opacity, 255));
  if (has(p.bgOpa)) b.style('bg_opa', v.int(p.bgOpa, 255));
  // Padding set in the editor is always emitted, also when 0: otherwise the
  // LVGL theme padding applies and children are not where the canvas shows
  // them (child coordinates are relative to the parent's content area)
  const sides = [['padTop', 'pad_top'], ['padBottom', 'pad_bottom'], ['padLeft', 'pad_left'], ['padRight', 'pad_right']];
  const values = sides.map(([prop]) => (has(p[prop]) ? toInt(p[prop]) : null));
  if (values.every((value) => value !== null && value === values[0])) {
    b.style('pad_all', v.int(values[0]));
  } else {
    sides.forEach(([prop, style]) => {
      if (has(p[prop])) b.style(style, v.int(p[prop]));
    });
  }
  if (has(p.padRow) && has(p.padColumn) && toInt(p.padRow) === toInt(p.padColumn)) {
    b.style('pad_gap', v.int(p.padRow));
  } else {
    if (has(p.padRow)) b.style('pad_row', v.int(p.padRow));
    if (has(p.padColumn)) b.style('pad_column', v.int(p.padColumn));
  }
  if (toInt(p.shadowWidth)) {
    b.style('shadow_width', v.int(p.shadowWidth));
    b.style('shadow_color', v.color(p.shadowColor));
    if (toInt(p.shadowOffsetX)) b.style('shadow_offset_x', v.int(p.shadowOffsetX));
    if (toInt(p.shadowOffsetY)) b.style('shadow_offset_y', v.int(p.shadowOffsetY));
    if (toInt(p.shadowSpread)) b.style('shadow_spread', v.int(p.shadowSpread));
  }
  if (toInt(p.outlineWidth)) {
    b.style('outline_width', v.int(p.outlineWidth));
    b.style('outline_color', v.color(p.outlineColor));
    if (toInt(p.outlinePad)) b.style('outline_pad', v.int(p.outlinePad));
  }
  [
    ['transformRotation', 'transform_rotation'], ['transformScaleX', 'transform_scale_x'],
    ['transformScaleY', 'transform_scale_y'], ['transformPivotX', 'transform_pivot_x'],
    ['transformPivotY', 'transform_pivot_y'],
  ].forEach(([prop, style]) => {
    if (toInt(p[prop])) b.style(style, v.int(p[prop]));
  });

  const flow = enumMember(p.flexFlow, 'FLEX_FLOW', FLEX_FLOWS);
  if (flow) {
    b.set('lv_obj_set_flex_flow', v.enum('FLEX_FLOW', flow));
    const main = enumMember(p.flexMainPlace, 'FLEX_ALIGN', FLEX_ALIGNS);
    if (main) {
      const cross = enumMember(p.flexCrossPlace, 'FLEX_ALIGN', FLEX_ALIGNS) ?? 'START';
      b.set('lv_obj_set_flex_align', v.enum('FLEX_ALIGN', main), v.enum('FLEX_ALIGN', cross), v.enum('FLEX_ALIGN', cross));
    }
  }
  const scrollbar = enumMember(p.scrollbarMode, 'SCROLLBAR_MODE', SCROLLBAR_MODES);
  if (scrollbar && scrollbar !== 'AUTO') b.set('lv_obj_set_scrollbar_mode', v.enum('SCROLLBAR_MODE', scrollbar));
  const scrollDir = enumMember(p.scrollDir, 'DIR', DIRS);
  if (scrollDir) b.set('lv_obj_set_scroll_dir', v.enum('DIR', scrollDir));

  if (p.hidden) {
    if (b.isC) b.set('lv_obj_set_hidden', v.bool(true));
    else b.set('lv_obj_add_flag', v.enum('OBJ_FLAG', 'HIDDEN'));
  }
  if (p.clickable === false) {
    if (b.isC) b.set('lv_obj_set_clickable', v.bool(false));
    else b.set('lv_obj_remove_flag', v.enum('OBJ_FLAG', 'CLICKABLE'));
  }
  if (p.disabled) b.set('lv_obj_add_state', v.enum('STATE', 'DISABLED'));
}

// Custom styles edited in the Style Editor: local style properties of the main part
const CUSTOM_STYLE_PROPS = {
  bg_color: 'color', bg_opa: 'int', border_color: 'color', border_width: 'int', border_opa: 'int',
  pad_top: 'int', pad_bottom: 'int', pad_left: 'int', pad_right: 'int',
  text_color: 'color', text_font_size: 'font', radius: 'int',
  shadow_width: 'int', shadow_ofs_x: 'int', shadow_ofs_y: 'int', shadow_color: 'color',
};
const CUSTOM_STYLE_NAMES = { shadow_ofs_x: 'shadow_offset_x', shadow_ofs_y: 'shadow_offset_y' };

function customStyles(b, styles) {
  Object.entries(styles ?? {}).forEach(([key, value]) => {
    const kind = CUSTOM_STYLE_PROPS[key];
    if (!kind || !has(value)) return;
    if (kind === 'font') {
      b.font(value);
    } else {
      b.style(CUSTOM_STYLE_NAMES[key] ?? key, kind === 'color' ? v.color(value) : v.int(value));
    }
  });
}

export const SUPPORTED_WIDGET_TYPES = Object.keys(builders);

function animationOps(b, animation) {
  const prop = ANIM_PROPS[animation.type];
  if (!prop) {
    b.comment(`Animation type "${animation.type}" is not supported by the code generator`);
    return;
  }
  animate(b, {
    prop,
    start: animation.startValue,
    end: animation.endValue,
    duration: animation.duration,
    delay: animation.delay,
    repeat: toInt(animation.repeat) > 0 ? v.int(animation.repeat) : null,
    reverse: Boolean(animation.playback),
    path: animation.path,
  });
}

/**
 * Build the operations of one widget.
 * @param {object} node - IR node: { widget, name, parentName }
 * @param {object} context - { temp(base), image(src), callbackFor(event) }
 */
export function buildWidgetOps(node, context) {
  const { widget, name, parentName } = node;
  const b = new Ops(context, name);
  b.parent = parentName ? v.ref(parentName) : v.ref('parent');
  const props = widget.props ?? {};
  const build = builders[widget.type];

  b.comment(`${widget.type}: ${widget.name ?? name}`);
  if (!build) {
    b.comment(`Unsupported widget type "${widget.type}"`);
    return b.ops;
  }

  build(b, props);
  commonStyles(b, props);
  customStyles(b, widget.customStyles);

  (widget.events ?? []).forEach((event) => {
    const handler = context.callbackFor(widget, event);
    if (handler) b.set('lv_obj_add_event_cb', { k: 'fn', name: handler.name }, v.enum('EVENT', handler.eventCode), v.null());
  });
  (widget.animations ?? []).forEach((animation) => animationOps(b, animation));

  return b.ops;
}
