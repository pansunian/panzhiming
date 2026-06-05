import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ProfileSection } from './components/ProfileSection';
import { GallerySection } from './components/GallerySection';
import { ThoughtSection } from './components/ThoughtSection';
import { BlogSection } from './components/BlogSection';
import { ContactSection } from './components/ContactSection';
import { DetailView } from './components/DetailView';
import { Profile, PhotoGroup, Thought, BlogPost } from './types';
import { Info, AlertCircle } from 'lucide-react';
import { mockProfile, mockGallery, mockThoughts, mockPosts, mockAbout } from './data/mockData';

// --- 本地快照兜底：先显示上一次可用内容，再后台更新 ---
const CACHE_KEY = 'portfolio_snapshot_v1';
const CACHE_TTL_MS = 45 * 60 * 1000;

const readCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed || null;
  } catch (e) {
    console.warn("Cache unavailable in this browser context", e);
    return null;
  }
};

const writeCache = (data: unknown, version = '') => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), version, data }));
  } catch (e) {
    console.warn("Failed to write cache", e);
  }
};

const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.warn("Cache unavailable in this browser context", e);
  }
};

// --- 基础状态 ---
const defaultProfile: Profile = {
  name: "Loading...",
  role: "...",
  bio: "...",
  location: "...",
  avatarUrl: "/panzhiming.webp",
  socials: []
};

const asArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value : [];

const normalizeProfile = (value: any): Profile => ({
  ...defaultProfile,
  ...(value || {}),
  socials: asArray(value?.socials)
});

const fetchStaticVersion = async (signal?: AbortSignal) => {
  try {
    const res = await fetch(`/data/build.json?t=${Date.now()}`, {
      cache: 'no-store',
      signal
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.version || data.updatedAt || '';
  } catch {
    return '';
  }
};

// --- 布局组件 ---
const MainLayout: React.FC<{ children?: React.ReactNode; isDemoMode?: boolean; isHome?: boolean; flushTop?: boolean; }> = ({ children, isDemoMode, isHome, flushTop }) => (
  <div className="min-h-screen flex flex-col text-ink font-sans selection:bg-ink selection:text-paper overflow-x-hidden">
    {isDemoMode && (
      <div className="bg-amber-50/90 backdrop-blur-sm border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 sticky top-0 z-[60]">
        <Info className="text-amber-500 shrink-0" size={12} />
        <p className="text-[10px] text-amber-700 font-mono tracking-[0.2em] uppercase font-bold">演示模式：未连接数据库，展示预览数据</p>
      </div>
    )}
    <div className={`flex-grow w-full flex flex-col items-center ${isHome ? '' : 'bg-texture'}`}>
      <main className={`w-full max-w-[420px] mx-auto px-2 sm:px-4 ${flushTop ? 'pt-0' : 'pt-6 sm:pt-12'} pb-20 shrink-0`}>
        {children}
      </main>
    </div>
  </div>
);

const App: React.FC = () => {
  const location = useLocation();
  const queryForceRefresh = new URLSearchParams(location.search).get('fresh') === '1' || new URLSearchParams(location.search).get('refresh') === '1';
  const forcePortfolioRefresh = queryForceRefresh;
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCache, setHasCache] = useState(false);

  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [aboutPage, setAboutPage] = useState<BlogPost | null>(null);
  const hasUsableDataRef = useRef(false);

  const applyPortfolioData = (data: any) => {
    if (data.profile) setProfile(normalizeProfile(data.profile));
    setPhotoGroups(asArray<PhotoGroup>(data.gallery));
    setThoughts(asArray<Thought>(data.thoughts));
    setPosts(asArray<BlogPost>(data.posts));
    if (data.about) setAboutPage(data.about);
    hasUsableDataRef.current = true;
  };

  // 1. 强制刷新时清掉本地快照；普通访问会先读取静态版本号，再决定是否使用本地快照
  useEffect(() => {
    if (forcePortfolioRefresh) {
      clearCache();
      setHasCache(false);
      setIsLoading(true);
      return;
    }

    setHasCache(false);
    setIsLoading(true);
  }, [forcePortfolioRefresh]);

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
      if (window.location.protocol === 'file:' && !hasUsableDataRef.current) {
        loadDemoData();
        setIsLoading(false);
        return;
      }

      try {
        if (forcePortfolioRefresh) setIsLoading(true);
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 12000);
        const cached = forcePortfolioRefresh ? null : readCache();

        if (cached?.data?.profile?.name) {
          applyPortfolioData(cached.data);
          setHasCache(true);
          setIsLoading(false);
        }

        const staticVersion = forcePortfolioRefresh ? '' : await fetchStaticVersion(controller.signal);
        const versionQuery = staticVersion ? `?v=${encodeURIComponent(staticVersion)}` : `?t=${Date.now()}`;
        const portfolioUrl = forcePortfolioRefresh
          ? `/api/portfolio?fresh=1&t=${Date.now()}`
          : `/data/portfolio.json${versionQuery}`;
        let res = await fetch(portfolioUrl, {
          cache: forcePortfolioRefresh ? 'no-store' : 'default',
          signal: controller.signal
        });
        if (!res.ok && !forcePortfolioRefresh) {
          res = await fetch('/api/portfolio', {
            cache: 'no-store',
            signal: controller.signal
          });
        }
        window.clearTimeout(timeoutId);
        if (res.ok) {
           const data = await res.json();
           
           // 简单的空数据检查，如果 API 返回空对象，也视为需要 Demo
           if (!data.profile || !data.profile.name) {
               if (!hasUsableDataRef.current) loadDemoData();
               return;
           }

           applyPortfolioData(data);
           writeCache(data, staticVersion);
           setIsDemoMode(false); 
        } else {
            // 只有在没缓存且接口报错的情况下才开启 Demo
            if (!hasUsableDataRef.current) loadDemoData();
        }
      } catch (e) { 
          if (!hasUsableDataRef.current) loadDemoData();
      } finally { 
          setIsLoading(false); 
      }
    };
    initData();
  }, [forcePortfolioRefresh]);

  return (
    <Routes>
      <Route path="/" element={
        <MainLayout isDemoMode={isDemoMode} isHome>
          <ProfileSection profile={profile} />
          <div className="flex flex-col gap-8">
            <BlogSection title="先见档案" posts={posts.length > 0 ? posts.filter(p => p.featured).slice(0, 10) : []} showViewAll={posts.length > 0} />
            <ThoughtSection thoughts={thoughts.length > 0 ? thoughts.filter(t => t.featured) : []} showViewAll={thoughts.length > 0} />
            <GallerySection title="纪实摄影" groups={photoGroups.length > 0 ? photoGroups.filter(g => g.featured).slice(0, 2) : []} onViewAll={photoGroups.length > 0} navLinks={profile.navLinks} />
            <ContactSection logoUrl={profile.logoUrl} />
          </div>
        </MainLayout>
      } />
      <Route path="/gallery" element={<MainLayout isDemoMode={isDemoMode} flushTop><GallerySection groups={photoGroups} logoUrl={profile.logoUrl} showPageNav navLinks={profile.navLinks} /></MainLayout>} />
      <Route path="/gallery/:id" element={<DetailView items={photoGroups} type="gallery" logoUrl={profile.logoUrl} navLinks={profile.navLinks} />} />
      <Route path="/thoughts" element={<MainLayout isDemoMode={isDemoMode} flushTop><ThoughtSection thoughts={thoughts} logoUrl={profile.logoUrl} showPageNav navLinks={profile.navLinks} /></MainLayout>} />
      <Route path="/blog" element={<MainLayout isDemoMode={isDemoMode} flushTop><BlogSection posts={posts} logoUrl={profile.logoUrl} showPageNav navLinks={profile.navLinks} /></MainLayout>} />
      <Route path="/blog/:id" element={<DetailView items={posts} type="blog" logoUrl={profile.logoUrl} navLinks={profile.navLinks} />} />
      <Route path="/aboutme" element={
        isLoading && !hasCache ? (
          <MainLayout isDemoMode={isDemoMode}><div className="py-20 text-center font-mono text-[10px] opacity-20 tracking-widest">RETRIEVING MANUAL...</div></MainLayout>
        ) : aboutPage ? (
          <DetailView items={[aboutPage]} forceId={aboutPage.id} type="blog" logoUrl={profile.logoUrl} navLinks={profile.navLinks} />
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
