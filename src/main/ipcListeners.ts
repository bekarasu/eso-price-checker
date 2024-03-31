import { dialog, ipcMain } from 'electron';
import { start, stop } from './PriceChecker';
import { getAssetPath } from './util';

const registerIPCListeners = (): void => {
  ipcMain.on('start-price-checker', async (event, items) => {
    start(items);
  });
  ipcMain.on('stop-price-checker', async () => {
    stop();
  });
  ipcMain.on('show-dialog', async (event, message: unknown) => {
    dialog.showMessageBox({
      message: message as string,
      title: 'ESO Price Checker',
      icon: getAssetPath('icon.png'),
    });
  });
};

export default registerIPCListeners;
