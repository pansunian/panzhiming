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
    const blocks = await notion.blocks.children.list({
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

    const content = [];

    for (const block of blocks.results) {
      if (block.type === 'paragraph') {
        content.push({
            type: 'paragraph',
            content: parseRichText(block.paragraph.rich_text)
        });
      } 
      else if (block.type.startsWith('heading_')) {
        const type = block.type; // heading_1, heading_2, etc
        content.push({
            type: type,
            content: parseRichText(block[type].rich_text)
        });
      }
      else if (block.type === 'callout') {
        content.push({
            type: 'callout',
            icon: block.callout.icon,
            content: parseRichText(block.callout.rich_text)
        });
      }
      else if (block.type === 'quote') {
        content.push({
            type: 'quote',
            content: parseRichText(block.quote.rich_text)
        });
      }
      else if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
        content.push({
            type: 'list_item',
            listType: block.type === 'numbered_list_item' ? 'ol' : 'ul',
            content: parseRichText(block[block.type].rich_text)
        });
      }
      else if (block.type === 'toggle') {
        content.push({
            type: 'toggle',
            content: parseRichText(block.toggle.rich_text),
            // Note: Fetching children of toggles would require recursive calls. 
            // For performance in this simple demo, we might skip deep nested children or handle them simply.
            hasChildren: block.has_children
        });
      }
      else if (block.type === 'image') {
          const src = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
          const caption = parseRichText(block.image.caption);
          content.push({
              type: 'image',
              src: src,
              caption: caption
          });
      }
      else if (block.type === 'bookmark') {
          content.push({
              type: 'bookmark',
              url: block.bookmark.url,
              caption: parseRichText(block.bookmark.caption)
          });
      }
      else if (block.type === 'divider') {
          content.push({ type: 'divider' });
      }
    }

    res.status(200).json({ content });
  } catch (error) {
    console.error('Notion Content Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch page content' });
  }
}