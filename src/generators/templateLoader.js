// Template Loader for Code Generation
// Loads external template files that can be customized by users
// Supports multi-architecture templates (unix, stm32, esp32, etc.)

import Handlebars from 'handlebars';

// Supported architectures
export const ARCHITECTURES = {
  UNIX: 'unix',
  STM32: 'stm32',
  ESP32: 'esp32',
};

// Default architecture
export const DEFAULT_ARCHITECTURE = ARCHITECTURES.UNIX;

// Default templates (fallback if external files are not available)
const defaultTemplates = {
  c: `/*
 * Auto-generated LVGL UI Code
 * Project: {{projectName}}
 * Generated: {{generatedDate}}
 * Display Size: {{canvasWidth}}x{{canvasHeight}}
 */

#include "lvgl.h"

{{#if hasEventCallbacks}}
/* Event callback declarations */
{{#each eventCallbacks}}
static void {{this.name}}(lv_event_t *e);
{{/each}}

{{/if}}
void {{functionName}}(lv_obj_t *parent)
{
    if (parent == NULL) {
        parent = lv.scr_act();
    }

{{#each widgets}}
{{{this}}}
{{/each}}
}

{{#if hasEventCallbacks}}
{{#each eventCallbacks}}
static void {{this.name}}(lv_event_t *e)
{
    lv_event_code_t code = lv_event_get_code(e);
    lv_obj_t *obj = lv_event_get_target(e);

    if (code == {{this.type}}) {
        {{this.code}}
    }
}

{{/each}}
{{/if}}
void {{functionName}}_init(void)
{
    lv_obj_t *screen = lv_obj_create(NULL);
    {{functionName}}(screen);
    lv_scr_load(screen);
}
`,

  micropython: `"""
Auto-generated LVGL UI Code for MicroPython
Project: {{projectName}}
Generated: {{generatedDate}}
Display Size: {{canvasWidth}}x{{canvasHeight}}
"""

import lvgl as lv

{{#if hasEventCallbacks}}
{{#each eventCallbacks}}
def {{this.name}}(e):
    code = e.get_code()
    obj = e.get_target()

    if code == lv.EVENT.{{this.eventType}}:
        {{this.code}}

{{/each}}
{{/if}}
def {{functionName}}(parent=None):
    if parent is None:
        parent = lv.scr_act()

{{#each widgets}}
{{{this}}}
{{/each}}

def {{functionName}}_init():
    screen = lv.obj()
    {{functionName}}(screen)
    lv.scr_load(screen)
`,

  c_multipage: `/*
 * Auto-generated LVGL UI Code (Multi-Page)
 * Project: {{projectName}}
 * Generated: {{generatedDate}}
 * Pages: {{pageCount}}
 */

#include "lvgl.h"

{{#if hasEventCallbacks}}
{{#each eventCallbacks}}
static void {{this.name}}(lv_event_t *e);
{{/each}}

{{/if}}
static lv_obj_t *screens[{{pageCount}}];
static int current_screen = 0;

{{#each pages}}
void {{this.functionName}}(lv_obj_t *parent)
{
    if (parent == NULL) {
        parent = lv_scr_act();
    }

{{#each this.widgets}}
{{{this}}}
{{/each}}
}

{{/each}}
{{#if hasEventCallbacks}}
{{#each eventCallbacks}}
static void {{this.name}}(lv_event_t *e)
{
    lv_event_code_t code = lv_event_get_code(e);
    lv_obj_t *obj = lv_event_get_target(e);

    if (code == {{this.type}}) {
        {{this.code}}
    }
}

{{/each}}
{{/if}}
void {{baseName}}_load_page(int page_index)
{
    if (page_index < 0 || page_index >= {{pageCount}}) {
        return;
    }

    if (screens[page_index] == NULL) {
        screens[page_index] = lv_obj_create(NULL);

        switch(page_index) {
{{#each pages}}
            case {{@index}}:
                {{this.functionName}}(screens[{{@index}}]);
                break;
{{/each}}
        }
    }

    lv_scr_load(screens[page_index]);
    current_screen = page_index;
}

int {{baseName}}_get_current_page(void)
{
    return current_screen;
}

void {{baseName}}_init(void)
{
    for (int i = 0; i < {{pageCount}}; i++) {
        screens[i] = NULL;
    }
    {{baseName}}_load_page(0);
}
`,

  micropython_multipage: `"""
Auto-generated LVGL UI Code for MicroPython (Multi-Page)
Project: {{projectName}}
Generated: {{generatedDate}}
Pages: {{pageCount}}
"""

import lvgl as lv

{{#if hasEventCallbacks}}
{{#each eventCallbacks}}
def {{this.name}}(e):
    code = e.get_code()
    obj = e.get_target()

    if code == lv.EVENT.{{this.eventType}}:
        {{this.code}}

{{/each}}
{{/if}}
screens = [None] * {{pageCount}}
current_screen = 0

{{#each pages}}
def {{this.functionName}}(parent=None):
    if parent is None:
        parent = lv.scr_act()

{{#each this.widgets}}
{{{this}}}
{{/each}}

{{/each}}
def {{baseName}}_load_page(page_index):
    global screens, current_screen

    if page_index < 0 or page_index >= {{pageCount}}:
        return

    if screens[page_index] is None:
        screens[page_index] = lv.obj()

{{#each pages}}
        {{#if @first}}if{{else}}elif{{/if}} page_index == {{@index}}:
            {{this.functionName}}(screens[{{@index}}])
{{/each}}

    lv.scr_load(screens[page_index])
    current_screen = page_index

def {{baseName}}_get_current_page():
    return current_screen

def {{baseName}}_init():
    global screens, current_screen
    screens = [None] * {{pageCount}}
    current_screen = 0
    {{baseName}}_load_page(0)
`,
};

// Template cache
const templateCache = {};

/**
 * Load a template from file or use default
 * @param {string} templateName - Name of the template (c, micropython, c_multipage, micropython_multipage)
 * @param {string} architecture - Target architecture (unix, stm32, esp32, etc.)
 * @returns {Promise<Function>} Compiled Handlebars template
 */
export async function loadTemplate(templateName, architecture = DEFAULT_ARCHITECTURE) {
  // Create unique cache key including architecture
  const cacheKey = `${architecture}_${templateName}`;

  // Check cache first
  if (templateCache[cacheKey]) {
    return templateCache[cacheKey];
  }

  let templateSource = null;

  // Try to load from external file with architecture-specific path
  try {
    if (window.electronAPI && window.electronAPI.readFile) {
      const templatePath = `templates/${architecture}/${templateName}_template.hbs`;
      templateSource = await window.electronAPI.readFile(templatePath);
    }
  } catch (error) {
    console.warn(`Could not load external template ${templateName} for ${architecture}:`, error);
  }

  // Fallback to default template
  if (!templateSource) {
    templateSource = defaultTemplates[templateName];
  }

  if (!templateSource) {
    throw new Error(`Template "${templateName}" not found for architecture "${architecture}"`);
  }

  // Compile template
  const compiledTemplate = Handlebars.compile(templateSource);

  // Cache the compiled template
  templateCache[cacheKey] = compiledTemplate;

  return compiledTemplate;
}

/**
 * Get template source code for editing
 * @param {string} templateName - Name of the template
 * @param {string} architecture - Target architecture
 * @returns {Promise<string>} Template source code
 */
export async function getTemplateSource(templateName, architecture = DEFAULT_ARCHITECTURE) {
  try {
    if (window.electronAPI && window.electronAPI.readFile) {
      const templatePath = `templates/${architecture}/${templateName}_template.hbs`;
      return await window.electronAPI.readFile(templatePath);
    }
  } catch (error) {
    // File doesn't exist or can't be read
  }

  // Return default template
  return defaultTemplates[templateName] || '';
}

/**
 * Save template source code
 * @param {string} templateName - Name of the template
 * @param {string} architecture - Target architecture
 * @param {string} source - Template source code
 * @returns {Promise<boolean>} Success status
 */
export async function saveTemplateSource(templateName, architecture = DEFAULT_ARCHITECTURE, source) {
  try {
    if (window.electronAPI && window.electronAPI.writeFile) {
      const templatePath = `templates/${architecture}/${templateName}_template.hbs`;
      await window.electronAPI.writeFile(templatePath, source);

      // Clear cache to force reload
      const cacheKey = `${architecture}_${templateName}`;
      delete templateCache[cacheKey];

      return true;
    }
  } catch (error) {
    console.error(`Could not save template ${templateName} for ${architecture}:`, error);
    return false;
  }

  return false;
}

/**
 * Reset template to default
 * @param {string} templateName - Name of the template
 * @param {string} architecture - Target architecture
 * @returns {Promise<boolean>} Success status
 */
export async function resetTemplate(templateName, architecture = DEFAULT_ARCHITECTURE) {
  const defaultSource = defaultTemplates[templateName];
  if (!defaultSource) {
    return false;
  }

  return await saveTemplateSource(templateName, architecture, defaultSource);
}

/**
 * Get list of available templates
 * @returns {Array<{name: string, label: string}>} List of templates
 */
export function getAvailableTemplates() {
  return [
    { name: 'c', label: 'C (Single Page)' },
    { name: 'micropython', label: 'MicroPython (Single Page)' },
    { name: 'c_multipage', label: 'C (Multi-Page)' },
    { name: 'micropython_multipage', label: 'MicroPython (Multi-Page)' },
  ];
}

/**
 * Get list of available architectures
 * @returns {Array<{id: string, name: string, description: string}>} List of architectures
 */
export function getAvailableArchitectures() {
  return [
    {
      id: ARCHITECTURES.UNIX,
      name: 'Unix/Linux',
      description: 'Generic Unix/Linux systems'
    },
    {
      id: ARCHITECTURES.STM32,
      name: 'STM32',
      description: 'STM32 microcontrollers with LVGL'
    },
    {
      id: ARCHITECTURES.ESP32,
      name: 'ESP32',
      description: 'ESP32 microcontrollers (ESP-IDF or Arduino)'
    },
  ];
}

/**
 * Check if an architecture is supported
 * @param {string} architecture - Architecture ID to check
 * @returns {boolean} True if architecture is supported
 */
export function isArchitectureSupported(architecture) {
  return Object.values(ARCHITECTURES).includes(architecture);
}

export default {
  loadTemplate,
  getTemplateSource,
  saveTemplateSource,
  resetTemplate,
  getAvailableTemplates,
  getAvailableArchitectures,
  isArchitectureSupported,
  ARCHITECTURES,
  DEFAULT_ARCHITECTURE,
};
