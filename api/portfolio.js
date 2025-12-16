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

  const getImageUrl = (page, propertyKey = 'Cover') => {
      const prop = page.properties[propertyKey];
      if (prop) {
          const url = getPropValue(prop);
          if (url) return url;
      }
      if (page.cover) {
          return page.cover.file?.url || page.cover.external?.url;
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
              avatarUrl: getImageUrl(page, 'Avatar'),
              logoUrl: getImageUrl(page, 'Logo'), 
              socials: []
          };
          
          // --- SMART SOCIALS PARSING ---
          
          const detectedSocials = [];

          // Strategy 1: Explicit Columns (The Easy Way)
          // We look for columns named specifically after platforms.
          const platformMapping = {
              'Instagram': 'INSTAGRAM',
              'IG': 'INSTAGRAM',
              'Twitter': 'TWITTER',
              'X': 'TWITTER',
              'Weibo': 'WEIBO',
              '微博': 'WEIBO',
              'GitHub': 'GITHUB',
              'Github': 'GITHUB',
              'Bilibili': 'BILIBILI',
              'B站': 'BILIBILI',
              'Douban': 'DOUBAN',
              '豆瓣': 'DOUBAN',
              'Xiaohongshu': 'XIAOHONGSHU',
              'XiaoHongShu': 'XIAOHONGSHU',
              '小红书': 'XIAOHONGSHU',
              'Red': 'XIAOHONGSHU',
              'RED': 'XIAOHONGSHU',
              'YouTube': 'YOUTUBE',
              'Youtube': 'YOUTUBE',
              'LinkedIn': 'LINKEDIN',
              'Email': 'EMAIL',
              '邮箱': 'EMAIL',
              'Mail': 'EMAIL',
              'Jike': 'JIKE',
              '即刻': 'JIKE',
              'WeChat': 'WECHAT',
              'WeChat Public': 'WECHAT',
              '公众号': 'WECHAT'
          };

          for (const [colName, platformCode] of Object.entries(platformMapping)) {
              if (p[colName]) {
                  let rawVal = getPropValue(p[colName]);
                  if (rawVal && typeof rawVal === 'string' && rawVal.trim().length > 0) {
                      // Handle Email specifically
                      if (platformCode === 'EMAIL' && !rawVal.startsWith('mailto:')) {
                          // If it's just an email address, make it a link
                          detectedSocials.push({
                              platform: 'EMAIL',
                              url: `mailto:${rawVal.trim()}`,
                              handle: rawVal.trim()
                          });
                      } else {
                          // Normal Link
                          // Simple Handle extraction
                          let handle = '@Link';
                          try {
                              const urlObj = new URL(rawVal);
                              const parts = urlObj.pathname.split('/').filter(x => x);
                              if (parts.length > 0) handle = '@' + parts[parts.length - 1];
                          } catch {}

                          // Avoid duplicates
                          if (!detectedSocials.some(s => s.platform === platformCode)) {
                             detectedSocials.push({
                                 platform: platformCode,
                                 url: rawVal,
                                 handle: handle
                             });
                          }
                      }
                  }
              }
          }

          // Strategy 2: The "Socials" Column (The Flexible Way)
          const socialCol = p['Socials'] || p['Social'];
          if (socialCol) {
              const socialText = getPropValue(socialCol);
              
              if (socialText) {
                  let isJson = false;
                  // Try JSON
                  if (socialText.trim().startsWith('[') || socialText.trim().startsWith('{')) {
                      try { 
                          const parsed = JSON.parse(socialText);
                          let list = [];
                          if (Array.isArray(parsed)) list = parsed;
                          else if (typeof parsed === 'object') list = [parsed];
                          
                          list.forEach(item => {
                              if (!detectedSocials.some(s => s.platform === item.platform)) {
                                  detectedSocials.push(item);
                              }
                          });
                          isJson = true;
                      } catch(e) { /* ignore */ }
                  }

                  // Try Text/Pipe Splitting if not JSON
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
                                    else if (h.includes('weibo')) platform = 'WEIBO';
                                    else if (h.includes('youtube')) platform = 'YOUTUBE';
                                    else if (h.includes('bilibili')) platform = 'BILIBILI';
                                    else if (h.includes('xiaohongshu') || h.includes('xhs')) platform = 'XIAOHONGSHU';
                                    else if (h.includes('okjk') || h.includes('jike')) platform = 'JIKE';
                                    else if (h.includes('weixin') || h.includes('wechat')) platform = 'WECHAT';
                                    else platform = 'LINK';
                                  } catch { platform = 'LINK'; }
                              }

                              let handle = '@Link';
                              try {
                                  const parts = new URL(url).pathname.split('/').filter(x => x);
                                  if (parts.length > 0) handle = '@' + parts[parts.length - 1];
                              } catch {}

                              if (!detectedSocials.some(s => s.platform === platform.toUpperCase())) {
                                  detectedSocials.push({
                                      platform: platform.toUpperCase(),
                                      url: url,
                                      handle: handle
                                  });
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