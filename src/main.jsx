import React from 'react';
import { createRoot } from 'react-dom/client';
import Site from './Site.jsx';
import StayTuned from './StayTuned.jsx';
import { loadStato, inPannello } from './supabase.js';
import './styles.css';

const root = createRoot(document.getElementById('root'));

// Before the launch visitors see the "Stay tuned" page (switched on and off from the panel).
// Whoever is logged in to the panel in this browser sees the real site, with a reminder bar.
// Staging (staging.squisitus.it, built with VITE_STAGING=true): always the full site, with a "Staging" badge.
const STAGING = import.meta.env.VITE_STAGING === 'true';

loadStato().then(s => {
  if (STAGING) return root.render(<><AvvisoStaging /><Site /></>);
  const attesa = !!s?.in_arrivo && !(s.spegni_al_lancio && s.lancio_at && Date.now() >= Date.parse(s.lancio_at));
  if (attesa && !inPannello()) return root.render(<StayTuned stato={s} />);
  root.render(<>{attesa && <AvvisoAnteprima />}<Site /></>);
});

function AvvisoAnteprima() {
  return (
    <div role="status" style={{ position: 'fixed', left: '50%', bottom: 14, transform: 'translateX(-50%)', zIndex: 9999, background: '#3C3C3B', color: '#fff', fontFamily: 'Lato,sans-serif', fontSize: 13, padding: '8px 14px', borderRadius: 999, boxShadow: '0 4px 16px rgba(0,0,0,.25)', maxWidth: 'calc(100vw - 32px)', textAlign: 'center' }}>
      Anteprima riservata: il pubblico vede ancora la pagina “Stay tuned”.
    </div>
  );
}

function AvvisoStaging() {
  return (
    <div role="status" style={{ position: 'fixed', right: 14, bottom: 14, zIndex: 9999, background: '#106B30', color: '#fff', fontFamily: 'Oswald,sans-serif', fontWeight: 600, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', padding: '7px 12px', borderRadius: 999, boxShadow: '0 4px 16px rgba(0,0,0,.25)', pointerEvents: 'none' }}>
      Staging · versione di prova
    </div>
  );
}
