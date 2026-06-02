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
    <div className="relative z-50 w-full bg-transparent transition-all duration-300">
      <div className="max-w-[420px] mx-auto h-16 flex items-center justify-between relative px-3 sm:px-2">
        <Link 
          to="/"
          onClick={() => setIsMenuOpen(false)}
          className="flex items-center justify-start bg-transparent transition-opacity group z-20 relative hover:opacity-70"
        >
           {logoUrl ? (
             <img src={logoUrl} alt="Logo" className="h-9 w-auto object-contain opacity-90 transition-opacity" />
           ) : (
             <span className="font-serif font-bold text-base tracking-wide text-ink group-hover:text-brand-accent transition-colors">ARCHIVE</span>
           )}
        </Link>
        <div className="flex items-center gap-3 z-20">
            <Link to="/aboutme" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-1.5 text-stone-500 hover:text-ink transition-colors group">
                <span className="font-serif text-[13px] leading-none">我的说明书</span>
                <BookOpen size={13} className="opacity-45 group-hover:opacity-80 transition-opacity" />
            </Link>
            <span className="h-4 border-l border-stone-300/60" aria-hidden="true" />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`flex items-center justify-center transition-colors ${isMenuOpen ? 'text-brand-accent' : 'text-ink/80 hover:text-ink'}`}>
                <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : 'rotate-0'}`}>{isMenuOpen ? <X size={20} /> : <Menu size={20} />}</div>
            </button>
        </div>
        {isMenuOpen && (
            <div className="absolute top-[calc(100%-4px)] right-2 w-48 bg-paper border border-stone-200/70 shadow-[0_12px_28px_rgba(36,33,29,0.12)] z-10 animate-in slide-in-from-top-2 duration-300">
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
      </div>
    </div>
  );
};
