// Pages of the public site: real addresses (no #), with title and description for Google and social previews.
// Used by the site (navigation) and by vite.config.js (one static HTML per page + sitemap.xml).
export const SITE_URL = 'https://www.squisitus.it';
export const OG_IMAGE = 'assets/social/stand.jpg';

// title / description: for Google (title ≤ 60 characters, description 120–158).
// social: title, description and 1200×630 image shown when the page is shared (Facebook, LinkedIn, WhatsApp, X).
export const ROUTES = [
  { slug: '', page: 'home',
    title: 'Squisitus Roma 2027 · Food Exhibition · Palazzo dei Congressi',
    description: 'Food Exhibition di Roma, 1 e 2 ottobre 2027 al Palazzo dei Congressi (EUR): PMI, territori ed eccellenze enogastronomiche protagoniste.',
    social: { title: 'Squisitus Roma 2027: la Food Exhibition dei territori',
      description: '1 • 2 ottobre 2027 al Palazzo dei Congressi di Roma. Esponi, scopri e incontra le eccellenze enogastronomiche italiane.',
      image: 'assets/social/stand.jpg', alt: 'Lo stand Squisitus con l’insegna Healthy · Sport · Tasty e i visitatori in fiera' } },
  { slug: 'un-progetto-bsg', page: 'bsg',
    title: 'Un progetto di Gruppo BSG · Squisitus Roma 2027',
    description: 'Squisitus nasce da Gruppo BSG, agenzia di comunicazione e marketing e centrale media indipendente: 35 anni di relazioni tra imprese, territori e media.',
    social: { title: 'Squisitus, un progetto di Gruppo BSG',
      description: '35 anni di comunicazione, marketing e relazioni territoriali dietro la Food Exhibition di Roma.',
      image: 'assets/social/talk.jpg', alt: 'Talk sul palco del Salotto di Squisitus davanti al pubblico' } },
  { slug: 'sali-a-bordo', page: 'sali-a-bordo',
    title: 'Espositori e sponsor · Squisitus Roma 2027',
    description: 'Partecipa a Squisitus Roma 2027 come espositore o sponsor: stand al Palazzo dei Congressi e visibilità crossmediale. Richiedi informazioni online.',
    social: { title: 'Sali a bordo di Squisitus Roma 2027',
      description: 'Spazi espositivi e sponsorship per la Food Exhibition di Roma, 1 • 2 ottobre 2027. Richiedi informazioni.',
      image: 'assets/social/stand.jpg', alt: 'Lo stand Squisitus con i prodotti delle aziende partner' } },
  { slug: 'sali-a-bordo/espositore', page: 'sali-a-bordo', path: 'espositore',
    title: 'Diventa espositore · Squisitus Roma 2027',
    description: 'Richiedi il tuo stand a Squisitus Roma 2027: spazi da 4×3 o 3×4 m al Palazzo dei Congressi, 1 e 2 ottobre 2027, per PMI e consorzi agroalimentari.',
    social: { title: 'Esponi a Squisitus Roma 2027',
      description: 'Uno stand al Palazzo dei Congressi per raccontare i tuoi prodotti e il tuo territorio. Richiedi informazioni.',
      image: 'assets/social/stand.jpg', alt: 'Lo stand Squisitus con i prodotti delle aziende partner' } },
  { slug: 'sali-a-bordo/sponsor', page: 'sali-a-bordo', path: 'sponsor',
    title: 'Sponsorship · Squisitus Roma 2027 Food Exhibition',
    description: 'Diventa sponsor di Squisitus Roma 2027: pacchetti Platinum, Main, Official e Technical con visibilità in fiera, sui media e sul territorio.',
    social: { title: 'Diventa partner di Squisitus Roma 2027',
      description: 'Pacchetti Platinum, Main, Official e Technical per la Food Exhibition di Roma. Scopri le opportunità.',
      image: 'assets/social/campagna.jpg', alt: 'Maxi schermo con la campagna Squisitus e i loghi dei partner' } },
  { slug: 'dicono-di-noi', page: 'dicono-di-noi',
    title: 'Rassegna stampa · Dicono di noi · Squisitus',
    description: 'La rassegna stampa di Squisitus: articoli, comunicati e uscite su testate nazionali e di settore dedicati alla Food Exhibition di Roma e alle sue tappe.',
    social: { title: 'Dicono di noi: la rassegna stampa di Squisitus',
      description: 'Articoli e uscite stampa sulla Food Exhibition di Roma e sul Salotto On The Road.',
      image: 'assets/social/salotto.jpg', alt: 'Il pubblico del Salotto di Squisitus durante un incontro' } },
  { slug: 'salotto-on-the-road', page: 'salotto',
    title: 'Il Salotto On The Road · Squisitus Food Exhibition',
    description: 'Il Salotto On The Road porta Squisitus nei territori: dalle tappe a Marca by BolognaFiere fino a Squisitus Exhibition Roma, 1 e 2 ottobre 2027.',
    social: { title: 'Il Salotto On The Road di Squisitus',
      description: 'Un viaggio tra territori, eccellenze e incontri: da Bologna a Roma, tappa dopo tappa.',
      image: 'assets/social/territori.jpg', alt: 'Colline e vigneti italiani al tramonto' } },
  { slug: 'press', page: 'press',
    title: 'Area Press e accrediti stampa · Squisitus Roma 2027',
    description: "Area press di Squisitus Roma 2027: richiedi l'accredito stampa per la fiera e scarica comunicati, immagini e loghi dal press kit ufficiale.",
    social: { title: 'Area Press · Squisitus Roma 2027',
      description: 'Accrediti stampa e press kit della Food Exhibition di Roma, 1 • 2 ottobre 2027.',
      image: 'assets/social/campagna.jpg', alt: 'Maxi schermo con la campagna Squisitus su strada' } },
];

// Structured data for Google (JSON-LD): the event and the organiser, on the home page.
export function jsonLd() {
  const bsg = { '@type': 'Organization', name: 'BSG S.r.l. · Gruppo BSG', url: 'https://www.bsgsrl.it', email: 'info@bsgsrl.it', vatID: 'IT10119151008',
    address: { '@type': 'PostalAddress', streetAddress: 'Via Appia Nuova 677', postalCode: '00179', addressLocality: 'Roma', addressCountry: 'IT' } };
  return [
    { '@context': 'https://schema.org', '@type': 'Event', name: 'Squisitus Roma 2027 · Food Exhibition',
      description: ROUTES[0].description, url: SITE_URL + '/', image: [SITE_URL + '/assets/social/stand.jpg'],
      startDate: '2027-10-01T10:00:00+02:00', endDate: '2027-10-02T18:00:00+02:00',
      eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', inLanguage: 'it',
      location: { '@type': 'Place', name: 'Palazzo dei Congressi', address: { '@type': 'PostalAddress', streetAddress: 'Piazza John Fitzgerald Kennedy 1', postalCode: '00144', addressLocality: 'Roma', addressRegion: 'RM', addressCountry: 'IT' } },
      organizer: bsg },
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'Squisitus', url: SITE_URL + '/', logo: SITE_URL + '/assets/squisitus-logo-color.svg',
      sameAs: ['https://www.instagram.com/squisitus/', 'https://www.facebook.com/profile.php?id=100063584168175', 'https://www.linkedin.com/company/squisitus/'],
      parentOrganization: bsg },
  ];
}

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
