import React, { useEffect, useState } from 'react';
import { db } from '../client.js';
import { Field, Page, useToast } from '../ui.jsx';

// "Stay tuned" page shown to visitors before the launch (table sito_stato).
// Whoever is logged in to this panel keeps seeing the real site in the same browser.

// timestamptz <-> value of <input type="datetime-local"> (local time of this computer)
const aLocale = iso => { if (!iso) return ''; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const daLocale = v => (v ? new Date(v).toISOString() : null);

export default function Lancio() {
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => { db.from('sito_stato').select('*').eq('id', 1).single().then(({ data, error }) => error ? toast(error.message, 'error') : setF({ ...data, lancio: aLocale(data.lancio_at) })); }, []);
  if (!f) return <div className="spin">Caricamento…</div>;
  const set = k => e => setF(x => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const scaduto = f.lancio && f.spegni_al_lancio && new Date(f.lancio) <= new Date();
  const visibile = f.in_arrivo && !scaduto;

  const salva = async e => {
    e?.preventDefault();
    setBusy(true);
    const { error } = await db.from('sito_stato').update({ in_arrivo: f.in_arrivo, lancio_at: daLocale(f.lancio), spegni_al_lancio: f.spegni_al_lancio, messaggio: f.messaggio?.trim() || null, aggiornato_at: new Date().toISOString() }).eq('id', 1);
    setBusy(false);
    if (error) return toast(error.message, 'error');
    toast(f.in_arrivo ? 'Salvato: la pagina “Stay tuned” è attiva.' : 'Salvato: il sito è visibile a tutti.');
  };

  return (
    <Page title="Pagina di lancio" subtitle="Pagina “Stay tuned” con il conto alla rovescia, mostrata ai visitatori al posto del sito fino al lancio.">
      <div style={{ display: 'grid', gap: 16, maxWidth: 760 }}>
        <div className="note" style={visibile ? undefined : { background: '#E7F3EC', color: '#1F6B3A' }}>
          {visibile ? <>Adesso i visitatori vedono la pagina <b>Stay tuned</b>. Tu, da questo browser, vedi il sito vero con l’avviso “Anteprima riservata”.</> : <>Adesso il sito è <b>visibile a tutti</b>.</>}
        </div>
        <form className="card form" onSubmit={salva}>
          <label className="check full"><input type="checkbox" checked={f.in_arrivo} onChange={set('in_arrivo')} /> <b>Mostra la pagina “Stay tuned” ai visitatori</b></label>
          <Field label="Data e ora del lancio" hint="Ora italiana. Compare nella pagina con il conto alla rovescia."><input type="datetime-local" value={f.lancio} onChange={set('lancio')} /></Field>
          <label className="check" style={{ alignSelf: 'center' }}><input type="checkbox" checked={f.spegni_al_lancio} onChange={set('spegni_al_lancio')} /> Al lancio mostra il sito in automatico</label>
          <Field label="Messaggio" full><input value={f.messaggio || ''} onChange={set('messaggio')} placeholder="Il nuovo sito di Squisitus è quasi pronto." /></Field>
          <div className="full" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn primary" disabled={busy}>{busy ? 'Salvo…' : 'Salva'}</button>
            <a className="btn" href="./" target="_blank" rel="noopener">Apri il sito (anteprima) ↗</a>
          </div>
        </form>
        <div className="note">Per vedere la pagina come la vede il pubblico, apri www.squisitus.it in una finestra di navigazione in incognito o da un altro dispositivo.</div>
      </div>
    </Page>
  );
}
