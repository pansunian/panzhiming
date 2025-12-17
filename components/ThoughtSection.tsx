import React from 'react';
import { Thought } from '../types';
import { BarcodeHorizontal, Notch, DashedLine } from './TicketUI';
import { ArrowRight } from 'lucide-react';

interface Props {
  thoughts: Thought[];
  id?: string;
  onViewAll?: () => void;
}

export const ThoughtSection: React.FC<Props> = ({ thoughts, id, onViewAll }) => {
  return (
    <section id={id} className="mb-24 flex flex-col items-center w-full scroll-mt-12">
      
      {/* Title Header - Updated px-5 to px-2 for consistent alignment */}
      <div className="flex items-end justify-between px-2 py-6 w-full border-b border-dashed border-stone-200 relative">
         <div className="flex items-end gap-3">
            <h2 className="font-serif text-2xl font-bold text-ink">碎碎念</h2>
            <span className="font-mono text-xs text-stone-500 mb-1">/ THOUGHTS</span>
         </div>
         {onViewAll && (
             <button onClick={onViewAll} className="inline-flex items-center gap-1 font-mono text-[10px] text-stone-400 hover:text-ink transition-colors pb-1">
                 READ ALL <ArrowRight size={10} />
             </button>
         )}
      </div>

      <div className="w-full">
          
          <div className="bg-paper px-6 py-8">
              {/* Header */}
              <div className="text-center border-b border-dashed border-stone-300 pb-6 mb-6">
                  <h3 className="font-serif font-bold text-lg mb-1 tracking-widest">思维碎片商店</h3>
                  <div className="flex justify-between text-[9px] font-mono text-stone-400 mt-2 uppercase">
                      <span>Store No. 2049</span>
                      <span>{new Date().toDateString()}</span>
                  </div>
              </div>

              {/* Items */}
              <div className="space-y-8">
                  {thoughts.map((thought, index) => (
                      <div key={thought.id} className="group">
                          <div className="flex justify-between items-baseline mb-2">
                              {/* Updated: Changed font-sans to font-[system-ui,sans-serif] for clearer numbering */}
                              <span className="text-[10px] text-stone-300 font-[system-ui,sans-serif] tracking-widest">
                                  {String(index + 1).padStart(3, '0')}
                              </span>
                              <span className="text-[9px] font-mono text-stone-400">{thought.date} {thought.time}</span>
                          </div>
                          <p className="font-serif text-ink text-[15px] leading-7 text-justify mb-2">
                              {thought.content}
                          </p>
                          <div className="flex justify-start gap-2 opacity-60">
                               {thought.tags.map(tag => (
                                   /* Updated: Added font-[system-ui,sans-serif] for clearer tags */
                                   <span key={tag} className="text-[9px] text-stone-500 border border-stone-200 px-1 rounded-sm font-[system-ui,sans-serif]">#{tag}</span>
                               ))}
                          </div>
                      </div>
                  ))}
              </div>

              {/* Footer */}
              <div className="border-t border-dashed border-stone-300 mt-8 pt-6 text-center">
                  <div className="flex justify-between font-bold mb-6 font-mono text-xs border-b border-stone-100 pb-4">
                      <span>TOTAL ITEMS</span>
                      <span>{thoughts.length}</span>
                  </div>
                  <BarcodeHorizontal className="w-full h-10 justify-center opacity-40 mb-2" />
                  <p className="font-serif italic text-[10px] text-stone-400 mt-2">Thanks for visiting</p>
              </div>
          </div>
      </div>
    </section>
  );
};