const { Client } = require('@notionhq/client');
const { redisGet, redisSet } = require('./lib/redis');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const CACHE_TTL_SECONDS = Number(process.env.PAGE_CACHE_TTL_SECONDS || 3300);

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { pageId } = req.query;
  if (!pageId) return res.status(400).json({ error: 'Missing pageId' });
  const forceRefresh = req.query?.fresh === '1' || req.query?.refresh === '1';
  const cacheKey = `page-content-v2-${pageId}`;

  res.setHeader(
    'Cache-Control',
    forceRefresh ? 'no-store' : 's-maxage=1800, stale-while-revalidate=1500'
  );

  if (!forceRefresh) {
    // 先读 Redis 缓存
    try {
      const cached = await redisGet(cacheKey);
      if (cached) return res.status(200).json(cached);
    } catch (e) {
      console.warn('Redis read failed:', e.message);
    }
  }

  try {
    const fetchChildren = async (blockId) => {
      const results = [];
      let cursor;
      do {
        const response = await notion.blocks.children.list({
          block_id: blockId,
          start_cursor: cursor,
          page_size: 100
        });
        results.push(...response.results);
        cursor = response.has_more ? response.next_cursor : undefined;
      } while (cursor);
      return results;
    };

    const rootBlocks = await fetchChildren(pageId);

    const parseRichText = (richTextArray) => {
      if (!richTextArray) return [];
      return richTextArray.map(t => ({
        type: t.type,
        text: t.plain_text,
        annotations: t.annotations,
        href: t.href,
        mention: t.type === 'mention' ? {
          type: t.mention?.type,
          url: t.mention?.link_preview?.url || t.href || ''
        } : null
      }));
    };

    const transformBlocks = async (blocks) => {
      const content = [];

      for (const block of blocks) {
        if (block.type === 'column_list') {
          try {
            const columns = await fetchChildren(block.id);
            for (const column of columns) {
              if (column.type === 'column') {
                const columnBlocks = await fetchChildren(column.id);
                content.push(...await transformBlocks(columnBlocks));
              }
            }
          } catch (err) {
            console.warn('Failed to fetch column content:', err);
          }
        } else {
          const transformed = await transformBlock(block);
          if (transformed) content.push(transformed);
        }
      }

      return content;
    };

    const transformBlock = async (block) => {
      if (block.type === 'paragraph') return { type: 'paragraph', content: parseRichText(block.paragraph.rich_text) };
      else if (block.type.startsWith('heading_')) { const type = block.type; return { type, content: parseRichText(block[type]?.rich_text) }; }
      else if (block.type === 'callout') {
        const children = block.has_children ? await transformBlocks(await fetchChildren(block.id)) : [];
        return {
          type: 'callout',
          icon: block.callout.icon,
          color: block.callout.color,
          content: parseRichText(block.callout.rich_text),
          children
        };
      }
      else if (block.type === 'quote') return { type: 'quote', content: parseRichText(block.quote.rich_text) };
      else if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') return { type: 'list_item', listType: block.type === 'numbered_list_item' ? 'ol' : 'ul', content: parseRichText(block[block.type].rich_text) };
      else if (block.type === 'toggle') return { type: 'toggle', content: parseRichText(block.toggle.rich_text), hasChildren: block.has_children };
      else if (block.type === 'image') { const src = block.image.type === 'external' ? block.image.external.url : block.image.file.url; return { type: 'image', src, caption: parseRichText(block.image.caption) }; }
      else if (block.type === 'bookmark') return { type: 'bookmark', url: block.bookmark.url, caption: parseRichText(block.bookmark.caption) };
      else if (block.type === 'embed') return { type: 'embed', url: block.embed.url, caption: parseRichText(block.embed.caption) };
      else if (block.type === 'link_preview') return { type: 'link_preview', url: block.link_preview.url };
      else if (block.type === 'code') return { type: 'code', language: block.code.language, content: parseRichText(block.code.rich_text), caption: parseRichText(block.code.caption) };
      else if (block.type === 'file') { const file = block.file; const src = file.type === 'external' ? file.external.url : file.file.url; return { type: 'file', name: file.name, url: src, caption: parseRichText(file.caption) }; }
      else if (block.type === 'divider') return { type: 'divider' };
      return null;
    };

    const content = await transformBlocks(rootBlocks);

    const result = { content, updatedAt: new Date().toISOString() };

    // 写入 Redis 缓存
    try { await redisSet(cacheKey, result, CACHE_TTL_SECONDS); } catch (e) { console.warn('Redis write failed:', e.message); }

    res.status(200).json(result);
  } catch (error) {
    console.error('Notion Content Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch page content' });
  }
};
