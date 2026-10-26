import { useState, useEffect } from 'react';
import { Puzzle, Plus, Trash2, Power, PowerOff, Upload, Download } from 'lucide-react';
import pluginSystem, {
  EXTERNAL_PLUGINS_ENABLED,
  EXTERNAL_PLUGINS_DISABLED_MESSAGE,
} from '../core/pluginSystem';
import '../styles/PluginManager.css';

export default function PluginManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [plugins, setPlugins] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [pluginUrl, setPluginUrl] = useState('');
  const [pluginCode, setPluginCode] = useState('');
  const [loadMethod, setLoadMethod] = useState('url'); // 'url' or 'code'

  useEffect(() => {
    refreshPlugins();
  }, []);

  const refreshPlugins = () => {
    setPlugins(pluginSystem.getPlugins());
  };

  const handleLoadPlugin = async () => {
    try {
      if (loadMethod === 'url') {
        if (!pluginUrl.trim()) {
          alert('Please enter a plugin URL');
          return;
        }
        await pluginSystem.loadPluginFromURL(pluginUrl);
      } else {
        if (!pluginCode.trim()) {
          alert('Please enter plugin code');
          return;
        }
        const pluginModule = pluginSystem.executePluginCode(pluginCode);
        if (pluginModule && pluginModule.default) {
          pluginSystem.registerPlugin(pluginModule.default);
        } else {
          throw new Error('Plugin must export a default object');
        }
      }

      setPluginUrl('');
      setPluginCode('');
      setShowAddDialog(false);
      refreshPlugins();
      alert('Plugin loaded successfully');
    } catch (error) {
      alert(`Error loading plugin: ${error.message}`);
    }
  };

  const handleUnloadPlugin = (pluginId) => {
    if (confirm(`Unload plugin ${pluginId}?`)) {
      try {
        pluginSystem.unregisterPlugin(pluginId);
        refreshPlugins();
      } catch (error) {
        alert(`Error unloading plugin: ${error.message}`);
      }
    }
  };

  const handleTogglePlugin = (pluginId, enabled) => {
    try {
      pluginSystem.setPluginEnabled(pluginId, enabled);
      refreshPlugins();
    } catch (error) {
      alert(`Error toggling plugin: ${error.message}`);
    }
  };

  const handleExportConfig = () => {
    const config = pluginSystem.exportConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plugin-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadFromFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const pluginModule = pluginSystem.executePluginCode(e.target.result);
        if (pluginModule && pluginModule.default) {
          pluginSystem.registerPlugin(pluginModule.default);
          refreshPlugins();
          alert('Plugin loaded successfully');
        } else {
          throw new Error('Plugin must export a default object');
        }
      } catch (error) {
        alert(`Error loading plugin: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <button
        className="plugin-manager-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Plugin Manager"
      >
        <Puzzle size={20} />
      </button>

      {isOpen && (
        <div className="plugin-manager-panel">
          <div className="plugin-manager-header">
            <h3>
              <Puzzle size={18} />
              Plugin Manager
            </h3>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="plugin-manager-toolbar">
            <button
              onClick={() => setShowAddDialog(true)}
              title={EXTERNAL_PLUGINS_ENABLED ? 'Add plugin' : EXTERNAL_PLUGINS_DISABLED_MESSAGE}
              disabled={!EXTERNAL_PLUGINS_ENABLED}
            >
              <Plus size={16} />
              Add Plugin
            </button>
            {EXTERNAL_PLUGINS_ENABLED && (
              <label className="import-button" title="Load from file">
                <Upload size={16} />
                <input
                  type="file"
                  accept=".js"
                  onChange={handleLoadFromFile}
                  style={{ display: 'none' }}
                />
              </label>
            )}
            <button onClick={handleExportConfig} title="Export configuration">
              <Download size={16} />
            </button>
          </div>

          <div className="plugin-list">
            {plugins.length === 0 ? (
              <div className="plugin-empty">
                <p>No plugins loaded</p>
                <p>
                  {EXTERNAL_PLUGINS_ENABLED
                    ? 'Click “Add Plugin” to get started'
                    : EXTERNAL_PLUGINS_DISABLED_MESSAGE}
                </p>
              </div>
            ) : (
              plugins.map((plugin) => (
                <div key={plugin.id} className={`plugin-item ${!plugin.enabled ? 'disabled' : ''}`}>
                  <div className="plugin-info">
                    <h4>{plugin.name}</h4>
                    <div className="plugin-meta">
                      <span className="plugin-id">{plugin.id}</span>
                      <span className="plugin-version">v{plugin.version}</span>
                      {plugin.author && <span className="plugin-author">by {plugin.author}</span>}
                    </div>
                    {plugin.description && (
                      <p className="plugin-description">{plugin.description}</p>
                    )}
                    {plugin.widgets.length > 0 && (
                      <div className="plugin-features">
                        📦 {plugin.widgets.length} custom widget{plugin.widgets.length !== 1 ? 's' : ''}
                      </div>
                    )}
                    {plugin.generators.length > 0 && (
                      <div className="plugin-features">
                        ⚙️ {plugin.generators.length} generator{plugin.generators.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div className="plugin-actions">
                    <button
                      onClick={() => handleTogglePlugin(plugin.id, !plugin.enabled)}
                      title={plugin.enabled ? 'Disable plugin' : 'Enable plugin'}
                      className={plugin.enabled ? 'btn-enabled' : 'btn-disabled'}
                    >
                      {plugin.enabled ? <Power size={16} /> : <PowerOff size={16} />}
                    </button>
                    <button
                      onClick={() => handleUnloadPlugin(plugin.id)}
                      title="Unload plugin"
                      className="btn-delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showAddDialog && (
        <div className="plugin-dialog-overlay">
          <div className="plugin-dialog">
            <h3>Add Plugin</h3>

            <div className="load-method-tabs">
              <button
                className={loadMethod === 'url' ? 'active' : ''}
                onClick={() => setLoadMethod('url')}
              >
                From URL
              </button>
              <button
                className={loadMethod === 'code' ? 'active' : ''}
                onClick={() => setLoadMethod('code')}
              >
                From Code
              </button>
            </div>

            {loadMethod === 'url' ? (
              <div className="form-group">
                <label>Plugin URL</label>
                <input
                  type="text"
                  value={pluginUrl}
                  onChange={(e) => setPluginUrl(e.target.value)}
                  placeholder="https://example.com/my-plugin.js"
                  autoFocus
                />
                <p className="form-hint">
                  Enter the URL of a JavaScript file that exports a plugin
                </p>
              </div>
            ) : (
              <div className="form-group">
                <label>Plugin Code</label>
                <textarea
                  value={pluginCode}
                  onChange={(e) => setPluginCode(e.target.value)}
                  placeholder="module.exports.default = { ... }"
                  rows={10}
                  autoFocus
                />
                <p className="form-hint">
                  Paste JavaScript code that exports a plugin object
                </p>
              </div>
            )}

            <div className="dialog-actions">
              <button onClick={() => setShowAddDialog(false)}>Cancel</button>
              <button onClick={handleLoadPlugin} className="btn-primary">
                Load Plugin
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
