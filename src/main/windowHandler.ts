import { app, BrowserWindow, screen } from 'electron';
import path from 'path';
import { getAssetPath, resolveHtmlPath } from './util';

export const windows: { [key: string]: BrowserWindow | null } = {
  mainWindow: null,
};

export const createMainWindow = async () => {
  const displays = screen.getAllDisplays();
  const primaryDisplay = displays[1];

  windows.mainWindow = new BrowserWindow({
    show: false,
    width: 768,
    height: 560,
    icon: getAssetPath('icon.png'),
    title: 'ESO Price Checker',
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  if (primaryDisplay !== undefined) {
    windows.mainWindow.setBounds({
      x:
        primaryDisplay.bounds.x +
        primaryDisplay.size.width / 2 -
        windows.mainWindow.getSize()[0] / 2,
      y:
        primaryDisplay.bounds.y +
        primaryDisplay.size.height / 2 -
        windows.mainWindow.getSize()[1] / 2,
    });
  }

  windows.mainWindow.setMenu(null);
  windows.mainWindow.loadURL(resolveHtmlPath('index.html'));

  windows.mainWindow.on('ready-to-show', () => {
    if (!windows.mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      windows.mainWindow.minimize();
    } else {
      windows.mainWindow.show();
    }
  });

  windows.mainWindow.on('closed', () => {
    windows.mainWindow = null;
  });
};
