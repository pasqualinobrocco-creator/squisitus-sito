import React from 'react';
import { fmtDataOra } from '../client.js';
import { Si } from '../ui.jsx';
import Elenco from './Elenco.jsx';

const conf = {
  tabella: 'newsletter', titolo: 'Newsletter', sottotitolo: 'Iscritti dal sito. Esporta il CSV per importarli nel tuo strumento di invio.',
  cerca: ['email'],
  filtri: [{ key: 'ticketing', label: 'Avviso ticketing', options: [['true', 'sì'], ['false', 'no']] }],
  titoloDettaglio: r => r.email,
  colonne: [
    { key: 'created_at', label: 'Iscritto il', render: r => fmtDataOra(r.created_at) },
    { key: 'email', label: 'Email', render: r => <b>{r.email}</b> },
    { key: 'ticketing', label: 'Avviso ticketing', render: r => <Si v={r.ticketing} /> }
  ],
  dettaglio: [
    { key: 'created_at', label: 'Iscritto il', render: r => fmtDataOra(r.created_at) },
    { key: 'email', label: 'Email' }, { key: 'ticketing', label: 'Avviso ticketing', render: r => <Si v={r.ticketing} /> },
    { key: 'privacy', label: 'Consenso privacy', render: r => <Si v={r.privacy} /> }
  ],
  csv: [{ key: 'email', label: 'Email' }, { key: 'created_at', label: 'Iscritto il', csv: r => fmtDataOra(r.created_at) }, { key: 'ticketing', label: 'Avviso ticketing' }]
};

export default function Newsletter(p) { return <Elenco conf={conf} {...p} />; }
