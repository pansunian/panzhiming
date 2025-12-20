const { Client } = require('@notionhq/client');

module.exports = async function handler(req, res) {
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
    return res.status(500).json({ error: 'Config Error', message: `Missing env vars: ${missingEnv.join(', ')}` });
  }

  const notion = new Client({ auth: process.env.NOTION_API_KEY });

  const getPropValue = (prop) => {
      if (!prop) return null;
      const type = prop.type;
      switch (type) {
          case 'rich_text': return prop.rich_text?.map(t => t.plain_text).join('') || '';
          case 'title': return prop.title?.map(t => t.plain_text).join('') || '';
          case 'url': return prop.url || '';
          case 'email': return prop.email || '';
          case 'select': return prop.select?.name || '';
          case 'multi_select': return prop.multi_select?.map(o => o.name) || [];
          case 'date': return prop.date?.start || '';
          case 'checkbox': return prop.checkbox || false;
          case 'number': return prop.number || 0;
          case 'files': return (prop.files && prop.files.length > 0) ? (prop.files[0].file?.url || prop.files[0].external?.url || '') : '';
          default: return '';
      }
  };

  const getImageUrl = (page, propertyKey = 'Cover', preferPageCover = true) => {
      if (preferPageCover && page.cover) return page.cover.file?.url || page.cover.external?.url;
      if (page.properties && page.properties[propertyKey]) {
          const url = getPropValue(page.properties[propertyKey]);
          if (url) return url;
      }
      return '';
  };

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const fetchProfile = async () => {
      try {
          const profileRes = await notion.databases.query({ database_id: process.env.NOTION_PROFILE_DB_ID });
          if (profileRes.results.length > 0) {
              const page = profileRes.results[0];
              const p = page.properties;
              const actualKeys = Object.keys(p);
              
              const profileData = {
                  name: getPropValue(p['Name'] || p['Title']) || 'Untitled',
                  role: getPropValue(p['Role']),
                  bio: getPropValue(p['Bio']),
                  location: getPropValue(p['Location']),
                  avatarUrl: getImageUrl(page, 'Avatar', false),
                  logoUrl: getImageUrl(page, 'Logo', false), 
                  socials: []
              };

              // 平台映射表：Key 为 Notion 中的列名（支持中文），Value 为前端展示代码
              const platformMapping = {
                  '小红书': 'XIAOHONGSHU',
                  'xiaohongshu': 'XIAOHONGSHU',
                  'red': 'XIAOHONGSHU',
                  '即刻': 'JIKE',
                  'jike': 'JIKE',
                  '哔哩哔哩': 'BILIBILI',
                  'bilibili': 'BILIBILI',
                  '小宇宙': 'XIAOYUZHOU',
                  'cosmos': 'XIAOYUZHOU',
                  '公众号': 'WECHAT',
                  '微信': 'WECHAT',
                  'instagram': 'INSTAGRAM',
                  'twitter': 'TWITTER',
                  'x': 'TWITTER',
                  'weibo': 'WEIBO',
                  '微博': 'WEIBO',
                  'github': 'GITHUB',
                  'email': 'EMAIL',
                  '邮箱': 'EMAIL',
                  'linkedin': 'LINKEDIN',
                  'youtube': 'YOUTUBE'
              };

              for (const [columnName, platformCode] of Object.entries(platformMapping)) {
                  // 精确查找 Notion 列名
                  const matchedKey = actualKeys.find(k => k.trim() === columnName);
                  if (matchedKey) {
                      const url = getPropValue(p[matchedKey]);
                      if (url) {
                          profileData.socials.push({ 
                              platform: platformCode, 
                              url, 
                              handle: matchedKey // 使用列名作为 Handle
                          });
                      }
                  }
              }
              return profileData;
          }
          return null;
      } catch (e) { return null; }
  };

  const fetchDatabase = async (dbId, name, mapper) => {
    try {
        const response = await notion.databases.query({ database_id: dbId });
        let results = response.results.map(mapper);
        results.sort((a, b) => (b.date || '0000').localeCompare(a.date || '0000'));
        return results;
    } catch (error) {
        return [];
    }
  };

  const [profile, gallery, thoughts, posts] = await Promise.all([
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
          tags: page.properties['Tags']?.multi_select?.map(t => t.name) || []
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
      }))
  ]);

  res.status(200).json({ profile, gallery, thoughts, posts });
}