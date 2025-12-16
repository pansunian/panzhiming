import React from 'react';
import { Profile } from '../types';
import { TicketBase, Notch, DashedLine, BarcodeHorizontal } from './TicketUI';

interface Props {
  profile: Profile;
  onNavigate: (view: 'home' | 'gallery' | 'thoughts' | 'blog') => void;
}

export const ProfileSection: React.FC<Props> = ({ profile, onNavigate }) => {
  return (
    <div className="flex justify-center mb-24 w-full">
      <TicketBase className="w-full rounded-2xl flex flex-col overflow-hidden">
        
        {/* Top Section: Visual */}
        <div className="relative aspect-[4/5]">
            <img 
                src={profile.avatarUrl} 
                alt="Profile"
                className="w-full h-full object-cover filter brightness-[0.85] contrast-110"
            />
            <div className="absolute top-8 left-0 w-full text-center text-white mix-blend-overlay opacity-80">
                <p className="font-mono text-xs tracking-[0.5em] uppercase">Life Frames</p>
            </div>
            
            <div className="absolute bottom-12 left-8 right-8 text-white">
                 <h2 className="text-xs font-mono mb-2 tracking-widest opacity-80">NOW SHOWING</h2>
                 <h1 className="text-5xl font-serif font-bold tracking-tight leading-none mb-2">生活<br/>正在上映</h1>
                 <p className="font-serif text-sm italic opacity-90">Our Unique Life Frames</p>
            </div>
            
             <div className="absolute bottom-4 right-4 text-white/60 text-[10px] font-mono border border-white/40 px-2 py-0.5 rounded-full">
                © {new Date().getFullYear()} ARCHIVE
            </div>
        </div>

        {/* Middle Section: Info & Navigation */}
        <div className="relative bg-brand-accent text-white p-8">
             <Notch className="-left-4 top-0 -translate-y-1/2" />
             <Notch className="-right-4 top-0 -translate-y-1/2" />
             <DashedLine className="absolute top-0 left-4 right-4 border-white/30" />

             <div className="mt-4">
                 <div className="flex justify-between items-end mb-6">
                     <div>
                         <p className="text-[10px] opacity-70 tracking-widest mb-1">STARRING / 主演</p>
                         <p className="text-2xl font-serif font-bold">{profile.name}</p>
                     </div>
                     <div className="text-right">
                         <p className="text-[10px] opacity-70 tracking-widest mb-1">LOCATION / 坐标</p>
                         <p className="font-mono text-sm">{profile.location}</p>
                     </div>
                 </div>

                 <p className="font-serif text-sm leading-relaxed opacity-90 mb-6 border-l-2 border-white/30 pl-3">
                     “{profile.bio}”
                 </p>

                 {/* Navigation Grid (Updated to Buttons) */}
                 <div className="grid grid-cols-4 gap-1 text-center border-t border-white/20 pt-6 mt-6">
                     <button onClick={() => onNavigate('home')} className="group flex flex-col items-center transition-all duration-300 hover:-translate-y-0.5">
                         <span className="text-[9px] font-mono text-white/50 mb-1 tracking-wider group-hover:text-white/80">HOME</span>
                         <span className="text-xs font-bold text-white group-hover:underline decoration-1 underline-offset-4">首页</span>
                     </button>
                     <button onClick={() => onNavigate('gallery')} className="group flex flex-col items-center transition-all duration-300 hover:-translate-y-0.5">
                         <span className="text-[9px] font-mono text-white/50 mb-1 tracking-wider group-hover:text-white/80">GALLERY</span>
                         <span className="text-xs font-bold text-white group-hover:underline decoration-1 underline-offset-4">影像</span>
                     </button>
                     <button onClick={() => onNavigate('thoughts')} className="group flex flex-col items-center transition-all duration-300 hover:-translate-y-0.5">
                         <span className="text-[9px] font-mono text-white/50 mb-1 tracking-wider group-hover:text-white/80">NOTES</span>
                         <span className="text-xs font-bold text-white group-hover:underline decoration-1 underline-offset-4">便签</span>
                     </button>
                     <button onClick={() => onNavigate('blog')} className="group flex flex-col items-center transition-all duration-300 hover:-translate-y-0.5">
                         <span className="text-[9px] font-mono text-white/50 mb-1 tracking-wider group-hover:text-white/80">BLOG</span>
                         <span className="text-xs font-bold text-white group-hover:underline decoration-1 underline-offset-4">文章</span>
                     </button>
                 </div>
             </div>
        </div>

        {/* Bottom Section: Socials */}
        <div className="bg-paper p-6 relative">
             <Notch className="-left-4 top-0 -translate-y-1/2" />
             <Notch className="-right-4 top-0 -translate-y-1/2" />
             <DashedLine className="absolute top-0 left-4 right-4" />

             <div className="mt-2 flex flex-col items-center gap-4">
                 <div className="flex gap-4">
                     {profile.socials.map(social => (
                         <a key={social.platform} href={social.url} className="text-xs font-bold font-mono uppercase border-b border-ink hover:text-brand-accent hover:border-brand-accent transition-colors">
                             {social.platform}
                         </a>
                     ))}
                 </div>
                 <BarcodeHorizontal className="h-10 opacity-60 mix-blend-multiply" />
                 <p className="text-[10px] font-mono text-stone-400">TICKET NO. 88392019-X</p>
             </div>
        </div>

      </TicketBase>
    </div>
  );
};