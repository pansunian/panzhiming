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

// --- Brand Logos SVG Component ---
// Added shrink-0 and block display to prevent flexbox deformation
const CameraBrandLogo = ({ deviceString, className = "h-4" }: { deviceString: string, className?: string }) => {
    const s = deviceString.toLowerCase();
    const commonProps = {
        className: `${className} w-auto block`, // Force auto width based on height
        fill: "currentColor",
        preserveAspectRatio: "xMidYMid meet" // Critical for preventing aspect ratio distortion
    };
    
    // Apple
    if (s.includes('apple') || s.includes('iphone')) {
        return (
            <svg viewBox="0 0 384 512" {...commonProps}>
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 79.9c14.2 40.2 40.8 96.8 78 96.8 30.8 0 36.4-23.4 84.9-23.4 46.8 0 56.1 23.4 85.3 23.4 35.4 0 60.6-51.5 81.3-90.2-22.1-14.4-38.3-46.8-29.2-91.3zM255 83.3c15.9-19.1 29-45.6 24.3-70.8-22.7 1-47.8 11.2-64.4 30.8-14.1 17.1-26.6 44.2-21 70.3 26 .8 50.4-10.4 61.1-30.3z"/>
            </svg>
        );
    }
    // Sony
    if (s.includes('sony') || s.includes('ilce') || s.includes('alpha')) {
        return (
            <svg viewBox="0 0 500 100" {...commonProps}>
                <path d="M21.6,44.2h37.4c6,0,10.6-1.8,10.6-7.8c0-5.8-4.4-7.4-10.4-7.4H30.4c-4.6,0-8.8-3.4-8.8-9.8c0-6,4.6-9.6,9.8-9.6h54.8v10h-37c-5.8,0-10.2,1.6-10.2,7.4c0,5.8,4.6,7.4,10.6,7.4h29.2c5,0,9,4,9,9.8c0,5.8-4.6,10.4-10.4,10.4H10v-9.6C10,48,15.2,44.2,21.6,44.2z M125.6,9.6c20.8,0,36.4,14.8,36.4,36.4S146.4,82.4,125.6,82.4S89.2,67.6,89.2,46S104.8,9.6,125.6,9.6z M125.6,72.4c14.4,0,22.2-11,22.2-26.4s-7.8-26.4-22.2-26.4s-22.2,11-22.2,26.4S111.2,72.4,125.6,72.4z M174.6,9.6h15l34.4,53l0.4-53h12.8v72.8h-13.6L188,27.8l-0.4,54.6h-13V9.6z M253.6,9.6h14.8l20.4,32.4l20-32.4h14.8l-28,42v30.8h-14V51.6L253.6,9.6z"/>
            </svg>
        );
    }
    // Fujifilm
    if (s.includes('fuji') || s.includes('x100') || s.includes('xt') || s.includes('gfx')) {
        return (
            <svg viewBox="0 0 300 50" {...commonProps}>
               <path d="M37.8,2.7C20.4,2.7,4,7.4,4,7.4v13.6h8.8V15c0,0,10.7-3.9,23.3-3.9c10.4,0,12.5,1.9,12.5,5.6v28.8h15V15.5C63.6,4.4,51.8,2.7,37.8,2.7z M85.2,15.5v19.4c0,3.7,2.2,5.6,10.1,5.6c8,0,10.1-1.9,10.1-5.6V15.5h15v18.2c0,12.2-10.4,13.6-25.1,13.6c-14.8,0-25.1-1.4-25.1-13.6V15.5H85.2z M134.3,15.5v22.7c0,5.6-3.8,7.3-8.8,7.3h-3.4v-8.8h3.1c1.2,0,1.8-0.6,1.8-2.5V15.5H134.3z M122.1,8.6c0-3.3,2.7-5.9,5.9-5.9c3.3,0,5.9,2.7,5.9,5.9c0,3.3-2.7,5.9-5.9,5.9C124.8,14.6,122.1,11.9,122.1,8.6z M144.1,15.5h7.3v29.9h-7.3V15.5z M140.4,8.6c0-3.3,2.7-5.9,5.9-5.9s5.9,2.7,5.9,5.9c0,3.3-2.7,5.9-5.9,5.9S140.4,11.9,140.4,8.6z M162.2,2.7v10.9h12.5v7.5h-12.5v24.4h-7.3V21.1h-4.8v-7.5h4.8V5.3C154.9,4.4,158.4,2.7,162.2,2.7z M186.7,15.5v29.9h-7.3V15.5H186.7z M183,8.6c0-3.3,2.7-5.9,5.9-5.9c3.3,0,5.9,2.7,5.9,5.9c0,3.3-2.7,5.9-5.9,5.9C185.7,14.6,183,11.9,183,8.6z M201.2,2.7v28.8c0,3.7,2.2,5.6,12.5,5.6c12.6,0,23.3-3.9,23.3-3.9v6.1c0,0-16.4,4.7-33.8,4.7c-13.9,0-25.8-1.7-25.8-12.8V2.7H201.2z M248.6,15.5v29.9h-7.3V15.5H248.6z M261.2,15.5l10.9,23.5l10.9-23.5h9.4l-16.1,34.4v13.9h-7.3V69.9L252.7,15.5H261.2z"/>
            </svg>
        );
    }
    // Canon
    if (s.includes('canon')) {
        return (
            <svg viewBox="0 0 100 20" {...commonProps}>
                 <text x="0" y="15" fontFamily="serif" fontWeight="bold" fontSize="16">Canon</text>
            </svg>
        );
    }
    // Nikon
    if (s.includes('nikon')) {
         return (
            <svg viewBox="0 0 100 20" {...commonProps}>
                 <text x="0" y="15" fontFamily="sans-serif" fontWeight="900" fontStyle="italic" fontSize="16">Nikon</text>
            </svg>
        );
    }
    // Leica
    if (s.includes('leica')) {
        return (
            <svg viewBox="0 0 100 30" {...commonProps}>
               <text x="0" y="20" fontFamily="serif" fontStyle="italic" fontWeight="bold" fontSize="20">Leica</text>
            </svg>
        );
    }
    // Panasonic / Lumix
    if (s.includes('panasonic') || s.includes('lumix') || s.includes('dc-s')) {
         return (
            <svg viewBox="0 0 100 20" {...commonProps}>
                 <text x="0" y="15" fontFamily="sans-serif" fontWeight="bold" fontSize="14" letterSpacing="1">LUMIX</text>
            </svg>
        );
    }
    // Ricoh
    if (s.includes('ricoh') || s.includes('gr')) {
         return (
            <svg viewBox="0 0 100 20" {...commonProps}>
                 <text x="0" y="15" fontFamily="sans-serif" fontSize="14">RICOH</text>
            </svg>
        );
    }
    // Hasselblad
    if (s.includes('hasselblad')) {
         return (
             <svg viewBox="0 0 120 20" {...commonProps}>
                  <text x="0" y="15" fontFamily="serif" fontWeight="bold" fontSize="14" letterSpacing="1">HASSELBLAD</text>
             </svg>
         );
    }

    // Default Camera Icon if unknown
    return (
        <div className={`flex items-center gap-1 text-ink ${className}`}>
             <Camera size={14} strokeWidth={2.5} />
             <span className="font-bold text-[10px] uppercase leading-none">{deviceString.split(' ')[0]}</span>
        </div>
    );
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
    let metaString = '';

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
            // Assume anything else is location meta
            metaString = part;
        }
    });

    // Fallback: If device not found, check if last part looks like a device (alpha characters, no date numbers)
    if (!device && parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        if (/[a-zA-Z]/.test(lastPart) && !dateRegex.test(lastPart)) {
            device = lastPart;
            if (metaString === device) metaString = '';
        }
    }

    // Split Location Meta into Main (City) and Sub (Spot)
    let locationMain = metaString;
    let locationSub = '';

    if (metaString) {
        const splitParts = metaString.split(/·| - /).map(s => s.trim());
        if (splitParts.length > 1) {
            locationMain = splitParts[0];
            locationSub = splitParts.slice(1).join(' · ');
        } else {
            locationMain = metaString; 
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
        <div className="w-full bg-white mb-12 last:mb-0 group">
             {/* Image Container: Enforced Aspect Ratio + Crop */}
             <div className={`w-full relative bg-stone-100 overflow-hidden ${aspectClass} transition-all duration-500`}>
                <img 
                    src={img.url}
                    alt={parsed.locationMain}
                    // object-cover is key here for cropping excess
                    className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={handleImageLoad}
                />
             </div>
             
             {/* Info Bar */}
             <div className="flex justify-between items-start mt-4 px-1">
                  {/* Left: Device & Date */}
                  <div className="flex flex-col gap-1.5 items-start">
                      <span className="font-sans font-black text-sm uppercase leading-none tracking-tight text-ink">
                          {parsed.device || 'DIGITAL'}
                      </span>
                      <span className="font-mono text-[10px] text-stone-400 leading-none">
                          {parsed.date}
                      </span>
                  </div>

                  {/* Right: Logo, Divider, Location */}
                  <div className="flex items-center h-full pt-0.5">
                      {/* Logo Container - Fixed Height (h-4), Auto Width, No Shrink */}
                      <div className="h-4 mr-3 shrink-0 flex items-center text-ink opacity-90">
                          <CameraBrandLogo deviceString={parsed.device} className="h-full" />
                      </div>
                      
                      {/* Vertical Divider */}
                      <div className="w-[1px] h-6 bg-stone-200 mr-3 shrink-0"></div>

                      {/* Location Text */}
                      <div className="flex flex-col items-start justify-center">
                          <span className="font-bold text-sm text-ink leading-none mb-1">
                              {parsed.locationMain}
                          </span>
                          {parsed.locationSub && (
                              <span className="text-[10px] text-stone-500 leading-none font-sans">
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

  // Fetch structured content for blog
  useEffect(() => {
    if (type === 'blog') {
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
                 console.error("Failed to fetch blog content:", error);
            } finally {
                setLoadingContent(false);
            }
        };
        fetchContent();
    }
  }, [item.id, type]);

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
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-stone-500/10 mix-blend-multiply pointer-events-none" />
              </div>

              {/* Content Body */}
              <div className="p-6 md:p-10 pt-8 flex-grow relative">
                  <Notch className="-left-4 top-0 -translate-y-1/2" />
                  <Notch className="-right-4 top-0 -translate-y-1/2" />

                  {isBlog ? (
                      <div className="text-base text-ink font-serif">
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
                          <p className="font-serif text-lg md:text-xl leading-relaxed italic border-l-2 border-brand-accent pl-6 text-stone-600 bg-stone-50 py-4 pr-4">
                              {photoGroup.description || "No description available."}
                          </p>
                          
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

                          {/* Technical Info Box */}
                          <div className="border border-stone-200 bg-[#fdfbf7] p-4 mt-4 relative overflow-hidden opacity-80">
                              <div className="absolute right-0 top-0 opacity-5">
                                  <BarcodeHorizontal className="h-12 w-24 rotate-[-15deg] translate-x-4 -translate-y-2" />
                              </div>
                              <div className="flex items-center gap-2 mb-3 border-b border-dashed border-stone-200 pb-2">
                                  <Info size={14} className="text-stone-400" />
                                  <span className="font-mono text-xs font-bold text-stone-500">ALBUM INFO</span>
                              </div>
                              <div className="grid grid-cols-2 gap-y-4 gap-x-2 font-mono text-[10px] text-stone-500">
                                  <div>
                                      <p className="opacity-50 text-[8px] tracking-widest uppercase">LOCATION</p>
                                      <p className="text-ink">{photoGroup.location}</p>
                                  </div>
                                  <div>
                                      <p className="opacity-50 text-[8px] tracking-widest uppercase">DATE</p>
                                      <p className="text-ink">{photoGroup.date}</p>
                                  </div>
                              </div>
                          </div>
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
                           <div className="mx-4 flex flex-col gap-1 w-full">
                               <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">{isBlog ? 'Article ID' : 'Gallery ID'}</span>
                               <span className="font-mono text-xl tracking-[0.2em] font-bold">{item.id.replace(/-/g, '').substring(0, 8).toUpperCase()}</span>
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