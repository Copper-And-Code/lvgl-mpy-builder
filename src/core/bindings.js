// Data binding: project variables (LVGL observer "subjects", integers) bound
// to widget values. Only bindings available both in LVGL 9.6 (C) and in the
// lv_micropython firmware (LVGL 9.3) are offered.

/** Widget types that can be bound, the property the binding drives and the LVGL function. */
export const BINDABLE_WIDGETS = {
  slider: { property: 'value', label: 'Value', fn: 'lv_slider_bind_value' },
  arc: { property: 'value', label: 'Value', fn: 'lv_arc_bind_value' },
  dropdown: { property: 'selected', label: 'Selected option', fn: 'lv_dropdown_bind_value' },
  roller: { property: 'selected', label: 'Selected option', fn: 'lv_roller_bind_value' },
  switch: { property: 'checked', label: 'Checked (0 = off)', fn: 'lv_obj_bind_checked' },
  checkbox: { property: 'checked', label: 'Checked (0 = off)', fn: 'lv_obj_bind_checked' },
  label: { property: 'text', label: 'Text', fn: 'lv_label_bind_text', format: true },
};

export const DEFAULT_LABEL_FORMAT = '%d';

export function isBindable(type) {
  return Object.prototype.hasOwnProperty.call(BINDABLE_WIDGETS, type);
}

/** printf-like formatting of an integer with %d / %i (and %% for "%"), as LVGL does for labels. */
export function formatBoundText(format, value) {
  return String(format ?? DEFAULT_LABEL_FORMAT).replace(/%(%|[+-]?\d*[di])/g, (match, spec) =>
    spec === '%' ? '%' : String(Math.trunc(value))
  );
}

/**
 * Props shown on the canvas for a bound widget: LVGL sets the widget from the
 * variable when the binding is created, so the initial value is shown.
 */
export function boundPreviewProps(widget, props, variables) {
  const binding = widget.binding;
  if (!binding || !isBindable(widget.type)) return props;
  const variable = variables.find((v) => v.id === binding.variableId);
  if (!variable) return props;
  const value = Number(variable.initial) || 0;
  switch (BINDABLE_WIDGETS[widget.type].property) {
    case 'value':
      return { ...props, value };
    case 'selected':
      return { ...props, selected: value };
    case 'checked':
      return { ...props, checked: value !== 0 };
    case 'text':
      return { ...props, text: formatBoundText(binding.format, value) };
    default:
      return props;
  }
}
