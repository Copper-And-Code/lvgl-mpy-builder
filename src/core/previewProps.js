// Props used by the canvas preview: the widget props with the custom styles
// of the Style Editor applied on top, like LVGL local styles override the
// widget's own settings in the generated code.

const STYLE_PROPS = {
  bg_color: 'bgColor',
  border_color: 'borderColor',
  border_width: 'borderWidth',
  radius: 'radius',
  text_color: 'textColor',
  text_font_size: 'fontSize',
};

export function previewProps(widget) {
  const props = { ...(widget.props ?? {}) };
  Object.entries(widget.customStyles ?? {}).forEach(([style, value]) => {
    const prop = STYLE_PROPS[style];
    if (prop && value !== undefined && value !== null && value !== '') props[prop] = value;
  });
  return props;
}
