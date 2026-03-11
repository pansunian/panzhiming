const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { pageId } = req.query;

  if (!pageId) {
    return res.status(400).json({ error: 'Missing pageId' });
  }

  try {
    // 1. Fetch root blocks
    const rootResponse = await notion.blocks.children.list({
      block_id: pageId,
    });

    // Helper to extract rich text with basic formatting
    const parseRichText = (richTextArray) => {
        if (!richTextArray) return [];
        return richTextArray.map(t => ({
            text: t.plain_text,
            annotations: t.annotations,
            href: t.href
        }));
    };

    // Helper to transform a single Notion block into our frontend schema
    const transformBlock = (block) => {
        if (block.type === 'paragraph') {
          return {
              type: 'paragraph',
              content: parseRichText(block.paragraph.rich_text)
          };
        } 
        else if (block.type.startsWith('heading_')) {
          const type = block.type; // heading_1, heading_2, etc
          return {
              type: type,
              content: parseRichText(block[type].rich_text)
          };
        }
        else if (block.type === 'callout') {
          return {
              type: 'callout',
              icon: block.callout.icon,
              content: parseRichText(block.callout.rich_text)
          };
        }
        else if (block.type === 'quote') {
          return {
              type: 'quote',
              content: parseRichText(block.quote.rich_text)
          };
        }
        else if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
          return {
              type: 'list_item',
              listType: block.type === 'numbered_list_item' ? 'ol' : 'ul',
              content: parseRichText(block[block.type].rich_text)
          };
        }
        else if (block.type === 'toggle') {
          return {
              type: 'toggle',
              content: parseRichText(block.toggle.rich_text),
              hasChildren: block.has_children
          };
        }
        else if (block.type === 'image') {
            const src = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
            const caption = parseRichText(block.image.caption);
            return {
                type: 'image',
                src: src,
                caption: caption
            };
        }
        else if (block.type === 'bookmark') {
            return {
                type: 'bookmark',
                url: block.bookmark.url,
                caption: parseRichText(block.bookmark.caption)
            };
        }
        else if (block.type === 'divider') {
            return { type: 'divider' };
        }
        return null;
    };

    const content = [];

    // Iterate through blocks and handle Column Lists specifically
    for (const block of rootResponse.results) {
        if (block.type === 'column_list') {
            try {
                // 1. Fetch Columns
                const columnsResponse = await notion.blocks.children.list({ block_id: block.id });
                const columns = columnsResponse.results;

                // 2. Iterate Columns
                for (const column of columns) {
                    if (column.type === 'column') {
                        // 3. Fetch Content of Column
                        const columnBlocksResponse = await notion.blocks.children.list({ block_id: column.id });
                        const columnBlocks = columnBlocksResponse.results;
                        
                        // 4. Transform and Add to Content Stream (Flattening)
                        for (const innerBlock of columnBlocks) {
                            const transformed = transformBlock(innerBlock);
                            if (transformed) content.push(transformed);
                        }
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch column content:', err);
                // Continue with other blocks even if columns fail
            }
        } else {
            const transformed = transformBlock(block);
            if (transformed) content.push(transformed);
        }
    }
res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ content });
  } catch (error) {
    console.error('Notion Content Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch page content' });
  }
}
