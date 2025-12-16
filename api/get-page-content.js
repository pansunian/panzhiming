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
    // Fetch the children blocks of the page
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
    });

    const content = [];

    // Simple parser to extract text from common block types
    for (const block of blocks.results) {
      if (block.type === 'paragraph') {
        const text = block.paragraph.rich_text.map(t => t.plain_text).join('');
        content.push(text); // Push even empty strings to preserve paragraph spacing
      } else if (block.type === 'heading_1') {
        const text = block.heading_1.rich_text.map(t => t.plain_text).join('');
        if (text) content.push(text);
      } else if (block.type === 'heading_2') {
         const text = block.heading_2.rich_text.map(t => t.plain_text).join('');
         if (text) content.push(text);
      } else if (block.type === 'heading_3') {
         const text = block.heading_3.rich_text.map(t => t.plain_text).join('');
         if (text) content.push(text);
      } else if (block.type === 'bulleted_list_item') {
         const text = block.bulleted_list_item.rich_text.map(t => t.plain_text).join('');
         if (text) content.push('• ' + text);
      } else if (block.type === 'numbered_list_item') {
         const text = block.numbered_list_item.rich_text.map(t => t.plain_text).join('');
         if (text) content.push('- ' + text);
      } else if (block.type === 'quote') {
         const text = block.quote.rich_text.map(t => t.plain_text).join('');
         if (text) content.push('“' + text + '”');
      }
    }

    res.status(200).json({ content });
  } catch (error) {
    console.error('Notion Content Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch page content' });
  }
}