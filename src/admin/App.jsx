import React, { useEffect, useState } from 'react';
import { db } from './client.js';
import { Field, useToast } from './ui.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Articoli from './pages/Articoli.jsx';
import Partner from './pages/Partner.jsx';
import PressKit from './pages/PressKit.jsx';
import Richieste from './pages/Richieste.jsx';
import Newsletter from './pages/Newsletter.jsx';
import Accrediti from './pages/Accrediti.jsx';
import Utenti from './pages/Utenti.jsx';
import Account from './pages/Account.jsx';
import Email from './pages/Email.jsx';

// Sections of the panel and which roles can open them. To add a role (e.g. "redattore"),
// list it here and give it the matching policies in Supabase.
const SEZIONI = [
  { id: 'dashboard', label: 'Panoramica', C: Dashboard, ruoli: ['admin'] },
  { sep: 'Contenuti' },
  { id: 'articoli', label: 'Rassegna stampa', C: Articoli, ruoli: ['admin'] },
  { id: 'partner', label: 'Partner', C: Partner, ruoli: ['admin'] },
  { id: 'presskit', label: 'Press kit', C: PressKit, ruoli: ['admin'] },
  { sep: 'Richieste' },
  { id: 'richieste', label: 'Espositori e sponsor', C: Richieste, ruoli: ['admin'], badge: 'richieste' },
  { id: 'accrediti', label: 'Accrediti press', C: Accrediti, ruoli: ['admin'], badge: 'accrediti_press' },
  { id: 'newsletter', label: 'Newsletter', C: Newsletter, ruoli: ['admin'] },
  { sep: 'Impostazioni' },
  { id: 'utenti', label: 'Utenti', C: Utenti, ruoli: ['admin'] },
  { id: 'impostazioni', label: 'Impostazioni', C: Email, ruoli: ['admin'] },
  { id: 'account', label: 'Il mio account', C: Account, ruoli: ['admin'] },
];
export const RUOLI = { admin: 'Admin · può fare tutto' };

const LOGO = 'assets/squisitus-logo-h-white.svg';
const route = () => location.hash.replace(/^#\/?/, '').split('/')[0] || 'dashboard';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profilo, setProfilo] = useState(null);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    db.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = db.auth.onAuthStateChange((ev, s) => {
      if (ev === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfilo(null); return; }
    db.from('profili').select('id,email,nome,ruolo').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => setProfilo(data || { id: session.user.id, email: session.user.email, ruolo: null }));
  }, [session?.user?.id]);

  if (session === undefined || (session && !profilo)) return <div className="spin">Caricamento…</div>;
  if (recovery && session) return <NuovaPassword onDone={() => setRecovery(false)} />;
  if (!session) return <Login />;
  if (!profilo.ruolo) return <SenzaPermessi email={profilo.email} />;
  return <Shell profilo={profilo} setProfilo={setProfilo} />;
}

function Shell({ profilo, setProfilo }) {
  const [page, setPage] = useState(route());
  const [menu, setMenu] = useState(false);
  const [badges, setBadges] = useState({});
  const sezioni = SEZIONI.filter(s => s.sep || s.ruoli.includes(profilo.ruolo));

  useEffect(() => {
    const on = () => { setPage(route()); setMenu(false); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  // count of new requests next to the menu items
  const aggiornaBadge = async () => {
    const out = {};
    for (const t of ['richieste', 'accrediti_press']) {
      const { count } = await db.from(t).select('id', { count: 'exact', head: true }).eq('stato', 'nuova');
      out[t] = count || 0;
    }
    setBadges(out);
  };
  useEffect(() => { aggiornaBadge(); }, [page]);

  const sez = sezioni.find(s => s.id === page) || sezioni.find(s => s.id);
  const C = sez.C;
  return (
    <>
      <div className="mobilebar"><img src={LOGO} alt="Squisitus" /><button onClick={() => setMenu(m => !m)} aria-expanded={menu}>Menu</button></div>
      <div className="app">
        <nav className={'side' + (menu ? ' open' : '')} aria-label="Sezioni">
          <img src={LOGO} alt="Squisitus" />
          {sezioni.map((s, i) => s.sep
            ? <div key={'s' + i} className="sep">{s.sep}</div>
            : <a key={s.id} href={'#/' + s.id} aria-current={s.id === sez.id ? 'page' : undefined}>{s.label}{s.badge && badges[s.badge] ? <span className="badge">{badges[s.badge]}</span> : null}</a>)}
          <div className="me">
            <span>{profilo.nome || profilo.email}</span>
            <span style={{ opacity: .6 }}>{RUOLI[profilo.ruolo] || profilo.ruolo}</span>
            <a href="./" target="_blank" rel="noopener" style={{ padding: 0, opacity: .8, textTransform: 'none', letterSpacing: 0, fontFamily: 'Lato' }}>Apri il sito ↗</a>
            <button onClick={() => db.auth.signOut()}>Esci</button>
          </div>
        </nav>
        <main className="main"><C profilo={profilo} setProfilo={setProfilo} aggiornaBadge={aggiornaBadge} /></main>
      </div>
    </>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [reset, setReset] = useState(false);
  const toast = useToast();

  const entra = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    const { error } = await db.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setErr(error.message === 'Invalid login credentials' ? 'Email o password non corretti.' : error.message);
  };
  const recupera = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    const { error } = await db.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.href.split('#')[0] });
    setBusy(false);
    if (error) return setErr(error.message);
    toast('Se l’email è registrata, riceverai un link per reimpostare la password.');
    setReset(false);
  };

  return (
    <div className="login">
      <form className="card" onSubmit={reset ? recupera : entra}>
        <img src="assets/squisitus-logo-h-color.svg" alt="Squisitus" />
        <h1>{reset ? 'Recupera password' : 'Pannello di gestione'}</h1>
        <Field label="Email"><input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></Field>
        {!reset && <Field label="Password"><input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></Field>}
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn primary" disabled={busy}>{busy ? 'Attendere…' : reset ? 'Invia link' : 'Entra'}</button>
        <button type="button" className="linklike" onClick={() => { setReset(r => !r); setErr(''); }}>{reset ? '← Torna all’accesso' : 'Password dimenticata?'}</button>
      </form>
    </div>
  );
}

function NuovaPassword({ onDone }) {
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const toast = useToast();
  const salva = async e => {
    e.preventDefault();
    if (p.length < 10) return setErr('Almeno 10 caratteri.');
    const { error } = await db.auth.updateUser({ password: p });
    if (error) return setErr(error.message);
    toast('Password aggiornata.'); onDone();
  };
  return (
    <div className="login">
      <form className="card" onSubmit={salva}>
        <img src="assets/squisitus-logo-h-color.svg" alt="Squisitus" />
        <h1>Nuova password</h1>
        <Field label="Nuova password" hint="Almeno 10 caratteri"><input type="password" autoComplete="new-password" value={p} onChange={e => setP(e.target.value)} /></Field>
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn primary">Salva</button>
      </form>
    </div>
  );
}

function SenzaPermessi({ email }) {
  return (
    <div className="login">
      <div className="card">
        <img src="assets/squisitus-logo-h-color.svg" alt="Squisitus" />
        <h1>Accesso non abilitato</h1>
        <p style={{ margin: 0, textAlign: 'center' }}>L’account <b>{email}</b> esiste ma non ha ancora un ruolo. Chiedi a un admin di abilitarlo dalla sezione Utenti.</p>
        <button className="btn" onClick={() => db.auth.signOut()}>Esci</button>
      </div>
    </div>
  );
}
