const REDIS_URL = process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN;

async function redisCommand(...args) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error('Redis is not configured');
  }

  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  });
  return res.json();
}

async function redisGet(key) {
  const data = await redisCommand('GET', key);
  if (!data.result) return null;
  try { return JSON.parse(data.result); } catch { return data.result; }
}

async function redisSet(key, value, ttl = Number(process.env.PORTFOLIO_CACHE_TTL_SECONDS || 300)) {
  await redisCommand('SET', key, JSON.stringify(value), 'EX', ttl);
}

module.exports = { redisGet, redisSet };
