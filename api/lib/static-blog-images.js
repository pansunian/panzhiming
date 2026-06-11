const PAGE_IMAGES = {
  '376fc869e6ca813eba80dda312ae0756': {
    cover: '/images/blog/marketing-fables/02/cover.png',
    files: {
      '00-cover-%E5%88%BB%E8%88%9F%E6%B1%82%E5%89%91.png': '/images/blog/marketing-fables/02/cover.png',
      '01-%E7%88%86%E6%AC%BE%E5%85%AC%E5%BC%8F%E5%A4%B1%E7%81%B5.png': '/images/blog/marketing-fables/02/01.png',
      '02-%E4%BB%8E%E5%81%9C%E4%B8%8B%E5%88%B0%E7%95%99%E4%B8%8B.png': '/images/blog/marketing-fables/02/02.png',
      '03-%E5%86%85%E5%AE%B9%E5%BD%93%E8%B7%AF%E6%A0%87.png': '/images/blog/marketing-fables/02/03.png'
    }
  },
  '377fc869e6ca802ebf53f41299f4b217': {
    cover: '/images/blog/marketing-fables/03/cover.png',
    files: {
      '00-cover-%E6%8E%A9%E8%80%B3%E7%9B%97%E9%93%83.png': '/images/blog/marketing-fables/03/cover.png',
      '01-%E6%8A%A5%E8%A1%A8%E5%BE%88%E5%A5%BD%E7%9C%8B.png': '/images/blog/marketing-fables/03/01.png',
      '02-%E8%AF%8D%E7%9B%96%E4%BD%8F%E9%97%AE%E9%A2%98.png': '/images/blog/marketing-fables/03/02.png',
      '03-%E6%8A%8A%E6%89%8B%E6%8B%BF%E4%B8%8B%E6%9D%A5.png': '/images/blog/marketing-fables/03/03.png'
    }
  }
};

const STATIC_IMAGE_VERSION = 'v=20260611-1';
const normalizePageId = (pageId = '') => pageId.replace(/-/g, '');
const withVersion = (url) => `${url}?${STATIC_IMAGE_VERSION}`;

const getStaticCoverUrl = (pageId) => {
  const cover = PAGE_IMAGES[normalizePageId(pageId)]?.cover;
  return cover ? withVersion(cover) : '';
};

const getStaticImageUrl = (pageId, originalUrl) => {
  if (!originalUrl) return originalUrl;

  const pageImages = PAGE_IMAGES[normalizePageId(pageId)];
  if (!pageImages) return originalUrl;

  try {
    const filename = new URL(originalUrl).pathname.split('/').pop();
    const staticUrl = pageImages.files[filename];
    return staticUrl ? withVersion(staticUrl) : originalUrl;
  } catch {
    return originalUrl;
  }
};

module.exports = { getStaticCoverUrl, getStaticImageUrl };
