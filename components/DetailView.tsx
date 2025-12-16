import React, { useEffect, useState } from 'react';
import { BlogPost, PhotoGroup } from '../types';
import { TicketBase, DashedLine, Notch, BarcodeHorizontal, BarcodeVertical } from './TicketUI';
import { NavBar } from './NavBar';
import { Clock, MapPin, Camera, Aperture, Loader2, Info, ChevronRight, ChevronDown, ExternalLink } from 'lucide-react';

interface DetailViewProps {
  item: BlogPost | PhotoGroup;
  type: 'blog' | 'gallery';
  onNavigate: (view: 'home' | 'gallery' | 'thoughts' | 'blog') => void;
  logoUrl?: string;
}

interface GalleryImage {
    url: string;
    caption: string;
}

// --- Brand Logotype Component ---
// Replaces the SVG icon with a typography-based logo to avoid distortion and maintain aesthetic.
const BrandLogotype = ({ deviceString, className = "" }: { deviceString: string, className?: string }) => {
    const s = deviceString.toLowerCase();
    
    // Base style for the text
    const baseClass = `leading-none select-none ${className}`;

    // Apple - Use local SVG from public/fonts/apple.svg
    if (s.includes('apple') || s.includes('iphone')) {
        return (
            <img 
                src="/fonts/apple.svg" 
                alt="Apple"
                className={`h-3.5 w-auto object-contain opacity-90 ${className}`} 
            />
        );
    }
    // Sony - Use local SVG from public/fonts/logo-sony.svg
    if (s.includes('sony') || s.includes('ilce') || s.includes('alpha')) {
        return (
            <img 
                src="/fonts/logo-sony.svg" 
                alt="SONY"
                className={`h-3 w-auto object-contain opacity-80 ${className}`} 
            />
        );
    }
    // Canon - Distinctive Serif
    if (s.includes('canon')) {
        return <span className={`${baseClass} font-serif font-bold tracking-wide text-[14px]`}>Canon</span>;
    }
    // Nikon - Italic Sans Bold
    if (s.includes('nikon')) {
        return <span className={`${baseClass} font-sans font-black italic tracking-widest uppercase text-[14px]`}>Nikon</span>;
    }
    // Fujifilm
    if (s.includes('fuji') || s.includes('x100') || s.includes('xt') || s.includes('gfx')) {
        return <span className={`${baseClass} font-sans font-bold uppercase tracking-tight text-[12px]`}>FUJIFILM</span>;
    }
    // Leica
    if (s.includes('leica')) {
         return <span className={`${baseClass} font-sans font-light tracking-[0.2em] uppercase text-[12px]`}>LEICA</span>;
    }
    // Hasselblad
    if (s.includes('hasselblad')) {
         return <span className={`${baseClass} font-mono font-bold uppercase tracking-widest text-[10px]`}>HASSELBLAD</span>;
    }
    // Ricoh
    if (s.includes('ricoh') || s.includes('gr')) {
        return <span className={`${baseClass} font-sans font-medium uppercase tracking-widest text-[12px]`}>RICOH</span>;
    }
    // Panasonic / Lumix
    if (s.includes('panasonic') || s.includes('lumix')) {
        return <span className={`${baseClass} font-sans font-bold uppercase tracking-widest text-[12px]`}>LUMIX</span>;
    }

    // Default: Return first word of device string or fallback icon
    const brand = deviceString.split(' ')[0];
    if (brand) {
         return <span className={`${baseClass} font-mono font-bold uppercase text-[12px]`}>{brand}</span>;
    }
    
    return <Camera size={14} className="text-stone-400" />;
};


// Helper to render Rich Text array
const RichTextRenderer = ({ content }: { content: any[] }) => {
    if (!content || !Array.isArray(content)) return null;

    return (
        <>
            {content.map((token, idx) => {
                const { text, annotations, href } = token;
                let className = "";
                if (annotations?.bold) className += " font-bold";
                if (annotations?.italic) className += " italic";
                if (annotations?.strikethrough) className += " line-through";
                if (annotations?.underline) className += " underline underline-offset-4 decoration-stone-300";
                if (annotations?.code) className += " font-mono text-[0.9em] bg-stone-100 px-1 rounded mx-0.5 text-brand-accent";

                if (href) {
                    return (
                        <a key={idx} href={href} target="_blank" rel="noopener noreferrer" className={`text-brand-accent hover:underline decoration-1 ${className}`}>
                            {text}
                        </a>
                    );
                }
                return <span key={idx} className={className}>{text}</span>;
            })}
        </>
    );
};

// --- Helper: Caption Parser ---
const parseCaptionData = (caption: string) => {
    if (!caption) return { device: '', date: '', locationMain: '', locationSub: '' };

    // Split by common delimiters: | (vertical bar) or ｜ (full-width vertical bar)
    const parts = caption.split(/\||｜/).map(s => s.trim()).filter(Boolean);

    let device = '';
    let date = '';
    const others: string[] = [];

    // Keywords to identify Device
    const deviceKeywords = ['SONY', 'Sony', 'Canon', 'Nikon', 'Fuji', 'Fujifilm', 'Leica', 'Apple', 'iPhone', 'Panasonic', 'Lumix', 'Ricoh', 'GR', 'Hasselblad', 'Olympus', 'ILCE', 'DC-S5'];
    // Regex for date (Year-Month or similar)
    const dateRegex = /(\d{4}.*\d{1,2}.*\d{1,2}|\d{4}\s*年)/;

    // First pass: look for specific types
    parts.forEach(part => {
        const isDevice = !device && deviceKeywords.some(k => part.toLowerCase().includes(k.toLowerCase()));
        const isDate = !date && dateRegex.test(part);

        if (isDevice) {
            device = part;
        } else if (isDate) {
            date = part;
        } else {
            // Assume anything else is location meta or other info
            others.push(part);
        }
    });

    let locationMain = '';
    let locationSub = '';

    if (others.length > 0) {
        locationMain = others[0];
        if (others.length > 1) {
            // If multiple parts remain, join the rest as sub location (e.g. Province | City)
            locationSub = others.slice(1).join(' · ');
        }
    }

    return {
        device,
        date,
        locationMain,
        locationSub
    };
};

// --- New Component: Individual Gallery Item with Aspect Ratio Logic ---
const GalleryItem: React.FC<{ img: GalleryImage, idx: number }> = ({ img, idx }) => {
    const [aspectClass, setAspectClass] = useState("aspect-[3/2]"); // Default to landscape
    const [isLoaded, setIsLoaded] = useState(false);
    const parsed = parseCaptionData(img.caption);
    
    // Updated: Eager load first 2 images
    const isPriority = idx < 2;

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        // Determine closest aspect ratio: if Height > Width, use 2:3 (Portrait), else 3:2 (Landscape)
        if (naturalHeight > naturalWidth) {
            setAspectClass("aspect-[2/3]");
        } else {
            setAspectClass("aspect-[3/2]");
        }
        setIsLoaded(true);
    };

    return (
        <div className="w-full bg-white mb-12 last:mb-0 group pb-4">
             {/* Image Container: Enforced Aspect Ratio + Crop */}
             <div className={`w-full relative bg-stone-100 overflow-hidden ${aspectClass} transition-all duration-500`}>
                <img 
                    src={img.url}
                    alt={parsed.locationMain}
                    loading={isPriority ? "eager" : "lazy"}
                    decoding={isPriority ? "auto" : "async"}
                    // object-cover is key here for cropping excess
                    className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={handleImageLoad}
                />
             </div>
             
             {/* Info Bar */}
             {/* Updated padding from px-1 to px-3 for better edge whitespace */}
             <div className="flex justify-between items-center mt-4 px-3">
                  {/* Left: Device & Date */}
                  {/* Increased gap from 1 to 1.5 for better separation */}
                  <div className="flex flex-col gap-1.5 items-start">
                      {/* Removed font-black, used font-medium */}
                      <span className="font-sans font-medium text-[10px] uppercase leading-none tracking-wider text-ink">
                          {parsed.device || 'DIGITAL'}
                      </span>
                      <span className="font-mono text-[8px] text-stone-400 leading-none">
                          {parsed.date}
                      </span>
                  </div>

                  {/* Right: Brand Text, Divider, Location */}
                  <div className="flex items-center h-full pt-0.5">
                      {/* Brand Label Area - Replaced Logo */}
                      <div className="mr-3 shrink-0 flex items-center text-ink opacity-80">
                          <BrandLogotype deviceString={parsed.device} />
                      </div>
                      
                      {/* Vertical Divider */}
                      <div className="w-[1px] h-3 bg-stone-200 mr-3 shrink-0"></div>

                      {/* Location Text */}
                      <div className="flex flex-col items-start justify-center">
                          {/* Location Main: text-[9px] -> text-[10px], added -translate-y-[5px] */}
                          <span className="font-medium text-[10px] text-ink leading-none mb-0.5 -translate-y-[5px]">
                              {parsed.locationMain}
                          </span>
                          {/* Location Sub: text-[8px] */}
                          {parsed.locationSub && (
                              <span className="text-[8px] text-stone-500 leading-none font-sans">
                                  {parsed.locationSub}
                              </span>
                          )}
                      </div>
                  </div>
             </div>
        </div>
    );
};


export const DetailView: React.FC<DetailViewProps> = ({ item, type, onNavigate, logoUrl }) => {
  const [contentImages, setContentImages] = useState<GalleryImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [blogBlocks, setBlogBlocks] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  
  // State for the main cover image
  const [coverLoaded, setCoverLoaded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch images for gallery
  useEffect(() => {
    if (type === 'gallery') {
      const fetchImages = async () => {
        setLoadingImages(true);
        try {
          const res = await fetch(`/api/page-images?pageId=${item.id}`);
          if (res.ok) {
            const data = await res.json();
            setContentImages(data.images);
          }
        } catch (error) {
          console.error("Failed to fetch gallery images:", error);
        } finally {
          setLoadingImages(false);
        }
      };
      fetchImages();
    }
  }, [item.id, type]);

  // Fetch structured content for BOTH blog and gallery
  // Modified to allow fetching content for gallery type as well
  useEffect(() => {
    if (item.id) {
        const fetchContent = async () => {
            setLoadingContent(true);
            try {
                const res = await fetch(`/api/get-page-content?pageId=${item.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.content && Array.isArray(data.content)) {
                        setBlogBlocks(data.content);
                    }
                }
            } catch (error) {
                 console.error("Failed to fetch page content:", error);
            } finally {
                setLoadingContent(false);
            }
        };
        fetchContent();
    }
  }, [item.id]);

  const isBlog = type === 'blog';
  const blogPost = item as BlogPost;
  const photoGroup = item as PhotoGroup;
  
  const displayImages = type === 'gallery' ? contentImages : [];

  const renderBlock = (block: any, idx: number) => {
      switch (block.type) {
          case 'paragraph': return <p key={idx} className="mb-6 leading-loose text-ink/90"><RichTextRenderer content={block.content} /></p>;
          case 'heading_1': return <h2 key={idx} className="text-2xl font-serif font-bold mt-10 mb-6 border-b border-stone-200 pb-2"><RichTextRenderer content={block.content} /></h2>;
          case 'heading_2': return <h3 key={idx} className="text-xl font-serif font-bold mt-8 mb-4"><RichTextRenderer content={block.content} /></h3>;
          case 'heading_3': return <h4 key={idx} className="text-lg font-serif font-bold mt-6 mb-3 text-brand-accent"><RichTextRenderer content={block.content} /></h4>;
          case 'callout': 
             const icon = block.icon?.type === 'emoji' ? block.icon.emoji : '💡';
             return <div key={idx} className="bg-stone-50 border border-stone-200 p-4 rounded-sm flex gap-4 my-6 shadow-sm"><div className="text-xl select-none">{icon}</div><div className="flex-1 text-sm leading-relaxed text-ink/80"><RichTextRenderer content={block.content} /></div></div>;
          case 'quote': return <blockquote key={idx} className="border-l-4 border-brand-accent pl-5 py-2 my-8 bg-stone-50/50 italic text-stone-600 font-serif text-lg"><RichTextRenderer content={block.content} /></blockquote>;
          case 'toggle':
              return <details key={idx} className="my-4 group border border-stone-200 rounded-sm bg-white open:bg-stone-50 transition-colors"><summary className="cursor-pointer p-3 font-medium flex items-center gap-2 list-none select-none text-stone-700 hover:text-ink"><ChevronRight size={16} className="transition-transform group-open:rotate-90" /><RichTextRenderer content={block.content} /></summary><div className="p-3 pt-0 pl-9 text-sm text-stone-600"><p className="opacity-60 italic text-xs">[Details]</p></div></details>;
          case 'image': return <figure key={idx} className="my-8"><img src={block.src} alt="" className="w-full rounded-sm shadow-sm border border-stone-100" />{block.caption?.length > 0 && <figcaption className="text-center mt-2 text-xs font-mono text-stone-400"><RichTextRenderer content={block.caption} /></figcaption>}</figure>;
          case 'bookmark': return <a key={idx} href={block.url} target="_blank" rel="noopener noreferrer" className="block my-6 no-underline group"><div className="border border-stone-200 rounded-sm p-4 flex justify-between items-center hover:bg-stone-50 transition-colors hover:shadow-sm"><div className="overflow-hidden"><div className="font-bold text-sm mb-1 truncate text-ink group-hover:text-brand-accent"><RichTextRenderer content={block.caption.length ? block.caption : [{text: block.url}]} /></div><div className="text-xs text-stone-400 font-mono truncate">{block.url}</div></div><ExternalLink size={16} className="text-stone-300 group-hover:text-brand-accent shrink-0 ml-4" /></div></a>;
          case 'divider': return <hr key={idx} className="my-8 border-dashed border-stone-300" />;
          case 'list_item': return <div key={idx} className="flex gap-2 mb-2 ml-4"><span className="text-brand-accent font-bold select-none">•</span><span className="leading-relaxed"><RichTextRenderer content={block.content} /></span></div>;
          default: return null;
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-texture overflow-y-auto animate-in fade-in duration-300">
      
      <NavBar onNavigate={onNavigate} activeView={type} logoUrl={logoUrl} />

      <div className="w-full max-w-[452px] mx-auto min-h-screen pb-24 pt-12">
        <div className="px-4 animate-in slide-in-from-bottom-8 duration-500 delay-100">
          
          <div>
            <div className="h-4 w-full jagged-top bg-paper"></div>
            
            <TicketBase className="rounded-none bg-paper min-h-[80vh] flex flex-col border-x border-stone-200">
              
              {/* Header */}
              <div className="p-6 md:p-10 pb-4 relative">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                        <span className="font-mono text-[9px] text-stone-400 uppercase tracking-[0.2em] mb-1">
                            {isBlog ? blogPost.category : 'COLLECTION'}
                        </span>
                        <span className="font-mono text-xs font-bold text-ink bg-stone-100 px-2 py-0.5 inline-block rounded-sm w-fit">
                            {isBlog ? blogPost.date : photoGroup.ticketNumber}
                        </span>
                    </div>
                    {isBlog ? (
                        <div className="border border-stone-300 px-2 py-1 flex items-center gap-1 opacity-70">
                            <Clock size={10} />
                            <span className="font-mono text-[9px] font-bold">{blogPost.readTime}</span>
                        </div>
                    ) : (
                        <div className="border border-stone-300 px-2 py-1 flex items-center gap-1 opacity-70">
                            <Camera size={10} />
                            <span className="font-mono text-[9px] font-bold">{photoGroup.count} SHOTS</span>
                        </div>
                    )}
                 </div>
                 
                 {/* Title uses font-serif (JingHuaLaoSongTi) */}
                 <h1 className="font-serif font-bold text-3xl md:text-5xl text-ink leading-tight mb-4">
                    {item.title}
                 </h1>

                 {!isBlog && (
                    <div className="flex items-center gap-2 text-stone-500 text-xs font-mono mb-2">
                        <MapPin size={12} />
                        <span>{photoGroup.location}</span>
                    </div>
                 )}

                 <DashedLine className="mt-8 opacity-30" />
                 <Notch className="-left-4 bottom-[-1px] translate-y-1/2" />
                 <Notch className="-right-4 bottom-[-1px] translate-y-1/2" />
              </div>

              {/* Cover Image */}
              <div className="relative w-full aspect-[16/9] bg-stone-200 overflow-hidden border-y-2 border-dashed border-stone-300">
                  <img 
                    src={isBlog ? blogPost.imageUrl : photoGroup.coverUrl} 
                    alt={item.title}
                    loading="eager" // Force eager loading for main cover
                    onLoad={() => setCoverLoaded(true)}
                    className={`w-full h-full object-cover transition-opacity duration-700 ${coverLoaded ? 'opacity-100' : 'opacity-0'}`}
                  />
                  <div className="absolute inset-0 bg-stone-500/10 mix-blend-multiply pointer-events-none" />
              </div>

              {/* Content Body */}
              <div className="p-6 md:p-10 pt-8 flex-grow relative">
                  <Notch className="-left-4 top-0 -translate-y-1/2" />
                  <Notch className="-right-4 top-0 -translate-y-1/2" />

                  {isBlog ? (
                      // Changed from font-serif to font-sans (XiXianTingMingTi)
                      <div className="text-base text-ink font-sans">
                          {loadingContent ? (
                              <div className="flex justify-center items-center py-12 gap-2 text-stone-400">
                                  <Loader2 className="animate-spin" size={16} />
                                  <span className="font-mono text-xs">Loading Content...</span>
                              </div>
                          ) : (
                              <>
                                  {blogBlocks.length > 0 ? (
                                      blogBlocks.map((block, idx) => renderBlock(block, idx))
                                  ) : (
                                      blogPost.content && Array.isArray(blogPost.content) ? (
                                          blogPost.content.map((txt, i) => <p key={i} className="mb-4">{txt}</p>)
                                      ) : (
                                          <p>{blogPost.excerpt}</p>
                                      )
                                  )}
                              </>
                          )}
                      </div>
                  ) : (
                      <div className="flex flex-col gap-6">
                          {/* Description: Changed from font-serif to font-sans (XiXianTingMingTi) */}
                          <p className="font-sans text-lg md:text-xl leading-relaxed italic border-l-2 border-brand-accent pl-6 text-stone-600 bg-stone-50 py-4 pr-4">
                              {photoGroup.description || "No description available."}
                          </p>

                          {/* Render Notion Content Blocks for Gallery (Filtered to exclude images) */}
                          {/* Changed from font-serif to font-sans (XiXianTingMingTi) */}
                          {blogBlocks.length > 0 && (
                            <div className="text-base text-ink font-sans my-4">
                                {blogBlocks
                                    .filter(block => block.type !== 'image')
                                    .map((block, idx) => renderBlock(block, idx))
                                }
                            </div>
                          )}
                          
                          {/* GALLERY IMAGES */}
                          <div className="flex flex-col mt-4">
                              {loadingImages ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2 text-stone-400">
                                   <Loader2 className="animate-spin" />
                                   <span className="font-mono text-xs">Developing Photos...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col w-full">
                                    {displayImages.length > 0 ? displayImages.map((img, idx) => (
                                        <GalleryItem key={idx} img={img} idx={idx} />
                                    )) : (
                                        <div className="text-center py-8 font-mono text-xs text-stone-400 border border-dashed border-stone-300">
                                            No additional photos found in the roll.
                                        </div>
                                    )}
                                </div>
                              )}
                          </div>
                          
                          {/* REMOVED: Album Info Box */}
                      </div>
                  )}
              </div>

              {/* Footer */}
              <div className="bg-paper-dark p-6 relative mt-auto border-t-2 border-dashed border-stone-300/50">
                   <Notch className="-left-4 top-0 -translate-y-1/2" />
                   <Notch className="-right-4 top-0 -translate-y-1/2" />
                   <div className="flex flex-col items-center text-center gap-4">
                       <div className="w-full flex justify-between items-center opacity-50">
                           <BarcodeVertical />
                           <div className="mx-4 flex flex-col gap-1 w-full text-ink opacity-80">
                               {/* Updated text content and smaller font sizes */}
                               <span className="font-serif text-[10px] tracking-widest">先见志明</span>
                               <span className="font-mono text-[9px] font-bold tracking-[0.2em] uppercase">PANZHIMING.COM</span>
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