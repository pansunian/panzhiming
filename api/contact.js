const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Ensure body is parsed
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { name, email, message } = body;

  // Debug Log: Check if env vars are loaded (Don't log the full key for security)
  console.log('[API/Contact] Received request.');
  console.log('[API/Contact] DB ID Configured:', !!process.env.NOTION_CONTACT_DB_ID);
  console.log('[API/Contact] API Key Configured:', !!process.env.NOTION_API_KEY);

  if (!process.env.NOTION_CONTACT_DB_ID) {
     return res.status(500).json({ error: 'Server Error: NOTION_CONTACT_DB_ID is missing in Vercel Env Variables.' });
  }

  try {
    // Attempt to create the page
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_CONTACT_DB_ID },
      properties: {
        // IMPORTANT: The keys here ('Name', 'Email', 'Message') MUST match 
        // the Column Names in your Notion Database exactly (Case Sensitive).
        
        // 1. Title Property (Usually the first column)
        Name: { 
          title: [{ text: { content: name || 'Anonymous' } }] 
        },
        // 2. Email Property (Type must be 'Email')
        Email: { 
          email: email || null 
        },
        // 3. Rich Text Property (Type must be 'Text')
        Message: { 
          rich_text: [{ text: { content: message || '' } }] 
        }
      },
    });

    console.log('[API/Contact] Success:', response.id);
    res.status(200).json({ success: true, id: response.id });

  } catch (error) {
    // LOG THE REAL ERROR to Vercel Function Logs
    console.error('[API/Contact] Notion API Error:', JSON.stringify(error.body || error, null, 2));
    
    // Return meaningful error to frontend
    if (error.code === 'object_not_found' || error.message.includes('accessible by this API bot')) {
        return res.status(500).json({ 
            error: 'Permission Error', 
            details: 'Robot cannot access the database. Please go to the Notion Page -> ... Menu -> Connections -> Add your integration.' 
        });
    }

    if (error.code === 'validation_error') {
        return res.status(400).json({
            error: 'Column Mismatch',
            details: 'Ensure your Notion Database has columns named exactly: "Name" (Title), "Email" (Email), "Message" (Text).',
            notionMessage: error.message
        });
    }

    res.status(500).json({ 
        error: 'Submission Failed', 
        details: error.message || 'Unknown error occurred' 
    });
  }
}