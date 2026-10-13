import React, { useState } from 'react';
import { db } from '../client.js';
import { Field, Page, useToast } from '../ui.jsx';

export default function Account({ profilo, setProfilo }) {
  const [nome, setNome] = useState(profilo.nome || '');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const toast = useToast();
  const salvaNome = async e => {
    e.preventDefault();
    const { error } = await db.from('profili').update({ nome: nome.trim() || null }).eq('id', profilo.id);
    if (error) return toast(error.message, 'error');
    setProfilo({ ...profilo, nome: nome.trim() || null }); toast('Nome aggiornato.');
  };
  const salvaPw = async e => {
    e.preventDefault();
    if (p1.length < 10) return toast('La password deve avere almeno 10 caratteri.', 'error');
    if (p1 !== p2) return toast('Le due password non coincidono.', 'error');
    const { error } = await db.auth.updateUser({ password: p1 });
    if (error) return toast(error.message, 'error');
    setP1(''); setP2(''); toast('Password aggiornata.');
  };
  return (
    <Page title="Il mio account" subtitle={profilo.email}>
      <div style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        <form className="card form" onSubmit={salvaNome}>
          <Field label="Nome e cognome" full><input value={nome} onChange={e => setNome(e.target.value)} /></Field>
          <div className="full"><button className="btn primary">Salva nome</button></div>
        </form>
        <form className="card form" onSubmit={salvaPw}>
          <Field label="Nuova password" hint="Almeno 10 caratteri"><input type="password" autoComplete="new-password" value={p1} onChange={e => setP1(e.target.value)} /></Field>
          <Field label="Ripeti password"><input type="password" autoComplete="new-password" value={p2} onChange={e => setP2(e.target.value)} /></Field>
          <div className="full"><button className="btn primary">Cambia password</button></div>
        </form>
      </div>
    </Page>
  );
}
