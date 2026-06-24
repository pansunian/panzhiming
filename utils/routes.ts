import { BlogPost, PhotoGroup } from '../types';

const getRouteKey = (item: { id: string; slug?: string }) => item.slug || item.id;

export const getBlogPath = (post: BlogPost) => `/blog/${getRouteKey(post)}`;

export const getGalleryPath = (group: PhotoGroup) => `/gallery/${getRouteKey(group)}`;
