
/**
 * 使用 Vercel Image Optimization 优化图片 URL
 * 
 * @param url 原始图片 URL (Notion/S3/Unsplash)
 * @param width 目标宽度 (根据 vercel.json 的 sizes 配置选择)
 * @param quality 图片质量 (1-100, 默认 75)
 */
export const optimizeImage = (url: string, width: number = 800, quality: number = 75): string => {
  if (!url) return '';
  
  // 本地图片或 SVG 不进行优化
  if (url.startsWith('/') || url.endsWith('.svg')) return url;
  
  // 开发环境下直接返回原图（因为 localhost 无法被 Vercel 优化代理访问）
  // 只有在部署到 Vercel 后，window.location.hostname 才会包含 vercel.app 或你的自定义域名
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (isLocal) return url;

  try {
    // 构建 Vercel 图片优化 URL
    // 格式: /_vercel/image?url={encodedUrl}&w={width}&q={quality}
    const encodedUrl = encodeURIComponent(url);
    return `/_vercel/image?url=${encodedUrl}&w=${width}&q=${quality}`;
  } catch (e) {
    return url;
  }
};
