import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { BlogPost, PhotoGroup } from '../types';
import { TicketBase, DashedLine, Notch, BarcodeVertical } from './TicketUI';
import { NavBar } from './NavBar';
import { Clock, MapPin, Camera, Loader2 } from 'lucide-react';

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

const BrandLogotype = ({ deviceString, className = "" }: { deviceString: string, className?: string }) => {
    const s = deviceString.toLowerCase();
    const baseClass = `h-3.5 w-auto object-contain select-none opacity-90 ${className}`;

    if (s.includes('apple') || s.includes('iphone')) {
        return <img src="/fonts/apple.svg" alt="Apple" className={baseClass} />;
    }
    if (s.includes('sony') || s.includes('ilce') || s.includes('alpha')) {
        return <img src="/fonts/logo-sony.svg" alt="Sony" className={baseClass} />;
    }
    if (s.includes('canon')) return <span className="font-serif font-bold tracking-wide text-[13px] italic text-ink leading-none">Canon</span>;
    if (s.includes('nikon')) return <span className="font-sans font-black italic tracking-tighter uppercase text-[14px] text-ink leading-none">Nikon</span>;
    if (s.includes('fuji')) return <span className="font-sans font-bold uppercase tracking-widest text-[11px] text-ink leading-none">FUJIFILM</span>;
    if (s.includes('leica')) return <span className="font-serif font-bold text-[#e41e26] text-[12px] leading-none">Leica</span>;
    
    return <span className="font-mono font-bold uppercase text-[11px] opacity-40 leading-none">{deviceString.split(' ')[0] || 'DIGITAL'}</span>;
};

const parseCaptionData = (caption: string) => {
    if (!caption) return { device: '', date: '', locationMain: '', locationSub: '' };
    const parts = caption.split(/\||｜/).map(s => s.trim()).filter(Boolean);
    let device = '', date = '', others = [];
    const deviceKeywords = ['SONY', 'Sony', 'Canon', 'Nikon', 'Fuji', 'Leica', 'Apple', 'iPhone', 'Panasonic', 'Lumix', 'Ricoh', 'Hasselblad', 'Olympus'];
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
        <div className="w-full bg-white mb-24 last:mb-0">
             <div className={`w-full relative overflow-hidden ${aspectClass} rounded-sm`}>
                <img 
                    src={img.url} 
                    alt={parsed.locationMain} 
                    className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
                    onLoad={handleImageLoad} 
                />
             </div>
             {/* 印刷级元数据栏 */}
             <div className="flex justify-between items-start mt-6 px-1">
                  <div className="flex items-center gap-4">
                      <div className="flex items-center h-4">
                          <BrandLogotype deviceString={parsed.device || 'Digital'} />
                      </div>
                      <div className="w-[1px] h-4 bg-stone-200"></div>
                      <span className="font-mono text-[9px] font-bold text-stone-300 tracking-[0.2em]">{parsed.device ? 'EXIF' : 'SCAN'}</span>
                  </div>
                  <div className="flex flex-col items-end text-right">
                      <span className="font-serif font-bold text-sm text-ink leading-none">{parsed.locationMain || 'Untitled Shot'}</span>
                      <span className="text-[9px] font-mono text-stone-400 mt-2 uppercase tracking-widest">
                          {parsed.date || '---'} / {parsed.locationSub || 'Unknown Area'}
                      </span>
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
  const [blogBlocks, setBlogBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
            } catch (e) {} finally { setLoading(false); }
        };
        fetchData();
    }
  }, [item?.id]);

  if (!item && !loading) return <Navigate to="/" replace />;

  const isBlog = type === 'blog';
  const blogPost = item as BlogPost;
  const photoGroup = item as PhotoGroup;

  return (
    <div className="min-h-screen w-full flex flex-col bg-texture">
      <NavBar logoUrl={logoUrl} />
      <div className="w-full max-w-[420px] mx-auto pb-24 pt-12">
            <div className="px-4">
                <div className="h-4 w-full jagged-top bg-paper"></div>
                <TicketBase className="rounded-none bg-paper min-h-[80vh] border-x border-stone-200">
                    <div className="p-8 pb-6 relative">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-col">
                                <span className="font-mono text-[9px] text-stone-400 uppercase tracking-[0.2em] mb-1">{isBlog ? (blogPost?.category || 'Blog') : 'GALLERY'}</span>
                                <span className="font-mono text-xs font-bold text-ink bg-stone-100 px-2 py-0.5 inline-block rounded-sm">{isBlog ? blogPost?.date : photoGroup?.ticketNumber}</span>
                            </div>
                            <div className="border border-stone-200 px-2 py-1 flex items-center gap-1.5 opacity-60">
                                {isBlog ? <Clock size={10} /> : <Camera size={10} />}
                                <span className="font-mono text-[9px] font-bold uppercase">{isBlog ? blogPost?.readTime : `${photoGroup?.count} SHOTS`}</span>
                            </div>
                        </div>
                        <h1 className="font-serif font-bold text-3xl text-ink leading-tight mb-6">{item?.title || 'Loading...'}</h1>
                        <DashedLine className="mt-8 opacity-20" />
                        <Notch className="-left-4 bottom-[-1px] translate-y-1/2" />
                        <Notch className="-right-4 bottom-[-1px] translate-y-1/2" />
                    </div>
                    {(isBlog ? blogPost?.imageUrl : photoGroup?.coverUrl) && (
                        <div className="relative w-full aspect-[16/9] bg-stone-100 overflow-hidden">
                            <img src={isBlog ? blogPost.imageUrl : photoGroup.coverUrl} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="p-8 pt-10">
                        <Notch className="-left-4 top-0 -translate-y-1/2" />
                        <Notch className="-right-4 top-0 -translate-y-1/2" />
                        {loading ? (
                            <div className="flex flex-col items-center py-20 text-stone-300 font-mono text-[10px] tracking-widest"><Loader2 className="animate-spin mb-3" size={16} />LOADING CONTENT...</div>
                        ) : (
                            <>
                                {blogBlocks.map((block, idx) => (
                                    block.type === 'paragraph' ? <p key={idx} className="mb-6 leading-loose text-ink/90 font-serif text-[15px]">{block.content.map(t => t.text).join('')}</p> : null
                                ))}
                                {!isBlog && contentImages.map((img, idx) => <GalleryItem key={idx} img={img} />)}
                            </>
                        )}
                    </div>
                    <div className="bg-paper-dark p-8 border-t border-dashed border-stone-300/50">
                        <Notch className="-left-4 top-0 -translate-y-1/2" />
                        <Notch className="-right-4 top-0 -translate-y-1/2" />
                        <div className="flex justify-between items-center opacity-30">
                            <BarcodeVertical />
                            <div className="flex flex-col gap-1 text-center">
                                <span className="font-serif text-[11px] font-bold tracking-[0.3em]">先见志明</span>
                                <span className="font-mono text-[8px] tracking-[0.4em] uppercase">END OF TICKET</span>
                            </div>
                            <BarcodeVertical />
                        </div>
                    </div>
                </TicketBase>
                <div className="h-4 w-full jagged-bottom bg-paper-dark"></div>
            </div>
      </div>
    </div>
  );
};