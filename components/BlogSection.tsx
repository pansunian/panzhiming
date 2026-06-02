import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BlogPost } from '../types';
import { BarcodeSmall, DashedLine, Notch } from './TicketUI';
import { ArrowRight } from 'lucide-react';
import { optimizeImage } from '../utils/imageOptimizer';
import { InlineTicketNav } from './NavBar';

interface Props {
  posts: BlogPost[];
  showViewAll?: boolean;
  title?: string;
  logoUrl?: string;
  showPageNav?: boolean;
}

const BlogCard: React.FC<{ post: BlogPost; index: number }> = ({ post, index }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    
    // 博客列表图较小，使用 640px 足够（适配 Retina 屏）
    const coverSrc = post.imageUrl 
        ? optimizeImage(post.imageUrl, 640)
        : `https://picsum.photos/seed/${post.id}/500/300`;

    return (
        <Link 
            to={`/blog/${post.id}`}
            className="relative w-full h-32 group cursor-pointer transition-all duration-300 hover:-translate-y-1 block"
        >
            <div className="w-full h-full flex items-stretch">
                <div className="w-36 sm:w-[38%] h-full relative overflow-hidden rounded-l-sm bg-stone-200 shrink-0">
                    <img src={coverSrc} alt={post.title} onLoad={() => setIsLoaded(true)} className={`w-full h-full object-cover filter brightness-[0.95] contrast-[1.05] sepia-[0.1] transition-all duration-700 group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} />
                    <div className="absolute bottom-2 left-2 text-white"><span className="font-mono text-[8px] bg-ink/55 border border-white/30 px-1.5 py-0.5 backdrop-blur-sm tracking-wider uppercase">{post.category}</span></div>
                </div>
                
                <div className="relative w-0 flex flex-col items-center z-20">
                    <DashedLine vertical className="h-full border-stone-300 opacity-60" />
                    <Notch className="!w-4 !h-4 -translate-x-1/2 -top-2 left-1/2" />
                    <Notch className="!w-4 !h-4 -translate-x-1/2 -bottom-2 left-1/2" />
                </div>
                
                <div className="flex-grow h-full bg-paper p-3 sm:p-4 flex flex-col relative jagged-right-round rounded-r-none border-r border-stone-200/50">
                    <div className="flex justify-between items-center mb-1">
                            <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">Admit One</span>
                            <span className="font-mono text-[9px] text-stone-500 font-bold">{post.date}</span>
                    </div>
                    <div className="flex-grow flex flex-col justify-center mb-1 pr-0 sm:pr-1">
                        <h3 className="font-serif font-medium text-ink text-sm sm:text-[14px] leading-tight mb-1 group-hover:text-brand-accent transition-colors line-clamp-2">{post.title}</h3>
                        <p className="font-serif text-[10px] sm:text-xs text-stone-500 leading-snug line-clamp-1 opacity-80">{post.excerpt}</p>
                    </div>
                    <div className="mt-auto pt-2 border-t border-stone-100 flex items-end justify-between pr-2">
                        <BarcodeSmall className="h-3 w-1/2 opacity-40" />
                        <span className="font-mono text-[8px] text-stone-300">NO.00{index + 1}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export const BlogSection: React.FC<Props> = ({ posts, showViewAll, title = "文章", logoUrl, showPageNav }) => {
  return (
    <section className="scroll-mt-12 w-full">
      {showPageNav && (
        <div className="mb-8 px-2">
          <div className="bg-paper/95 border border-stone-200/70 px-4 py-3 shadow-[0_10px_24px_rgba(36,33,29,0.05)]">
            <InlineTicketNav logoUrl={logoUrl} />
            <div className="mt-3 border-t border-dashed border-stone-300/70" />
          </div>
        </div>
      )}
      <div className="flex items-end justify-between mb-8 px-2">
         <div className="flex items-end gap-3">
             <h2 className="font-serif text-[1.35rem] font-medium leading-tight text-ink">{title}</h2>
             <span className="font-mono text-xs text-stone-500 mb-1">/ BLOG</span>
         </div>
         {showViewAll && (
             <Link to="/blog" className="inline-flex items-center gap-1 font-mono text-[10px] text-stone-400 hover:text-ink transition-colors pb-1">
                 VIEW ALL <ArrowRight size={10} />
             </Link>
         )}
      </div>
      <div className="flex flex-col gap-6 w-full">
        {posts.map((post, index) => <BlogCard key={post.id} post={post} index={index} />)}
      </div>
    </section>
  );
};
