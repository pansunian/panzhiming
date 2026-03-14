import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Profile } from '../types';
import { TicketBase, Notch, DashedLine, BarcodeHorizontal } from './TicketUI';
import { optimizeImage } from '../utils/imageOptimizer';
import { 
    Instagram, Twitter, Github, Linkedin, Mail, Youtube, 
    Globe,BookOpen,  Link as LinkIcon 
} from 'lucide-react';

// 👇 在这里添加（紧接在上面 import 的下方）
// 自定义平台图标
const XiaohongshuIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <path d="M405.7 925.3c6.8-14.8 12.5-27.6 18.6-40.2 14-25.9 26.5-52.5 37.7-79.8 6.6-25.6 31.6-41.2 56.4-35.2 35.6 2.5 71.4 0.6 108.6 0.6V306.9c-25 0-49.7-0.9-74.2 0-17.1 0.9-23.1-4.7-22.6-23 1.2-43.9 0-88 0-133.9h347.4v106.5c0 50.1 0 50.1-48.6 50.1h-48.8v463.7h105.4c42.5 0 42.5 0 42.5 44.6v93.5c0 12.9-3.2 19.5-17.2 19.5-164.9-0.3-329.8-0.5-494.7-0.4-3.6-0.4-7.1-1.2-10.5-2.2" fill="currentColor"/>
    <path d="M471.4 589.4c-21.7 44.8-40.8 84.8-60.8 124.1-3.6 4.6-8.9 7.2-14.6 7.3-48.3 0-96.9 1.9-145-1.7-48.2-3.6-67.5-34.6-48.3-81.9 21.9-54.6 48.2-107.4 72.6-160.9 1.5-3.4 2.7-6.8 5.6-14.3-19.5 0-36.6 0.5-53.7 0-13.9 0.2-27.8-1.1-41.4-3.8-26-3.1-44.7-27.4-41.7-54.4 0.6-5.7 2.2-11.2 4.7-16.4 29.3-70.3 62.1-139.2 93.7-208.4 10.3-22.7 21.1-45.1 32.7-67.2 3-5.7 9.9-13 15.2-13.2 45.2-1.1 90.5-0.6 139.8-0.6-4.3 11-6.7 18.5-10 25.5-27.7 57.9-55.4 115.7-83.3 173.4-5.6 11.7-12.4 23.9 8.6 32.8 5.6-30.1 28.2-24.6 48-24.6h114.2c-4.8 11.4-7.9 19.3-11.4 26.9-35.2 73.7-71.1 146.8-105.8 220.4-14.3 30-9.5 37.3 23.7 37.6 17.1-0.5 34.4-0.6 57.2-0.6M409.3 770.8c-26.8 53.7-50.7 102-75.2 150-2.9 4.1-7.5 6.7-12.4 7-65.7-0.8-131.5-2-197.4-3.7-9-1.4-17.8-3.7-26.4-7l36.8-74.4c12-24.6 23.7-49.1 36.6-72.5 3.5-5.7 9.3-9.5 15.8-10.4 60.3 3 120.6 7.2 181 10.9 12.1 0.6 23.6 0.1 41.2 0.1" fill="currentColor"/>
  </svg>
);

const JikeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <path d="M297.88660622 864.60698169a17.99472925 17.99472925 0 0 1-1.92238933 0.35535076l61.27179093 59.73970488c58.91832035-5.41181725 116.59000035-20.90744035 159.05150293-36.26325333 42.49645511-15.39076551 77.44316302-35.15642311 104.9100288-59.38435413a221.79130027 221.79130027 0 0 0 61.02129778-87.27647574c13.18293049-33.98551325 19.77148302-73.20225565 19.77148302-117.66187804V404.55008711c0-49.51608889 0.18058809-92.43779982 0.53593885-128.73600569 0.35535075-36.3331584 0.57089138-69.10698382 0.57089138-98.42633387l-68.53609245-54.67741297c0 29.24361955-0.18058809 62.01744498-0.53593884 98.31565084s-0.53593885 79.22574222-0.53593884 128.73600569v219.57763982c0 44.45379698-6.58855253 83.6763648-19.77148303 117.62692552a221.8786816 221.8786816 0 0 1-61.02129777 87.27647573c-27.43191325 24.2221056-62.40774827 44.02854115-104.9100288 59.38435413-41.93138915 15.16357405-91.9076864 25.49787307-149.89976463 30.97959538z" fill="currentColor" opacity="0.4"/>
    <path d="M634.59018525 122.59965155c0 29.27857209-0.21554062 62.08735005-0.57089138 98.39138134a13396.43221333 13396.43221333 0 0 0-0.53593885 128.77678364v219.57763982c0 44.45379698-6.58855253 83.6763648-19.80643555 117.62692552a221.85537991 221.85537991 0 0 1-60.98634525 87.27647573c-27.46686578 24.2221056-62.44852622 44.02854115-104.9100288 59.38435413s-93.15432675 25.75419165-152.07264711 31.17183432l-33.05927111-142.02379378c26.85519645-2.98261618 53.48320142-7.79441493 79.68595058-14.38879289a165.97210453 165.97210453 0 0 0 59.62902187-28.46301298c18.05880889-14.06839467 31.70194773-31.77767822 40.96436906-53.1103744 9.19251627-21.3385216 13.78294898-49.51608889 13.78294898-84.5676544 0-28.21251982 0.1048576-57.92217315 0.28544569-89.19886507 0.18058809-31.24173938 0.25049315-63.51457849 0.25049315-96.74861226 0-57.85226809-0.25049315-103.83815111-0.786432-137.99842702-0.57089138-34.16027591-0.9961472-66.04281173-1.35149795-95.68256h179.42882987l0.0524288-0.0233017z" fill="currentColor"/>
  </svg>
);

const XiaoyuzhouIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <path d="M906.24 175.018667c8.362667 3.498667 15.786667 8.917333 21.674667 15.829333l0.512 0.256a54.442667 54.442667 0 0 1 9.002666 43.264c-2.944 14.165333-8.106667 27.776-15.274666 40.362667a539.008 539.008 0 0 1-70.144 94.378666 2037.333333 2037.333333 0 0 1-265.856 241.024 2034.901333 2034.901333 0 0 1-301.056 197.632c-34.389333 18.688-70.784 33.493333-108.458667 44.245334-13.909333 3.84-28.373333 5.333333-42.794667 4.565333a54.101333 54.101333 0 0 1-39.509333-19.626667 45.653333 45.653333 0 0 1-8.917333-30.037333c0.512-8.789333 2.474667-17.493333 5.802666-25.642667 7.68-18.261333 17.493333-35.541333 29.269334-51.456a1032.405333 1032.405333 0 0 1 89.045333-106.325333 325.418667 325.418667 0 0 1-16.256-101.717333 322.304 322.304 0 0 1 494.08-274.261334 778.282667 778.282667 0 0 1 139.093333-66.304 184.96 184.96 0 0 1 53.290667-10.368c9.045333-0.725333 18.133333 0.725333 26.496 4.181334z m-96.426667 156.373333a483.029333 483.029333 0 0 0 62.549334-83.626667l-0.213334-0.256c3.584-6.272 6.485333-12.970667 8.533334-19.882666-12.373333 0.853333-24.490667 3.413333-36.138667 7.594666-37.546667 13.141333-73.898667 29.696-108.458667 49.408 11.050667 10.325333 21.333333 21.461333 30.848 33.28a2032.810667 2032.810667 0 0 1-239.829333 215.466667 2013.482667 2013.482667 0 0 1-269.824 179.626667 312.32 312.32 0 0 1-21.589333-33.450667c-24.234667 26.069333-46.933333 53.589333-67.84 82.432-8.618667 11.733333-16 24.32-22.058667 37.546667 6.272-0.426667 12.501333-1.493333 18.56-3.114667 33.450667-9.728 65.792-23.04 96.426667-39.637333a1982.549333 1982.549333 0 0 0 290.901333-191.232 1992.789333 1992.789333 0 0 0 258.133333-234.154667zM365.141333 807.04a2331.989333 2331.989333 0 0 0 243.626667-166.656l-0.426667-0.512a2334.549333 2334.549333 0 0 0 221.269334-192.810667A323.84 323.84 0 0 1 516.266667 844.8a319.488 319.488 0 0 1-151.125334-37.717333z" fill="currentColor"/>
  </svg>
);
const WechatIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <path d="M244.672 641.472 223.552 727.104 361.408 664.832Z" fill="currentColor"/>
    <path d="M753.536 806.144 812.544 863.744 812.16 769.024Z" fill="currentColor"/>
    <path d="M676.224 474.496c-124.8 0-225.92 80.704-225.92 180.224s101.12 180.224 225.92 180.224 225.92-80.704 225.92-180.224S801.024 474.496 676.224 474.496zM595.264 617.088c-12.608 0-22.848-10.24-22.848-22.848s10.24-22.848 22.848-22.848c12.608 0 22.848 10.24 22.848 22.848S607.872 617.088 595.264 617.088zM756.416 617.088c-12.608 0-22.848-10.24-22.848-22.848s10.24-22.848 22.848-22.848c12.608 0 22.848 10.24 22.848 22.848S769.024 617.088 756.416 617.088z" fill="currentColor"/>
    <path d="M663.168 463.104c-7.424-117.952-125.376-211.776-270.336-211.776-149.696 0-271.04 100.032-271.04 223.424 0 123.392 121.344 223.424 271.04 223.424 16.32 0 32.192-1.408 47.68-3.648-3.392-12.864-5.248-26.176-5.248-39.808C435.328 552.128 536.256 468.544 663.168 463.104zM302.08 424.768c-16.896 0-30.592-13.696-30.592-30.592 0-16.896 13.696-30.592 30.592-30.592 16.896 0 30.592 13.696 30.592 30.592C332.672 411.072 318.976 424.768 302.08 424.768zM471.296 394.176c0-16.896 13.696-30.592 30.592-30.592 16.896 0 30.592 13.696 30.592 30.592 0 16.896-13.696 30.592-30.592 30.592C484.992 424.768 471.296 411.072 471.296 394.176z" fill="currentColor"/>
  </svg>
);
const BilibiliIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <path d="M998.4 352.256c-3.072-136.192-121.856-162.304-121.856-162.304s-92.672-0.512-212.992-1.536l87.552-84.48s13.824-17.408-9.728-36.864c-23.552-19.456-25.088-10.752-33.28-5.632-7.168 5.12-112.128 108.032-130.56 126.464-47.616 0-97.28-0.512-145.408-0.512h16.896S323.584 63.488 315.392 57.856s-9.216-13.824-33.28 5.632c-23.552 19.456-9.728 36.864-9.728 36.864l89.6 87.04c-97.28 0-181.248 0.512-220.16 2.048C15.872 225.792 25.6 352.256 25.6 352.256s1.536 271.36 0 408.576c13.824 137.216 119.296 159.232 119.296 159.232s41.984 1.024 73.216 1.024c3.072 8.704 5.632 51.712 53.76 51.712 47.616 0 53.76-51.712 53.76-51.712s350.72-1.536 379.904-1.536c1.536 14.848 8.704 54.272 56.832 53.76 47.616-1.024 51.2-56.832 51.2-56.832s16.384-1.536 65.024 0c113.664-20.992 120.32-154.112 120.32-154.112s-2.048-273.92-0.512-410.112z m-97.792 434.176c0 21.504-16.896 38.912-37.888 38.912h-691.2c-20.992 0-37.888-17.408-37.888-38.912v-458.24c0-21.504 16.896-38.912 37.888-38.912h691.2c20.992 0 37.888 17.408 37.888 38.912v458.24z" fill="currentColor"/>
    <path d="M409.088 418.816l-203.264 38.912 17.408 76.288 201.216-38.912z m109.568 202.24c-49.664 106.496-94.208 26.112-94.208 26.112l-33.28 21.504s65.536 89.6 128 21.504c73.728 68.096 130.048-22.016 130.048-22.016l-30.208-19.456c0-0.512-52.736 75.776-100.352-27.648z m100.352-125.952l201.728 38.912 16.896-76.288-202.752-38.912z" fill="currentColor"/>
  </svg>
);
// 👆 添加到这里结束

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
    XIAOHONGSHU: { label: '小红书', icon: XiaohongshuIcon },
    JIKE: { label: '即刻', icon: JikeIcon },
    XIAOYUZHOU: { label: '小宇宙', icon: XiaoyuzhouIcon },
    WECHAT: { label: '公众号', icon: WechatIcon },
    BILIBILI: { label: 'Bilibili', icon: BilibiliIcon },
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
                 <h1 className="text-5xl font-serif tracking-tight leading-none mb-2">2026<br/>先见志明</h1>
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
      const isWechat = social.platform === 'WECHAT';
      const iconSize =
        social.platform === 'XIAOHONGSHU' ? 16
        : social.platform === 'WECHAT' ? 20
        : 18;

      return (
        <div key={social.platform + social.url} className="relative group">
          {isWechat ? (
            <div className="flex items-center gap-2 cursor-pointer text-xs font-bold font-mono uppercase text-ink/70">
              <div className="w-7 h-7 rounded-full border border-ink/30 flex items-center justify-center transition-colors group-hover:bg-ink group-hover:border-ink">
                <Icon size={iconSize} className="transition-colors group-hover:text-paper" />
              </div>
              <span className="border-b border-transparent group-hover:border-brand-accent" hidden sm:block>{label}</span>
            </div>
          ) : (
            <a href={social.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-bold font-mono uppercase text-ink/70 hover:text-brand-accent transition-all">
              <div className="w-7 h-7 rounded-full border border-ink/30 flex items-center justify-center transition-colors group-hover:bg-ink group-hover:border-ink">
                <Icon size={iconSize} className="transition-colors group-hover:text-paper" />
              </div>
             <span className="border-b border-transparent group-hover:border-brand-accent" hidden sm:block>{label}</span>
            </a>
          )}

          {/* 公众号二维码弹出层 */}
          {isWechat && (
           <div className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 w-36">
          <div className="bg-white rounded-xl shadow-lg p-3 flex flex-col items-center">
                <img src="/wechat-qr.jpg" alt="公众号二维码" className="w-28 object-contain" />
                <p className="text-[10px] text-ink/50 mt-1 font-mono">扫码关注公众号</p>
              </div>
              <div className="w-3 h-3 bg-white rotate-45 mx-auto -mt-1.5" />
    
            </div>
          )}
        </div>
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
