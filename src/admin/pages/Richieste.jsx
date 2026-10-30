import React from 'react';
import { fmtDataOra } from '../client.js';
import { Si } from '../ui.jsx';
import Elenco from './Elenco.jsx';

const STATI = ['nuova', 'in lavorazione', 'chiusa'];
const Stato = ({ s }) => <span className={'badge' + (s === 'nuova' ? ' warn' : s === 'chiusa' ? ' green' : '')}>{s}</span>;

export const conf = {
  tabella: 'richieste', titolo: 'Espositori e sponsor', sottotitolo: 'Richieste arrivate dal modulo “Sali a bordo”.',
  stati: STATI, cerca: ['azienda', 'referente', 'email', 'telefono', 'categoria', 'messaggio'],
  filtri: [{ key: 'tipo', label: 'Tipo', options: ['espositore', 'sponsor'] }, { key: 'stato', label: 'Stato', options: STATI }],
  titoloDettaglio: r => r.azienda + ' · ' + r.tipo,
  colonne: [
    { key: 'created_at', label: 'Arrivata', render: r => fmtDataOra(r.created_at) },
    { key: 'tipo', label: 'Tipo', render: r => <span className="badge red">{r.tipo}</span> },
    { key: 'azienda', label: 'Azienda', render: r => <b>{r.azienda}</b> },
    { key: 'referente', label: 'Referente' },
    { key: 'email', label: 'Email' },
    { key: 'dett', label: 'Dettaglio', render: r => r.tipo === 'espositore' ? [(r.tappe || []).join(' + '), r.categoria, r.stand].filter(Boolean).join(' · ') : r.livello },
    { key: 'stato', label: 'Stato', render: r => <Stato s={r.stato} /> }
  ],
  dettaglio: [
    { key: 'created_at', label: 'Arrivata', render: r => fmtDataOra(r.created_at) },
    { key: 'tipo', label: 'Tipo' }, { key: 'azienda', label: 'Azienda' }, { key: 'referente', label: 'Referente' },
    { key: 'email', label: 'Email', render: r => <a href={'mailto:' + r.email}>{r.email}</a> },
    { key: 'telefono', label: 'Telefono', render: r => <a href={'tel:' + r.telefono.replace(/\s/g, '')}>{r.telefono}</a> },
    { key: 'categoria', label: 'Categoria' }, { key: 'tappe', label: 'Tappe', render: r => (r.tappe || []).join(' + ') }, { key: 'stand', label: 'Stand (Roma)' }, { key: 'livello', label: 'Livello sponsorship' },
    { key: 'messaggio', label: 'Messaggio' },
    { key: 'newsletter', label: 'Newsletter', render: r => <Si v={r.newsletter} /> }
  ],
  csv: [
    { key: 'created_at', label: 'Data', csv: r => fmtDataOra(r.created_at) }, { key: 'tipo', label: 'Tipo' }, { key: 'azienda', label: 'Azienda' },
    { key: 'referente', label: 'Referente' }, { key: 'email', label: 'Email' }, { key: 'telefono', label: 'Telefono' }, { key: 'categoria', label: 'Categoria' },
    { key: 'tappe', label: 'Tappe', csv: r => (r.tappe || []).join(' + ') }, { key: 'stand', label: 'Stand (Roma)' }, { key: 'livello', label: 'Livello' }, { key: 'messaggio', label: 'Messaggio' }, { key: 'newsletter', label: 'Newsletter' },
    { key: 'stato', label: 'Stato' }, { key: 'note', label: 'Note' }
  ]
};

export default function Richieste(p) { return <Elenco conf={conf} {...p} />; }
