import Redis from 'ioredis';

let redis = null;

function getRedisClient() {
  if (redis) return redis;

  if (!process.env.REDIS_URL) {
    console.warn('[Redis] REDIS_URL not set — caching disabled');
    return null;
  }

  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 200, 1000);
    },
  });

  redis.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  redis.on('connect', () => {
    console.log('[Redis] Connected');
  });

  return redis;
}

// Cache helpers
export async function cacheGet(key) {
  const client = getRedisClient();
  if (!client) return null;
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds = 1800) {
  const client = getRedisClient();
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch { /* silent */ }
}

export async function cacheDel(key) {
  const client = getRedisClient();
  if (!client) return;
  try {
    await client.del(key);
  } catch { /* silent */ }
}

export async function cacheIncrBy(key, amount = 1) {
  const client = getRedisClient();
  if (!client) return null;
  return client.incrby(key, amount);
}

export default getRedisClient;
