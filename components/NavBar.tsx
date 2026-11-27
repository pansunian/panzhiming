import React, { useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen, Home } from 'lucide-react';
import { NavLink } from '../types';
import { DEFAULT_NAV_LINKS, normalizeNavLinks } from '../utils/navigation';

interface NavBarProps {
  logoUrl?: string;
  className?: string;
  navLinks?: NavLink[];
}

export const InlineTicketNav: React.FC<NavBarProps> = ({ logoUrl, className = "", navLinks }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const normalizedLinks = normalizeNavLinks(navLinks);
  const homeLink = normalizedLinks.find((link) => link.path === '/') || DEFAULT_NAV_LINKS[0];
  const links = [homeLink, ...normalizedLinks.filter((link) => link.path !== '/')];

  return (
    <div className={`relative z-40 w-full ${className}`} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setIsMenuOpen(false);
    }} onKeyDown={(event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
        menuButton.current?.focus();
      }
    }}>
      <div className="flex items-center justify-between gap-4">
        <Link 
          to="/"
          aria-label="先见志明，返回首页"
          onClick={() => setIsMenuOpen(false)}
          className="flex min-w-0 items-center gap-2 py-1 bg-transparent transition-opacity group z-20 relative hover:opacity-80"
        >
           <img src="/pwa-icon-192.png?v=home-portrait" width={30} height={30} alt="" className="h-[30px] w-[30px] shrink-0 rounded-full object-cover" />
           <img src={logoUrl || '/logo-xianjian-white.webp'} alt="" className={`h-8 w-auto min-w-0 max-w-[6rem] object-contain object-left opacity-80 ${logoUrl ? 'brightness-75 contrast-90' : 'brightness-0'}`} />
        </Link>
        <div className="flex shrink-0 items-center gap-2 z-20">
            <Link to="/aboutme" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-1.5 text-stone-500 hover:text-ink transition-colors group">
                <span className="font-serif text-[12px] leading-none">我的说明书</span>
                <BookOpen size={13} className="opacity-45 group-hover:opacity-80 transition-opacity" />
            </Link>
            <span className="h-4 border-l border-stone-300/60" aria-hidden="true" />
            <button ref={menuButton} aria-label={isMenuOpen ? '收起导航' : '展开导航'} aria-expanded={isMenuOpen} aria-controls={isMenuOpen ? menuId : undefined} onClick={() => setIsMenuOpen(!isMenuOpen)} className={`flex h-10 w-10 items-center justify-center transition-colors ${isMenuOpen ? 'text-brand-accent' : 'text-ink/80 hover:text-ink'}`}>
                <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : 'rotate-0'}`}>{isMenuOpen ? <X size={20} /> : <Menu size={20} />}</div>
            </button>
        </div>
        {isMenuOpen && (
            <nav id={menuId} aria-label="网站导航" className="absolute top-[calc(100%+6px)] right-0 w-40 bg-paper border border-stone-200/70 shadow-[0_10px_22px_rgba(36,33,29,0.10)] z-50 animate-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col">
                    {links.map((link) => {
                        const isHome = link.path === '/';
                        const isActive = location.pathname === link.path || (!isHome && location.pathname.startsWith(link.path + '/'));
                        return (
                        <Link key={link.id} to={link.path} aria-current={isActive ? (location.pathname === link.path ? 'page' : 'location') : undefined} onClick={() => setIsMenuOpen(false)} className={`nav-popover-link flex min-h-[44px] items-center justify-between px-3 py-2 border-b border-dashed border-stone-200 last:border-0 hover:bg-stone-50 transition-colors group ${isActive ? 'is-active bg-stone-50' : ''}`}>
                             <div className="flex items-baseline gap-2">
                                <span className={`font-serif text-[13px] ${isActive ? 'text-brand-accent' : 'text-ink'}`}>{link.label}</span>
                                <span className="font-mono text-[8px] text-stone-400 uppercase tracking-widest group-hover:text-brand-accent transition-colors">{link.en}</span>
                             </div>
                             {isHome && <Home size={14} aria-hidden="true" className="text-ink/70" />}
                        </Link>
                    )})}
                </div>
            </nav>
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
