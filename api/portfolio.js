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

  // --- HELPER FUNCTIONS ---

  // robust property value extractor
  const getPropValue = (prop) => {
      if (!prop) return null;
      const type = prop.type;
      
      switch (type) {
          case 'rich_text':
              return prop.rich_text?.map(t => t.plain_text).join('') || '';
          case 'title':
              return prop.title?.map(t => t.plain_text).join('') || '';
          case 'url':
              return prop.url || '';
          case 'email':
              return prop.email || '';
          case 'phone_number':
              return prop.phone_number || '';
          case 'formula':
              return prop.formula?.string || prop.formula?.number || '';
          case 'select':
              return prop.select?.name || '';
          case 'multi_select':
              return prop.multi_select?.map(o => o.name) || [];
          case 'date':
              return prop.date?.start || '';
          case 'checkbox':
              return prop.checkbox || false;
          case 'files':
              if (prop.files && prop.files.length > 0) {
                 return prop.files[0].file?.url || prop.files[0].external?.url || '';
              }
              return '';
          default:
              return '';
      }
  };

  // Updated: Added preferPageCover flag (default true)
  // Set to false when we explicitly want a property image (like Avatar or Logo)
  const getImageUrl = (page, propertyKey = 'Cover', preferPageCover = true) => {
      // Priority 1: Page Cover (only if preferPageCover is true)
      if (preferPageCover && page.cover) {
          return page.cover.file?.url || page.cover.external?.url;
      }
      // Priority 2: Property named 'Cover' (for databases)
      if (page.properties && page.properties[propertyKey]) {
          const url = getPropValue(page.properties[propertyKey]);
          if (url) return url;
      }
      return '';
  };

  const getAllFileUrls = (props, key) => {
    const prop = props[key];
    if (prop && prop.type === 'files') {
        return prop.files.map(f => f.file?.url || f.external?.url).filter(Boolean);
    }
    return [];
  };

  // Helper to extract clean UUID from a potential URL or raw ID
  const cleanNotionId = (id) => {
      if (!id) return null;
      // If it's a full URL (e.g., https://notion.so/user/Page-Title-1234567890abcdef1234567890abcdef)
      // We look for the 32-char hex string at the end
      const match = id.match(/([a-f0-9]{32})/);
      if (match) return match[1];
      return id; // fallback to original if no pattern match (assumed correct)
  };

  // Helper to handle Notion errors gracefully
  const fetchDatabase = async (dbId, name, mapper) => {
    try {
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
              name: getPropValue(p['Name'] || p['Title']) || 'Untitled',
              role: getPropValue(p['Role']),
              bio: getPropValue(p['Bio']),
              location: getPropValue(p['Location']),
              // Explicitly disable page cover preference for Avatar and Logo
              avatarUrl: getImageUrl(page, 'Avatar', false),
              logoUrl: getImageUrl(page, 'Logo', false), 
              socials: []
          };
          
          // --- SMART SOCIALS PARSING ---
          
          const detectedSocials = [];
          // ... (Existing social parsing logic kept brief for diff, logic remains same) ...
          // Strategy 1: Explicit Columns
          const platformMapping = {
              'Instagram': 'INSTAGRAM', 'IG': 'INSTAGRAM', 'Twitter': 'TWITTER', 'X': 'TWITTER',
              'Weibo': 'WEIBO', '微博': 'WEIBO', 'GitHub': 'GITHUB', 'Github': 'GITHUB',
              'Bilibili': 'BILIBILI', 'B站': 'BILIBILI', 'Douban': 'DOUBAN', '豆瓣': 'DOUBAN',
              'Xiaohongshu': 'XIAOHONGSHU', 'XiaoHongShu': 'XIAOHONGSHU', '小红书': 'XIAOHONGSHU',
              'Red': 'XIAOHONGSHU', 'RED': 'XIAOHONGSHU', 'YouTube': 'YOUTUBE', 'Youtube': 'YOUTUBE',
              'LinkedIn': 'LINKEDIN', 'Email': 'EMAIL', '邮箱': 'EMAIL', 'Mail': 'EMAIL',
              'Jike': 'JIKE', '即刻': 'JIKE', 'WeChat': 'WECHAT', 'WeChat Public': 'WECHAT', '公众号': 'WECHAT'
          };
          for (const [colName, platformCode] of Object.entries(platformMapping)) {
              if (p[colName]) {
                  let rawVal = getPropValue(p[colName]);
                  if (rawVal && typeof rawVal === 'string' && rawVal.trim().length > 0) {
                      if (platformCode === 'EMAIL' && !rawVal.startsWith('mailto:')) {
                          detectedSocials.push({ platform: 'EMAIL', url: `mailto:${rawVal.trim()}`, handle: rawVal.trim() });
                      } else {
                          let handle = '@Link';
                          try {
                              const urlObj = new URL(rawVal);
                              const parts = urlObj.pathname.split('/').filter(x => x);
                              if (parts.length > 0) handle = '@' + parts[parts.length - 1];
                          } catch {}
                          if (!detectedSocials.some(s => s.platform === platformCode)) {
                             detectedSocials.push({ platform: platformCode, url: rawVal, handle: handle });
                          }
                      }
                  }
              }
          }
          // Strategy 2: The "Socials" Column
          const socialCol = p['Socials'] || p['Social'];
          if (socialCol) {
              const socialText = getPropValue(socialCol);
              if (socialText) {
                  let isJson = false;
                  if (socialText.trim().startsWith('[') || socialText.trim().startsWith('{')) {
                      try { 
                          const parsed = JSON.parse(socialText);
                          let list = Array.isArray(parsed) ? parsed : [parsed];
                          list.forEach(item => { if (!detectedSocials.some(s => s.platform === item.platform)) detectedSocials.push(item); });
                          isJson = true;
                      } catch(e) {}
                  }
                  if (!isJson) {
                      const parts = socialText.split(/\||\n/).map(s => s.trim()).filter(s => s);
                      for (const part of parts) {
                          const urlMatch = part.match(/(https?:\/\/[^\s]+)/);
                          if (urlMatch) {
                              const url = urlMatch[0];
                              let platform = part.replace(url, '').replace(/[:：]/g, '').trim();
                              if (!platform) {
                                  try {
                                    const h = new URL(url).hostname.toLowerCase();
                                    if (h.includes('instagram')) platform = 'INSTAGRAM';
                                    else if (h.includes('twitter') || h.includes('x.com')) platform = 'TWITTER';
                                    else if (h.includes('github')) platform = 'GITHUB';
                                    else platform = 'LINK';
                                  } catch { platform = 'LINK'; }
                              }
                              if (!detectedSocials.some(s => s.platform === platform.toUpperCase())) {
                                  detectedSocials.push({ platform: platform.toUpperCase(), url: url, handle: '@Link' });
                              }
                          }
                      }
                  }
              }
          }
          profile.socials = detectedSocials;
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
          title: getPropValue(p['Title'] || p['Name']),
          location: getPropValue(p['Location']),
          count: p['Count']?.number || 0,
          date: p['Date']?.date?.start || '',
          ticketNumber: getPropValue(p['TicketNumber']),
          description: getPropValue(p['Description']),
          coverUrl: getImageUrl(page, 'Cover'),
          images: getAllFileUrls(p, 'Images'),
          featured: p['Featured']?.checkbox || false
      };
  });

  // 3. Thoughts
  const thoughtsRes = await fetchDatabase(process.env.NOTION_THOUGHTS_DB_ID, 'Thoughts', page => {
      const p = page.properties;
      return {
          id: page.id,
          content: getPropValue(p['Content'] || p['Name'] || p['Title']),
          date: p['Date']?.date?.start || new Date(page.created_time).toISOString().split('T')[0],
          time: '', 
          tags: p['Tags']?.multi_select?.map(t => t.name) || [],
          featured: p['Featured']?.checkbox || false
      };
  });

  // 4. Blog
  const postsRes = await fetchDatabase(process.env.NOTION_BLOG_DB_ID, 'Blog', page => {
      const p = page.properties;
      return {
          id: page.id,
          title: getPropValue(p['Title'] || p['Name']),
          excerpt: getPropValue(p['Excerpt']),
          date: p['Date']?.date?.start || '', 
          readTime: p['ReadTime']?.select?.name || '5 MIN',
          category: p['Category']?.select?.name || '随笔',
          imageUrl: getImageUrl(page, 'Cover'),
          content: [], 
          featured: p['Featured']?.checkbox || false
      };
  });

  // 5. Manual Page (Special Single Page)
  let manualPage = null;
  const rawManualId = process.env.NOTION_MANUAL_PAGE_ID;
  const cleanManualId = cleanNotionId(rawManualId);

  if (cleanManualId) {
      try {
          const page = await notion.pages.retrieve({ page_id: cleanManualId });
          
          let title = "我的说明书";
          // Try to find title in properties (if it's in a DB or has standard props)
          if (page.properties) {
             // Search for any title type property
             const titleKey = Object.keys(page.properties).find(k => page.properties[k].type === 'title');
             if (titleKey) title = getPropValue(page.properties[titleKey]);
          }

          manualPage = {
              id: page.id,
              title: title || "我的说明书",
              excerpt: "User Manual / Operating Instructions",
              date: new Date(page.last_edited_time).getFullYear().toString(),
              readTime: '∞',
              category: 'MANUAL',
              imageUrl: getImageUrl(page), // Will use page cover
              content: [], // Content will be fetched by frontend using get-page-content
              featured: false
          };
      } catch (error) {
          console.error("Manual Page Fetch Error:", error.message);
          // Don't fail the whole request, just return null for manual
      }
  }

  const responseData = {
    profile,
    manual: manualPage, // Add this field
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