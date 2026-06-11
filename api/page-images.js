const { Client } = require('@notionhq/client');
const { redisGet, redisSet } = require('./lib/redis');
const { getStaticImageUrl } = require('./lib/static-blog-images');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const CACHE_TTL_SECONDS = Number(process.env.PAGE_CACHE_TTL_SECONDS || 3300);

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { pageId } = req.query;

  if (!pageId) {
    return res.status(400).json({ error: 'Missing pageId' });
  }

  const forceRefresh = req.query?.fresh === '1' || req.query?.refresh === '1';
  const cacheKey = `page-images-v1-${pageId}`;
  res.setHeader('Cache-Control', 'no-store');

  if (!forceRefresh) {
    try {
      const cached = await redisGet(cacheKey);
      if (cached) return res.status(200).json(cached);
    } catch (error) {
      console.warn('Redis read failed:', error.message);
    }
  }

  try {
    // Fetch the children blocks of the page
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
    });

    // Filter out only image blocks and extract URLs AND Captions
    const images = blocks.results
      .filter((block) => block.type === 'image')
      .map((block) => {
        const type = block.image.type;
        const url = getStaticImageUrl(pageId, block.image[type].url);
        // Extract plain text caption
        const caption = block.image.caption && block.image.caption.length > 0 
            ? block.image.caption.map(t => t.plain_text).join('') 
            : '';
            
        return { url, caption };
      });
    const result = { images, updatedAt: new Date().toISOString() };

    try {
      await redisSet(cacheKey, result, CACHE_TTL_SECONDS);
    } catch (error) {
      console.warn('Redis write failed:', error.message);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Notion Block Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch page content' });
  }
}
