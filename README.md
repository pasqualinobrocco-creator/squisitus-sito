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

## Supabase (moduli)
I tre moduli (Sali a bordo, newsletter, area press) salvano su Supabase nelle tabelle `richieste`, `newsletter`, `accrediti_press`.

1. Supabase → **SQL Editor** → incolla ed esegui [`supabase/schema.sql`](supabase/schema.sql)
2. Supabase → **Project Settings → API**: copia *Project URL* e la chiave **anon / publishable** (mai la `service_role`)
3. In locale: copia `.env.example` in `.env.local` e compila
4. Online: GitHub → **Settings → Secrets and variables → Actions → Variables** → crea `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, poi rilancia il workflow *Deploy*

Le regole RLS permettono ai visitatori solo di inserire, mai di leggere: le richieste si consultano dal **Table Editor** di Supabase.
Senza configurazione il sito funziona lo stesso, ma i moduli mostrano la conferma senza salvare nulla.
