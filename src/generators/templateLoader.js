// Template Loader for Code Generation
// Loads external template files that can be customized by users
// Supports multi-architecture templates (unix, stm32, esp32, rp2040, nrf52, etc.)
// C templates target LVGL 9.6, MicroPython templates the lv_micropython binding (LVGL 9.3)

import HandlebarsBase from 'handlebars';
import { indentText } from './indent';

export { indentText };

// Isolated Handlebars environment for code generation
const Handlebars = HandlebarsBase.create();

Handlebars.registerHelper('indent', (text, spaces) => indentText(text, spaces));

// Template file access is only available inside Electron (see preload.js)
function getElectronAPI() {
  return typeof window !== 'undefined' ? window.electronAPI : undefined;
}

// Supported architectures
export const ARCHITECTURES = {
  UNIX: 'unix',
  STM32: 'stm32',
  ESP32: 'esp32',
  RP2040: 'rp2040',
  NRF52: 'nrf52',
};

// Default architecture
export const DEFAULT_ARCHITECTURE = ARCHITECTURES.STM32;

// Default templates (fallback if external files are not available)
// C templates target LVGL 9.6, MicroPython templates the lv_micropython binding (LVGL 9.3) API
const defaultTemplates = {
  c: `/*
 * Auto-generated LVGL UI Code
 * Project: {{projectName}}
 * Generated: {{generatedDate}}
 * Pages: {{pageCount}}
 *
 * LVGL Version: 9.6 (no deprecated APIs)
 */

#include "lvgl.h"

{{#if declarations}}
{{declarations}}

{{/if}}

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
        parent = lv_screen_active();
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
    lv_obj_t *obj = lv_event_get_target_obj(e);
    LV_UNUSED(obj);

    {{indent this.body 4}}
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

    lv_screen_load(screens[page_index]);
    current_screen = page_index;
}

void {{baseName}}_load_page_anim(int page_index, lv_screen_load_anim_t anim, uint32_t time, uint32_t delay)
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

    lv_screen_load_anim(screens[page_index], anim, time, delay, false);
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

  micropython: `"""
Auto-generated LVGL UI Code for MicroPython
Project: {{projectName}}
Generated: {{generatedDate}}
Pages: {{pageCount}}

LVGL Version: 9.3 (lv_micropython binding)
"""

import lvgl as lv

{{#if declarations}}
{{declarations}}

{{/if}}

{{#if hasEventCallbacks}}
{{#each eventCallbacks}}
def {{this.name}}(e):
    code = e.get_code()
    obj = e.get_target_obj()

    {{indent this.body 4}}

{{/each}}
{{/if}}
screens = [None] * {{pageCount}}
current_screen = 0

{{#each pages}}
def {{this.functionName}}(parent=None):
    if parent is None:
        parent = lv.screen_active()

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

    lv.screen_load(screens[page_index])
    current_screen = page_index

def {{baseName}}_load_page_anim(page_index, anim, time_ms, delay_ms):
    global screens, current_screen

    if page_index < 0 or page_index >= {{pageCount}}:
        return

    if screens[page_index] is None:
        screens[page_index] = lv.obj()

{{#each pages}}
        {{#if @first}}if{{else}}elif{{/if}} page_index == {{@index}}:
            {{this.functionName}}(screens[{{@index}}])
{{/each}}

    lv.screen_load_anim(screens[page_index], anim, time_ms, delay_ms, False)
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
 * @param {string} templateName - Name of the template (c, micropython)
 * @param {string} architecture - Target architecture (unix, stm32, esp32, rp2040, nrf52, etc.)
 * @returns {Promise<Function>} Compiled Handlebars template
 */
export async function loadTemplate(templateName, architecture = DEFAULT_ARCHITECTURE) {
  const cacheKey = `${architecture}_${templateName}`;

  if (templateCache[cacheKey]) {
    return templateCache[cacheKey];
  }

  let templateSource = null;

  // Try to load from external file with architecture-specific path
  try {
    const api = getElectronAPI();
    if (api?.readTemplate) {
      templateSource = await api.readTemplate(architecture, templateName);
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
  // The output is source code, not HTML: never HTML-escape values
  // (otherwise `a = b > c` becomes `a &#x3D; b &gt; c`)
  const compiledTemplate = Handlebars.compile(templateSource, { noEscape: true });

  // Cache the compiled template
  templateCache[cacheKey] = compiledTemplate;

  return compiledTemplate;
}

/**
 * Clear template cache (useful when templates are updated)
 */
export function clearTemplateCache() {
  Object.keys(templateCache).forEach(key => delete templateCache[key]);
}

/**
 * Get template source code for editing
 */
export async function getTemplateSource(templateName, architecture = DEFAULT_ARCHITECTURE) {
  try {
    const api = getElectronAPI();
    if (api?.readTemplate) {
      const source = await api.readTemplate(architecture, templateName);
      if (source) return source;
    }
  } catch (error) {
    // File doesn't exist or can't be read
  }

  return defaultTemplates[templateName] || '';
}

/**
 * Save template source code
 */
export async function saveTemplateSource(templateName, architecture = DEFAULT_ARCHITECTURE, source) {
  try {
    const api = getElectronAPI();
    if (api?.writeTemplate) {
      await api.writeTemplate(architecture, templateName, source);

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
 */
export function getAvailableTemplates() {
  return [
    { name: 'c', label: 'C' },
    { name: 'micropython', label: 'MicroPython' },
  ];
}

/**
 * Get list of available architectures
 */
export function getAvailableArchitectures() {
  return [
    {
      id: ARCHITECTURES.UNIX,
      name: 'Unix/Linux',
      description: 'Generic Unix/Linux systems, desktop simulators'
    },
    {
      id: ARCHITECTURES.STM32,
      name: 'STM32',
      description: 'STM32 microcontrollers with HAL + LVGL'
    },
    {
      id: ARCHITECTURES.ESP32,
      name: 'ESP32',
      description: 'ESP32 microcontrollers (ESP-IDF or Arduino)'
    },
    {
      id: ARCHITECTURES.RP2040,
      name: 'RP2040 / Pico',
      description: 'Raspberry Pi Pico / RP2040 boards'
    },
    {
      id: ARCHITECTURES.NRF52,
      name: 'nRF52',
      description: 'Nordic nRF52 series (nRF52832, nRF52840)'
    },
  ];
}

/**
 * Check if an architecture is supported
 */
export function isArchitectureSupported(architecture) {
  return Object.values(ARCHITECTURES).includes(architecture);
}

export default {
  loadTemplate,
  clearTemplateCache,
  getTemplateSource,
  saveTemplateSource,
  resetTemplate,
  getAvailableTemplates,
  getAvailableArchitectures,
  isArchitectureSupported,
  ARCHITECTURES,
  DEFAULT_ARCHITECTURE,
};
