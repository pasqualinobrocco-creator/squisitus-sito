// Pages of the public site: real addresses (no #), with title and description for Google and social previews.
// Used by the site (navigation) and by vite.config.js (one static HTML per page + sitemap.xml).
export const SITE_URL = 'https://www.squisitus.it';
export const OG_IMAGE = 'assets/social/stand.jpg';

// title / description: for Google (title ≤ 60 characters, description 120–158).
// social: title, description and 1200×630 image shown when the page is shared (Facebook, LinkedIn, WhatsApp, X).
export const ROUTES = [
  { slug: '', page: 'home',
    title: 'Squisitus · Food Exhibition di territori ed eccellenze',
    description: 'Squisitus Food Exhibition: 5 e 6 novembre 2027 a Roma, La Nuvola – Roma Convention Center (EUR). PMI, territori ed eccellenze enogastronomiche protagoniste.',
    social: { title: 'Squisitus: la Food Exhibition dei territori',
      description: '5 • 6 novembre 2027 alla Nuvola – Roma Convention Center. Esponi, scopri e incontra le eccellenze enogastronomiche italiane.',
      image: 'assets/social/stand.jpg', alt: 'Lo stand Squisitus con l’insegna Healthy · Sport · Tasty e i visitatori in fiera' } },
  { slug: 'un-progetto-bsg', page: 'bsg',
    title: 'Un progetto di Gruppo BSG · Squisitus',
    description: 'Squisitus nasce da Gruppo BSG, agenzia di comunicazione e marketing e centrale media indipendente: 35 anni di relazioni tra imprese, territori e media.',
    social: { title: 'Squisitus, un progetto di Gruppo BSG',
      description: '35 anni di comunicazione, marketing e relazioni territoriali dietro la Food Exhibition Squisitus.',
      image: 'assets/social/talk.jpg', alt: 'Talk sul palco del Salotto di Squisitus davanti al pubblico' } },
  { slug: 'sali-a-bordo', page: 'sali-a-bordo',
    title: 'Espositori e sponsor · Squisitus',
    description: 'Partecipa a Squisitus come espositore o sponsor: 5 e 6 novembre 2027 alla Nuvola – Roma Convention Center, con visibilità crossmediale. Richiedi informazioni.',
    social: { title: 'Sali a bordo di Squisitus',
      description: 'Spazi espositivi e sponsorship per la Food Exhibition, 5 • 6 novembre 2027 a Roma. Richiedi informazioni.',
      image: 'assets/social/stand.jpg', alt: 'Lo stand Squisitus con i prodotti delle aziende partner' } },
  { slug: 'sali-a-bordo/espositore', page: 'sali-a-bordo', path: 'espositore',
    title: 'Diventa espositore · Squisitus',
    description: 'Richiedi il tuo stand a Squisitus: spazi da 4×3 o 3×4 m alla Nuvola – Roma Convention Center, 5 e 6 novembre 2027, per PMI e consorzi agroalimentari.',
    social: { title: 'Esponi a Squisitus',
      description: 'Uno stand alla Nuvola – Roma Convention Center, 5 • 6 novembre 2027, per raccontare i tuoi prodotti e il tuo territorio.',
      image: 'assets/social/stand.jpg', alt: 'Lo stand Squisitus con i prodotti delle aziende partner' } },
  { slug: 'sali-a-bordo/sponsor', page: 'sali-a-bordo', path: 'sponsor',
    title: 'Sponsorship · Squisitus Food Exhibition',
    description: 'Diventa sponsor di Squisitus, 5 e 6 novembre 2027 a Roma: pacchetti Platinum, Main, Official e Technical con visibilità in fiera, sui media e sul territorio.',
    social: { title: 'Diventa partner di Squisitus',
      description: 'Pacchetti Platinum, Main, Official e Technical per la Food Exhibition del 5 • 6 novembre 2027. Scopri le opportunità.',
      image: 'assets/social/campagna.jpg', alt: 'Maxi schermo con la campagna Squisitus e i loghi dei partner' } },
  { slug: 'dicono-di-noi', page: 'dicono-di-noi',
    title: 'Rassegna stampa · Dicono di noi · Squisitus',
    description: 'La rassegna stampa di Squisitus: articoli, comunicati e uscite su testate nazionali e di settore dedicati a Squisitus Food Exhibition e alle sue tappe.',
    social: { title: 'Dicono di noi: la rassegna stampa di Squisitus',
      description: 'Articoli e uscite stampa su Squisitus Food Exhibition e sul Salotto On The Road.',
      image: 'assets/social/salotto.jpg', alt: 'Il pubblico del Salotto di Squisitus durante un incontro' } },
  { slug: 'salotto-on-the-road', page: 'salotto',
    title: 'Il Salotto On The Road · Squisitus Food Exhibition',
    description: 'Il Salotto On The Road porta Squisitus nei territori: da Marca by BolognaFiere a Squisitus Exhibition, 5 e 6 novembre 2027 alla Nuvola di Roma.',
    social: { title: 'Il Salotto On The Road di Squisitus',
      description: 'Un viaggio tra territori, eccellenze e incontri: da Bologna a Roma, tappa dopo tappa.',
      image: 'assets/social/territori.jpg', alt: 'Colline e vigneti italiani al tramonto' } },
  { slug: 'press', page: 'press',
    title: 'Area Press e accrediti stampa · Squisitus',
    description: "Area press di Squisitus: richiedi l'accredito stampa per la fiera del 5 e 6 novembre 2027 e scarica comunicati, immagini e loghi dal press kit.",
    social: { title: 'Area Press · Squisitus',
      description: 'Accrediti stampa e press kit della Food Exhibition, 5 • 6 novembre 2027 alla Nuvola – Roma Convention Center.',
      image: 'assets/social/campagna.jpg', alt: 'Maxi schermo con la campagna Squisitus su strada' } },
];

// Structured data for Google (JSON-LD): the event and the organiser, on the home page.
export function jsonLd() {
  const bsg = { '@type': 'Organization', name: 'BSG S.r.l. · Gruppo BSG', url: 'https://www.bsgsrl.it', email: 'info@bsgsrl.it', vatID: 'IT10119151008',
    address: { '@type': 'PostalAddress', streetAddress: 'Via Appia Nuova 677', postalCode: '00179', addressLocality: 'Roma', addressCountry: 'IT' } };
  return [
    { '@context': 'https://schema.org', '@type': 'Event', name: 'Squisitus · Food Exhibition',
      description: ROUTES[0].description, url: SITE_URL + '/', image: [SITE_URL + '/assets/social/stand.jpg'],
      startDate: '2027-11-05T10:00:00+01:00', endDate: '2027-11-06T18:00:00+01:00',
      eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', inLanguage: 'it',
      location: { '@type': 'Place', name: 'La Nuvola – Roma Convention Center', address: { '@type': 'PostalAddress', streetAddress: 'Viale Asia 40', postalCode: '00144', addressLocality: 'Roma', addressRegion: 'RM', addressCountry: 'IT' } },
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
