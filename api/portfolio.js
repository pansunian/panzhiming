const { Client } = require('@notionhq/client');

module.exports = async function handler(req, res) {
  // Updated: Increased s-maxage to 3600 (1 hour). 
  // stale-while-revalidate=86400 means if the cache is stale (older than 1 hour), 
  // Vercel serves the stale content first, then updates the cache in the background.
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

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

  const getPropValue = (prop) => {
      if (!prop) return null;
      const type = prop.type;
      switch (type) {
          case 'rich_text': return prop.rich_text?.map(t => t.plain_text).join('') || '';
          case 'title': return prop.title?.map(t => t.plain_text).join('') || '';
          case 'url': return prop.url || '';
          case 'email': return prop.email || '';
          case 'phone_number': return prop.phone_number || '';
          case 'formula': return prop.formula?.string || prop.formula?.number || '';
          case 'select': return prop.select?.name || '';
          case 'multi_select': return prop.multi_select?.map(o => o.name) || [];
          case 'date': return prop.date?.start || '';
          case 'checkbox': return prop.checkbox || false;
          case 'files': return (prop.files && prop.files.length > 0) ? (prop.files[0].file?.url || prop.files[0].external?.url || '') : '';
          default: return '';
      }
  };

  const getImageUrl = (page, propertyKey = 'Cover', preferPageCover = true) => {
      if (preferPageCover && page.cover) {
          return page.cover.file?.url || page.cover.external?.url;
      }
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

  const cleanNotionId = (id) => {
      if (!id) return null;
      const match = id.match(/([a-f0-9]{32})/);
      if (match) return match[1];
      return id;
  };

  // Helper to fetch first image from content blocks
  const fetchFirstContentImage = async (pageId) => {
      try {
          const blocks = await notion.blocks.children.list({
              block_id: pageId,
              page_size: 20 // Fetch small batch to find image quickly
          });
          for (const block of blocks.results) {
              if (block.type === 'image') {
                  return block.image.type === 'external' ? block.image.external.url : block.image.file.url;
              }
              // Check inside column list for images
              if (block.type === 'column_list') {
                  // We skip deep recursion for performance in list view, 
                  // but could add it if strictly necessary. 
                  // Assuming main image is usually top-level or standard.
              }
          }
      } catch (e) {
          console.warn(`Failed to fetch blocks for ${pageId}`, e.message);
      }
      return null;
  };

  const fetchDatabase = async (dbId, name, mapper) => {
    try {
        const response = await notion.databases.query({ database_id: dbId });
        let results = response.results.map(mapper);
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

  // --- PARALLEL FETCHING SETUP ---
  
  // 1. Define Profile Fetcher
  const fetchProfile = async () => {
      try {
          const profileRes = await notion.databases.query({ database_id: process.env.NOTION_PROFILE_DB_ID });
          if (profileRes.results.length > 0) {
              const page = profileRes.results[0];
              const p = page.properties;
              
              const profileData = {
                  name: getPropValue(p['Name'] || p['Title']) || 'Untitled',
                  role: getPropValue(p['Role']),
                  bio: getPropValue(p['Bio']),
                  location: getPropValue(p['Location']),
                  avatarUrl: getImageUrl(page, 'Avatar', false),
                  logoUrl: getImageUrl(page, 'Logo', false), 
                  socials: []
              };

              const detectedSocials = [];
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
              profileData.socials = detectedSocials;
              return { data: profileData, error: null };
          }
          return { data: null, error: null };
      } catch (error) {
          console.error("Profile Fetch Error:", error.message);
          return { data: null, error: error.message };
      }
  };

  // 2. Define Manual Fetcher
  const fetchManual = async () => {
      const rawManualId = process.env.NOTION_MANUAL_PAGE_ID;
      const cleanManualId = cleanNotionId(rawManualId);
      if (!cleanManualId) return null;

      try {
          const page = await notion.pages.retrieve({ page_id: cleanManualId });
          let title = "我的说明书";
          if (page.properties) {
             const titleKey = Object.keys(page.properties).find(k => page.properties[k].type === 'title');
             if (titleKey) title = getPropValue(page.properties[titleKey]);
          }

          return {
              id: page.id,
              title: title || "我的说明书",
              excerpt: "User Manual / Operating Instructions",
              date: new Date(page.last_edited_time).getFullYear().toString(),
              readTime: '∞',
              category: 'MANUAL',
              imageUrl: getImageUrl(page),
              content: [],
              featured: false
          };
      } catch (error) {
          console.error("Manual Page Fetch Error:", error.message);
          return null;
      }
  };

  // 3. Define Blog Fetcher (with Content Image Extraction)
  const fetchBlogPosts = async () => {
      const dbId = process.env.NOTION_BLOG_DB_ID;
      const res = await fetchDatabase(dbId, 'Blog', page => {
          const p = page.properties;
          return {
              id: page.id,
              title: getPropValue(p['Title'] || p['Name']),
              excerpt: getPropValue(p['Excerpt']),
              date: p['Date']?.date?.start || '', 
              readTime: p['ReadTime']?.select?.name || '5 MIN',
              category: p['Category']?.select?.name || '随笔',
              // Initially map standard cover to fallback
              fallbackImageUrl: getImageUrl(page, 'Cover', false),
              content: [], 
              featured: p['Featured']?.checkbox || false
          };
      });

      if (res.error || !Array.isArray(res)) return res;

      // Enhance posts with first content image
      // Use Promise.all to fetch concurrently. Note: Rate limiting might apply for large DBs.
      const enhancedPosts = await Promise.all(res.map(async (post) => {
          const contentImage = await fetchFirstContentImage(post.id);
          return {
              ...post,
              imageUrl: contentImage || post.fallbackImageUrl
          };
      }));

      return enhancedPosts;
  };

  // --- EXECUTE ALL REQUESTS IN PARALLEL ---
  
  const [profileResult, galleryRes, thoughtsRes, postsRes, manualPage] = await Promise.all([
      fetchProfile(),
      fetchDatabase(process.env.NOTION_GALLERY_DB_ID, 'Gallery', page => {
          const p = page.properties;
          return {
              id: page.id,
              title: getPropValue(p['Title'] || p['Name']),
              location: getPropValue(p['Location']),
              count: p['Count']?.number || 0,
              date: p['Date']?.date?.start || '',
              ticketNumber: getPropValue(p['TicketNumber']),
              description: getPropValue(p['Description']),
              coverUrl: getImageUrl(page, 'Cover', false),
              images: getAllFileUrls(p, 'Images'),
              featured: p['Featured']?.checkbox || false
          };
      }),
      fetchDatabase(process.env.NOTION_THOUGHTS_DB_ID, 'Thoughts', page => {
          const p = page.properties;
          return {
              id: page.id,
              content: getPropValue(p['Content'] || p['Name'] || p['Title']),
              date: p['Date']?.date?.start || new Date(page.created_time).toISOString().split('T')[0],
              time: '', 
              tags: p['Tags']?.multi_select?.map(t => t.name) || [],
              featured: p['Featured']?.checkbox || false
          };
      }),
      fetchBlogPosts(), // Use the new specialized fetcher
      fetchManual()
  ]);

  const responseData = {
    profile: profileResult.data,
    manual: manualPage,
    gallery: Array.isArray(galleryRes) ? galleryRes : [],
    thoughts: Array.isArray(thoughtsRes) ? thoughtsRes : [],
    posts: Array.isArray(postsRes) ? postsRes : [],
    debug: {
        profileError: profileResult.error,
        galleryError: galleryRes.error ? galleryRes.message : null,
        thoughtsError: thoughtsRes.error ? thoughtsRes.message : null,
        postsError: postsRes.error ? postsRes.message : null,
    }
  };

  res.status(200).json(responseData);
}