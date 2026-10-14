// Google Analytics 4, caricato SOLO dopo il consenso ai cookie di misurazione nel banner di iubenda.
// ID di misurazione in .env: VITE_GA_ID=G-XXXXXXXXXX. Senza ID non viene caricato nulla.
const GA_ID = import.meta.env.VITE_GA_ID;
let loaded = false;
let consenso = false; // page views are sent only while consent is granted

function gtag() { window.dataLayer.push(arguments); }

export function analyticsAttivo() { return !!GA_ID; }

// Called when the visitor accepts analytics cookies (and on page load if they accepted before).
export function avviaAnalytics() {
  if (!GA_ID) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = gtag;
  consenso = true;
  if (loaded) { gtag('consent', 'update', { analytics_storage: 'granted' }); tracciaPagina(); return; }
  loaded = true;
  gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  gtag('js', new Date());
  // the site changes page without reloading: page views are sent by tracciaPagina
  gtag('config', GA_ID, { send_page_view: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
  document.head.appendChild(s);
  tracciaPagina();
}

// Called when the visitor withdraws consent: stop collecting and drop the GA cookies.
export function fermaAnalytics() {
  if (!GA_ID || !loaded) return;
  consenso = false;
  gtag('consent', 'update', { analytics_storage: 'denied' });
  const dom = location.hostname.split('.').slice(-2).join('.');
  document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(n => n === '_ga' || n.startsWith('_ga_'))
    .forEach(n => [location.hostname, '.' + dom, ''].forEach(d => { document.cookie = n + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : ''); }));
}

export function tracciaPagina() {
  if (!GA_ID || !loaded || !consenso) return;
  gtag('event', 'page_view', { page_title: document.title, page_location: location.href, page_path: location.pathname });
}

// iubenda Cookie Solution (configured in index.html) calls window.__sqConsenso with the visitor's choice,
// on every page load once a choice exists and whenever it changes. Purpose 4 = "Misurazione" (analytics).
export function collegaConsenso() {
  const applica = p => (p && p.purposes && p.purposes[4] ? avviaAnalytics() : fermaAnalytics());
  window.__sqConsenso = applica;
  if (window.__sqPref) applica(window.__sqPref);
}

// Opens the iubenda preferences panel ("Modifica consenso cookie" in the footer).
export function apriPreferenzeCookie() {
  try { window._iub.cs.api.openPreferences(); } catch (e) { window.open('https://www.iubenda.com/privacy-policy/63043067/cookie-policy', '_blank', 'noopener'); }
}
