import React, { useState } from 'react';
import { db, fmtData } from '../client.js';
import { Field, Modal, Page, Si, Table, useRows, useToast } from '../ui.jsx';

const VUOTO = { tipo: 'articolo', testata: '', titolo: '', link: '', data: '', in_evidenza: false, occhiello: '', testo: '', ordine: 0, pubblicato: true };
const dove = a => a.tipo === 'comunicato' ? 'Apertura "Dicono di noi"' : a.link ? (a.in_evidenza ? 'Salotto + In evidenza' : 'Salotto') : 'In pubblicazione';

export default function Articoli() {
  const [rows, reload] = useRows(() => db.from('articoli').select('*').order('data', { ascending: false, nullsFirst: true }).order('ordine'));
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState('');
  const toast = useToast();
  const vis = rows.filter(r => !q || (r.testata + ' ' + r.titolo).toLowerCase().includes(q.toLowerCase()));

  const toggle = async (r, k) => {
    const { error } = await db.from('articoli').update({ [k]: !r[k] }).eq('id', r.id);
    if (error) return toast(error.message, 'error');
    reload();
  };

  return (
    <Page title="Rassegna stampa" subtitle="Articoli e comunicati mostrati in “Dicono di noi” e nella pagina Salotto." actions={<button className="btn primary" onClick={() => setEdit({ ...VUOTO })}>+ Nuovo articolo</button>}>
      <div className="toolbar"><input className="grow" type="search" placeholder="Cerca per testata o titolo" value={q} onChange={e => setQ(e.target.value)} /></div>
      <Table rows={vis} onRow={r => setEdit(r)} empty="Nessun articolo." columns={[
        { key: 'data', label: 'Data', render: r => fmtData(r.data) || '—' },
        { key: 'testata', label: 'Testata', render: r => <b>{r.testata}</b> },
        { key: 'titolo', label: 'Titolo', render: r => <span style={{ display: 'block', maxWidth: 420 }}>{r.titolo}</span> },
        { key: 'dove', label: 'Dove compare', render: r => <span className={'badge' + (r.link || r.tipo === 'comunicato' ? ' red' : ' warn')}>{dove(r)}</span> },
        { key: 'pubblicato', label: 'Visibile', render: r => <Si v={r.pubblicato} /> }
      ]} actions={r => <>
        <button className="btn small" onClick={() => toggle(r, 'in_evidenza')} disabled={!r.link}>{r.in_evidenza ? '★ In evidenza' : '☆ Evidenzia'}</button>
        <button className="btn small" onClick={() => toggle(r, 'pubblicato')}>{r.pubblicato ? 'Nascondi' : 'Mostra'}</button>
      </>} />
      {edit && <Editor val={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />}
    </Page>
  );
}

function Editor({ val, onClose, onSaved }) {
  const [f, setF] = useState({ ...VUOTO, ...val, link: val.link || '', data: val.data || '', occhiello: val.occhiello || '', testo: val.testo || '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const set = k => e => setF(x => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const com = f.tipo === 'comunicato';

  const salva = async e => {
    e.preventDefault();
    if (!f.testata.trim() || !f.titolo.trim()) return setErr('Testata e titolo sono obbligatori.');
    if (f.link && !/^https?:\/\//.test(f.link.trim())) return setErr('Il link deve iniziare con https://');
    setBusy(true);
    const row = { tipo: f.tipo, testata: f.testata.trim(), titolo: f.titolo.trim(), link: f.link.trim() || null, data: f.data || null,
      in_evidenza: !!f.link && f.in_evidenza, occhiello: com ? f.occhiello.trim() || null : null, testo: com ? f.testo.trim() || null : null,
      ordine: Number(f.ordine) || 0, pubblicato: f.pubblicato };
    const { error } = val.id ? await db.from('articoli').update(row).eq('id', val.id) : await db.from('articoli').insert(row);
    setBusy(false);
    if (error) return setErr(error.message);
    toast(val.id ? 'Articolo aggiornato.' : 'Articolo aggiunto.'); onSaved();
  };
  const elimina = async () => {
    if (!confirm('Eliminare definitivamente “' + val.titolo + '”?')) return;
    const { error } = await db.from('articoli').delete().eq('id', val.id);
    if (error) return toast(error.message, 'error');
    toast('Articolo eliminato.'); onSaved();
  };

  return (
    <Modal title={val.id ? 'Modifica articolo' : 'Nuovo articolo'} onClose={onClose} footer={<>
      {val.id && <button className="btn danger left" onClick={elimina}>Elimina</button>}
      <button className="btn" onClick={onClose}>Annulla</button>
      <button className="btn primary" onClick={salva} disabled={busy}>{busy ? 'Salvo…' : 'Salva'}</button>
    </>}>
      <form className="form" onSubmit={salva}>
        <Field label="Tipo"><select value={f.tipo} onChange={set('tipo')}><option value="articolo">Articolo di una testata</option><option value="comunicato">Comunicato Squisitus</option></select></Field>
        <Field label="Data di uscita"><input type="date" value={f.data} onChange={set('data')} /></Field>
        <Field label="Testata *" full><input value={f.testata} onChange={set('testata')} placeholder="es. Corriere della Sera" /></Field>
        <Field label="Titolo *" full><input value={f.titolo} onChange={set('titolo')} /></Field>
        <Field label="Link all’articolo" full hint="Lascia vuoto se non è ancora uscito: comparirà tra gli “Articoli in pubblicazione”."><input type="url" value={f.link} onChange={set('link')} placeholder="https://" /></Field>
        {com && <Field label="Occhiello" full><input value={f.occhiello} onChange={set('occhiello')} /></Field>}
        {com && <Field label="Testo integrale" full hint="Separa i paragrafi con una riga vuota."><textarea value={f.testo} onChange={set('testo')} rows={8} /></Field>}
        <Field label="Ordine" hint="A parità di data, i numeri più bassi vengono prima."><input type="number" value={f.ordine} onChange={set('ordine')} /></Field>
        <div className="field" style={{ justifyContent: 'center', gap: 10 }}>
          <label className="check"><input type="checkbox" checked={f.in_evidenza} disabled={!f.link} onChange={set('in_evidenza')} /> In evidenza (“Ne parlano”)</label>
          <label className="check"><input type="checkbox" checked={f.pubblicato} onChange={set('pubblicato')} /> Visibile sul sito</label>
        </div>
        {err && <div className="err full" role="alert">{err}</div>}
      </form>
    </Modal>
  );
}
