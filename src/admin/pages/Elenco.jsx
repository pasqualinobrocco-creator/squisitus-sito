import React, { useState } from 'react';
import { db, scaricaCsv } from '../client.js';
import { Field, Modal, Page, Table, useConfirm, useRows, useToast } from '../ui.jsx';

// Shared view for the tables filled by the site forms: filters, search, detail with status and notes, CSV, delete.
// conf: { tabella, titolo, sottotitolo, stati?, filtri?: [{ key, label, options }], cerca: [keys], colonne, dettaglio: [{key,label,render?}], csv }
export default function Elenco({ conf, aggiornaBadge }) {
  const [rows, reload] = useRows(() => db.from(conf.tabella).select('*').order('created_at', { ascending: false }), [conf.tabella]);
  const [q, setQ] = useState('');
  const [filtri, setFiltri] = useState({});
  const [sel, setSel] = useState(null);
  const vis = rows.filter(r =>
    Object.entries(filtri).every(([k, v]) => !v || String(r[k]) === v) &&
    (!q || conf.cerca.some(k => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase()))));
  const dopo = () => { setSel(null); reload(); aggiornaBadge?.(); };

  return (
    <Page title={conf.titolo} subtitle={conf.sottotitolo} actions={<button className="btn" onClick={() => scaricaCsv(conf.tabella, vis, conf.csv)} disabled={!vis.length}>Esporta CSV ({vis.length})</button>}>
      <div className="toolbar">
        <input className="grow" type="search" placeholder="Cerca" value={q} onChange={e => setQ(e.target.value)} />
        {(conf.filtri || []).map(f => (
          <select key={f.key} value={filtri[f.key] || ''} onChange={e => setFiltri(x => ({ ...x, [f.key]: e.target.value }))} style={{ width: 'auto' }}>
            <option value="">{f.label}: tutti</option>{f.options.map(o => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>)}
          </select>
        ))}
      </div>
      <Table rows={vis} onRow={setSel} columns={conf.colonne} empty={rows.length ? 'Nessun risultato con questi filtri.' : 'Ancora nessun dato dal sito.'} />
      {sel && <Dettaglio conf={conf} r={sel} onClose={() => setSel(null)} onDone={dopo} />}
    </Page>
  );
}

function Dettaglio({ conf, r, onClose, onDone }) {
  const [stato, setStato] = useState(r.stato);
  const [note, setNote] = useState(r.note || '');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const conferma = useConfirm();
  const salva = async () => {
    setBusy(true);
    const { error } = await db.from(conf.tabella).update({ stato, note: note.trim() || null }).eq('id', r.id);
    setBusy(false);
    if (error) return toast(error.message, 'error');
    toast('Salvato.'); onDone();
  };
  const elimina = async () => {
    if (!(await conferma('Eliminare definitivamente questo elemento? L’operazione non si può annullare.'))) return;
    const { error } = await db.from(conf.tabella).delete().eq('id', r.id);
    if (error) return toast(error.message, 'error');
    toast('Eliminato.'); onDone();
  };
  return (
    <Modal title={conf.titoloDettaglio(r)} onClose={onClose} footer={<>
      <button className="btn danger left" onClick={elimina}>Elimina</button>
      {r.email && <a className="btn" href={'mailto:' + r.email}>Scrivi email</a>}
      <button className="btn" onClick={onClose}>Chiudi</button>
      {conf.stati && <button className="btn primary" onClick={salva} disabled={busy}>{busy ? 'Salvo…' : 'Salva'}</button>}
    </>}>
      <dl className="dl">{conf.dettaglio.filter(d => d.render || (r[d.key] !== null && r[d.key] !== '')).map(d => <React.Fragment key={d.key}><dt>{d.label}</dt><dd>{d.render ? d.render(r) : String(r[d.key])}</dd></React.Fragment>)}</dl>
      {conf.stati && <div className="form">
        <Field label="Stato"><select value={stato} onChange={e => setStato(e.target.value)}>{conf.stati.map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Note interne" full hint="Visibili solo nel pannello."><textarea value={note} onChange={e => setNote(e.target.value)} rows={4} /></Field>
      </div>}
    </Modal>
  );
}
