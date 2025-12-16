import React from 'react';
import { Profile } from '../types';
import { TicketBase, Notch, DashedLine, BarcodeHorizontal } from './TicketUI';
import { 
    Instagram, 
    Twitter, 
    Github, 
    Linkedin, 
    Mail, 
    Youtube, 
    Globe, 
    Zap, 
    MessageCircle, 
    Link as LinkIcon, 
    Clapperboard, 
    BookOpen 
} from 'lucide-react';

interface Props {
  profile: Profile;
  onNavigate: (view: 'home' | 'gallery' | 'thoughts' | 'blog') => void;
  onOpenManual?: () => void;
}

// Configuration for Social Media Display
const SOCIAL_MAP: Record<string, { label: string; icon: React.ElementType }> = {
    // International
    INSTAGRAM: { label: 'Instagram', icon: Instagram },
    TWITTER: { label: 'Twitter', icon: Twitter },
    GITHUB: { label: 'GitHub', icon: Github },
    LINKEDIN: { label: 'LinkedIn', icon: Linkedin },
    YOUTUBE: { label: 'YouTube', icon: Youtube },
    EMAIL: { label: 'Email', icon: Mail },
    
    // Chinese / Specific
    WEIBO: { label: '微博', icon: Globe },
    XIAOHONGSHU: { label: '小红书', icon: BookOpen }, // 'Little Red Book' -> Book Icon
    RED: { label: '小红书', icon: BookOpen }, // Legacy support
    JIKE: { label: '即刻', icon: Zap }, // Jike uses a yellow energetic icon -> Zap
    WECHAT: { label: '公众号', icon: MessageCircle },
    BILIBILI: { label: 'Bilibili', icon: Clapperboard },
    DOUBAN: { label: '豆瓣', icon: BookOpen },
    
    // Fallback
    LINK: { label: 'Link', icon: LinkIcon }
};

const getSocialConfig = (platform: string) => {
    const key = platform.toUpperCase();
    return SOCIAL_MAP[key] || { label: platform, icon: LinkIcon };
};

export const ProfileSection: React.FC<Props> = ({ profile, onNavigate, onOpenManual }) => {
  return (
    <div className="flex justify-center w-full mb-24">
      {/* 
        Updates:
        1. Removed 'shadow-ticket' to flatten the card. This ensures the "Notches" (which are patches of background color)
           blend perfectly with the page background without being interrupted by a shadow halo.
        2. Kept structure allowing Notches to overlay the content.
      */}
      <TicketBase className="w-full rounded-2xl flex flex-col">
        
        {/* Top Section: Visual */}
        <div className="relative aspect-[4/5] w-full rounded-t-2xl overflow-hidden">
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
            
             <button 
                onClick={onOpenManual}
                className="absolute bottom-4 right-4 text-white/70 text-[10px] font-mono border border-white/40 px-3 py-1 rounded-full hover:bg-white/10 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
            >
                我的说明书 &rarr;
            </button>
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
                     {profile.bio}
                 </p>

                 {/* Navigation Grid */}
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
        <div className="bg-paper p-6 relative rounded-b-2xl">
             <Notch className="-left-4 top-0 -translate-y-1/2" />
             <Notch className="-right-4 top-0 -translate-y-1/2" />
             <DashedLine className="absolute top-0 left-4 right-4" />

             <div className="mt-2 flex flex-col items-center gap-4">
                 <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 px-2">
                     {profile.socials.map(social => {
                         const { label, icon: Icon } = getSocialConfig(social.platform);
                         return (
                             <a 
                                key={social.platform + social.url} 
                                href={social.url} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs font-bold font-mono uppercase text-ink/70 hover:text-brand-accent transition-colors group"
                             >
                                 <Icon size={14} className="group-hover:scale-110 transition-transform" />
                                 <span className="border-b border-transparent group-hover:border-brand-accent pb-0.5">{label}</span>
                             </a>
                         );
                     })}
                 </div>
                 <BarcodeHorizontal className="h-10 opacity-60 mix-blend-multiply mt-2" />
                 <p className="text-[10px] font-mono text-stone-400">TICKET NO. 88392019-X</p>
             </div>
        </div>

      </TicketBase>
    </div>
  );
};