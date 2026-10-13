// Pages of the public site: real addresses (no #), with title and description for Google and social previews.
// Used by the site (navigation) and by vite.config.js (one static HTML per page + sitemap.xml).
export const SITE_URL = 'https://www.squisitus.it';
export const OG_IMAGE = 'assets/salotto-stand-marca.jpg';

export const ROUTES = [
  { slug: '', page: 'home',
    title: 'Squisitus Roma 2027 · Food Exhibition al Palazzo dei Congressi',
    description: 'Squisitus, la Food Exhibition di Roma: 1 • 2 ottobre 2027 al Palazzo dei Congressi. PMI, territori ed eccellenze enogastronomiche protagoniste. Healthy · Sport · Tasty.' },
  { slug: 'un-progetto-bsg', page: 'bsg',
    title: 'Un progetto BSG · Squisitus',
    description: 'Squisitus è un progetto di Gruppo BSG, agenzia di comunicazione e marketing e centrale media indipendente con 35 anni di relazioni territoriali.' },
  { slug: 'sali-a-bordo', page: 'sali-a-bordo',
    title: 'Sali a bordo: espositori e sponsor · Squisitus Roma 2027',
    description: 'Richiedi uno spazio espositivo o scopri le opportunità di sponsorship per Squisitus Roma 2027, la Food Exhibition al Palazzo dei Congressi.' },
  { slug: 'sali-a-bordo/espositore', page: 'sali-a-bordo', path: 'espositore',
    title: 'Diventa espositore · Squisitus Roma 2027',
    description: 'Richiedi il tuo spazio espositivo a Squisitus Roma 2027: stand 4×3 o 3×4 m al Palazzo dei Congressi, 1 • 2 ottobre 2027.' },
  { slug: 'sali-a-bordo/sponsor', page: 'sali-a-bordo', path: 'sponsor',
    title: 'Opportunità di sponsorship · Squisitus Roma 2027',
    description: 'Diventa sponsor di Squisitus Roma 2027: livelli Platinum, Main, Official e Technical per la Food Exhibition al Palazzo dei Congressi.' },
  { slug: 'dicono-di-noi', page: 'dicono-di-noi',
    title: 'Dicono di noi · Rassegna stampa Squisitus',
    description: 'Articoli, comunicati e uscite stampa su Squisitus, la Food Exhibition di Roma.' },
  { slug: 'salotto-on-the-road', page: 'salotto',
    title: 'Il Salotto On The Road · Squisitus',
    description: 'Il percorso itinerante di Squisitus: dalle tappe di Marca by BolognaFiere a Squisitus Exhibition Roma, 1 • 2 ottobre 2027.' },
  { slug: 'press', page: 'press',
    title: 'Area Press · Squisitus',
    description: 'Area riservata ai giornalisti: comunicati stampa, immagini e loghi di Squisitus Roma 2027.' },
];

// Old #/ addresses (first version of the site) -> new slugs, so shared links keep working.
const LEGACY = { 'bsg': 'un-progetto-bsg', 'salotto': 'salotto-on-the-road' };

const clean = s => s.replace(/^\/+|\/+$/g, '');

// Address of a route relative to the site root, with the trailing slash static hosts use ("" for the home).
export const urlOf = r => (r.slug ? r.slug + '/' : '');

// Relative link to a page (and optional sub-path), e.g. "un-progetto-bsg/"; "./" for the home.
export function hrefFor(page, path) {
  const r = ROUTES.find(x => x.page === page && (path ? x.path === path : !x.path));
  return (r && urlOf(r)) || './';
}

// Route for a path relative to the site base, e.g. "un-progetto-bsg" or "sali-a-bordo/sponsor/".
export function routeFor(rel) {
  let s = clean(rel || '');
  if (LEGACY[s.split('/')[0]]) s = LEGACY[s.split('/')[0]] + s.slice(s.split('/')[0].length);
  return ROUTES.find(x => x.slug === s) || null;
}
