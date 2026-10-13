import React, { useEffect, useState } from 'react';
import { db } from '../client.js';
import { Field, Page, useToast } from '../ui.jsx';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const lista = s => (s || '').split(/[,;\s]+/).map(x => x.trim().toLowerCase()).filter(Boolean);

// Editable list of addresses (stored as a comma-separated string).
function ListaEmail({ value, onChange }) {
  const [nuova, setNuova] = useState('');
  const [err, setErr] = useState('');
  const items = lista(value);
  const aggiungi = () => {
    const e = nuova.trim().toLowerCase();
    if (!EMAIL.test(e)) return setErr('Indirizzo non valido.');
    if (items.includes(e)) return setErr('Indirizzo già presente.');
    onChange([...items, e].join(', ')); setNuova(''); setErr('');
  };
  return (
    <div className="full" style={{ display: 'grid', gap: 10 }}>
      {items.length ? (
        <div className="table-wrap"><table><tbody>
          {items.map(e => (
            <tr key={e}><td>{e}</td><td className="actions"><button type="button" className="btn small danger" onClick={() => onChange(items.filter(x => x !== e).join(', '))} aria-label={'Rimuovi ' + e}>Rimuovi</button></td></tr>
          ))}
        </tbody></table></div>
      ) : <div className="note">Nessun destinatario: le notifiche al team non vengono inviate.</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input type="email" className="input" style={{ flex: '1 1 260px' }} placeholder="nome@bsgsrl.it" value={nuova}
          onChange={e => { setNuova(e.target.value); setErr(''); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); aggiungi(); } }} />
        <button type="button" className="btn" onClick={aggiungi}>+ Aggiungi</button>
      </div>
      {err && <div className="err" role="alert">{err}</div>}
    </div>
  );
}

export default function Email() {
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState('');
  const toast = useToast();
  useEffect(() => { db.from('impostazioni').select('*').eq('id', 1).single().then(({ data, error }) => error ? toast(error.message, 'error') : setF(data)); }, []);
  if (!f) return <div className="spin">Caricamento…</div>;
  const set = k => e => setF(x => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const salva = async e => {
    e?.preventDefault();
    if (f.mittente_email && !EMAIL.test(f.mittente_email.trim())) return toast('Email del mittente non valida.', 'error');
    if (f.rispondi_a && !EMAIL.test(f.rispondi_a.trim())) return toast('Email “Rispondi a” non valida.', 'error');
    setBusy('salva');
    const { id, aggiornato_at, ...row } = f;
    const { error } = await db.from('impostazioni').update({ ...row, mittente_email: f.mittente_email?.trim() || null, rispondi_a: f.rispondi_a?.trim() || null, notifiche_a: lista(f.notifiche_a).join(', ') || null, aggiornato_at: new Date().toISOString() }).eq('id', 1);
    setBusy('');
    if (error) { toast(error.message, 'error'); return false; }
    toast('Impostazioni salvate.'); return true;
  };
  const prova = async () => {
    if (!(await salva())) return;
    setBusy('prova');
    const { data, error } = await db.functions.invoke('notifica-email', { body: { test: true } });
    setBusy('');
    if (error) {
      let msg = error.message;
      try { const b = await error.context?.json?.(); if (b?.error) msg = b.error; } catch (_) { /* generic */ }
      return toast('Invio non riuscito: ' + msg, 'error');
    }
    toast('Email di prova inviata a ' + data.a + '.');
  };

  return (
    <Page title="Impostazioni" subtitle="Email automatiche inviate con Resend quando arrivano richieste dal sito.">
      <div style={{ display: 'grid', gap: 16, maxWidth: 760 }}>
        <form className="card form" onSubmit={salva}>
          <h2 className="full" style={{ fontSize: 16 }}>Mittente</h2>
          <Field label="Nome mittente"><input value={f.mittente_nome || ''} onChange={set('mittente_nome')} /></Field>
          <Field label="Email mittente" hint="Deve essere sul dominio verificato in Resend, es. info@squisitus.it"><input type="email" value={f.mittente_email || ''} onChange={set('mittente_email')} placeholder="info@tuodominio.it" /></Field>
          <Field label="Rispondi a (facoltativo)" full hint="Dove arrivano le risposte alle email di conferma. Se vuoto, ai destinatari delle notifiche qui sotto."><input type="email" value={f.rispondi_a || ''} onChange={set('rispondi_a')} /></Field>

          <h2 className="full" style={{ fontSize: 16, marginTop: 8 }}>Destinatari delle notifiche</h2>
          <p className="full" style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>Chi riceve le email quando arriva una richiesta dal sito. Ricordati di premere <b>Salva</b> dopo aver aggiunto o rimosso un indirizzo.</p>
          <ListaEmail value={f.notifiche_a} onChange={v => setF(x => ({ ...x, notifiche_a: v }))} />
          <div className="full" style={{ display: 'grid', gap: 10 }}>
            <label className="check"><input type="checkbox" checked={f.notifica_richieste} onChange={set('notifica_richieste')} /> Nuove richieste espositori e sponsor</label>
            <label className="check"><input type="checkbox" checked={f.notifica_accrediti} onChange={set('notifica_accrediti')} /> Nuove richieste di accredito press</label>
            <label className="check"><input type="checkbox" checked={f.notifica_newsletter} onChange={set('notifica_newsletter')} /> Nuovi iscritti alla newsletter</label>
          </div>

          <h2 className="full" style={{ fontSize: 16, marginTop: 8 }}>Conferme</h2>
          <label className="check full"><input type="checkbox" checked={f.conferma_mittente} onChange={set('conferma_mittente')} /> Invia un’email di conferma a chi compila un modulo</label>

          <div className="full" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn primary" disabled={!!busy}>{busy === 'salva' ? 'Salvo…' : 'Salva'}</button>
            <button type="button" className="btn" disabled={!!busy} onClick={prova}>{busy === 'prova' ? 'Invio…' : 'Salva e invia email di prova'}</button>
          </div>
        </form>
        <div className="note">L’email di prova arriva al tuo indirizzo. Se non funziona, controlla che il dominio sia verificato in Resend e che in Supabase → Edge Functions → Secrets ci sia <b>RESEND_API_KEY</b>.</div>
      </div>
    </Page>
  );
}
