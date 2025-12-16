import React, { useState } from 'react';
import { Menu, X, BookOpen } from 'lucide-react';

interface NavBarProps {
  onNavigate: (view: 'home' | 'gallery' | 'thoughts' | 'blog') => void;
  onManualClick?: () => void;
  activeView?: string;
  logoUrl?: string;
}

export const NavBar: React.FC<NavBarProps> = ({ onNavigate, onManualClick, activeView, logoUrl }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Collapsed categories only (Manual is outside)
  const links = [
    { id: 'gallery', label: '影像', en: 'GALLERY' },
    { id: 'thoughts', label: '便签', en: 'NOTES' },
    { id: 'blog', label: '文章', en: 'BLOG' },
  ] as const;

  const handleNavClick = (view: string) => {
    onNavigate(view as any);
    setIsMenuOpen(false);
  };

  return (
    <div className="relative z-50 w-full bg-paper border-b-2 border-stone-800 shadow-sm">
      <div className="max-w-[452px] mx-auto h-14 flex items-stretch justify-between relative px-0">
        
        {/* Left: Logo Area */}
        <button 
          onClick={() => handleNavClick('home')}
          className="px-4 flex flex-col justify-center items-start bg-paper hover:bg-stone-50 transition-colors group z-20 relative"
        >
           {logoUrl ? (
             <img 
               src={logoUrl} 
               alt="Logo" 
               className="h-9 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" 
             />
           ) : (
             <>
               <span className="font-serif font-bold text-base tracking-wide text-ink group-hover:text-brand-accent transition-colors">ARCHIVE</span>
             </>
           )}
        </button>

        {/* Right: Actions Area */}
        <div className="flex items-center h-full bg-paper z-20">
            
            {/* Manual Button (Direct Access - Always Visible) */}
            <button 
                onClick={onManualClick}
                className="flex items-center gap-2 px-4 h-full hover:bg-stone-50 transition-colors group"
            >
                <span className="font-serif font-bold text-[10px] text-stone-500 group-hover:text-ink transition-colors">我的说明书</span>
                <BookOpen size={14} className="opacity-40 group-hover:opacity-80 transition-opacity" />
            </button>

            {/* Menu Toggle (Collapses Gallery, Thoughts, Blog) */}
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`flex items-center justify-center px-4 h-full transition-colors ${isMenuOpen ? 'bg-stone-100 text-brand-accent' : 'hover:bg-stone-50'}`}
                aria-label="Menu"
            >
                <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
                    {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </div>
            </button>
        </div>

        {/* Dropdown Overlay */}
        {isMenuOpen && (
            <div className="absolute top-full right-0 w-48 bg-paper border-b-2 border-x-2 border-stone-800 shadow-xl z-10 animate-in slide-in-from-top-2 duration-300 rounded-b-sm">
                <div className="flex flex-col">
                    {links.map((link) => (
                        <button
                            key={link.id}
                            onClick={() => handleNavClick(link.id)}
                            className={`flex items-center justify-between p-4 border-b border-dashed border-stone-200 last:border-0 hover:bg-stone-50 transition-colors group ${activeView === link.id ? 'bg-stone-50' : ''}`}
                        >
                             <div className="flex items-baseline gap-3">
                                <span className={`font-serif font-bold text-sm ${activeView === link.id ? 'text-brand-accent' : 'text-ink'}`}>
                                    {link.label}
                                </span>
                                <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest group-hover:text-brand-accent transition-colors">
                                    {link.en}
                                </span>
                             </div>
                             {activeView === link.id && <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />}
                        </button>
                    ))}
                    <button 
                        onClick={() => handleNavClick('home')}
                        className="text-center text-[10px] font-mono text-stone-400 uppercase tracking-[0.2em] p-3 hover:text-ink transition-colors"
                    >
                        Home
                    </button>
                </div>
                 {/* Jagged edge for menu */}
                <div className="h-2 w-full sawtooth-y opacity-50"></div>
            </div>
        )}

      </div>
      
      {/* Jagged edge for navbar (Only visible when menu is closed) */}
      {!isMenuOpen && (
        <div className="absolute top-full left-0 right-0 h-2 w-full sawtooth-y opacity-80 pointer-events-none"></div>
      )}
    </div>
  );
};