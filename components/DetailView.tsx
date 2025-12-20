
import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { BlogPost, PhotoGroup } from '../types';
import { TicketBase, DashedLine, Notch, BarcodeVertical } from './TicketUI';
import { NavBar } from './NavBar';
import { Clock, MapPin, Camera, Loader2, ChevronRight, ExternalLink } from 'lucide-react';

interface DetailViewProps {
  items: (BlogPost | PhotoGroup)[];
  type: 'blog' | 'gallery';
  logoUrl?: string;
  forceId?: string; // For manual page
}

interface GalleryImage {
    url: string;
    caption: string;
}

// --- Brand Logotype Component ---
const BrandLogotype = ({ deviceString, className = "" }: { deviceString: string, className?: string }) => {
    const s = deviceString.toLowerCase();
    const [imgError, setImgError] = useState(false);
    const baseClass = `leading-none select-none ${className}`;

    if (s.includes('apple') || s.includes('iphone')) {
        if (!imgError) return <img src="/fonts/apple.svg" alt="Apple" onError={() => setImgError(true)} className={`h-5 w-auto object-contain opacity-90 ${className}`} />;
        return <span className={`${baseClass} font-[system-ui,sans-serif] font-bold tracking-tight text-[11px]`}>APPLE</span>;
    }
    if (s.includes('sony') || s.includes('ilce') || s.includes('alpha')) {
        if (!imgError) return <img src="/fonts/logo-sony.svg" alt="SONY" onError={() => setImgError(true)} className={`h-2 w-auto object-contain opacity-80 ${className}`} />;
        return <span className={`${baseClass} font-serif font-bold tracking-widest text-[10px]`}>SONY</span>;
    }
    if (s.includes('canon')) return <span className={`${baseClass} font-serif font-bold tracking-wide text-[14px]`}>Canon</span>;
    if (s.includes('nikon')) return <span className={`${baseClass} font-[system-ui,sans-serif] font-black italic tracking-widest uppercase text-[14px]`}>Nikon</span>;
    if (s.includes('fuji') || s.includes('x100') || s.includes('xt') || s.includes('gfx')) return <span className={`${baseClass} font-[system-ui,sans-serif] font-bold uppercase tracking-tight text-[12px]`}>FUJIFILM</span>;
    const brand = deviceString.split(' ')[0];
    if (brand) return <span className={`${baseClass} font-mono font-bold uppercase text-[12px]`}>{brand}</span>;
    return <Camera size={14} className="text-stone-400" />;
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
        <div className="w-full bg-white mb-12 last:mb-0 group pb-4">
             <div className={`w-full relative bg-stone-100 overflow-hidden ${aspectClass} transition-all duration-500`}>
                <img src={img.url} alt={parsed.locationMain} className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={handleImageLoad} />
             </div>
             <div className="flex justify-between items-center mt-4 px-3">
                  <div className="flex flex-col gap-1.5 items-start">
                      <span className="font-[system-ui,sans-serif] font-medium text-[10px] uppercase leading-none tracking-tight text-ink">{parsed.device || 'DIGITAL'}</span>
                      <span className="font-mono text-[8px] text-stone-400 leading-none">{parsed.date}</span>
                  </div>
                  <div className="flex items-center h-full pt-0.5 -translate-y-[2px]">
                      <div className="mr-3 shrink-0 flex items-center text-ink opacity-80"><BrandLogotype deviceString={parsed.device} /></div>
                      <div className="w-[1px] h-5 bg-stone-200 mr-3 shrink-0"></div>
                      <div className="flex flex-col items-start justify-center">
                          <span className="font-[system-ui,sans-serif] font-medium text-[10px] text-ink leading-none mb-0.5">{parsed.locationMain}</span>
                          {parsed.locationSub && <span className="text-[8px] text-stone-500 leading-none font-[system-ui,sans-serif] translate-y-[1px]">{parsed.locationSub}</span>}
                      </div>
                  </div>
             </div>
        </div>
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
          case 'paragraph': return <p key={idx} className="mb-6 leading-loose text-ink/90 text-justify"><RichTextRenderer content={block.content} /></p>;
          case 'heading_1': return <h2 key={idx} className="text-2xl font-serif font-bold mt-10 mb-6 border-b border-stone-200 pb-2"><RichTextRenderer content={block.content} /></h2>;
          case 'heading_2': return <h3 key={idx} className="text-xl font-serif font-bold mt-8 mb-4"><RichTextRenderer content={block.content} /></h3>;
          case 'quote': return <blockquote key={idx} className="border-l-4 border-brand-accent pl-5 py-2 my-8 bg-stone-50/50 italic text-stone-600 font-serif text-lg"><RichTextRenderer content={block.content} /></blockquote>;
          case 'image': return <figure key={idx} className="my-8"><img src={block.src} className="w-full rounded-sm shadow-sm border border-stone-100" /><figcaption className="text-center mt-2 text-xs font-mono text-stone-400"><RichTextRenderer content={block.caption} /></figcaption></figure>;
          case 'bookmark': return <a key={idx} href={block.url} target="_blank" className="block my-6 no-underline group border border-stone-200 rounded-sm p-4 hover:bg-stone-50 transition-colors"><div className="flex justify-between items-center overflow-hidden"><div className="truncate"><div className="font-bold text-sm mb-1 text-ink group-hover:text-brand-accent"><RichTextRenderer content={block.caption.length ? block.caption : [{text: block.url}]} /></div><div className="text-xs text-stone-400 font-mono truncate">{block.url}</div></div><ExternalLink size={16} className="text-stone-300 group-hover:text-brand-accent shrink-0 ml-4" /></div></a>;
          case 'divider': return <hr key={idx} className="my-8 border-dashed border-stone-300" />;
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
                    <div className="p-6 md:p-10 pb-4 relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col">
                                <span className="font-mono text-[9px] text-stone-400 uppercase tracking-[0.2em] mb-1">{isBlog ? blogPost.category : 'COLLECTION'}</span>
                                <span className="font-mono text-xs font-bold text-ink bg-stone-100 px-2 py-0.5 inline-block rounded-sm w-fit">{isBlog ? blogPost.date : photoGroup.ticketNumber}</span>
                            </div>
                            <div className="border border-stone-300 px-2 py-1 flex items-center gap-1 opacity-70">
                                {isBlog ? <Clock size={10} /> : <Camera size={10} />}
                                <span className="font-mono text-[9px] font-bold">{isBlog ? blogPost.readTime : `${photoGroup.count} SHOTS`}</span>
                            </div>
                        </div>
                        <h1 className="font-serif font-bold text-3xl md:text-4xl text-ink leading-tight mb-4">{item.title}</h1>
                        {!isBlog && <div className="flex items-center gap-2 text-stone-500 text-xs font-mono mb-2"><MapPin size={12} /><span>{photoGroup.location}</span></div>}
                        <DashedLine className="mt-8 opacity-30" /><Notch className="-left-4 bottom-[-1px] translate-y-1/2" /><Notch className="-right-4 bottom-[-1px] translate-y-1/2" />
                    </div>
                    <div className="relative w-full aspect-[16/9] bg-stone-200 overflow-hidden border-y-2 border-dashed border-stone-300">
                        <img src={isBlog ? blogPost.imageUrl : photoGroup.coverUrl} onLoad={() => setCoverLoaded(true)} className={`w-full h-full object-cover transition-opacity duration-700 ${coverLoaded ? 'opacity-100' : 'opacity-0'}`} />
                        <div className="absolute inset-0 bg-stone-500/10 mix-blend-multiply pointer-events-none" />
                    </div>
                    <div className="p-6 md:p-10 pt-8 flex-grow relative">
                        <Notch className="-left-4 top-0 -translate-y-1/2" /><Notch className="-right-4 top-0 -translate-y-1/2" />
                        {loadingContent ? <div className="flex justify-center py-12 text-stone-400 font-mono text-xs"><Loader2 className="animate-spin mr-2" size={12} />LOADING...</div> : blogBlocks.length > 0 ? blogBlocks.map((block, idx) => renderBlock(block, idx)) : <p>{blogPost.excerpt || photoGroup.description}</p>}
                        {/* Fix: Replaced 'displayImages' with 'contentImages' which is the correct state variable name */}
                        {!isBlog && contentImages.length > 0 && <div className="flex flex-col mt-4">{contentImages.map((img, idx) => <GalleryItem key={idx} img={img} idx={idx} />)}</div>}
                    </div>
                    <div className="bg-paper-dark p-6 relative mt-auto border-t-2 border-dashed border-stone-300/50">
                        <Notch className="-left-4 top-0 -translate-y-1/2" /><Notch className="-right-4 top-0 -translate-y-1/2" />
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-full flex justify-between items-center opacity-50"><BarcodeVertical /><div className="mx-4 flex flex-col gap-1 w-full text-ink opacity-80"><span className="font-serif text-[10px] tracking-widest">先见志明</span><span className="font-mono text-[9px] font-bold tracking-[0.2em] uppercase">PANZHIMING.COM</span></div><BarcodeVertical /></div>
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
