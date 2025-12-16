import React, { useState, useEffect } from 'react';
import { ProfileSection } from './components/ProfileSection';
import { GallerySection } from './components/GallerySection';
import { ThoughtSection } from './components/ThoughtSection';
import { BlogSection } from './components/BlogSection';
import { ContactSection } from './components/ContactSection';
import { DetailView } from './components/DetailView';
import { NavBar } from './components/NavBar';
import { Profile, PhotoGroup, Thought, BlogPost } from './types';
import { TicketBase } from './components/TicketUI';
import { AlertCircle } from 'lucide-react';

// --- Default/Fallback Data ---
const defaultProfile: Profile = {
  name: "演示用户",
  role: "请检查 API 配置",
  bio: "如果看到此信息，说明 API 数据获取失败。请查看页面顶部的红色报错信息，或检查 Vercel 环境变量设置。",
  location: "System / Error",
  avatarUrl: "https://images.unsplash.com/photo-1542596768-5d1d21f1cfde?q=80&w=800&auto=format&fit=crop",
  logoUrl: undefined, 
  socials: []
};

const defaultPhotoGroups: PhotoGroup[] = [];
const defaultThoughts: Thought[] = [];
const defaultPosts: BlogPost[] = [];

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/portfolio');
        if (!res.ok) {
           // Try to parse error, otherwise default
           const errData = await res.json().catch(() => ({}));
           throw new Error(errData.message || 'Failed to fetch data');
        }
        const data = await res.json();
        
        if (data.profile) setProfile(data.profile);
        if (data.gallery) setPhotoGroups(data.gallery);
        if (data.thoughts) setThoughts(data.thoughts);
        if (data.posts) setPosts(data.posts);
        
        // Handle partial errors (debug info)
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
        logoUrl={profile.logoUrl}
      />
    );
  }

  return (
    <div className="min-h-screen bg-texture text-ink pb-12 font-sans selection:bg-ink selection:text-paper">
      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-red-50 border-b border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-red-700 font-mono">
            <p className="font-bold mb-1">DATA ERROR</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Navigation (Sticky Header) - Show on non-home pages */}
      {currentView !== 'home' && (
        <NavBar 
          onNavigate={handleNavigate} 
          activeView={currentView}
          logoUrl={profile.logoUrl}
        />
      )}

      <main className="max-w-[480px] mx-auto px-4 pt-8">
        {currentView === 'home' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <ProfileSection profile={profile} onNavigate={handleNavigate} />
             
             {/* Shortcuts / Previews */}
             <div className="flex flex-col gap-4 mb-24">
                <div onClick={() => handleNavigate('gallery')} className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity hover:translate-x-1 duration-300">
                    <TicketBase className="p-4 flex justify-between items-center border-l-4 border-stone-800 bg-paper shadow-sm">
                        <span className="font-serif font-bold text-lg">LATEST FRAMES</span>
                        <span className="font-mono text-[10px] text-stone-400 uppercase tracking-widest">View Gallery &rarr;</span>
                    </TicketBase>
                </div>
                <div onClick={() => handleNavigate('blog')} className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity hover:translate-x-1 duration-300">
                     <TicketBase className="p-4 flex justify-between items-center border-l-4 border-stone-800 bg-paper shadow-sm">
                        <span className="font-serif font-bold text-lg">RECENT WORDS</span>
                        <span className="font-mono text-[10px] text-stone-400 uppercase tracking-widest">Read Blog &rarr;</span>
                    </TicketBase>
                </div>
             </div>
             
             <ContactSection />
           </div>
        )}

        {currentView === 'gallery' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GallerySection 
              groups={photoGroups} 
              onItemClick={(g) => handleItemClick('gallery', g)} 
            />
          </div>
        )}

        {currentView === 'thoughts' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ThoughtSection thoughts={thoughts} />
          </div>
        )}

        {currentView === 'blog' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BlogSection 
              posts={posts} 
              onItemClick={(p) => handleItemClick('blog', p)} 
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 opacity-30 font-mono text-[9px] uppercase tracking-widest pointer-events-none select-none">
         <p>Life Frames Archive &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;