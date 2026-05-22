import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BlogPost } from '../types';
import { DashedLine, Notch } from './TicketUI';
import { ArrowRight } from 'lucide-react';
import { optimizeImage } from '../utils/imageOptimizer';

interface Props {
  posts: BlogPost[];
  showViewAll?: boolean;
  title?: string;
}

const TicketBarcode = () => (
    <div className="flex h-24 w-10 justify-between opacity-65">
        {Array.from({ length: 14 }).map((_, i) => (
            <span
                key={i}
                className={`h-full bg-ink ${i % 5 === 0 ? 'w-[3px]' : i % 3 === 0 ? 'w-[2px]' : 'w-px'}`}
            />
        ))}
    </div>
);

const BlogCard: React.FC<{ post: BlogPost; index: number }> = ({ post, index }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    
    // 博客列表图较小，使用 640px 足够（适配 Retina 屏）
    const coverSrc = post.imageUrl 
        ? optimizeImage(post.imageUrl, 640)
        : `https://picsum.photos/seed/${post.id}/500/300`;

    return (
        <Link 
            to={`/blog/${post.id}`}
            className="relative w-full h-40 sm:h-44 group cursor-pointer transition-all duration-300 hover:-translate-y-1 block"
        >
            <div className="w-full h-full flex items-stretch relative bg-paper border border-stone-200/70 border-l-4 border-l-brand-accent overflow-visible shadow-sm">
                <Notch className="!w-5 !h-5 -left-3 top-1/2 -translate-y-1/2" />
                <Notch className="!w-5 !h-5 -right-3 top-1/2 -translate-y-1/2" />

                <div className="w-[45%] h-full p-4 sm:p-5 flex flex-col justify-between min-w-0">
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="font-mono text-[9px] text-stone-400 uppercase tracking-[0.18em]">Admit One</span>
                            <span className="font-mono text-[8px] text-stone-400 font-bold whitespace-nowrap">NO.00{index + 1}</span>
                        </div>
                        <h3 className="font-serif font-medium text-ink text-[17px] sm:text-[18px] leading-tight mb-2 group-hover:text-brand-accent transition-colors line-clamp-2">{post.title}</h3>
                        <p className="font-serif text-xs text-stone-500 leading-snug line-clamp-2 opacity-80">{post.excerpt}</p>
                    </div>
                    <div className="flex items-end justify-between gap-3 pt-3">
                        <span className="font-mono text-[9px] text-brand-accent uppercase tracking-wider">{post.category}</span>
                        <span className="font-mono text-[9px] text-stone-500 font-bold whitespace-nowrap">{post.date}</span>
                    </div>
                </div>

                <div className="w-[31%] h-full flex items-center justify-center px-2 sm:px-3 bg-paper-dark/30">
                    <div className="w-full aspect-square overflow-hidden bg-stone-200">
                        <img src={coverSrc} alt={post.title} onLoad={() => setIsLoaded(true)} className={`w-full h-full object-cover filter brightness-[0.96] contrast-[1.03] sepia-[0.08] transition-all duration-700 group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                </div>

                <div className="relative w-px h-full z-20">
                    <DashedLine vertical className="h-full border-stone-300 opacity-60" />
                    <Notch className="!w-5 !h-5 -translate-x-1/2 -top-3 left-1/2" />
                    <Notch className="!w-5 !h-5 -translate-x-1/2 -bottom-3 left-1/2" />
                </div>

                <div className="flex-1 min-w-[70px] h-full flex flex-col items-center justify-between py-4">
                    <div className="bg-ink text-paper font-mono text-[6px] leading-none px-1.5 py-1 uppercase tracking-tight">PZM<br />COM</div>
                    <TicketBarcode />
                    <span className="font-mono text-[7px] text-stone-400 uppercase tracking-[0.18em] rotate-90 whitespace-nowrap">panzhiming.com</span>
                </div>
            </div>
        </Link>
    );
};

export const BlogSection: React.FC<Props> = ({ posts, showViewAll, title = "文章" }) => {
  return (
    <section className="scroll-mt-12 w-full">
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
      <div className="flex flex-col gap-8 w-full">
        {posts.map((post, index) => <BlogCard key={post.id} post={post} index={index} />)}
      </div>
    </section>
  );
};
