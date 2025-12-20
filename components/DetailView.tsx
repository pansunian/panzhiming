import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { BlogPost, PhotoGroup } from '../types';
import { TicketBase, DashedLine, Notch, BarcodeVertical } from './TicketUI';
import { NavBar } from './NavBar';
import { Clock, Camera, Loader2 } from 'lucide-react';

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

const BrandLabel = ({ deviceString }: { deviceString: string }) => {
    const s = deviceString.toLowerCase();
    // 品牌标识也统一缩小字号，保持与第一行文字对齐
    if (s.includes('apple') || s.includes('iphone')) return <span className="font-sans font-normal tracking-tight text-[10px] text-ink">APPLE</span>;
    if (s.includes('sony')) return <span className="font-sans font-normal tracking-[0.1em] text-[10px] text-ink">SONY</span>;
    if (s.includes('canon')) return <span className="font-sans font-normal italic text-[10px] text-ink">Canon</span>;
    if (s.includes('nikon')) return <span className="font-sans font-normal italic tracking-tighter uppercase text-[11px] text-ink">NIKON</span>;
    if (s.includes('fuji')) return <span className="font-sans font-normal uppercase tracking-widest text-[9px] text-ink">FUJIFILM</span>;
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
        <div className="w-full bg-white mb-20 last:mb-0">
             <div className={`w-full relative overflow-hidden ${aspectClass} rounded-sm`}>
                <img src={img.url} alt={parsed.locationMain} className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={handleImageLoad} />
             </div>
             
             {/* 影像元数据样式：第一行 10px, 无衬线, 不加粗, 黑色 */}
             <div className="flex justify-between items-start mt-4 px-1 pb-2"> {/* pb-2 保证整体文本区域距离下方 8px */}
                  {/* 左侧：设备型号 + 日期 */}
                  <div className="flex flex-col">
                      <span className="font-sans font-normal text-[10px] text-ink uppercase tracking-tight leading-none">{parsed.device || 'Digital Camera'}</span>
                      <span className="font-sans text-[9px] text-stone-400 mt-1">{parsed.date || 'Unknown Date'}</span>
                  </div>
                  
                  {/* 右侧：品牌标识 | 地点信息 */}
                  <div className="flex items-center gap-4">
                      <div className="flex items-center">
                          <BrandLabel deviceString={parsed.device || 'Digital'} />
                      </div>
                      
                      {/* 分割线 */}
                      <div className="w-[1px] h-6 bg-stone-200"></div>
                      
                      {/* 地点块 */}
                      <div className="flex flex-col text-right">
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
                    {/* Header Section */}
                    <div className="p-8 pb-8 relative">
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
                        <h1 className="font-serif font-bold text-2xl text-ink leading-snug mb-8 pr-4">{item?.title || 'Loading...'}</h1>
                        <DashedLine className="opacity-10" />
                    </div>

                    {/* Image Section - Removed top notches, kept bottom notches */}
                    {displayImage && (
                        <div className="relative w-full aspect-[16/9] bg-stone-100 overflow-visible">
                            <img src={displayImage} className="w-full h-full object-cover" alt="Cover" />
                            {/* 仅在图片底部保留打孔，衔接内容区 */}
                            <Notch className="-left-4 bottom-0 translate-y-1/2" />
                            <Notch className="-right-4 bottom-0 translate-y-1/2" />
                        </div>
                    )}

                    {/* Content Section */}
                    <div className="p-8 pt-10">
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

                    {/* Footer Section - Notches at the waistline junction */}
                    <div className="bg-paper-dark p-8 border-t border-dashed border-stone-300/50 mt-12 relative">
                        {/* 条形码色块腰线处的打孔效果 */}
                        <Notch className="-left-4 top-0 -translate-y-1/2" />
                        <Notch className="-right-4 top-0 -translate-y-1/2" />
                        
                        <div className="flex justify-between items-center opacity-30">
                            <BarcodeVertical />
                            <div className="flex flex-col gap-1 text-center">
                                <span className="font-serif text-[10px] font-bold tracking-[0.3em]">先见志明</span>
                                <span className="font-mono text-[7px] tracking-[0.4em] uppercase">END OF TICKET</span>
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