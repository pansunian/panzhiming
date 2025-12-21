import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { BlogPost, PhotoGroup } from '../types';
import { TicketBase, DashedLine, Notch, BarcodeVertical } from './TicketUI';
import { NavBar } from './NavBar';
import { Clock, Camera, Loader2, Bookmark as BookmarkIcon, ChevronRight } from 'lucide-react';

interface DetailViewProps {
  items: (BlogPost | PhotoGroup)[];
  type: 'blog' | 'gallery';
  logoUrl?: string;
  forceId?: string;
}

interface GalleryImage {
    url: string;
    caption: string;
}

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

// 富文本渲染组件
const RichText: React.FC<{ content: any[] }> = ({ content }) => {
    if (!content) return null;
    return (
        <>
            {content.map((part, i) => {
                const { annotations, text, href } = part;
                let className = "";
                if (annotations.bold) className += " font-bold";
                if (annotations.italic) className += " italic";
                if (annotations.underline) className += " underline";
                if (annotations.strikethrough) className += " line-through";
                if (annotations.code) className += " font-mono bg-stone-100 text-[#e03e3e] px-1.5 py-0.5 rounded text-[0.9em]";
                if (annotations.color && COLOR_MAP[annotations.color]) className += ` ${COLOR_MAP[annotations.color]}`;

                const element = href ? (
                    <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={`${className} text-brand-accent hover:text-brand-accent/80 transition-colors underline decoration-brand-accent/30 decoration-1 underline-offset-4`}>
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

const GalleryItem: React.FC<{ img: GalleryImage }> = ({ img }) => {
    const [aspectClass, setAspectClass] = useState("aspect-[3/2]");
    const [isLoaded, setIsLoaded] = useState(false);
    const parsed = parseCaptionData(img.caption);
    
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setAspectClass(naturalHeight > naturalWidth ? "aspect-[4/5]" : "aspect-[3/2]");
        setIsLoaded(true);
    };

    return (
        <div className="w-full bg-white mb-10 last:mb-0">
             <div className={`w-full relative overflow-hidden ${aspectClass} rounded-sm`}>
                <img src={img.url} alt={parsed.locationMain} className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={handleImageLoad} />
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
            return <p className="mb-[1.2em] leading-loose text-ink/90 font-sans text-[15px] text-justify min-h-[1em] first:mt-0"><RichText content={block.content} /></p>;
        case 'heading_1':
            return <h2 className="font-serif font-bold text-xl mt-10 mb-6 border-b border-stone-100 pb-2 first:mt-0"><RichText content={block.content} /></h2>;
        case 'heading_2':
            return <h3 className="font-serif font-bold text-lg mt-8 mb-4 first:mt-0"><RichText content={block.content} /></h3>;
        case 'heading_3':
            return <h4 className="font-serif font-bold text-base mt-6 mb-3 first:mt-0"><RichText content={block.content} /></h4>;
        case 'quote':
            return <blockquote className="border-l-4 border-stone-200 pl-6 my-8 italic text-stone-500 font-sans text-[15px] leading-loose first:mt-0"><RichText content={block.content} /></blockquote>;
        case 'callout':
            return (
                <div className="bg-stone-50/80 border border-stone-100 p-5 rounded-lg my-8 flex gap-4 items-start shadow-sm first:mt-0">
                    {block.icon && <span className="text-xl shrink-0">{block.icon.emoji || '💡'}</span>}
                    <div className="font-sans text-sm leading-relaxed text-stone-600"><RichText content={block.content} /></div>
                </div>
            );
        case 'list_item':
            const bullet = block.listType === 'ol' ? 'counter' : '•';
            return (
                <div className="flex gap-3 mb-3 pl-2 font-sans text-[15px] leading-relaxed first:mt-0">
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
            return (
                <a href={block.url} target="_blank" rel="noopener noreferrer" className="block border border-stone-200 rounded-lg p-4 my-8 hover:bg-stone-50 transition-all group overflow-hidden first:mt-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-stone-100 rounded flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><BookmarkIcon size={18} className="text-stone-400" /></div>
                        <div className="min-w-0">
                            <p className="font-sans font-bold text-sm truncate text-ink">{block.url}</p>
                            <p className="font-sans text-[10px] text-stone-400 truncate mt-1">Visit External Link</p>
                        </div>
                    </div>
                </a>
            );
        case 'divider':
            return <DashedLine className="my-12 opacity-30 first:mt-0" />;
        case 'image':
            return (
                <div className="my-10 first:mt-0">
                    <div className="rounded-sm overflow-hidden bg-stone-100">
                        <img src={block.src} className="w-full h-auto" alt="Embedded" />
                    </div>
                    {block.caption && <p className="text-center mt-3 font-sans text-[10px] text-stone-400 tracking-wide uppercase"><RichText content={block.caption} /></p>}
                </div>
            );
        default:
            return null;
    }
};

export const DetailView: React.FC<DetailViewProps> = ({ items, type, logoUrl, forceId }) => {
  const { id } = useParams();
  const currentId = forceId || id;
  const item = items.find(i => i.id === currentId);
  const [contentImages, setContentImages] = useState<GalleryImage[]>([]);
  const [blogBlocks, setBlogBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (item?.id) {
        setLoading(true);
        const fetchData = async () => {
            try {
                const [imgRes, contentRes] = await Promise.all([
                    fetch(`/api/page-images?pageId=${item.id}`),
                    fetch(`/api/get-page-content?pageId=${item.id}`)
                ]);
                if (imgRes.ok) { const d = await imgRes.json(); setContentImages(d.images); }
                if (contentRes.ok) { const d = await contentRes.json(); setBlogBlocks(d.content); }
            } catch (e) {} finally { setLoading(false); setIsDataFetched(true); }
        };
        fetchData();
    }
  }, [item?.id]);

  if (!item && isDataFetched) return <Navigate to="/" replace />;

  const isBlog = type === 'blog';
  const blogPost = item as BlogPost;
  const photoGroup = item as PhotoGroup;
  const displayImage = isBlog ? blogPost?.imageUrl : photoGroup?.coverUrl;

  return (
    <div className="min-h-screen w-full flex flex-col bg-texture">
      <NavBar logoUrl={logoUrl} />
      <div className="w-full max-w-[420px] mx-auto pb-24 pt-12">
            <div className="px-4">
                <div className="h-4 w-full jagged-top bg-paper"></div>
                <TicketBase className="rounded-none bg-paper min-h-[80vh] border-x border-stone-200">
                    <div className="px-8 pt-8 pb-6 relative">
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
                        <h1 className="font-serif font-bold text-2xl text-ink leading-snug mb-2 pr-4">{item?.title || 'Loading...'}</h1>
                        <div className="flex items-center gap-3 mb-8 text-[9px] font-mono text-stone-400 uppercase tracking-widest">
                            <span>{item?.date || 'Unknown Date'}</span>
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

                    <div className="px-8 pb-8 pt-12">
                        {loading ? (
                            <div className="flex flex-col items-center py-20 text-stone-300 font-mono text-[10px] tracking-widest"><Loader2 className="animate-spin mb-3" size={16} />LOADING CONTENT...</div>
                        ) : (
                            <div className="[&>*:first-child]:mt-0">
                                {blogBlocks.map((block, idx) => <NotionBlock key={idx} block={block} isGallery={!isBlog} />)}
                                {!isBlog && contentImages.map((img, idx) => <GalleryItem key={idx} img={img} />)}
                            </div>
                        )}
                    </div>

                    <div className="bg-paper-dark p-8 border-t border-dashed border-stone-300/50 mt-12 relative">
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