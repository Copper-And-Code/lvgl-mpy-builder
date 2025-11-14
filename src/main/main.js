const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');

// Disable GPU VSync to prevent GL surface errors on Linux
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-frame-rate-limit');

// Disable GtkFileChooserNative to prevent GTK casting and signal handler errors on Linux
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('disable-features', 'GtkFileChooserNative');
}

let mainWindow;

// Configure Content Security Policy
function setupContentSecurityPolicy() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // Define CSP based on environment
    const csp = process.env.NODE_ENV === 'development'
      ? [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' http://localhost:* ws://localhost:*",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "connect-src 'self' http://localhost:* ws://localhost:*"
        ].join('; ')
      : [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "connect-src 'self'"
        ].join('; ');

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    title: 'LVGL Visual Editor',
    icon: path.join(__dirname, '../../public/icon.png'),
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setupContentSecurityPolicy();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers for file operations
ipcMain.handle('save-project', async (event, projectData) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save LVGL Project',
      defaultPath: 'lvgl-project.json',
      filters: [
        { name: 'LVGL Project', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2));
      return { success: true, path: filePath };
    }
    return { success: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-project', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Open LVGL Project',
      filters: [
        { name: 'LVGL Project', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
      const data = fs.readFileSync(filePaths[0], 'utf-8');
      return { success: true, data: JSON.parse(data), path: filePaths[0] };
    }
    return { success: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-code', async (event, { code, filename, language }) => {
  try {
    const extension = language === 'c' ? 'c' : 'py';
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: `Export ${language.toUpperCase()} Code`,
      defaultPath: filename || `lvgl_ui.${extension}`,
      filters: [
        { name: `${language.toUpperCase()} File`, extensions: [extension] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (filePath) {
      fs.writeFileSync(filePath, code);
      return { success: true, path: filePath };
    }
    return { success: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
