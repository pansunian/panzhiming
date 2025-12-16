import React, { useEffect, useState } from 'react';
import { BlogPost, PhotoGroup } from '../types';
import { TicketBase, DashedLine, Notch, BarcodeHorizontal, BarcodeVertical } from './TicketUI';
import { NavBar } from './NavBar';
import { Clock, MapPin, Camera, Aperture, Loader2 } from 'lucide-react';

interface DetailViewProps {
  item: BlogPost | PhotoGroup;
  type: 'blog' | 'gallery';
  onNavigate: (view: 'home' | 'gallery' | 'thoughts' | 'blog') => void;
  logoUrl?: string;
}

export const DetailView: React.FC<DetailViewProps> = ({ item, type, onNavigate, logoUrl }) => {
  const [contentImages, setContentImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch images from page content if it's a gallery item
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

  const isBlog = type === 'blog';
  const blogPost = item as BlogPost;
  const photoGroup = item as PhotoGroup;
  
  // Use images from props (cover) + fetched images
  const displayImages = type === 'gallery' ? contentImages : [];

  return (
    <div className="fixed inset-0 z-50 bg-texture overflow-y-auto animate-in fade-in duration-300">
      
      {/* Consistent Navigation Bar */}
      <NavBar onNavigate={onNavigate} activeView={type} logoUrl={logoUrl} />

      <div className="w-full max-w-2xl mx-auto min-h-screen pb-24 pt-12">
        <div className="px-4 animate-in slide-in-from-bottom-8 duration-500 delay-100">
          
          {/* Main Ticket Container */}
          <div>
            {/* Top Jagged Edge */}
            <div className="h-4 w-full jagged-top bg-paper"></div>
            
            <TicketBase className="rounded-none bg-paper min-h-[80vh] flex flex-col border-x border-stone-200 shadow-xl">
              
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
                      <div className="prose prose-stone max-w-none prose-p:font-serif prose-p:text-ink prose-p:leading-loose prose-headings:font-serif prose-img:rounded-sm">
                          {blogPost.content?.map((paragraph, idx) => (
                              <p key={idx} className="mb-6 first-letter:text-4xl first-letter:font-bold first-letter:mr-1 first-letter:float-left first-letter:font-serif">
                                  {paragraph}
                              </p>
                          )) || <p>{blogPost.excerpt}</p>}
                      </div>
                  ) : (
                      <div className="flex flex-col gap-6">
                          <p className="font-serif text-lg md:text-xl leading-relaxed italic border-l-2 border-brand-accent pl-6 text-stone-600 bg-stone-50 py-4 pr-4">
                              {photoGroup.description || "No description available."}
                          </p>
                          
                          {/* Fetched Images from Content */}
                          <div className="flex flex-col gap-6 mt-8">
                              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 border-b border-stone-100 pb-2">
                                  Film Roll Sequence
                              </span>
                              
                              {loadingImages ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2 text-stone-400">
                                   <Loader2 className="animate-spin" />
                                   <span className="font-mono text-xs">Developing Photos...</span>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {displayImages.length > 0 ? displayImages.map((img, idx) => (
                                        <div key={idx} className="w-full relative group break-inside-avoid">
                                            {/* Photo Frame Style */}
                                            <div className="p-2 bg-white border border-stone-200 shadow-sm transition-transform hover:scale-[1.01] duration-500">
                                                <img src={img} alt="" className="w-full h-auto filter grayscale-[10%] contrast-[1.05]" />
                                            </div>
                                            <div className="flex justify-between items-center mt-2 px-1">
                                                <span className="font-mono text-[8px] text-stone-400">FRAME {String(idx + 1).padStart(2, '0')}</span>
                                                <span className="font-mono text-[8px] text-stone-300">FUJIFILM</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-full text-center py-8 font-mono text-xs text-stone-400 border border-dashed border-stone-300">
                                            No additional photos found in the roll.
                                        </div>
                                    )}
                                </div>
                              )}
                          </div>

                          {/* Technical Info Box */}
                          <div className="border border-stone-200 bg-[#fdfbf7] p-4 mt-8 relative overflow-hidden">
                              <div className="absolute right-0 top-0 opacity-5">
                                  <BarcodeHorizontal className="h-12 w-24 rotate-[-15deg] translate-x-4 -translate-y-2" />
                              </div>

                              <div className="flex items-center gap-2 mb-3 border-b border-dashed border-stone-200 pb-2">
                                  <Aperture size={14} className="text-stone-400" />
                                  <span className="font-mono text-xs font-bold text-stone-500">EXIF DATA</span>
                              </div>
                              <div className="grid grid-cols-2 gap-y-4 gap-x-2 font-mono text-[10px] text-stone-500">
                                  <div>
                                      <p className="opacity-50 text-[8px] tracking-widest uppercase">CAMERA</p>
                                      <p className="text-ink">Fujifilm X100V</p>
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