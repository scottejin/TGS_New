const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fetchDashboardData, openInteractiveLoginWindow } = require('./fetcher');

let mainWindow;
let loginContext = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 460,
    height: 620,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer.html'));
}

ipcMain.handle('mytgs:refresh', async () => {
  return await fetchDashboardData();
});

ipcMain.handle('mytgs:openLogin', async () => {
  if (loginContext) return { ok: true, message: 'Login window already open.' };
  loginContext = await openInteractiveLoginWindow();
  return { ok: true, message: 'Login window opened. Sign in there, then close it.' };
});

ipcMain.handle('mytgs:closeLogin', async () => {
  if (loginContext) {
    await loginContext.close();
    loginContext = null;
  }
  return { ok: true };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
