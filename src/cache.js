import fs from 'fs/promises';

export async function loadCache(cachePath) {
  try {
    const data = await fs.readFile(cachePath, 'utf8');
    const cache = JSON.parse(data);

    if (!cache || !Array.isArray(cache.working) || typeof cache.lastRun !== 'string') {
      return null;
    }

    return cache;
  } catch {
    return null;
  }
}

export function isCacheFresh(cache, ttlMs) {
  if (!cache) {
    return false;
  }

  const lastRun = Date.parse(cache.lastRun);

  if (Number.isNaN(lastRun)) {
    return false;
  }

  return Date.now() - lastRun < ttlMs;
}

export async function saveCache(cachePath, working) {
  const cache = {
    lastRun: new Date().toISOString(),
    working,
  };

  await fs.writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf8');
}
