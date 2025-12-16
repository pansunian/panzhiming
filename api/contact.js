import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, message } = req.body;

  if (!process.env.NOTION_CONTACT_DB_ID) {
     return res.status(500).json({ error: 'Server misconfiguration: Missing DB ID' });
  }

  try {
    // Create a new page in the Contact database
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_CONTACT_DB_ID },
      properties: {
        // 'Name' is the Title property
        Name: { 
          title: [{ text: { content: name || 'Anonymous' } }] 
        },
        // 'Email' is an Email property (or Text)
        Email: { 
          email: email 
        },
        // 'Message' is a RichText property
        Message: { 
          rich_text: [{ text: { content: message || '' } }] 
        }
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Notion Write Error:', error);
    res.status(500).json({ error: 'Failed to submit message', details: error.message });
  }
}