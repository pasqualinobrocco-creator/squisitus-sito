import React, { useState } from 'react';
import { db, mediaUrl } from '../client.js';
import { Field, Modal, Page, Si, Table, useRows, useToast } from '../ui.jsx';

const LIVELLI = ['Platinum', 'Main', 'Official', 'Technical'];
const VUOTO = { nome: '', livello: 'Main', logo: '', link: '', ordine: 0, pubblicato: true };
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'logo';

export default function Partner() {
  const [rows, reload] = useRows(() => db.from('partner').select('*').order('ordine').order('nome'));
  const [edit, setEdit] = useState(null);
  const [liv, setLiv] = useState('');
  const vis = rows.filter(r => !liv || r.livello === liv).sort((a, b) => LIVELLI.indexOf(a.livello) - LIVELLI.indexOf(b.livello) || a.ordine - b.ordine);
  return (
    <Page title="Partner" subtitle="Loghi di sponsor e partner nella homepage, raggruppati per livello." actions={<button className="btn primary" onClick={() => setEdit({ ...VUOTO })}>+ Nuovo partner</button>}>
      <div className="toolbar">
        <select value={liv} onChange={e => setLiv(e.target.value)} style={{ width: 'auto' }}><option value="">Tutti i livelli</option>{LIVELLI.map(l => <option key={l}>{l}</option>)}</select>
        {!rows.some(r => r.pubblicato && r.logo) && <span className="note">Nessun partner visibile con logo: la sezione “Sponsor e partner” della homepage è nascosta. Compare appena ne pubblichi uno.</span>}
      </div>
      <Table rows={vis} onRow={r => setEdit(r)} empty="Nessun partner." columns={[
        { key: 'logo', label: 'Logo', render: r => r.logo ? <img className="thumb" src={mediaUrl(r.logo)} alt="" /> : <span className="badge warn">manca</span> },
        { key: 'nome', label: 'Nome', render: r => <b>{r.nome}</b> },
        { key: 'livello', label: 'Livello', render: r => <span className="badge red">{r.livello}</span> },
        { key: 'link', label: 'Link', render: r => r.link ? <a href={r.link} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}>{r.link.replace(/^https?:\/\//, '').slice(0, 32)}</a> : '—' },
        { key: 'ordine', label: 'Ordine' },
        { key: 'pubblicato', label: 'Sul sito', render: r => r.pubblicato && r.logo ? <Si v si="Visibile" /> : <span className="badge warn">{r.pubblicato ? 'Manca il logo' : 'Nascosto'}</span> }
      ]} />
      {edit && <Editor val={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />}
    </Page>
  );
}

function Editor({ val, onClose, onSaved }) {
  const [f, setF] = useState({ ...VUOTO, ...val, logo: val.logo || '', link: val.link || '' });
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const set = k => e => setF(x => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const anteprima = file ? URL.createObjectURL(file) : mediaUrl(f.logo);

  const salva = async e => {
    e.preventDefault();
    if (!f.nome.trim()) return setErr('Il nome è obbligatorio.');
    if (f.link && !/^https?:\/\//.test(f.link.trim())) return setErr('Il link deve iniziare con https://');
    setBusy(true); setErr('');
    let logo = f.logo || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setBusy(false); return setErr('Il logo deve pesare meno di 5 MB.'); }
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const path = 'loghi/' + slug(f.nome) + '-' + Date.now().toString(36) + '.' + ext;
      const { error } = await db.storage.from('media').upload(path, file, { contentType: file.type, upsert: false });
      if (error) { setBusy(false); return setErr('Caricamento del logo non riuscito: ' + error.message); }
      logo = path;
    }
    const row = { nome: f.nome.trim(), livello: f.livello, logo, link: f.link.trim() || null, ordine: Number(f.ordine) || 0, pubblicato: f.pubblicato };
    const { error } = val.id ? await db.from('partner').update(row).eq('id', val.id) : await db.from('partner').insert(row);
    setBusy(false);
    if (error) return setErr(error.message);
    // replaced logo: remove the old file from storage
    if (file && val.logo && !/^https?:/.test(val.logo)) await db.storage.from('media').remove([val.logo]);
    toast(val.id ? 'Partner aggiornato.' : 'Partner aggiunto.'); onSaved();
  };
  const elimina = async () => {
    if (!confirm('Eliminare definitivamente “' + val.nome + '” e il suo logo?')) return;
    const { error } = await db.from('partner').delete().eq('id', val.id);
    if (error) return toast(error.message, 'error');
    if (val.logo && !/^https?:/.test(val.logo)) await db.storage.from('media').remove([val.logo]);
    toast('Partner eliminato.'); onSaved();
  };

  return (
    <Modal title={val.id ? 'Modifica partner' : 'Nuovo partner'} onClose={onClose} footer={<>
      {val.id && <button className="btn danger left" onClick={elimina}>Elimina</button>}
      <button className="btn" onClick={onClose}>Annulla</button>
      <button className="btn primary" onClick={salva} disabled={busy}>{busy ? 'Salvo…' : 'Salva'}</button>
    </>}>
      <form className="form" onSubmit={salva}>
        <Field label="Nome *"><input value={f.nome} onChange={set('nome')} /></Field>
        <Field label="Livello"><select value={f.livello} onChange={set('livello')}>{LIVELLI.map(l => <option key={l}>{l}</option>)}</select></Field>
        <Field label="Logo *" full hint="PNG trasparente, SVG o JPG, massimo 5 MB. Senza logo il partner non compare sul sito.">
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            {anteprima ? <img src={anteprima} alt="" style={{ height: 70, maxWidth: 200, objectFit: 'contain', border: '1px solid var(--line)', borderRadius: 6, padding: 6, background: '#fff' }} /> : null}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => setFile(e.target.files[0] || null)} />
          </div>
        </Field>
        <Field label="Link al sito del partner" full hint="Cliccando il logo sul sito si apre questo indirizzo in una nuova scheda."><input type="url" value={f.link} onChange={set('link')} placeholder="https://" /></Field>
        <Field label="Ordine" hint="Posizione nel livello: numeri più bassi prima."><input type="number" value={f.ordine} onChange={set('ordine')} /></Field>
        <div className="field" style={{ justifyContent: 'center' }}><label className="check"><input type="checkbox" checked={f.pubblicato} onChange={set('pubblicato')} /> Visibile sul sito</label></div>
        {err && <div className="err full" role="alert">{err}</div>}
      </form>
    </Modal>
  );
}
