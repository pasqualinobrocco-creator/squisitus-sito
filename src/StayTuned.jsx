import React, { useEffect, useState } from 'react';

// Temporary page shown before the launch instead of the site (switched on and off in the panel → "Pagina di lancio").
// With "solo logo" it shows only the logo; otherwise logo, text and, with a launch date, a countdown.
// In both cases, when it reaches zero and "spegni al lancio" is on, the page reloads into the site.

const RED = '#A5143B';
const SOCIAL = [
  ['Instagram', 'https://www.instagram.com/squisitus/'],
  ['Facebook', 'https://www.facebook.com/profile.php?id=100063584168175'],
  ['LinkedIn', 'https://www.linkedin.com/company/squisitus/posts/'],
];

const quando = iso => {
  const d = new Date(iso);
  const g = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Rome' }).format(d);
  const o = new Intl.DateTimeFormat('it-IT', { hour: 'numeric', minute: '2-digit', timeZone: 'Europe/Rome' }).format(d);
  return g.charAt(0).toUpperCase() + g.slice(1) + ', ore ' + o;
};

function resto(fine, ora) {
  const s = Math.max(0, Math.floor((fine - ora) / 1000));
  return [['giorni', Math.floor(s / 86400)], ['ore', Math.floor(s / 3600) % 24], ['minuti', Math.floor(s / 60) % 60], ['secondi', s % 60]];
}

export default function StayTuned({ stato }) {
  const fine = stato.lancio_at ? Date.parse(stato.lancio_at) : null;
  const [ora, setOra] = useState(Date.now());
  useEffect(() => {
    if (!fine) return;
    const t = setInterval(() => {
      const n = Date.now();
      setOra(n);
      if (n >= fine && stato.spegni_al_lancio) { clearInterval(t); setTimeout(() => location.reload(), 1500); }
    }, 1000);
    return () => clearInterval(t);
  }, [fine]);

  if (stato.solo_logo) return (
    <main className="sq-st" style={{ minHeight: '100svh', background: RED, display: 'grid', placeItems: 'center', overflow: 'hidden', position: 'relative', padding: 16 }}>
      <span aria-hidden="true" className="sq-st-ring" style={{ top: '50%' }} />
      <h1 style={{ margin: 0, position: 'relative' }}>
        <img src="assets/squisitus-logo-white.svg" alt="Squisitus" className="sq-st-in" style={{ display: 'block', width: 'min(clamp(200px, 30vw, 340px), 55svh)', height: 'auto' }} />
      </h1>
    </main>
  );

  return (
    <main className="sq-st" style={{ minHeight: '100svh', background: RED, color: '#fff', display: 'grid', gridTemplateRows: '1fr auto', fontFamily: 'Lato,sans-serif', overflow: 'hidden', position: 'relative' }}>
      <span aria-hidden="true" className="sq-st-ring" />
      <section style={{ display: 'grid', placeItems: 'center', textAlign: 'center', padding: '48px 16px 24px', position: 'relative' }}>
        <div style={{ display: 'grid', justifyItems: 'center', gap: 'clamp(18px, 3vw, 28px)', maxWidth: 820 }}>
          <img src="assets/squisitus-logo-white.svg" alt="Squisitus" className="sq-st-in" style={{ width: 'clamp(150px, 22vw, 230px)', height: 'auto' }} />
          <p className="sq-st-in" style={{ margin: 0, fontFamily: 'Oswald,sans-serif', fontWeight: 600, fontSize: 'clamp(12px, 1.4vw, 14px)', letterSpacing: '.28em', textTransform: 'uppercase', opacity: .85, animationDelay: '.15s' }}>
            Roma · 1 • 2 ottobre 2027 · Palazzo dei Congressi
          </p>
          <h1 className="sq-st-in" style={{ margin: 0, fontFamily: 'Oswald,sans-serif', fontWeight: 700, fontSize: 'clamp(56px, 13vw, 150px)', lineHeight: .9, letterSpacing: '.02em', textTransform: 'uppercase', animationDelay: '.3s' }}>
            Stay tuned
          </h1>
          <p className="sq-st-in" style={{ margin: 0, fontSize: 'clamp(17px, 2.2vw, 22px)', lineHeight: 1.5, maxWidth: 560, animationDelay: '.45s' }}>
            {stato.messaggio || 'Il nuovo sito di Squisitus è quasi pronto.'}
            {fine && <><br /><b>{quando(stato.lancio_at)}</b></>}
          </p>
          {fine && ora < fine && (
            <div className="sq-st-in" role="timer" aria-label="Tempo al lancio" style={{ display: 'flex', gap: 'clamp(8px, 2vw, 18px)', animationDelay: '.6s' }}>
              {resto(fine, ora).map(([k, v]) => (
                <div key={k} style={{ minWidth: 'clamp(64px, 12vw, 104px)', padding: 'clamp(10px, 1.6vw, 16px) 6px', border: '1px solid rgba(255,255,255,.45)', borderRadius: 6, background: 'rgba(255,255,255,.07)' }}>
                  <div style={{ fontFamily: 'Oswald,sans-serif', fontWeight: 600, fontSize: 'clamp(28px, 5vw, 50px)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{String(v).padStart(2, '0')}</div>
                  <div style={{ marginTop: 6, fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', opacity: .8 }}>{k}</div>
                </div>
              ))}
            </div>
          )}
          {fine && ora >= fine && <p style={{ margin: 0, fontFamily: 'Oswald,sans-serif', fontSize: 22, letterSpacing: '.1em', textTransform: 'uppercase' }}>Ci siamo!</p>}
        </div>
      </section>
      <footer style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px', justifyContent: 'center', alignItems: 'center', padding: '18px 16px 26px', fontSize: 13, position: 'relative' }}>
        {SOCIAL.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noopener" style={{ color: '#fff', fontFamily: 'Oswald,sans-serif', letterSpacing: '.16em', textTransform: 'uppercase', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,.5)', paddingBottom: 2 }}>{n}</a>)}
        <span style={{ opacity: .75 }}>Un progetto BSG</span>
      </footer>
    </main>
  );
}
