import React, { useState } from 'react';
import { BlogPost } from '../types';
import { BarcodeSmall, DashedLine } from './TicketUI';
import { ArrowRight } from 'lucide-react';

interface Props {
  posts: BlogPost[];
  id?: string;
  onItemClick: (post: BlogPost) => void;
  onViewAll?: () => void;
  title?: string;
}

// Sub-component for Blog Item
const BlogCard: React.FC<{ post: BlogPost; index: number; onClick: (p: BlogPost) => void }> = ({ post, index, onClick }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const isPriority = index < 2;

    return (
        <div 
            onClick={() => onClick(post)}
            // Flat design: removed shadow classes, added border for subtle definition
            className="relative w-full h-32 group cursor-pointer transition-all duration-300 hover:-translate-y-1"
        >
            {/* Ticket Container */}
            <div className="w-full h-full flex items-stretch">
                
                {/* Left: Image Section */}
                <div className="w-28 sm:w-[30%] h-full relative overflow-hidden rounded-l-sm bg-stone-200 shrink-0">
                    <img 
                        src={post.imageUrl || `https://picsum.photos/seed/${post.id}/500/300`} 
                        alt={post.title}
                        loading={isPriority ? "eager" : "lazy"}
                        decoding={isPriority ? "auto" : "async"}
                        onLoad={() => setIsLoaded(true)}
                        className={`w-full h-full object-cover filter brightness-[0.95] contrast-[1.05] sepia-[0.1] transition-all duration-700 group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <div className="absolute bottom-2 left-2 text-white">
                        <span className="font-mono text-[8px] bg-black/40 border border-white/30 px-1.5 py-0.5 backdrop-blur-sm tracking-wider uppercase">
                            {post.category}
                        </span>
                    </div>
                </div>

                {/* Divider Line with Notches */}
                <div className="relative w-0 flex flex-col items-center z-20">
                    {/* The line itself */}
                    <DashedLine vertical className="h-full border-stone-300 opacity-60" />
                    
                    {/* Top Notch: Explicit small size (w-3 = 12px), centered on top edge */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-texture rounded-full" />
                    
                    {/* Bottom Notch: Explicit small size, centered on bottom edge */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-texture rounded-full" />
                </div>

                {/* Right: Content Section with Scalloped Edge (jagged-right) */}
                <div className="flex-grow h-full bg-paper p-3 sm:p-4 flex flex-col relative jagged-right rounded-r-none">
                    
                    {/* Top Info */}
                    <div className="flex justify-between items-center mb-1">
                            <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">Admit One</span>
                            <span className="font-mono text-[9px] text-stone-500 font-bold">{post.date}</span>
                    </div>

                    {/* Title & Excerpt */}
                    <div className="flex-grow flex flex-col justify-center mb-1 pr-4">
                        <h3 className="font-serif font-bold text-ink text-sm sm:text-base leading-tight mb-1 group-hover:text-brand-accent transition-colors line-clamp-2">
                            {post.title}
                        </h3>
                        <p className="font-serif text-[10px] sm:text-xs text-stone-500 leading-snug line-clamp-1 opacity-80">
                            {post.excerpt}
                        </p>
                    </div>

                    {/* Bottom Barcode */}
                    <div className="mt-auto pt-2 border-t border-stone-100 flex items-end justify-between">
                        <BarcodeSmall className="h-3 w-1/2 opacity-40" />
                        <span className="font-mono text-[8px] text-stone-300">NO.00{index + 1}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export const BlogSection: React.FC<Props> = ({ posts, id, onItemClick, onViewAll, title = "文章" }) => {
  return (
    <section id={id} className="mb-16 scroll-mt-12 w-full">
      <div className="flex items-end justify-between mb-8 px-2">
         <div className="flex items-end gap-3">
             <h2 className="font-serif text-2xl font-bold text-ink">{title}</h2>
             <span className="font-mono text-xs text-stone-500 mb-1">/ BLOG</span>
         </div>
         {onViewAll && (
             <button onClick={onViewAll} className="inline-flex items-center gap-1 font-mono text-[10px] text-stone-400 hover:text-ink transition-colors pb-1">
                 VIEW ALL <ArrowRight size={10} />
             </button>
         )}
      </div>

      <div className="flex flex-col gap-6 w-full">
        {posts.map((post, index) => (
            <BlogCard 
                key={post.id} 
                post={post} 
                index={index} 
                onClick={onItemClick} 
            />
        ))}
      </div>
    </section>
  );
};