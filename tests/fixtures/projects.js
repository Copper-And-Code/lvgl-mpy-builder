// Test projects for the code generators.
import { createWidget, widgetDefinitions } from '../../src/core/widgetDefinitions';

const widget = (type, id, name, props = {}, extra = {}) => ({
  ...createWidget(type, id, props),
  name,
  ...extra,
});

// Small real images (6x4 red PNG, 8x5 blue JPEG) for the Asset Manager
export const PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAECAYAAACtBE5DAAAAEklEQVR4nGP4z8DwHxtmoJ4EAFeLL9Fq2vKHAAAAAElFTkSuQmCC';
export const JPEG_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAAAAAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAFAAgDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAB//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJ8Awip//9k=';
const GIF_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

// Event code that is valid both in C and (as a comment) in MicroPython
const COMMENT_CODE = '// handled by the application';

/** Every widget type with defaults plus options that exercise each code path. */
export function allWidgetsProject() {
  const overrides = {
    label: { longMode: 'LV_LABEL_LONG_MODE_DOTS', textAlign: 'LV_TEXT_ALIGN_RIGHT', recolor: true, fontSize: 18 },
    slider: { mode: 'range', leftValue: 10, value: 0 },
    switch: { checked: true, disabled: true },
    checkbox: { checked: true },
    textarea: { oneLine: true, password: true, maxLength: 20, acceptedChars: '0123456789', text: 'abc' },
    dropdown: { selected: 1, dir: 'LV_DIR_TOP' },
    roller: { infinite: true, selected: 2 },
    spinbox: { separatorPos: 2, step: 5, rollover: true },
    keyboard: { mode: 'number', popover: false },
    panel: {
      flexFlow: 'LV_FLEX_FLOW_ROW_WRAP', flexMainPlace: 'LV_FLEX_ALIGN_SPACE_BETWEEN', flexCrossPlace: 'LV_FLEX_ALIGN_CENTER',
      padTop: 4, padRow: 2, scrollbarMode: 'LV_SCROLLBAR_MODE_OFF', shadowWidth: 6, shadowColor: '#333',
      shadowOffsetX: 2, shadowOffsetY: 3, outlineWidth: 1, outlineColor: '#00ff00', opacity: 200, bgOpa: 128,
      transformRotation: 10, scrollDir: 'LV_DIR_VER', clickable: false,
    },
    bar: { mode: 'LV_BAR_MODE_RANGE', startValue: 10 },
    arc: { rotation: 90, mode: 'LV_ARC_MODE_REVERSE' },
    chart: { chartType: 'bar', data2: '5,15,25', updateMode: 'circular' },
    scale: { mode: 'round_inner', labelShow: false },
    image: { src: 'logo.png', rotation: 10, zoom: 512, pivotX: 5, antialias: false },
    imagebutton: { src: 'photo.jpg' },
    tabview: { activeTab: 1, tabPosition: 'left' },
    msgbox: { closeButton: true },
    buttonmatrix: { oneCheck: true },
    line: { rounded: true },
    span: { mode: 'clip' },
  };

  const widgets = Object.keys(widgetDefinitions).map((type, index) =>
    widget(type, `w${index}`, `${type}_widget`, overrides[type] ?? {})
  );
  widgets.push(widget('span', 'span2', 'span_expand', { mode: 'expand' }));
  widgets.push(widget('image', 'img_file', 'image_from_file', { src: 'A:images/background.png' }));
  widgets.push(widget('image', 'img_gif', 'image_gif', { src: 'anim.gif' }));
  widgets.push(widget('image', 'img_same', 'image_same_asset', { src: 'logo.png' }));

  const button = widgets.find((w) => w.type === 'button');
  button.customStyles = {
    bg_color: '#123456', bg_opa: 200, border_color: '#abc', border_width: 2, border_opa: 100,
    pad_top: 1, pad_bottom: 2, pad_left: 3, pad_right: 4, text_color: '#fff', text_font_size: 22,
    radius: 6, shadow_width: 3, shadow_ofs_x: 1, shadow_ofs_y: 2, shadow_color: '#000',
  };
  button.events = [
    { id: 'e1', type: 'LV_EVENT_CLICKED', callback: 'on_button', code: COMMENT_CODE },
    { id: 'e2', type: 'LV_EVENT_LONG_PRESSED', callback: 'on_button', code: '' },
  ];
  button.animations = ['move_x', 'move_y', 'width', 'height', 'fade_in', 'fade_out'].map((type, i) => ({
    id: `anim_${i}`, type, duration: 300, delay: i * 10, repeat: i % 2, playback: i % 2 === 0,
    startValue: 0, endValue: 100, path: 'lv_anim_path_ease_in_out',
  }));
  // Data binding: variables "level" and "enabled"
  const bind = (type, variableId, extra = {}) => {
    widgets.find((w) => w.type === type).binding = { variableId, ...extra };
  };
  bind('slider', 'v-level');
  bind('arc', 'v-level');
  bind('roller', 'v-level');
  bind('label', 'v-level', { format: 'Level: %d' });
  bind('switch', 'v-enabled');
  bind('checkbox', 'v-enabled');

  const slider = widgets.find((w) => w.type === 'slider');
  slider.events = [{ id: 'e3', type: 'LV_EVENT_VALUE_CHANGED', callback: 'on_value', code: COMMENT_CODE }];

  return {
    projectName: 'All Widgets',
    pages: [{ id: 'p1', name: 'Widgets', canvasSize: { width: 800, height: 480 }, widgets }],
    variables: [
      { id: 'v-level', name: 'level', initial: 3 },
      { id: 'v-enabled', name: 'enabled', initial: 1 },
    ],
    assets: {
      images: [
        { id: 'a1', name: 'logo.png', data: PNG_DATA_URL },
        { id: 'a2', name: 'photo.jpg', data: JPEG_DATA_URL },
        { id: 'a3', name: 'anim.gif', data: GIF_DATA_URL },
      ],
      fonts: [],
    },
  };
}

/** Names, strings and hierarchies that used to produce invalid code. */
export function hostileProject() {
  const strings = 'Quote " backslash \\ newline\nend */ """ ??= tab\t';
  const widgets = [
    // Child listed before its parent, grandchild before both
    widget('label', 'grandchild', 'Grand child', { text: strings }, { parentId: 'child' }),
    widget('panel', 'child', 'Child panel', {}, { parentId: 'root' }),
    widget('panel', 'root', 'Root panel'),
    // Parent cycle and a missing parent
    widget('panel', 'cycle_a', 'cycle a', {}, { parentId: 'cycle_b' }),
    widget('panel', 'cycle_b', 'cycle b', {}, { parentId: 'cycle_a' }),
    widget('label', 'orphan', 'orphan', {}, { parentId: 'does-not-exist' }),
    // Colliding and invalid names
    widget('button', 'b1', 'Button 1', { text: strings }),
    widget('button', 'b2', 'button_1'),
    widget('button', 'b3', 'Button 1'),
    widget('label', 'n1', '1st label'),
    widget('label', 'n2', 'lambda'),
    widget('label', 'n3', 'lv_obj_create'),
    widget('label', 'n4', 'print'),
    widget('label', 'n5', '***'),
    widget('label', 'n6', 'Città'),
    // Invalid values
    widget('slider', 's1', 'bad slider', { min: '0; evil()', max: 'abc', value: null, bgColor: 'red); evil(' }),
    widget('dropdown', 'd1', 'options', { options: 'One\n"Two"\nThree\\' }),
    widget('table', 't1', 'table', { headerRow: 'A,"B",C', cellData: '1,2,3\n4,5,6' }),
    widget('buttonmatrix', 'bm', 'matrix', { map: 'a,"b"\nc,\\' }),
    widget('chart', 'ch', 'chart', { data: '1, x, 3,, 4' }),
    widget('scale', 'sc', 'scale', { majorTickEvery: 0, min: 10, max: 10 }),
  ];
  // Same callback name, same event, different code on two widgets
  widgets[6].events = [{ id: 'h1', type: 'LV_EVENT_CLICKED', callback: 'print', code: COMMENT_CODE }];
  widgets[7].events = [
    { id: 'h2', type: 'LV_EVENT_CLICKED', callback: 'print', code: '// other code' },
    { id: 'h3', type: 'LV_EVENT_BOGUS', callback: 'bogus', code: 'evil();' },
  ];

  return {
    projectName: '1 My "Project" */',
    pages: [
      { id: 'p1', name: 'Main', canvasSize: { width: 480, height: 320 }, widgets },
      { id: 'p2', name: 'Main', canvasSize: { width: 480, height: 320 }, widgets: [] },
      { id: 'p3', name: 'init', canvasSize: { width: 480, height: 320 }, widgets: [] },
    ],
  };
}
