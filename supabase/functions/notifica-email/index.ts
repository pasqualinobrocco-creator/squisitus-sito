// Email automatiche via Resend.
// - Chiamata dal database (trigger "notifica_email") a ogni nuova richiesta, accredito o iscrizione:
//   avvisa il team e manda la conferma a chi ha compilato il modulo.
// - Chiamata dal pannello con { test: true } da un admin: invia un'email di prova.
// Segreto richiesto: RESEND_API_KEY (Supabase → Edge Functions → Secrets). Mittente e destinatari
// si impostano nel pannello (tabella "impostazioni").
//
// verify_jwt è disattivato perché il database chiama senza login: la funzione agisce solo su righe
// create negli ultimi 15 minuti e non ancora notificate, quindi non può essere usata per spam.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

function secretKey() {
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (keys) { try { const k = JSON.parse(keys).default; if (k) return k; } catch (_) { /* fall back */ } }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
}

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const sn = (b: unknown) => (b ? 'sì' : 'no');

// Branded HTML layout shared by every email.
function layout(titolo: string, intro: string, righe: [string, unknown][] = [], cta?: [string, string]) {
  const tab = righe.filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) =>
    `<tr><td style="padding:8px 12px 8px 0;color:#6E665E;font-size:13px;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:8px 0;font-size:15px;white-space:pre-wrap">${esc(v)}</td></tr>`).join('');
  return `<!doctype html><html lang="it"><body style="margin:0;background:#F4F1EC;font-family:Arial,Helvetica,sans-serif;color:#3C3C3B">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EC;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden">
<tr><td style="background:#A5143B;color:#fff;padding:22px 28px;font-size:20px;font-weight:bold;letter-spacing:.12em;text-transform:uppercase">Squisitus</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-size:22px;color:#3C3C3B">${esc(titolo)}</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6">${intro}</p>
${tab ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #E3DFDA;margin-bottom:18px">${tab}</table>` : ''}
${cta ? `<a href="${esc(cta[1])}" style="display:inline-block;background:#A5143B;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;font-size:14px">${esc(cta[0])}</a>` : ''}
</td></tr>
<tr><td style="padding:16px 28px;background:#FAF8F5;color:#6E665E;font-size:12px">Squisitus Roma 2027 · 5 • 6 novembre · La Nuvola – Roma Convention Center</td></tr>
</table></td></tr></table></body></html>`;
}

type Email = { to: string[]; subject: string; html: string; reply_to?: string | string[] };

async function invia(cfg: Record<string, any>, e: Email) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + Deno.env.get('RESEND_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `${cfg.mittente_nome || 'Squisitus'} <${cfg.mittente_email}>`, ...e }),
  });
  if (!r.ok) throw new Error('Resend ' + r.status + ': ' + (await r.text()));
}

const lista = (s: string | null) => (s || '').split(/[,;\s]+/).map(x => x.trim()).filter(x => x.includes('@'));

// Which emails to send for a new row of each table.
function emailPer(tabella: string, r: Record<string, any>, cfg: Record<string, any>): Email[] {
  // the panel address is not public: it is stored in impostazioni.pannello_url
  const PANNELLO = cfg.pannello_url || Deno.env.get('PANNELLO_URL') || 'https://www.squisitus.it/';
  const team = lista(cfg.notifiche_a);
  const out: Email[] = [];
  const conferma = cfg.conferma_mittente && r.email;
  // replies to confirmations: the dedicated address if set, otherwise the team recipients
  const rispondi = cfg.rispondi_a ? lista(cfg.rispondi_a) : team.length ? team : undefined;

  if (tabella === 'richieste') {
    const espo = r.tipo === 'espositore';
    const dati: [string, unknown][] = [['Tipo', r.tipo], ['Azienda', r.azienda], ['Referente', r.referente], ['Email', r.email], ['Telefono', r.telefono],
      ...(espo ? [['Tappe', (r.tappe || []).join(' + ')], ['Categoria', r.categoria], ['Stand a Roma', r.stand]] as [string, unknown][] : [['Livello', r.livello]] as [string, unknown][]),
      ['Messaggio', r.messaggio], ['Newsletter', sn(r.newsletter)]];
    if (cfg.notifica_richieste && team.length) out.push({ to: team, reply_to: r.email,
      subject: `Nuova richiesta ${r.tipo}: ${r.azienda}`,
      html: layout(`Nuova richiesta ${r.tipo}`, `È arrivata una richiesta dal modulo “Sali a bordo”. Rispondi a questa email per scrivere direttamente a ${esc(r.referente)}.`, dati, ['Apri nel pannello', PANNELLO + '#/richieste']) });
    if (conferma) out.push({ to: [r.email], reply_to: rispondi,
      subject: espo ? 'Abbiamo ricevuto la tua richiesta espositore · Squisitus' : 'Abbiamo ricevuto la tua richiesta di sponsorship · Squisitus',
      html: layout(`Grazie, ${r.referente}`, `Abbiamo ricevuto la richiesta di <b>${esc(r.azienda)}</b> per Squisitus Roma 2027. Il nostro team la valuterà e ti ricontatterà al più presto.`, dati.filter(([k]) => k !== 'Newsletter')) });
  }

  if (tabella === 'accrediti_press') {
    const dati: [string, unknown][] = [['Nome', r.nome], ['Testata', r.testata], ['Ruolo', r.ruolo], ['Email', r.email]];
    if (cfg.notifica_accrediti && team.length) out.push({ to: team, reply_to: r.email,
      subject: `Richiesta accredito press: ${r.nome} (${r.testata})`,
      html: layout('Nuova richiesta di accredito', 'Un giornalista ha chiesto l’accredito stampa per Squisitus Roma 2027.', dati, ['Valuta nel pannello', PANNELLO + '#/accrediti']) });
    if (conferma) out.push({ to: [r.email], reply_to: rispondi,
      subject: 'Richiesta di accredito ricevuta · Squisitus',
      html: layout(`Grazie, ${r.nome}`, 'Abbiamo ricevuto la tua richiesta di accredito stampa per Squisitus Roma 2027 (5 • 6 novembre 2027, La Nuvola – Roma Convention Center). Dopo la verifica ti confermeremo l’accredito via email.', dati) });
  }

  if (tabella === 'newsletter') {
    if (cfg.notifica_newsletter && team.length) out.push({ to: team, subject: `Nuovo iscritto alla newsletter: ${r.email}`,
      html: layout('Nuovo iscritto alla newsletter', `${esc(r.email)} si è iscritto alla newsletter.`, [['Avviso ticketing', sn(r.ticketing)]], ['Apri nel pannello', PANNELLO + '#/newsletter']) });
    if (conferma) out.push({ to: [r.email], reply_to: rispondi, subject: 'Iscrizione confermata · Squisitus',
      html: layout('Benvenuto nella newsletter di Squisitus', 'Grazie per l’iscrizione: ti scriveremo con le novità su Squisitus Roma 2027' + (r.ticketing ? ' e ti avviseremo in anteprima all’apertura del ticketing.' : '.')) });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Metodo non consentito' }, 405);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, secretKey(), { auth: { persistSession: false, autoRefreshToken: false } });

  let body: Record<string, any>;
  try { body = await req.json(); } catch (_) { return json({ error: 'Richiesta non valida' }, 400); }

  const { data: cfg } = await db.from('impostazioni').select('*').eq('id', 1).single();
  const pronta = !!Deno.env.get('RESEND_API_KEY') && !!cfg?.mittente_email;

  // email di prova dal pannello (solo admin)
  if (body.test) {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: { user } } = await db.auth.getUser(token);
    const { data: me } = user ? await db.from('profili').select('ruolo').eq('id', user.id).single() : { data: null };
    if (me?.ruolo !== 'admin') return json({ error: 'Solo un admin può inviare email di prova' }, 403);
    if (!Deno.env.get('RESEND_API_KEY')) return json({ error: 'Manca il segreto RESEND_API_KEY nelle Edge Functions di Supabase' }, 400);
    if (!cfg?.mittente_email) return json({ error: 'Imposta prima l’email del mittente e salva' }, 400);
    try {
      await invia(cfg, { to: [user!.email!], reply_to: cfg.rispondi_a ? lista(cfg.rispondi_a) : undefined, subject: 'Email di prova · Squisitus',
        html: layout('Funziona!', 'Questa è un’email di prova inviata dal pannello di gestione di Squisitus tramite Resend.',
          [['Mittente', cfg.mittente_email], ['Notifiche al team', cfg.notifiche_a]]) });
      return json({ ok: true, a: user!.email });
    } catch (e) { return json({ error: String((e as Error).message) }, 502); }
  }

  const tabella = String(body.tabella ?? '');
  if (!['richieste', 'accrediti_press', 'newsletter'].includes(tabella) || !body.id) return json({ error: 'Richiesta non valida' }, 400);
  if (!pronta) return json({ ok: true, saltato: 'Resend non ancora configurato' });

  // "prenota" la riga: solo se recente e non ancora notificata (evita doppi invii e abusi)
  const recente = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: riga } = await db.from(tabella).update({ notificato_at: new Date().toISOString() })
    .eq('id', body.id).is('notificato_at', null).gte('created_at', recente).select('*').maybeSingle();
  if (!riga) return json({ ok: true, saltato: 'già notificata o non recente' });

  const emails = emailPer(tabella, riga, cfg);
  const errori: string[] = [];
  for (const e of emails) { try { await invia(cfg, e); } catch (x) { errori.push((x as Error).message); } }
  if (errori.length) {
    console.error('notifica-email', tabella, body.id, errori);
    if (errori.length === emails.length) await db.from(tabella).update({ notificato_at: null }).eq('id', body.id);
    return json({ ok: false, inviate: emails.length - errori.length, errori }, 502);
  }
  return json({ ok: true, inviate: emails.length });
});
