import React from 'react';
import { Link } from 'react-router-dom';
import { NavLink, Thought } from '../types';
import { BarcodeHorizontal } from './TicketUI';
import { ArrowRight } from 'lucide-react';
import { InlineTicketNav } from './NavBar';

interface Props {
  thoughts: Thought[];
  showViewAll?: boolean;
  logoUrl?: string;
  showPageNav?: boolean;
  navLinks?: NavLink[];
}

export const ThoughtSection: React.FC<Props> = ({ thoughts, showViewAll, logoUrl, showPageNav, navLinks }) => {
  return (
    <section className="flex flex-col items-center w-full scroll-mt-12">
      {showPageNav && (
        <div className="-mx-2 w-[calc(100%+1rem)] pb-10 sm:mx-0 sm:w-full">
          <div className="relative z-40">
            <div className="ticket-nav-sheet absolute inset-0 bg-[#fdfbf7] sm:bg-paper/95 pointer-events-none" aria-hidden="true" />
            <div className="relative px-4 pt-4 pb-6">
              <InlineTicketNav logoUrl={logoUrl} navLinks={navLinks} />
              <div className="mt-3 border-t border-dashed border-stone-300/70" />
            </div>
          </div>
        </div>
      )}
      <div className="flex items-end justify-between px-2 py-6 w-full border-b border-dashed border-stone-200 relative">
         <div className="flex items-end gap-3">
            <h2 className="font-serif text-[1.35rem] font-medium leading-tight text-ink">灵感账单</h2>
            <span className="font-mono text-xs text-stone-500 mb-1">/ THOUGHTS</span>
         </div>
         {showViewAll && (
             <Link to="/thoughts" className="inline-flex items-center gap-1 font-mono text-[10px] text-stone-400 hover:text-ink transition-colors pb-1">
                 更多 <ArrowRight size={10} />
             </Link>
         )}
      </div>
      <div className="w-full">
          <div className="bg-paper px-6 py-8">
              <div className="text-center border-b border-dashed border-stone-300 pb-6 mb-6">
                  <h3 className="font-serif font-medium text-lg mb-1 tracking-[0.08em]">思维商店</h3>
                  <div className="flex justify-between text-[9px] font-mono text-stone-400 mt-2 uppercase">
                      <span>Store No. 2049</span>
                      <span>{new Date().toDateString()}</span>
                  </div>
              </div>
              <div className="space-y-8">
                  {thoughts.map((thought, index) => (
                      <div key={thought.id} className="group">
                          <div className="flex justify-between items-baseline mb-2">
                              <span className="text-[10px] text-stone-300 font-[system-ui,sans-serif] tracking-widest">{String(index + 1).padStart(3, '0')}</span>
                              <span className="text-[9px] font-mono text-stone-400">{thought.date} {thought.time}</span>
                          </div>
                          <p className="font-serif text-ink text-[15px] leading-7 text-justify mb-2">{thought.content}</p>
                          <div className="flex justify-start gap-2 opacity-60">
                               {thought.tags.map(tag => <span key={tag} className="text-[9px] text-stone-500 border border-stone-200 px-1 rounded-sm font-[system-ui,sans-serif]">#{tag}</span>)}
                          </div>
                      </div>
                  ))}
              </div>
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
