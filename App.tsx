import React, { useState, useEffect } from 'react';
import { ProfileSection } from './components/ProfileSection';
import { GallerySection } from './components/GallerySection';
import { ThoughtSection } from './components/ThoughtSection';
import { BlogSection } from './components/BlogSection';
import { ContactSection } from './components/ContactSection';
import { DetailView } from './components/DetailView';
import { NavBar } from './components/NavBar';
import { Profile, PhotoGroup, Thought, BlogPost } from './types';
import { TicketBase, BarcodeHorizontal } from './components/TicketUI';

// --- Default/Fallback Data (Used if API fails or is not set up) ---
const defaultProfile: Profile = {
  name: "陈 远 行",
  role: "独立摄影师 / 写作者",
  bio: "用镜头收集世界的切片。痴迷于高速公路收费站的几何美学，以及那些被遗忘在地图边缘的角落。",
  location: "中国 / 游牧中",
  avatarUrl: "https://images.unsplash.com/photo-1542596768-5d1d21f1cfde?q=80&w=800&auto=format&fit=crop",
  // Optional: You can put a default logo URL here for testing
  logoUrl: undefined, 
  socials: [
    { platform: "Weibo", handle: "@陈远行", url: "#" },
    { platform: "RedBook", handle: "@远行笔记", url: "#" },
    { platform: "Instagram", handle: "@chen.visuals", url: "#" }
  ]
};

const defaultPhotoGroups: PhotoGroup[] = [
  {
    id: "1",
    title: "100个高速收费站",
    location: "G4 京港澳高速",
    count: 100,
    date: "2023.10",
    ticketNumber: "A-001",
    description: "这是一场关于“过渡空间”的视觉实验。在京港澳高速的2000公里旅程中，我记录了每一个收费站的形态。",
    coverUrl: "https://images.unsplash.com/photo-1625723044792-44de168bf144?q=80&w=800&auto=format&fit=crop",
    images: [
        "https://images.unsplash.com/photo-1625723044792-44de168bf144?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    id: "2",
    title: "沙漠尽头的风",
    location: "内蒙古 · 腾格里",
    count: 45,
    date: "2023.08",
    ticketNumber: "B-092",
    coverUrl: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?q=80&w=800&auto=format&fit=crop",
    description: "腾格里的风是看不见的雕塑家。沙丘的曲线每天都在变化，就像大地的呼吸。",
  }
];

const defaultThoughts: Thought[] = [
  {
    id: "1",
    content: "为什么机场航站楼比我家更像家？可能是因为那里充满了出发的可能性，而不仅仅是归属。",
    date: "10/24",
    time: "04:30 AM",
    tags: ["旅行", "空间"]
  },
  {
    id: "2",
    content: "十一月下午五点的天空，有一种无法用RGB值定义的忧郁蓝。",
    date: "11/02",
    time: "05:15 PM",
    tags: ["色彩", "情绪"]
  }
];

const defaultPosts: BlogPost[] = [
  {
    id: "1",
    title: "在东京地下铁迷失的艺术",
    excerpt: "在新宿站迷宫般的通道里，不仅仅是通勤，更是一场关于顺从与寻找指示牌的修行。",
    date: "2023.12.12",
    readTime: "8 MIN",
    category: "游记",
    imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800&auto=format&fit=crop",
    content: [
      "东京的地下铁系统就像一个巨大的、会呼吸的有机体。每天清晨，它吞吐着数百万身着深色西装的上班族。",
      "迷失其实是一种美妙的状态。当你放弃了“必须准时到达某地”的执念，周围的细节就开始浮现。"
    ]
  },
  {
    id: "2",
    title: "为什么我拍摄高速出口",
    excerpt: "混凝土建筑中存在着一种被忽视的粗野主义美学。这篇摄影随笔探讨了道路的弧度。",
    date: "2023.11.28",
    readTime: "12 MIN",
    category: "随笔",
    imageUrl: "https://images.unsplash.com/photo-1494587351196-bbf5f29cff42?q=80&w=800&auto=format&fit=crop",
    content: [
      "大多数人经过高速公路出口时，只会关心导航的提示音。但在我眼里，那些巨大的混凝土立柱构成了雕塑群。"
    ]
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gallery, setGallery] = useState<PhotoGroup[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);

  // Initialize Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching /api/portfolio...");
        const res = await fetch('/api/portfolio');
        
        if (res.ok) {
           const data = await res.json();
           console.log("Data fetched successfully:", data);
           if(data.profile) setProfile(data.profile);
           if(data.gallery) setGallery(data.gallery);
           if(data.thoughts) setThoughts(data.thoughts);
           if(data.posts) setPosts(data.posts);
        } else {
            // Read error details from server
            const errorText = await res.text();
            console.error("API Error Status:", res.status);
            console.error("API Error Details:", errorText);
            throw new Error(`API returned ${res.status}: ${errorText}`);
        }
      } catch (error) {
        console.warn("Using fallback data due to error:", error);
        setProfile(defaultProfile);
        setGallery(defaultPhotoGroups);
        setThoughts(defaultThoughts);
        setPosts(defaultPosts);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchData();
  }, []);

  // Handlers
  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    setSelectedItem(null); // Clear selected item when changing categories
    window.scrollTo(0, 0);
  };

  const handleItemClick = (type: 'blog' | 'gallery', item: BlogPost | PhotoGroup) => {
    setSelectedItem({ type, data: item });
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
          <TicketBase className="w-64 bg-paper p-8 text-center animate-pulse border-x border-stone-200">
              <div className="font-mono text-xs tracking-widest text-stone-400 mb-4">LOADING ARCHIVE...</div>
              <h1 className="font-serif text-2xl font-bold text-ink mb-6">正在出票</h1>
              <BarcodeHorizontal className="h-8 opacity-30 mix-blend-multiply mb-2" />
          </TicketBase>
      </div>
    );
  }

  // Ensure profile exists before rendering main content
  if (!profile) return null;

  // --- Render Views ---

  // 1. Detail View Overlay
  if (selectedItem) {
    return (
      <DetailView 
        type={selectedItem.type}
        item={selectedItem.data}
        onNavigate={handleNavigate}
        logoUrl={profile.logoUrl}
      />
    );
  }

  // 2. Main Content
  return (
    <div className="min-h-screen bg-bg pb-24 selection:bg-brand-accent selection:text-white font-sans text-ink animate-in fade-in duration-500">
      
      {/* Conditionally Render NavBar for non-Home pages */}
      {currentView !== 'home' && (
        <NavBar 
          onNavigate={handleNavigate} 
          activeView={currentView} 
          logoUrl={profile.logoUrl}
        />
      )}

      <main className="w-full max-w-[450px] mx-auto px-4 py-8">
        
        {/* HOME VIEW: Show Everything */}
        {currentView === 'home' && (
          <div className="space-y-20 pt-4">
            <ProfileSection profile={profile} onNavigate={handleNavigate} />
            
            <GallerySection 
              groups={gallery.slice(0, 3)} // Show only first 3 on home
              onItemClick={(group) => handleItemClick('gallery', group)} 
            />
            
            <ThoughtSection thoughts={thoughts.slice(0, 3)} />
            
            <BlogSection 
              posts={posts.slice(0, 3)} 
              onItemClick={(post) => handleItemClick('blog', post)} 
            />
            
            <ContactSection />
          </div>
        )}

        {/* GALLERY INDEX VIEW */}
        {currentView === 'gallery' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
             <div className="mb-8 pt-8 text-center">
                <h1 className="font-serif text-3xl font-bold mb-2">影像记录</h1>
                <p className="font-mono text-xs text-stone-500">FULL COLLECTION ARCHIVE</p>
             </div>
             <GallerySection 
               groups={gallery} 
               onItemClick={(group) => handleItemClick('gallery', group)} 
             />
          </div>
        )}

        {/* THOUGHTS INDEX VIEW */}
        {currentView === 'thoughts' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
             <div className="mb-8 pt-8 text-center">
                <h1 className="font-serif text-3xl font-bold mb-2">思维碎片</h1>
                <p className="font-mono text-xs text-stone-500">RANDOM THOUGHTS & NOTES</p>
             </div>
             <ThoughtSection thoughts={thoughts} />
          </div>
        )}

        {/* BLOG INDEX VIEW */}
        {currentView === 'blog' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
             <div className="mb-8 pt-8 text-center">
                <h1 className="font-serif text-3xl font-bold mb-2">文章归档</h1>
                <p className="font-mono text-xs text-stone-500">WRITTEN WORDS</p>
             </div>
             <BlogSection 
               posts={posts} 
               onItemClick={(post) => handleItemClick('blog', post)} 
             />
          </div>
        )}

      </main>

      <footer className="text-stone-500 py-12 text-center">
        <div className="font-mono text-[10px] tracking-widest uppercase opacity-70">
            <p className="mb-2">Designed for the wandering soul</p>
            <p>Copyright © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;