const { Client } = require('@notionhq/client');
const { redisSet } = require('./lib/redis');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const PORTFOLIO_CACHE_KEY = 'portfolio-data-v3';
const CACHE_TTL_SECONDS = Number(process.env.PORTFOLIO_CACHE_TTL_SECONDS || 3300);

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

const normalizeNavPath = (value) => {
  if (!value) return '/';
  try {
    const parsed = new URL(value, 'https://panzhiming.com');
    const isOwnSite = /(^|\.)panzhiming\.com$/.test(parsed.hostname);
    if (!isOwnSite && value.startsWith('http')) return value;
    const pathName = parsed.pathname.replace(/\/+$/, '') || '/';
    const aliases = {
      '/photos': '/gallery',
      '/photo': '/gallery',
      '/idea': '/thoughts',
      '/ideas': '/thoughts',
      '/notes': '/thoughts',
      '/note': '/thoughts',
      '/article': '/blog',
      '/articles': '/blog',
      '/posts': '/blog',
      '/post': '/blog',
    };
    return aliases[pathName.toLowerCase()] || pathName;
  } catch {
    return value.startsWith('/') ? value : `/${value}`;
  }
};

const inferNavEn = (pathName) => {
  if (pathName === '/') return 'HOME';
  if (pathName.startsWith('/gallery')) return 'GALLERY';
  if (pathName.startsWith('/thoughts')) return 'NOTES';
  if (pathName.startsWith('/blog')) return 'BLOG';
  return '';
};

const parseNavLinks = (value) => {
  if (!value || typeof value !== 'string') return [];
  const links = [];
  const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = markdownLinkPattern.exec(value)) !== null) {
    const pathName = normalizeNavPath(match[2]);
    links.push({
      id: pathName === '/' ? 'home' : pathName.replace(/^\//, '').replace(/\//g, '-'),
      path: pathName,
      label: match[1].trim(),
      en: inferNavEn(pathName)
    });
  }
  return links;
};

const fetchDatabase = async (dbId, mapper) => {
  const response = await notion.databases.query({ database_id: dbId });
  let results = response.results.map(mapper);
  results.sort((a, b) => (b.date || '0000').localeCompare(a.date || '0000'));
  return results;
};

module.exports = async function handler(req, res) {
  try {
    const profileRes = await notion.databases.query({ database_id: process.env.NOTION_PROFILE_DB_ID });
    let profile = null;
    if (profileRes.results.length > 0) {
      const page = profileRes.results[0];
      const p = page.properties;
const platformMapping = {
  '小红书': 'XIAOHONGSHU', 'xiaohongshu': 'XIAOHONGSHU',
  '即刻': 'JIKE', 'jike': 'JIKE',
  '哔哩哔哩': 'BILIBILI', 'bilibili': 'BILIBILI',
  '小宇宙': 'XIAOYUZHOU', 'cosmos': 'XIAOYUZHOU',
  '公众号': 'WECHAT', '微信': 'WECHAT',
  'instagram': 'INSTAGRAM', 'twitter': 'TWITTER',
  'x': 'TWITTER', 'weibo': 'WEIBO', '微博': 'WEIBO',
  'github': 'GITHUB', 'email': 'EMAIL', '邮箱': 'EMAIL',
  'linkedin': 'LINKEDIN', 'youtube': 'YOUTUBE'
};
const actualKeys = Object.keys(p);
const socials = [];
for (const [columnName, platformCode] of Object.entries(platformMapping)) {
  const matchedKey = actualKeys.find(k => k.trim() === columnName);
  if (matchedKey) {
    const url = getPropValue(p[matchedKey]);
    if (url) socials.push({ platform: platformCode, url, handle: matchedKey });
  }
}
profile = {
  name: getPropValue(p['Name'] || p['Title']) || 'Untitled',
  role: getPropValue(p['Role']),
  bio: getPropValue(p['Bio']),
  location: getPropValue(p['Location']),
  avatarUrl: getImageUrl(page, 'Avatar', false),
  logoUrl: getImageUrl(page, 'Logo', false),
  tags: getPropValue(p['Tags']) || [],
  navLinks: parseNavLinks(getPropValue(p['导航 1'] || p.Nav || p.Navigation || p.NavLinks || p['导航'])),
  socials
};
    }

    const [gallery, thoughts, posts] = await Promise.all([
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
        lastEditedTime: page.last_edited_time || '',
        readTime: page.properties['ReadTime']?.select?.name || '5 MIN',
        category: page.properties['Category']?.select?.name || 'Blog',
        imageUrl: getImageUrl(page, 'Cover', true),
        featured: page.properties['Featured']?.checkbox || false
      }))
    ]);

    const aboutCandidates = posts.filter(p =>
      p.category.toLowerCase().includes('about') ||
      p.title.includes('关于') ||
      p.title.toLowerCase().includes('about') ||
      p.title.includes('说明书')
    );
    const about = aboutCandidates.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return (b.lastEditedTime || '').localeCompare(a.lastEditedTime || '');
    })[0];

    await redisSet(PORTFOLIO_CACHE_KEY, { profile, gallery, thoughts, posts, about, updatedAt: new Date().toISOString() }, CACHE_TTL_SECONDS);

    res.status(200).json({ success: true, message: '缓存刷新成功' });
  } catch (error) {
    console.error('Refresh cache error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
