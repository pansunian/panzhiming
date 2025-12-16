import React from 'react';
import { Thought } from '../types';
import { BarcodeHorizontal } from './TicketUI';
import { ArrowRight } from 'lucide-react';

interface Props {
  thoughts: Thought[];
  id?: string;
  onViewAll?: () => void;
}

export const ThoughtSection: React.FC<Props> = ({ thoughts, id, onViewAll }) => {
  return (
    <section id={id} className="mb-24 flex flex-col items-center w-full scroll-mt-12">
      <div className="flex items-end justify-between mb-8 px-2 w-full">
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
          {/* Receipt Top */}
          <div className="h-2 w-full jagged-top bg-paper"></div>
          
          <div className="bg-paper px-6 py-8 border-x border-stone-100">
              {/* Header */}
              <div className="text-center border-b border-dashed border-stone-300 pb-6 mb-6">
                  <h3 className="font-serif font-bold text-lg mb-1 tracking-widest">思维碎片商店</h3>
                  <div className="flex justify-between text-[9px] font-mono text-stone-400 mt-2 uppercase">
                      <span>Store No. 2049</span>
                      <span>{new Date().toDateString()}</span>
                  </div>
              </div>

              {/* Items */}
              <div className="space-y-8 font-mono text-sm">
                  {thoughts.map((thought) => (
                      <div key={thought.id} className="group">
                          <div className="flex justify-between text-[9px] text-stone-400 mb-2">
                              <span>ITEM #{thought.id.padStart(4, '0')}</span>
                              <span>{thought.date} {thought.time}</span>
                          </div>
                          <p className="font-serif text-ink text-[15px] leading-7 text-justify mb-2">
                              {thought.content}
                          </p>
                          <div className="flex justify-start gap-2 opacity-60">
                               {thought.tags.map(tag => (
                                   <span key={tag} className="text-[9px] text-stone-500 border border-stone-200 px-1 rounded-sm">#{tag}</span>
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

          {/* Receipt Bottom */}
          <div className="h-3 w-full jagged-bottom bg-paper"></div>
      </div>
    </section>
  );
};