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
import { Info } from 'lucide-react';

// --- 全量演示数据：确保首页视觉饱满 ---
const defaultProfile: Profile = {
  name: "潘志明",
  role: "先见志明 | Photographer",
  bio: "记录生活瞬间的数字存根。这里展示了我的影像作品、日常碎碎念以及深度思考的文章。欢迎探索这个由 Notion 驱动的数字票根世界。",
  location: "Shanghai, CN",
  avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
  socials: [
      { platform: "INSTAGRAM", url: "#", handle: "@panziming" },
      { platform: "XIAOHONGSHU", url: "#", handle: "先见志明" },
      { platform: "GITHUB", url: "#", handle: "panziming" },
      { platform: "EMAIL", url: "mailto:hello@example.com", handle: "Email Me" }
  ]
};

const defaultPhotoGroups: PhotoGroup[] = [
  {
    id: "demo-g1",
    title: "东京夜雨",
    location: "Shibuya, Tokyo",
    count: 24,
    coverUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop",
    date: "2023-11-15",
    ticketNumber: "TKY-089",
    description: "霓虹灯下的涉谷街头，雨水倒映着城市的喧嚣。使用 Sony Alpha 7R V 拍摄。",
    featured: true
  },
  {
    id: "demo-g2",
    title: "京都散策",
    location: "Arashiyama, Kyoto",
    count: 18,
    coverUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop",
    date: "2023-11-20",
    ticketNumber: "KYO-042",
    description: "岚山的竹林与鸭川的微风，在这个深秋的午后显得人格外宁静。",
    featured: true
  }
];

const defaultThoughts: Thought[] = [
  {
    id: "demo-t1",
    content: "在这个追求效率的时代，我依然迷恋胶片那不可预知的显影过程。每一张照片都是时间的化身，而不仅仅是像素的堆砌。",
    date: "2024-03-20",
    time: "22:45",
    tags: ["摄影思考", "日常"]
  },
  {
    id: "demo-t2",
    content: "设计的本质是沟通。不仅是人与物的沟通，更是人与自我的对话。今天又在书店坐了一下午，满载而归。",
    date: "2024-03-18",
    time: "15:20",
    tags: ["书影音", "灵感"]
  },
  {
    id: "demo-t3",
    content: "生活不需要时刻都在线上。偶尔的断网，反而能让我们重新找回感官的敏锐。去呼吸、去触摸、去感受真实的温度。",
    date: "2024-03-10",
    time: "09:12",
    tags: ["极简主义"]
  }
];

const defaultPosts: BlogPost[] = [
  {
    id: "demo-p1",
    title: "为什么我们依然需要纸质的感觉？",
    excerpt: "在这个数字化的浪潮中，触感、气味和不完美反而成为了最稀缺的奢侈品。我们怀念纸张的纹理，因为它让时间有了触感。",
    date: "2024-01-12",
    readTime: "6 MIN",
    category: "ESSAY",
    imageUrl: "https://images.unsplash.com/photo-1454165833222-7e737d97607a?q=80&w=1000&auto=format&fit=crop",
    featured: true
  },
  {
    id: "demo-p2",
    title: "一个摄影师的京都散策：慢门下的时间流逝",
    excerpt: "鸭川边的晚风，岚山的竹林，在慢速快门下，一切都化作了流动的诗。通过镜头，我试图捕捉那些转瞬即逝的光影。",
    date: "2023-11-20",
    readTime: "8 MIN",
    category: "TRAVEL",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop",
    featured: true
  }
];

// --- 布局：黄金 452px 宽度 ---
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
      <div className="bg-stone-100/90 backdrop-blur-sm border-b border-stone-200 px-4 py-2 flex items-center justify-center gap-2 sticky top-0 z-[60]">
        <Info className="text-stone-400 shrink-0" size={12} />
        <p className="text-[10px] text-stone-500 font-mono tracking-[0.3em] uppercase">Studio Preview Mode</p>
      </div>
    )}
    {!hideNav && <NavBar logoUrl={logoUrl} />}
    <div className={`flex-grow w-full ${isHome ? '' : 'bg-texture'}`}>
      <main className="w-full max-w-[452px] mx-auto px-4 pt-12 pb-20">
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
  const [aboutPage, setAboutPage] = useState<BlogPost | null>(null);

  const CACHE_KEY = 'portfolio_data_v1.0.8';

  useEffect(() => {
    const isHome = location.pathname === '/' || location.pathname === '';
    setGlobalTheme(isHome ? 'home' : 'paper');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  useEffect(() => {
    const initData = async () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (data.profile) setProfile(data.profile);
          if (data.gallery?.length) setPhotoGroups(data.gallery);
          if (data.thoughts?.length) setThoughts(data.thoughts);
          if (data.posts?.length) setPosts(data.posts);
          setAboutPage(data.about || null);
          setIsDemoMode(false);
        } catch (e) { }
      }

      try {
        const res = await fetch('/api/portfolio');
        if (res.ok) {
           const data = await res.json();
           if (data.profile) setProfile(data.profile);
           if (data.gallery?.length) setPhotoGroups(data.gallery);
           if (data.thoughts?.length) setThoughts(data.thoughts);
           if (data.posts?.length) setPosts(data.posts);
           setAboutPage(data.about || null);
           localStorage.setItem(CACHE_KEY, JSON.stringify(data));
           setIsDemoMode(false); 
        }
      } catch (e) { }
    };
    initData();
  }, []);

  const commonProps = { isDemoMode, logoUrl: profile.logoUrl };

  return (
    <Routes>
      <Route path="/" element={
        <MainLayout {...commonProps} hideNav isHome>
          <ProfileSection profile={profile} />
          <div className="flex flex-col gap-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <GallerySection 
                title="精选影像" 
                groups={photoGroups.filter(g => g.featured).slice(0, 2)} 
                onViewAll 
            />
            <ThoughtSection thoughts={thoughts.slice(0, 5)} showViewAll />
            <BlogSection title="精选文章" posts={posts.slice(0, 3)} showViewAll />
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