// MicroPython Code Generator for LVGL

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
  const rgb = hexToRgb(color);
  return `lv.color_make(0x${rgb.r.toString(16).padStart(2, '0')}, 0x${rgb.g.toString(16).padStart(2, '0')}, 0x${rgb.b.toString(16).padStart(2, '0')})`;
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
      lines.push(`${indent}# Create button: ${name}`);
      lines.push(`${indent}${varName} = lv.btn(parent)`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);

      if (props.bgColor) {
        lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.bgColor)}, lv.PART.MAIN)`);
      }

      if (props.radius !== undefined) {
        lines.push(`${indent}${varName}.set_style_radius(${props.radius}, lv.PART.MAIN)`);
      }

      if (props.text) {
        const labelVar = `${varName}_label`;
        lines.push(`${indent}${labelVar} = lv.label(${varName})`);
        lines.push(`${indent}${labelVar}.set_text("${props.text}")`);
        lines.push(`${indent}${labelVar}.center()`);

        if (props.textColor) {
          lines.push(`${indent}${labelVar}.set_style_text_color(${colorToLvglColor(props.textColor)}, lv.PART.MAIN)`);
        }
      }
      break;
    }

    case 'label': {
      lines.push(`${indent}# Create label: ${name}`);
      lines.push(`${indent}${varName} = lv.label(parent)`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_text("${props.text || 'Label'}")`);

      if (props.textColor) {
        lines.push(`${indent}${varName}.set_style_text_color(${colorToLvglColor(props.textColor)}, lv.PART.MAIN)`);
      }

      if (props.align) {
        lines.push(`${indent}${varName}.set_style_text_align(lv.TEXT_ALIGN.CENTER, 0)`);
      }
      break;
    }

    case 'slider': {
      lines.push(`${indent}# Create slider: ${name}`);
      lines.push(`${indent}${varName} = lv.slider(parent)`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      lines.push(`${indent}${varName}.set_range(${props.min || 0}, ${props.max || 100})`);
      lines.push(`${indent}${varName}.set_value(${props.value || 50}, lv.ANIM.OFF)`);

      if (props.indicatorColor) {
        lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.indicatorColor)}, lv.PART.INDICATOR)`);
      }
      break;
    }

    case 'switch': {
      lines.push(`${indent}# Create switch: ${name}`);
      lines.push(`${indent}${varName} = lv.switch(parent)`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);

      if (props.checked) {
        lines.push(`${indent}${varName}.add_state(lv.STATE.CHECKED)`);
      }
      break;
    }

    case 'checkbox': {
      lines.push(`${indent}# Create checkbox: ${name}`);
      lines.push(`${indent}${varName} = lv.checkbox(parent)`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_text("${props.text || 'Checkbox'}")`);

      if (props.checked) {
        lines.push(`${indent}${varName}.add_state(lv.STATE.CHECKED)`);
      }
      break;
    }

    case 'textarea': {
      lines.push(`${indent}# Create textarea: ${name}`);
      lines.push(`${indent}${varName} = lv.textarea(parent)`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      lines.push(`${indent}${varName}.set_text("${props.text || ''}")`);

      if (props.placeholder) {
        lines.push(`${indent}${varName}.set_placeholder_text("${props.placeholder}")`);
      }
      break;
    }

    case 'panel': {
      lines.push(`${indent}# Create panel: ${name}`);
      lines.push(`${indent}${varName} = lv.obj(parent)`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);

      if (props.bgColor) {
        lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.bgColor)}, lv.PART.MAIN)`);
      }

      if (props.borderWidth) {
        lines.push(`${indent}${varName}.set_style_border_width(${props.borderWidth}, lv.PART.MAIN)`);

        if (props.borderColor) {
          lines.push(`${indent}${varName}.set_style_border_color(${colorToLvglColor(props.borderColor)}, lv.PART.MAIN)`);
        }
      }

      if (props.radius !== undefined) {
        lines.push(`${indent}${varName}.set_style_radius(${props.radius}, lv.PART.MAIN)`);
      }
      break;
    }

    case 'bar': {
      lines.push(`${indent}# Create progress bar: ${name}`);
      lines.push(`${indent}${varName} = lv.bar(parent)`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      lines.push(`${indent}${varName}.set_range(${props.min || 0}, ${props.max || 100})`);
      lines.push(`${indent}${varName}.set_value(${props.value || 50}, lv.ANIM.OFF)`);

      if (props.indicatorColor) {
        lines.push(`${indent}${varName}.set_style_bg_color(${colorToLvglColor(props.indicatorColor)}, lv.PART.INDICATOR)`);
      }
      break;
    }

    case 'arc': {
      lines.push(`${indent}# Create arc: ${name}`);
      lines.push(`${indent}${varName} = lv.arc(parent)`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      lines.push(`${indent}${varName}.set_range(${props.min || 0}, ${props.max || 100})`);
      lines.push(`${indent}${varName}.set_value(${props.value || 50})`);

      if (props.startAngle !== undefined && props.endAngle !== undefined) {
        lines.push(`${indent}${varName}.set_bg_angles(${props.startAngle}, ${props.endAngle})`);
      }
      break;
    }

    case 'spinner': {
      lines.push(`${indent}# Create spinner: ${name}`);
      lines.push(`${indent}${varName} = lv.spinner(parent, ${props.speed || 1000}, 60)`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);
      break;
    }

    default:
      lines.push(`${indent}# Unknown widget type: ${type}`);
  }

  lines.push('');
  return lines.join('\n');
}

export function generateMicroPythonCode(projectData) {
  const { projectName, widgets, canvasSize } = projectData;
  const functionName = sanitizeIdentifier(projectName || 'ui') + '_create';

  let code = `"""
Auto-generated LVGL UI Code for MicroPython
Project: ${projectName}
Generated: ${new Date().toISOString()}
Display Size: ${canvasSize.width}x${canvasSize.height}
"""

import lvgl as lv

def ${functionName}(parent=None):
    """
    Create the UI for ${projectName}

    Args:
        parent: Parent object (use lv.scr_act() for screen)
    """
    if parent is None:
        parent = lv.scr_act()

`;

  // Generate code for each widget
  widgets.forEach((widget) => {
    code += generateWidgetCode(widget, '    ');
  });

  code += `
def ${functionName}_init():
    """
    Initialize and show the UI
    """
    screen = lv.obj()
    ${functionName}(screen)
    lv.scr_load(screen)

# Example usage:
# ${functionName}_init()
`;

  return code;
}

export default generateMicroPythonCode;
