// C Code Generator for LVGL

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

function colorToLvglMacro(color) {
  const rgb = hexToRgb(color);
  return `lv_color_make(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function sanitizeIdentifier(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

function generateWidgetCode(widget, indent = '    ') {
  const { id, type, name, props } = widget;
  const varName = sanitizeIdentifier(name);
  const lines = [];

  switch (type) {
    case 'button': {
      lines.push(`${indent}/* Create button: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_btn_create(parent);`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);

      if (props.bgColor) {
        lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglMacro(props.bgColor)}, LV_PART_MAIN);`);
      }

      if (props.radius !== undefined) {
        lines.push(`${indent}lv_obj_set_style_radius(${varName}, ${props.radius}, LV_PART_MAIN);`);
      }

      if (props.text) {
        const labelVar = `${varName}_label`;
        lines.push(`${indent}lv_obj_t *${labelVar} = lv_label_create(${varName});`);
        lines.push(`${indent}lv_label_set_text(${labelVar}, "${props.text}");`);
        lines.push(`${indent}lv_obj_center(${labelVar});`);

        if (props.textColor) {
          lines.push(`${indent}lv_obj_set_style_text_color(${labelVar}, ${colorToLvglMacro(props.textColor)}, LV_PART_MAIN);`);
        }
      }
      break;
    }

    case 'label': {
      lines.push(`${indent}/* Create label: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_label_create(parent);`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_label_set_text(${varName}, "${props.text || 'Label'}");`);

      if (props.textColor) {
        lines.push(`${indent}lv_obj_set_style_text_color(${varName}, ${colorToLvglMacro(props.textColor)}, LV_PART_MAIN);`);
      }

      if (props.align) {
        lines.push(`${indent}lv_obj_set_style_text_align(${varName}, LV_TEXT_ALIGN_CENTER, 0);`);
      }
      break;
    }

    case 'slider': {
      lines.push(`${indent}/* Create slider: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_slider_create(parent);`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      lines.push(`${indent}lv_slider_set_range(${varName}, ${props.min || 0}, ${props.max || 100});`);
      lines.push(`${indent}lv_slider_set_value(${varName}, ${props.value || 50}, LV_ANIM_OFF);`);

      if (props.indicatorColor) {
        lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglMacro(props.indicatorColor)}, LV_PART_INDICATOR);`);
      }
      break;
    }

    case 'switch': {
      lines.push(`${indent}/* Create switch: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_switch_create(parent);`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);

      if (props.checked) {
        lines.push(`${indent}lv_obj_add_state(${varName}, LV_STATE_CHECKED);`);
      }
      break;
    }

    case 'checkbox': {
      lines.push(`${indent}/* Create checkbox: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_checkbox_create(parent);`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_checkbox_set_text(${varName}, "${props.text || 'Checkbox'}");`);

      if (props.checked) {
        lines.push(`${indent}lv_obj_add_state(${varName}, LV_STATE_CHECKED);`);
      }
      break;
    }

    case 'textarea': {
      lines.push(`${indent}/* Create textarea: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_textarea_create(parent);`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      lines.push(`${indent}lv_textarea_set_text(${varName}, "${props.text || ''}");`);

      if (props.placeholder) {
        lines.push(`${indent}lv_textarea_set_placeholder_text(${varName}, "${props.placeholder}");`);
      }
      break;
    }

    case 'panel': {
      lines.push(`${indent}/* Create panel: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_obj_create(parent);`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);

      if (props.bgColor) {
        lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglMacro(props.bgColor)}, LV_PART_MAIN);`);
      }

      if (props.borderWidth) {
        lines.push(`${indent}lv_obj_set_style_border_width(${varName}, ${props.borderWidth}, LV_PART_MAIN);`);

        if (props.borderColor) {
          lines.push(`${indent}lv_obj_set_style_border_color(${varName}, ${colorToLvglMacro(props.borderColor)}, LV_PART_MAIN);`);
        }
      }

      if (props.radius !== undefined) {
        lines.push(`${indent}lv_obj_set_style_radius(${varName}, ${props.radius}, LV_PART_MAIN);`);
      }
      break;
    }

    case 'bar': {
      lines.push(`${indent}/* Create progress bar: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_bar_create(parent);`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      lines.push(`${indent}lv_bar_set_range(${varName}, ${props.min || 0}, ${props.max || 100});`);
      lines.push(`${indent}lv_bar_set_value(${varName}, ${props.value || 50}, LV_ANIM_OFF);`);

      if (props.indicatorColor) {
        lines.push(`${indent}lv_obj_set_style_bg_color(${varName}, ${colorToLvglMacro(props.indicatorColor)}, LV_PART_INDICATOR);`);
      }
      break;
    }

    case 'arc': {
      lines.push(`${indent}/* Create arc: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_arc_create(parent);`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      lines.push(`${indent}lv_arc_set_range(${varName}, ${props.min || 0}, ${props.max || 100});`);
      lines.push(`${indent}lv_arc_set_value(${varName}, ${props.value || 50});`);

      if (props.startAngle !== undefined && props.endAngle !== undefined) {
        lines.push(`${indent}lv_arc_set_bg_angles(${varName}, ${props.startAngle}, ${props.endAngle});`);
      }
      break;
    }

    case 'spinner': {
      lines.push(`${indent}/* Create spinner: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_spinner_create(parent, ${props.speed || 1000}, 60);`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      break;
    }

    default:
      lines.push(`${indent}/* Unknown widget type: ${type} */`);
  }

  lines.push('');
  return lines.join('\n');
}

export function generateCCode(projectData) {
  const { projectName, widgets, canvasSize } = projectData;
  const functionName = sanitizeIdentifier(projectName || 'ui') + '_create';

  let code = `/*
 * Auto-generated LVGL UI Code
 * Project: ${projectName}
 * Generated: ${new Date().toISOString()}
 * Display Size: ${canvasSize.width}x${canvasSize.height}
 */

#include "lvgl.h"

/**
 * Create the UI for ${projectName}
 * @param parent Parent object (use lv_scr_act() for screen)
 */
void ${functionName}(lv_obj_t *parent)
{
    if (parent == NULL) {
        parent = lv_scr_act();
    }

`;

  // Generate code for each widget
  widgets.forEach((widget) => {
    code += generateWidgetCode(widget, '    ');
  });

  code += `}

/**
 * Initialize and show the UI
 */
void ${functionName}_init(void)
{
    lv_obj_t *screen = lv_obj_create(NULL);
    ${functionName}(screen);
    lv_scr_load(screen);
}
`;

  return code;
}

export default generateCCode;
