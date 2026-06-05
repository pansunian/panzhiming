const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('@notionhq/client');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const dataDir = path.join(publicDir, 'data');
const pagesDir = path.join(dataDir, 'pages');
const pageImagesDir = path.join(dataDir, 'page-images');
const assetDir = path.join(publicDir, 'notion-assets');

const requiredEnv = [
  'NOTION_API_KEY',
  'NOTION_PROFILE_DB_ID',
  'NOTION_GALLERY_DB_ID',
  'NOTION_THOUGHTS_DB_ID',
  'NOTION_BLOG_DB_ID'
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0 || process.env.SKIP_NOTION_SYNC === '1') {
  console.log(`[sync-notion-static] Skipped. Missing env: ${missingEnv.join(', ') || 'none'}`);
  process.exit(0);
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const assetCache = new Map();
const buildVersion = new Date().toISOString();

const ensureDirs = async () => {
  await fs.mkdir(pagesDir, { recursive: true });
  await fs.mkdir(pageImagesDir, { recursive: true });
  await fs.mkdir(assetDir, { recursive: true });
};

const writeJson = async (filePath, data) => {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
};

const getPropValue = (prop) => {
  if (!prop) return null;
  const type = prop.type;
  switch (type) {
    case 'rich_text': return prop.rich_text?.map((t) => t.plain_text).join('') || '';
    case 'title': return prop.title?.map((t) => t.plain_text).join('') || '';
    case 'url': return prop.url || '';
    case 'email': return prop.email || '';
    case 'select': return prop.select?.name || '';
    case 'multi_select': return prop.multi_select?.map((o) => o.name) || [];
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

  if (links.length > 0) return links;

  return value
    .split(/\||｜|,|，|\n/)
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label, index) => {
      const fallbackPaths = ['/', '/thoughts', '/gallery', '/blog'];
      const pathName = fallbackPaths[index] || '/';
      return {
        id: pathName === '/' ? 'home' : pathName.slice(1),
        path: pathName,
        label,
        en: inferNavEn(pathName)
      };
    });
};

const safeName = (value) => value.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 96);

const stableAssetSignature = (url) => {
  try {
    const parsed = new URL(url);
    const isSignedNotionAsset =
      parsed.hostname.includes('prod-files-secure.s3') ||
      parsed.hostname.includes('s3.us-west-2.amazonaws.com');

    if (isSignedNotionAsset) {
      parsed.search = '';
    }

    return crypto
      .createHash('sha1')
      .update(parsed.toString())
      .digest('hex')
      .slice(0, 10);
  } catch {
    return crypto.createHash('sha1').update(url).digest('hex').slice(0, 10);
  }
};

const extFromContentType = (contentType) => {
  if (!contentType) return '';
  if (contentType.includes('jpeg')) return '.jpg';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('gif')) return '.gif';
  if (contentType.includes('svg')) return '.svg';
  return '';
};

const extFromUrl = (url) => {
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    return ext && ext.length <= 6 ? ext : '';
  } catch {
    return '';
  }
};

const downloadAsset = async (url, key) => {
  if (!url || !/^https?:\/\//.test(url)) return url || '';
  if (assetCache.has(url)) return assetCache.get(url);

  const assetKey = safeName(key || Buffer.from(url).toString('base64url').slice(0, 48));

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get('content-type') || '';
    const ext = extFromContentType(contentType) || extFromUrl(url) || '.bin';
    const fileName = `${assetKey}-${stableAssetSignature(url)}${ext}`;
    const filePath = path.join(assetDir, fileName);
    const bytes = Buffer.from(await response.arrayBuffer());

    await fs.writeFile(filePath, bytes);
    const publicUrl = `/notion-assets/${fileName}`;
    assetCache.set(url, publicUrl);
    return publicUrl;
  } catch (error) {
    console.warn(`[sync-notion-static] Asset download failed: ${url} (${error.message})`);
    assetCache.set(url, url);
    return url;
  }
};

const fetchAllChildren = async (blockId) => {
  const results = [];
  let cursor;
  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100
    });
    results.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
  return results;
};

const queryDatabase = async (databaseId, mapper) => {
  const pages = [];
  let cursor;
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100
    });
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  const mapped = [];
  for (const page of pages) mapped.push(await mapper(page));
  mapped.sort((a, b) => {
    const dateCompare = (b.date || '0000').localeCompare(a.date || '0000');
    if (dateCompare !== 0) return dateCompare;
    return (b.lastEditedTime || '').localeCompare(a.lastEditedTime || '');
  });
  return mapped;
};

const parseRichText = (richTextArray) => {
  if (!richTextArray) return [];
  return richTextArray.map((t) => ({
    type: t.type,
    text: t.plain_text,
    annotations: t.annotations,
    href: t.href,
    mention: t.type === 'mention' ? {
      type: t.mention?.type,
      url: t.mention?.link_preview?.url || t.href || ''
    } : null
  }));
};

const transformBlocks = async (blocks) => {
  const content = [];

  for (const block of blocks) {
    if (block.type === 'column_list') {
      try {
        const columns = await fetchAllChildren(block.id);
        for (const column of columns) {
          if (column.type === 'column') {
            content.push(...await transformBlocks(await fetchAllChildren(column.id)));
          }
        }
      } catch (error) {
        console.warn(`[sync-notion-static] Failed to fetch column content: ${error.message}`);
      }
      continue;
    }

    const transformed = await transformBlock(block);
    if (transformed) content.push(transformed);
  }

  return content;
};

const transformBlock = async (block) => {
  if (block.type === 'paragraph') return { type: 'paragraph', content: parseRichText(block.paragraph.rich_text) };
  if (block.type.startsWith('heading_')) {
    const type = block.type;
    return { type, content: parseRichText(block[type]?.rich_text) };
  }
  if (block.type === 'callout') {
    const children = block.has_children ? await transformBlocks(await fetchAllChildren(block.id)) : [];
    return {
      type: 'callout',
      icon: block.callout.icon,
      color: block.callout.color,
      content: parseRichText(block.callout.rich_text),
      children
    };
  }
  if (block.type === 'quote') return { type: 'quote', content: parseRichText(block.quote.rich_text) };
  if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
    return {
      type: 'list_item',
      listType: block.type === 'numbered_list_item' ? 'ol' : 'ul',
      content: parseRichText(block[block.type].rich_text)
    };
  }
  if (block.type === 'toggle') return { type: 'toggle', content: parseRichText(block.toggle.rich_text), hasChildren: block.has_children };
  if (block.type === 'image') {
    const src = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
    return {
      type: 'image',
      src: await downloadAsset(src, `block-${block.id}`),
      caption: parseRichText(block.image.caption)
    };
  }
  if (block.type === 'bookmark') return { type: 'bookmark', url: block.bookmark.url, caption: parseRichText(block.bookmark.caption) };
  if (block.type === 'embed') return { type: 'embed', url: block.embed.url, caption: parseRichText(block.embed.caption) };
  if (block.type === 'link_preview') return { type: 'link_preview', url: block.link_preview.url };
  if (block.type === 'code') return { type: 'code', language: block.code.language, content: parseRichText(block.code.rich_text), caption: parseRichText(block.code.caption) };
  if (block.type === 'file') {
    const file = block.file;
    const src = file.type === 'external' ? file.external.url : file.file.url;
    return { type: 'file', name: file.name, url: src, caption: parseRichText(file.caption) };
  }
  if (block.type === 'divider') return { type: 'divider' };
  return null;
};

const fetchPageImages = async (pageId) => {
  const blocks = await fetchAllChildren(pageId);
  const images = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.type !== 'image') continue;
    const type = block.image.type;
    const url = block.image[type].url;
    const caption = block.image.caption?.length > 0 ? block.image.caption.map((t) => t.plain_text).join('') : '';
    images.push({
      url: await downloadAsset(url, `page-${pageId}-image-${index}`),
      caption
    });
  }

  return images;
};

const buildProfile = async () => {
  const profileRes = await notion.databases.query({ database_id: process.env.NOTION_PROFILE_DB_ID, page_size: 1 });
  if (profileRes.results.length === 0) return null;

  const page = profileRes.results[0];
  const p = page.properties;
  const actualKeys = Object.keys(p);
  const platformMapping = {
    '小红书': 'XIAOHONGSHU', xiaohongshu: 'XIAOHONGSHU',
    '即刻': 'JIKE', jike: 'JIKE',
    '哔哩哔哩': 'BILIBILI', bilibili: 'BILIBILI',
    '小宇宙': 'XIAOYUZHOU', cosmos: 'XIAOYUZHOU',
    '公众号': 'WECHAT', '微信': 'WECHAT',
    instagram: 'INSTAGRAM', twitter: 'TWITTER', x: 'TWITTER',
    weibo: 'WEIBO', '微博': 'WEIBO',
    github: 'GITHUB', email: 'EMAIL', '邮箱': 'EMAIL',
    linkedin: 'LINKEDIN', youtube: 'YOUTUBE'
  };
  const socials = [];

  for (const [columnName, platformCode] of Object.entries(platformMapping)) {
    const matchedKey = actualKeys.find((k) => k.trim() === columnName);
    if (!matchedKey) continue;
    const url = getPropValue(p[matchedKey]);
    if (url) socials.push({ platform: platformCode, url, handle: matchedKey });
  }

  return {
    name: getPropValue(p.Name || p.Title) || 'Untitled',
    role: getPropValue(p.Role),
    bio: getPropValue(p.Bio),
    location: getPropValue(p.Location),
    avatarUrl: await downloadAsset(getImageUrl(page, 'Avatar', false), 'profile-avatar'),
    logoUrl: await downloadAsset(getImageUrl(page, 'Logo', false), 'profile-logo'),
    tags: getPropValue(p.Tags) || [],
    navLinks: parseNavLinks(getPropValue(p['导航 1'] || p.Nav || p.Navigation || p.NavLinks || p['导航'])),
    socials
  };
};

const syncDetails = async (items) => {
  for (const item of items) {
    const blocks = await transformBlocks(await fetchAllChildren(item.id));
    const images = await fetchPageImages(item.id);
    await writeJson(path.join(pagesDir, `${item.id}.json`), { content: blocks, updatedAt: new Date().toISOString() });
    await writeJson(path.join(pageImagesDir, `${item.id}.json`), { images, updatedAt: new Date().toISOString() });
    console.log(`[sync-notion-static] Synced detail ${item.id}`);
  }
};

const main = async () => {
  await ensureDirs();

  const [profile, gallery, thoughts, posts] = await Promise.all([
    buildProfile(),
    queryDatabase(process.env.NOTION_GALLERY_DB_ID, async (page) => ({
      id: page.id,
      title: getPropValue(page.properties.Title || page.properties.Name),
      location: getPropValue(page.properties.Location),
      count: page.properties.Count?.number || 0,
      date: page.properties.Date?.date?.start || '',
      ticketNumber: getPropValue(page.properties.TicketNumber),
      description: getPropValue(page.properties.Description),
      coverUrl: await downloadAsset(getImageUrl(page, 'Cover', false), `gallery-${page.id}-cover`),
      featured: page.properties.Featured?.checkbox || false
    })),
    queryDatabase(process.env.NOTION_THOUGHTS_DB_ID, async (page) => ({
      id: page.id,
      content: getPropValue(page.properties.Content || page.properties.Name),
      date: page.properties.Date?.date?.start || new Date(page.created_time).toISOString().split('T')[0],
      tags: page.properties.Tags?.multi_select?.map((t) => t.name) || [],
      featured: page.properties.Featured?.checkbox || false
    })),
    queryDatabase(process.env.NOTION_BLOG_DB_ID, async (page) => ({
      id: page.id,
      title: getPropValue(page.properties.Title || page.properties.Name),
      excerpt: getPropValue(page.properties.Excerpt),
      date: page.properties.Date?.date?.start || '',
      lastEditedTime: page.last_edited_time || '',
      readTime: page.properties.ReadTime?.select?.name || '5 MIN',
      category: page.properties.Category?.select?.name || 'Blog',
      imageUrl: await downloadAsset(getImageUrl(page, 'Cover', true), `blog-${page.id}-cover`),
      featured: page.properties.Featured?.checkbox || false
    }))
  ]);

  const aboutCandidates = posts.filter((p) =>
    p.category.toLowerCase().includes('about') ||
    p.title.includes('关于') ||
    p.title.toLowerCase().includes('about') ||
    p.title.includes('说明书')
  );
  const about = aboutCandidates.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return (b.lastEditedTime || '').localeCompare(a.lastEditedTime || '');
  })[0];

  await writeJson(path.join(dataDir, 'portfolio.json'), {
    profile,
    gallery,
    thoughts,
    posts,
    about,
    updatedAt: new Date().toISOString()
  });
  await writeJson(path.join(dataDir, 'build.json'), {
    version: buildVersion,
    updatedAt: buildVersion
  });

  await syncDetails([...gallery, ...posts]);
  console.log(`[sync-notion-static] Complete. Assets: ${assetCache.size}`);
};

main().catch((error) => {
  console.error('[sync-notion-static] Failed:', error);
  process.exit(1);
});
