import React, { useState } from 'react';
import { PhotoGroup } from '../types';
import { TicketBase, Notch } from './TicketUI';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

interface Props {
  groups: PhotoGroup[];
  id?: string;
  onItemClick: (group: PhotoGroup) => void;
  onViewAll?: () => void;
  title?: string;
}

// Sub-component to handle individual image loading state
const GalleryCard: React.FC<{ group: PhotoGroup; index: number; onClick: (g: PhotoGroup) => void }> = ({ group, index, onClick }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    // Eager load the first 2 images for immediate viewport visibility
    const isPriority = index < 2;

    return (
        <TicketBase 
            // Flat design: Removed shadow-ticket, using border for definition instead
            className="group cursor-pointer rounded-sm flex flex-col h-auto hover:-translate-y-1 transition-transform duration-300"
        >
            <div onClick={() => onClick(group)} className="flex flex-col h-full">
                {/* Image Area */}
                <div className="relative w-full aspect-video overflow-hidden rounded-t-sm bg-stone-200">
                    <img 
                        src={group.coverUrl} 
                        alt={group.title}
                        loading={isPriority ? "eager" : "lazy"}
                        decoding={isPriority ? "auto" : "async"}
                        onLoad={() => setIsLoaded(true)}
                        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 filter grayscale-[20%] group-hover:grayscale-0 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <div className="absolute top-4 left-4 bg-paper/90 text-ink text-[10px] font-mono px-2 py-1 shadow-sm">
                        No. {group.ticketNumber}
                    </div>
                </div>

                {/* Stub Area */}
                <div className="bg-paper p-5 relative border-t-2 border-dashed border-stone-200 rounded-b-sm flex-grow flex flex-col justify-between">
                    {/* Decorative Half Circles (Tear marks) */}
                    <Notch className="-left-4 top-0 -translate-y-1/2" />
                    <Notch className="-right-4 top-0 -translate-y-1/2" />

                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-serif font-bold text-xl leading-tight mb-1 group-hover:text-brand-accent transition-colors">
                                {group.title}
                            </h3>
                            <p className="font-mono text-[10px] text-stone-500 uppercase tracking-widest">{group.location}</p>
                        </div>
                        <ArrowUpRight size={18} className="text-stone-400 group-hover:text-brand-accent transition-colors" />
                    </div>

                    <div className="flex justify-between items-end border-t border-stone-100 pt-3">
                        <div className="flex flex-col">
                             <span className="text-[9px] font-mono text-stone-400 uppercase">Count</span>
                             <span className="font-serif text-sm">{group.count} Frames</span>
                        </div>
                        <div className="flex flex-col text-right">
                             <span className="text-[9px] font-mono text-stone-400 uppercase">Date</span>
                             <span className="font-mono text-xs">{group.date}</span>
                        </div>
                    </div>
                </div>
            </div>
        </TicketBase>
    );
};

export const GallerySection: React.FC<Props> = ({ groups, id, onItemClick, onViewAll, title = "影像辑" }) => {
  return (
    <section id={id} className="mb-16 scroll-mt-24 w-full">
      <div className="flex items-end justify-between mb-6 px-2">
         <div className="flex items-end gap-3">
            <h2 className="font-serif text-2xl font-bold text-ink">{title}</h2>
            <span className="font-mono text-xs text-stone-500 mb-1">/ GALLERY</span>
         </div>
         {onViewAll && (
             <button onClick={onViewAll} className="inline-flex items-center gap-1 font-mono text-[10px] text-stone-400 hover:text-ink transition-colors pb-1">
                 VIEW ALL <ArrowRight size={10} />
             </button>
         )}
      </div>

      {/* Single Column Ticket Stack */}
      <div className="flex flex-col gap-8 w-full">
        {groups.map((group, idx) => (
            <GalleryCard 
                key={group.id} 
                group={group} 
                index={idx} 
                onClick={onItemClick} 
            />
        ))}
      </div>
    </section>
  );
};