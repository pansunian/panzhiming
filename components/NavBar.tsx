import React from 'react';

interface NavBarProps {
  onNavigate: (view: 'home' | 'gallery' | 'thoughts' | 'blog') => void;
  activeView?: string;
  logoUrl?: string;
}

export const NavBar: React.FC<NavBarProps> = ({ onNavigate, activeView, logoUrl }) => {
  const links = [
    { id: 'gallery', label: '影像', en: 'GALLERY' },
    { id: 'thoughts', label: '便签', en: 'NOTES' },
    { id: 'blog', label: '文章', en: 'BLOG' },
  ] as const;

  return (
    <div className="sticky top-0 z-50 w-full bg-paper border-b-2 border-stone-800">
      <div className="max-w-[480px] mx-auto h-16 flex items-stretch relative">
        
        {/* Logo Area (Click to go Home) */}
        <button 
          onClick={() => onNavigate('home')}
          className="px-6 flex flex-col justify-center items-start border-r-2 border-stone-800 bg-paper hover:bg-stone-100 transition-colors group"
        >
           {logoUrl ? (
             <img 
               src={logoUrl} 
               alt="Logo" 
               className="h-8 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" 
             />
           ) : (
             <>
               <span className="font-serif font-bold text-lg tracking-wide text-ink group-hover:text-brand-accent transition-colors">ARCHIVE</span>
               <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">Life Frames</span>
             </>
           )}
        </button>

        {/* Navigation Links */}
        <div className="flex-grow flex items-center justify-end px-4 gap-4 overflow-hidden relative">
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                  style={{backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 10px)'}}>
             </div>

             {links.map((link) => (
               <button
                 key={link.id}
                 onClick={() => onNavigate(link.id)}
                 className={`flex flex-col items-center group ${activeView === link.id ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
               >
                 <span className={`font-serif font-bold text-sm ${activeView === link.id ? 'text-brand-accent' : 'text-ink'}`}>
                    {link.label}
                 </span>
                 <span className="font-mono text-[8px] uppercase tracking-wider">{link.en}</span>
               </button>
             ))}
        </div>
      </div>
      
      {/* Jagged edge */}
      <div className="absolute top-full left-0 right-0 h-2 w-full sawtooth-y opacity-80 pointer-events-none"></div>
    </div>
  );
};