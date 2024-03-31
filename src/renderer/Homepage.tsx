import ProgressBar from '@ramonak/react-progress-bar';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { sleep } from '../main/PriceChecker/utils';
import { IItemsToCheck } from './interfaces/items-to-check.interface';
import { IPriceData } from './interfaces/price-data.interface';

function Homepage() {
  const [form, setForm] = useState<{
    server: string;
    platform: string;
    name: string | null;
    price: number | null;
  }>({
    server: 'eu',
    platform: 'pc',
    name: null,
    price: null,
  });
  const [itemsToCheck, setItemsToCheck] = useState<IItemsToCheck[]>([]);
  const [prices, setPrices] = useState<IPriceData[]>([]);
  const [checkingPrice, setCheckingPrices] = useState<boolean>(false);
  const [checkInterval, setCheckInterval] = useState<number>(0);
  const [progress, setProgress] = useState<{
    status: string;
    bgColor: string;
    message: undefined | string;
  }>({
    status: '0',
    bgColor: 'darkcyan',
    message: undefined,
  });

  const maxItemLimit = 5;

  const startPriceCheck = () => {
    window.electron.ipcRenderer.sendMessage('start-price-checker', {
      server: form.server,
      platform: form.platform,
      items: itemsToCheck,
    });

    setProgress({ status: '0', bgColor: 'darkCyan', message: undefined });
    setCheckingPrices(true);
    setPrices([]);
  };

  const stop = async () => {
    window.electron.ipcRenderer.sendMessage('stop-price-checker');
    setProgress({ status: '0', bgColor: 'darkCyan', message: undefined });
    setCheckingPrices(false);
    await sleep(1);
    setCheckInterval(0);
  };

  const add = () => {
    if (form.name === null || form.price === null) {
      return;
    }

    const itemIndex = itemsToCheck.findIndex(
      (existItem) => existItem.name === form.name,
    );

    if (itemIndex !== -1) {
      const newItems = itemsToCheck;
      newItems[itemIndex] = { name: form.name, price: form.price };
      setItemsToCheck(newItems);
    } else {
      setItemsToCheck([
        ...itemsToCheck,
        { name: form.name, price: form.price },
      ]);
    }

    setForm({ ...form, name: null, price: null });
  };

  const deleteItem = (index: number) => {
    const newItems = [...itemsToCheck];
    newItems.splice(index, 1);
    setItemsToCheck(newItems);
  };

  useEffect(() => {
    window.electron.ipcRenderer.on('progress-updated', (data) => {
      setProgress({
        ...progress,
        status: String(data as number),
      });
    });

    return () =>
      window.electron.ipcRenderer.removeAllListeners('progress-updated');
  }, [progress]);

  useEffect(() => {
    window.electron.ipcRenderer.on('server-error', (message) => {
      setProgress({ status: '-1', bgColor: 'red', message: message as string });
    });

    window.electron.ipcRenderer.on('price-check-done', (event: unknown) => {
      const payload = event as {
        prices: IPriceData[];
        checkInterval: number;
      };

      if (payload?.prices === undefined) {
        setCheckingPrices(false);
        return;
      }

      setPrices(payload.prices);

      if (payload.checkInterval) {
        setCheckInterval(payload.checkInterval);
      } else {
        setCheckingPrices(false);
      }
    });

    window.electron.ipcRenderer.on('warn-message', (message) => {
      window.electron.ipcRenderer.sendMessage('show-dialog', message);
    });

    window.electron.ipcRenderer.on('price-checking-started', () => {
      setProgress({ status: '0', bgColor: 'darkCyan', message: undefined });
      setCheckingPrices(true);
    });
  }, []);

  useEffect(() => {
    const reduceInterval = async () => {
      await sleep(1);
      if (checkingPrice && checkInterval > 0) {
        setCheckInterval(checkInterval - 1);
      }
    };

    reduceInterval();
  }, [checkInterval, checkingPrice]);

  const secondToMinute = (duration: number): string => {
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;

    let secondString = secs.toString();
    if (secs < 10) {
      secondString = `0${secondString}`;
    }

    return `${mins}:${secondString}`;
  };

  return (
    <div className="homepage">
      <div className="price-checker">
        <div className="items-to-check-wrapper">
          <form className="items-form">
            <div className="inputs-container">
              <div className="form-group">
                <span>Server</span>
                <select
                  defaultValue={form.server}
                  id="server"
                  onChange={(evt) =>
                    setForm({ ...form, server: evt.target.value })
                  }
                >
                  <option value="eu">EU</option>
                  <option value="us">US</option>
                </select>
              </div>

              <div className="form-group">
                <span>Platform</span>
                <select
                  id="platform"
                  defaultValue={form.platform}
                  onChange={(evt) =>
                    setForm({ ...form, platform: evt.target.value })
                  }
                >
                  <option value="pc">PC</option>
                  <option value="xb">XBOX</option>
                  <option value="ps">PS4</option>
                </select>
              </div>

              <div className="form-group">
                <span>Item Name</span>
                <input
                  id="item-name"
                  value={String(form.name !== null ? form.name : '')}
                  onChange={(evt) =>
                    setForm({ ...form, name: evt.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <span>Desired Price</span>
                <input
                  id="item-price"
                  value={
                    String(form.price) === 'null' ? '' : String(form.price)
                  }
                  onChange={(evt) => {
                    const price = Number(evt.target.value);
                    if (!Number.isNaN(price)) {
                      setForm({ ...form, price: Number(evt.target.value) });
                    }
                  }}
                />
              </div>
            </div>

            <div className="action-buttons">
              {checkingPrice ? (
                <button type="button" onClick={stop} disabled={!checkingPrice}>
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  onClick={add}
                  disabled={
                    checkingPrice || itemsToCheck.length >= maxItemLimit
                  }
                >
                  Add
                </button>
              )}

              <button
                type="button"
                onClick={startPriceCheck}
                disabled={checkingPrice}
              >
                {checkingPrice ? 'Checking Prices...' : 'Start Price Check'}
              </button>
            </div>
          </form>
          <div className="items-to-check-list-wrapper">
            <h3>Items To Check</h3>
            <ul>
              {itemsToCheck.map((item, index) => (
                <li key={uuid()}>
                  {item.name} - {item.price}
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => {
                      deleteItem(index);
                    }}
                    disabled={checkingPrice}
                  >
                    X
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="progress-wrapper">
          <ProgressBar
            completed={progress.status !== '-1' ? progress.status : '100'}
            customLabel={progress.message}
            className="progress"
            borderRadius="100px"
            labelAlignment="center"
            bgColor={progress.bgColor}
          />
        </div>

        {checkingPrice && checkInterval > 0 && (
          <div>Will Check in {secondToMinute(checkInterval)}</div>
        )}

        {prices?.length > 0 && (
          <table className="price-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Location</th>
                <th>Guild Name</th>
                <th>Player Name</th>
                <th>Unit Price</th>
                <th>Amount</th>
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((price) => (
                <tr key={uuid()}>
                  <td>{price.itemName}</td>
                  <td>{price.location}</td>
                  <td>{price.guildName}</td>
                  <td>{price.playerID}</td>
                  <td>{price.unitPrice}</td>
                  <td>{price.amount}</td>
                  <td>{price.totalPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Homepage;
