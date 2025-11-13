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

function getWidgetParentVarName(widget, widgets) {
  if (!widget.parentId) {
    return 'parent';
  }
  const parentWidget = widgets.find(w => w.id === widget.parentId);
  return parentWidget ? sanitizeIdentifier(parentWidget.name) : 'parent';
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

  // Convert path name to Python style
  const pathName = animation.path.replace('lv_anim_path_', '');
  lines.push(`${indent}${animVarName}.set_path_cb(lv.anim_t.path_${pathName})`);

  // Set appropriate setter function based on animation type
  switch (animation.type) {
    case 'move_x':
      lines.push(`${indent}${animVarName}.set_exec_cb(${varName}, lv.anim_t.set_x)`);
      break;
    case 'move_y':
      lines.push(`${indent}${animVarName}.set_exec_cb(${varName}, lv.anim_t.set_y)`);
      break;
    case 'width':
      lines.push(`${indent}${animVarName}.set_exec_cb(${varName}, lv.anim_t.set_width)`);
      break;
    case 'height':
      lines.push(`${indent}${animVarName}.set_exec_cb(${varName}, lv.anim_t.set_height)`);
      break;
    case 'fade_in':
    case 'fade_out':
      lines.push(`${indent}${animVarName}.set_exec_cb(${varName}, lv.anim_t.set_opa)`);
      break;
    default:
      lines.push(`${indent}# Custom animation type: ${animation.type}`);
  }

  lines.push(`${indent}lv.anim_t.start(${animVarName})`);

  return lines.join('\n');
}

function generateWidgetCode(widget, widgets, indent = '    ') {
  const { id, type, name, props, events, animations } = widget;
  const varName = sanitizeIdentifier(name);
  const parentVar = getWidgetParentVarName(widget, widgets);
  const lines = [];

  switch (type) {
    case 'button': {
      lines.push(`${indent}# Create button: ${name}`);
      lines.push(`${indent}${varName} = lv.btn(${parentVar})`);
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
      lines.push(`${indent}${varName} = lv.label(${parentVar})`);
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
      lines.push(`${indent}${varName} = lv.slider(${parentVar})`);
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
      lines.push(`${indent}${varName} = lv.switch(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_size(${props.width}, ${props.height})`);

      if (props.checked) {
        lines.push(`${indent}${varName}.add_state(lv.STATE.CHECKED)`);
      }
      break;
    }

    case 'checkbox': {
      lines.push(`${indent}# Create checkbox: ${name}`);
      lines.push(`${indent}${varName} = lv.checkbox(${parentVar})`);
      lines.push(`${indent}${varName}.set_pos(${props.x}, ${props.y})`);
      lines.push(`${indent}${varName}.set_text("${props.text || 'Checkbox'}")`);

      if (props.checked) {
        lines.push(`${indent}${varName}.add_state(lv.STATE.CHECKED)`);
      }
      break;
    }

    case 'textarea': {
      lines.push(`${indent}# Create textarea: ${name}`);
      lines.push(`${indent}${varName} = lv.textarea(${parentVar})`);
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
      lines.push(`${indent}${varName} = lv.obj(${parentVar})`);
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
      lines.push(`${indent}${varName} = lv.bar(${parentVar})`);
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
      lines.push(`${indent}${varName} = lv.arc(${parentVar})`);
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

export function generateMicroPythonCode(projectData) {
  const { projectName, widgets, canvasSize, pages, version } = projectData;
  const functionName = sanitizeIdentifier(projectName || 'ui') + '_create';

  // Check if this is a multi-page project (v1.2+)
  const isMultiPage = pages && pages.length > 0;

  if (isMultiPage) {
    return generateMultiPageMicroPythonCode(projectData);
  }

  // Legacy single-page generation
  return generateSinglePageMicroPythonCode(projectData);
}

function generateSinglePageMicroPythonCode(projectData) {
  const { projectName, widgets, canvasSize } = projectData;
  const functionName = sanitizeIdentifier(projectName || 'ui') + '_create';

  // Sort widgets to ensure parents are created before children
  const sortedWidgets = [...widgets].sort((a, b) => {
    if (!a.parentId && b.parentId) return -1;
    if (a.parentId && !b.parentId) return 1;
    return 0;
  });

  // Collect all unique event callbacks
  const eventCallbacks = new Set();
  sortedWidgets.forEach((widget) => {
    if (widget.events && widget.events.length > 0) {
      widget.events.forEach((event) => {
        eventCallbacks.add({
          name: sanitizeIdentifier(event.callback),
          type: event.type,
          code: event.code || '# TODO: Implement event handler'
        });
      });
    }
  });

  let code = `"""
Auto-generated LVGL UI Code for MicroPython
Project: ${projectName}
Generated: ${new Date().toISOString()}
Display Size: ${canvasSize.width}x${canvasSize.height}
"""

import lvgl as lv

`;

  // Generate event callback implementations
  if (eventCallbacks.size > 0) {
    code += `# Event callback implementations\n`;
    Array.from(eventCallbacks).forEach((callback) => {
      const eventType = callback.type.replace('LV_EVENT_', '').toUpperCase();
      code += `def ${callback.name}(e):
    """Event handler for ${callback.type}"""
    code = e.get_code()
    obj = e.get_target()

    if code == lv.EVENT.${eventType}:
        ${callback.code}

`;
    });
  }

  code += `def ${functionName}(parent=None):
    """
    Create the UI for ${projectName}

    Args:
        parent: Parent object (use lv.scr_act() for screen)
    """
    if parent is None:
        parent = lv.scr_act()

`;

  // Generate code for each widget
  sortedWidgets.forEach((widget) => {
    code += generateWidgetCode(widget, sortedWidgets, '    ');
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

function generateMultiPageMicroPythonCode(projectData) {
  const { projectName, pages, assets } = projectData;
  const baseName = sanitizeIdentifier(projectName || 'ui');

  let code = `"""
Auto-generated LVGL UI Code for MicroPython (Multi-Page)
Project: ${projectName}
Generated: ${new Date().toISOString()}
Pages: ${pages.length}
Version: 1.2.0
"""

import lvgl as lv

`;

  // Collect all event callbacks from all pages
  const allEventCallbacks = new Set();
  pages.forEach((page) => {
    page.widgets?.forEach((widget) => {
      if (widget.events && widget.events.length > 0) {
        widget.events.forEach((event) => {
          const callbackStr = JSON.stringify({
            name: sanitizeIdentifier(event.callback),
            type: event.type,
            code: event.code || '# TODO: Implement event handler'
          });
          allEventCallbacks.add(callbackStr);
        });
      }
    });
  });

  // Generate event callback implementations
  if (allEventCallbacks.size > 0) {
    code += `# Event callback implementations\n`;
    Array.from(allEventCallbacks).forEach((callbackStr) => {
      const callback = JSON.parse(callbackStr);
      const eventType = callback.type.replace('LV_EVENT_', '').toUpperCase();
      code += `def ${callback.name}(e):
    """Event handler for ${callback.type}"""
    code = e.get_code()
    obj = e.get_target()

    if code == lv.EVENT.${eventType}:
        ${callback.code}

`;
    });
  }

  // Generate screen objects
  code += `# Screen objects for each page\n`;
  code += `screens = [None] * ${pages.length}\n`;
  code += `current_screen = 0\n\n`;

  // Generate function for each page
  pages.forEach((page, index) => {
    const pageFunctionName = `${baseName}_create_${sanitizeIdentifier(page.name)}`;
    const pageWidgets = page.widgets || [];

    // Sort widgets to ensure parents are created before children
    const sortedWidgets = [...pageWidgets].sort((a, b) => {
      if (!a.parentId && b.parentId) return -1;
      if (a.parentId && !b.parentId) return 1;
      return 0;
    });

    code += `def ${pageFunctionName}(parent=None):
    """
    Create page: ${page.name}
    Size: ${page.canvasSize.width}x${page.canvasSize.height}
    Widgets: ${pageWidgets.length}
    """
    if parent is None:
        parent = lv.scr_act()

`;

    // Generate code for each widget
    sortedWidgets.forEach((widget) => {
      code += generateWidgetCode(widget, sortedWidgets, '    ');
    });

    code += `\n`;
  });

  // Generate navigation functions
  code += `def ${baseName}_load_page(page_index):
    """
    Load a specific page by index

    Args:
        page_index: Index of the page to load (0-${pages.length - 1})
    """
    global screens, current_screen

    if page_index < 0 or page_index >= ${pages.length}:
        return

    if screens[page_index] is None:
        screens[page_index] = lv.obj()

        # Create the page based on index
${pages.map((page, index) => {
  const pageFunctionName = `${baseName}_create_${sanitizeIdentifier(page.name)}`;
  return `        ${index === 0 ? 'if' : 'elif'} page_index == ${index}:
            ${pageFunctionName}(screens[${index}])`;
}).join('\n')}

    lv.scr_load(screens[page_index])
    current_screen = page_index

def ${baseName}_get_current_page():
    """Get current page index"""
    return current_screen

def ${baseName}_init():
    """
    Initialize all screens and show the first page
    """
    global screens, current_screen

    # Initialize screen array
    screens = [None] * ${pages.length}
    current_screen = 0

    # Load first page
    ${baseName}_load_page(0)

# Example usage:
# ${baseName}_init()
# ${baseName}_load_page(1)  # Switch to page 1
`;

  return code;
}

export default generateMicroPythonCode;
