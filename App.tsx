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

// --- Default Demo Data (Used when API fails) ---

const defaultProfile: Profile = {
  name: "演示用户",
  role: "Photographer & Coder",
  bio: "这是演示数据。网站采用票根设计语言，将生活瞬间转化为数字存根。配置 Notion 后可加载真实内容。",
  location: "Shanghai, CN",
  avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
  socials: [
      { platform: "INSTAGRAM", url: "#", handle: "@demo" },
      { platform: "TWITTER", url: "#", handle: "@demo" },
      { platform: "GITHUB", url: "#", handle: "@demo" }
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
    description: "霓虹灯下的涉谷街头，雨水倒映着城市的喧嚣。使用 CineStill 800T 拍摄。",
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
    tags: ["Design", "Life"],
    featured: true
  },
  {
    id: "demo-t2",
    content: "今天在咖啡馆听到一首很老的爵士乐，突然意识到，所谓“复古”其实是我们对未曾经历的时代的乡愁。",
    date: "2024-02-12",
    time: "14:20",
    tags: ["Music", "Mood"],
    featured: true
  }
];

const defaultPosts: BlogPost[] = [
  {
    id: "demo-p1",
    title: "如何构建一个具有“票根感”的个人网站",
    excerpt: "在这篇文章中，我将分享如何使用 Tailwind CSS 和 React 来实现这种独特的纸质质感和票据风格设计。",
    date: "2024-03-01",
    readTime: "8 MIN",
    category: "Code",
    imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1000&auto=format&fit=crop",
    featured: true
  }
];

// --- Theme Utility ---
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
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [manualPage, setManualPage] = useState<BlogPost | null>(null);

  const CACHE_KEY = 'portfolio_data_v1';

  useEffect(() => {
    const isHome = location.pathname === '/';
    setGlobalTheme(isHome ? 'home' : 'paper');
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const initData = async () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (data) {
            setProfile(data.profile || defaultProfile);
            setPhotoGroups(data.gallery || []);
            setThoughts(data.thoughts || []);
            setPosts(data.posts || []);
            setManualPage(data.manual || null);
            setLoading(false);
          }
        } catch (e) { console.warn("Cache error", e); }
      }

      try {
        const res = await fetch('/api/portfolio');
        if (!res.ok) throw new Error('API unavailable');
        
        const data = await res.json();
        setProfile(data.profile || defaultProfile);
        setPhotoGroups(data.gallery || []);
        setThoughts(data.thoughts || []);
        setPosts(data.posts || []);
        setManualPage(data.manual || null);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        setIsDemoMode(false); 
      } catch (e) {
        // If fetch fails and no cache, use Demo Data
        if (!cached) {
            setProfile(defaultProfile);
            setPhotoGroups(defaultPhotoGroups);
            setThoughts(defaultThoughts);
            setPosts(defaultPosts);
            setIsDemoMode(true);
        }
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-texture flex items-center justify-center font-mono text-xs text-stone-400">
        <Loader2 className="animate-spin mr-2" size={16} />
        LOADING PORTFOLIO...
      </div>
    );
  }

  const MainLayout = ({ children, hideNav = false }: { children?: React.ReactNode, hideNav?: boolean }) => (
    <div className="min-h-screen flex flex-col text-ink font-sans selection:bg-ink selection:text-paper">
      {isDemoMode && (
        <div className="bg-stone-100 border-b border-stone-200 px-4 py-2 flex items-center justify-center gap-2 sticky top-0 z-[60]">
          <Info className="text-stone-400 shrink-0" size={12} />
          <p className="text-[10px] text-stone-500 font-mono tracking-wide">PREVIEW MODE / DEMO DATA</p>
        </div>
      )}
      {!hideNav && <NavBar logoUrl={profile.logoUrl} />}
      <div className={`flex-grow w-full ${location.pathname === '/' ? '' : 'bg-texture'}`}>
        <main className="w-full max-w-[452px] mx-auto px-4 pt-8 md:pt-12 pb-12">
          {children}
        </main>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={
        <MainLayout hideNav>
          <ProfileSection profile={profile} />
          <div className="flex flex-col gap-11 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {photoGroups.filter(g => g.featured).length > 0 && (
              <GallerySection title="精选影像" groups={photoGroups.filter(g => g.featured)} onViewAll />
            )}
            {thoughts.filter(t => t.featured).length > 0 && (
              <ThoughtSection thoughts={thoughts.filter(t => t.featured).slice(0, 10)} showViewAll />
            )}
            {posts.filter(p => p.featured).length > 0 && (
              <BlogSection title="精选文章" posts={posts.filter(p => p.featured)} showViewAll />
            )}
            <ContactSection logoUrl={profile.logoUrl} />
          </div>
        </MainLayout>
      } />

      <Route path="/gallery" element={
        <MainLayout>
          <GallerySection groups={photoGroups} />
        </MainLayout>
      } />

      <Route path="/gallery/:id" element={
        <DetailView items={photoGroups} type="gallery" logoUrl={profile.logoUrl} />
      } />

      <Route path="/thoughts" element={
        <MainLayout>
          <ThoughtSection thoughts={thoughts} />
        </MainLayout>
      } />

      <Route path="/blog" element={
        <MainLayout>
          <BlogSection posts={posts} />
        </MainLayout>
      } />

      <Route path="/blog/:id" element={
        <DetailView items={posts} type="blog" logoUrl={profile.logoUrl} />
      } />

      <Route path="/manual" element={
          manualPage ? (
              <DetailView items={[manualPage]} forceId={manualPage.id} type="blog" logoUrl={profile.logoUrl} />
          ) : (
              <Navigate to="/" replace />
          )
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;