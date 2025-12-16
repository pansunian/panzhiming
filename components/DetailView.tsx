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
    if (!caption) return { device: '', date: '', meta: '' };

    // Split by common delimiters: | (vertical bar) or ｜ (full-width vertical bar)
    const parts = caption.split(/\||｜/).map(s => s.trim()).filter(Boolean);

    let device = '';
    let date = '';
    let metaParts: string[] = [];

    // Keywords to identify Device (add more as needed)
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
            // Remove emojis for cleaner meta if desired, or keep them. keeping them for now.
            metaParts.push(part);
        }
    });

    // Fallback: If device not found, assuming the LAST part is the device if it contains English letters
    if (!device && parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        if (/[a-zA-Z]/.test(lastPart) && !dateRegex.test(lastPart)) {
            device = lastPart;
            // Remove this part from metaParts if it was added
            metaParts = metaParts.filter(p => p !== device);
        }
    }

    return {
        device: device, // If empty, UI handles it
        date: date,
        meta: metaParts.join(' · ')
    };
};


export const DetailView: React.FC<DetailViewProps> = ({ item, type, onNavigate, logoUrl }) => {
  const [contentImages, setContentImages] = useState<GalleryImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  
  // Blog content is now an array of objects (blocks)
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

  // --- Block Renderer ---
  const renderBlock = (block: any, idx: number) => {
      switch (block.type) {
          case 'paragraph':
              return (
                  <p key={idx} className="mb-6 leading-loose text-ink/90">
                      <RichTextRenderer content={block.content} />
                  </p>
              );
          case 'heading_1':
              return <h2 key={idx} className="text-2xl font-serif font-bold mt-10 mb-6 border-b border-stone-200 pb-2"><RichTextRenderer content={block.content} /></h2>;
          case 'heading_2':
              return <h3 key={idx} className="text-xl font-serif font-bold mt-8 mb-4"><RichTextRenderer content={block.content} /></h3>;
          case 'heading_3':
              return <h4 key={idx} className="text-lg font-serif font-bold mt-6 mb-3 text-brand-accent"><RichTextRenderer content={block.content} /></h4>;
          case 'callout':
              // Check if icon is emoji or external
              const icon = block.icon?.type === 'emoji' ? block.icon.emoji : '💡';
              return (
                  <div key={idx} className="bg-stone-50 border border-stone-200 p-4 rounded-sm flex gap-4 my-6 shadow-sm">
                      <div className="text-xl select-none">{icon}</div>
                      <div className="flex-1 text-sm leading-relaxed text-ink/80">
                         <RichTextRenderer content={block.content} />
                      </div>
                  </div>
              );
          case 'quote':
              return (
                  <blockquote key={idx} className="border-l-4 border-brand-accent pl-5 py-2 my-8 bg-stone-50/50 italic text-stone-600 font-serif text-lg">
                      <RichTextRenderer content={block.content} />
                  </blockquote>
              );
          case 'toggle':
              return (
                  <details key={idx} className="my-4 group border border-stone-200 rounded-sm bg-white open:bg-stone-50 transition-colors">
                      <summary className="cursor-pointer p-3 font-medium flex items-center gap-2 list-none select-none text-stone-700 hover:text-ink">
                         <div className="transition-transform group-open:rotate-90">
                            <ChevronRight size={16} />
                         </div>
                         <RichTextRenderer content={block.content} />
                      </summary>
                      <div className="p-3 pt-0 pl-9 text-sm text-stone-600">
                          {/* Note: Nested children not fully implemented in this demo, just placeholder or text */}
                          <p className="opacity-60 italic text-xs">[Details content]</p>
                      </div>
                  </details>
              );
          case 'image':
               return (
                   <figure key={idx} className="my-8">
                       <img src={block.src} alt="Blog Asset" className="w-full rounded-sm shadow-sm border border-stone-100" />
                       {block.caption && block.caption.length > 0 && (
                           <figcaption className="text-center mt-2 text-xs font-mono text-stone-400">
                               <RichTextRenderer content={block.caption} />
                           </figcaption>
                       )}
                   </figure>
               );
          case 'bookmark':
               return (
                   <a key={idx} href={block.url} target="_blank" rel="noopener noreferrer" className="block my-6 no-underline group">
                       <div className="border border-stone-200 rounded-sm p-4 flex justify-between items-center hover:bg-stone-50 transition-colors hover:shadow-sm">
                           <div className="overflow-hidden">
                               <div className="font-bold text-sm mb-1 truncate text-ink group-hover:text-brand-accent transition-colors">
                                   <RichTextRenderer content={block.caption.length ? block.caption : [{text: block.url}]} />
                               </div>
                               <div className="text-xs text-stone-400 font-mono truncate">{block.url}</div>
                           </div>
                           <ExternalLink size={16} className="text-stone-300 group-hover:text-brand-accent shrink-0 ml-4" />
                       </div>
                   </a>
               );
          case 'divider':
               return <hr key={idx} className="my-8 border-dashed border-stone-300" />;
          case 'list_item':
                // Simple list handling. Consecutive lists are not merged in this simple map, but good enough for demo.
               return (
                   <div key={idx} className="flex gap-2 mb-2 ml-4">
                       <span className="text-brand-accent font-bold select-none">•</span>
                       <span className="leading-relaxed"><RichTextRenderer content={block.content} /></span>
                   </div>
               );
          default:
              return null;
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-texture overflow-y-auto animate-in fade-in duration-300">
      
      {/* Navigation Bar - Scrolls with the page */}
      <NavBar onNavigate={onNavigate} activeView={type} logoUrl={logoUrl} />

      <div className="w-full max-w-[452px] mx-auto min-h-screen pb-24 pt-12">
        <div className="px-4 animate-in slide-in-from-bottom-8 duration-500 delay-100">
          
          {/* Main Ticket Container */}
          <div>
            {/* Top Jagged Edge */}
            <div className="h-4 w-full jagged-top bg-paper"></div>
            
            {/* Removed shadow-xl for flat design */}
            <TicketBase className="rounded-none bg-paper min-h-[80vh] flex flex-col border-x border-stone-200">
              
              {/* Header Metadata Section */}
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

              {/* Cover Image (Always shown) */}
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
                                      // Fallback for simple string content (demo data or legacy)
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
                          
                          {/* Fetched Images from Content - POLAROID / GALLERY STYLE */}
                          <div className="flex flex-col gap-8 mt-4">
                              
                              {loadingImages ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2 text-stone-400">
                                   <Loader2 className="animate-spin" />
                                   <span className="font-mono text-xs">Developing Photos...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-10">
                                    {displayImages.length > 0 ? displayImages.map((img, idx) => {
                                        const parsed = parseCaptionData(img.caption);
                                        return (
                                            <div key={idx} className="w-full bg-white p-3 pb-6 shadow-sm border border-stone-100/50 break-inside-avoid relative">
                                                {/* Image */}
                                                <img 
                                                    src={img.url} 
                                                    alt={parsed.meta || `Photo ${idx}`} 
                                                    className="w-full h-auto object-cover block" 
                                                />
                                                
                                                {/* Footer Info Area */}
                                                <div className="flex justify-between items-end mt-5 px-1 relative">
                                                    
                                                    {/* Left: Device & Meta */}
                                                    <div className="flex flex-col items-start gap-1 max-w-[35%] z-10">
                                                        <span className="font-sans font-bold text-sm text-ink leading-tight uppercase">
                                                            {parsed.device || 'DIGITAL'}
                                                        </span>
                                                        <span className="font-serif text-[10px] text-stone-500 leading-tight">
                                                            {parsed.meta}
                                                        </span>
                                                    </div>

                                                    {/* Center: Signature Logo */}
                                                    {logoUrl ? (
                                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 z-0 opacity-80 mix-blend-multiply">
                                                             <img src={logoUrl} alt="Signature" className="h-8 md:h-10 w-auto object-contain" />
                                                        </div>
                                                    ) : (
                                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 z-0 opacity-30">
                                                            <span className="font-serif italic text-xs">Life Frames</span>
                                                        </div>
                                                    )}

                                                    {/* Right: Date */}
                                                    <div className="flex flex-col items-end gap-1 max-w-[35%] z-10 text-right">
                                                        <span className="font-mono text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                                            {parsed.date ? 'DATE' : ''}
                                                        </span>
                                                        <span className="font-mono text-[10px] text-stone-600">
                                                            {parsed.date}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-center py-8 font-mono text-xs text-stone-400 border border-dashed border-stone-300">
                                            No additional photos found in the roll.
                                        </div>
                                    )}
                                </div>
                              )}
                          </div>

                          {/* Technical Info Box - Kept as summary */}
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

              {/* Footer Section */}
              <div className="bg-paper-dark p-6 relative mt-auto border-t-2 border-dashed border-stone-300/50">
                   <Notch className="-left-4 top-0 -translate-y-1/2" />
                   <Notch className="-right-4 top-0 -translate-y-1/2" />
                   
                   <div className="flex flex-col items-center text-center gap-4">
                       <div className="w-full flex justify-between items-center opacity-50">
                           <BarcodeVertical />
                           <div className="mx-4 flex flex-col gap-1 w-full">
                               <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
                                   {isBlog ? 'Article ID' : 'Gallery ID'}
                               </span>
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