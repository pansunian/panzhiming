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

// --- 默认占位图：深色抽象背景 ---
const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1000&auto=format&fit=crop";

// --- 基础状态 ---
const defaultProfile: Profile = {
  name: "潘志明",
  role: "先见志明 | Photographer",
  bio: "正在通过 Notion 连接我的档案库库...",
  location: "Shanghai, CN",
  avatarUrl: FALLBACK_AVATAR,
  socials: []
};

// --- 布局组件 ---
const MainLayout: React.FC<{ children?: React.ReactNode; hideNav?: boolean; isDemoMode?: boolean; logoUrl?: string; isHome?: boolean; }> = ({ children, hideNav, isDemoMode, logoUrl, isHome }) => (
  <div className="min-h-screen flex flex-col text-ink font-sans selection:bg-ink selection:text-paper overflow-x-hidden">
    {isDemoMode && (
      <div className="bg-amber-50/90 backdrop-blur-sm border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 sticky top-0 z-[60]">
        <Info className="text-amber-500 shrink-0" size={12} />
        <p className="text-[10px] text-amber-700 font-mono tracking-[0.2em] uppercase font-bold">Notion 未连接，展示预览占位内容</p>
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
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [aboutPage, setAboutPage] = useState<BlogPost | null>(null);

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

  useEffect(() => {
    const initData = async () => {
      try {
        const res = await fetch('/api/portfolio');
        if (res.ok) {
           const data = await res.json();
           if (data.profile) setProfile(data.profile);
           if (data.gallery) setPhotoGroups(data.gallery);
           if (data.thoughts) setThoughts(data.thoughts);
           if (data.posts) setPosts(data.posts);
           if (data.about) setAboutPage(data.about);
           setIsDemoMode(false); 
        } else {
            // 如果返回非 200，且是在开发/预览环境，标记为 Demo 模式
            setIsDemoMode(true);
        }
      } catch (e) { 
          console.error("Fetch error:", e);
          setIsDemoMode(true);
          setError("无法连接到内容服务器");
      } finally { 
          setIsLoading(false); 
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
          <div className="flex flex-col gap-8">
            <GallerySection title="精选影像" groups={photoGroups.length > 0 ? photoGroups.filter(g => g.featured).slice(0, 2) : []} onViewAll={photoGroups.length > 0} />
            <ThoughtSection thoughts={thoughts.length > 0 ? thoughts.filter(t => t.featured) : []} showViewAll={thoughts.length > 0} />
            <BlogSection title="精选文章" posts={posts.length > 0 ? posts.filter(p => p.featured).slice(0, 10) : []} showViewAll={posts.length > 0} />
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
        isLoading ? (
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