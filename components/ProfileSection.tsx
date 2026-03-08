import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Profile } from '../types';
import { TicketBase, Notch, DashedLine, BarcodeHorizontal } from './TicketUI';
import { optimizeImage } from '../utils/imageOptimizer';
import { 
    Instagram, Twitter, Github, Linkedin, Mail, Youtube, 
    Globe, Zap, MessageCircle, Link as LinkIcon, Tv, Radio, BookOpen 
} from 'lucide-react';

interface Props {
  profile: Profile;
}

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1000&auto=format&fit=crop";

const SOCIAL_MAP: Record<string, { label: string; icon: React.ElementType }> = {
    INSTAGRAM: { label: 'Instagram', icon: Instagram },
    TWITTER: { label: 'Twitter', icon: Twitter },
    GITHUB: { label: 'GitHub', icon: Github },
    LINKEDIN: { label: 'LinkedIn', icon: Linkedin },
    YOUTUBE: { label: 'YouTube', icon: Youtube },
    EMAIL: { label: 'Email', icon: Mail },
    WEIBO: { label: '微博', icon: Globe },
    XIAOHONGSHU: { label: '小红书', icon: BookOpen },
    JIKE: { label: '即刻', icon: Zap },
    WECHAT: { label: '公众号', icon: MessageCircle },
    BILIBILI: { label: 'Bilibili', icon: Tv },
    XIAOYUZHOU: { label: '小宇宙', icon: Radio },
    DOUBAN: { label: '豆瓣', icon: BookOpen },
    LINK: { label: 'Link', icon: LinkIcon }
};

const getSocialConfig = (platform: string) => {
    return SOCIAL_MAP[platform.toUpperCase()] || { label: platform, icon: LinkIcon };
};

export const ProfileSection: React.FC<Props> = ({ profile }) => {
  const [imgError, setImgError] = useState(false);

  // 优化头像 URL
  const avatarSrc = imgError 
    ? optimizeImage(FALLBACK_AVATAR, 640) 
    : optimizeImage(profile.avatarUrl || FALLBACK_AVATAR, 640);

  return (
    <div className="flex justify-center w-full mb-16">
      <TicketBase className="w-full rounded-2xl flex flex-col">
        {/* 顶部海报区 */}
        <div className="relative aspect-[3/4] w-full rounded-t-2xl overflow-hidden bg-stone-900">
            <img 
                src={avatarSrc} 
                alt="Profile" 
                className="w-full h-full object-cover filter brightness-[0.85] contrast-110 transition-opacity duration-500" 
                onError={() => setImgError(true)}
            />
            <div className="absolute top-8 left-0 w-full text-center text-white mix-blend-overlay opacity-80">
                <p className="font-mono text-[10px] tracking-[0.6em] uppercase">Life Archives</p>
            </div>
            <div className="absolute bottom-12 left-8 right-8 text-white">
                 <h2 className="text-xs font-mono mb-2 tracking-widest opacity-80">PanZhiMing</h2>
                 <h1 className="text-5xl font-serif font-bold tracking-tight leading-none mb-2">2026<br/>先见志明</h1>
            </div>
             <Link 
                to="/aboutme"
                className="absolute bottom-4 right-4 text-white/70 text-[10px] font-mono border border-white/30 px-3 py-1 rounded-full hover:bg-white/10 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
            >
                我的说明书 &rarr;
            </Link>
        </div>

        {/* 核心信息区 */}
        <div className="relative bg-brand-accent text-white p-8">
             <Notch className="-left-4 top-0 -translate-y-1/2" />
             <Notch className="-right-4 top-0 -translate-y-1/2" />
             <DashedLine className="absolute top-0 left-4 right-4 border-white/30" />
             
             <div className="mt-4">
                 <div className="flex justify-between items-end mb-6">
                     <div>
                         <p className="text-[10px] opacity-70 tracking-widest mb-1 uppercase">Starring</p>
                         <p className="text-2xl font-serif font-bold">{profile.name}</p>
                     </div>
                     <div className="text-right">
                         <p className="text-[10px] opacity-70 tracking-widest mb-1 uppercase">Location</p>
                         <p className="font-mono text-sm">{profile.location}</p>
                     </div>
                 </div>
                 <p className="font-serif text-sm leading-relaxed opacity-90 mb-8 border-l-2 border-white/30 pl-4 py-1 text-justify">
                     {profile.bio}
                 </p>
                 
                 {/* 底部导航 */}
                 <div className="grid grid-cols-4 gap-1 text-center border-t border-white/20 pt-8">
                     <Link to="/" className="group flex flex-col items-center">
                         <span className="text-[9px] font-mono text-white/40 mb-1 tracking-wider">HOME</span>
                         <span className="text-xs font-bold text-white group-hover:underline">首页</span>
                     </Link>
                     <Link to="/gallery" className="group flex flex-col items-center">
                         <span className="text-[9px] font-mono text-white/40 mb-1 tracking-wider">GALLERY</span>
                         <span className="text-xs font-bold text-white group-hover:underline">摄影</span>
                     </Link>
                     <Link to="/thoughts" className="group flex flex-col items-center">
                         <span className="text-[9px] font-mono text-white/40 mb-1 tracking-wider">NOTES</span>
                         <span className="text-xs font-bold text-white group-hover:underline">便签</span>
                     </Link>
                     <Link to="/blog" className="group flex flex-col items-center">
                         <span className="text-[9px] font-mono text-white/40 mb-1 tracking-wider">BLOG</span>
                         <span className="text-xs font-bold text-white group-hover:underline">博客</span>
                     </Link>
                 </div>
             </div>
        </div>

        {/* 社交链接与条形码（白色区域） */}
        <div className="bg-paper p-8 relative rounded-b-2xl">
             <Notch className="-left-4 top-0 -translate-y-1/2" />
             <Notch className="-right-4 top-0 -translate-y-1/2" />
             <DashedLine className="absolute top-0 left-4 right-4" />
             
             <div className="mt-4 flex flex-col items-center gap-10">
                 <div className="flex flex-wrap justify-center gap-x-6 gap-y-5 px-2">
                     {profile.socials.map(social => {
                         const { label, icon: Icon } = getSocialConfig(social.platform);
                         return (
                             <a key={social.platform + social.url} href={social.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold font-mono uppercase text-ink/70 hover:text-brand-accent transition-all group">
                                 <Icon size={16} className="group-hover:scale-110 transition-transform" />
                                 <span className="border-b border-transparent group-hover:border-brand-accent">{label}</span>
                             </a>
                         );
                     })}
                 </div>
                 
                 {/* 条形码修正：确保容器居中 */}
                 <div className="w-full flex flex-col items-center opacity-40">
                    <BarcodeHorizontal className="h-8 w-48 mix-blend-multiply" />
                    <p className="text-[9px] font-mono mt-3 tracking-[0.4em] uppercase text-center">PanZhiMing.com</p>
                 </div>
             </div>
        </div>
      </TicketBase>
    </div>
  );
};
