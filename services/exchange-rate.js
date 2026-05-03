const TTL_MS = 10 * 60 * 1000;
let cache = { rate: null, fetchedAt: 0 };

export async function getBlueRate() {
  const now = Date.now();
  if (cache.rate !== null && now - cache.fetchedAt < TTL_MS) {
    return cache.rate;
  }
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue');
    if (!res.ok) throw new Error(`dolarapi HTTP ${res.status}`);
    const { venta } = await res.json();
    cache = { rate: venta, fetchedAt: now };
    return venta;
  } catch (err) {
    if (cache.rate !== null) {
      console.warn('exchange-rate: API error, using stale cache:', err.message);
      return cache.rate;
    }
    throw err;
  }
}
