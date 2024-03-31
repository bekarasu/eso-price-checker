import puppeteer, { Browser, Page } from 'puppeteer';
import { ServerError } from '../errors';
import { IPriceData } from './interfaces/price-data.interface';
import { sleep } from './utils';

export class Crawler {
  private page: Page | null;

  private browser: Browser | null;

  private platforms: string[] = ['pc', 'xb', 'ps'];

  private servers: string[] = ['eu', 'us'];

  constructor() {
    this.page = null;
    this.browser = null;
  }

  async checkDesiredItemsForPrice(
    server: string,
    platform: string,
    name: string,
    desiredPrice: number,
  ): Promise<IPriceData[]> {
    if (!this.servers.includes(server)) {
      throw new ServerError('warning', 'Invalid Server');
    }

    if (!this.platforms.includes(platform)) {
      throw new ServerError('warning', 'Invalid Platform');
    }

    const desiredPrices: IPriceData[] = [];

    const prices = await this.getPriceData(server, platform, name, 100);
    for (const price of prices) {
      if (price.unitPrice <= desiredPrice) {
        desiredPrices.push(price);
      }
    }

    return desiredPrices;
  }

  async getPriceData(
    server: string,
    platform: string,
    name: string,
    maxCount: number,
  ): Promise<IPriceData[]> {
    const maxItemLengthPerPage = 10;
    const pageLimit = Math.ceil(maxCount / maxItemLengthPerPage);
    const baseUrl = `https://${server}.tamrieltradecentre.com/${platform}/Trade/SearchResult?ItemNamePattern=${encodeURI(
      name,
    )}&SortBy=LastSeen&Order=desc`;
    let prices: IPriceData[] = [];
    let currentPage = 1;

    do {
      let pricesPerPage: (IPriceData | null)[] = [];

      try {
        // eslint-disable-next-line no-await-in-loop
        pricesPerPage = await this.getPriceDataPerPage(baseUrl, currentPage);
      } catch (e: any) {
        throw new ServerError('critical', `Error During Checking: ${name}.`);
      }

      for (let i = 0; i < pricesPerPage.length; i += 1) {
        const price = pricesPerPage[i];
        if (price !== null) {
          prices.push(price);
        }
      }

      if (pricesPerPage.length < maxItemLengthPerPage) {
        currentPage = pageLimit + 1;
      } else {
        currentPage += 1;
      }

      // eslint-disable-next-line no-await-in-loop
      await sleep(5);
    } while (currentPage <= pageLimit);

    if (prices.length > maxCount) {
      prices = prices.splice(maxCount - 1, prices.length - maxCount);
    }

    return prices;
  }

  private async getPriceDataPerPage(
    url: string,
    currentPage: number,
  ): Promise<(IPriceData | null)[]> {
    if (this.page === null) {
      throw new Error('Page is not initialized');
    }

    let searchUrl = url;
    if (currentPage > 1) {
      searchUrl = `${url}&page=${currentPage}`;
    }

    await this.page.goto(searchUrl, { timeout: 60 * 1000 });

    await this.page.waitForSelector(
      'span[data-bind="localizedNumber: UnitPrice"]',
    );

    return this.page.$$eval(
      `tr[data-original-title]`,
      (elements: HTMLTableRowElement[]) =>
        elements.map((el) => {
          const unitPrice = Number(
            el
              .querySelector('span[data-bind="localizedNumber: UnitPrice"]')
              ?.textContent?.replaceAll(',', ''),
          );
          if (Number.isNaN(unitPrice)) {
            return null;
          }

          const totalPrice = Number(
            el
              .querySelector('span[data-bind="localizedNumber: TotalPrice"]')
              ?.textContent?.replaceAll(',', ''),
          );
          if (Number.isNaN(totalPrice)) {
            return null;
          }

          const amount = Number(
            el
              .querySelector('span[data-bind="localizedNumber: Amount"]')
              ?.textContent?.replace(',', ''),
          );
          if (Number.isNaN(amount)) {
            return null;
          }

          const lastSeen = el.querySelector(
            'td[data-bind="minutesElapsed: DiscoverUnixTime"]',
          )?.textContent;

          const itemName = el.querySelector(
            `div[data-bind*="text: Name"]`,
          )?.textContent;

          const location = el.querySelector(
            'a.trade-list-clickable.bold',
          )?.textContent;

          const playerID = el.querySelector(
            'div[data-bind="text: PlayerID"]',
          )?.textContent;

          const guildName = el.querySelector(
            'div[data-bind="text: GuildName"]',
          )?.textContent;

          return {
            itemName,
            lastSeen,
            guildName,
            location,
            playerID,
            totalPrice,
            unitPrice,
            amount,
          };
        }),
    );
  }

  async close(): Promise<void> {
    await this.browser?.close();
  }

  async init(): Promise<void> {
    this.browser = await puppeteer.launch({ headless: 'new' });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1080, height: 1024 });
  }
}
