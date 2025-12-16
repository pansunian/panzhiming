import React from 'react';
import { PhotoGroup } from '../types';
import { TicketBase, Notch } from './TicketUI';
import { ArrowUpRight } from 'lucide-react';

interface Props {
  groups: PhotoGroup[];
  id?: string;
  onItemClick: (group: PhotoGroup) => void;
}

export const GallerySection: React.FC<Props> = ({ groups, id, onItemClick }) => {
  return (
    <section id={id} className="mb-24 scroll-mt-12">
      <div className="flex items-end gap-4 mb-8 px-2">
         <h2 className="font-serif text-2xl font-bold text-ink">影像辑</h2>
         <span className="font-mono text-xs text-stone-500 mb-1">/ COLLECTIONS</span>
      </div>

      {/* Force single column for vertical scroll experience */}
      <div className="grid grid-cols-1 gap-8">
        {groups.map((group, idx) => (
          <TicketBase 
            key={group.id} 
            // Updated: Removed 'border border-stone-200'
            className="group cursor-pointer rounded-sm flex flex-col h-auto"
          >
            <div onClick={() => onItemClick(group)}>
                {/* Image Area - Full Width */}
                <div className="relative w-full aspect-video overflow-hidden rounded-t-sm">
                    <img 
                        src={group.coverUrl} 
                        alt={group.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale-[20%] group-hover:grayscale-0"
                    />
                    <div className="absolute top-4 left-4 bg-paper/90 text-ink text-[10px] font-mono px-2 py-1 shadow-sm">
                        No. {group.ticketNumber}
                    </div>
                </div>

                {/* Stub Area */}
                <div className="bg-paper p-5 relative border-t-2 border-dashed border-stone-200 rounded-b-sm">
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
        ))}
      </div>
    </section>
  );
};