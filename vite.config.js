import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { ROUTES, SITE_URL, OG_IMAGE, urlOf } from './src/routes.js';

// BASE_PATH: '/' when the site is on its own domain (squisitus.it), '/squisitus-sito/' on the GitHub Pages preview.
// NOINDEX=true keeps a preview out of Google (the canonical tags already point to SITE_URL).
const BASE = process.env.BASE_PATH || '/';
const NOINDEX = process.env.NOINDEX === 'true';

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Fills the SEO tags of index.html for one route.
function seo(html, r) {
  const url = SITE_URL + '/' + urlOf(r);
  const set = (re, val) => { html = html.replace(re, (_, a, b) => a + esc(val) + b); };
  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + esc(r.title) + '</title>');
  set(/(<meta name="description" content=")[^"]*(")/, r.description);
  set(/(<link rel="canonical" href=")[^"]*(")/, url);
  set(/(<meta property="og:title" content=")[^"]*(")/, r.title);
  set(/(<meta property="og:description" content=")[^"]*(")/, r.description);
  set(/(<meta property="og:url" content=")[^"]*(")/, url);
  set(/(<meta property="og:image" content=")[^"]*(")/, SITE_URL + '/' + OG_IMAGE);
  return html;
}

// base tag: relative links and images ("assets/…", "un-progetto-bsg") resolve from the site root on every page.
const siteHtml = {
  name: 'squisitus-seo',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      if (!ctx.filename.endsWith('index.html')) return html;
      html = html.replace('<head>', '<head>\n<base href="' + BASE + '">' + (NOINDEX ? '\n<meta name="robots" content="noindex">' : ''));
      return seo(html, ROUTES[0]);
    },
  },
  // after the build: one HTML per page (so Google sees each page with its own title), 404, sitemap, robots
  closeBundle() {
    const dist = resolve(__dirname, 'dist');
    const html = readFileSync(resolve(dist, 'index.html'), 'utf8');
    for (const r of ROUTES.filter(x => x.slug)) {
      mkdirSync(resolve(dist, r.slug), { recursive: true });
      writeFileSync(resolve(dist, r.slug, 'index.html'), seo(html, r));
    }
    writeFileSync(resolve(dist, '404.html'), html.replace('<head>', '<head>\n<meta name="robots" content="noindex">'));
    const oggi = new Date().toISOString().slice(0, 10);
    writeFileSync(resolve(dist, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      ROUTES.map(r => `  <url><loc>${SITE_URL}/${urlOf(r)}</loc><lastmod>${oggi}</lastmod></url>`).join('\n') + '\n</urlset>\n');
    writeFileSync(resolve(dist, 'robots.txt'), NOINDEX ? 'User-agent: *\nDisallow: /\n' :
      `User-agent: *\nDisallow: /admin.html\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  },
};

// Two entry points: the public site (index.html) and the management panel (admin.html).
export default defineConfig({
  base: BASE,
  plugins: [react(), siteHtml],
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html'), admin: resolve(__dirname, 'admin.html') },
    },
  },
});
