const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  saveProject: (projectData) => ipcRenderer.invoke('save-project', projectData),
  loadProject: () => ipcRenderer.invoke('load-project'),
  exportCode: (data) => ipcRenderer.invoke('export-code', data),

  // Menu event listeners
  onMenuCommand: (callback) => {
    const channels = [
      'menu-new-project',
      'menu-open-project',
      'menu-save-project',
      'menu-export-code',
      'menu-undo',
      'menu-redo',
      'menu-zoom-in',
      'menu-zoom-out',
      'menu-zoom-reset',
      'menu-toggle-grid'
    ];

    const listeners = channels.map((channel) => {
      const listener = () => callback(channel);
      ipcRenderer.on(channel, listener);
      return [channel, listener];
    });
    // Unsubscribe function, so a listener is never registered twice
    return () => listeners.forEach(([channel, listener]) => ipcRenderer.removeListener(channel, listener));
  }
});

contextBridge.exposeInMainWorld('electronAPI', {
  readTemplate: (architecture, templateName) =>
    ipcRenderer.invoke('read-template', architecture, templateName),
  getTemplate: (architecture, templateName) =>
    ipcRenderer.invoke('get-template', architecture, templateName),
  renderTemplate: (architecture, templateName, data, builtinSource) =>
    ipcRenderer.invoke('render-template', architecture, templateName, data, builtinSource),
  writeTemplate: (architecture, templateName, content) =>
    ipcRenderer.invoke('write-template', architecture, templateName, content),
  resetTemplate: (architecture, templateName) =>
    ipcRenderer.invoke('reset-template', architecture, templateName),
  convertFont: (request) => ipcRenderer.invoke('convert-font', request),
});
