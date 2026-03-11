const { Client } = require('@notionhq/client');
const { redisGet, redisSet } = require('./lib/redis');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { pageId } = req.query;
  if (!pageId) return res.status(400).json({ error: 'Missing pageId' });

  // 先读 Redis 缓存
  try {
    const cached = await redisGet(`page-content-${pageId}`);
    if (cached) return res.status(200).json(cached);
  } catch (e) {
    console.warn('Redis read failed:', e.message);
  }

  try {
    const rootResponse = await notion.blocks.children.list({ block_id: pageId });

    const parseRichText = (richTextArray) => {
      if (!richTextArray) return [];
      return richTextArray.map(t => ({ text: t.plain_text, annotations: t.annotations, href: t.href }));
    };

    const transformBlock = (block) => {
      if (block.type === 'paragraph') return { type: 'paragraph', content: parseRichText(block.paragraph.rich_text) };
      else if (block.type.startsWith('heading_')) { const type = block.type; return { type, content: parseRichText(block[type].rich_text) }; }
      else if (block.type === 'callout') return { type: 'callout', icon: block.callout.icon, content: parseRichText(block.callout.rich_text) };
      else if (block.type === 'quote') return { type: 'quote', content: parseRichText(block.quote.rich_text) };
      else if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') return { type: 'list_item', listType: block.type === 'numbered_list_item' ? 'ol' : 'ul', content: parseRichText(block[block.type].rich_text) };
      else if (block.type === 'toggle') return { type: 'toggle', content: parseRichText(block.toggle.rich_text), hasChildren: block.has_children };
      else if (block.type === 'image') { const src = block.image.type === 'external' ? block.image.external.url : block.image.file.url; return { type: 'image', src, caption: parseRichText(block.image.caption) }; }
      else if (block.type === 'bookmark') return { type: 'bookmark', url: block.bookmark.url, caption: parseRichText(block.bookmark.caption) };
      else if (block.type === 'divider') return { type: 'divider' };
      return null;
    };

    const content = [];
    for (const block of rootResponse.results) {
      if (block.type === 'column_list') {
        try {
          const columnsResponse = await notion.blocks.children.list({ block_id: block.id });
          for (const column of columnsResponse.results) {
            if (column.type === 'column') {
              const columnBlocksResponse = await notion.blocks.children.list({ block_id: column.id });
              for (const innerBlock of columnBlocksResponse.results) {
                const transformed = transformBlock(innerBlock);
                if (transformed) content.push(transformed);
              }
            }
          }
        } catch (err) { console.warn('Failed to fetch column content:', err); }
      } else {
        const transformed = transformBlock(block);
        if (transformed) content.push(transformed);
      }
    }

    const result = { content };

    // 写入 Redis 缓存
    try { await redisSet(`page-content-${pageId}`, result); } catch (e) { console.warn('Redis write failed:', e.message); }

    res.status(200).json(result);
  } catch (error) {
    console.error('Notion Content Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch page content' });
  }
};
