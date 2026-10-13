import React, { useEffect, useState } from 'react';
import { db, fmtDataOra } from '../client.js';
import { Page, Table } from '../ui.jsx';

const conta = (t, f) => { let q = db.from(t).select('id', { count: 'exact', head: true }); if (f) q = f(q); return q.then(r => r.count || 0); };

export default function Dashboard({ profilo }) {
  const [n, setN] = useState(null);
  const [ultime, setUltime] = useState([]);
  useEffect(() => {
    Promise.all([
      conta('richieste', q => q.eq('stato', 'nuova')), conta('richieste'),
      conta('accrediti_press', q => q.eq('stato', 'nuova')), conta('newsletter'),
      conta('articoli'), conta('partner')
    ]).then(([rn, rt, an, nl, ar, pa]) => setN({ rn, rt, an, nl, ar, pa }));
    db.from('richieste').select('id,created_at,tipo,azienda,referente,stato').order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setUltime(data || []));
  }, []);
  const S = ({ href, v, t }) => <a className="card stat" href={href}><b>{v ?? '–'}</b><span>{t}</span></a>;
  return (
    <Page title={'Ciao' + (profilo.nome ? ' ' + profilo.nome.split(' ')[0] : '')} subtitle="Panoramica del sito Squisitus Roma 2027">
      <div className="grid-stats">
        <S href="#/richieste" v={n?.rn} t={'Richieste nuove (su ' + (n?.rt ?? '–') + ')'} />
        <S href="#/accrediti" v={n?.an} t="Accrediti press da valutare" />
        <S href="#/newsletter" v={n?.nl} t="Iscritti newsletter" />
        <S href="#/articoli" v={n?.ar} t="Articoli in rassegna" />
        <S href="#/partner" v={n?.pa} t="Partner" />
      </div>
      <h2 style={{ fontSize: 18, margin: '32px 0 12px' }}>Ultime richieste</h2>
      <Table rows={ultime} empty="Ancora nessuna richiesta dal sito." onRow={() => (location.hash = '#/richieste')} columns={[
        { key: 'created_at', label: 'Arrivata', render: r => fmtDataOra(r.created_at) },
        { key: 'tipo', label: 'Tipo', render: r => <span className="badge red">{r.tipo}</span> },
        { key: 'azienda', label: 'Azienda' }, { key: 'referente', label: 'Referente' },
        { key: 'stato', label: 'Stato', render: r => <span className={'badge' + (r.stato === 'nuova' ? ' warn' : r.stato === 'chiusa' ? ' green' : '')}>{r.stato}</span> }
      ]} />
    </Page>
  );
}
