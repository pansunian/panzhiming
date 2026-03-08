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
import { Info, AlertCircle } from 'lucide-react';
import { mockProfile, mockGallery, mockThoughts, mockPosts, mockAbout } from './data/mockData';

// --- 缓存配置 ---
const CACHE_KEY = 'portfolio_snapshot_v1';

// --- 默认占位图：深色抽象背景 ---
const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1000&auto=format&fit=crop";

// --- 基础状态 ---
const defaultProfile: Profile = {
  name: "Loading...",
  role: "...",
  bio: "...",
  location: "...",
  avatarUrl: FALLBACK_AVATAR,
  socials: []
};

// --- 布局组件 ---
const MainLayout: React.FC<{ children?: React.ReactNode; hideNav?: boolean; isDemoMode?: boolean; logoUrl?: string; isHome?: boolean; }> = ({ children, hideNav, isDemoMode, logoUrl, isHome }) => (
  <div className="min-h-screen flex flex-col text-ink font-sans selection:bg-ink selection:text-paper overflow-x-hidden">
    {isDemoMode && (
      <div className="bg-amber-50/90 backdrop-blur-sm border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 sticky top-0 z-[60]">
        <Info className="text-amber-500 shrink-0" size={12} />
        <p className="text-[10px] text-amber-700 font-mono tracking-[0.2em] uppercase font-bold">演示模式：未连接数据库，展示预览数据</p>
      </div>
    )}
    {!hideNav && <NavBar logoUrl={logoUrl} />}
    <div className={`flex-grow w-full flex flex-col items-center ${isHome ? '' : 'bg-texture'}`}>
      <main className="w-full max-w-[420px] mx-auto px-4 pt-12 pb-20 shrink-0">
        {children}
      </main>
    </div>
  </div>
);

const App: React.FC = () => {
  const location = useLocation();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCache, setHasCache] = useState(false);

  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [aboutPage, setAboutPage] = useState<BlogPost | null>(null);

  // 1. 初始化时尝试从缓存读取数据 (Fast-path)
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data.profile) setProfile(data.profile);
        if (data.gallery) setPhotoGroups(data.gallery);
        if (data.thoughts) setThoughts(data.thoughts);
        if (data.posts) setPosts(data.posts);
        if (data.about) setAboutPage(data.about);
        setHasCache(true);
        setIsLoading(false); 
      } catch (e) {
        console.warn("Failed to parse cache", e);
      }
    }
  }, []);

  useEffect(() => {
    const isHome = location.pathname === '/' || location.pathname === '';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (isHome) {
        document.body.style.backgroundColor = '#e3e1d5';
        document.body.style.backgroundImage = 'var(--noise-url)';
        if (meta) meta.setAttribute('content', '#e3e1d5');
    } else {
        document.body.style.backgroundColor = '#fdfbf7';
        document.body.style.backgroundImage = 'none';
        if (meta) meta.setAttribute('content', '#fdfbf7');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const loadDemoData = () => {
      console.warn("Loading Demo Data...");
      setProfile(mockProfile);
      setPhotoGroups(mockGallery);
      setThoughts(mockThoughts);
      setPosts(mockPosts);
      setAboutPage(mockAbout);
      setIsDemoMode(true);
  };

  useEffect(() => {
    const initData = async () => {
      try {
        const res = await fetch('/api/portfolio');
        if (res.ok) {
           const data = await res.json();
           
           // 简单的空数据检查，如果 API 返回空对象，也视为需要 Demo
           if (!data.profile || !data.profile.name) {
               if (!hasCache) loadDemoData();
               return;
           }

           if (data.profile) setProfile(data.profile);
           if (data.gallery) setPhotoGroups(data.gallery);
           if (data.thoughts) setThoughts(data.thoughts);
           if (data.posts) setPosts(data.posts);
           if (data.about) setAboutPage(data.about);
           
           localStorage.setItem(CACHE_KEY, JSON.stringify(data));
           setIsDemoMode(false); 
        } else {
            // 只有在没缓存且接口报错的情况下才开启 Demo
            if (!hasCache) loadDemoData();
        }
      } catch (e) { 
          if (!hasCache) loadDemoData();
      } finally { 
          setIsLoading(false); 
      }
    };
    initData();
  }, [hasCache]);

  const commonProps = { isDemoMode, logoUrl: profile.logoUrl };

  return (
    <Routes>
      <Route path="/" element={
        <MainLayout {...commonProps} hideNav isHome>
          <ProfileSection profile={profile} />
          <div className="flex flex-col gap-8">
            <GallerySection title="纪实摄影" groups={photoGroups.length > 0 ? photoGroups.filter(g => g.featured).slice(0, 2) : []} onViewAll={photoGroups.length > 0} />
            <ThoughtSection thoughts={thoughts.length > 0 ? thoughts.filter(t => t.featured) : []} showViewAll={thoughts.length > 0} />
            <BlogSection title="推荐阅读" posts={posts.length > 0 ? posts.filter(p => p.featured).slice(0, 10) : []} showViewAll={posts.length > 0} />
            <ContactSection logoUrl={profile.logoUrl} />
          </div>
        </MainLayout>
      } />
      <Route path="/gallery" element={<MainLayout {...commonProps}><GallerySection groups={photoGroups} /></MainLayout>} />
      <Route path="/gallery/:id" element={<DetailView items={photoGroups} type="gallery" logoUrl={profile.logoUrl} />} />
      <Route path="/thoughts" element={<MainLayout {...commonProps}><ThoughtSection thoughts={thoughts} /></MainLayout>} />
      <Route path="/blog" element={<MainLayout {...commonProps}><BlogSection posts={posts} /></MainLayout>} />
      <Route path="/blog/:id" element={<DetailView items={posts} type="blog" logoUrl={profile.logoUrl} />} />
      <Route path="/aboutme" element={
        isLoading && !hasCache ? (
          <MainLayout {...commonProps}><div className="py-20 text-center font-mono text-[10px] opacity-20 tracking-widest">RETRIEVING MANUAL...</div></MainLayout>
        ) : aboutPage ? (
          <DetailView items={[aboutPage]} forceId={aboutPage.id} type="blog" logoUrl={profile.logoUrl} />
        ) : (
          <div className="py-20 flex flex-col items-center gap-4 text-stone-400">
              <AlertCircle size={24} className="opacity-20" />
              <p className="font-mono text-[10px] tracking-widest uppercase">No Manual Found</p>
              <Navigate to="/" replace />
          </div>
        )
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
