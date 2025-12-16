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

    // Filter out only image blocks and extract URLs
    const images = blocks.results
      .filter((block) => block.type === 'image')
      .map((block) => {
        const type = block.image.type;
        return block.image[type].url;
      });

    res.status(200).json({ images });
  } catch (error) {
    console.error('Notion Block Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch page content' });
  }
}