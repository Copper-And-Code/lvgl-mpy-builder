// LVGL 9.3 Widget Definitions with properties and default values
// Updated for LVGL v9.3 API compatibility

export const WIDGET_TYPES = {
  // Basic widgets
  BUTTON: 'button',
  LABEL: 'label',
  PANEL: 'panel',
  // Input widgets
  SLIDER: 'slider',
  SWITCH: 'switch',
  CHECKBOX: 'checkbox',
  TEXTAREA: 'textarea',
  DROPDOWN: 'dropdown',
  ROLLER: 'roller',
  SPINBOX: 'spinbox',
  KEYBOARD: 'keyboard',
  // Display widgets
  BAR: 'bar',
  ARC: 'arc',
  SPINNER: 'spinner',
  LED: 'led',
  // Data widgets
  CHART: 'chart',
  TABLE: 'table',
  SCALE: 'scale',
  // Media widgets
  IMAGE: 'image',
  IMAGE_BUTTON: 'imagebutton',
  // Navigation widgets
  TABVIEW: 'tabview',
  TILEVIEW: 'tileview',
  MENU: 'menu',
  WIN: 'win',
  // Container/Layout widgets
  LIST: 'list',
  MSGBOX: 'msgbox',
  BUTTONMATRIX: 'buttonmatrix',
  CALENDAR: 'calendar',
  LINE: 'line',
  SPAN: 'span',
};

export const LVGL_ALIGN = {
  CENTER: 'LV_ALIGN_CENTER',
  TOP_LEFT: 'LV_ALIGN_TOP_LEFT',
  TOP_MID: 'LV_ALIGN_TOP_MID',
  TOP_RIGHT: 'LV_ALIGN_TOP_RIGHT',
  BOTTOM_LEFT: 'LV_ALIGN_BOTTOM_LEFT',
  BOTTOM_MID: 'LV_ALIGN_BOTTOM_MID',
  BOTTOM_RIGHT: 'LV_ALIGN_BOTTOM_RIGHT',
  LEFT_MID: 'LV_ALIGN_LEFT_MID',
  RIGHT_MID: 'LV_ALIGN_RIGHT_MID',
};

export const LVGL_FLEX_FLOW = {
  ROW: 'LV_FLEX_FLOW_ROW',
  COLUMN: 'LV_FLEX_FLOW_COLUMN',
  ROW_WRAP: 'LV_FLEX_FLOW_ROW_WRAP',
  COLUMN_WRAP: 'LV_FLEX_FLOW_COLUMN_WRAP',
  ROW_REVERSE: 'LV_FLEX_FLOW_ROW_REVERSE',
  COLUMN_REVERSE: 'LV_FLEX_FLOW_COLUMN_REVERSE',
};

export const LVGL_FLEX_ALIGN = {
  START: 'LV_FLEX_ALIGN_START',
  END: 'LV_FLEX_ALIGN_END',
  CENTER: 'LV_FLEX_ALIGN_CENTER',
  SPACE_EVENLY: 'LV_FLEX_ALIGN_SPACE_EVENLY',
  SPACE_AROUND: 'LV_FLEX_ALIGN_SPACE_AROUND',
  SPACE_BETWEEN: 'LV_FLEX_ALIGN_SPACE_BETWEEN',
};

export const LVGL_SCROLL = {
  OFF: 'LV_SCROLLBAR_MODE_OFF',
  ON: 'LV_SCROLLBAR_MODE_ON',
  ACTIVE: 'LV_SCROLLBAR_MODE_ACTIVE',
  AUTO: 'LV_SCROLLBAR_MODE_AUTO',
};

export const LVGL_TEXT_ALIGN = {
  LEFT: 'LV_TEXT_ALIGN_LEFT',
  CENTER: 'LV_TEXT_ALIGN_CENTER',
  RIGHT: 'LV_TEXT_ALIGN_RIGHT',
  AUTO: 'LV_TEXT_ALIGN_AUTO',
};

export const LVGL_LABEL_LONG_MODE = {
  WRAP: 'LV_LABEL_LONG_MODE_WRAP',
  DOT: 'LV_LABEL_LONG_MODE_DOTS',
  SCROLL: 'LV_LABEL_LONG_MODE_SCROLL',
  SCROLL_CIRCULAR: 'LV_LABEL_LONG_MODE_SCROLL_CIRCULAR',
  CLIP: 'LV_LABEL_LONG_MODE_CLIP',
};

export const LVGL_DIR = {
  NONE: 'LV_DIR_NONE',
  LEFT: 'LV_DIR_LEFT',
  RIGHT: 'LV_DIR_RIGHT',
  TOP: 'LV_DIR_TOP',
  BOTTOM: 'LV_DIR_BOTTOM',
  HOR: 'LV_DIR_HOR',
  VER: 'LV_DIR_VER',
  ALL: 'LV_DIR_ALL',
};

export const LVGL_BAR_MODE = {
  NORMAL: 'LV_BAR_MODE_NORMAL',
  SYMMETRICAL: 'LV_BAR_MODE_SYMMETRICAL',
  RANGE: 'LV_BAR_MODE_RANGE',
};

export const LVGL_ARC_MODE = {
  NORMAL: 'LV_ARC_MODE_NORMAL',
  SYMMETRICAL: 'LV_ARC_MODE_SYMMETRICAL',
  REVERSE: 'LV_ARC_MODE_REVERSE',
};

// Common style properties that can be added to any widget
export const commonStyleProperties = [
  { name: 'opacity', type: 'number', label: 'Opacity (0-255)', min: 0, max: 255 },
  { name: 'padTop', type: 'number', label: 'Padding Top' },
  { name: 'padBottom', type: 'number', label: 'Padding Bottom' },
  { name: 'padLeft', type: 'number', label: 'Padding Left' },
  { name: 'padRight', type: 'number', label: 'Padding Right' },
  { name: 'padRow', type: 'number', label: 'Pad Row (gap)' },
  { name: 'padColumn', type: 'number', label: 'Pad Column (gap)' },
  { name: 'shadowWidth', type: 'number', label: 'Shadow Width' },
  { name: 'shadowColor', type: 'color', label: 'Shadow Color' },
  { name: 'shadowOffsetX', type: 'number', label: 'Shadow Offset X' },
  { name: 'shadowOffsetY', type: 'number', label: 'Shadow Offset Y' },
  { name: 'shadowSpread', type: 'number', label: 'Shadow Spread' },
  { name: 'bgOpa', type: 'number', label: 'Bg Opacity (0-255)', min: 0, max: 255 },
  { name: 'borderOpa', type: 'number', label: 'Border Opacity (0-255)', min: 0, max: 255 },
  { name: 'outlineWidth', type: 'number', label: 'Outline Width' },
  { name: 'outlineColor', type: 'color', label: 'Outline Color' },
  { name: 'outlinePad', type: 'number', label: 'Outline Padding' },
  { name: 'transformRotation', type: 'number', label: 'Rotation (0.1 deg)' },
  { name: 'transformScaleX', type: 'number', label: 'Scale X (256=100%)' },
  { name: 'transformScaleY', type: 'number', label: 'Scale Y (256=100%)' },
  { name: 'transformPivotX', type: 'number', label: 'Pivot X' },
  { name: 'transformPivotY', type: 'number', label: 'Pivot Y' },
  { name: 'flexFlow', type: 'select', label: 'Flex Flow', options: ['none', ...Object.values(LVGL_FLEX_FLOW)] },
  { name: 'flexMainPlace', type: 'select', label: 'Flex Main Align', options: ['none', ...Object.values(LVGL_FLEX_ALIGN)] },
  { name: 'flexCrossPlace', type: 'select', label: 'Flex Cross Align', options: ['none', ...Object.values(LVGL_FLEX_ALIGN)] },
  { name: 'scrollbarMode', type: 'select', label: 'Scrollbar', options: Object.values(LVGL_SCROLL) },
  { name: 'scrollDir', type: 'select', label: 'Scroll Direction', options: Object.values(LVGL_DIR) },
  { name: 'hidden', type: 'boolean', label: 'Hidden' },
  { name: 'clickable', type: 'boolean', label: 'Clickable' },
  { name: 'disabled', type: 'boolean', label: 'Disabled' },
];

// Common position/size properties shared by all widgets
const positionProps = [
  { name: 'x', type: 'number', label: 'X Position' },
  { name: 'y', type: 'number', label: 'Y Position' },
  { name: 'width', type: 'number', label: 'Width' },
  { name: 'height', type: 'number', label: 'Height' },
];

export const widgetDefinitions = {
  // ==========================================
  // BASIC WIDGETS
  // ==========================================

  [WIDGET_TYPES.BUTTON]: {
    type: WIDGET_TYPES.BUTTON,
    name: 'Button',
    lvglType: 'lv_button',  // LVGL 9.3: lv_btn -> lv_button
    icon: '🔘',
    category: 'Basic',
    defaultProps: {
      x: 50, y: 50, width: 100, height: 40,
      text: 'Button',
      bgColor: '#2196F3',
      textColor: '#FFFFFF',
      fontSize: 14,
      radius: 5,
    },
    properties: [
      ...positionProps,
      { name: 'text', type: 'string', label: 'Text' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'textColor', type: 'color', label: 'Text Color' },
      { name: 'fontSize', type: 'number', label: 'Font Size' },
      { name: 'radius', type: 'number', label: 'Corner Radius' },
    ],
  },

  [WIDGET_TYPES.LABEL]: {
    type: WIDGET_TYPES.LABEL,
    name: 'Label',
    lvglType: 'lv_label',
    icon: '📝',
    category: 'Basic',
    defaultProps: {
      x: 50, y: 50, width: 120, height: 30,
      text: 'Label Text',
      textColor: '#000000',
      fontSize: 14,
      longMode: LVGL_LABEL_LONG_MODE.WRAP,
      textAlign: LVGL_TEXT_ALIGN.CENTER,
      recolor: false,
    },
    properties: [
      ...positionProps,
      { name: 'text', type: 'string', label: 'Text' },
      { name: 'textColor', type: 'color', label: 'Text Color' },
      { name: 'fontSize', type: 'number', label: 'Font Size' },
      { name: 'longMode', type: 'select', label: 'Long Mode', options: Object.values(LVGL_LABEL_LONG_MODE) },
      { name: 'textAlign', type: 'select', label: 'Text Alignment', options: Object.values(LVGL_TEXT_ALIGN) },
      { name: 'recolor', type: 'boolean', label: 'Recolor Enable' },
    ],
  },

  [WIDGET_TYPES.PANEL]: {
    type: WIDGET_TYPES.PANEL,
    name: 'Panel',
    lvglType: 'lv_obj',
    icon: '▭',
    category: 'Basic',
    defaultProps: {
      x: 50, y: 50, width: 200, height: 150,
      bgColor: '#F5F5F5',
      borderColor: '#BDBDBD',
      borderWidth: 2,
      radius: 5,
      flexFlow: 'none',
      flexMainPlace: 'none',
      flexCrossPlace: 'none',
      padTop: 0,
      padBottom: 0,
      padLeft: 0,
      padRight: 0,
      padRow: 0,
      padColumn: 0,
      scrollbarMode: LVGL_SCROLL.AUTO,
    },
    properties: [
      ...positionProps,
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'borderColor', type: 'color', label: 'Border Color' },
      { name: 'borderWidth', type: 'number', label: 'Border Width' },
      { name: 'radius', type: 'number', label: 'Corner Radius' },
      { name: 'flexFlow', type: 'select', label: 'Flex Flow', options: ['none', ...Object.values(LVGL_FLEX_FLOW)] },
      { name: 'flexMainPlace', type: 'select', label: 'Flex Main Align', options: ['none', ...Object.values(LVGL_FLEX_ALIGN)] },
      { name: 'flexCrossPlace', type: 'select', label: 'Flex Cross Align', options: ['none', ...Object.values(LVGL_FLEX_ALIGN)] },
      { name: 'padTop', type: 'number', label: 'Padding Top' },
      { name: 'padBottom', type: 'number', label: 'Padding Bottom' },
      { name: 'padLeft', type: 'number', label: 'Padding Left' },
      { name: 'padRight', type: 'number', label: 'Padding Right' },
      { name: 'padRow', type: 'number', label: 'Row Gap' },
      { name: 'padColumn', type: 'number', label: 'Column Gap' },
      { name: 'scrollbarMode', type: 'select', label: 'Scrollbar', options: Object.values(LVGL_SCROLL) },
    ],
  },

  // ==========================================
  // INPUT WIDGETS
  // ==========================================

  [WIDGET_TYPES.SLIDER]: {
    type: WIDGET_TYPES.SLIDER,
    name: 'Slider',
    lvglType: 'lv_slider',
    icon: '🎚️',
    category: 'Input',
    defaultProps: {
      x: 50, y: 50, width: 200, height: 20,
      min: 0, max: 100, value: 50,
      bgColor: '#E0E0E0',
      indicatorColor: '#2196F3',
      knobColor: '#1976D2',
      mode: 'normal',
      isRange: false,
      leftValue: 0,
    },
    properties: [
      ...positionProps,
      { name: 'min', type: 'number', label: 'Min Value' },
      { name: 'max', type: 'number', label: 'Max Value' },
      { name: 'value', type: 'number', label: 'Current Value' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'indicatorColor', type: 'color', label: 'Indicator Color' },
      { name: 'knobColor', type: 'color', label: 'Knob Color' },
      { name: 'mode', type: 'select', label: 'Mode', options: ['normal', 'symmetrical', 'range'] },
      { name: 'isRange', type: 'boolean', label: 'Range Mode' },
      { name: 'leftValue', type: 'number', label: 'Left Value (Range)' },
    ],
  },

  [WIDGET_TYPES.SWITCH]: {
    type: WIDGET_TYPES.SWITCH,
    name: 'Switch',
    lvglType: 'lv_switch',
    icon: '🔀',
    category: 'Input',
    defaultProps: {
      x: 50, y: 50, width: 60, height: 30,
      checked: false,
      onColor: '#4CAF50',
      offColor: '#BDBDBD',
      knobColor: '#FFFFFF',
      disabled: false,
    },
    properties: [
      ...positionProps,
      { name: 'checked', type: 'boolean', label: 'Checked' },
      { name: 'onColor', type: 'color', label: 'On Color' },
      { name: 'offColor', type: 'color', label: 'Off Color' },
      { name: 'knobColor', type: 'color', label: 'Knob Color' },
      { name: 'disabled', type: 'boolean', label: 'Disabled' },
    ],
  },

  [WIDGET_TYPES.CHECKBOX]: {
    type: WIDGET_TYPES.CHECKBOX,
    name: 'Checkbox',
    lvglType: 'lv_checkbox',
    icon: '☑️',
    category: 'Input',
    defaultProps: {
      x: 50, y: 50, width: 150, height: 30,
      text: 'Checkbox',
      checked: false,
      textColor: '#000000',
      fontSize: 14,
      checkedColor: '#2196F3',
      disabled: false,
    },
    properties: [
      ...positionProps,
      { name: 'text', type: 'string', label: 'Text' },
      { name: 'checked', type: 'boolean', label: 'Checked' },
      { name: 'textColor', type: 'color', label: 'Text Color' },
      { name: 'fontSize', type: 'number', label: 'Font Size' },
      { name: 'checkedColor', type: 'color', label: 'Checked Color' },
      { name: 'disabled', type: 'boolean', label: 'Disabled' },
    ],
  },

  [WIDGET_TYPES.TEXTAREA]: {
    type: WIDGET_TYPES.TEXTAREA,
    name: 'Text Area',
    lvglType: 'lv_textarea',
    icon: '📄',
    category: 'Input',
    defaultProps: {
      x: 50, y: 50, width: 200, height: 100,
      text: '',
      placeholder: 'Type here',
      bgColor: '#FFFFFF',
      textColor: '#000000',
      fontSize: 14,
      oneLine: false,
      password: false,
      maxLength: 0,
      acceptedChars: '',
    },
    properties: [
      ...positionProps,
      { name: 'text', type: 'string', label: 'Text' },
      { name: 'placeholder', type: 'string', label: 'Placeholder' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'textColor', type: 'color', label: 'Text Color' },
      { name: 'fontSize', type: 'number', label: 'Font Size' },
      { name: 'oneLine', type: 'boolean', label: 'One Line Mode' },
      { name: 'password', type: 'boolean', label: 'Password Mode' },
      { name: 'maxLength', type: 'number', label: 'Max Length (0=unlimited)' },
      { name: 'acceptedChars', type: 'string', label: 'Accepted Chars' },
    ],
  },

  [WIDGET_TYPES.DROPDOWN]: {
    type: WIDGET_TYPES.DROPDOWN,
    name: 'Dropdown',
    lvglType: 'lv_dropdown',
    icon: '▼',
    category: 'Input',
    defaultProps: {
      x: 50, y: 50, width: 150, height: 40,
      options: 'Option 1\nOption 2\nOption 3',
      selected: 0,
      bgColor: '#FFFFFF',
      textColor: '#000000',
      fontSize: 14,
      dir: LVGL_DIR.BOTTOM,
      symbol: 'LV_SYMBOL_DOWN',
      highlightSelected: true,
    },
    properties: [
      ...positionProps,
      { name: 'options', type: 'string', label: 'Options (newline separated)' },
      { name: 'selected', type: 'number', label: 'Selected Index' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'textColor', type: 'color', label: 'Text Color' },
      { name: 'fontSize', type: 'number', label: 'Font Size' },
      { name: 'dir', type: 'select', label: 'Dropdown Direction', options: Object.values(LVGL_DIR) },
      { name: 'highlightSelected', type: 'boolean', label: 'Highlight Selected' },
    ],
  },

  [WIDGET_TYPES.ROLLER]: {
    type: WIDGET_TYPES.ROLLER,
    name: 'Roller',
    lvglType: 'lv_roller',
    icon: '🎰',
    category: 'Input',
    defaultProps: {
      x: 50, y: 50, width: 100, height: 150,
      options: 'Option 1\nOption 2\nOption 3\nOption 4\nOption 5',
      selected: 0,
      visibleRows: 3,
      bgColor: '#F5F5F5',
      selectedColor: '#2196F3',
      textColor: '#000000',
      fontSize: 16,
      infinite: false,
    },
    properties: [
      ...positionProps,
      { name: 'options', type: 'string', label: 'Options (newline separated)' },
      { name: 'selected', type: 'number', label: 'Selected Index' },
      { name: 'visibleRows', type: 'number', label: 'Visible Rows' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'selectedColor', type: 'color', label: 'Selected Color' },
      { name: 'textColor', type: 'color', label: 'Text Color' },
      { name: 'fontSize', type: 'number', label: 'Font Size' },
      { name: 'infinite', type: 'boolean', label: 'Infinite Scroll' },
    ],
  },

  [WIDGET_TYPES.SPINBOX]: {
    type: WIDGET_TYPES.SPINBOX,
    name: 'Spinbox',
    lvglType: 'lv_spinbox',
    icon: '🔢',
    category: 'Input',
    defaultProps: {
      x: 50, y: 50, width: 120, height: 40,
      min: 0, max: 999, value: 0,
      digitCount: 4,
      separatorPos: 0,
      step: 1,
      rollover: false,
      bgColor: '#FFFFFF',
      textColor: '#000000',
      fontSize: 16,
    },
    properties: [
      ...positionProps,
      { name: 'min', type: 'number', label: 'Min Value' },
      { name: 'max', type: 'number', label: 'Max Value' },
      { name: 'value', type: 'number', label: 'Value' },
      { name: 'digitCount', type: 'number', label: 'Digit Count' },
      { name: 'separatorPos', type: 'number', label: 'Decimal Position' },
      { name: 'step', type: 'number', label: 'Step' },
      { name: 'rollover', type: 'boolean', label: 'Rollover' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'textColor', type: 'color', label: 'Text Color' },
      { name: 'fontSize', type: 'number', label: 'Font Size' },
    ],
  },

  [WIDGET_TYPES.KEYBOARD]: {
    type: WIDGET_TYPES.KEYBOARD,
    name: 'Keyboard',
    lvglType: 'lv_keyboard',
    icon: '⌨️',
    category: 'Input',
    defaultProps: {
      x: 0, y: 280, width: 480, height: 200,
      mode: 'text_lower',
      textarea: '',
      popover: true,
    },
    properties: [
      ...positionProps,
      { name: 'mode', type: 'select', label: 'Mode', options: ['text_lower', 'text_upper', 'text_special', 'number'] },
      { name: 'popover', type: 'boolean', label: 'Key Popover' },
    ],
  },

  // ==========================================
  // DISPLAY WIDGETS
  // ==========================================

  [WIDGET_TYPES.BAR]: {
    type: WIDGET_TYPES.BAR,
    name: 'Progress Bar',
    lvglType: 'lv_bar',
    icon: '▰',
    category: 'Display',
    defaultProps: {
      x: 50, y: 50, width: 200, height: 20,
      min: 0, max: 100, value: 50,
      bgColor: '#E0E0E0',
      indicatorColor: '#4CAF50',
      mode: LVGL_BAR_MODE.NORMAL,
      animated: true,
      startValue: 0,
    },
    properties: [
      ...positionProps,
      { name: 'min', type: 'number', label: 'Min Value' },
      { name: 'max', type: 'number', label: 'Max Value' },
      { name: 'value', type: 'number', label: 'Current Value' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'indicatorColor', type: 'color', label: 'Indicator Color' },
      { name: 'mode', type: 'select', label: 'Bar Mode', options: Object.values(LVGL_BAR_MODE) },
      { name: 'animated', type: 'boolean', label: 'Animated' },
      { name: 'startValue', type: 'number', label: 'Start Value (Range Mode)' },
    ],
  },

  [WIDGET_TYPES.ARC]: {
    type: WIDGET_TYPES.ARC,
    name: 'Arc',
    lvglType: 'lv_arc',
    icon: '◔',
    category: 'Display',
    defaultProps: {
      x: 50, y: 50, width: 100, height: 100,
      min: 0, max: 100, value: 50,
      bgColor: '#E0E0E0',
      indicatorColor: '#FF9800',
      startAngle: 135,
      endAngle: 45,
      rotation: 0,
      mode: LVGL_ARC_MODE.NORMAL,
      knobColor: '#FF9800',
      lineWidth: 10,
    },
    properties: [
      ...positionProps,
      { name: 'min', type: 'number', label: 'Min Value' },
      { name: 'max', type: 'number', label: 'Max Value' },
      { name: 'value', type: 'number', label: 'Current Value' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'indicatorColor', type: 'color', label: 'Indicator Color' },
      { name: 'knobColor', type: 'color', label: 'Knob Color' },
      { name: 'startAngle', type: 'number', label: 'Start Angle' },
      { name: 'endAngle', type: 'number', label: 'End Angle' },
      { name: 'rotation', type: 'number', label: 'Rotation' },
      { name: 'mode', type: 'select', label: 'Arc Mode', options: Object.values(LVGL_ARC_MODE) },
      { name: 'lineWidth', type: 'number', label: 'Line Width' },
    ],
  },

  [WIDGET_TYPES.SPINNER]: {
    type: WIDGET_TYPES.SPINNER,
    name: 'Spinner',
    lvglType: 'lv_spinner',
    icon: '⟳',
    category: 'Display',
    defaultProps: {
      x: 50, y: 50, width: 50, height: 50,
      speed: 1000,
      arcLength: 60,
      color: '#2196F3',
      lineWidth: 8,
    },
    properties: [
      ...positionProps,
      { name: 'speed', type: 'number', label: 'Animation Speed (ms)' },
      { name: 'arcLength', type: 'number', label: 'Arc Length (degrees)' },
      { name: 'color', type: 'color', label: 'Color' },
      { name: 'lineWidth', type: 'number', label: 'Line Width' },
    ],
  },

  [WIDGET_TYPES.LED]: {
    type: WIDGET_TYPES.LED,
    name: 'LED',
    lvglType: 'lv_led',
    icon: '💡',
    category: 'Display',
    defaultProps: {
      x: 50, y: 50, width: 30, height: 30,
      color: '#FF0000',
      brightness: 255,
    },
    properties: [
      ...positionProps,
      { name: 'color', type: 'color', label: 'Color' },
      { name: 'brightness', type: 'number', label: 'Brightness (0-255)', min: 0, max: 255 },
    ],
  },

  // ==========================================
  // DATA WIDGETS
  // ==========================================

  [WIDGET_TYPES.CHART]: {
    type: WIDGET_TYPES.CHART,
    name: 'Chart',
    lvglType: 'lv_chart',
    icon: '📊',
    category: 'Data',
    defaultProps: {
      x: 50, y: 50, width: 250, height: 150,
      chartType: 'line',
      data: '10,20,30,25,40,35,50',
      data2: '',
      bgColor: '#FFFFFF',
      lineColor: '#2196F3',
      lineColor2: '#FF5722',
      pointCount: 10,
      showPoints: true,
      rangeYMin: 0,
      rangeYMax: 100,
      divLineCount: 3,
      divLineCountSec: 5,
      updateMode: 'shift',
    },
    properties: [
      ...positionProps,
      { name: 'chartType', type: 'select', label: 'Chart Type', options: ['line', 'bar', 'scatter'] },
      { name: 'data', type: 'string', label: 'Series 1 Data (comma sep.)' },
      { name: 'data2', type: 'string', label: 'Series 2 Data (comma sep.)' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'lineColor', type: 'color', label: 'Series 1 Color' },
      { name: 'lineColor2', type: 'color', label: 'Series 2 Color' },
      { name: 'pointCount', type: 'number', label: 'Point Count' },
      { name: 'showPoints', type: 'boolean', label: 'Show Points' },
      { name: 'rangeYMin', type: 'number', label: 'Y-Axis Min' },
      { name: 'rangeYMax', type: 'number', label: 'Y-Axis Max' },
      { name: 'divLineCount', type: 'number', label: 'Horizontal Div Lines' },
      { name: 'divLineCountSec', type: 'number', label: 'Vertical Div Lines' },
      { name: 'updateMode', type: 'select', label: 'Update Mode', options: ['shift', 'circular'] },
    ],
  },

  [WIDGET_TYPES.TABLE]: {
    type: WIDGET_TYPES.TABLE,
    name: 'Table',
    lvglType: 'lv_table',
    icon: '📋',
    category: 'Data',
    defaultProps: {
      x: 50, y: 50, width: 300, height: 200,
      rows: 4,
      cols: 3,
      colWidths: '100,100,100',
      headerRow: 'Col 1,Col 2,Col 3',
      cellData: 'A1,B1,C1\nA2,B2,C2\nA3,B3,C3',
      bgColor: '#FFFFFF',
      textColor: '#000000',
      borderColor: '#E0E0E0',
      headerBgColor: '#F5F5F5',
      fontSize: 14,
    },
    properties: [
      ...positionProps,
      { name: 'rows', type: 'number', label: 'Rows' },
      { name: 'cols', type: 'number', label: 'Columns' },
      { name: 'colWidths', type: 'string', label: 'Column Widths (comma sep.)' },
      { name: 'headerRow', type: 'string', label: 'Header Row (comma sep.)' },
      { name: 'cellData', type: 'string', label: 'Cell Data (comma/newline)' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'textColor', type: 'color', label: 'Text Color' },
      { name: 'borderColor', type: 'color', label: 'Border Color' },
      { name: 'headerBgColor', type: 'color', label: 'Header Bg Color' },
      { name: 'fontSize', type: 'number', label: 'Font Size' },
    ],
  },

  [WIDGET_TYPES.SCALE]: {
    type: WIDGET_TYPES.SCALE,
    name: 'Scale',
    lvglType: 'lv_scale',
    icon: '📏',
    category: 'Data',
    defaultProps: {
      x: 50, y: 50, width: 200, height: 60,
      min: 0, max: 100,
      majorTickEvery: 10,
      majorTickLength: 15,
      minorTickCount: 4,
      minorTickLength: 8,
      labelShow: true,
      lineColor: '#000000',
      textColor: '#000000',
      mode: 'horizontal',
    },
    properties: [
      ...positionProps,
      { name: 'min', type: 'number', label: 'Min Value' },
      { name: 'max', type: 'number', label: 'Max Value' },
      { name: 'majorTickEvery', type: 'number', label: 'Major Tick Every' },
      { name: 'majorTickLength', type: 'number', label: 'Major Tick Length' },
      { name: 'minorTickCount', type: 'number', label: 'Minor Ticks Between Majors' },
      { name: 'minorTickLength', type: 'number', label: 'Minor Tick Length' },
      { name: 'labelShow', type: 'boolean', label: 'Show Labels' },
      { name: 'lineColor', type: 'color', label: 'Line Color' },
      { name: 'textColor', type: 'color', label: 'Text Color' },
      { name: 'mode', type: 'select', label: 'Mode', options: ['horizontal', 'vertical', 'round_inner', 'round_outer'] },
    ],
  },

  // ==========================================
  // MEDIA WIDGETS
  // ==========================================

  [WIDGET_TYPES.IMAGE]: {
    type: WIDGET_TYPES.IMAGE,
    name: 'Image',
    lvglType: 'lv_image',   // LVGL 9.3: lv_img -> lv_image
    icon: '🖼️',
    category: 'Media',
    defaultProps: {
      x: 50, y: 50, width: 100, height: 100,
      src: '',
      fit: 'contain',
      bgColor: '#F0F0F0',
      rotation: 0,
      zoom: 256,
      antialias: true,
      pivotX: 0,
      pivotY: 0,
    },
    properties: [
      ...positionProps,
      { name: 'src', type: 'image', label: 'Image' },
      { name: 'fit', type: 'select', label: 'Object Fit', options: ['contain', 'cover', 'fill'] },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'rotation', type: 'number', label: 'Rotation (0.1 deg)' },
      { name: 'zoom', type: 'number', label: 'Zoom (256=100%)' },
      { name: 'antialias', type: 'boolean', label: 'Antialias' },
      { name: 'pivotX', type: 'number', label: 'Pivot X' },
      { name: 'pivotY', type: 'number', label: 'Pivot Y' },
    ],
  },

  [WIDGET_TYPES.IMAGE_BUTTON]: {
    type: WIDGET_TYPES.IMAGE_BUTTON,
    name: 'Image Button',
    lvglType: 'lv_imagebutton',  // LVGL 9.3: lv_imgbtn -> lv_imagebutton
    icon: '🖼️🔘',
    category: 'Media',
    defaultProps: {
      x: 50, y: 50, width: 120, height: 120,
      src: '',
      text: 'Button',
      bgColor: '#2196F3',
      textColor: '#FFFFFF',
      fontSize: 14,
      radius: 5,
    },
    properties: [
      ...positionProps,
      { name: 'src', type: 'image', label: 'Image' },
      { name: 'text', type: 'string', label: 'Text' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'textColor', type: 'color', label: 'Text Color' },
      { name: 'fontSize', type: 'number', label: 'Font Size' },
      { name: 'radius', type: 'number', label: 'Corner Radius' },
    ],
  },

  // ==========================================
  // NAVIGATION WIDGETS
  // ==========================================

  [WIDGET_TYPES.TABVIEW]: {
    type: WIDGET_TYPES.TABVIEW,
    name: 'Tab View',
    lvglType: 'lv_tabview',
    icon: '📑',
    category: 'Navigation',
    defaultProps: {
      x: 50, y: 50, width: 300, height: 250,
      tabPosition: 'top',
      tabBarSize: 40,
      tabs: 'Tab 1\nTab 2\nTab 3',
      activeTab: 0,
      bgColor: '#FFFFFF',
      tabBgColor: '#F5F5F5',
      tabActiveColor: '#2196F3',
      textColor: '#000000',
    },
    properties: [
      ...positionProps,
      { name: 'tabPosition', type: 'select', label: 'Tab Position', options: ['top', 'bottom', 'left', 'right'] },
      { name: 'tabBarSize', type: 'number', label: 'Tab Bar Size' },
      { name: 'tabs', type: 'string', label: 'Tabs (newline separated)' },
      { name: 'activeTab', type: 'number', label: 'Active Tab Index' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'tabBgColor', type: 'color', label: 'Tab Bar Bg Color' },
      { name: 'tabActiveColor', type: 'color', label: 'Active Tab Color' },
      { name: 'textColor', type: 'color', label: 'Text Color' },
    ],
  },

  [WIDGET_TYPES.TILEVIEW]: {
    type: WIDGET_TYPES.TILEVIEW,
    name: 'Tile View',
    lvglType: 'lv_tileview',
    icon: '🔲',
    category: 'Navigation',
    defaultProps: {
      x: 50, y: 50, width: 300, height: 250,
      rows: 2,
      cols: 2,
      bgColor: '#FFFFFF',
    },
    properties: [
      ...positionProps,
      { name: 'rows', type: 'number', label: 'Tile Rows' },
      { name: 'cols', type: 'number', label: 'Tile Columns' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
    ],
  },

  [WIDGET_TYPES.MENU]: {
    type: WIDGET_TYPES.MENU,
    name: 'Menu',
    lvglType: 'lv_menu',
    icon: '☰',
    category: 'Navigation',
    defaultProps: {
      x: 50, y: 50, width: 250, height: 300,
      bgColor: '#FFFFFF',
      sidebarWidth: 80,
      headerTitle: 'Menu',
      items: 'Item 1\nItem 2\nItem 3\nItem 4',
      textColor: '#000000',
      selectedColor: '#2196F3',
    },
    properties: [
      ...positionProps,
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'sidebarWidth', type: 'number', label: 'Sidebar Width' },
      { name: 'headerTitle', type: 'string', label: 'Header Title' },
      { name: 'items', type: 'string', label: 'Menu Items (newline sep.)' },
      { name: 'textColor', type: 'color', label: 'Text Color' },
      { name: 'selectedColor', type: 'color', label: 'Selected Color' },
    ],
  },

  [WIDGET_TYPES.WIN]: {
    type: WIDGET_TYPES.WIN,
    name: 'Window',
    lvglType: 'lv_win',
    icon: '🪟',
    category: 'Navigation',
    defaultProps: {
      x: 50, y: 50, width: 300, height: 250,
      headerHeight: 40,
      title: 'Window Title',
      bgColor: '#FFFFFF',
      headerBgColor: '#2196F3',
      titleColor: '#FFFFFF',
    },
    properties: [
      ...positionProps,
      { name: 'headerHeight', type: 'number', label: 'Header Height' },
      { name: 'title', type: 'string', label: 'Title' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'headerBgColor', type: 'color', label: 'Header Bg Color' },
      { name: 'titleColor', type: 'color', label: 'Title Color' },
    ],
  },

  // ==========================================
  // CONTAINER/COMPOSITE WIDGETS
  // ==========================================

  [WIDGET_TYPES.LIST]: {
    type: WIDGET_TYPES.LIST,
    name: 'List',
    lvglType: 'lv_list',
    icon: '📃',
    category: 'Container',
    defaultProps: {
      x: 50, y: 50, width: 200, height: 300,
      items: 'Item 1\nItem 2\nItem 3\nItem 4\nItem 5',
      bgColor: '#FFFFFF',
      textColor: '#000000',
      selectedColor: '#E3F2FD',
      fontSize: 14,
    },
    properties: [
      ...positionProps,
      { name: 'items', type: 'string', label: 'Items (newline separated)' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'textColor', type: 'color', label: 'Text Color' },
      { name: 'selectedColor', type: 'color', label: 'Selected Item Color' },
      { name: 'fontSize', type: 'number', label: 'Font Size' },
    ],
  },

  [WIDGET_TYPES.MSGBOX]: {
    type: WIDGET_TYPES.MSGBOX,
    name: 'Message Box',
    lvglType: 'lv_msgbox',
    icon: '💬',
    category: 'Container',
    defaultProps: {
      x: 50, y: 50, width: 250, height: 180,
      title: 'Notice',
      text: 'This is a message box',
      buttons: 'OK\nCancel',
      closeButton: true,
      bgColor: '#FFFFFF',
      textColor: '#000000',
      titleColor: '#333333',
      fontSize: 14,
    },
    properties: [
      ...positionProps,
      { name: 'title', type: 'string', label: 'Title' },
      { name: 'text', type: 'string', label: 'Message Text' },
      { name: 'buttons', type: 'string', label: 'Buttons (newline sep.)' },
      { name: 'closeButton', type: 'boolean', label: 'Show Close Button' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'textColor', type: 'color', label: 'Text Color' },
      { name: 'titleColor', type: 'color', label: 'Title Color' },
      { name: 'fontSize', type: 'number', label: 'Font Size' },
    ],
  },

  [WIDGET_TYPES.BUTTONMATRIX]: {
    type: WIDGET_TYPES.BUTTONMATRIX,
    name: 'Button Matrix',
    lvglType: 'lv_buttonmatrix',  // LVGL 9.3: lv_btnmatrix -> lv_buttonmatrix
    icon: '⊞',
    category: 'Container',
    defaultProps: {
      x: 50, y: 50, width: 250, height: 120,
      map: '1,2,3\n4,5,6\n7,8,9\n*,0,#',
      bgColor: '#FFFFFF',
      btnColor: '#E0E0E0',
      textColor: '#000000',
      fontSize: 14,
      oneCheck: false,
    },
    properties: [
      ...positionProps,
      { name: 'map', type: 'string', label: 'Button Map (comma/newline)' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'btnColor', type: 'color', label: 'Button Color' },
      { name: 'textColor', type: 'color', label: 'Text Color' },
      { name: 'fontSize', type: 'number', label: 'Font Size' },
      { name: 'oneCheck', type: 'boolean', label: 'One Check Mode' },
    ],
  },

  [WIDGET_TYPES.CALENDAR]: {
    type: WIDGET_TYPES.CALENDAR,
    name: 'Calendar',
    lvglType: 'lv_calendar',
    icon: '📅',
    category: 'Container',
    defaultProps: {
      x: 50, y: 50, width: 230, height: 230,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
      showHeader: true,
      bgColor: '#FFFFFF',
      todayColor: '#2196F3',
      selectedColor: '#1976D2',
    },
    properties: [
      ...positionProps,
      { name: 'year', type: 'number', label: 'Year' },
      { name: 'month', type: 'number', label: 'Month (1-12)' },
      { name: 'day', type: 'number', label: 'Day' },
      { name: 'showHeader', type: 'boolean', label: 'Show Header' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'todayColor', type: 'color', label: 'Today Highlight Color' },
      { name: 'selectedColor', type: 'color', label: 'Selected Day Color' },
    ],
  },

  [WIDGET_TYPES.LINE]: {
    type: WIDGET_TYPES.LINE,
    name: 'Line',
    lvglType: 'lv_line',
    icon: '╱',
    category: 'Container',
    defaultProps: {
      x: 50, y: 50, width: 200, height: 5,
      points: '0,0 200,0',
      lineColor: '#000000',
      lineWidth: 2,
      rounded: false,
    },
    properties: [
      ...positionProps,
      { name: 'points', type: 'string', label: 'Points (x,y pairs space sep.)' },
      { name: 'lineColor', type: 'color', label: 'Line Color' },
      { name: 'lineWidth', type: 'number', label: 'Line Width' },
      { name: 'rounded', type: 'boolean', label: 'Rounded Ends' },
    ],
  },

  [WIDGET_TYPES.SPAN]: {
    type: WIDGET_TYPES.SPAN,
    name: 'Span Group',
    lvglType: 'lv_spangroup',
    icon: '🔤',
    category: 'Container',
    defaultProps: {
      x: 50, y: 50, width: 200, height: 60,
      spans: 'Normal text|14|#000000\nBold text|16|#FF0000\nSmall text|12|#666666',
      bgColor: '#FFFFFF',
      mode: 'wrap',
    },
    properties: [
      ...positionProps,
      { name: 'spans', type: 'string', label: 'Spans (text|size|color per line)' },
      { name: 'bgColor', type: 'color', label: 'Background Color' },
      { name: 'mode', type: 'select', label: 'Overflow Mode', options: ['wrap', 'expand', 'break', 'clip'] },
    ],
  },
};

export function createWidget(type, id, props = {}) {
  const definition = widgetDefinitions[type];
  if (!definition) {
    throw new Error(`Unknown widget type: ${type}`);
  }

  return {
    id,
    type,
    name: `${definition.name}_${id.slice(-4)}`,
    parentId: null,
    props: { ...definition.defaultProps, ...props },
    events: [],
    animations: [],
    customStyles: {},
  };
}

export function getWidgetsByCategory() {
  const categories = {};
  Object.values(widgetDefinitions).forEach((def) => {
    const cat = def.category || 'Other';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(def);
  });
  return categories;
}
