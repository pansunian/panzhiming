import React, { useEffect, useState } from 'react';
import { Link, useParams, Navigate, useLocation } from 'react-router-dom';
import { BlogPost, NavLink, PhotoGroup } from '../types';
import { TicketBase, DashedLine, Notch, BarcodeVertical } from './TicketUI';
import { InlineTicketNav } from './NavBar';
import { Clock, Camera, Loader2, Bookmark as BookmarkIcon, ChevronRight, Github, ExternalLink, FileText } from 'lucide-react';
import { optimizeImage } from '../utils/imageOptimizer';
import { getBlogPath } from '../utils/routes';
import { mockNotionBlocks, mockPageImages } from '../data/mockData';

interface DetailViewProps {
  items: (BlogPost | PhotoGroup)[];
  type: 'blog' | 'gallery';
  logoUrl?: string;
  forceId?: string;
  forceFresh?: boolean;
  navLinks?: NavLink[];
  allPosts?: BlogPost[];
}

interface GalleryImage {
    url: string;
    caption: string;
}

const fetchStaticVersion = async () => {
    try {
        const res = await fetch(`/data/build.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return '';
        const data = await res.json();
        return data.version || data.updatedAt || '';
    } catch {
        return '';
    }
};

// Notion 颜色映射
const COLOR_MAP: Record<string, string> = {
    'gray': 'text-stone-400',
    'brown': 'text-[#976d47]',
    'orange': 'text-[#df730c]',
    'yellow': 'text-[#dfab01]',
    'green': 'text-[#0f7b6c]',
    'blue': 'text-[#0b6e99]',
    'purple': 'text-[#6940a5]',
    'pink': 'text-[#ad1a72]',
    'red': 'text-[#e03e3e]',
    'gray_background': 'bg-stone-100 px-1 rounded-sm',
    'brown_background': 'bg-[#f4eeee] px-1 rounded-sm',
    'orange_background': 'bg-[#fbe4cf] px-1 rounded-sm',
    'yellow_background': 'bg-[#fbf3db] px-1 rounded-sm',
    'green_background': 'bg-[#ddedea] px-1 rounded-sm',
    'blue_background': 'bg-[#ddebf1] px-1 rounded-sm',
    'purple_background': 'bg-[#eae4f2] px-1 rounded-sm',
    'pink_background': 'bg-[#f4dfeb] px-1 rounded-sm',
    'red_background': 'bg-[#fbe4e4] px-1 rounded-sm',
};

const getInlineLinkLabel = (value: string) => {
    try {
        const parsed = new URL(value);
        const path = parsed.pathname.replace(/^\/|\/$/g, '');
        if (parsed.hostname.includes('github.com') && path) return path;
        return parsed.hostname.replace(/^www\./, '');
    } catch {
        return value;
    }
};

const isGithubUrl = (value: string) => {
    try {
        return new URL(value).hostname.includes('github.com');
    } catch {
        return false;
    }
};

const getGithubMentionLabel = (text: string, url: string) => {
    if (text && !text.includes('github.com')) return text.replace(/^@/, '');
    try {
        const segments = new URL(url).pathname.split('/').filter(Boolean);
        return segments[1] || segments[0] || 'GitHub';
    } catch {
        return text || 'GitHub';
    }
};

// 富文本渲染组件
const RichText: React.FC<{ content: any[] }> = ({ content }) => {
    if (!content) return null;
    return (
        <>
            {content.map((part, i) => {
                const { annotations, text, href, type, mention } = part;
                let className = "";
                if (annotations.bold) className += " font-bold";
                if (annotations.italic) className += " italic";
                if (annotations.underline) className += " underline";
                if (annotations.strikethrough) className += " line-through";
                if (annotations.code) className += " font-mono bg-stone-100 text-[#e03e3e] px-1.5 py-0.5 rounded text-[0.9em]";
                if (annotations.color && COLOR_MAP[annotations.color]) className += ` ${COLOR_MAP[annotations.color]}`;

                const isMention = type === 'mention';
                const mentionHref = mention?.url || href;
                const isGithubMention = isMention && mentionHref && isGithubUrl(mentionHref);

                const element = isGithubMention ? (
                    <a key={i} href={mentionHref} target="_blank" rel="noopener noreferrer" className={`${className} inline-flex items-baseline gap-1 align-baseline text-ink underline decoration-ink/40 decoration-1 underline-offset-4 transition-colors hover:text-ink/70 hover:decoration-ink/55`}>
                        <Github size={18} className="relative top-[3px] shrink-0 fill-current stroke-current" />
                        <span>{getGithubMentionLabel(text, mentionHref)}</span>
                    </a>
                ) : isMention && mentionHref ? (
                    <a key={i} href={mentionHref} target="_blank" rel="noopener noreferrer" className={`${className} mx-0.5 inline-flex max-w-full items-center gap-1 rounded-sm border border-stone-300/60 bg-stone-100/60 px-1 py-[1px] align-baseline font-mono text-[0.78em] leading-none text-ink/80 no-underline transition-colors hover:bg-stone-100`}>
                        <span className="truncate">{getInlineLinkLabel(text || mentionHref)}</span>
                        <ExternalLink size={9} className="shrink-0 opacity-55" />
                    </a>
                ) : href ? (
                    <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={`${className} text-ink/90 hover:text-ink transition-colors underline decoration-ink/35 decoration-1 underline-offset-4`}>
                        {text}
                    </a>
                ) : (
                    <span key={i} className={className}>{text}</span>
                );
                return element;
            })}
        </>
    );
};

// 品牌 Logo 组件，带加载失败回退
const BrandLogo: React.FC<{ src: string, alt: string, hClass: string, fallback: string }> = ({ src, alt, hClass, fallback }) => {
    const [hasError, setHasError] = useState(false);
    if (hasError) return <span className="font-sans font-bold italic text-[10px] text-ink">{fallback}</span>;
    return (
        <img 
            src={src} 
            className={`${hClass} w-auto opacity-90 brightness-0 inline-block align-middle select-none`} 
            alt={alt} 
            onError={() => setHasError(true)}
        />
    );
};

const BrandLabel: React.FC<{ deviceString: string }> = ({ deviceString }) => {
    const s = deviceString.toLowerCase();
    
    // Apple Logo: 22px
    if (s.includes('apple') || s.includes('iphone')) {
        return <BrandLogo src="/fonts/apple.svg" alt="Apple" hClass="h-[22px]" fallback="Apple" />;
    }
    // Sony Logo: 横版，保持 8px
    if (s.includes('sony')) {
        return <BrandLogo src="/fonts/logo-sony.svg" alt="Sony" hClass="h-[8px]" fallback="SONY" />;
    }

    // 其他品牌文字回退样式
    if (s.includes('canon')) return <span className="font-sans font-normal italic text-[10px] text-ink">Canon</span>;
    if (s.includes('nikon')) return <span className="font-sans font-normal italic tracking-tighter uppercase text-[11px] text-ink">NIKON</span>;
    if (s.includes('fuji')) return <span className="font-sans font-normal uppercase tracking-widest text-[9px] text-ink">FUJIFILM</span>;
    if (s.includes('leica')) return <span className="font-serif font-bold italic text-[11px] text-ink">Leica</span>;
    
    return <span className="font-mono font-normal uppercase text-[9px] opacity-40">{deviceString.split(' ')[0] || 'SCAN'}</span>;
};

const parseCaptionData = (caption: string) => {
    if (!caption) return { device: '', date: '', locationMain: '', locationSub: '' };
    const parts = caption.split(/\||｜/).map(s => s.trim()).filter(Boolean);
    let device = '', date = '', others = [];
    const deviceKeywords = ['SONY', 'Sony', 'Canon', 'Nikon', 'Fuji', 'Leica', 'Apple', 'iPhone'];
    const dateRegex = /(\d{4}.*\d{1,2}.*\d{1,2})/;
    parts.forEach(part => {
        if (!device && deviceKeywords.some(k => part.toLowerCase().includes(k.toLowerCase()))) device = part;
        else if (!date && dateRegex.test(part)) date = part;
        else others.push(part);
    });
    return { device, date, locationMain: others[0] || '', locationSub: others.slice(1).join(' · ') };
};

const getUrlLabel = (url: string) => {
    try {
        const parsed = new URL(url);
        const path = parsed.pathname.replace(/^\/|\/$/g, '');
        if (parsed.hostname.includes('github.com') && path) return path;
        return parsed.hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
};

const LinkPreviewCard: React.FC<{ url: string; caption?: any[]; variant?: 'bookmark' | 'embed' | 'link_preview' | 'file'; title?: string }> = ({ url, caption, variant = 'bookmark', title }) => {
    const isGithub = url?.includes('github.com');
    const Icon = variant === 'file' ? FileText : isGithub ? Github : BookmarkIcon;
    const label = title || getUrlLabel(url);
    const typeLabel = variant === 'embed' ? 'Embedded Link' : variant === 'link_preview' ? 'Link Preview' : variant === 'file' ? 'File Attachment' : 'External Link';

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block border border-stone-200/80 rounded-md px-3 py-2.5 my-5 hover:bg-stone-50/70 transition-colors group overflow-hidden first:mt-0">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-stone-100/80 rounded flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-stone-500" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-sans font-medium text-[13px] leading-tight truncate text-ink">{label}</p>
                    <p className="font-mono text-[8px] text-stone-400 truncate mt-0.5 uppercase tracking-wider">{typeLabel}</p>
                    {caption && caption.length > 0 && (
                        <p className="font-sans text-[11px] leading-snug text-stone-500 mt-1 line-clamp-1"><RichText content={caption} /></p>
                    )}
                </div>
                <ExternalLink size={12} className="text-stone-300 shrink-0 group-hover:text-stone-500 transition-colors" />
            </div>
        </a>
    );
};

const getNotionCalloutBg = (color?: string) => {
    const backgrounds: Record<string, string> = {
        gray_background: 'bg-[#f1f1ef]',
        brown_background: 'bg-[#f4eeee]',
        orange_background: 'bg-[#faebdd]',
        yellow_background: 'bg-[#fbf3db]',
        green_background: 'bg-[#edf3ec]',
        blue_background: 'bg-[#e7f3f8]',
        purple_background: 'bg-[#f6f3f8]',
        pink_background: 'bg-[#f9f2f5]',
        red_background: 'bg-[#faecec]',
    };

    return backgrounds[color || ''] || 'bg-[#f7f6f3]';
};

const isAboutLikePost = (post?: BlogPost) => {
    const category = post?.category?.toLowerCase() || '';
    const title = post?.title || '';
    return category.includes('about') || title.includes('关于') || title.toLowerCase().includes('about') || title.includes('说明书');
};

const getRelatedPosts = (current: BlogPost | undefined, allPosts: BlogPost[] = [], limit = 3) => {
    if (!current) return [];

    const currentTags = new Set((current.tags || []).map((tag) => tag.toLowerCase()));
    const postMap = new Map(allPosts.map((post) => [post.id, post]));
    const selected = new Map<string, BlogPost>();

    for (const id of current.relatedPostIds || []) {
        const post = postMap.get(id);
        if (post && post.id !== current.id) selected.set(post.id, post);
    }

    if (isAboutLikePost(current)) return Array.from(selected.values()).slice(0, limit);

    const candidates = allPosts
        .filter((post) => post.id !== current.id && !selected.has(post.id) && !isAboutLikePost(post))
        .map((post) => {
            const sharedTags = (post.tags || []).filter((tag) => currentTags.has(tag.toLowerCase())).length;
            const sameCategory = post.category && current.category && post.category === current.category;
            const score = (sameCategory ? 4 : 0) + sharedTags * 3 + (post.featured ? 1 : 0);
            return { post, score };
        })
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return (b.post.lastEditedTime || b.post.date || '').localeCompare(a.post.lastEditedTime || a.post.date || '');
        });

    for (const candidate of candidates) {
        selected.set(candidate.post.id, candidate.post);
        if (selected.size >= limit) break;
    }

    return Array.from(selected.values()).slice(0, limit);
};

const RelatedPosts: React.FC<{ posts: BlogPost[] }> = ({ posts }) => {
    if (!posts.length) return null;

    return (
        <div className="mt-12 border-t border-dashed border-stone-300/60 pt-7">
            <div className="mb-5 flex items-end justify-between">
                <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-stone-400">Related Archive</p>
                    <h2 className="mt-1 font-serif text-lg font-medium leading-tight text-ink">相关档案</h2>
                </div>
                <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-stone-300">NO. NEXT</span>
            </div>
            <div className="flex flex-col gap-3">
                {posts.map((post, index) => {
                    const coverSrc = post.imageUrl ? optimizeImage(post.imageUrl, 360) : '';
                    return (
                        <Link key={post.id} to={getBlogPath(post)} className="group flex min-h-[86px] overflow-hidden border border-stone-200/80 bg-paper-dark transition-colors hover:bg-[#f2eee5]">
                            <div className="w-[88px] shrink-0 bg-stone-100">
                                {coverSrc ? (
                                    <img src={coverSrc} alt={post.title} loading="lazy" decoding="async" className="h-full w-full object-cover sepia-[0.08] transition-transform duration-300 group-hover:scale-105" />
                                ) : (
                                    <div className="flex h-full items-center justify-center font-mono text-[8px] uppercase tracking-widest text-stone-300">Archive</div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1 px-3 py-2.5">
                                <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[8px] uppercase tracking-widest text-stone-400">
                                    <span className="truncate">#{post.category || 'Blog'}</span>
                                    <span className="shrink-0">0{index + 1}</span>
                                </div>
                                <h3 className="line-clamp-2 font-serif text-[15px] font-medium leading-snug text-ink transition-colors group-hover:text-brand-accent">{post.title}</h3>
                                {post.excerpt && <p className="mt-1 line-clamp-1 font-sans text-[11px] leading-snug text-stone-500">{post.excerpt}</p>}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

const GalleryItem: React.FC<{ img: GalleryImage }> = ({ img }) => {
    const [aspectClass, setAspectClass] = useState("aspect-[3/2]");
    const [isLoaded, setIsLoaded] = useState(false);
    const parsed = parseCaptionData(img.caption);
    
    // 相册大图优化到 1200px 宽，兼顾质量和速度
    const optimizedSrc = optimizeImage(img.url, 1200);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setAspectClass(naturalHeight > naturalWidth ? "aspect-[4/5]" : "aspect-[3/2]");
        setIsLoaded(true);
    };

    return (
        <div className="w-full bg-white mb-10 last:mb-0">
             <div className={`w-full relative overflow-hidden ${aspectClass} rounded-sm`}>
                <img src={optimizedSrc} alt={parsed.locationMain} className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={handleImageLoad} />
             </div>
             
             {/* 影像元数据样式 */}
             <div className="flex justify-between items-start mt-4 px-1 pb-2 mx-[3px]">
                  <div className="flex flex-col">
                      <span className="font-sans font-normal text-[10px] text-ink uppercase tracking-tight leading-none">{parsed.device || 'Digital Camera'}</span>
                      <span className="font-sans text-[9px] text-stone-400 mt-1">{parsed.date || 'Unknown Date'}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                      <div className="flex items-center h-4">
                          <BrandLabel deviceString={parsed.device || 'Digital'} />
                      </div>
                      <div className="w-[1px] h-6 bg-stone-200"></div>
                      <div className="flex flex-col text-left"> 
                          <span className="font-sans font-normal text-[10px] text-ink leading-none">{parsed.locationMain || 'Untitled'}</span>
                          <span className="font-sans text-[9px] text-stone-400 mt-1 uppercase tracking-wide">
                              {parsed.locationSub || 'Global Location'}
                          </span>
                      </div>
                  </div>
             </div>
        </div>
    );
};

// 块渲染引擎
const NotionBlock: React.FC<{ block: any, isGallery: boolean }> = ({ block, isGallery }) => {
    // 影像辑模式下隐藏所有图片块和空段落块
    if (isGallery && (block.type === 'image' || (block.type === 'paragraph' && !block.content?.length))) return null;

    switch (block.type) {
        case 'paragraph':
            return <p className="mb-[0.9em] leading-[1.78] text-ink/90 font-sans text-[17px] md:text-[16px] text-justify min-h-[1em] first:mt-0"><RichText content={block.content} /></p>;
        case 'heading_1':
            return <h2 className="font-serif font-medium text-xl mt-10 mb-6 border-b border-stone-100 pb-2 first:mt-0"><RichText content={block.content} /></h2>;
        case 'heading_2':
            return <h3 className="font-serif font-medium text-lg mt-8 mb-4 first:mt-0"><RichText content={block.content} /></h3>;
        case 'heading_3':
            return <h4 className="font-serif font-medium text-base mt-6 mb-3 first:mt-0"><RichText content={block.content} /></h4>;
        case 'heading_4':
            return <h5 className="font-serif font-medium text-sm mt-5 mb-2 first:mt-0"><RichText content={block.content} /></h5>;
        case 'quote':
            return <blockquote className="whitespace-pre-line border-l-[3px] border-stone-300 pl-3 py-[1px] my-3 font-sans text-[17px] md:text-[16px] leading-[1.78] text-ink/90 first:mt-0"><RichText content={block.content} /></blockquote>;
        case 'callout':
            return (
                <div className={`w-full ${getNotionCalloutBg(block.color)} px-4 py-3 rounded-[3px] my-3 flex gap-3 items-start first:mt-0`}>
                    {block.icon && <span className="w-6 shrink-0 text-[18px] leading-[1.78]">{block.icon.emoji || '💡'}</span>}
                    <div className="min-w-0 flex-1 font-sans text-[17px] md:text-[16px] leading-[1.78] text-ink/90">
                        {block.content?.length > 0 && (
                            <div className="whitespace-pre-line"><RichText content={block.content} /></div>
                        )}
                        {block.children?.length > 0 && (
                            <div className={`mt-1.5 ${block.content?.length ? 'pt-1' : ''} [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_blockquote]:my-1.5 [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h4]:mt-2 [&_h4]:mb-1 [&_.notion-callout-child]:my-1.5`}>
                                {block.children.map((child: any, idx: number) => (
                                    <NotionBlock key={idx} block={child} isGallery={isGallery} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        case 'list_item':
            const bullet = block.listType === 'ol' ? 'counter' : '•';
            return (
                <div className="flex gap-3 mb-2 pl-2 font-sans text-[17px] md:text-[16px] leading-[1.78] first:mt-0">
                    <span className="text-stone-300 shrink-0 font-mono text-sm">{bullet === 'counter' ? '' : bullet}</span>
                    <div className="text-ink/90"><RichText content={block.content} /></div>
                </div>
            );
        case 'toggle':
            return (
                <details className="group mb-4 bg-stone-50/30 rounded-md border border-stone-100/50 first:mt-0">
                    <summary className="cursor-pointer list-none p-4 flex items-center gap-3 font-sans font-bold text-sm text-ink/80 hover:bg-stone-50/50 transition-colors">
                        <ChevronRight size={14} className="text-stone-300 transition-transform group-open:rotate-90" />
                        <RichText content={block.content} />
                    </summary>
                    {block.hasChildren && <div className="px-11 pb-4 pt-1 opacity-80"><p className="text-xs font-mono text-stone-300 italic">Content inside Notion Toggle...</p></div>}
                </details>
            );
        case 'bookmark':
            return <LinkPreviewCard url={block.url} caption={block.caption} variant="bookmark" />;
        case 'embed':
            return <LinkPreviewCard url={block.url} caption={block.caption} variant="embed" />;
        case 'link_preview':
            return <LinkPreviewCard url={block.url} variant="link_preview" />;
        case 'file':
            return <LinkPreviewCard url={block.url} caption={block.caption} variant="file" title={block.name} />;
        case 'code':
            return (
                <div className="my-8 overflow-hidden rounded-lg border border-stone-200 bg-[#f7f4ed] first:mt-0">
                    <div className="flex items-center justify-between border-b border-stone-200/70 px-4 py-2">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">{block.language || 'code'}</span>
                    </div>
                    <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-ink/80"><code>{block.content?.map((part: any) => part.text).join('')}</code></pre>
                    {block.caption && block.caption.length > 0 && (
                        <p className="border-t border-stone-200/70 px-4 py-2 font-sans text-[10px] text-stone-400"><RichText content={block.caption} /></p>
                    )}
                </div>
            );
        case 'divider':
            return <DashedLine className="my-4 border-stone-400/70 first:mt-0" />;
        case 'image':
            // 博客内嵌图片优化
            const optimizedContentImg = optimizeImage(block.src, 960);
            return (
                <div className="my-10 first:mt-0">
                    <div className="rounded-sm overflow-hidden bg-stone-100">
                        <img src={optimizedContentImg} className="w-full h-auto" alt="Embedded" />
                    </div>
                    {block.caption && <p className="text-center mt-3 font-sans text-[10px] text-stone-400 tracking-wide uppercase"><RichText content={block.caption} /></p>}
                </div>
            );
        default:
            return null;
    }
};

export const DetailView: React.FC<DetailViewProps> = ({ items, type, logoUrl, forceId, forceFresh, navLinks, allPosts }) => {
  const { id } = useParams();
  const location = useLocation();
  const currentId = forceId || id;
  const routeKey = currentId ? decodeURIComponent(currentId) : currentId;
  const safeItems = Array.isArray(items) ? items : [];
  const item = safeItems.find(i => i.id === routeKey || i.slug === routeKey);
  const pageId = item?.id || routeKey;
  const [contentImages, setContentImages] = useState<GalleryImage[]>([]);
  const [blogBlocks, setBlogBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setBlogBlocks([]);
    setContentImages([]);
    setIsDataFetched(false);

    if (pageId) {
        setLoading(true);
        
        // 检查是否是演示数据 ID
        if (pageId.startsWith('demo-')) {
            // 模拟加载延迟，让体验更真实
            setTimeout(() => {
                setBlogBlocks(mockNotionBlocks);
                setContentImages(mockPageImages);
                setLoading(false);
                setIsDataFetched(true);
            }, 800);
            return;
        }

        const fetchData = async () => {
            try {
                const searchParams = new URLSearchParams(location.search);
                const forceRefresh = forceFresh || searchParams.get('fresh') === '1' || searchParams.get('refresh') === '1';
                const refreshQuery = forceRefresh ? '&fresh=1' : '';
                const staticVersion = forceRefresh ? '' : await fetchStaticVersion();
                const versionQuery = staticVersion ? `?v=${encodeURIComponent(staticVersion)}` : `?t=${Date.now()}`;
                const imgUrl = forceRefresh ? `/api/page-images?pageId=${pageId}${refreshQuery}` : `/data/page-images/${pageId}.json${versionQuery}`;
                const contentUrl = forceRefresh ? `/api/get-page-content?pageId=${pageId}${refreshQuery}` : `/data/pages/${pageId}.json${versionQuery}`;
                let [imgRes, contentRes] = await Promise.all([
                    fetch(imgUrl, { cache: forceRefresh ? 'no-store' : 'default' }),
                    fetch(contentUrl, { cache: forceRefresh ? 'no-store' : 'default' })
                ]);

                if ((!imgRes.ok || !contentRes.ok) && !forceRefresh) {
                    [imgRes, contentRes] = await Promise.all([
                        fetch(`/api/page-images?pageId=${pageId}`),
                        fetch(`/api/get-page-content?pageId=${pageId}`)
                    ]);
                }
                
                // 如果 API 失败（比如 500），也不要留白，加载演示内容作为托底
                if (!imgRes.ok && !contentRes.ok) {
                    setBlogBlocks(mockNotionBlocks);
                    setContentImages(mockPageImages);
                } else {
                    if (imgRes.ok) { const d = await imgRes.json(); setContentImages(d.images); }
                    if (contentRes.ok) { const d = await contentRes.json(); setBlogBlocks(d.content); }
                }

            } catch (e) {
                 // 网络错误也加载演示内容
                 setBlogBlocks(mockNotionBlocks);
                 setContentImages(mockPageImages);
            } finally { 
                setLoading(false); 
                setIsDataFetched(true); 
            }
        };
        fetchData();
    }
  }, [pageId, location.search]);

  if (!pageId && isDataFetched) return <Navigate to="/" replace />;

  const isBlog = type === 'blog';
  const blogPost = item as BlogPost;
  const photoGroup = item as PhotoGroup;
  const relatedPosts = isBlog ? getRelatedPosts(blogPost, allPosts || safeItems as BlogPost[]) : [];
  
  // 详情页顶部封面图优化
  const displayImageRaw = isBlog ? blogPost?.imageUrl : photoGroup?.coverUrl;
  const displayImage = optimizeImage(displayImageRaw, 1200);

  return (
    <div className="min-h-screen w-full flex flex-col bg-texture overflow-x-hidden">
      <div className="w-full max-w-[420px] mx-auto pb-24 pt-6 sm:pt-10">
            <div className="px-2 sm:px-4">
                <div className="h-4 w-full jagged-top bg-paper"></div>
                <TicketBase className="rounded-none bg-paper min-h-[80vh]">
                    <div className="px-6 sm:px-8 pt-6 pb-6 relative">
                        <InlineTicketNav logoUrl={logoUrl} navLinks={navLinks} className="mb-8 border-b border-dashed border-stone-300/70 pb-4" />
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex flex-col">
                                <span className="font-mono text-[9px] text-stone-400 uppercase tracking-[0.2em]">{isBlog ? (blogPost?.category || 'Blog') : 'GALLERY'}</span>
                                <div className="h-[1.5px] w-6 bg-stone-100 mt-1"></div>
                            </div>
                            <div className="border border-stone-200 rounded-sm px-2 py-0.5 flex items-center gap-1.5 opacity-60">
                                {isBlog ? <Clock size={10} className="text-stone-400" /> : <Camera size={10} className="text-stone-400" />}
                                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink">{isBlog ? blogPost?.readTime : `${photoGroup?.count} SHOTS`}</span>
                            </div>
                        </div>
                        <h1 className="font-serif font-medium text-2xl md:text-xl text-ink leading-snug mb-2 pr-4">{item?.title || (loading ? 'Loading...' : 'Untitled')}</h1>
                        <div className="flex items-center gap-3 mb-8 text-[9px] font-mono text-stone-400 uppercase tracking-widest">
                            <span>{item?.date || (loading ? 'Retrieving' : 'Unknown Date')}</span>
                            {!isBlog && photoGroup?.location && (
                                <><span className="opacity-30">/</span><span>{photoGroup.location}</span></>
                            )}
                        </div>
                        <DashedLine className="opacity-10" />
                    </div>

                    {displayImage && (
                        <div className="relative w-full aspect-[16/9] bg-stone-100 overflow-visible">
                            <Notch className="-left-4 top-0 -translate-y-1/2" />
                            <Notch className="-right-4 top-0 -translate-y-1/2" />
                            <img src={displayImage} className="w-full h-full object-cover" alt="Cover" />
                            <Notch className="-left-4 bottom-0 translate-y-1/2" />
                            <Notch className="-right-4 bottom-0 translate-y-1/2" />
                        </div>
                    )}

                    <div className="px-6 sm:px-8 pb-8 pt-10 sm:pt-12">
                        {loading ? (
                            <div className="flex flex-col items-center py-20 text-stone-300 font-mono text-[10px] tracking-widest"><Loader2 className="animate-spin mb-3" size={16} />LOADING CONTENT...</div>
                        ) : (
                            <div className="[&>*:first-child]:mt-0">
                                {blogBlocks.map((block, idx) => <NotionBlock key={idx} block={block} isGallery={!isBlog} />)}
                                {!isBlog && contentImages.map((img, idx) => <GalleryItem key={idx} img={img} />)}
                                {isBlog && <RelatedPosts posts={relatedPosts} />}
                            </div>
                        )}
                    </div>

                    <div className="bg-paper-dark p-6 sm:p-8 border-t border-dashed border-stone-300/50 mt-12 relative">
                        <Notch className="-left-4 top-0 -translate-y-1/2" />
                        <Notch className="-right-4 top-0 -translate-y-1/2" />
                        <div className="flex justify-between items-center opacity-30">
                            <div className="w-8 h-10 overflow-hidden shrink-0"><BarcodeVertical /></div>
                            <div className="flex flex-col gap-1 text-center px-4">
                                <span className="font-serif text-[10px] font-bold tracking-[0.3em] whitespace-nowrap">先见志明</span>
                                <span className="font-mono text-[7px] tracking-[0.4em] uppercase whitespace-nowrap">PANZHIMING.COM</span>
                            </div>
                            <div className="w-8 h-10 overflow-hidden shrink-0"><BarcodeVertical /></div>
                        </div>
                    </div>
                </TicketBase>
                <div className="h-4 w-full jagged-bottom bg-paper-dark"></div>
            </div>
      </div>
    </div>
  );
};
