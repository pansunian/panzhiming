import React from 'react';
import { BlogPost } from '../types';
import { BarcodeSmall, DashedLine } from './TicketUI';

interface Props {
  posts: BlogPost[];
  id?: string;
  onItemClick: (post: BlogPost) => void;
  title?: string;
}

// Reusable scalloped edge component (series of holes)
const ScallopedEdge = ({ position }: { position: 'left' | 'right' }) => {
  // 6 holes to fit the height comfortably
  return (
    <div className={`absolute top-0 bottom-0 ${position === 'left' ? '-left-2' : '-right-2'} flex flex-col justify-evenly py-2 z-20`}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="w-4 h-4 rounded-full bg-texture" />
      ))}
    </div>
  );
};

export const BlogSection: React.FC<Props> = ({ posts, id, onItemClick, title = "文章" }) => {
  return (
    <section id={id} className="mb-16 scroll-mt-12 w-full">
      <div className="flex items-end gap-4 mb-10 px-2">
         <h2 className="font-serif text-2xl font-bold text-ink">{title}</h2>
         <span className="font-mono text-xs text-stone-500 mb-1">/ BLOG</span>
      </div>

      <div className="flex flex-col gap-8 w-full">
        {posts.map((post, index) => (
          <div 
            key={post.id} 
            onClick={() => onItemClick(post)}
            className="relative w-full h-44 flex group hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
          >
            
            {/* Scalloped Edges */}
            <ScallopedEdge position="left" />
            <ScallopedEdge position="right" />

            {/* Background Wrapper */}
            <div className="w-full h-full bg-paper flex rounded-sm overflow-hidden relative border border-stone-200 shadow-ticket hover:shadow-ticket-hover">
                
                {/* Left: Image Section (Adjusted to 40% width) */}
                <div className="w-[40%] relative h-full overflow-hidden border-r border-stone-200">
                    <img 
                        src={post.imageUrl || `https://picsum.photos/seed/${post.id}/500/300`} 
                        alt={post.title}
                        className="w-full h-full object-cover filter brightness-[0.95] contrast-[1.05] sepia-[0.1] transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute bottom-3 left-3 text-white">
                        <span className="font-mono text-[9px] bg-black/40 border border-white/30 px-1.5 py-0.5 backdrop-blur-sm tracking-wider uppercase">
                            {post.category}
                        </span>
                    </div>
                    {/* Texture Overlay */}
                    <div className="absolute inset-0 bg-stone-500/5 mix-blend-overlay"></div>
                </div>

                {/* Vertical Divider with Notches */}
                <div className="relative w-0 flex flex-col items-center">
                    <DashedLine vertical className="h-full border-stone-300 opacity-60" />
                    <div className="absolute -top-2 w-4 h-4 rounded-full bg-texture z-10" />
                    <div className="absolute -bottom-2 w-4 h-4 rounded-full bg-texture z-10" />
                </div>

                {/* Right: Stub Info Section (Adjusted to 60% width) */}
                <div className="w-[60%] h-full bg-paper p-4 flex flex-col relative">
                    
                    {/* Inner Frame Border */}
                    <div className="w-full h-full border border-stone-800/10 p-3 flex flex-col relative">
                        {/* Inner decorative dotted line */}
                        <div className="absolute inset-[2px] border border-dashed border-stone-300 pointer-events-none"></div>

                        {/* Top Info */}
                        <div className="relative z-10 flex justify-between items-center mb-2">
                             <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">Admit One</span>
                             <span className="font-mono text-[9px] text-stone-500 font-bold">{post.date}</span>
                        </div>

                        {/* Title & Excerpt */}
                        <div className="relative z-10 flex-grow flex flex-col justify-center mb-1">
                            <h3 className="font-serif font-bold text-ink text-base leading-tight mb-2 group-hover:text-brand-accent transition-colors line-clamp-2">
                                {post.title}
                            </h3>
                            <p className="font-serif text-xs text-stone-500 leading-snug line-clamp-2 opacity-80">
                                {post.excerpt}
                            </p>
                        </div>

                        {/* Bottom Barcode */}
                        <div className="relative z-10 mt-auto pt-2 border-t border-stone-100 flex items-end justify-between">
                            <BarcodeSmall className="h-4 w-2/3 opacity-60" />
                            <span className="font-mono text-[8px] text-stone-300">NO.00{index + 1}</span>
                        </div>
                    </div>
                </div>

            </div>
          </div>
        ))}
      </div>
    </section>
  );
};