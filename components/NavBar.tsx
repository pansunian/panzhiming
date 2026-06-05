import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen } from 'lucide-react';
import { NavLink } from '../types';
import { normalizeNavLinks } from '../utils/navigation';

interface NavBarProps {
  logoUrl?: string;
  className?: string;
  navLinks?: NavLink[];
}

export const InlineTicketNav: React.FC<NavBarProps> = ({ logoUrl, className = "", navLinks }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const normalizedLinks = normalizeNavLinks(navLinks);
  const homeLink = normalizedLinks.find((link) => link.path === '/') || normalizedLinks[0];
  const links = normalizedLinks.filter((link) => link.path !== '/');

  return (
    <div className={`relative z-40 w-full ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <Link 
          to="/"
          onClick={() => setIsMenuOpen(false)}
          className="flex min-w-0 items-center justify-start bg-transparent transition-opacity group z-20 relative hover:opacity-70"
        >
           {logoUrl ? (
             <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain opacity-85 transition-opacity" />
           ) : (
             <span className="font-serif text-sm tracking-wide text-ink group-hover:text-brand-accent transition-colors">先见志明</span>
           )}
        </Link>
        <div className="flex items-center gap-3 z-20">
            <Link to="/aboutme" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-1.5 text-stone-500 hover:text-ink transition-colors group">
                <span className="font-serif text-[12px] leading-none">我的说明书</span>
                <BookOpen size={13} className="opacity-45 group-hover:opacity-80 transition-opacity" />
            </Link>
            <span className="h-4 border-l border-stone-300/60" aria-hidden="true" />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`flex items-center justify-center transition-colors ${isMenuOpen ? 'text-brand-accent' : 'text-ink/80 hover:text-ink'}`}>
                <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : 'rotate-0'}`}>{isMenuOpen ? <X size={20} /> : <Menu size={20} />}</div>
            </button>
        </div>
        {isMenuOpen && (
            <div className="absolute top-[calc(100%+10px)] right-0 w-36 bg-paper border border-stone-200/70 shadow-[0_10px_22px_rgba(36,33,29,0.10)] z-50 animate-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col">
                    {links.map((link) => (
                        <Link key={link.id} to={link.path} onClick={() => setIsMenuOpen(false)} className={`flex items-center justify-between px-3 py-3 border-b border-dashed border-stone-200 last:border-0 hover:bg-stone-50 transition-colors group ${location.pathname.startsWith(link.path) ? 'bg-stone-50' : ''}`}>
                             <div className="flex items-baseline gap-2">
                                <span className={`font-serif text-[13px] ${location.pathname.startsWith(link.path) ? 'text-brand-accent' : 'text-ink'}`}>{link.label}</span>
                                <span className="font-mono text-[8px] text-stone-400 uppercase tracking-widest group-hover:text-brand-accent transition-colors">{link.en}</span>
                             </div>
                        </Link>
                    ))}
                    {homeLink && (
                      <Link to={homeLink.path} onClick={() => setIsMenuOpen(false)} className="text-center text-[9px] font-mono text-stone-400 tracking-[0.18em] py-2.5 hover:text-ink transition-colors">{homeLink.label}</Link>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export const NavBar: React.FC<NavBarProps> = (props) => (
  <div className="w-full max-w-[420px] mx-auto px-3 sm:px-4 py-5">
    <InlineTicketNav {...props} />
  </div>
);
