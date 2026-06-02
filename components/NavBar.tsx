import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen } from 'lucide-react';

interface NavBarProps {
  logoUrl?: string;
}

export const NavBar: React.FC<NavBarProps> = ({ logoUrl }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const links = [
    { id: 'gallery', path: '/gallery', label: '影像', en: 'GALLERY' },
    { id: 'thoughts', path: '/thoughts', label: '便签', en: 'NOTES' },
    { id: 'blog', path: '/blog', label: '文章', en: 'BLOG' },
  ] as const;

  return (
    <div className="relative z-50 w-full px-2 sm:px-4 pt-4 sm:pt-5 transition-all duration-300 pointer-events-none">
      <div className="max-w-[420px] mx-auto h-12 flex items-stretch justify-between relative bg-paper/95 border border-stone-200/80 shadow-[0_8px_24px_rgba(36,33,29,0.06)] backdrop-blur-sm pointer-events-auto">
        <Link 
          to="/"
          onClick={() => setIsMenuOpen(false)}
          className="px-4 flex flex-col justify-center items-start bg-transparent hover:bg-stone-50/50 transition-colors group z-20 relative"
        >
           {logoUrl ? (
             <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
           ) : (
             <span className="font-serif font-bold text-base tracking-wide text-ink group-hover:text-brand-accent transition-colors">ARCHIVE</span>
           )}
        </Link>
        <div className="flex items-center h-full z-20">
            <Link to="/aboutme" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-4 h-full border-l border-dashed border-stone-200/80 hover:bg-stone-50/50 transition-colors group">
                <span className="font-serif font-bold text-xs text-stone-500 group-hover:text-ink transition-colors">我的说明书</span>
                <BookOpen size={14} className="opacity-40 group-hover:opacity-80 transition-opacity" />
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`flex items-center justify-center px-4 h-full border-l border-dashed border-stone-200/80 transition-colors ${isMenuOpen ? 'bg-stone-100 text-brand-accent' : 'hover:bg-stone-50/50'}`}>
                <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : 'rotate-0'}`}>{isMenuOpen ? <X size={20} /> : <Menu size={20} />}</div>
            </button>
        </div>
        {isMenuOpen && (
            <div className="absolute top-[calc(100%+8px)] right-0 w-48 bg-paper border border-stone-200/80 shadow-[0_12px_28px_rgba(36,33,29,0.10)] z-10 animate-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col">
                    {links.map((link) => (
                        <Link key={link.id} to={link.path} onClick={() => setIsMenuOpen(false)} className={`flex items-center justify-between p-4 border-b border-dashed border-stone-200 last:border-0 hover:bg-stone-50 transition-colors group ${location.pathname.startsWith(link.path) ? 'bg-stone-50' : ''}`}>
                             <div className="flex items-baseline gap-3">
                                <span className={`font-serif font-bold text-sm ${location.pathname.startsWith(link.path) ? 'text-brand-accent' : 'text-ink'}`}>{link.label}</span>
                                <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest group-hover:text-brand-accent transition-colors">{link.en}</span>
                             </div>
                        </Link>
                    ))}
                    <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-center text-[10px] font-mono text-stone-400 uppercase tracking-[0.2em] p-3 hover:text-ink transition-colors">Home</Link>
                </div>
            </div>
        )}
        <div className="absolute left-4 right-4 bottom-0 border-b border-dashed border-stone-300/70 pointer-events-none" />
      </div>
    </div>
  );
};
