// C Code Generator for LVGL 9.3
import { loadTemplate, DEFAULT_ARCHITECTURE } from './templateLoader';

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function colorToLvglHex(color) {
  const hex = color.replace('#', '');
  return `lv_color_hex(0x${hex})`;
}

function sanitizeIdentifier(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

function generateCommonStyleCode(varName, props, indent = '    ') {
  const lines = [];

  if (props.opacity !== undefined && props.opacity !== 255) {
    lines.push(`${indent}lv_obj_set_style_opa(${varName}, ${props.opacity}, 0);`);
  }
  if (props.bgOpa !== undefined) {
    lines.push(`${indent}lv_obj_set_style_bg_opa(${varName}, ${props.bgOpa}, 0);`);
  }

  // Padding
  if (props.padTop) lines.push(`${indent}lv_obj_set_style_pad_top(${varName}, ${props.padTop}, 0);`);
  if (props.padBottom) lines.push(`${indent}lv_obj_set_style_pad_bottom(${varName}, ${props.padBottom}, 0);`);
  if (props.padLeft) lines.push(`${indent}lv_obj_set_style_pad_left(${varName}, ${props.padLeft}, 0);`);
  if (props.padRight) lines.push(`${indent}lv_obj_set_style_pad_right(${varName}, ${props.padRight}, 0);`);
  if (props.padRow) lines.push(`${indent}lv_obj_set_style_pad_row(${varName}, ${props.padRow}, 0);`);
  if (props.padColumn) lines.push(`${indent}lv_obj_set_style_pad_column(${varName}, ${props.padColumn}, 0);`);

  // Shadow
  if (props.shadowWidth) {
    lines.push(`${indent}lv_obj_set_style_shadow_width(${varName}, ${props.shadowWidth}, 0);`);
    if (props.shadowColor) lines.push(`${indent}lv_obj_set_style_shadow_color(${varName}, ${colorToLvglHex(props.shadowColor)}, 0);`);
    if (props.shadowOffsetX) lines.push(`${indent}lv_obj_set_style_shadow_offset_x(${varName}, ${props.shadowOffsetX}, 0);`);
    if (props.shadowOffsetY) lines.push(`${indent}lv_obj_set_style_shadow_offset_y(${varName}, ${props.shadowOffsetY}, 0);`);
    if (props.shadowSpread) lines.push(`${indent}lv_obj_set_style_shadow_spread(${varName}, ${props.shadowSpread}, 0);`);
  }

  // Outline
  if (props.outlineWidth) {
    lines.push(`${indent}lv_obj_set_style_outline_width(${varName}, ${props.outlineWidth}, 0);`);
    if (props.outlineColor) lines.push(`${indent}lv_obj_set_style_outline_color(${varName}, ${colorToLvglHex(props.outlineColor)}, 0);`);
    if (props.outlinePad) lines.push(`${indent}lv_obj_set_style_outline_pad(${varName}, ${props.outlinePad}, 0);`);
  }

  // Transform
  if (props.transformRotation) lines.push(`${indent}lv_obj_set_style_transform_rotation(${varName}, ${props.transformRotation}, 0);`);
  if (props.transformScaleX) lines.push(`${indent}lv_obj_set_style_transform_scale_x(${varName}, ${props.transformScaleX}, 0);`);
  if (props.transformScaleY) lines.push(`${indent}lv_obj_set_style_transform_scale_y(${varName}, ${props.transformScaleY}, 0);`);
  if (props.transformPivotX) lines.push(`${indent}lv_obj_set_style_transform_pivot_x(${varName}, ${props.transformPivotX}, 0);`);
  if (props.transformPivotY) lines.push(`${indent}lv_obj_set_style_transform_pivot_y(${varName}, ${props.transformPivotY}, 0);`);

  // Flex layout
  if (props.flexFlow && props.flexFlow !== 'none') {
    lines.push(`${indent}lv_obj_set_flex_flow(${varName}, ${props.flexFlow});`);
    if (props.flexMainPlace && props.flexMainPlace !== 'none') {
      lines.push(`${indent}lv_obj_set_flex_align(${varName}, ${props.flexMainPlace}, ${props.flexCrossPlace || 'LV_FLEX_ALIGN_START'}, ${props.flexCrossPlace || 'LV_FLEX_ALIGN_START'});`);
    }
  }

  // Scrollbar
  if (props.scrollbarMode && props.scrollbarMode !== 'LV_SCROLLBAR_MODE_AUTO') {
    lines.push(`${indent}lv_obj_set_scrollbar_mode(${varName}, ${props.scrollbarMode});`);
  }
  if (props.scrollDir) {
    lines.push(`${indent}lv_obj_set_scroll_dir(${varName}, ${props.scrollDir});`);
  }

  // Flags
  if (props.hidden) lines.push(`${indent}lv_obj_add_flag(${varName}, LV_OBJ_FLAG_HIDDEN);`);
  if (props.clickable === false) lines.push(`${indent}lv_obj_remove_flag(${varName}, LV_OBJ_FLAG_CLICKABLE);`);
  if (props.disabled) lines.push(`${indent}lv_obj_add_state(${varName}, LV_STATE_DISABLED);`);

  return lines;
}

function generateAnimationCode(widget, animation, indent = '    ') {
  const varName = sanitizeIdentifier(widget.name);
  const animVarName = `${varName}_anim_${animation.id.slice(-4)}`;
  const lines = [];

  lines.push(`${indent}/* Animation: ${animation.type} */`);
  lines.push(`${indent}lv_anim_t ${animVarName};`);
  lines.push(`${indent}lv_anim_init(&${animVarName});`);
  lines.push(`${indent}lv_anim_set_var(&${animVarName}, ${varName});`);
  lines.push(`${indent}lv_anim_set_time(&${animVarName}, ${animation.duration});`);
  lines.push(`${indent}lv_anim_set_delay(&${animVarName}, ${animation.delay});`);

  if (animation.repeat > 0) {
    lines.push(`${indent}lv_anim_set_repeat_count(&${animVarName}, ${animation.repeat});`);
  }

  if (animation.playback) {
    lines.push(`${indent}lv_anim_set_playback_time(&${animVarName}, ${animation.duration});`);
  }

  lines.push(`${indent}lv_anim_set_values(&${animVarName}, ${animation.startValue}, ${animation.endValue});`);

  // LVGL 9.3 path callbacks
  const pathMap = {
    'lv_anim_path_linear': 'lv_anim_path_linear',
    'lv_anim_path_ease_in': 'lv_anim_path_ease_in',
    'lv_anim_path_ease_out': 'lv_anim_path_ease_out',
    'lv_anim_path_ease_in_out': 'lv_anim_path_ease_in_out',
    'lv_anim_path_overshoot': 'lv_anim_path_overshoot',
    'lv_anim_path_bounce': 'lv_anim_path_bounce',
    'lv_anim_path_step': 'lv_anim_path_step',
  };
  const path = pathMap[animation.path] || animation.path;
  lines.push(`${indent}lv_anim_set_path_cb(&${animVarName}, ${path});`);

  switch (animation.type) {
    case 'move_x':
      lines.push(`${indent}lv_anim_set_exec_cb(&${animVarName}, (lv_anim_exec_xcb_t)lv_obj_set_x);`);
      break;
    case 'move_y':
      lines.push(`${indent}lv_anim_set_exec_cb(&${animVarName}, (lv_anim_exec_xcb_t)lv_obj_set_y);`);
      break;
    case 'width':
      lines.push(`${indent}lv_anim_set_exec_cb(&${animVarName}, (lv_anim_exec_xcb_t)lv_obj_set_width);`);
      break;
    case 'height':
      lines.push(`${indent}lv_anim_set_exec_cb(&${animVarName}, (lv_anim_exec_xcb_t)lv_obj_set_height);`);
      break;
    case 'fade_in':
    case 'fade_out':
      lines.push(`${indent}lv_anim_set_exec_cb(&${animVarName}, (lv_anim_exec_xcb_t)lv_obj_set_style_opa);`);
      break;
    default:
      lines.push(`${indent}/* Custom animation type: ${animation.type} */`);
  }

  lines.push(`${indent}lv_anim_start(&${animVarName});`);

  return lines.join('\n');
}

function generateWidgetCode(widget, widgets, indent = '    ') {
  const { type, name, props, events, animations } = widget;
  const varName = sanitizeIdentifier(name);
  const parentVar = getWidgetParentVarName(widget, widgets);
  const lines = [];

  switch (type) {
    case 'button': {
      lines.push(`${indent}/* Create button: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_button_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      if (props.bgColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.bgColor)}, 0);`);
      if (props.radius !== undefined) lines.push(`${indent}lv_obj_set_style_radius(${varName}, ${props.radius}, 0);`);
      if (props.text) {
        const labelVar = `${varName}_label`;
        lines.push(`${indent}lv_obj_t *${labelVar} = lv_label_create(${varName});`);
        lines.push(`${indent}lv_label_set_text(${labelVar}, "${props.text}");`);
        lines.push(`${indent}lv_obj_center(${labelVar});`);
        if (props.textColor) lines.push(`${indent}lv_obj_set_style_text_color(${labelVar}, ${colorToLvglHex(props.textColor)}, 0);`);
        if (props.fontSize) lines.push(`${indent}lv_obj_set_style_text_font(${labelVar}, &lv_font_montserrat_${props.fontSize}, 0);`);
      }
      break;
    }

    case 'label': {
      lines.push(`${indent}/* Create label: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_label_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      lines.push(`${indent}lv_label_set_text(${varName}, "${props.text || 'Label'}");`);
      if (props.textColor) lines.push(`${indent}lv_obj_set_style_text_color(${varName}, ${colorToLvglHex(props.textColor)}, 0);`);
      if (props.fontSize) lines.push(`${indent}lv_obj_set_style_text_font(${varName}, &lv_font_montserrat_${props.fontSize}, 0);`);
      if (props.longMode && props.longMode !== 'LV_LABEL_LONG_WRAP') {
        lines.push(`${indent}lv_label_set_long_mode(${varName}, ${props.longMode});`);
      }
      if (props.textAlign) {
        lines.push(`${indent}lv_obj_set_style_text_align(${varName}, ${props.textAlign}, 0);`);
      }
      if (props.recolor) lines.push(`${indent}lv_label_set_recolor(${varName}, true);`);
      break;
    }

    case 'slider': {
      lines.push(`${indent}/* Create slider: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_slider_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      lines.push(`${indent}lv_slider_set_range(${varName}, ${props.min || 0}, ${props.max || 100});`);
      lines.push(`${indent}lv_slider_set_value(${varName}, ${props.value || 50}, LV_ANIM_OFF);`);
      if (props.indicatorColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.indicatorColor)}, LV_PART_INDICATOR);`);
      if (props.knobColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.knobColor)}, LV_PART_KNOB);`);
      if (props.mode === 'symmetrical') lines.push(`${indent}lv_slider_set_mode(${varName}, LV_SLIDER_MODE_SYMMETRICAL);`);
      if (props.mode === 'range' || props.isRange) {
        lines.push(`${indent}lv_slider_set_mode(${varName}, LV_SLIDER_MODE_RANGE);`);
        if (props.leftValue !== undefined) lines.push(`${indent}lv_slider_set_left_value(${varName}, ${props.leftValue}, LV_ANIM_OFF);`);
      }
      break;
    }

    case 'switch': {
      lines.push(`${indent}/* Create switch: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_switch_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      if (props.checked) lines.push(`${indent}lv_obj_add_state(${varName}, LV_STATE_CHECKED);`);
      if (props.onColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.onColor)}, LV_PART_INDICATOR | LV_STATE_CHECKED);`);
      if (props.offColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.offColor)}, LV_PART_INDICATOR);`);
      if (props.knobColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.knobColor)}, LV_PART_KNOB);`);
      if (props.disabled) lines.push(`${indent}lv_obj_add_state(${varName}, LV_STATE_DISABLED);`);
      break;
    }

    case 'checkbox': {
      lines.push(`${indent}/* Create checkbox: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_checkbox_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_checkbox_set_text(${varName}, "${props.text || 'Checkbox'}");`);
      if (props.checked) lines.push(`${indent}lv_obj_add_state(${varName}, LV_STATE_CHECKED);`);
      if (props.textColor) lines.push(`${indent}lv_obj_set_style_text_color(${varName}, ${colorToLvglHex(props.textColor)}, 0);`);
      if (props.checkedColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.checkedColor)}, LV_PART_INDICATOR | LV_STATE_CHECKED);`);
      if (props.disabled) lines.push(`${indent}lv_obj_add_state(${varName}, LV_STATE_DISABLED);`);
      break;
    }

    case 'textarea': {
      lines.push(`${indent}/* Create textarea: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_textarea_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      if (props.text) lines.push(`${indent}lv_textarea_set_text(${varName}, "${props.text}");`);
      if (props.placeholder) lines.push(`${indent}lv_textarea_set_placeholder_text(${varName}, "${props.placeholder}");`);
      if (props.oneLine) lines.push(`${indent}lv_textarea_set_one_line(${varName}, true);`);
      if (props.password) lines.push(`${indent}lv_textarea_set_password_mode(${varName}, true);`);
      if (props.maxLength > 0) lines.push(`${indent}lv_textarea_set_max_length(${varName}, ${props.maxLength});`);
      if (props.acceptedChars) lines.push(`${indent}lv_textarea_set_accepted_chars(${varName}, "${props.acceptedChars}");`);
      if (props.bgColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.bgColor)}, 0);`);
      if (props.textColor) lines.push(`${indent}lv_obj_set_style_text_color(${varName}, ${colorToLvglHex(props.textColor)}, 0);`);
      break;
    }

    case 'dropdown': {
      lines.push(`${indent}/* Create dropdown: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_dropdown_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      if (props.options) lines.push(`${indent}lv_dropdown_set_options(${varName}, "${props.options.replace(/\n/g, '\\n')}");`);
      if (props.selected) lines.push(`${indent}lv_dropdown_set_selected(${varName}, ${props.selected});`);
      if (props.dir && props.dir !== 'LV_DIR_BOTTOM') lines.push(`${indent}lv_dropdown_set_dir(${varName}, ${props.dir});`);
      if (props.bgColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.bgColor)}, 0);`);
      if (props.textColor) lines.push(`${indent}lv_obj_set_style_text_color(${varName}, ${colorToLvglHex(props.textColor)}, 0);`);
      break;
    }

    case 'roller': {
      lines.push(`${indent}/* Create roller: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_roller_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      const rollerMode = props.infinite ? 'LV_ROLLER_MODE_INFINITE' : 'LV_ROLLER_MODE_NORMAL';
      if (props.options) lines.push(`${indent}lv_roller_set_options(${varName}, "${props.options.replace(/\n/g, '\\n')}", ${rollerMode});`);
      if (props.selected) lines.push(`${indent}lv_roller_set_selected(${varName}, ${props.selected}, LV_ANIM_OFF);`);
      if (props.visibleRows) lines.push(`${indent}lv_roller_set_visible_row_count(${varName}, ${props.visibleRows});`);
      if (props.selectedColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.selectedColor)}, LV_PART_SELECTED);`);
      if (props.textColor) lines.push(`${indent}lv_obj_set_style_text_color(${varName}, ${colorToLvglHex(props.textColor)}, 0);`);
      break;
    }

    case 'spinbox': {
      lines.push(`${indent}/* Create spinbox: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_spinbox_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      lines.push(`${indent}lv_spinbox_set_range(${varName}, ${props.min || 0}, ${props.max || 999});`);
      lines.push(`${indent}lv_spinbox_set_value(${varName}, ${props.value || 0});`);
      if (props.digitCount) lines.push(`${indent}lv_spinbox_set_digit_count(${varName}, ${props.digitCount});`);
      if (props.separatorPos) lines.push(`${indent}lv_spinbox_set_separator_position(${varName}, ${props.separatorPos});`);
      if (props.step) lines.push(`${indent}lv_spinbox_set_step(${varName}, ${props.step});`);
      if (props.rollover) lines.push(`${indent}lv_spinbox_set_rollover(${varName}, true);`);
      break;
    }

    case 'keyboard': {
      lines.push(`${indent}/* Create keyboard: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_keyboard_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      const kbModeMap = { 'text_lower': 'LV_KEYBOARD_MODE_TEXT_LOWER', 'text_upper': 'LV_KEYBOARD_MODE_TEXT_UPPER', 'text_special': 'LV_KEYBOARD_MODE_SPECIAL', 'number': 'LV_KEYBOARD_MODE_NUMBER' };
      if (props.mode && kbModeMap[props.mode]) lines.push(`${indent}lv_keyboard_set_mode(${varName}, ${kbModeMap[props.mode]});`);
      if (props.popover === false) lines.push(`${indent}lv_keyboard_set_popovers(${varName}, false);`);
      break;
    }

    case 'panel': {
      lines.push(`${indent}/* Create panel: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_obj_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      if (props.bgColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.bgColor)}, 0);`);
      if (props.borderWidth) {
        lines.push(`${indent}lv_obj_set_style_border_width(${varName}, ${props.borderWidth}, 0);`);
        if (props.borderColor) lines.push(`${indent}lv_obj_set_style_border_color(${varName}, ${colorToLvglHex(props.borderColor)}, 0);`);
      }
      if (props.radius !== undefined) lines.push(`${indent}lv_obj_set_style_radius(${varName}, ${props.radius}, 0);`);
      break;
    }

    case 'bar': {
      lines.push(`${indent}/* Create progress bar: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_bar_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      lines.push(`${indent}lv_bar_set_range(${varName}, ${props.min || 0}, ${props.max || 100});`);
      const animFlag = props.animated !== false ? 'LV_ANIM_ON' : 'LV_ANIM_OFF';
      lines.push(`${indent}lv_bar_set_value(${varName}, ${props.value || 50}, ${animFlag});`);
      if (props.mode && props.mode !== 'LV_BAR_MODE_NORMAL') lines.push(`${indent}lv_bar_set_mode(${varName}, ${props.mode});`);
      if (props.indicatorColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.indicatorColor)}, LV_PART_INDICATOR);`);
      if (props.startValue && props.mode === 'LV_BAR_MODE_RANGE') {
        lines.push(`${indent}lv_bar_set_start_value(${varName}, ${props.startValue}, LV_ANIM_OFF);`);
      }
      break;
    }

    case 'arc': {
      lines.push(`${indent}/* Create arc: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_arc_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      lines.push(`${indent}lv_arc_set_range(${varName}, ${props.min || 0}, ${props.max || 100});`);
      lines.push(`${indent}lv_arc_set_value(${varName}, ${props.value || 50});`);
      if (props.startAngle !== undefined && props.endAngle !== undefined) {
        lines.push(`${indent}lv_arc_set_bg_angles(${varName}, ${props.startAngle}, ${props.endAngle});`);
      }
      if (props.rotation) lines.push(`${indent}lv_arc_set_rotation(${varName}, ${props.rotation});`);
      if (props.mode && props.mode !== 'LV_ARC_MODE_NORMAL') lines.push(`${indent}lv_arc_set_mode(${varName}, ${props.mode});`);
      if (props.lineWidth) {
        lines.push(`${indent}lv_obj_set_style_arc_width(${varName}, ${props.lineWidth}, LV_PART_MAIN);`);
        lines.push(`${indent}lv_obj_set_style_arc_width(${varName}, ${props.lineWidth}, LV_PART_INDICATOR);`);
      }
      if (props.indicatorColor) lines.push(`${indent}lv_obj_set_style_arc_color(${varName}, ${colorToLvglHex(props.indicatorColor)}, LV_PART_INDICATOR);`);
      if (props.knobColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.knobColor)}, LV_PART_KNOB);`);
      break;
    }

    case 'spinner': {
      lines.push(`${indent}/* Create spinner: ${name} */`);
      // LVGL 9.3: lv_spinner_create(parent) then set params separately
      lines.push(`${indent}lv_obj_t *${varName} = lv_spinner_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      lines.push(`${indent}lv_spinner_set_anim_params(${varName}, ${props.speed || 1000}, ${props.arcLength || 60});`);
      if (props.lineWidth) {
        lines.push(`${indent}lv_obj_set_style_arc_width(${varName}, ${props.lineWidth}, LV_PART_MAIN);`);
        lines.push(`${indent}lv_obj_set_style_arc_width(${varName}, ${props.lineWidth}, LV_PART_INDICATOR);`);
      }
      if (props.color) lines.push(`${indent}lv_obj_set_style_arc_color(${varName}, ${colorToLvglHex(props.color)}, LV_PART_INDICATOR);`);
      break;
    }

    case 'led': {
      lines.push(`${indent}/* Create LED: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_led_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      if (props.color) lines.push(`${indent}lv_led_set_color(${varName}, ${colorToLvglHex(props.color)});`);
      if (props.brightness !== undefined) lines.push(`${indent}lv_led_set_brightness(${varName}, ${props.brightness});`);
      break;
    }

    case 'chart': {
      lines.push(`${indent}/* Create chart: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_chart_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      const chartTypeMap = { line: 'LV_CHART_TYPE_LINE', bar: 'LV_CHART_TYPE_BAR', scatter: 'LV_CHART_TYPE_SCATTER' };
      lines.push(`${indent}lv_chart_set_type(${varName}, ${chartTypeMap[props.chartType] || 'LV_CHART_TYPE_LINE'});`);
      if (props.pointCount) lines.push(`${indent}lv_chart_set_point_count(${varName}, ${props.pointCount});`);
      if (props.divLineCount) lines.push(`${indent}lv_chart_set_div_line_count(${varName}, ${props.divLineCount}, ${props.divLineCountSec || 5});`);
      lines.push(`${indent}lv_chart_set_range(${varName}, LV_CHART_AXIS_PRIMARY_Y, ${props.rangeYMin || 0}, ${props.rangeYMax || 100});`);
      if (props.updateMode === 'circular') lines.push(`${indent}lv_chart_set_update_mode(${varName}, LV_CHART_UPDATE_MODE_CIRCULAR);`);
      // Add series data
      const serVar = `${varName}_ser1`;
      lines.push(`${indent}lv_chart_series_t *${serVar} = lv_chart_add_series(${varName}, ${colorToLvglHex(props.lineColor || '#2196F3')}, LV_CHART_AXIS_PRIMARY_Y);`);
      if (props.data) {
        const dataPoints = props.data.split(',').map(d => d.trim());
        dataPoints.forEach((val) => {
          lines.push(`${indent}lv_chart_set_next_value(${varName}, ${serVar}, ${val});`);
        });
      }
      if (props.data2) {
        const ser2Var = `${varName}_ser2`;
        lines.push(`${indent}lv_chart_series_t *${ser2Var} = lv_chart_add_series(${varName}, ${colorToLvglHex(props.lineColor2 || '#FF5722')}, LV_CHART_AXIS_PRIMARY_Y);`);
        const data2Points = props.data2.split(',').map(d => d.trim());
        data2Points.forEach((val) => {
          lines.push(`${indent}lv_chart_set_next_value(${varName}, ${ser2Var}, ${val});`);
        });
      }
      if (props.bgColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.bgColor)}, 0);`);
      break;
    }

    case 'table': {
      lines.push(`${indent}/* Create table: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_table_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      const cols = props.cols || 3;
      const rows = props.rows || 4;
      lines.push(`${indent}lv_table_set_column_count(${varName}, ${cols});`);
      if (props.colWidths) {
        props.colWidths.split(',').forEach((w, i) => {
          lines.push(`${indent}lv_table_set_column_width(${varName}, ${i}, ${w.trim()});`);
        });
      }
      // Header row
      if (props.headerRow) {
        props.headerRow.split(',').forEach((cell, c) => {
          lines.push(`${indent}lv_table_set_cell_value(${varName}, 0, ${c}, "${cell.trim()}");`);
        });
      }
      // Cell data
      if (props.cellData) {
        props.cellData.split('\n').forEach((row, r) => {
          row.split(',').forEach((cell, c) => {
            lines.push(`${indent}lv_table_set_cell_value(${varName}, ${r + 1}, ${c}, "${cell.trim()}");`);
          });
        });
      }
      break;
    }

    case 'scale': {
      lines.push(`${indent}/* Create scale: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_scale_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      const scaleModeMap = { horizontal: 'LV_SCALE_MODE_HORIZONTAL_BOTTOM', vertical: 'LV_SCALE_MODE_VERTICAL_LEFT', round_inner: 'LV_SCALE_MODE_ROUND_INNER', round_outer: 'LV_SCALE_MODE_ROUND_OUTER' };
      lines.push(`${indent}lv_scale_set_mode(${varName}, ${scaleModeMap[props.mode] || 'LV_SCALE_MODE_HORIZONTAL_BOTTOM'});`);
      lines.push(`${indent}lv_scale_set_range(${varName}, ${props.min || 0}, ${props.max || 100});`);
      lines.push(`${indent}lv_scale_set_total_tick_count(${varName}, ${((props.max - props.min) / props.majorTickEvery) * (props.minorTickCount + 1) + 1});`);
      lines.push(`${indent}lv_scale_set_major_tick_every(${varName}, ${props.majorTickEvery || 10});`);
      if (props.labelShow === false) lines.push(`${indent}lv_scale_set_label_show(${varName}, false);`);
      if (props.lineColor) lines.push(`${indent}lv_obj_set_style_line_color(${varName}, ${colorToLvglHex(props.lineColor)}, LV_PART_INDICATOR);`);
      if (props.textColor) lines.push(`${indent}lv_obj_set_style_text_color(${varName}, ${colorToLvglHex(props.textColor)}, 0);`);
      break;
    }

    case 'image': {
      lines.push(`${indent}/* Create image: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_image_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      if (props.src) lines.push(`${indent}lv_image_set_src(${varName}, &${sanitizeIdentifier(props.src)});`);
      if (props.rotation) lines.push(`${indent}lv_image_set_rotation(${varName}, ${props.rotation});`);
      if (props.zoom && props.zoom !== 256) lines.push(`${indent}lv_image_set_scale(${varName}, ${props.zoom});`);
      if (props.pivotX || props.pivotY) lines.push(`${indent}lv_image_set_pivot(${varName}, ${props.pivotX || 0}, ${props.pivotY || 0});`);
      if (props.antialias === false) lines.push(`${indent}lv_image_set_antialias(${varName}, false);`);
      break;
    }

    case 'imagebutton': {
      lines.push(`${indent}/* Create image button: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_imagebutton_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      if (props.src) lines.push(`${indent}lv_imagebutton_set_src(${varName}, LV_IMAGEBUTTON_STATE_RELEASED, NULL, &${sanitizeIdentifier(props.src)}, NULL);`);
      if (props.bgColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.bgColor)}, 0);`);
      if (props.radius !== undefined) lines.push(`${indent}lv_obj_set_style_radius(${varName}, ${props.radius}, 0);`);
      if (props.text) {
        const labelVar = `${varName}_label`;
        lines.push(`${indent}lv_obj_t *${labelVar} = lv_label_create(${varName});`);
        lines.push(`${indent}lv_label_set_text(${labelVar}, "${props.text}");`);
        lines.push(`${indent}lv_obj_center(${labelVar});`);
        if (props.textColor) lines.push(`${indent}lv_obj_set_style_text_color(${labelVar}, ${colorToLvglHex(props.textColor)}, 0);`);
      }
      break;
    }

    case 'tabview': {
      lines.push(`${indent}/* Create tab view: ${name} */`);
      const tabDirMap = { top: 'LV_DIR_TOP', bottom: 'LV_DIR_BOTTOM', left: 'LV_DIR_LEFT', right: 'LV_DIR_RIGHT' };
      lines.push(`${indent}lv_obj_t *${varName} = lv_tabview_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      lines.push(`${indent}lv_tabview_set_tab_bar_position(${varName}, ${tabDirMap[props.tabPosition] || 'LV_DIR_TOP'});`);
      lines.push(`${indent}lv_tabview_set_tab_bar_size(${varName}, ${props.tabBarSize || 40});`);
      if (props.tabs) {
        props.tabs.split('\n').forEach((tab) => {
          lines.push(`${indent}lv_tabview_add_tab(${varName}, "${tab.trim()}");`);
        });
      }
      if (props.activeTab) lines.push(`${indent}lv_tabview_set_active(${varName}, ${props.activeTab}, LV_ANIM_OFF);`);
      break;
    }

    case 'tileview': {
      lines.push(`${indent}/* Create tile view: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_tileview_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      const tileRows = props.rows || 2;
      const tileCols = props.cols || 2;
      for (let r = 0; r < tileRows; r++) {
        for (let c = 0; c < tileCols; c++) {
          lines.push(`${indent}lv_tileview_add_tile(${varName}, ${c}, ${r}, LV_DIR_ALL);`);
        }
      }
      break;
    }

    case 'menu': {
      lines.push(`${indent}/* Create menu: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_menu_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      if (props.bgColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.bgColor)}, 0);`);
      // Create main page
      const mainPageVar = `${varName}_main_page`;
      lines.push(`${indent}lv_obj_t *${mainPageVar} = lv_menu_page_create(${varName}, "${props.headerTitle || 'Menu'}");`);
      if (props.items) {
        props.items.split('\n').forEach((item, i) => {
          const contVar = `${varName}_item_${i}`;
          lines.push(`${indent}lv_obj_t *${contVar} = lv_menu_cont_create(${mainPageVar});`);
          lines.push(`${indent}lv_obj_t *${contVar}_label = lv_label_create(${contVar});`);
          lines.push(`${indent}lv_label_set_text(${contVar}_label, "${item.trim()}");`);
        });
      }
      lines.push(`${indent}lv_menu_set_page(${varName}, ${mainPageVar});`);
      break;
    }

    case 'win': {
      lines.push(`${indent}/* Create window: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_win_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      if (props.title) lines.push(`${indent}lv_win_add_title(${varName}, "${props.title}");`);
      if (props.headerBgColor) lines.push(`${indent}lv_obj_set_style_bg_color(lv_win_get_header(${varName}), ${colorToLvglHex(props.headerBgColor)}, 0);`);
      if (props.bgColor) lines.push(`${indent}lv_obj_set_style_bg_color(lv_win_get_content(${varName}), ${colorToLvglHex(props.bgColor)}, 0);`);
      break;
    }

    case 'list': {
      lines.push(`${indent}/* Create list: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_list_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      if (props.bgColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.bgColor)}, 0);`);
      if (props.items) {
        props.items.split('\n').forEach((item) => {
          lines.push(`${indent}lv_list_add_button(${varName}, NULL, "${item.trim()}");`);
        });
      }
      break;
    }

    case 'msgbox': {
      lines.push(`${indent}/* Create message box: ${name} */`);
      const btns = props.buttons ? props.buttons.split('\n').map(b => `"${b.trim()}"`).join(', ') : '"OK"';
      lines.push(`${indent}static const char *${varName}_btns[] = {${btns}, ""};`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_msgbox_create(${parentVar});`);
      lines.push(`${indent}lv_msgbox_add_title(${varName}, "${props.title || 'Notice'}");`);
      lines.push(`${indent}lv_msgbox_add_text(${varName}, "${props.text || ''}");`);
      if (props.buttons) {
        props.buttons.split('\n').forEach((btn) => {
          lines.push(`${indent}lv_msgbox_add_footer_button(${varName}, "${btn.trim()}");`);
        });
      }
      if (props.closeButton) lines.push(`${indent}lv_msgbox_add_close_button(${varName});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      break;
    }

    case 'buttonmatrix': {
      lines.push(`${indent}/* Create button matrix: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_buttonmatrix_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      if (props.map) {
        // Parse map: rows separated by \n, buttons by comma
        const mapRows = props.map.split('\n');
        const mapEntries = [];
        mapRows.forEach((row, i) => {
          row.split(',').forEach(btn => mapEntries.push(`"${btn.trim()}"`));
          if (i < mapRows.length - 1) mapEntries.push('"\\n"');
        });
        mapEntries.push('""');
        lines.push(`${indent}static const char *${varName}_map[] = {${mapEntries.join(', ')}};`);
        lines.push(`${indent}lv_buttonmatrix_set_map(${varName}, ${varName}_map);`);
      }
      if (props.oneCheck) lines.push(`${indent}lv_buttonmatrix_set_one_checked(${varName}, true);`);
      if (props.btnColor) lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglHex(props.btnColor)}, LV_PART_ITEMS);`);
      if (props.textColor) lines.push(`${indent}lv_obj_set_style_text_color(${varName}, ${colorToLvglHex(props.textColor)}, LV_PART_ITEMS);`);
      break;
    }

    case 'calendar': {
      lines.push(`${indent}/* Create calendar: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_calendar_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      lines.push(`${indent}lv_calendar_set_showed_date(${varName}, ${props.year || 2026}, ${props.month || 1});`);
      lines.push(`${indent}lv_calendar_set_today_date(${varName}, ${props.year || 2026}, ${props.month || 1}, ${props.day || 1});`);
      if (props.showHeader) lines.push(`${indent}lv_calendar_header_arrow_create(${varName});`);
      break;
    }

    case 'line': {
      lines.push(`${indent}/* Create line: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_line_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      if (props.points) {
        const pointPairs = props.points.split(' ').map(p => p.split(','));
        lines.push(`${indent}static lv_point_precise_t ${varName}_points[] = {`);
        pointPairs.forEach((p, i) => {
          const comma = i < pointPairs.length - 1 ? ',' : '';
          lines.push(`${indent}    {${p[0]}, ${p[1]}}${comma}`);
        });
        lines.push(`${indent}};`);
        lines.push(`${indent}lv_line_set_points(${varName}, ${varName}_points, ${pointPairs.length});`);
      }
      if (props.lineColor) lines.push(`${indent}lv_obj_set_style_line_color(${varName}, ${colorToLvglHex(props.lineColor)}, 0);`);
      if (props.lineWidth) lines.push(`${indent}lv_obj_set_style_line_width(${varName}, ${props.lineWidth}, 0);`);
      if (props.rounded) lines.push(`${indent}lv_obj_set_style_line_rounded(${varName}, true, 0);`);
      break;
    }

    case 'span': {
      lines.push(`${indent}/* Create span group: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_spangroup_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      const spanModeMap = { wrap: 'LV_SPAN_OVERFLOW_WRAP', expand: 'LV_SPAN_OVERFLOW_EXPAND', break: 'LV_SPAN_OVERFLOW_BREAK', clip: 'LV_SPAN_OVERFLOW_CLIP' };
      if (props.mode) lines.push(`${indent}lv_spangroup_set_overflow(${varName}, ${spanModeMap[props.mode] || 'LV_SPAN_OVERFLOW_WRAP'});`);
      if (props.spans) {
        props.spans.split('\n').forEach((spanDef, i) => {
          const parts = spanDef.split('|');
          const text = parts[0] || '';
          const size = parts[1] || '14';
          const color = parts[2] || '#000000';
          const spanVar = `${varName}_span_${i}`;
          lines.push(`${indent}lv_span_t *${spanVar} = lv_spangroup_new_span(${varName});`);
          lines.push(`${indent}lv_span_set_text(${spanVar}, "${text.trim()}");`);
          lines.push(`${indent}lv_style_set_text_font(&${spanVar}->style, &lv_font_montserrat_${size.trim()});`);
          lines.push(`${indent}lv_style_set_text_color(&${spanVar}->style, ${colorToLvglHex(color.trim())});`);
        });
      }
      lines.push(`${indent}lv_spangroup_refr_mode(${varName});`);
      break;
    }

    default:
      lines.push(`${indent}/* Unknown widget type: ${type} */`);
  }

  // Add common style properties
  lines.push(...generateCommonStyleCode(varName, props, indent));

  // Add event handlers
  if (events && events.length > 0) {
    events.forEach((event) => {
      lines.push(`${indent}lv_obj_add_event_cb(${varName}, ${sanitizeIdentifier(event.callback)}, ${event.type}, NULL);`);
    });
  }

  lines.push('');

  // Add animations
  if (animations && animations.length > 0) {
    animations.forEach((animation) => {
      lines.push(generateAnimationCode(widget, animation, indent));
      lines.push('');
    });
  }

  return lines.join('\n');
}

function getWidgetParentVarName(widget, widgets) {
  if (!widget.parentId) {
    return 'parent';
  }
  const parentWidget = widgets.find(w => w.id === widget.parentId);
  return parentWidget ? sanitizeIdentifier(parentWidget.name) : 'parent';
}

export async function generateCCode(projectData, architecture = DEFAULT_ARCHITECTURE) {
  const { pages } = projectData;

  const isMultiPage = pages && pages.length > 0;

  if (isMultiPage) {
    return await generateMultiPageCCode(projectData, architecture);
  }

  return await generateSinglePageCCode(projectData, architecture);
}

async function generateSinglePageCCode(projectData, architecture = DEFAULT_ARCHITECTURE) {
  const { projectName, widgets, canvasSize } = projectData;
  const functionName = sanitizeIdentifier(projectName || 'ui') + '_create';

  const sortedWidgets = [...widgets].sort((a, b) => {
    if (!a.parentId && b.parentId) return -1;
    if (a.parentId && !b.parentId) return 1;
    return 0;
  });

  const eventCallbacksSet = new Set();
  sortedWidgets.forEach((widget) => {
    if (widget.events && widget.events.length > 0) {
      widget.events.forEach((event) => {
        const callbackStr = JSON.stringify({
          name: sanitizeIdentifier(event.callback),
          type: event.type,
          code: event.code || '// TODO: Implement event handler'
        });
        eventCallbacksSet.add(callbackStr);
      });
    }
  });

  const eventCallbacks = Array.from(eventCallbacksSet).map(str => JSON.parse(str));

  const widgetCodes = sortedWidgets.map((widget) =>
    generateWidgetCode(widget, sortedWidgets, '    ')
  );

  const templateData = {
    projectName: projectName || 'Untitled',
    generatedDate: new Date().toISOString(),
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
    functionName,
    hasEventCallbacks: eventCallbacks.length > 0,
    eventCallbacks,
    widgets: widgetCodes,
  };

  const template = await loadTemplate('c', architecture);
  return template(templateData);
}

async function generateMultiPageCCode(projectData, architecture = DEFAULT_ARCHITECTURE) {
  const { projectName, pages } = projectData;
  const baseName = sanitizeIdentifier(projectName || 'ui');

  const allEventCallbacksSet = new Set();
  pages.forEach((page) => {
    page.widgets?.forEach((widget) => {
      if (widget.events && widget.events.length > 0) {
        widget.events.forEach((event) => {
          const callbackStr = JSON.stringify({
            name: sanitizeIdentifier(event.callback),
            type: event.type,
            code: event.code || '// TODO: Implement event handler'
          });
          allEventCallbacksSet.add(callbackStr);
        });
      }
    });
  });

  const eventCallbacks = Array.from(allEventCallbacksSet).map(str => JSON.parse(str));

  const pagesData = pages.map((page) => {
    const pageFunctionName = `${baseName}_create_${sanitizeIdentifier(page.name)}`;
    const pageWidgets = page.widgets || [];

    const sortedWidgets = [...pageWidgets].sort((a, b) => {
      if (!a.parentId && b.parentId) return -1;
      if (a.parentId && !b.parentId) return 1;
      return 0;
    });

    const widgetCodes = sortedWidgets.map((widget) =>
      generateWidgetCode(widget, sortedWidgets, '    ')
    );

    return {
      name: page.name,
      functionName: pageFunctionName,
      width: page.canvasSize.width,
      height: page.canvasSize.height,
      widgetCount: pageWidgets.length,
      widgets: widgetCodes,
    };
  });

  const templateData = {
    projectName: projectName || 'Untitled',
    generatedDate: new Date().toISOString(),
    pageCount: pages.length,
    lastPageIndex: pages.length - 1,
    baseName,
    hasEventCallbacks: eventCallbacks.length > 0,
    eventCallbacks,
    pages: pagesData,
  };

  const template = await loadTemplate('c_multipage', architecture);
  return template(templateData);
}

export default generateCCode;
