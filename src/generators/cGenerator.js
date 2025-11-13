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
  lines.push(`${indent}lv_anim_set_path_cb(&${animVarName}, ${animation.path});`);

  // Set appropriate setter function based on animation type
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
  const { id, type, name, props, events, animations } = widget;
  const varName = sanitizeIdentifier(name);
  const parentVar = getWidgetParentVarName(widget, widgets);
  const lines = [];

  switch (type) {
    case 'button': {
      lines.push(`${indent}/* Create button: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_btn_create(${parentVar});`);
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
      lines.push(`${indent}lv_obj_t *${varName} = lv_label_create(${parentVar});`);
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
      lines.push(`${indent}lv_obj_t *${varName} = lv_slider_create(${parentVar});`);
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
      lines.push(`${indent}lv_obj_t *${varName} = lv_switch_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);

      if (props.checked) {
        lines.push(`${indent}lv_obj_add_state(${varName}, LV_STATE_CHECKED);`);
      }
      break;
    }

    case 'checkbox': {
      lines.push(`${indent}/* Create checkbox: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_checkbox_create(${parentVar});`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_checkbox_set_text(${varName}, "${props.text || 'Checkbox'}");`);

      if (props.checked) {
        lines.push(`${indent}lv_obj_add_state(${varName}, LV_STATE_CHECKED);`);
      }
      break;
    }

    case 'textarea': {
      lines.push(`${indent}/* Create textarea: ${name} */`);
      lines.push(`${indent}lv_obj_t *${varName} = lv_textarea_create(${parentVar});`);
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
      lines.push(`${indent}lv_obj_t *${varName} = lv_obj_create(${parentVar});`);
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
      lines.push(`${indent}lv_obj_t *${varName} = lv_bar_create(${parentVar});`);
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
      lines.push(`${indent}lv_obj_t *${varName} = lv_arc_create(${parentVar});`);
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
      lines.push(`${indent}lv_obj_t *${varName} = lv_spinner_create(${parentVar}, ${props.speed || 1000}, 60);`);
      lines.push(`${indent}lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
      lines.push(`${indent}lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
      break;
    }

    default:
      lines.push(`${indent}/* Unknown widget type: ${type} */`);
  }

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

export function generateCCode(projectData) {
  const { projectName, widgets, canvasSize, pages, version } = projectData;
  const functionName = sanitizeIdentifier(projectName || 'ui') + '_create';

  // Check if this is a multi-page project (v1.2+)
  const isMultiPage = pages && pages.length > 0;

  if (isMultiPage) {
    return generateMultiPageCCode(projectData);
  }

  // Legacy single-page generation
  return generateSinglePageCCode(projectData);
}

function generateSinglePageCCode(projectData) {
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
          code: event.code || '// TODO: Implement event handler'
        });
      });
    }
  });

  let code = `/*
 * Auto-generated LVGL UI Code
 * Project: ${projectName}
 * Generated: ${new Date().toISOString()}
 * Display Size: ${canvasSize.width}x${canvasSize.height}
 */

#include "lvgl.h"

`;

  // Generate forward declarations for event callbacks
  if (eventCallbacks.size > 0) {
    code += `/* Event callback declarations */\n`;
    Array.from(eventCallbacks).forEach((callback) => {
      code += `static void ${callback.name}(lv_event_t *e);\n`;
    });
    code += '\n';
  }

  code += `/**
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
  sortedWidgets.forEach((widget) => {
    code += generateWidgetCode(widget, sortedWidgets, '    ');
  });

  code += `}

`;

  // Generate event callback implementations
  if (eventCallbacks.size > 0) {
    code += `/* Event callback implementations */\n`;
    Array.from(eventCallbacks).forEach((callback) => {
      code += `static void ${callback.name}(lv_event_t *e)
{
    lv_event_code_t code = lv_event_get_code(e);
    lv_obj_t *obj = lv_event_get_target(e);

    if (code == ${callback.type}) {
        ${callback.code}
    }
}

`;
    });
  }

  code += `/**
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

function generateMultiPageCCode(projectData) {
  const { projectName, pages, assets } = projectData;
  const baseName = sanitizeIdentifier(projectName || 'ui');

  let code = `/*
 * Auto-generated LVGL UI Code (Multi-Page)
 * Project: ${projectName}
 * Generated: ${new Date().toISOString()}
 * Pages: ${pages.length}
 * Version: 1.2.0
 */

#include "lvgl.h"

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
            code: event.code || '// TODO: Implement event handler'
          });
          allEventCallbacks.add(callbackStr);
        });
      }
    });
  });

  // Generate forward declarations for event callbacks
  if (allEventCallbacks.size > 0) {
    code += `/* Event callback declarations */\n`;
    Array.from(allEventCallbacks).forEach((callbackStr) => {
      const callback = JSON.parse(callbackStr);
      code += `static void ${callback.name}(lv_event_t *e);\n`;
    });
    code += '\n';
  }

  // Generate screen objects array
  code += `/* Screen objects for each page */\n`;
  code += `static lv_obj_t *screens[${pages.length}];\n`;
  code += `static int current_screen = 0;\n\n`;

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

    code += `/**
 * Create page: ${page.name}
 * Size: ${page.canvasSize.width}x${page.canvasSize.height}
 * Widgets: ${pageWidgets.length}
 */
void ${pageFunctionName}(lv_obj_t *parent)
{
    if (parent == NULL) {
        parent = lv_scr_act();
    }

`;

    // Generate code for each widget
    sortedWidgets.forEach((widget) => {
      code += generateWidgetCode(widget, sortedWidgets, '    ');
    });

    code += `}

`;
  });

  // Generate event callback implementations
  if (allEventCallbacks.size > 0) {
    code += `/* Event callback implementations */\n`;
    Array.from(allEventCallbacks).forEach((callbackStr) => {
      const callback = JSON.parse(callbackStr);
      code += `static void ${callback.name}(lv_event_t *e)
{
    lv_event_code_t code = lv_event_get_code(e);
    lv_obj_t *obj = lv_event_get_target(e);

    if (code == ${callback.type}) {
        ${callback.code}
    }
}

`;
    });
  }

  // Generate navigation functions
  code += `/**
 * Load a specific page by index
 * @param page_index Index of the page to load (0-${pages.length - 1})
 */
void ${baseName}_load_page(int page_index)
{
    if (page_index < 0 || page_index >= ${pages.length}) {
        return;
    }

    if (screens[page_index] == NULL) {
        screens[page_index] = lv_obj_create(NULL);

        switch(page_index) {
${pages.map((page, index) => {
  const pageFunctionName = `${baseName}_create_${sanitizeIdentifier(page.name)}`;
  return `            case ${index}:
                ${pageFunctionName}(screens[${index}]);
                break;`;
}).join('\n')}
        }
    }

    lv_scr_load(screens[page_index]);
    current_screen = page_index;
}

/**
 * Get current page index
 */
int ${baseName}_get_current_page(void)
{
    return current_screen;
}

/**
 * Initialize all screens and show the first page
 */
void ${baseName}_init(void)
{
    // Initialize screen array
    for (int i = 0; i < ${pages.length}; i++) {
        screens[i] = NULL;
    }

    // Load first page
    ${baseName}_load_page(0);
}
`;

  return code;
}

export default generateCCode;
