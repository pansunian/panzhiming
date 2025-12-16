import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavBarProps {
  onNavigate: (view: 'home' | 'gallery' | 'thoughts' | 'blog') => void;
  activeView?: string;
  logoUrl?: string;
}

export const NavBar: React.FC<NavBarProps> = ({ onNavigate, activeView, logoUrl }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = [
    { id: 'gallery', label: '影像', en: 'GALLERY' },
    { id: 'thoughts', label: '便签', en: 'NOTES' },
    { id: 'blog', label: '文章', en: 'BLOG' },
  ] as const;

  const handleNavClick = (view: 'home' | 'gallery' | 'thoughts' | 'blog') => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  return (
    <div className="relative z-50 w-full bg-paper border-b-2 border-stone-800 shadow-sm">
      <div className="max-w-[420px] mx-auto h-14 flex items-stretch justify-between relative px-0">
        
        {/* Logo Area */}
        <button 
          onClick={() => handleNavClick('home')}
          className="px-4 flex flex-col justify-center items-start border-r-2 border-stone-800 bg-paper hover:bg-stone-50 transition-colors group z-20 relative"
        >
           {logoUrl ? (
             <img 
               src={logoUrl} 
               alt="Logo" 
               className="h-6 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" 
             />
           ) : (
             <>
               <span className="font-serif font-bold text-base tracking-wide text-ink group-hover:text-brand-accent transition-colors">ARCHIVE</span>
             </>
           )}
        </button>

        {/* Desktop Navigation Links (Visible on tablet/desktop) */}
        <div className="hidden md:flex flex-grow items-center justify-around px-2 gap-2 overflow-hidden relative">
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                  style={{backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 10px)'}}>
             </div>

             {links.map((link) => (
               <button
                 key={link.id}
                 onClick={() => handleNavClick(link.id)}
                 className={`flex flex-col items-center group py-1 px-2 rounded-sm transition-all ${activeView === link.id ? 'opacity-100 bg-stone-100' : 'opacity-50 hover:opacity-100'}`}
               >
                 <span className={`font-serif font-bold text-xs ${activeView === link.id ? 'text-brand-accent' : 'text-ink'}`}>
                    {link.label}
                 </span>
                 <span className="font-mono text-[8px] uppercase tracking-wider scale-90">{link.en}</span>
               </button>
             ))}
        </div>

        {/* Mobile Menu Button (Visible on mobile) */}
        <div className="md:hidden flex items-center px-4 bg-paper z-20">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-ink hover:text-brand-accent transition-colors"
            >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>

        {/* Mobile Navigation Dropdown Overlay */}
        {isMenuOpen && (
            <div className="absolute top-full left-0 w-full bg-paper border-b-2 border-stone-800 shadow-xl z-10 animate-in slide-in-from-top-2 duration-300 md:hidden">
                <div className="flex flex-col p-4 gap-4">
                    {links.map((link) => (
                        <button
                            key={link.id}
                            onClick={() => handleNavClick(link.id)}
                            className="flex items-center justify-between p-3 border-b border-dashed border-stone-300 hover:bg-stone-50 transition-colors"
                        >
                             <span className="font-serif font-bold text-lg text-ink">{link.label}</span>
                             <span className="font-mono text-xs text-stone-400">{link.en}</span>
                        </button>
                    ))}
                    <button 
                        onClick={() => handleNavClick('home')}
                        className="mt-2 text-center text-xs font-mono text-stone-400 uppercase tracking-widest p-2"
                    >
                        Back to Home
                    </button>
                </div>
                 {/* Jagged edge for menu */}
                <div className="h-2 w-full sawtooth-y opacity-50"></div>
            </div>
        )}

      </div>
      
      {/* Jagged edge for navbar */}
      {!isMenuOpen && (
        <div className="absolute top-full left-0 right-0 h-2 w-full sawtooth-y opacity-80 pointer-events-none"></div>
      )}
    </div>
  );
};