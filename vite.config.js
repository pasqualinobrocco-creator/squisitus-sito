import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { ROUTES, SITE_URL, urlOf, jsonLd } from './src/routes.js';

// BASE_PATH: '/' when the site is on its own domain (squisitus.it), '/squisitus-sito/' on the GitHub Pages preview.
// NOINDEX=true keeps a preview out of Google (the canonical tags already point to SITE_URL).
const BASE = process.env.BASE_PATH || '/';
const NOINDEX = process.env.NOINDEX === 'true';
// ADMIN_PATH (only in .env.local, never committed): secret folder of the management panel, e.g. "gestione-abc123".
// Without it the panel is not built at all (GitHub Pages preview, builds from the repository).
const ADMIN = (loadEnv('production', __dirname, '').ADMIN_PATH || process.env.ADMIN_PATH || '').replace(/^\/+|\/+$/g, '');

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Fills the SEO and social tags of index.html for one route (+ structured data on the home page).
function seo(html, r) {
  const url = SITE_URL + '/' + urlOf(r);
  const img = SITE_URL + '/' + r.social.image;
  const meta = (attr, name, val) => {
    const re = new RegExp('(<meta ' + attr + '="' + name.replace(/[.:]/g, '\\$&') + '" content=")[^"]*(")');
    html = html.replace(re, (_, a, b) => a + esc(val) + b);
  };
  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + esc(r.title) + '</title>');
  meta('name', 'description', r.description);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, (_, a, b) => a + esc(url) + b);
  meta('property', 'og:title', r.social.title);
  meta('property', 'og:description', r.social.description);
  meta('property', 'og:url', url);
  meta('property', 'og:image', img);
  meta('property', 'og:image:alt', r.social.alt);
  meta('name', 'twitter:title', r.social.title);
  meta('name', 'twitter:description', r.social.description);
  meta('name', 'twitter:image', img);
  meta('name', 'twitter:image:alt', r.social.alt);
  if (!r.slug) html = html.replace('</head>', jsonLd().map(d => '<script type="application/ld+json">' + JSON.stringify(d).replace(/</g, '\\u003c') + '</script>').join('\n') + '\n</head>');
  return html;
}

// base tag: relative links and images ("assets/…", "un-progetto-bsg") resolve from the site root on every page.
const siteHtml = {
  name: 'squisitus-seo',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      html = html.replace('<head>', '<head>\n<base href="' + BASE + '">');
      if (!ctx.filename.endsWith('index.html')) return html; // panel: base tag only
      if (NOINDEX) html = html.replace('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex">');
      return seo(html, ROUTES[0]);
    },
  },
  // after the build: one HTML per page (so Google sees each page with its own title), 404, sitemap, robots
  closeBundle() {
    const dist = resolve(__dirname, 'dist');
    // template without the home-only structured data; seo() adds it back for the home only
    const html = readFileSync(resolve(dist, 'index.html'), 'utf8').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '');
    for (const r of ROUTES.filter(x => x.slug)) {
      mkdirSync(resolve(dist, r.slug), { recursive: true });
      writeFileSync(resolve(dist, r.slug, 'index.html'), seo(html, r));
    }
    // the panel lives only at its secret address (no /admin, no admin.html, not listed in robots.txt)
    if (ADMIN) {
      mkdirSync(resolve(dist, ADMIN), { recursive: true });
      renameSync(resolve(dist, 'admin.html'), resolve(dist, ADMIN, 'index.html'));
    }
    writeFileSync(resolve(dist, '404.html'), html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex">').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, ''));
    const oggi = new Date().toISOString().slice(0, 10);
    writeFileSync(resolve(dist, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      ROUTES.map(r => `  <url><loc>${SITE_URL}/${urlOf(r)}</loc><lastmod>${oggi}</lastmod></url>`).join('\n') + '\n</urlset>\n');
    writeFileSync(resolve(dist, 'robots.txt'), NOINDEX ? 'User-agent: *\nDisallow: /\n' :
      `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  },
};

// Two entry points: the public site (index.html) and, with ADMIN_PATH, the management panel (admin.html).
export default defineConfig({
  base: BASE,
  plugins: [react(), siteHtml],
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html'), ...(ADMIN && { pannello: resolve(__dirname, 'admin.html') }) },
    },
  },
});
