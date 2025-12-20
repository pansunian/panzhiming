const { Client } = require('@notionhq/client');

module.exports = async function handler(req, res) {
  // Reduced s-maxage to 60 (1 minute) for faster debugging
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=86400');

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

  const cleanNotionId = (id) => {
      if (!id) return null;
      const match = id.match(/([a-f0-9]{32})/);
      if (match) return match[1];
      return id;
  };

  const fetchFirstContentImage = async (pageId) => {
      try {
          const blocks = await notion.blocks.children.list({ block_id: pageId, page_size: 10 });
          for (const block of blocks.results) {
              if (block.type === 'image') {
                  return block.image.type === 'external' ? block.image.external.url : block.image.file.url;
              }
          }
      } catch (e) { console.warn(`Block fetch failed for ${pageId}`, e.message); }
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
        return { error: true, message: error.message };
    }
  };

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

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
              const platformMapping = {
                  'Instagram': 'INSTAGRAM', 'Twitter': 'TWITTER', 'X': 'TWITTER',
                  'Weibo': 'WEIBO', 'GitHub': 'GITHUB', 'Bilibili': 'BILIBILI', 
                  'Douban': 'DOUBAN', 'Xiaohongshu': 'XIAOHONGSHU', 'YouTube': 'YOUTUBE', 
                  'LinkedIn': 'LINKEDIN', 'Email': 'EMAIL', 'Jike': 'JIKE', 'WeChat': 'WECHAT'
              };
              for (const [colName, platformCode] of Object.entries(platformMapping)) {
                  if (p[colName]) {
                      let rawVal = getPropValue(p[colName]);
                      if (rawVal && typeof rawVal === 'string' && rawVal.trim().length > 0) {
                          if (platformCode === 'EMAIL' && !rawVal.startsWith('mailto:')) {
                              detectedSocials.push({ platform: 'EMAIL', url: `mailto:${rawVal.trim()}`, handle: rawVal.trim() });
                          } else {
                              detectedSocials.push({ platform: platformCode, url: rawVal, handle: '@Link' });
                          }
                      }
                  }
              }
              profileData.socials = detectedSocials;
              return { data: profileData, error: null };
          }
          return { data: null, error: null };
      } catch (error) { return { data: null, error: error.message }; }
  };

  const fetchAboutPage = async () => {
      const rawPageId = process.env.NOTION_ABOUT_PAGE_ID || process.env.NOTION_MANUAL_PAGE_ID;
      const cleanPageId = cleanNotionId(rawPageId);
      if (!cleanPageId) return null;
      try {
          const page = await notion.pages.retrieve({ page_id: cleanPageId });
          return {
              id: page.id,
              title: getPropValue(Object.values(page.properties).find(p => p.type === 'title')) || "我的说明书",
              excerpt: "About Me / Manual",
              date: "2024",
              readTime: '∞',
              category: 'ABOUT',
              imageUrl: getImageUrl(page),
              featured: false
          };
      } catch (e) { return null; }
  };

  const [profileResult, galleryRes, thoughtsRes, postsRes, aboutPage] = await Promise.all([
      fetchProfile(),
      fetchDatabase(process.env.NOTION_GALLERY_DB_ID, 'Gallery', page => ({
          id: page.id,
          title: getPropValue(page.properties['Title'] || page.properties['Name']),
          location: getPropValue(page.properties['Location']),
          count: page.properties['Count']?.number || 0,
          date: page.properties['Date']?.date?.start || '',
          ticketNumber: getPropValue(page.properties['TicketNumber']),
          description: getPropValue(page.properties['Description']),
          coverUrl: getImageUrl(page, 'Cover', false),
          featured: page.properties['Featured']?.checkbox || false
      })),
      fetchDatabase(process.env.NOTION_THOUGHTS_DB_ID, 'Thoughts', page => ({
          id: page.id,
          content: getPropValue(page.properties['Content'] || page.properties['Name']),
          date: page.properties['Date']?.date?.start || new Date(page.created_time).toISOString().split('T')[0],
          time: '',
          tags: page.properties['Tags']?.multi_select?.map(t => t.name) || [],
          featured: page.properties['Featured']?.checkbox || false
      })),
      fetchDatabase(process.env.NOTION_BLOG_DB_ID, 'Blog', page => ({
          id: page.id,
          title: getPropValue(page.properties['Title'] || page.properties['Name']),
          excerpt: getPropValue(page.properties['Excerpt']),
          date: page.properties['Date']?.date?.start || '',
          readTime: page.properties['ReadTime']?.select?.name || '5 MIN',
          category: page.properties['Category']?.select?.name || 'Blog',
          imageUrl: getImageUrl(page, 'Cover', true),
          featured: page.properties['Featured']?.checkbox || false
      })),
      fetchAboutPage()
  ]);

  res.status(200).json({
    profile: profileResult.data,
    about: aboutPage,
    gallery: Array.isArray(galleryRes) ? galleryRes : [],
    thoughts: Array.isArray(thoughtsRes) ? thoughtsRes : [],
    posts: Array.isArray(postsRes) ? postsRes : []
  });
}