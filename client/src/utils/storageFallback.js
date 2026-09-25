/**
 * With cookies fully blocked, the browser throws on any use of localStorage or
 * sessionStorage, and the app reads both while it starts (cart, login, UTM
 * capture), so the whole site failed to load. For those visitors this swaps in
 * an in-memory store: they can browse and shop, and nothing is kept between
 * visits. Imported first in main.jsx, ahead of anything that touches storage.
 */
const createMemoryStorage = () => {
  const data = new Map();
  return {
    get length() {
      return data.size;
    },
    key: (index) => [...data.keys()][index] ?? null,
    getItem: (key) => (data.has(String(key)) ? data.get(String(key)) : null),
    setItem: (key, value) => {
      data.set(String(key), String(value));
    },
    removeItem: (key) => {
      data.delete(String(key));
    },
    clear: () => data.clear(),
  };
};

export const ensureUsableStorage = () => {
  for (const name of ['localStorage', 'sessionStorage']) {
    try {
      window[name].getItem('__storage_probe__');
    } catch {
      try {
        Object.defineProperty(window, name, { value: createMemoryStorage(), configurable: true });
      } catch {
        // Can't be replaced in this browser; nothing more to do
      }
    }
  }
};

ensureUsableStorage();
