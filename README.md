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

## Supabase
Progetto **Squisitus** (org Bsg, eu-west-1). URL e chiave pubblicabile sono in `.env`: la chiave è pubblica per progetto, la sicurezza è data dalle regole RLS.

- **Moduli** (Sali a bordo, newsletter, press) → tabelle `richieste`, `newsletter`, `accrediti_press`: dal sito si può solo inserire, mai leggere
- **Contenuti** → tabelle `articoli` e `partner`, bucket Storage `media`: dal sito si leggono solo le righe pubblicate
- Schema moduli: [`supabase/schema.sql`](supabase/schema.sql). Guida per chi gestisce i contenuti: [`supabase/GESTIONE-CONTENUTI.md`](supabase/GESTIONE-CONTENUTI.md)

## Pannello di gestione (`admin.html`)
Online: `https://pasqualinobrocco-creator.github.io/squisitus-sito/admin.html` · in locale: `http://localhost:5173/admin.html`

- Accesso con email e password (Supabase Auth). Ruolo **admin**: rassegna stampa, partner (con caricamento loghi), richieste espositori/sponsor, accrediti press, newsletter (con export CSV), utenti
- Ruoli e permessi: tabella `profili` + regole RLS basate su `privato.is_admin()`; sezioni del pannello in `src/admin/App.jsx` (`SEZIONI`)
- Creazione/eliminazione utenti, cambio ruolo e reset password passano dalla Edge Function [`gestione-utenti`](supabase/functions/gestione-utenti/index.ts), che verifica che chi chiama sia admin
- Nuovo ruolo (es. redattore): aggiungerlo al check di `profili.ruolo`, a `RUOLI` nella funzione e nel pannello, e dargli le policy sulle tabelle che deve gestire

## Email (Resend)
- **Notifiche e conferme**: un trigger su `richieste`, `accrediti_press`, `newsletter` chiama la Edge Function [`notifica-email`](supabase/functions/notifica-email/index.ts), che invia con Resend la notifica al team e la conferma a chi ha compilato il modulo. Mittente, destinatari e opzioni: pannello → **Email** (tabella `impostazioni`). Segreto: `RESEND_API_KEY` in Supabase → Edge Functions → Secrets
- **Email di accesso** (recupero password): Supabase → Authentication → Emails → SMTP Settings con `smtp.resend.com`, porta 465, utente `resend`, password = API key Resend

Se Supabase non risponde, il sito mostra comunque i 3 articoli di default e i riquadri segnaposto dei partner.
