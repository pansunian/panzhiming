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
    <div className="relative z-50 w-full bg-paper border-b-2 border-stone-800 shadow-sm transition-all duration-300">
      <div className="max-w-[452px] mx-auto h-14 flex items-stretch justify-between relative px-0">
        
        {/* Left: Logo Area */}
        <div className="flex items-center">
            <Link 
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="px-4 h-full flex flex-col justify-center items-start bg-transparent hover:bg-stone-50/50 transition-colors group z-20 relative"
            >
               {logoUrl ? (
                 <img src={logoUrl} alt="Logo" className="h-9 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
               ) : (
                 <div className="flex items-baseline gap-1.5">
                    <span className="font-serif font-bold text-base tracking-wide text-ink group-hover:text-brand-accent transition-colors">ARCHIVE</span>
                    <span className="font-mono text-[7px] text-stone-300 opacity-60">v1.0.4</span>
                 </div>
               )}
            </Link>
        </div>

        {/* Right: Actions Area */}
        <div className="flex items-center h-full z-20">
            <Link 
                to="/aboutme"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 px-4 h-full hover:bg-stone-50/50 transition-colors group"
            >
                <span className="font-serif font-bold text-xs text-stone-500 group-hover:text-ink transition-colors">我的说明书</span>
                <BookOpen size={14} className="opacity-40 group-hover:opacity-80 transition-opacity" />
            </Link>

            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`flex items-center justify-center px-4 h-full transition-colors ${isMenuOpen ? 'bg-stone-100 text-brand-accent' : 'hover:bg-stone-50/50'}`}
            >
                <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
                    {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </div>
            </button>
        </div>

        {/* Dropdown Overlay */}
        {isMenuOpen && (
            <div className="absolute top-full right-0 w-48 bg-paper shadow-xl z-10 animate-in slide-in-from-top-2 duration-300 rounded-b-sm">
                <div className="flex flex-col">
                    {links.map((link) => (
                        <Link
                            key={link.id}
                            to={link.path}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center justify-between p-4 border-b border-dashed border-stone-200 last:border-0 hover:bg-stone-50 transition-colors group ${location.pathname.startsWith(link.path) ? 'bg-stone-50' : ''}`}
                        >
                             <div className="flex items-baseline gap-3">
                                <span className={`font-serif font-bold text-sm ${location.pathname.startsWith(link.path) ? 'text-brand-accent' : 'text-ink'}`}>
                                    {link.label}
                                </span>
                                <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest group-hover:text-brand-accent transition-colors">
                                    {link.en}
                                </span>
                             </div>
                             {location.pathname.startsWith(link.path) && <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />}
                        </Link>
                    ))}
                    <Link 
                        to="/"
                        onClick={() => setIsMenuOpen(false)}
                        className="text-center text-[10px] font-mono text-stone-400 uppercase tracking-[0.2em] p-3 hover:text-ink transition-colors"
                    >
                        Home
                    </Link>
                </div>
                <div className="h-2 w-full sawtooth-y opacity-50"></div>
            </div>
        )}
      </div>
      {!isMenuOpen && (
        <div className="absolute top-full left-0 right-0 h-2 w-full sawtooth-y opacity-80 pointer-events-none"></div>
      )}
    </div>
  );
};