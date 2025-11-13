/**
 * Plugin System v2.0
 * Allows loading external plugins to extend editor functionality
 */

class PluginSystem {
  constructor() {
    this.plugins = new Map();
    this.hooks = {
      'widget:created': [],
      'widget:updated': [],
      'widget:deleted': [],
      'project:loaded': [],
      'project:saved': [],
      'code:generated': [],
      'canvas:render': [],
    };
  }

  /**
   * Register a plugin
   * @param {Object} plugin - Plugin object with metadata and hooks
   */
  registerPlugin(plugin) {
    if (!plugin.id || !plugin.name || !plugin.version) {
      throw new Error('Plugin must have id, name, and version');
    }

    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered`);
    }

    // Validate plugin structure
    const validatedPlugin = {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      description: plugin.description || '',
      author: plugin.author || 'Unknown',
      enabled: true,
      initialize: plugin.initialize || (() => {}),
      destroy: plugin.destroy || (() => {}),
      hooks: plugin.hooks || {},
      widgets: plugin.widgets || [],
      generators: plugin.generators || [],
      tools: plugin.tools || [],
    };

    this.plugins.set(plugin.id, validatedPlugin);

    // Register plugin hooks
    if (plugin.hooks) {
      Object.keys(plugin.hooks).forEach(hookName => {
        if (this.hooks[hookName]) {
          this.hooks[hookName].push({
            pluginId: plugin.id,
            handler: plugin.hooks[hookName],
          });
        }
      });
    }

    // Initialize the plugin
    try {
      validatedPlugin.initialize();
      console.log(`Plugin ${plugin.id} registered successfully`);
    } catch (error) {
      console.error(`Error initializing plugin ${plugin.id}:`, error);
      this.plugins.delete(plugin.id);
      throw error;
    }

    return validatedPlugin;
  }

  /**
   * Unregister a plugin
   */
  unregisterPlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Call destroy hook
    try {
      plugin.destroy();
    } catch (error) {
      console.error(`Error destroying plugin ${pluginId}:`, error);
    }

    // Remove hooks
    Object.keys(this.hooks).forEach(hookName => {
      this.hooks[hookName] = this.hooks[hookName].filter(
        h => h.pluginId !== pluginId
      );
    });

    this.plugins.delete(pluginId);
    console.log(`Plugin ${pluginId} unregistered`);
  }

  /**
   * Enable/disable a plugin
   */
  setPluginEnabled(pluginId, enabled) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.enabled = enabled;
  }

  /**
   * Execute hooks for a specific event
   */
  async executeHook(hookName, data) {
    if (!this.hooks[hookName]) {
      return data;
    }

    let result = data;

    for (const hook of this.hooks[hookName]) {
      const plugin = this.plugins.get(hook.pluginId);
      if (!plugin || !plugin.enabled) continue;

      try {
        const hookResult = await hook.handler(result);
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error) {
        console.error(`Error executing hook ${hookName} for plugin ${hook.pluginId}:`, error);
      }
    }

    return result;
  }

  /**
   * Get all registered plugins
   */
  getPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a specific plugin
   */
  getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }

  /**
   * Get custom widgets from all plugins
   */
  getCustomWidgets() {
    const widgets = [];
    this.plugins.forEach(plugin => {
      if (plugin.enabled && plugin.widgets) {
        widgets.push(...plugin.widgets);
      }
    });
    return widgets;
  }

  /**
   * Get custom generators from all plugins
   */
  getCustomGenerators() {
    const generators = [];
    this.plugins.forEach(plugin => {
      if (plugin.enabled && plugin.generators) {
        generators.push(...plugin.generators);
      }
    });
    return generators;
  }

  /**
   * Load plugin from URL or file
   */
  async loadPluginFromURL(url) {
    try {
      const response = await fetch(url);
      const pluginCode = await response.text();

      // Create a sandboxed execution context
      const pluginModule = this.executePluginCode(pluginCode);

      if (pluginModule && pluginModule.default) {
        return this.registerPlugin(pluginModule.default);
      } else {
        throw new Error('Plugin must export a default object');
      }
    } catch (error) {
      console.error('Error loading plugin:', error);
      throw error;
    }
  }

  /**
   * Execute plugin code in a controlled context
   */
  executePluginCode(code) {
    // In a real implementation, this should use a proper sandbox
    // For now, we use Function constructor with limited scope
    try {
      const moduleExports = {};
      const module = { exports: moduleExports };

      const pluginFunction = new Function('module', 'exports', code);
      pluginFunction(module, moduleExports);

      return module.exports;
    } catch (error) {
      console.error('Error executing plugin code:', error);
      throw error;
    }
  }

  /**
   * Export plugin configuration
   */
  exportConfig() {
    return {
      plugins: this.getPlugins().map(p => ({
        id: p.id,
        name: p.name,
        version: p.version,
        enabled: p.enabled,
      })),
    };
  }
}

// Create singleton instance
const pluginSystem = new PluginSystem();

export default pluginSystem;

// Example plugin structure for documentation:
export const examplePlugin = {
  id: 'my-plugin',
  name: 'My Custom Plugin',
  version: '1.0.0',
  description: 'A sample plugin',
  author: 'Plugin Developer',

  // Called when plugin is loaded
  initialize() {
    console.log('Plugin initialized');
  },

  // Called when plugin is unloaded
  destroy() {
    console.log('Plugin destroyed');
  },

  // Hook into editor events
  hooks: {
    'widget:created': (widget) => {
      console.log('Widget created:', widget);
      return widget; // Can modify and return
    },
    'code:generated': (code) => {
      console.log('Code generated');
      return code; // Can modify generated code
    },
  },

  // Add custom widgets
  widgets: [
    {
      type: 'custom_widget',
      name: 'Custom Widget',
      icon: '🎨',
      defaultProps: {
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      },
    },
  ],

  // Add custom code generators
  generators: [
    {
      id: 'rust',
      name: 'Rust',
      generate: (widgets) => {
        return '// Rust code here';
      },
    },
  ],

  // Add custom tools
  tools: [
    {
      id: 'my-tool',
      name: 'My Tool',
      icon: '🔧',
      action: () => {
        console.log('Tool activated');
      },
    },
  ],
};
