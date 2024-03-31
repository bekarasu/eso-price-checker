import { Notification } from 'electron';
import { ServerError } from '../errors';
import { devLog, getAssetPath, msToSecond } from '../util';
import { windows } from '../windowHandler';
import { checkInterval } from './config';
import { ICheckItems } from './interfaces/items-to-check.interface';
import { IPriceData } from './interfaces/price-data.interface';
import { Crawler } from './ttc-crawler';

let checkerInterval: NodeJS.Timeout | null = null;

const run = async (dto: ICheckItems): Promise<void> => {
  const crawler = new Crawler();
  await crawler.init();

  windows.mainWindow?.webContents.send('price-checking-started');

  const desiredPrices: IPriceData[] = [];
  for (let i = 0; i < dto.items.length; i += 1) {
    const item = dto.items[i];
    let checkedItems = [] as IPriceData[];
    try {
      // eslint-disable-next-line no-await-in-loop
      checkedItems = await crawler.checkDesiredItemsForPrice(
        dto.server,
        dto.platform,
        item.name,
        item.price,
      );
    } catch (err) {
      if (!(err instanceof Error)) {
        throw err;
      }

      if (err instanceof ServerError) {
        if (!err.isCritical()) {
          devLog(err.message);

          continue;
        }
      }

      windows.mainWindow?.webContents.send('server-error', err.message);
      return;
    }

    desiredPrices.push(...checkedItems);
    const progress = ((i + 1) / dto.items.length) * 100;
    windows.mainWindow?.webContents.send('progress-updated', progress);
  }

  if (desiredPrices.length === 0) {
    windows.mainWindow?.webContents.send(
      'warn-message',
      'There is no any items for desired price.',
    );
  }

  try {
    await crawler.close();
  } catch (err) {
    if (err instanceof Error) {
      devLog(err.message);
    }
  }

  if (!windows.mainWindow?.isFocused()) {
    const ntf = new Notification({
      icon: getAssetPath('icon.png'),
      title: 'ESO Price Checker',
      body: `Price checking is done. For more detail, please click.`,
    });
    ntf.on('click', () => windows.mainWindow?.show());
    ntf.show();
  }

  windows.mainWindow?.webContents.send('price-check-done', {
    prices: desiredPrices,
    checkInterval: msToSecond(checkInterval),
  });
};

export const start = async (dto: ICheckItems) => {
  if (dto.items.length === 0) {
    windows.mainWindow?.webContents.send('warn-message', 'No items selected.');
    windows.mainWindow?.webContents.send('price-check-done');
    return;
  }

  await run(dto);
  checkerInterval = setInterval(() => run(dto), checkInterval);
};

export const stop = () => {
  if (checkerInterval !== null) {
    clearInterval(checkerInterval);
    checkerInterval = null;
  }
};
