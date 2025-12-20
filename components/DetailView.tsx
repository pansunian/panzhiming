import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { BlogPost, PhotoGroup } from '../types';
import { TicketBase, DashedLine, Notch, BarcodeVertical } from './TicketUI';
import { NavBar } from './NavBar';
import { Clock, MapPin, Camera, Loader2, ExternalLink } from 'lucide-react';

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

// --- 极致还原：相机品牌 Logo 组件 ---
const BrandLogotype = ({ deviceString, className = "" }: { deviceString: string, className?: string }) => {
    const s = deviceString.toLowerCase();
    const baseClass = `leading-none select-none ${className}`;

    // 针对不同品牌展示特定的字体样式，模拟胶片相机的打印感
    if (s.includes('apple') || s.includes('iphone')) {
        return <span className={`${baseClass} font-[system-ui,sans-serif] font-bold tracking-tight text-[11px]`}> iPhone</span>;
    }
    if (s.includes('sony') || s.includes('ilce') || s.includes('alpha')) {
        return <span className={`${baseClass} font-serif font-bold tracking-[0.2em] text-[10px]`}>SONY</span>;
    }
    if (s.includes('canon')) return <span className={`${baseClass} font-serif font-bold tracking-wide text-[13px] italic`}>Canon</span>;
    if (s.includes('nikon')) return <span className={`${baseClass} font-[system-ui,sans-serif] font-black italic tracking-tighter uppercase text-[14px]`}>Nikon</span>;
    if (s.includes('fuji') || s.includes('x100') || s.includes('xt') || s.includes('gfx')) {
        return <span className={`${baseClass} font-[system-ui,sans-serif] font-bold uppercase tracking-widest text-[11px]`}>FUJIFILM</span>;
    }
    if (s.includes('leica')) return <span className={`${baseClass} font-serif font-bold text-red-600 text-[12px]`}>Leica</span>;
    
    const brand = deviceString.split(' ')[0];
    if (brand) return <span className={`${baseClass} font-mono font-bold uppercase text-[11px] opacity-60`}>{brand}</span>;
    return <Camera size={12} className="text-stone-300" />;
};

const parseCaptionData = (caption: string) => {
    if (!caption) return { device: '', date: '', locationMain: '', locationSub: '' };
    const parts = caption.split(/\||｜/).map(s => s.trim()).filter(Boolean);
    let device = '', date = '', others = [];
    const deviceKeywords = ['SONY', 'Sony', 'Canon', 'Nikon', 'Fuji', 'Fujifilm', 'Leica', 'Apple', 'iPhone', 'Panasonic', 'Lumix', 'Ricoh', 'GR', 'Hasselblad', 'Olympus', 'ILCE', 'DC-S5'];
    const dateRegex = /(\d{4}.*\d{1,2}.*\d{1,2}|\d{4}\s*年)/;
    
    parts.forEach(part => {
        if (!device && deviceKeywords.some(k => part.toLowerCase().includes(k.toLowerCase()))) device = part;
        else if (!date && dateRegex.test(part)) date = part;
        else others.push(part);
    });
    return { device, date, locationMain: others[0] || '', locationSub: others.slice(1).join(' · ') };
};

const GalleryItem: React.FC<{ img: GalleryImage; idx: number }> = ({ img, idx }) => {
    const [aspectClass, setAspectClass] = useState("aspect-[3/2]");
    const [isLoaded, setIsLoaded] = useState(false);
    const parsed = parseCaptionData(img.caption);
    
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setAspectClass(naturalHeight > naturalWidth ? "aspect-[2/3]" : "aspect-[3/2]");
        setIsLoaded(true);
    };

    return (
        <div className="w-full bg-white mb-16 last:mb-0 group">
             <div className={`w-full relative bg-stone-100 overflow-hidden ${aspectClass} transition-all duration-500 rounded-sm`}>
                <img 
                    src={img.url} 
                    alt={parsed.locationMain} 
                    className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
                    onLoad={handleImageLoad} 
                />
             </div>
             
             {/* 极致还原：照片下方 Logo 样式排版 */}
             <div className="flex justify-between items-center mt-5 px-1">
                  <div className="flex flex-col gap-1 items-start">
                      <span className="font-mono text-[9px] text-stone-400 leading-none uppercase tracking-widest">{parsed.date || 'DATALESS'}</span>
                      <div className="flex items-center gap-2 mt-1">
                          <BrandLogotype deviceString={parsed.device || 'Digital'} />
                          <span className="text-[10px] font-medium text-stone-300 font-mono">/ {parsed.device ? 'EXIF' : 'SCAN'}</span>
                      </div>
                  </div>
                  
                  <div className="flex items-center">
                      <div className="w-[1px] h-6 bg-stone-100 mr-4"></div>
                      <div className="flex flex-col items-end text-right">
                          <span className="font-serif font-bold text-xs text-ink leading-tight">{parsed.locationMain || '无题'}</span>
                          {parsed.locationSub && (
                              <span className="text-[9px] text-stone-400 leading-none font-sans mt-1">{parsed.locationSub}</span>
                          )}
                      </div>
                  </div>
             </div>
        </div>
    );
};

const RichTextRenderer = ({ content }: { content: any[] }) => {
    if (!content || !Array.isArray(content)) return null;
    return (
        <>{content.map((token, idx) => {
            const { text, annotations, href } = token;
            let className = "";
            if (annotations?.bold) className += " font-bold";
            if (annotations?.italic) className += " italic";
            if (annotations?.underline) className += " underline underline-offset-4 decoration-stone-300";
            if (annotations?.code) className += " font-mono text-[0.9em] bg-stone-100 px-1 rounded mx-0.5 text-brand-accent";
            if (href) return <a key={idx} href={href} target="_blank" rel="noopener noreferrer" className={`text-brand-accent hover:underline decoration-1 ${className}`}>{text}</a>;
            return <span key={idx} className={className}>{text}</span>;
        })}</>
    );
};

export const DetailView: React.FC<DetailViewProps> = ({ items, type, logoUrl, forceId }) => {
  const { id } = useParams();
  const currentId = forceId || id;
  const item = items.find(i => i.id === currentId);

  const [contentImages, setContentImages] = useState<GalleryImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [blogBlocks, setBlogBlocks] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentId]);

  useEffect(() => {
    if (item && type === 'gallery') {
      const fetchImages = async () => {
        setLoadingImages(true);
        try {
          const res = await fetch(`/api/page-images?pageId=${item.id}`);
          if (res.ok) {
            const data = await res.json();
            setContentImages(data.images);
          }
        } catch (e) { console.error(e); } finally { setLoadingImages(false); }
      };
      fetchImages();
    }
  }, [item?.id, type]);

  useEffect(() => {
    if (item?.id) {
        const fetchContent = async () => {
            setLoadingContent(true);
            try {
                const res = await fetch(`/api/get-page-content?pageId=${item.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.content) setBlogBlocks(data.content);
                }
            } catch (e) { console.error(e); } finally { setLoadingContent(false); }
        };
        fetchContent();
    }
  }, [item?.id]);

  if (!item && items.length > 0) return <Navigate to="/" replace />;
  if (!item) return <div className="min-h-screen bg-texture flex items-center justify-center font-mono text-xs text-stone-400">FINDING CONTENT...</div>;

  const isBlog = type === 'blog';
  const blogPost = item as BlogPost;
  const photoGroup = item as PhotoGroup;

  const renderBlock = (block: any, idx: number) => {
      switch (block.type) {
          case 'paragraph': return <p key={idx} className="mb-6 leading-loose text-ink/90 text-justify font-serif text-[15px]"><RichTextRenderer content={block.content} /></p>;
          case 'heading_1': return <h2 key={idx} className="text-2xl font-serif font-bold mt-10 mb-6 border-b border-stone-200 pb-2"><RichTextRenderer content={block.content} /></h2>;
          case 'heading_2': return <h3 key={idx} className="text-xl font-serif font-bold mt-8 mb-4"><RichTextRenderer content={block.content} /></h3>;
          case 'quote': return <blockquote key={idx} className="border-l-4 border-brand-accent pl-5 py-2 my-8 bg-stone-50/50 italic text-stone-600 font-serif text-lg"><RichTextRenderer content={block.content} /></blockquote>;
          case 'image': return <figure key={idx} className="my-10"><img src={block.src} className="w-full rounded-sm shadow-sm" /><figcaption className="text-center mt-3 text-[10px] font-mono text-stone-400 uppercase tracking-widest"><RichTextRenderer content={block.caption} /></figcaption></figure>;
          case 'divider': return <hr key={idx} className="my-12 border-dashed border-stone-200" />;
          default: return null;
      }
  };

  return (
    <div className="min-h-screen w-full flex flex-col animate-in fade-in duration-300">
      <NavBar logoUrl={logoUrl} />
      <div className="flex-grow w-full bg-texture">
        <div className="w-full max-w-[452px] mx-auto pb-24 pt-12">
            <div className="px-4 animate-in slide-in-from-bottom-8 duration-500 delay-100">
                <div className="h-4 w-full jagged-top bg-paper"></div>
                
                <TicketBase className="rounded-none bg-paper min-h-[80vh] flex flex-col border-x border-stone-200">
                    <div className="p-8 md:p-10 pb-6 relative">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-col">
                                <span className="font-mono text-[9px] text-stone-400 uppercase tracking-[0.2em] mb-1">{isBlog ? blogPost.category : 'COLLECTION'}</span>
                                <span className="font-mono text-xs font-bold text-ink bg-stone-100 px-2 py-0.5 inline-block rounded-sm">{isBlog ? blogPost.date : photoGroup.ticketNumber}</span>
                            </div>
                            <div className="border border-stone-200 px-2 py-1 flex items-center gap-1.5 opacity-60">
                                {isBlog ? <Clock size={10} /> : <Camera size={10} />}
                                <span className="font-mono text-[9px] font-bold uppercase">{isBlog ? blogPost.readTime : `${photoGroup.count} SHOTS`}</span>
                            </div>
                        </div>
                        
                        <h1 className="font-serif font-bold text-3xl md:text-4xl text-ink leading-tight mb-6">{item.title}</h1>
                        {!isBlog && <div className="flex items-center gap-2 text-stone-400 text-xs font-mono mb-2 uppercase tracking-wide"><MapPin size={11} /><span>{photoGroup.location}</span></div>}
                        
                        {/* 精致腰线 */}
                        <DashedLine className="mt-8 opacity-20" />
                        <Notch className="-left-4 bottom-[-1px] translate-y-1/2" />
                        <Notch className="-right-4 bottom-[-1px] translate-y-1/2" />
                    </div>

                    <div className="relative w-full aspect-[16/9] bg-stone-100 overflow-hidden border-y border-stone-100">
                        <img 
                            src={isBlog ? blogPost.imageUrl : photoGroup.coverUrl} 
                            onLoad={() => setCoverLoaded(true)} 
                            className={`w-full h-full object-cover transition-opacity duration-1000 ${coverLoaded ? 'opacity-100' : 'opacity-0'}`} 
                        />
                        <div className="absolute inset-0 bg-stone-500/5 mix-blend-multiply pointer-events-none" />
                    </div>

                    <div className="p-8 md:p-10 pt-10 flex-grow relative">
                        <Notch className="-left-4 top-0 -translate-y-1/2" />
                        <Notch className="-right-4 top-0 -translate-y-1/2" />
                        
                        {loadingContent ? (
                            <div className="flex flex-col items-center py-20 text-stone-300 font-mono text-[10px] tracking-[0.3em]">
                                <Loader2 className="animate-spin mb-3" size={16} />
                                DEVELOPING...
                            </div>
                        ) : blogBlocks.length > 0 ? (
                            blogBlocks.map((block, idx) => renderBlock(block, idx))
                        ) : (
                            <p className="font-serif leading-loose text-ink/80 text-[15px]">{isBlog ? blogPost.excerpt : photoGroup.description}</p>
                        )}

                        {!isBlog && contentImages.length > 0 && (
                            <div className="flex flex-col mt-10">
                                {contentImages.map((img, idx) => <GalleryItem key={idx} img={img} idx={idx} />)}
                            </div>
                        )}
                    </div>

                    <div className="bg-paper-dark p-8 relative mt-auto border-t border-dashed border-stone-300/50">
                        <Notch className="-left-4 top-0 -translate-y-1/2" />
                        <Notch className="-right-4 top-0 -translate-y-1/2" />
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-full flex justify-between items-center opacity-30">
                                <BarcodeVertical />
                                <div className="mx-6 flex flex-col gap-1 w-full text-ink">
                                    <span className="font-serif text-[11px] font-bold tracking-[0.3em] uppercase">先见志明</span>
                                    <span className="font-mono text-[8px] tracking-[0.4em] uppercase opacity-60">MEMORIES ARCHIVE</span>
                                </div>
                                <BarcodeVertical />
                            </div>
                        </div>
                    </div>
                </TicketBase>
                
                <div className="h-4 w-full jagged-bottom bg-paper-dark"></div>
            </div>
        </div>
      </div>
    </div>
  );
};