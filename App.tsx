import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ProfileSection } from './components/ProfileSection';
import { GallerySection } from './components/GallerySection';
import { ThoughtSection } from './components/ThoughtSection';
import { BlogSection } from './components/BlogSection';
import { ContactSection } from './components/ContactSection';
import { DetailView } from './components/DetailView';
import { NavBar } from './components/NavBar';
import { Profile, PhotoGroup, Thought, BlogPost } from './types';
import { Info, Loader2 } from 'lucide-react';

// --- Default Demo Data ---
const defaultProfile: Profile = {
  name: "潘志明",
  role: "先见志明 | Photographer",
  bio: "这里是您的个人主页。目前显示的是演示数据。网站采用『票根』设计语言，将您的作品和文字转化为可以收藏的数字存根。",
  location: "Shanghai, CN",
  avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
  socials: [
      { platform: "INSTAGRAM", url: "#", handle: "@panziming" },
      { platform: "TWITTER", url: "#", handle: "@panziming" },
      { platform: "GITHUB", url: "#", handle: "panziming" }
  ]
};

const defaultPhotoGroups: PhotoGroup[] = [
  {
    id: "demo-g1",
    title: "东京夜雨",
    location: "Shibuya, Tokyo",
    count: 12,
    coverUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop",
    date: "2023-11-15",
    ticketNumber: "TKY-089",
    description: "霓虹灯下的涉谷街头，雨水倒映着城市的喧嚣。",
    featured: true
  },
  {
    id: "demo-g2",
    title: "冰岛公路",
    location: "Ring Road, Iceland",
    count: 36,
    coverUrl: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=1000&auto=format&fit=crop",
    date: "2023-08-22",
    ticketNumber: "ICL-002",
    description: "孤独的环岛公路，仿佛通向世界尽头。",
    featured: true
  }
];

const defaultThoughts: Thought[] = [
  {
    id: "demo-t1",
    content: "设计的本质不是为了装饰，而是为了解决问题。但在解决问题的过程中，我们不妨让它变得更浪漫一些。",
    date: "2024-02-14",
    time: "23:45",
    tags: ["设计", "生活"],
    featured: true
  },
  {
    id: "demo-t2",
    content: "所谓“复古”其实是我们对未曾经历的时代的乡愁。在数字时代，我们更需要一些有温度的触感。",
    date: "2024-02-12",
    time: "14:20",
    tags: ["感悟", "复古"],
    featured: true
  }
];

const defaultPosts: BlogPost[] = [
  {
    id: "demo-p1",
    title: "如何构建一个具有“票根感”的个人网站",
    excerpt: "分享如何使用 Tailwind CSS 和 React 来实现这种独特的纸质质感和票据风格设计。",
    date: "2024-03-01",
    readTime: "8 MIN",
    category: "技术",
    imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1000&auto=format&fit=crop",
    featured: true
  }
];

const demoAbout: BlogPost = {
    id: "demo-about",
    title: "我的说明书",
    excerpt: "一份关于我自己的操作指南、个人简介与维护手册。",
    date: "2024",
    readTime: "∞",
    category: "ABOUT",
    imageUrl: "https://images.unsplash.com/photo-1454165833222-7e737d97607a?q=80&w=1000&auto=format&fit=crop",
    featured: false
};

// --- Layout Component ---
interface MainLayoutProps {
    children?: React.ReactNode;
    hideNav?: boolean;
    isDemoMode?: boolean;
    logoUrl?: string;
    isHome?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, hideNav, isDemoMode, logoUrl, isHome }) => (
  <div className="min-h-screen flex flex-col text-ink font-sans selection:bg-ink selection:text-paper">
    {isDemoMode && (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 sticky top-0 z-[60]">
        <Info className="text-amber-500 shrink-0" size={12} />
        <p className="text-[10px] text-amber-600 font-mono tracking-wide uppercase font-bold">PREVIEW MODE / v1.0.4 (ACTIVE)</p>
      </div>
    )}
    {!hideNav && <NavBar logoUrl={logoUrl} />}
    <div className={`flex-grow w-full ${isHome ? '' : 'bg-texture'}`}>
      <main className="w-full max-w-[452px] mx-auto px-4 pt-8 md:pt-12 pb-12">
        {children}
      </main>
    </div>
  </div>
);

const setGlobalTheme = (mode: 'home' | 'paper') => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (mode === 'home') {
        document.body.style.backgroundColor = '#e3e1d5';
        document.body.style.backgroundImage = 'var(--noise-url)';
        if (meta) meta.setAttribute('content', '#e3e1d5');
    } else {
        document.body.style.backgroundColor = '#fdfbf7';
        document.body.style.backgroundImage = 'none';
        if (meta) meta.setAttribute('content', '#fdfbf7');
    }
};

const App: React.FC = () => {
  const location = useLocation();
  const [isDemoMode, setIsDemoMode] = useState(true);

  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>(defaultPhotoGroups);
  const [thoughts, setThoughts] = useState<Thought[]>(defaultThoughts);
  const [posts, setPosts] = useState<BlogPost[]>(defaultPosts);
  const [aboutPage, setAboutPage] = useState<BlogPost | null>(demoAbout);

  // Hard bump to v1.0.4
  const CURRENT_VERSION = 'v1.0.4';
  const CACHE_KEY = `portfolio_data_${CURRENT_VERSION}`;

  useEffect(() => {
    console.log(`%c[System] Portfolio ${CURRENT_VERSION} Loading...`, "background: #8a6d50; color: #fff; padding: 2px 5px; border-radius: 2px;");
    
    // Auto-purge old caches
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('portfolio_data_') && key !== CACHE_KEY) {
            console.log(`%c[System] Purging old cache: ${key}`, "color: #ff9900;");
            localStorage.removeItem(key);
        }
    }

    const isHome = location.pathname === '/' || location.pathname === '';
    setGlobalTheme(isHome ? 'home' : 'paper');
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const initData = async () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setProfile(data.profile || defaultProfile);
          setPhotoGroups(data.gallery || defaultPhotoGroups);
          setThoughts(data.thoughts || defaultThoughts);
          setPosts(data.posts || defaultPosts);
          setAboutPage(data.about || data.manual || demoAbout);
          setIsDemoMode(false);
        } catch (e) { console.warn("Cache parse error", e); }
      }

      try {
        const res = await fetch(`/api/portfolio?v=${CURRENT_VERSION}&t=${Date.now()}`);
        if (res.ok) {
           const data = await res.json();
           setProfile(data.profile || defaultProfile);
           setPhotoGroups(data.gallery || defaultPhotoGroups);
           setThoughts(data.thoughts || defaultThoughts);
           setPosts(data.posts || defaultPosts);
           setAboutPage(data.about || data.manual || demoAbout);
           localStorage.setItem(CACHE_KEY, JSON.stringify(data));
           setIsDemoMode(false); 
           console.log(`%c[System] Data Sync Successful (${CURRENT_VERSION})`, "color: #22c55e; font-weight: bold;");
        }
      } catch (e) {
        console.log("API not reachable, using offline demo data.");
      }
    };
    initData();
  }, []);

  const commonProps = { isDemoMode, logoUrl: profile.logoUrl };

  return (
    <Routes>
      <Route path="/" element={
        <MainLayout {...commonProps} hideNav isHome>
          <ProfileSection profile={profile} />
          <div className="flex flex-col gap-11 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {photoGroups.length > 0 && (
              <GallerySection 
                title="精选影像" 
                groups={photoGroups.filter(g => g.featured).length ? photoGroups.filter(g => g.featured) : photoGroups.slice(0, 2)} 
                onViewAll 
              />
            )}
            {thoughts.length > 0 && (
              <ThoughtSection 
                thoughts={thoughts.filter(t => t.featured).length ? thoughts.filter(t => t.featured).slice(0, 5) : thoughts.slice(0, 5)} 
                showViewAll 
              />
            )}
            {posts.length > 0 && (
              <BlogSection 
                title="精选文章" 
                posts={posts.filter(p => p.featured).length ? posts.filter(p => p.featured).slice(0, 3) : posts.slice(0, 3)} 
                showViewAll 
              />
            )}
            <ContactSection logoUrl={profile.logoUrl} />
          </div>
        </MainLayout>
      } />

      <Route path="/gallery" element={
        <MainLayout {...commonProps}>
          <GallerySection groups={photoGroups} />
        </MainLayout>
      } />
      <Route path="/gallery/:id" element={
        <DetailView items={photoGroups} type="gallery" logoUrl={profile.logoUrl} />
      } />

      <Route path="/thoughts" element={
        <MainLayout {...commonProps}>
          <ThoughtSection thoughts={thoughts} />
        </MainLayout>
      } />

      <Route path="/blog" element={
        <MainLayout {...commonProps}>
          <BlogSection posts={posts} />
        </MainLayout>
      } />
      <Route path="/blog/:id" element={
        <DetailView items={posts} type="blog" logoUrl={profile.logoUrl} />
      } />

      <Route path="/aboutme" element={
          aboutPage ? (
              <DetailView items={[aboutPage]} forceId={aboutPage.id} type="blog" logoUrl={profile.logoUrl} />
          ) : (
              <Navigate to="/" replace />
          )
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;