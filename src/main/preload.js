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
  writeTemplate: (architecture, templateName, content) =>
    ipcRenderer.invoke('write-template', architecture, templateName, content),
});
