const fs = require('fs/promises');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const portfolioPath = path.join(distDir, 'data', 'portfolio.json');
const manifestPath = path.join(distDir, 'data', 'static-routes.json');

const cleanRoute = (value) => String(value || '')
  .replace(/^\/+/, '')
  .replace(/\/+$/, '');

const addRoute = (routes, value) => {
  const route = cleanRoute(value);
  if (route) routes.add(route);
};

const main = async () => {
  const routes = new Set(['aboutme', 'gallery', 'thoughts', 'blog']);

  try {
    const raw = await fs.readFile(portfolioPath, 'utf8');
    const portfolio = JSON.parse(raw);

    for (const item of Array.isArray(portfolio.gallery) ? portfolio.gallery : []) {
      if (item?.id) addRoute(routes, `gallery/${item.id}`);
      if (item?.slug) addRoute(routes, `gallery/${item.slug}`);
    }

    for (const item of Array.isArray(portfolio.posts) ? portfolio.posts : []) {
      if (item?.id) addRoute(routes, `blog/${item.id}`);
      if (item?.slug) addRoute(routes, `blog/${item.slug}`);
    }
  } catch (error) {
    console.warn(`[static-routes] Portfolio data unavailable, writing base routes only: ${error.message}`);
  }

  const sortedRoutes = Array.from(routes).sort();
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify({ routes: sortedRoutes }, null, 2)}\n`);
  console.log(`[static-routes] Wrote ${sortedRoutes.length} SPA route aliases`);
};

main().catch((error) => {
  console.error('[static-routes] Failed:', error);
  process.exit(1);
});
