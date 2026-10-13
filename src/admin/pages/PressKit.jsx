import React, { useState } from 'react';
import { db } from '../client.js';
import { Field, Modal, Page, Si, Table, useConfirm, useRows, useToast } from '../ui.jsx';

const CARTELLE = ['Comunicati stampa', 'Immagini', 'Loghi', 'Video', 'Documenti'];
const MAX = 50 * 1024 * 1024; // bucket limit
const peso = n => !n ? '' : n > 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '') || 'file';
const titoloDa = nome => nome.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

export default function PressKit() {
  const [rows, reload] = useRows(() => db.from('presskit').select('*').order('cartella').order('ordine').order('created_at'));
  const [edit, setEdit] = useState(null);
  const [cartella, setCartella] = useState('');
  const cartelle = [...new Set([...CARTELLE, ...rows.map(r => r.cartella)])];
  const vis = rows.filter(r => !cartella || r.cartella === cartella);
  return (
    <Page title="Press kit" subtitle="Materiali scaricabili nella pagina Press: file caricati qui o link esterni (Drive, WeTransfer, Dropbox…)."
      actions={<>
        <button className="btn" onClick={() => setEdit({ tipo: 'link' })}>+ Aggiungi link</button>
        <button className="btn primary" onClick={() => setEdit({ tipo: 'file' })}>+ Carica file</button>
      </>}>
      <div className="toolbar">
        <select value={cartella} onChange={e => setCartella(e.target.value)} style={{ width: 'auto' }}>
          <option value="">Tutte le cartelle</option>{cartelle.filter(c => rows.some(r => r.cartella === c)).map(c => <option key={c}>{c}</option>)}
        </select>
        {!rows.some(r => r.pubblicato) && <span className="note">Nessun materiale visibile: nella pagina Press compare “Il press kit sarà disponibile a breve”.</span>}
      </div>
      <Table rows={vis} onRow={r => setEdit(r)} empty="Nessun materiale nel press kit." columns={[
        { key: 'cartella', label: 'Cartella', render: r => <span className="badge red">{r.cartella}</span> },
        { key: 'titolo', label: 'Titolo', render: r => <b>{r.titolo}</b> },
        { key: 'tipo', label: 'Tipo', render: r => r.tipo === 'file' ? <span>{(r.nome_file || '').split('.').pop().toUpperCase()} · {peso(r.dimensione)}</span> : <a href={r.link} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}>Link ↗</a> },
        { key: 'ordine', label: 'Ordine' },
        { key: 'pubblicato', label: 'Sul sito', render: r => <Si v={r.pubblicato} si="Visibile" no="Nascosto" /> }
      ]} />
      {edit && <Editor val={edit} cartelle={cartelle} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />}
    </Page>
  );
}

function Editor({ val, cartelle, onClose, onSaved }) {
  const nuovo = !val.id;
  const file = val.tipo === 'file';
  const [f, setF] = useState({ cartella: val.cartella || 'Comunicati stampa', titolo: val.titolo || '', descrizione: val.descrizione || '', link: val.link || '', ordine: val.ordine ?? 0, pubblicato: val.pubblicato ?? true });
  const [files, setFiles] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const toast = useToast();
  const conferma = useConfirm();
  const set = k => e => setF(x => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const multipli = nuovo && file && files.length > 1;

  const carica = async fl => {
    const path = slug(f.cartella) + '/' + Date.now().toString(36) + '-' + slug(fl.name);
    const { error } = await db.storage.from('presskit').upload(path, fl, { contentType: fl.type || 'application/octet-stream', upsert: false });
    if (error) throw new Error(fl.name + ': ' + error.message);
    return { file: path, nome_file: fl.name, dimensione: fl.size };
  };

  const salva = async e => {
    e?.preventDefault();
    setErr('');
    if (!f.cartella.trim()) return setErr('Indica la cartella.');
    if (file && nuovo && !files.length) return setErr('Scegli almeno un file.');
    if (files.some(x => x.size > MAX)) return setErr('Ogni file deve pesare al massimo 50 MB (per file più grandi usa un link).');
    if (!file && !/^https?:\/\//.test(f.link.trim())) return setErr('Il link deve iniziare con https://');
    if (!multipli && !f.titolo.trim() && !(file && files[0])) return setErr('Il titolo è obbligatorio.');
    const base = { cartella: f.cartella.trim(), descrizione: f.descrizione.trim() || null, ordine: Number(f.ordine) || 0, pubblicato: f.pubblicato };
    try {
      if (file && files.length) {
        // one item per file; with several files the title comes from the file name
        for (let i = 0; i < files.length; i++) {
          setBusy('Carico ' + (i + 1) + ' di ' + files.length + '…');
          const up = await carica(files[i]);
          const row = { ...base, tipo: 'file', ...up, titolo: (multipli ? '' : f.titolo.trim()) || titoloDa(files[i].name) };
          const { error } = nuovo ? await db.from('presskit').insert(row) : await db.from('presskit').update(row).eq('id', val.id);
          if (error) throw error;
          if (!nuovo && val.file) await db.storage.from('presskit').remove([val.file]);
        }
      } else {
        setBusy('Salvo…');
        const row = { ...base, titolo: f.titolo.trim(), ...(file ? {} : { tipo: 'link', link: f.link.trim(), file: null, nome_file: null, dimensione: null }) };
        const { error } = nuovo ? await db.from('presskit').insert(row) : await db.from('presskit').update(row).eq('id', val.id);
        if (error) throw error;
      }
    } catch (x) { setBusy(''); return setErr(x.message || String(x)); }
    setBusy('');
    toast(multipli ? files.length + ' file aggiunti al press kit.' : nuovo ? 'Aggiunto al press kit.' : 'Salvato.');
    onSaved();
  };

  const elimina = async () => {
    if (!(await conferma('Eliminare definitivamente “' + val.titolo + '”' + (val.file ? ' e il file?' : '?')))) return;
    const { error } = await db.from('presskit').delete().eq('id', val.id);
    if (error) return toast(error.message, 'error');
    if (val.file) await db.storage.from('presskit').remove([val.file]);
    toast('Eliminato dal press kit.'); onSaved();
  };

  return (
    <Modal title={nuovo ? (file ? 'Carica file nel press kit' : 'Aggiungi link al press kit') : 'Modifica materiale'} onClose={onClose} footer={<>
      {!nuovo && <button className="btn danger left" onClick={elimina}>Elimina</button>}
      <button className="btn" onClick={onClose}>Annulla</button>
      <button className="btn primary" onClick={salva} disabled={!!busy}>{busy || 'Salva'}</button>
    </>}>
      <form className="form" onSubmit={salva}>
        <Field label="Cartella *" hint="Scegline una o scrivine una nuova: sul sito i materiali sono raggruppati per cartella.">
          <input list="sq-cartelle" value={f.cartella} onChange={set('cartella')} />
          <datalist id="sq-cartelle">{cartelle.map(c => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Ordine" hint="Nella cartella, i numeri più bassi vengono prima."><input type="number" value={f.ordine} onChange={set('ordine')} /></Field>
        {file && (
          <Field label={nuovo ? 'File *' : 'Sostituisci il file'} full hint={nuovo ? 'Puoi selezionarne più di uno: ognuno diventa un materiale scaricabile. Massimo 50 MB a file.' : 'Attuale: ' + (val.nome_file || '') + ' · ' + peso(val.dimensione)}>
            <input type="file" multiple={nuovo} onChange={e => setFiles([...e.target.files])} />
            {files.length > 1 && <small>{files.length} file selezionati: {files.map(x => x.name).join(', ')}</small>}
          </Field>
        )}
        {!file && <Field label="Link *" full hint="Ad esempio una cartella Google Drive, Dropbox o WeTransfer. Sul sito si apre in una nuova finestra."><input type="url" value={f.link} onChange={set('link')} placeholder="https://" /></Field>}
        {!multipli && <Field label={file ? 'Titolo' : 'Titolo *'} full hint={file ? 'Se lo lasci vuoto uso il nome del file.' : undefined}><input value={f.titolo} onChange={set('titolo')} placeholder={file ? 'es. Comunicato stampa – presentazione' : 'es. Foto ad alta risoluzione (cartella Drive)'} /></Field>}
        <Field label="Descrizione (facoltativa)" full><input value={f.descrizione} onChange={set('descrizione')} /></Field>
        <label className="check full"><input type="checkbox" checked={f.pubblicato} onChange={set('pubblicato')} /> Visibile sul sito</label>
        {err && <div className="err full" role="alert">{err}</div>}
      </form>
    </Modal>
  );
}
