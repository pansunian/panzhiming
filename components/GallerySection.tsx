import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PhotoGroup } from '../types';
import { TicketBase, Notch, DashedLine } from './TicketUI';
import { ArrowUpRight, ArrowRight, MapPin } from 'lucide-react';

interface Props {
  groups: PhotoGroup[];
  onViewAll?: boolean;
  title?: string;
}

const GalleryCard: React.FC<{ group: PhotoGroup; index: number }> = ({ group, index }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    return (
        <Link 
            to={`/gallery/${group.id}`}
            className="group cursor-pointer flex flex-col h-auto hover:-translate-y-1 transition-transform duration-300 mb-4"
        >
            <div className="flex flex-col h-full relative">
                {/* 封面区 */}
                <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-sm bg-stone-200">
                    <img 
                        src={group.coverUrl} 
                        alt={group.title} 
                        onLoad={() => setIsLoaded(true)} 
                        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
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
                            <h3 className="font-serif font-bold text-xl leading-tight mb-2 group-hover:text-brand-accent transition-colors">{group.title}</h3>
                            <div className="flex items-center gap-1.5 opacity-50">
                                <MapPin size={10} className="text-stone-500" />
                                <p className="font-mono text-[9px] text-stone-600 uppercase tracking-widest">{group.location}</p>
                            </div>
                        </div>
                        <ArrowUpRight size={18} className="text-stone-300 group-hover:text-brand-accent transition-colors" />
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-stone-100 pt-4 mt-auto">
                        <div className="flex flex-col">
                             <span className="text-[8px] font-mono text-stone-300 uppercase tracking-widest mb-1">Quantity</span>
                             <span className="font-serif text-sm font-bold">{group.count} Frames</span>
                        </div>
                        <div className="flex flex-col text-right">
                             <span className="text-[8px] font-mono text-stone-300 uppercase tracking-widest mb-1">Issue Date</span>
                             <span className="font-mono text-[10px] font-bold text-stone-500">{group.date}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export const GallerySection: React.FC<Props> = ({ groups, onViewAll, title = "影像辑" }) => {
  return (
    <section className="scroll-mt-24 w-full">
      <div className="flex items-end justify-between mb-8 px-2">
         <div className="flex items-end gap-3">
            <h2 className="font-serif text-2xl font-bold text-ink">{title}</h2>
            <span className="font-mono text-[10px] text-stone-400 mb-1 tracking-widest">/ GALLERY</span>
         </div>
         {onViewAll && (
             <Link to="/gallery" className="inline-flex items-center gap-1 font-mono text-[9px] text-stone-400 hover:text-ink transition-colors pb-1 tracking-widest">
                 VIEW ALL <ArrowRight size={10} />
             </Link>
         )}
      </div>
      <div className="flex flex-col gap-12 w-full">
        {groups.map((group, idx) => <GalleryCard key={group.id} group={group} index={idx} />)}
      </div>
    </section>
  );
};