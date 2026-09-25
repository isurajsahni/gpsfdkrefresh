/**
 * A small in-process cache with a time-to-live and size caps.
 *
 * Every database round trip from this server costs about a second, and the
 * public catalogue reads the same few queries over and over. Entries expire on
 * their own, and callers clear the whole cache when the underlying data changes
 * (an admin edits a product), so a price change shows up immediately rather
 * than after the TTL. Process-local: fine for a single Render instance.
 *
 * Bounded twice: by entry count, and by total size (as measured by `sizeOf`),
 * so no mix of requests can grow it past `maxSize` — the oldest entries are
 * dropped first, and a value bigger than `maxSize / 4` isn't kept at all.
 *
 * @param {{ ttlMs: number, max: number, maxSize?: number, sizeOf?: (value) => number }} options
 */
const createTtlCache = ({ ttlMs, max, maxSize = Infinity, sizeOf = () => 1 }) => {
  const entries = new Map(); // key -> { value, size, expires }, oldest first
  let totalSize = 0;

  const remove = (key) => {
    const entry = entries.get(key);
    if (!entry) return;
    totalSize -= entry.size;
    entries.delete(key);
  };

  return {
    get(key) {
      const hit = entries.get(key);
      if (!hit) return undefined;
      if (hit.expires <= Date.now()) {
        remove(key);
        return undefined;
      }
      return hit.value;
    },
    set(key, value) {
      remove(key);
      const size = sizeOf(value);
      if (size > maxSize / 4) return;
      while (entries.size > 0 && (entries.size >= max || totalSize + size > maxSize)) {
        remove(entries.keys().next().value);
      }
      entries.set(key, { value, size, expires: Date.now() + ttlMs });
      totalSize += size;
    },
    clear() {
      entries.clear();
      totalSize = 0;
    },
    get size() {
      return entries.size;
    },
    get totalSize() {
      return totalSize;
    },
  };
};

module.exports = { createTtlCache };
