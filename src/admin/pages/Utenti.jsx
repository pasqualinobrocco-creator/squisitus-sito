import React, { useState } from 'react';
import { db, fmtData, gestioneUtenti } from '../client.js';
import { RUOLI } from '../App.jsx';
import { Field, Modal, Page, Table, useConfirm, useRows, useToast } from '../ui.jsx';

// Readable temporary password: the admin passes it on, the user changes it from "Il mio account".
const generaPassword = () => {
  const c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const a = crypto.getRandomValues(new Uint32Array(14));
  return Array.from(a, n => c[n % c.length]).join('').replace(/(.{4})(?=.)/g, '$1-');
};

export default function Utenti({ profilo }) {
  const [rows, reload] = useRows(() => db.from('profili').select('*').order('created_at'));
  const [nuovo, setNuovo] = useState(false);
  const [sel, setSel] = useState(null);
  return (
    <Page title="Utenti" subtitle="Chi può entrare nel pannello e con quale ruolo." actions={<button className="btn primary" onClick={() => setNuovo(true)}>+ Nuovo utente</button>}>
      <Table rows={rows} onRow={setSel} columns={[
        { key: 'nome', label: 'Nome', render: r => <b>{r.nome || '—'}{r.id === profilo.id ? ' (tu)' : ''}</b> },
        { key: 'email', label: 'Email' },
        { key: 'ruolo', label: 'Ruolo', render: r => r.ruolo ? <span className="badge red">{r.ruolo}</span> : <span className="badge warn">nessun accesso</span> },
        { key: 'created_at', label: 'Creato il', render: r => fmtData(r.created_at) }
      ]} />
      {nuovo && <Nuovo onClose={() => setNuovo(false)} onDone={() => { setNuovo(false); reload(); }} />}
      {sel && <Gestisci u={sel} io={profilo} onClose={() => setSel(null)} onDone={() => { setSel(null); reload(); }} />}
    </Page>
  );
}

function Nuovo({ onClose, onDone }) {
  const [f, setF] = useState({ nome: '', email: '', ruolo: 'admin', password: generaPassword() });
  const [creato, setCreato] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = k => e => setF(x => ({ ...x, [k]: e.target.value }));
  const crea = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await gestioneUtenti({ azione: 'crea', ...f }); setCreato(f); }
    catch (x) { setErr(x.message); }
    setBusy(false);
  };
  if (creato) return (
    <Modal title="Utente creato" onClose={onDone} footer={<button className="btn primary" onClick={onDone}>Fatto</button>}>
      <p style={{ marginTop: 0 }}>Comunica a <b>{creato.nome || creato.email}</b> queste credenziali, ad esempio a voce o con un messaggio separato dall’email. Questa password non verrà più mostrata: al primo accesso conviene cambiarla da “Il mio account”.</p>
      <dl className="dl"><dt>Indirizzo</dt><dd>{location.href.split('#')[0]}</dd><dt>Email</dt><dd>{creato.email}</dd><dt>Password</dt><dd><code style={{ fontSize: 16 }}>{creato.password}</code></dd></dl>
      <button className="btn small" onClick={() => navigator.clipboard?.writeText('Pannello Squisitus\n' + location.href.split('#')[0] + '\nEmail: ' + creato.email + '\nPassword: ' + creato.password)}>Copia</button>
    </Modal>
  );
  return (
    <Modal title="Nuovo utente" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Annulla</button><button className="btn primary" onClick={crea} disabled={busy}>{busy ? 'Creo…' : 'Crea utente'}</button></>}>
      <form className="form" onSubmit={crea}>
        <Field label="Nome e cognome"><input value={f.nome} onChange={set('nome')} /></Field>
        <Field label="Email *"><input type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Ruolo"><select value={f.ruolo} onChange={set('ruolo')}>{Object.entries(RUOLI).map(([k, l]) => <option key={k} value={k}>{l}</option>)}<option value="">Nessun accesso</option></select></Field>
        <Field label="Password provvisoria" hint="Generata in automatico, puoi cambiarla (min. 10 caratteri)."><input value={f.password} onChange={set('password')} /></Field>
        {err && <div className="err full" role="alert">{err}</div>}
      </form>
    </Modal>
  );
}

function Gestisci({ u, io, onClose, onDone }) {
  const [ruolo, setRuolo] = useState(u.ruolo || '');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const conferma = useConfirm();
  const sonoIo = u.id === io.id;
  const run = async (body, ok) => {
    setBusy(true);
    try { await gestioneUtenti({ id: u.id, ...body }); toast(ok); onDone(); }
    catch (x) { toast(x.message, 'error'); }
    setBusy(false);
  };
  return (
    <Modal title={u.nome || u.email} onClose={onClose} footer={<>
      {!sonoIo && <button className="btn danger left" disabled={busy} onClick={async () => (await conferma('Eliminare l’utente ' + u.email + '? Non potrà più accedere.')) && run({ azione: 'elimina' }, 'Utente eliminato.')}>Elimina utente</button>}
      <button className="btn" onClick={onClose}>Chiudi</button>
    </>}>
      <dl className="dl"><dt>Email</dt><dd>{u.email}</dd><dt>Creato il</dt><dd>{fmtData(u.created_at)}</dd></dl>
      <div className="form">
        <Field label="Ruolo" hint={sonoIo ? 'Non puoi togliere il ruolo admin a te stesso se sei l’unico admin.' : undefined}>
          <select value={ruolo} onChange={e => setRuolo(e.target.value)}>{Object.entries(RUOLI).map(([k, l]) => <option key={k} value={k}>{l}</option>)}<option value="">Nessun accesso</option></select>
        </Field>
        <div className="field" style={{ justifyContent: 'flex-end' }}><button className="btn primary" disabled={busy || ruolo === (u.ruolo || '')} onClick={() => run({ azione: 'ruolo', ruolo: ruolo || null }, 'Ruolo aggiornato.')}>Salva ruolo</button></div>
        {!sonoIo && <>
          <Field label="Nuova password" hint="Per reimpostarla se l’utente l’ha dimenticata (min. 10 caratteri)."><input value={pw} onChange={e => setPw(e.target.value)} placeholder="Nuova password" /></Field>
          <div className="field" style={{ justifyContent: 'flex-end', flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <button className="btn" onClick={() => setPw(generaPassword())}>Genera</button>
            <button className="btn" disabled={busy || pw.length < 10} onClick={() => run({ azione: 'password', password: pw }, 'Password reimpostata: comunicala all’utente.')}>Reimposta</button>
          </div>
        </>}
      </div>
    </Modal>
  );
}
