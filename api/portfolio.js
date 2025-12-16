const { Client } = require('@notionhq/client');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

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
  
  const getTitle = (props, keys = ['Title', 'Name']) => {
      const keyList = Array.isArray(keys) ? keys : [keys];
      for (const k of keyList) {
          const val = safeGet(props, k, 'title')?.[0]?.plain_text;
          if (val) return val;
      }
      return 'Untitled';
  };

  const getImageUrl = (page, propertyKey = 'Cover') => {
      const props = page.properties;
      if (props && props[propertyKey]) {
          const files = props[propertyKey].files;
          if (files && files.length > 0) {
              return files[0].file?.url || files[0].external?.url;
          }
      }
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
        // CHANGED: Removed "sorts: [{ property: 'Date' ... }]" 
        // This prevents crashes if the DB lacks a "Date" column or it's named differently.
        // We will sort in Javascript instead.
        const response = await notion.databases.query({
            database_id: dbId,
        });
        
        let results = response.results.map(mapper);
        
        // Sort in memory (Newest first)
        results.sort((a, b) => {
            const dateA = a.date || '0000-00-00';
            const dateB = b.date || '0000-00-00';
            return dateB.localeCompare(dateA);
        });

        return results;
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
              avatarUrl: getImageUrl(page, 'Avatar'),
              logoUrl: getImageUrl(page, 'Logo'), 
              socials: []
          };
          
          // Enhanced Socials Parsing
          // 1. Try both 'Socials' and 'Social'
          const socialText = getRichText(p, 'Socials') || getRichText(p, 'Social');
          
          if (socialText) {
              let isJson = false;
              // Strategy A: JSON Parsing
              if (socialText.trim().startsWith('[') || socialText.trim().startsWith('{')) {
                  try { 
                      const parsed = JSON.parse(socialText);
                      if (Array.isArray(parsed)) {
                          profile.socials = parsed;
                          isJson = true;
                      } else if (typeof parsed === 'object' && parsed !== null) {
                          profile.socials = [parsed];
                          isJson = true;
                      }
                  } catch(e) {
                       // ignore json error, fall through to text parsing
                  }
              }

              // Strategy B: Pipe Separated Text Parsing
              // Example: "Instagram: https://... | Weibo: https://..."
              if (!isJson) {
                  const parts = socialText.split(/\||\n/).map(s => s.trim()).filter(s => s);
                  const parsedSocials = [];
                  
                  for (const part of parts) {
                      const urlMatch = part.match(/(https?:\/\/[^\s]+)/);
                      if (urlMatch) {
                          const url = urlMatch[0];
                          
                          // 1. Try to get Platform Name from text before URL (e.g. "Weibo: http...")
                          // Remove the URL and any trailing colons
                          let platform = part.replace(url, '').replace(/[:：]/g, '').trim();
                          
                          // 2. If no text label, infer from Domain
                          if (!platform) {
                              try {
                                  const hostname = new URL(url).hostname.toLowerCase();
                                  if (hostname.includes('instagram')) platform = 'INSTAGRAM';
                                  else if (hostname.includes('twitter') || hostname.includes('x.com')) platform = 'TWITTER';
                                  else if (hostname.includes('github')) platform = 'GITHUB';
                                  else if (hostname.includes('weibo')) platform = 'WEIBO';
                                  else if (hostname.includes('douban')) platform = 'DOUBAN';
                                  else if (hostname.includes('youtube')) platform = 'YOUTUBE';
                                  else if (hostname.includes('bilibili')) platform = 'BILIBILI';
                                  else if (hostname.includes('linkedin')) platform = 'LINKEDIN';
                                  else platform = 'LINK';
                              } catch {
                                  platform = 'LINK';
                              }
                          }

                          // 3. Extract Handle (last part of URL path)
                          let handle = '@Link';
                          try {
                              const urlObj = new URL(url);
                              const pathname = urlObj.pathname.replace(/\/$/, ''); // Remove trailing slash
                              const pathParts = pathname.split('/');
                              if (pathParts.length > 0) {
                                  const lastPart = pathParts[pathParts.length - 1];
                                  if (lastPart) handle = '@' + lastPart;
                              }
                          } catch {}

                          parsedSocials.push({
                              platform: platform.toUpperCase(),
                              url: url,
                              handle: handle
                          });
                      }
                  }
                  
                  if (parsedSocials.length > 0) {
                      profile.socials = parsedSocials;
                  }
              }
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
          coverUrl: getImageUrl(page, 'Cover'),
          images: getAllFileUrls(p, 'Images'),
          featured: p.Featured?.checkbox || false
      };
  });

  // 3. Thoughts
  const thoughtsRes = await fetchDatabase(process.env.NOTION_THOUGHTS_DB_ID, 'Thoughts', page => {
      const p = page.properties;
      return {
          id: page.id,
          content: getTitle(p, ['Content', 'Name', 'Title']),
          date: p.Date?.date?.start || new Date(page.created_time).toISOString().split('T')[0],
          time: '', 
          tags: p.Tags?.multi_select?.map(t => t.name) || [],
          featured: p.Featured?.checkbox || false // Added Featured support
      };
  });

  // 4. Blog
  const postsRes = await fetchDatabase(process.env.NOTION_BLOG_DB_ID, 'Blog', page => {
      const p = page.properties;
      return {
          id: page.id,
          title: getTitle(p, ['Title', 'Name']),
          excerpt: getRichText(p, 'Excerpt'),
          date: p.Date?.date?.start || '', // Safe access, won't crash if missing
          readTime: p.ReadTime?.select?.name || '5 MIN',
          category: p.Category?.select?.name || '随笔',
          imageUrl: getImageUrl(page, 'Cover'),
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