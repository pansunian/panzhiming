const { Client } = require('@notionhq/client');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  // 1. Map IDs to Names for better error messages
  const DB_MAP = {
    [process.env.NOTION_PROFILE_DB_ID]: 'NOTION_PROFILE_DB_ID (Profile)',
    [process.env.NOTION_GALLERY_DB_ID]: 'NOTION_GALLERY_DB_ID (Gallery)',
    [process.env.NOTION_THOUGHTS_DB_ID]: 'NOTION_THOUGHTS_DB_ID (Thoughts)',
    [process.env.NOTION_BLOG_DB_ID]: 'NOTION_BLOG_DB_ID (Blog)',
    [process.env.NOTION_CONTACT_DB_ID]: 'NOTION_CONTACT_DB_ID (Contact)'
  };

  const requiredEnv = [
    'NOTION_API_KEY',
    'NOTION_PROFILE_DB_ID',
    'NOTION_GALLERY_DB_ID',
    'NOTION_THOUGHTS_DB_ID',
    'NOTION_BLOG_DB_ID'
  ];

  const missingEnv = requiredEnv.filter(key => !process.env[key]);
  if (missingEnv.length > 0) {
    return res.status(500).json({ 
      error: 'Config Error', 
      message: `Missing env vars: ${missingEnv.join(', ')}` 
    });
  }

  const notion = new Client({ auth: process.env.NOTION_API_KEY });

  // Helpers
  const safeGet = (props, key, type) => {
    if (!props || !props[key]) return null;
    return props[key][type];
  };
  const getRichText = (props, key) => safeGet(props, key, 'rich_text')?.[0]?.plain_text || '';
  const getTitle = (props, key) => safeGet(props, key, 'title')?.[0]?.plain_text || '';
  const getFileUrl = (props, key) => {
    const files = safeGet(props, key, 'files');
    return files?.[0]?.file?.url || files?.[0]?.external?.url || '';
  };
  const getAllFileUrls = (props, key) => {
    const files = safeGet(props, key, 'files');
    return files?.map(f => f.file?.url || f.external?.url).filter(Boolean) || [];
  };

  // Helper to handle Notion errors gracefully
  const fetchDatabase = async (dbId, name, mapper) => {
    try {
        const response = await notion.databases.query({
            database_id: dbId,
            sorts: [{ property: 'Date', direction: 'descending' }] 
        });
        return response.results.map(mapper);
    } catch (error) {
        console.error(`Error fetching ${name}:`, error.message);
        // Determine if it's a permission error
        let msg = error.message;
        if (msg.includes('accessible by this API bot')) {
            msg = `PERMISSION DENIED: Please add your Notion Integration to the database page for ${name}.`;
        }
        // Return detailed error structure instead of throwing
        return { error: true, message: msg };
    }
  };

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  // --- PARALLEL FETCHING ---
  
  // 1. Profile
  let profile = null;
  let profileError = null;
  try {
      const profileRes = await notion.databases.query({ database_id: process.env.NOTION_PROFILE_DB_ID });
      if (profileRes.results.length > 0) {
          const p = profileRes.results[0].properties;
          profile = {
              name: getTitle(p, 'Name') || 'Untitled',
              role: getRichText(p, 'Role'),
              bio: getRichText(p, 'Bio'),
              location: getRichText(p, 'Location'),
              avatarUrl: getFileUrl(p, 'Avatar'),
              logoUrl: getFileUrl(p, 'Logo'), 
              socials: []
          };
          const socialText = getRichText(p, 'Socials');
          if (socialText) {
              try { profile.socials = JSON.parse(socialText); } catch(e) {}
          }
      }
  } catch (error) {
      console.error("Profile Fetch Error:", error.message);
      profileError = error.message;
      if (profileError.includes('accessible by this API bot')) {
          profileError = `PERMISSION ERROR: Connect integration to Profile DB (${process.env.NOTION_PROFILE_DB_ID})`;
      }
  }

  // 2. Gallery
  const galleryRes = await fetchDatabase(process.env.NOTION_GALLERY_DB_ID, 'Gallery', page => {
      const p = page.properties;
      return {
          id: page.id,
          title: getTitle(p, 'Title'),
          location: getRichText(p, 'Location'),
          count: p.Count?.number || 0,
          date: p.Date?.date?.start || '',
          ticketNumber: getRichText(p, 'TicketNumber'),
          description: getRichText(p, 'Description'),
          coverUrl: getFileUrl(p, 'Cover'),
          images: getAllFileUrls(p, 'Images'),
          featured: p.Featured?.checkbox || false // NEW: Checkbox extraction
      };
  });

  // 3. Thoughts
  const thoughtsRes = await fetchDatabase(process.env.NOTION_THOUGHTS_DB_ID, 'Thoughts', page => {
      const p = page.properties;
      return {
          id: page.id,
          content: getTitle(p, 'Content'),
          date: p.Date?.date?.start || new Date(page.created_time).toISOString().split('T')[0],
          time: '',
          tags: p.Tags?.multi_select?.map(t => t.name) || []
      };
  });

  // 4. Blog
  const postsRes = await fetchDatabase(process.env.NOTION_BLOG_DB_ID, 'Blog', page => {
      const p = page.properties;
      return {
          id: page.id,
          title: getTitle(p, 'Title'),
          excerpt: getRichText(p, 'Excerpt'),
          date: p.Date?.date?.start || '',
          readTime: p.ReadTime?.select?.name || '5 MIN',
          category: p.Category?.select?.name || '随笔',
          imageUrl: getFileUrl(p, 'Cover'),
          content: [],
          featured: p.Featured?.checkbox || false // NEW: Checkbox extraction
      };
  });

  // Construct Response
  const responseData = {
    profile,
    gallery: Array.isArray(galleryRes) ? galleryRes : [],
    thoughts: Array.isArray(thoughtsRes) ? thoughtsRes : [],
    posts: Array.isArray(postsRes) ? postsRes : [],
    debug: {
        profileError,
        galleryError: galleryRes.error ? galleryRes.message : null,
        thoughtsError: thoughtsRes.error ? thoughtsRes.message : null,
        postsError: postsRes.error ? postsRes.message : null,
    }
  };

  if (!profile && profileError) {
      return res.status(500).json({
          error: "Critical Data Missing",
          message: profileError,
          details: responseData.debug
      });
  }

  res.status(200).json(responseData);
}