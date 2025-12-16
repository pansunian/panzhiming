
export interface SocialLink {
  platform: string;
  url: string;
  handle: string;
}

export interface Profile {
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
  logoUrl?: string; // New field for custom logo
  location: string;
  socials: SocialLink[];
}

export interface PhotoGroup {
  id: string;
  title: string;
  location: string;
  count: number;
  coverUrl: string;
  date: string;
  ticketNumber: string;
  description?: string;
  images?: string[];
  featured?: boolean; // New: Controls visibility on Home
}

export interface Thought {
  id: string;
  content: string;
  date: string;
  time: string;
  tags: string[];
  featured?: boolean; // New: Controls visibility on Home
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  imageUrl?: string;
  content?: string[];
  featured?: boolean; // New: Controls visibility on Home
}
