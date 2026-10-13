# Squisitus — sito (Roma 2027)

The site from the Claude Design file `Squisitus Sito v3.dc.html`, built as a standalone Vite + React app.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/ (relative paths, upload anywhere)
```

## Structure
- `src/Site.jsx` — the page component (logic + JSX). Imported from the design, then edited by hand: **this is now the source**
- `src/styles.css` — global styles + hover rules (hand-made revisions at the bottom)
- `src/main.jsx`, `index.html`, `vite.config.js` — app shell
- `public/assets/` — images, logos and the press review PDF (copied from `../assets`)
- `scripts/convert-dc.mjs` — the converter

## Importing a new design version
Since the 13/10 revisions `src/Site.jsx` and `src/styles.css` contain hand edits. Running the converter **overwrites them**, so only use it for a completely new design version:
```bash
node scripts/convert-dc.mjs "../Squisitus Sito v3.dc.html"
```
It overwrites `src/Site.jsx`, `src/styles.css` and `src/head.html` (paste `head.html` into `index.html` if the title or fonts change). Re-copy `../assets` into `public/assets` if assets changed, but keep `squisitus-logo-h-*.svg`: in this project the ® has been moved after the wordmark.

## Before go-live
The forms (sali a bordo, newsletter, press area) only validate and show the confirmation state; they don't send anything yet. Hook `submit`, `nlSubmit` and `pressSubmit` in `renderVals()` up to a backend or form service.
