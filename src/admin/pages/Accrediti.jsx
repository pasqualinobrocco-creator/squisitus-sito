import React from 'react';
import { fmtDataOra } from '../client.js';
import Elenco from './Elenco.jsx';

const STATI = ['nuova', 'approvato', 'rifiutato'];
const conf = {
  tabella: 'accrediti_press', titolo: 'Accrediti press', sottotitolo: 'Giornalisti che hanno chiesto l’accesso al press kit.',
  stati: STATI, cerca: ['nome', 'testata', 'email', 'ruolo'],
  filtri: [{ key: 'stato', label: 'Stato', options: STATI }],
  titoloDettaglio: r => r.nome + ' · ' + r.testata,
  colonne: [
    { key: 'created_at', label: 'Arrivata', render: r => fmtDataOra(r.created_at) },
    { key: 'nome', label: 'Nome', render: r => <b>{r.nome}</b> },
    { key: 'testata', label: 'Testata' }, { key: 'ruolo', label: 'Ruolo' }, { key: 'email', label: 'Email' },
    { key: 'stato', label: 'Stato', render: r => <span className={'badge' + (r.stato === 'nuova' ? ' warn' : r.stato === 'approvato' ? ' green' : ' red')}>{r.stato}</span> }
  ],
  dettaglio: [
    { key: 'created_at', label: 'Arrivata', render: r => fmtDataOra(r.created_at) },
    { key: 'nome', label: 'Nome' }, { key: 'testata', label: 'Testata' }, { key: 'ruolo', label: 'Ruolo' },
    { key: 'email', label: 'Email', render: r => <a href={'mailto:' + r.email}>{r.email}</a> }
  ],
  csv: [{ key: 'created_at', label: 'Data', csv: r => fmtDataOra(r.created_at) }, { key: 'nome', label: 'Nome' }, { key: 'testata', label: 'Testata' },
    { key: 'ruolo', label: 'Ruolo' }, { key: 'email', label: 'Email' }, { key: 'stato', label: 'Stato' }, { key: 'note', label: 'Note' }]
};

export default function Accrediti(p) { return <Elenco conf={conf} {...p} />; }
