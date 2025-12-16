const { Client } = require('@notionhq/client');

module.exports = async function handler(req, res) {
  // 1. Debug: Check Environment Variables
  const requiredEnv = [
    'NOTION_API_KEY',
    'NOTION_PROFILE_DB_ID',
    'NOTION_GALLERY_DB_ID',
    'NOTION_THOUGHTS_DB_ID',
    'NOTION_BLOG_DB_ID'
  ];

  const missingEnv = requiredEnv.filter(key => !process.env[key]);

  if (missingEnv.length > 0) {
    console.error('Missing Environment Variables:', missingEnv);
    return res.status(500).json({ 
      error: 'Server Configuration Error', 
      message: `Missing environment variables: ${missingEnv.join(', ')}. Please configure them in Vercel Settings.` 
    });
  }

  // Initialize Notion Client
  const notion = new Client({ auth: process.env.NOTION_API_KEY });

  // Helper to safely extract text
  const getRichText = (richTextArr) => richTextArr?.[0]?.plain_text || '';
  const getTitle = (titleArr) => titleArr?.[0]?.plain_text || '';
  // Helper to extract file URL (supports internal Notion files and external links)
  const getFileUrl = (filesArr) => filesArr?.[0]?.file?.url || filesArr?.[0]?.external?.url || '';
  // Helper to extract all file URLs from a list
  const getAllFileUrls = (filesArr) => filesArr?.map(f => f.file?.url || f.external?.url).filter(Boolean) || [];

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Fetch all 4 databases in parallel for speed
    const [profileData, galleryData, thoughtsData, blogData] = await Promise.all([
      notion.databases.query({ database_id: process.env.NOTION_PROFILE_DB_ID }),
      notion.databases.query({ database_id: process.env.NOTION_GALLERY_DB_ID, sorts: [{ property: 'Date', direction: 'descending' }] }),
      notion.databases.query({ database_id: process.env.NOTION_THOUGHTS_DB_ID, sorts: [{ property: 'Date', direction: 'descending' }] }),
      notion.databases.query({ database_id: process.env.NOTION_BLOG_DB_ID, sorts: [{ property: 'Date', direction: 'descending' }] }),
    ]);

    // --- 1. Process Profile (Takes the first row) ---
    let profile = null;
    if (profileData.results.length > 0) {
      const p = profileData.results[0].properties;
      profile = {
        name: getTitle(p.Name.title),
        role: getRichText(p.Role.rich_text),
        bio: getRichText(p.Bio.rich_text),
        location: getRichText(p.Location.rich_text),
        avatarUrl: getFileUrl(p.Avatar.files),
        logoUrl: p.Logo ? getFileUrl(p.Logo.files) : null, 
        socials: JSON.parse(getRichText(p.Socials.rich_text) || '[]')
      };
    }

    // --- 2. Process Gallery ---
    const gallery = galleryData.results.map(page => {
      const p = page.properties;
      return {
        id: page.id,
        title: getTitle(p.Title.title),
        location: getRichText(p.Location.rich_text),
        count: p.Count?.number || 0,
        date: p.Date?.date?.start || '',
        ticketNumber: getRichText(p.TicketNumber.rich_text),
        description: getRichText(p.Description.rich_text),
        coverUrl: getFileUrl(p.Cover.files),
        images: getAllFileUrls(p.Images.files)
      };
    });

    // --- 3. Process Thoughts ---
    const thoughts = thoughtsData.results.map(page => {
      const p = page.properties;
      return {
        id: page.id,
        content: getTitle(p.Content.title), // Using Title property for content
        date: p.Date?.date?.start || new Date(page.created_time).toISOString().split('T')[0],
        time: '', // Optional: could parse time from date string
        tags: p.Tags?.multi_select?.map(t => t.name) || []
      };
    });

    // --- 4. Process Blog ---
    const posts = blogData.results.map(page => {
      const p = page.properties;
      return {
        id: page.id,
        title: getTitle(p.Title.title),
        excerpt: getRichText(p.Excerpt.rich_text),
        date: p.Date?.date?.start || '',
        readTime: p.ReadTime?.select?.name || '5 MIN',
        category: p.Category?.select?.name || '随笔',
        imageUrl: getFileUrl(p.Cover.files),
        content: [] 
      };
    });

    // Return the combined JSON
    res.status(200).json({
      profile,
      gallery,
      thoughts,
      posts
    });

  } catch (error) {
    console.error('Notion API Error:', error);
    // Return detailed error to help debugging
    res.status(500).json({ 
      error: 'Failed to fetch data from Notion', 
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
}