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

    channels.forEach(channel => {
      ipcRenderer.on(channel, () => callback(channel));
    });
  }
});
