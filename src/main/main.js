const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Configure Electron flags for better Linux compatibility
if (process.platform === 'linux') {
  // Disable GPU VSync to prevent GL surface errors on Linux
  app.commandLine.appendSwitch('disable-gpu-vsync');
  app.commandLine.appendSwitch('disable-frame-rate-limit');
  app.commandLine.appendSwitch('disable-gpu-vsync-check');

  // Use X11 backend and disable hardware acceleration features that cause GL errors
  app.commandLine.appendSwitch('disable-software-rasterizer');
  app.commandLine.appendSwitch('ignore-gpu-blacklist');

  // Use classic file picker instead of native GTK dialogs to prevent casting errors
  app.commandLine.appendSwitch('disable-features', 'GtkFileChooserNative');

  // Suppress GTK warnings and portal usage
  process.env.GTK_USE_PORTAL = '0';
  process.env.G_MESSAGES_DEBUG = '';

  // Disable sandbox and shared memory issues
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-dev-shm-usage');

  // Disable GPU to avoid OpenGL errors in restricted environments
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');

  // Fix /tmp access issues by using home directory for temporary files
  const userHome = os.homedir();
  const tmpDir = path.join(userHome, '.lvgl-editor-tmp');

  // Create tmp directory if it doesn't exist
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // Set TMPDIR environment variable to use our custom tmp directory
  process.env.TMPDIR = tmpDir;

  // Use custom directories for cache and user data to avoid /tmp
  app.commandLine.appendSwitch('disk-cache-dir', path.join(tmpDir, 'cache'));
  app.commandLine.appendSwitch('user-data-dir', path.join(tmpDir, 'user-data'));
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
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
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
