import React, { useState, useEffect } from 'react';
import { ProfileSection } from './components/ProfileSection';
import { GallerySection } from './components/GallerySection';
import { ThoughtSection } from './components/ThoughtSection';
import { BlogSection } from './components/BlogSection';
import { ContactSection } from './components/ContactSection';
import { DetailView } from './components/DetailView';
import { NavBar } from './components/NavBar';
import { Profile, PhotoGroup, Thought, BlogPost } from './types';
import { AlertCircle } from 'lucide-react';

// --- Default/Fallback Data (Demo Content) ---

const defaultProfile: Profile = {
  name: "演示用户",
  role: "Photographer & Coder",
  bio: "这里是演示数据。请在 Vercel 环境变量中配置您的 Notion 数据库 ID 以加载真实内容。",
  location: "Shanghai, CN",
  avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
  logoUrl: undefined, 
  socials: [
      { platform: "INSTAGRAM", url: "#", handle: "@demo" },
      { platform: "TWITTER", url: "#", handle: "@demo" }
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
    featured: true // Show on Home
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
    featured: false
  },
  {
    id: "demo-g3",
    title: "胶片日常",
    location: "Home, Sunday",
    count: 8,
    coverUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop",
    date: "2024-01-10",
    ticketNumber: "LIF-104",
    description: "记录生活中的细碎光影。",
    featured: false
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
  },
  {
    id: "demo-t3",
    content: "保持好奇心，保持饥饿。Stay foolish, stay hungry.",
    date: "2024-02-01",
    time: "09:00",
    tags: ["Quote"],
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
    featured: true // Show on Home
  },
  {
    id: "demo-p2",
    title: "摄影与记忆的显影",
    excerpt: "按下快门的那一刻，我们究竟留住了什么？是光影，还是当时的情绪？",
    date: "2024-01-20",
    readTime: "5 MIN",
    category: "Essay",
    imageUrl: "https://images.unsplash.com/photo-1452587925148-ce544ae77c7a?q=80&w=1000&auto=format&fit=crop",
    featured: false
  }
];

// --- Default Data Types ---
type ViewState = 'home' | 'gallery' | 'thoughts' | 'blog';

// --- Application Component ---

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [selectedItem, setSelectedItem] = useState<{ type: 'blog' | 'gallery', data: BlogPost | PhotoGroup } | null>(null);
  
  // Data State
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>(defaultPhotoGroups);
  const [thoughts, setThoughts] = useState<Thought[]>(defaultThoughts);
  const [posts, setPosts] = useState<BlogPost[]>(defaultPosts);
  
  // New state for Manual Page
  const [manualPage, setManualPage] = useState<BlogPost | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/portfolio');
        if (!res.ok) {
           const errData = await res.json().catch(() => ({}));
           console.warn("API Error, using demo data:", errData.message);
           throw new Error(errData.message || 'Failed to fetch data');
        }
        const data = await res.json();
        
        if (data.profile) setProfile(data.profile);
        if (data.gallery && data.gallery.length > 0) setPhotoGroups(data.gallery);
        if (data.thoughts && data.thoughts.length > 0) setThoughts(data.thoughts);
        if (data.posts && data.posts.length > 0) setPosts(data.posts);
        
        if (data.manual) setManualPage(data.manual);
        
        if (data.debug) {
            const errors = Object.values(data.debug).filter(Boolean);
            if (errors.length > 0) {
                console.warn("Some data failed to load:", errors);
            }
        }
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e.message || "Could not load portfolio data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    setSelectedItem(null);
    window.scrollTo(0, 0);
  };

  const handleItemClick = (type: 'blog' | 'gallery', item: BlogPost | PhotoGroup) => {
    setSelectedItem({ type, data: item });
  };

  const handleOpenManual = () => {
      if (manualPage) {
          setSelectedItem({ type: 'blog', data: manualPage });
      } else {
          const fallbackManual: BlogPost = {
              id: 'manual_page', 
              title: '我的说明书',
              excerpt: 'User Manual / Operating Instructions',
              date: new Date().getFullYear().toString(),
              readTime: 'INF',
              category: 'MANUAL',
              content: [
                  'Content not loaded. Please configure NOTION_MANUAL_PAGE_ID in your Vercel environment variables.',
                  '这个页面需要您在 Vercel 环境变量中设置 NOTION_MANUAL_PAGE_ID 才能显示真实内容。'
              ],
              imageUrl: profile.avatarUrl,
              featured: false
          };
          setSelectedItem({ type: 'blog', data: fallbackManual });
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-texture flex items-center justify-center font-mono text-xs text-stone-400">
        LOADING PORTFOLIO...
      </div>
    );
  }

  // If Detail View is active
  if (selectedItem) {
    return (
      <DetailView 
        item={selectedItem.data} 
        type={selectedItem.type} 
        onNavigate={handleNavigate}
        onManualClick={handleOpenManual}
        logoUrl={profile.logoUrl}
      />
    );
  }

  // Filter Data for Home Page (Featured Only)
  const featuredGallery = photoGroups.filter(g => g.featured);
  const featuredPosts = posts.filter(p => p.featured);
  const featuredThoughts = thoughts.filter(t => t.featured).slice(0, 10);

  return (
    <div className="min-h-screen bg-texture text-ink pb-12 font-sans selection:bg-ink selection:text-paper">
      
      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-red-50 border-b border-red-200 p-4 flex items-start gap-3 sticky top-0 z-[60]">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-red-700 font-mono">
            <p className="font-bold mb-1">DEMO MODE / API ERROR</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Navigation (Sticky Header) - Hidden on Home View */}
      {currentView !== 'home' && (
          <NavBar 
              onNavigate={handleNavigate} 
              onManualClick={handleOpenManual}
              activeView={currentView}
              logoUrl={profile.logoUrl}
          />
      )}

      {/* Main Layout Container - Centered Single Column */}
      <main className="w-full max-w-[452px] mx-auto px-4 pt-8 md:pt-12">
        
        {/* Profile is always at top in single column flow */}
        {currentView === 'home' && (
             <ProfileSection 
                profile={profile} 
                onNavigate={handleNavigate} 
                onOpenManual={handleOpenManual}
             />
        )}

        {/* Content Feeds */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* HOME VIEW */}
            {currentView === 'home' && (
               <div className="flex flex-col gap-16">
                 
                 {/* FEATURED GALLERY */}
                 {featuredGallery.length > 0 && (
                    <div>
                       <GallerySection 
                          title="精选影像"
                          groups={featuredGallery} 
                          onItemClick={(g) => handleItemClick('gallery', g)} 
                          onViewAll={() => handleNavigate('gallery')}
                       />
                    </div>
                 )}

                 {/* RECENT THOUGHTS */}
                 {featuredThoughts.length > 0 && (
                     <div>
                        <ThoughtSection 
                          thoughts={featuredThoughts} 
                          onViewAll={() => handleNavigate('thoughts')}
                        />
                     </div>
                 )}

                 {/* FEATURED BLOG */}
                 {featuredPosts.length > 0 && (
                    <div>
                       <BlogSection 
                          title="精选文章"
                          posts={featuredPosts} 
                          onItemClick={(p) => handleItemClick('blog', p)}
                          onViewAll={() => handleNavigate('blog')}
                       />
                    </div>
                 )}
                 
                 <ContactSection />

                 {/* Footer */}
                 <div className="text-center py-8 opacity-30 font-mono text-[9px] uppercase tracking-widest select-none">
                     <p>Life Frames Archive &copy; {new Date().getFullYear()}</p>
                 </div>
               </div>
            )}

            {/* GALLERY VIEW */}
            {currentView === 'gallery' && (
              <div>
                <GallerySection 
                  groups={photoGroups} 
                  onItemClick={(g) => handleItemClick('gallery', g)} 
                />
              </div>
            )}

            {/* THOUGHTS VIEW */}
            {currentView === 'thoughts' && (
              <div>
                <ThoughtSection thoughts={thoughts} />
              </div>
            )}

            {/* BLOG VIEW */}
            {currentView === 'blog' && (
              <div>
                <BlogSection 
                  posts={posts} 
                  onItemClick={(p) => handleItemClick('blog', p)} 
                />
              </div>
            )}

        </div>

      </main>
    </div>
  );
};

export default App;