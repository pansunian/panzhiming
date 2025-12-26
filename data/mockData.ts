import { Profile, PhotoGroup, Thought, BlogPost } from '../types';

export const mockProfile: Profile = {
  name: "演示用户",
  role: "Photographer | Developer",
  bio: "这是一个演示账号。当您配置好 Notion API 后，这里将显示您的真实简介。目前展示的是本地的静态演示数据，用于预览网站的视觉效果。",
  location: "Demo City, DC",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=640&auto=format&fit=crop",
  socials: [
    { platform: "GITHUB", url: "https://github.com", handle: "Github" },
    { platform: "TWITTER", url: "https://twitter.com", handle: "Twitter" },
    { platform: "INSTAGRAM", url: "https://instagram.com", handle: "Instagram" }
  ]
};

export const mockGallery: PhotoGroup[] = [
  {
    id: "demo-gallery-1",
    title: "城市微光",
    location: "Tokyo, Japan",
    count: 12,
    coverUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop",
    date: "2023.10.15",
    ticketNumber: "08293",
    featured: true
  },
  {
    id: "demo-gallery-2",
    title: "冰岛公路",
    location: "Iceland",
    count: 8,
    coverUrl: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=800&auto=format&fit=crop",
    date: "2023.09.01",
    ticketNumber: "08294",
    featured: true
  },
  {
    id: "demo-gallery-3",
    title: "胶片日常",
    location: "Shanghai",
    count: 24,
    coverUrl: "https://images.unsplash.com/photo-1495571279625-06a445b045c2?q=80&w=800&auto=format&fit=crop",
    date: "2023.08.12",
    ticketNumber: "08295",
    featured: false
  }
];

export const mockThoughts: Thought[] = [
  {
    id: "demo-thought-1",
    content: "摄影不仅是记录，更是一种观看世界的方式。当我们透过取景器观察时，世界变得安静而专注。",
    date: "2023-11-02",
    time: "23:45",
    tags: ["Photography", "Life"],
    featured: true
  },
  {
    id: "demo-thought-2",
    content: "今天傍晚的云非常漂亮，像极了宫崎骏电影里的画面。可惜手边没有相机，只能用眼睛记录这一刻。",
    date: "2023-10-28",
    time: "18:30",
    tags: ["Daily", "Mood"],
    featured: true
  }
];

export const mockPosts: BlogPost[] = [
  {
    id: "demo-post-1",
    title: "如何建立自己的摄影风格？",
    excerpt: "风格不是一天养成的，它来自于长期的观察、思考以及对自我审美的坚持。本文将分享我在寻找个人风格过程中的一些思考。",
    date: "2023-10-01",
    readTime: "5 MIN",
    category: "Photography",
    imageUrl: "https://images.unsplash.com/photo-1452587925703-749559920625?q=80&w=800&auto=format&fit=crop",
    featured: true
  },
  {
    id: "demo-post-2",
    title: "2023 年度设备总结",
    excerpt: "今年购入的几台相机，有的成为了主力，有的却在防潮箱里吃灰。让我们来聊聊器材的取舍。",
    date: "2023-12-15",
    readTime: "8 MIN",
    category: "Gear",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop",
    featured: true
  }
];

export const mockAbout: BlogPost = {
  id: "demo-about",
  title: "关于我",
  excerpt: "Brief introduction.",
  date: "2023-01-01",
  readTime: "3 MIN",
  category: "About",
  imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
  featured: false
};

// 详情页演示内容（Notion Block 结构）
export const mockNotionBlocks = [
    {
        type: 'paragraph',
        content: [{ text: '这是一个演示段落。由于未连接到真实的 Notion 数据库，您看到的是本地生成的占位符内容。在真实环境中，这里将显示您 Notion 页面中的文字、图片和格式。', annotations: {} }]
    },
    {
        type: 'heading_2',
        content: [{ text: '关于这个演示模式', annotations: { bold: true } }]
    },
    {
        type: 'paragraph',
        content: [{ text: '当 API 请求失败或环境变量未配置时，系统会自动加载这些数据。您可以在 ', annotations: {} }, { text: 'data/mockData.ts', annotations: { code: true } }, { text: ' 文件中修改它们。', annotations: {} }]
    },
    {
        type: 'callout',
        icon: { emoji: '👋' },
        content: [{ text: '提示：请检查您的 Vercel 环境变量设置，确保 Notion API Key 和 Database IDs 正确配置。', annotations: {} }]
    },
    {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?q=80&w=1000&auto=format&fit=crop',
        caption: [{ text: 'Demo Image from Unsplash', annotations: {} }]
    },
    {
        type: 'quote',
        content: [{ text: 'Photography is the story I fail to put into words.', annotations: { italic: true } }]
    }
];

// 详情页演示相册图片
export const mockPageImages = [
    { url: "https://images.unsplash.com/photo-1542038784424-48ed74701c3d?q=80&w=1200&auto=format&fit=crop", caption: "Sony A7M3 | 2023.10.01 | Shanghai" },
    { url: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1200&auto=format&fit=crop", caption: "Fujifilm XT30 | 2023.09.15 | Kyoto" },
    { url: "https://images.unsplash.com/photo-1495571279625-06a445b045c2?q=80&w=1200&auto=format&fit=crop", caption: "Leica M6 | 2023.08.20 | Film Scan" }
];
