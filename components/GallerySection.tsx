import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NavLink, PhotoGroup } from '../types';
import { TicketBase, Notch, DashedLine } from './TicketUI';
import { ArrowUpRight, ArrowRight, MapPin } from 'lucide-react';
import { optimizeImage } from '../utils/imageOptimizer';
import { InlineTicketNav } from './NavBar';

interface Props {
  groups: PhotoGroup[];
  onViewAll?: boolean;
  title?: string;
  logoUrl?: string;
  showPageNav?: boolean;
  navLinks?: NavLink[];
}

const GalleryCard: React.FC<{ group: PhotoGroup; index: number }> = ({ group, index }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    
    // 列表封面图不需要全尺寸，640px 足够清晰
    const optimizedCover = optimizeImage(group.coverUrl, 640);

    return (
        <Link 
            to={`/gallery/${group.id}`}
            className="group cursor-pointer flex flex-col h-auto hover:-translate-y-1 transition-transform duration-300 mb-4"
        >
            <div className="flex flex-col h-full relative">
                {/* 封面区 */}
                <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-sm bg-stone-200">
                    <img 
                        src={optimizedCover} 
                        alt={group.title} 
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setIsLoaded(true)} 
                        className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
                    />
                    <div className="absolute top-4 left-4 bg-paper/95 text-ink text-[9px] font-mono px-2 py-1.5 shadow-sm uppercase tracking-widest">
                        No. {group.ticketNumber}
                    </div>
                </div>
                
                {/* 核心腰线实现：虚线 + 左右半圆打孔 */}
                <div className="relative bg-paper px-6 py-6 border-x border-stone-200/50 flex-grow">
                    <DashedLine className="absolute top-0 left-4 right-4 opacity-30" />
                    <Notch className="-left-4 top-0 -translate-y-1/2" />
                    <Notch className="-right-4 top-0 -translate-y-1/2" />
                    
                    <div className="flex justify-between items-start mb-6 pt-2">
                        <div>
                            <h3 className="font-serif font-medium text-lg leading-tight mb-2 group-hover:text-brand-accent transition-colors">{group.title}</h3>
                            <div className="flex items-center gap-1.5 opacity-50">
                                <MapPin size={10} className="text-stone-500" />
                                <p className="font-mono text-[9px] text-stone-600 uppercase tracking-widest">{group.location}</p>
                            </div>
                        </div>
                        <ArrowUpRight size={18} className="text-stone-300 group-hover:text-brand-accent transition-colors" />
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-stone-100 pt-4 mt-auto">
                        <div className="flex flex-col">
                             <span className="text-[8px] font-mono text-stone-300 uppercase tracking-widest mb-1">影片数量</span>
                             <span className="font-serif text-sm font-medium">{group.count} SHOTS</span>
                        </div>
                        <div className="flex flex-col text-right">
                             <span className="text-[8px] font-mono text-stone-300 uppercase tracking-widest mb-1">更新日期</span>
                             <span className="font-mono text-[10px] font-bold text-stone-500">{group.date}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

const formatDiaryDate = (date?: string) => {
    if (!date) return { day: '--', meta: '日期未知' };

    const parsed = new Date(date.replace(/\./g, '-'));
    if (Number.isNaN(parsed.getTime())) {
        const parts = date.match(/(\d{1,2})$/);
        return { day: parts?.[1] || '--', meta: date };
    }

    const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][parsed.getDay()];
    return {
        day: String(parsed.getDate()).padStart(2, '0'),
        meta: `${parsed.getMonth() + 1}月 / ${week}`
    };
};

const GalleryDiaryCard: React.FC<{ group: PhotoGroup; index: number }> = ({ group, index }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const optimizedCover = optimizeImage(group.coverUrl, 720);
    const date = formatDiaryDate(group.date);

    return (
        <Link
            to={`/gallery/${group.id}`}
            className="group block bg-paper border border-stone-200/45 transition-colors duration-300 hover:border-brand-accent/30"
        >
            <div className="grid grid-cols-[72px_minmax(0,1fr)] sm:grid-cols-[82px_minmax(0,1fr)]">
                <div className="relative border-r border-dashed border-stone-200/80 px-4 pt-5">
                    <div className="font-mono text-[2rem] leading-none tracking-[-0.04em] text-ink">
                        {date.day}
                    </div>
                    <div className="mt-1 font-mono text-[8px] leading-tight tracking-[0.08em] text-stone-400">
                        {date.meta}
                    </div>
                    <div className="absolute left-1/2 top-[42%] h-3 w-3 -translate-x-1/2 rounded-full border border-stone-200 bg-bg" />
                    <div className="absolute left-1/2 top-[57%] h-3 w-3 -translate-x-1/2 rounded-full border border-stone-200 bg-bg" />
                </div>

                <div className="min-w-0 px-4 py-4">
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-paper-dark">
                        <img
                            src={optimizedCover}
                            alt={group.title}
                            loading="lazy"
                            decoding="async"
                            onLoad={() => setIsLoaded(true)}
                            className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-[1.02] ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                        />
                        <div className="absolute right-2 top-2 rounded-full border border-paper/60 bg-paper/65 px-1.5 py-0.5 font-mono text-[8px] tracking-widest text-stone-500">
                            {String(index + 1).padStart(2, '0')}
                        </div>
                    </div>

                    <div className="mt-3 border-t border-dashed border-stone-200/80 pt-3">
                        <h3 className="font-serif text-[15px] font-medium leading-snug text-ink transition-colors group-hover:text-brand-accent line-clamp-2">
                            {group.title}
                        </h3>
                        <div className="mt-2 flex items-end justify-between gap-3">
                            <p className="font-serif text-xs leading-relaxed text-stone-500 line-clamp-2">
                                {group.description || `${group.count} 张影像，记录一个现场。`}
                            </p>
                            <div className="shrink-0 text-right">
                                <div className="font-mono text-[8px] tracking-widest text-stone-300">
                                    {group.count} SHOTS
                                </div>
                                <div className="mt-1 flex items-center justify-end gap-1 font-mono text-[8px] tracking-wider text-stone-400">
                                    <MapPin size={9} />
                                    <span className="max-w-[92px] truncate">{group.location}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export const GalleryDiarySection: React.FC<Props> = ({ groups, onViewAll, title = "影像日记" }) => {
  if (!groups.length) return null;

  return (
    <section className="scroll-mt-24 w-full">
      <div className="flex items-end justify-between mb-6 px-2">
         <div className="flex items-end gap-3">
            <h2 className="font-serif text-[1.25rem] font-medium leading-tight text-ink">{title}</h2>
            <span className="font-mono text-[9px] text-stone-400 mb-1 tracking-widest">/ PHOTO DIARY</span>
         </div>
         {onViewAll && (
             <Link to="/gallery" className="inline-flex items-center gap-1 font-mono text-[9px] text-stone-400 hover:text-ink transition-colors pb-1 tracking-widest">
                 更多 <ArrowRight size={10} />
             </Link>
         )}
      </div>
      <div className="flex flex-col gap-6 w-full">
        {groups.map((group, idx) => <GalleryDiaryCard key={group.id} group={group} index={idx} />)}
      </div>
    </section>
  );
};

export const GallerySection: React.FC<Props> = ({ groups, onViewAll, title = "影像辑", logoUrl, showPageNav, navLinks }) => {
  return (
    <section className="scroll-mt-24 w-full">
      {showPageNav && (
        <div className="-mx-2 mb-10 sm:mx-0">
          <div className="relative z-40">
            <div className="ticket-nav-sheet absolute inset-0 bg-paper sm:bg-paper/95 pointer-events-none" aria-hidden="true" />
            <div className="relative px-4 pt-4 pb-6">
              <InlineTicketNav logoUrl={logoUrl} navLinks={navLinks} />
              <div className="mt-3 border-t border-dashed border-stone-300/70" />
            </div>
          </div>
        </div>
      )}
      <div className="flex items-end justify-between mb-8 px-2">
         <div className="flex items-end gap-3">
            <h2 className="font-serif text-[1.35rem] font-medium leading-tight text-ink">{title}</h2>
            <span className="font-mono text-[10px] text-stone-400 mb-1 tracking-widest">/ GALLERY</span>
         </div>
         {onViewAll && (
             <Link to="/gallery" className="inline-flex items-center gap-1 font-mono text-[9px] text-stone-400 hover:text-ink transition-colors pb-1 tracking-widest">
                 更多 <ArrowRight size={10} />
             </Link>
         )}
      </div>
      <div className="flex flex-col gap-12 w-full">
        {groups.map((group, idx) => <GalleryCard key={group.id} group={group} index={idx} />)}
      </div>
    </section>
  );
};
