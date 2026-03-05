// MicroPython Code Generator for LVGL 9.3
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

function colorToLvglColor(color) {
  const hex = color.replace('#', '');
  return `lv.color_hex(0x${hex})`;
}

function sanitizeIdentifier(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

function getWidgetParentVarName(widget, widgets) {
  if (!widget.parentId) {
    return 'parent';
  }
  const parentWidget = widgets.find(w => w.id === widget.parentId);
  return parentWidget ? sanitizeIdentifier(parentWidget.name) : 'parent';
}

function generateCommonStyleCode(varName, props, indent = '    ') {
  const lines = [];

  if (props.opacity !== undefined && props.opacity !== 255) {
    lines.push(`${indent}${varName}.set_style_opa(${props.opacity}, 0)`);
  }
  if (props.bgOpa !== undefined) {
    lines.push(`${indent}${varName}.set_style_bg_opa(${props.bgOpa}, 0)`);
  }

  // Padding
  if (props.padTop) lines.push(`${indent}${varName}.set_style_pad_top(${props.padTop}, 0)`);
  if (props.padBottom) lines.push(`${indent}${varName}.set_style_pad_bottom(${props.padBottom}, 0)`);
  if (props.padLeft) lines.push(`${indent}${varName}.set_style_pad_left(${props.padLeft}, 0)`);
  if (props.padRight) lines.push(`${indent}${varName}.set_style_pad_right(${props.padRight}, 0)`);
  if (props.padRow) lines.push(`${indent}${varName}.set_style_pad_row(${props.padRow}, 0)`);
  if (props.padColumn) lines.push(`${indent}${varName}.set_style_pad_column(${props.padColumn}, 0)`);

  // Shadow
  if (props.shadowWidth) {
    lines.push(`${indent}${varName}.set_style_shadow_width(${props.shadowWidth}, 0)`);
    if (props.shadowColor) lines.push(`${indent}${varName}.set_style_shadow_color(${colorToLvglColor(props.shadowColor)}, 0)`);
    if (props.shadowOffsetX) lines.push(`${indent}${varName}.set_style_shadow_offset_x(${props.shadowOffsetX}, 0)`);
    if (props.shadowOffsetY) lines.push(`${indent}${varName}.set_style_shadow_offset_y(${props.shadowOffsetY}, 0)`);
    if (props.shadowSpread) lines.push(`${indent}${varName}.set_style_shadow_spread(${props.shadowSpread}, 0)`);
  }

  // Outline
  if (props.outlineWidth) {
    lines.push(`${indent}${varName}.set_style_outline_width(${props.outlineWidth}, 0)`);
    if (props.outlineColor) lines.push(`${indent}${varName}.set_style_outline_color(${colorToLvglColor(props.outlineColor)}, 0)`);
    if (props.outlinePad) lines.push(`${indent}${varName}.set_style_outline_pad(${props.outlinePad}, 0)`);
  }

  // Transform
  if (props.transformRotation) lines.push(`${indent}${varName}.set_style_transform_rotation(${props.transformRotation}, 0)`);
  if (props.transformScaleX) lines.push(`${indent}${varName}.set_style_transform_scale_x(${props.transformScaleX}, 0)`);
  if (props.transformScaleY) lines.push(`${indent}${varName}.set_style_transform_scale_y(${props.transformScaleY}, 0)`);
  if (props.transformPivotX) lines.push(`${indent}${varName}.set_style_transform_pivot_x(${props.transformPivotX}, 0)`);
  if (props.transformPivotY) lines.push(`${indent}${varName}.set_style_transform_pivot_y(${props.transformPivotY}, 0)`);

  // Flex layout
  if (props.flexFlow && props.flexFlow !== 'none') {
    const mpFlexFlow = props.flexFlow.replace('LV_FLEX_FLOW_', '');
    lines.push(`${indent}${varName}.set_flex_flow(lv.FLEX_FLOW.${mpFlexFlow})`);
    if (props.flexMainPlace && props.flexMainPlace !== 'none') {
      const mpMain = props.flexMainPlace.replace('LV_FLEX_ALIGN_', '');
      const mpCross = (props.flexCrossPlace || 'LV_FLEX_ALIGN_START').replace('LV_FLEX_ALIGN_', '');
      lines.push(`${indent}${varName}.set_flex_align(lv.FLEX_ALIGN.${mpMain}, lv.FLEX_ALIGN.${mpCross}, lv.FLEX_ALIGN.${mpCross})`);
    }
  }

  // Scrollbar
  if (props.scrollbarMode && props.scrollbarMode !== 'LV_SCROLLBAR_MODE_AUTO') {
    const mpScroll = props.scrollbarMode.replace('LV_SCROLLBAR_MODE_', '');
    lines.push(`${indent}${varName}.set_scrollbar_mode(lv.SCROLLBAR_MODE.${mpScroll})`);
  }
  if (props.scrollDir) {
    const mpDir = props.scrollDir.replace('LV_DIR_', '');
    lines.push(`${indent}${varName}.set_scroll_dir(lv.DIR.${mpDir})`);
  }

  // Flags
  if (props.hidden) lines.push(`${indent}${varName}.add_flag(lv.OBJ_FLAG.HIDDEN)`);
  if (props.clickable === false) lines.push(`${indent}${varName}.remove_flag(lv.OBJ_FLAG.CLICKABLE)`);
  if (props.disabled) lines.push(`${indent}${varName}.add_state(lv.STATE.DISABLED)`);

  return lines;
}

function generateAnimationCode(widget, animation, indent = '    ') {
  const varName = sanitizeIdentifier(widget.name);
  const animVarName = `${varName}_anim_${animation.id.slice(-4)}`;
  const lines = [];

  lines.push(`${indent}# Animation: ${animation.type}`);
  lines.push(`${indent}${animVarName} = lv.anim_t()`);
  lines.push(`${indent}${animVarName}.init()`);
  lines.push(`${indent}${animVarName}.set_var(${varName})`);
  lines.push(`${indent}${animVarName}.set_time(${animation.duration})`);
  lines.push(`${indent}${animVarName}.set_delay(${animation.delay})`);

  if (animation.repeat > 0) {
    lines.push(`${indent}${animVarName}.set_repeat_count(${animation.repeat})`);
  }

  if (animation.playback) {
    lines.push(`${indent}${animVarName}.set_playback_time(${animation.duration})`);
  }

  lines.push(`${indent}${animVarName}.set_values(${animation.startValue}, ${animation.endValue})`);

  const pathName = animation.path.replace('lv_anim_path_', '');
  lines.push(`${indent}${animVarName}.set_path_cb(lv.anim_t.path_${pathName})`);

  switch (animation.type) {
    case 'move_x':
      lines.push(`${indent}${animVarName}.set_custom_exec_cb(lambda a, val: ${varName}.set_x(val))`);
      break;
    case 'move_y':
      lines.push(`${indent}${animVarName}.set_custom_exec_cb(lambda a, val: ${varName}.set_y(val))`);
      break;
    case 'width':
      lines.push(`${indent}${animVarName}.set_custom_exec_cb(lambda a, val: ${varName}.set_width(val))`);
      break;
    case 'height':
      lines.push(`${indent}${animVarName}.set_custom_exec_cb(lambda a, val: ${varName}.set_height(val))`);
      break;
    case 'fade_in':
    case 'fade_out':
      lines.push(`${indent}${animVarName}.set_custom_exec_cb(lambda a, val: ${varName}.set_style_opa(val, 0))`);
      break;
    default:
      lines.push(`${indent}# Custom animation type: ${animation.type}`);
  }

  lines.push(`${indent}lv.anim_t.start(${animVarName})`);

  return lines.join('\n');
}

function generateWidgetCode(widget, widgets, indent = '    ') {
  const { type, name, props, events, animations } = widget;
  const varName = sanitizeIdentifier(name);
  const parentVar = getWidgetParentVarName(widget, widgets);
  const lines = [];

  switch (type) {
    case 'button': {
      lines.push(`${indent}# Create button: ${name}`);
      lines.push(`${indent}${varName} = lv.button(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      if (props.bgColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.bgColor)}, 0)`);
      if (props.radius !== undefined) lines.push(`${indent}${varName}.set_style_radius(${props.radius}, 0)`);
      if (props.text) {
        const labelVar = `${varName}_label`;
        lines.push(`${indent}${labelVar} = lv.label(${varName})`);
        lines.push(`${indent}${labelVar}.set_text("${props.text}")`);
        lines.push(`${indent}${labelVar}.center()`);
        if (props.textColor) lines.push(`${indent}${labelVar}.set_style_text_color(${colorToLvglColor(props.textColor)}, 0)`);
      }
      break;
    }

    case 'label': {
      lines.push(`${indent}# Create label: ${name}`);
      lines.push(`${indent}${varName} = lv.label(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      lines.push(`${indent}${varName}.set_text("${props.text || 'Label'}")`);
      if (props.textColor) lines.push(`${indent}${varName}.set_style_text_color(${colorToLvglColor(props.textColor)}, 0)`);
      if (props.longMode && props.longMode !== 'LV_LABEL_LONG_WRAP') {
        const mpLongMode = props.longMode.replace('LV_LABEL_LONG_', '');
        lines.push(`${indent}${varName}.set_long_mode(lv.label.LONG.${mpLongMode})`);
      }
      if (props.textAlign) {
        const mpAlign = props.textAlign.replace('LV_TEXT_ALIGN_', '');
        lines.push(`${indent}${varName}.set_style_text_align(lv.TEXT_ALIGN.${mpAlign}, 0)`);
      }
      if (props.recolor) lines.push(`${indent}${varName}.set_recolor(True)`);
      break;
    }

    case 'slider': {
      lines.push(`${indent}# Create slider: ${name}`);
      lines.push(`${indent}${varName} = lv.slider(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      lines.push(`${indent}${varName}.set_range(${props.min || 0}, ${props.max || 100})`);
      lines.push(`${indent}${varName}.set_value(${props.value || 50}, lv.ANIM.OFF)`);
      if (props.indicatorColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.indicatorColor)}, lv.PART.INDICATOR)`);
      if (props.knobColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.knobColor)}, lv.PART.KNOB)`);
      if (props.mode === 'symmetrical') lines.push(`${indent}${varName}.set_mode(lv.slider.MODE.SYMMETRICAL)`);
      if (props.mode === 'range' || props.isRange) {
        lines.push(`${indent}${varName}.set_mode(lv.slider.MODE.RANGE)`);
        if (props.leftValue !== undefined) lines.push(`${indent}${varName}.set_left_value(${props.leftValue}, lv.ANIM.OFF)`);
      }
      break;
    }

    case 'switch': {
      lines.push(`${indent}# Create switch: ${name}`);
      // 'switch' is a reserved keyword in Python, LVGL MicroPython uses lv.switch
      lines.push(`${indent}${varName} = lv.switch(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      if (props.checked) lines.push(`${indent}${varName}.add_state(lv.STATE.CHECKED)`);
      if (props.onColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.onColor)}, lv.PART.INDICATOR | lv.STATE.CHECKED)`);
      if (props.offColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.offColor)}, lv.PART.INDICATOR)`);
      if (props.knobColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.knobColor)}, lv.PART.KNOB)`);
      if (props.disabled) lines.push(`${indent}${varName}.add_state(lv.STATE.DISABLED)`);
      break;
    }

    case 'checkbox': {
      lines.push(`${indent}# Create checkbox: ${name}`);
      lines.push(`${indent}${varName} = lv.checkbox(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_text("${props.text || 'Checkbox'}")`);
      if (props.checked) lines.push(`${indent}${varName}.add_state(lv.STATE.CHECKED)`);
      if (props.textColor) lines.push(`${indent}${varName}.set_style_text_color(${colorToLvglColor(props.textColor)}, 0)`);
      if (props.checkedColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.checkedColor)}, lv.PART.INDICATOR | lv.STATE.CHECKED)`);
      if (props.disabled) lines.push(`${indent}${varName}.add_state(lv.STATE.DISABLED)`);
      break;
    }

    case 'textarea': {
      lines.push(`${indent}# Create textarea: ${name}`);
      lines.push(`${indent}${varName} = lv.textarea(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      if (props.text) lines.push(`${indent}${varName}.set_text("${props.text}")`);
      if (props.placeholder) lines.push(`${indent}${varName}.set_placeholder_text("${props.placeholder}")`);
      if (props.oneLine) lines.push(`${indent}${varName}.set_one_line(True)`);
      if (props.password) lines.push(`${indent}${varName}.set_password_mode(True)`);
      if (props.maxLength > 0) lines.push(`${indent}${varName}.set_max_length(${props.maxLength})`);
      if (props.acceptedChars) lines.push(`${indent}${varName}.set_accepted_chars("${props.acceptedChars}")`);
      if (props.bgColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.bgColor)}, 0)`);
      if (props.textColor) lines.push(`${indent}${varName}.set_style_text_color(${colorToLvglColor(props.textColor)}, 0)`);
      break;
    }

    case 'dropdown': {
      lines.push(`${indent}# Create dropdown: ${name}`);
      lines.push(`${indent}${varName} = lv.dropdown(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      if (props.options) lines.push(`${indent}${varName}.set_options("${props.options.replace(/\n/g, '\\n')}")`);
      if (props.selected) lines.push(`${indent}${varName}.set_selected(${props.selected})`);
      if (props.dir && props.dir !== 'LV_DIR_BOTTOM') {
        const mpDir = props.dir.replace('LV_DIR_', '');
        lines.push(`${indent}${varName}.set_dir(lv.DIR.${mpDir})`);
      }
      if (props.bgColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.bgColor)}, 0)`);
      if (props.textColor) lines.push(`${indent}${varName}.set_style_text_color(${colorToLvglColor(props.textColor)}, 0)`);
      break;
    }

    case 'roller': {
      lines.push(`${indent}# Create roller: ${name}`);
      lines.push(`${indent}${varName} = lv.roller(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      const mpRollerMode = props.infinite ? 'lv.roller.MODE.INFINITE' : 'lv.roller.MODE.NORMAL';
      if (props.options) lines.push(`${indent}${varName}.set_options("${props.options.replace(/\n/g, '\\n')}", ${mpRollerMode})`);
      if (props.selected) lines.push(`${indent}${varName}.set_selected(${props.selected}, lv.ANIM.OFF)`);
      if (props.visibleRows) lines.push(`${indent}${varName}.set_visible_row_count(${props.visibleRows})`);
      if (props.selectedColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.selectedColor)}, lv.PART.SELECTED)`);
      if (props.textColor) lines.push(`${indent}${varName}.set_style_text_color(${colorToLvglColor(props.textColor)}, 0)`);
      break;
    }

    case 'spinbox': {
      lines.push(`${indent}# Create spinbox: ${name}`);
      lines.push(`${indent}${varName} = lv.spinbox(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      lines.push(`${indent}${varName}.set_range(${props.min || 0}, ${props.max || 999})`);
      lines.push(`${indent}${varName}.set_value(${props.value || 0})`);
      if (props.digitCount) lines.push(`${indent}${varName}.set_digit_count(${props.digitCount})`);
      if (props.separatorPos) lines.push(`${indent}${varName}.set_separator_position(${props.separatorPos})`);
      if (props.step) lines.push(`${indent}${varName}.set_step(${props.step})`);
      if (props.rollover) lines.push(`${indent}${varName}.set_rollover(True)`);
      break;
    }

    case 'keyboard': {
      lines.push(`${indent}# Create keyboard: ${name}`);
      lines.push(`${indent}${varName} = lv.keyboard(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      const kbModeMap = { 'text_lower': 'TEXT_LOWER', 'text_upper': 'TEXT_UPPER', 'text_special': 'SPECIAL', 'number': 'NUMBER' };
      if (props.mode && kbModeMap[props.mode]) lines.push(`${indent}${varName}.set_mode(lv.keyboard.MODE.${kbModeMap[props.mode]})`);
      if (props.popover === false) lines.push(`${indent}${varName}.set_popovers(False)`);
      break;
    }

    case 'panel': {
      lines.push(`${indent}# Create panel: ${name}`);
      lines.push(`${indent}${varName} = lv.obj(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      if (props.bgColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.bgColor)}, 0)`);
      if (props.borderWidth) {
        lines.push(`${indent}${varName}.set_style_border_width(${props.borderWidth}, 0)`);
        if (props.borderColor) lines.push(`${indent}${varName}.set_style_border_color(${colorToLvglColor(props.borderColor)}, 0)`);
      }
      if (props.radius !== undefined) lines.push(`${indent}${varName}.set_style_radius(${props.radius}, 0)`);
      break;
    }

    case 'bar': {
      lines.push(`${indent}# Create progress bar: ${name}`);
      lines.push(`${indent}${varName} = lv.bar(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      lines.push(`${indent}${varName}.set_range(${props.min || 0}, ${props.max || 100})`);
      const animFlag = props.animated !== false ? 'lv.ANIM.ON' : 'lv.ANIM.OFF';
      lines.push(`${indent}${varName}.set_value(${props.value || 50}, ${animFlag})`);
      if (props.mode && props.mode !== 'LV_BAR_MODE_NORMAL') {
        const mpMode = props.mode.replace('LV_BAR_MODE_', '');
        lines.push(`${indent}${varName}.set_mode(lv.bar.MODE.${mpMode})`);
      }
      if (props.indicatorColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.indicatorColor)}, lv.PART.INDICATOR)`);
      if (props.startValue && props.mode === 'LV_BAR_MODE_RANGE') {
        lines.push(`${indent}${varName}.set_start_value(${props.startValue}, lv.ANIM.OFF)`);
      }
      break;
    }

    case 'arc': {
      lines.push(`${indent}# Create arc: ${name}`);
      lines.push(`${indent}${varName} = lv.arc(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      lines.push(`${indent}${varName}.set_range(${props.min || 0}, ${props.max || 100})`);
      lines.push(`${indent}${varName}.set_value(${props.value || 50})`);
      if (props.startAngle !== undefined && props.endAngle !== undefined) {
        lines.push(`${indent}${varName}.set_bg_angles(${props.startAngle}, ${props.endAngle})`);
      }
      if (props.rotation) lines.push(`${indent}${varName}.set_rotation(${props.rotation})`);
      if (props.mode && props.mode !== 'LV_ARC_MODE_NORMAL') {
        const mpMode = props.mode.replace('LV_ARC_MODE_', '');
        lines.push(`${indent}${varName}.set_mode(lv.arc.MODE.${mpMode})`);
      }
      if (props.lineWidth) {
        lines.push(`${indent}${varName}.set_style_arc_width(${props.lineWidth}, lv.PART.MAIN)`);
        lines.push(`${indent}${varName}.set_style_arc_width(${props.lineWidth}, lv.PART.INDICATOR)`);
      }
      if (props.indicatorColor) lines.push(`${indent}${varName}.set_style_arc_color(${colorToLvglColor(props.indicatorColor)}, lv.PART.INDICATOR)`);
      if (props.knobColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.knobColor)}, lv.PART.KNOB)`);
      break;
    }

    case 'spinner': {
      lines.push(`${indent}# Create spinner: ${name}`);
      // LVGL 9.3: lv_spinner_create(parent) then set params separately
      lines.push(`${indent}${varName} = lv.spinner(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      lines.push(`${indent}${varName}.set_anim_params(${props.speed || 1000}, ${props.arcLength || 60})`);
      if (props.lineWidth) {
        lines.push(`${indent}${varName}.set_style_arc_width(${props.lineWidth}, lv.PART.MAIN)`);
        lines.push(`${indent}${varName}.set_style_arc_width(${props.lineWidth}, lv.PART.INDICATOR)`);
      }
      if (props.color) lines.push(`${indent}${varName}.set_style_arc_color(${colorToLvglColor(props.color)}, lv.PART.INDICATOR)`);
      break;
    }

    case 'led': {
      lines.push(`${indent}# Create LED: ${name}`);
      lines.push(`${indent}${varName} = lv.led(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      if (props.color) lines.push(`${indent}${varName}.set_color(${colorToLvglColor(props.color)})`);
      if (props.brightness !== undefined) lines.push(`${indent}${varName}.set_brightness(${props.brightness})`);
      break;
    }

    case 'chart': {
      lines.push(`${indent}# Create chart: ${name}`);
      lines.push(`${indent}${varName} = lv.chart(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      const chartTypeMap = { line: 'LINE', bar: 'BAR', scatter: 'SCATTER' };
      lines.push(`${indent}${varName}.set_type(lv.chart.TYPE.${chartTypeMap[props.chartType] || 'LINE'})`);
      if (props.pointCount) lines.push(`${indent}${varName}.set_point_count(${props.pointCount})`);
      if (props.divLineCount) lines.push(`${indent}${varName}.set_div_line_count(${props.divLineCount}, ${props.divLineCountSec || 5})`);
      lines.push(`${indent}${varName}.set_range(lv.chart.AXIS.PRIMARY_Y, ${props.rangeYMin || 0}, ${props.rangeYMax || 100})`);
      if (props.updateMode === 'circular') lines.push(`${indent}${varName}.set_update_mode(lv.chart.UPDATE_MODE.CIRCULAR)`);
      const serVar = `${varName}_ser1`;
      lines.push(`${indent}${serVar} = ${varName}.add_series(${colorToLvglColor(props.lineColor || '#2196F3')}, lv.chart.AXIS.PRIMARY_Y)`);
      if (props.data) {
        props.data.split(',').forEach((val) => {
          lines.push(`${indent}${varName}.set_next_value(${serVar}, ${val.trim()})`);
        });
      }
      if (props.data2) {
        const ser2Var = `${varName}_ser2`;
        lines.push(`${indent}${ser2Var} = ${varName}.add_series(${colorToLvglColor(props.lineColor2 || '#FF5722')}, lv.chart.AXIS.PRIMARY_Y)`);
        props.data2.split(',').forEach((val) => {
          lines.push(`${indent}${varName}.set_next_value(${ser2Var}, ${val.trim()})`);
        });
      }
      if (props.bgColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.bgColor)}, 0)`);
      break;
    }

    case 'table': {
      lines.push(`${indent}# Create table: ${name}`);
      lines.push(`${indent}${varName} = lv.table(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      const cols = props.cols || 3;
      lines.push(`${indent}${varName}.set_column_count(${cols})`);
      if (props.colWidths) {
        props.colWidths.split(',').forEach((w, i) => {
          lines.push(`${indent}${varName}.set_column_width(${i}, ${w.trim()})`);
        });
      }
      if (props.headerRow) {
        props.headerRow.split(',').forEach((cell, c) => {
          lines.push(`${indent}${varName}.set_cell_value(0, ${c}, "${cell.trim()}")`);
        });
      }
      if (props.cellData) {
        props.cellData.split('\n').forEach((row, r) => {
          row.split(',').forEach((cell, c) => {
            lines.push(`${indent}${varName}.set_cell_value(${r + 1}, ${c}, "${cell.trim()}")`);
          });
        });
      }
      break;
    }

    case 'scale': {
      lines.push(`${indent}# Create scale: ${name}`);
      lines.push(`${indent}${varName} = lv.scale(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      const scaleModeMap = { horizontal: 'HORIZONTAL_BOTTOM', vertical: 'VERTICAL_LEFT', round_inner: 'ROUND_INNER', round_outer: 'ROUND_OUTER' };
      lines.push(`${indent}${varName}.set_mode(lv.scale.MODE.${scaleModeMap[props.mode] || 'HORIZONTAL_BOTTOM'})`);
      lines.push(`${indent}${varName}.set_range(${props.min || 0}, ${props.max || 100})`);
      const totalTicks = ((props.max - props.min) / props.majorTickEvery) * (props.minorTickCount + 1) + 1;
      lines.push(`${indent}${varName}.set_total_tick_count(${Math.round(totalTicks)})`);
      lines.push(`${indent}${varName}.set_major_tick_every(${props.majorTickEvery || 10})`);
      if (props.labelShow === false) lines.push(`${indent}${varName}.set_label_show(False)`);
      if (props.lineColor) lines.push(`${indent}${varName}.set_style_line_color(${colorToLvglColor(props.lineColor)}, lv.PART.INDICATOR)`);
      if (props.textColor) lines.push(`${indent}${varName}.set_style_text_color(${colorToLvglColor(props.textColor)}, 0)`);
      break;
    }

    case 'image': {
      lines.push(`${indent}# Create image: ${name}`);
      lines.push(`${indent}${varName} = lv.image(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      if (props.src) lines.push(`${indent}${varName}.set_src("${props.src}")`);
      if (props.rotation) lines.push(`${indent}${varName}.set_rotation(${props.rotation})`);
      if (props.zoom && props.zoom !== 256) lines.push(`${indent}${varName}.set_scale(${props.zoom})`);
      if (props.pivotX || props.pivotY) lines.push(`${indent}${varName}.set_pivot(${props.pivotX || 0}, ${props.pivotY || 0})`);
      if (props.antialias === false) lines.push(`${indent}${varName}.set_antialias(False)`);
      break;
    }

    case 'imagebutton': {
      lines.push(`${indent}# Create image button: ${name}`);
      lines.push(`${indent}${varName} = lv.imagebutton(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      if (props.src) lines.push(`${indent}${varName}.set_src(lv.imagebutton.STATE.RELEASED, None, "${props.src}", None)`);
      if (props.bgColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.bgColor)}, 0)`);
      if (props.radius !== undefined) lines.push(`${indent}${varName}.set_style_radius(${props.radius}, 0)`);
      if (props.text) {
        const labelVar = `${varName}_label`;
        lines.push(`${indent}${labelVar} = lv.label(${varName})`);
        lines.push(`${indent}${labelVar}.set_text("${props.text}")`);
        lines.push(`${indent}${labelVar}.center()`);
        if (props.textColor) lines.push(`${indent}${labelVar}.set_style_text_color(${colorToLvglColor(props.textColor)}, 0)`);
      }
      break;
    }

    case 'tabview': {
      lines.push(`${indent}# Create tab view: ${name}`);
      lines.push(`${indent}${varName} = lv.tabview(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      const tabDirMap = { top: 'TOP', bottom: 'BOTTOM', left: 'LEFT', right: 'RIGHT' };
      lines.push(`${indent}${varName}.set_tab_bar_position(lv.DIR.${tabDirMap[props.tabPosition] || 'TOP'})`);
      lines.push(`${indent}${varName}.set_tab_bar_size(${props.tabBarSize || 40})`);
      if (props.tabs) {
        props.tabs.split('\n').forEach((tab) => {
          lines.push(`${indent}${varName}.add_tab("${tab.trim()}")`);
        });
      }
      if (props.activeTab) lines.push(`${indent}${varName}.set_active(${props.activeTab}, lv.ANIM.OFF)`);
      break;
    }

    case 'tileview': {
      lines.push(`${indent}# Create tile view: ${name}`);
      lines.push(`${indent}${varName} = lv.tileview(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      const tileRows = props.rows || 2;
      const tileCols = props.cols || 2;
      for (let r = 0; r < tileRows; r++) {
        for (let c = 0; c < tileCols; c++) {
          lines.push(`${indent}${varName}.add_tile(${c}, ${r}, lv.DIR.ALL)`);
        }
      }
      break;
    }

    case 'menu': {
      lines.push(`${indent}# Create menu: ${name}`);
      lines.push(`${indent}${varName} = lv.menu(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      if (props.bgColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.bgColor)}, 0)`);
      const mainPageVar = `${varName}_main_page`;
      lines.push(`${indent}${mainPageVar} = lv.menu_page(${varName}, "${props.headerTitle || 'Menu'}")`);
      if (props.items) {
        props.items.split('\n').forEach((item, i) => {
          const contVar = `${varName}_item_${i}`;
          lines.push(`${indent}${contVar} = lv.menu_cont(${mainPageVar})`);
          lines.push(`${indent}${contVar}_label = lv.label(${contVar})`);
          lines.push(`${indent}${contVar}_label.set_text("${item.trim()}")`);
        });
      }
      lines.push(`${indent}${varName}.set_page(${mainPageVar})`);
      break;
    }

    case 'win': {
      lines.push(`${indent}# Create window: ${name}`);
      lines.push(`${indent}${varName} = lv.win(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      if (props.title) lines.push(`${indent}${varName}.add_title("${props.title}")`);
      break;
    }

    case 'list': {
      lines.push(`${indent}# Create list: ${name}`);
      lines.push(`${indent}${varName} = lv.list(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      if (props.bgColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.bgColor)}, 0)`);
      if (props.items) {
        props.items.split('\n').forEach((item) => {
          lines.push(`${indent}${varName}.add_button(None, "${item.trim()}")`);
        });
      }
      break;
    }

    case 'msgbox': {
      lines.push(`${indent}# Create message box: ${name}`);
      lines.push(`${indent}${varName} = lv.msgbox(${parentVar})`);
      lines.push(`${indent}${varName}.add_title("${props.title || 'Notice'}")`);
      lines.push(`${indent}${varName}.add_text("${props.text || ''}")`);
      if (props.buttons) {
        props.buttons.split('\n').forEach((btn) => {
          lines.push(`${indent}${varName}.add_footer_button("${btn.trim()}")`);
        });
      }
      if (props.closeButton) lines.push(`${indent}${varName}.add_close_button()`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      break;
    }

    case 'buttonmatrix': {
      lines.push(`${indent}# Create button matrix: ${name}`);
      lines.push(`${indent}${varName} = lv.buttonmatrix(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      if (props.map) {
        const mapRows = props.map.split('\n');
        const mapEntries = [];
        mapRows.forEach((row, i) => {
          row.split(',').forEach(btn => mapEntries.push(`"${btn.trim()}"`));
          if (i < mapRows.length - 1) mapEntries.push('"\\n"');
        });
        mapEntries.push('""');
        lines.push(`${indent}${varName}_map = [${mapEntries.join(', ')}]`);
        lines.push(`${indent}${varName}.set_map(${varName}_map)`);
      }
      if (props.oneCheck) lines.push(`${indent}${varName}.set_one_checked(True)`);
      if (props.btnColor) lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.btnColor)}, lv.PART.ITEMS)`);
      if (props.textColor) lines.push(`${indent}${varName}.set_style_text_color(${colorToLvglColor(props.textColor)}, lv.PART.ITEMS)`);
      break;
    }

    case 'calendar': {
      lines.push(`${indent}# Create calendar: ${name}`);
      lines.push(`${indent}${varName} = lv.calendar(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      lines.push(`${indent}${varName}.set_showed_date(${props.year || 2026}, ${props.month || 1})`);
      lines.push(`${indent}${varName}.set_today_date(${props.year || 2026}, ${props.month || 1}, ${props.day || 1})`);
      if (props.showHeader) lines.push(`${indent}lv.calendar_header_arrow(${varName})`);
      break;
    }

    case 'line': {
      lines.push(`${indent}# Create line: ${name}`);
      lines.push(`${indent}${varName} = lv.line(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      if (props.points) {
        const pointPairs = props.points.split(' ').map(p => p.split(','));
        const pyPoints = pointPairs.map(p => `{"x": ${p[0]}, "y": ${p[1]}}`).join(', ');
        lines.push(`${indent}${varName}_points = [${pyPoints}]`);
        lines.push(`${indent}${varName}.set_points(${varName}_points, ${pointPairs.length})`);
      }
      if (props.lineColor) lines.push(`${indent}${varName}.set_style_line_color(${colorToLvglColor(props.lineColor)}, 0)`);
      if (props.lineWidth) lines.push(`${indent}${varName}.set_style_line_width(${props.lineWidth}, 0)`);
      if (props.rounded) lines.push(`${indent}${varName}.set_style_line_rounded(True, 0)`);
      break;
    }

    case 'span': {
      lines.push(`${indent}# Create span group: ${name}`);
      lines.push(`${indent}${varName} = lv.spangroup(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      const spanModeMap = { wrap: 'WRAP', expand: 'EXPAND', break: 'BREAK', clip: 'CLIP' };
      if (props.mode) lines.push(`${indent}${varName}.set_overflow(lv.SPAN_OVERFLOW.${spanModeMap[props.mode] || 'WRAP'})`);
      if (props.spans) {
        props.spans.split('\n').forEach((spanDef, i) => {
          const parts = spanDef.split('|');
          const text = parts[0] || '';
          const color = parts[2] || '#000000';
          const spanVar = `${varName}_span_${i}`;
          lines.push(`${indent}${spanVar} = ${varName}.new_span()`);
          lines.push(`${indent}${spanVar}.set_text("${text.trim()}")`);
          lines.push(`${indent}${spanVar}.style.set_text_color(${colorToLvglColor(color.trim())})`);
        });
      }
      lines.push(`${indent}${varName}.refr_mode()`);
      break;
    }

    default:
      lines.push(`${indent}# Unknown widget type: ${type}`);
  }

  // Add common style properties
  lines.push(...generateCommonStyleCode(varName, props, indent));

  // Add event handlers
  if (events && events.length > 0) {
    events.forEach((event) => {
      const eventType = event.type.replace('LV_EVENT_', '').toUpperCase();
      lines.push(`${indent}${varName}.add_event_cb(${sanitizeIdentifier(event.callback)}, lv.EVENT.${eventType}, None)`);
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

export async function generateMicroPythonCode(projectData, architecture = DEFAULT_ARCHITECTURE) {
  const { pages } = projectData;

  const isMultiPage = pages && pages.length > 0;

  if (isMultiPage) {
    return await generateMultiPageMicroPythonCode(projectData, architecture);
  }

  return await generateSinglePageMicroPythonCode(projectData, architecture);
}

async function generateSinglePageMicroPythonCode(projectData, architecture = DEFAULT_ARCHITECTURE) {
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
        const eventType = event.type.replace('LV_EVENT_', '').toUpperCase();
        const callbackStr = JSON.stringify({
          name: sanitizeIdentifier(event.callback),
          type: event.type,
          eventType: eventType,
          code: event.code || '# TODO: Implement event handler'
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

  const template = await loadTemplate('micropython', architecture);
  return template(templateData);
}

async function generateMultiPageMicroPythonCode(projectData, architecture = DEFAULT_ARCHITECTURE) {
  const { projectName, pages } = projectData;
  const baseName = sanitizeIdentifier(projectName || 'ui');

  const allEventCallbacksSet = new Set();
  pages.forEach((page) => {
    page.widgets?.forEach((widget) => {
      if (widget.events && widget.events.length > 0) {
        widget.events.forEach((event) => {
          const eventType = event.type.replace('LV_EVENT_', '').toUpperCase();
          const callbackStr = JSON.stringify({
            name: sanitizeIdentifier(event.callback),
            type: event.type,
            eventType: eventType,
            code: event.code || '# TODO: Implement event handler'
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

  const template = await loadTemplate('micropython_multipage', architecture);
  return template(templateData);
}

export default generateMicroPythonCode;
