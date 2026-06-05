import { NavLink } from '../types';

export const DEFAULT_NAV_LINKS: NavLink[] = [
  { id: 'home', path: '/', label: '首页', en: 'HOME' },
  { id: 'thoughts', path: '/thoughts', label: '灵感', en: 'NOTES' },
  { id: 'gallery', path: '/gallery', label: '摄影', en: 'GALLERY' },
  { id: 'blog', path: '/blog', label: '博客', en: 'BLOG' },
];

const pathAliases: Record<string, string> = {
  '': '/',
  '/': '/',
  '/home': '/',
  '/index': '/',
  '/photos': '/gallery',
  '/photo': '/gallery',
  '/gallery': '/gallery',
  '/idea': '/thoughts',
  '/ideas': '/thoughts',
  '/note': '/thoughts',
  '/notes': '/thoughts',
  '/thought': '/thoughts',
  '/thoughts': '/thoughts',
  '/article': '/blog',
  '/articles': '/blog',
  '/post': '/blog',
  '/posts': '/blog',
  '/blog': '/blog',
};

export const normalizeNavPath = (value: string) => {
  if (!value) return '/';

  try {
    const parsed = new URL(value, 'https://panzhiming.com');
    const isOwnSite = /(^|\.)panzhiming\.com$/.test(parsed.hostname);
    if (!isOwnSite && value.startsWith('http')) return value;
    const normalized = parsed.pathname.replace(/\/+$/, '') || '/';
    return pathAliases[normalized.toLowerCase()] || normalized;
  } catch {
    const normalized = value.startsWith('/') ? value : `/${value}`;
    return pathAliases[normalized.toLowerCase()] || normalized;
  }
};

const inferNavId = (path: string, label: string) => {
  if (path === '/') return 'home';
  if (path.startsWith('/gallery')) return 'gallery';
  if (path.startsWith('/thoughts')) return 'thoughts';
  if (path.startsWith('/blog')) return 'blog';
  return label.toLowerCase().replace(/\s+/g, '-');
};

const inferNavEn = (path: string) => {
  if (path === '/') return 'HOME';
  if (path.startsWith('/gallery')) return 'GALLERY';
  if (path.startsWith('/thoughts')) return 'NOTES';
  if (path.startsWith('/blog')) return 'BLOG';
  return '';
};

export const normalizeNavLinks = (links?: NavLink[]) => {
  if (!Array.isArray(links) || links.length === 0) return DEFAULT_NAV_LINKS;

  const normalized = links
    .map((link) => {
      const path = normalizeNavPath(link.path);
      const label = link.label?.trim();
      if (!label || !path) return null;
      return {
        id: link.id || inferNavId(path, label),
        path,
        label,
        en: link.en || inferNavEn(path),
      };
    })
    .filter(Boolean) as NavLink[];

  return normalized.length > 0 ? normalized : DEFAULT_NAV_LINKS;
};
