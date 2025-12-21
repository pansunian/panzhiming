const { Client } = require('@notionhq/client');

module.exports = async function handler(req, res) {
  // 设置边缘缓存：在边缘节点缓存 1 小时，过期后 24 小时内允许返回旧数据并在后台更新
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

              const platformMapping = {
                  '小红书': 'XIAOHONGSHU',
                  'xiaohongshu': 'XIAOHONGSHU',
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
                  const matchedKey = actualKeys.find(k => k.trim() === columnName);
                  if (matchedKey) {
                      const url = getPropValue(p[matchedKey]);
                      if (url) {
                          profileData.socials.push({ 
                              platform: platformCode, 
                              url, 
                              handle: matchedKey 
                          });
                      }
                  }
              }
              return profileData;
          }
          return null;
      } catch (e) { return null; }
  };

  const fetchDatabase = async (dbId, mapper) => {
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
      fetchDatabase(process.env.NOTION_GALLERY_DB_ID, page => ({
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
      fetchDatabase(process.env.NOTION_THOUGHTS_DB_ID, page => ({
          id: page.id,
          content: getPropValue(page.properties['Content'] || page.properties['Name']),
          date: page.properties['Date']?.date?.start || new Date(page.created_time).toISOString().split('T')[0],
          tags: page.properties['Tags']?.multi_select?.map(t => t.name) || [],
          featured: page.properties['Featured']?.checkbox || false
      })),
      fetchDatabase(process.env.NOTION_BLOG_DB_ID, page => ({
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

  // 综合识别关于页
  const about = posts.find(p => 
    p.category.toLowerCase().includes('about') ||
    p.title.includes('关于') || 
    p.title.toLowerCase().includes('about')
  );

  res.status(200).json({ profile, gallery, thoughts, posts, about });
}