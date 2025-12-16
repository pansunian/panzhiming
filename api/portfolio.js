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
  
  // Robust Title Getter: Tries 'Title' first, then 'Name' (Notion default)
  const getTitle = (props, keys = ['Title', 'Name']) => {
      const keyList = Array.isArray(keys) ? keys : [keys];
      for (const k of keyList) {
          const val = safeGet(props, k, 'title')?.[0]?.plain_text;
          if (val) return val;
      }
      return 'Untitled';
  };

  // Robust Image Getter: Tries Property 'Cover' first, then Page Cover
  const getImageUrl = (page, propertyKey = 'Cover') => {
      // 1. Try property
      const props = page.properties;
      if (props && props[propertyKey]) {
          const files = props[propertyKey].files;
          if (files && files.length > 0) {
              return files[0].file?.url || files[0].external?.url;
          }
      }
      // 2. Try native Page Cover
      if (page.cover) {
          return page.cover.file?.url || page.cover.external?.url;
      }
      return '';
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
        let msg = error.message;
        if (msg.includes('accessible by this API bot')) {
            msg = `PERMISSION DENIED: Please add your Notion Integration to the database page for ${name}.`;
        }
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
          const page = profileRes.results[0];
          const p = page.properties;
          profile = {
              name: getTitle(p, ['Name', 'Title']) || 'Untitled',
              role: getRichText(p, 'Role'),
              bio: getRichText(p, 'Bio'),
              location: getRichText(p, 'Location'),
              avatarUrl: getImageUrl(page, 'Avatar'), // Use robust image getter
              logoUrl: getImageUrl(page, 'Logo'), 
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
  }

  // 2. Gallery
  const galleryRes = await fetchDatabase(process.env.NOTION_GALLERY_DB_ID, 'Gallery', page => {
      const p = page.properties;
      return {
          id: page.id,
          title: getTitle(p, ['Title', 'Name']),
          location: getRichText(p, 'Location'),
          count: p.Count?.number || 0,
          date: p.Date?.date?.start || '',
          ticketNumber: getRichText(p, 'TicketNumber'),
          description: getRichText(p, 'Description'),
          coverUrl: getImageUrl(page, 'Cover'), // Robust image getter
          images: getAllFileUrls(p, 'Images'),
          featured: p.Featured?.checkbox || false
      };
  });

  // 3. Thoughts
  const thoughtsRes = await fetchDatabase(process.env.NOTION_THOUGHTS_DB_ID, 'Thoughts', page => {
      const p = page.properties;
      return {
          id: page.id,
          content: getTitle(p, ['Content', 'Name', 'Title']), // Flexible title
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
          title: getTitle(p, ['Title', 'Name']), // Support default 'Name' property
          excerpt: getRichText(p, 'Excerpt'),
          date: p.Date?.date?.start || '',
          readTime: p.ReadTime?.select?.name || '5 MIN',
          category: p.Category?.select?.name || '随笔',
          imageUrl: getImageUrl(page, 'Cover'), // Support Page Cover
          content: [],
          featured: p.Featured?.checkbox || false
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

  res.status(200).json(responseData);
}