const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Ensure body is parsed (Vercel usually does, but safe check)
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { name, email, message } = body;

  if (!process.env.NOTION_CONTACT_DB_ID) {
     return res.status(500).json({ error: 'Server misconfiguration: Missing DB ID' });
  }

  try {
    // Create a new page in the Contact database
    // IMPORTANT: The keys in 'properties' must match the column names in your Notion Database EXACTLY.
    // 'Name' -> Title property
    // 'Email' -> Email property
    // 'Message' -> Rich Text property
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_CONTACT_DB_ID },
      properties: {
        Name: { 
          title: [{ text: { content: name || 'Anonymous' } }] 
        },
        Email: { 
          email: email || null // Email property handles null but not empty string sometimes if strict
        },
        Message: { 
          rich_text: [{ text: { content: message || '' } }] 
        }
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Notion Write Error:', error.body || error.message);
    
    // Check for common permission errors
    if (error.message.includes('accessible by this API bot')) {
        return res.status(500).json({ 
            error: 'Permission Error', 
            details: 'Please invite the Notion Integration bot to your Contact database page.' 
        });
    }

    // Check for property name mismatch
    if (error.code === 'validation_error') {
        return res.status(400).json({
            error: 'Validation Error',
            details: 'Database properties mismatch. Ensure columns "Name", "Email", "Message" exist.',
            notionMessage: error.message
        });
    }

    res.status(500).json({ error: 'Failed to submit message', details: error.message });
  }
}