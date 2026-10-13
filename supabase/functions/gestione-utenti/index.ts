// Gestione utenti del pannello (solo admin): crea, cambia ruolo, reimposta password, elimina.
// Usa la chiave segreta del progetto, che resta sul server e non arriva mai al browser.
import { createClient } from 'npm:@supabase/supabase-js@2';

const RUOLI = ['admin'];
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Metodo non consentito' }, 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, secretKey(), { auth: { persistSession: false, autoRefreshToken: false } });

  // chi sta chiamando? deve essere un admin
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ error: 'Accesso richiesto' }, 401);
  const { data: me } = await admin.from('profili').select('ruolo').eq('id', user.id).single();
  if (me?.ruolo !== 'admin') return json({ error: 'Solo un admin può gestire gli utenti' }, 403);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch (_) { return json({ error: 'Richiesta non valida' }, 400); }
  const azione = String(body.azione ?? '');
  const id = typeof body.id === 'string' ? body.id : '';
  const ruolo = body.ruolo === null || body.ruolo === '' ? null : String(body.ruolo ?? '');
  if (ruolo !== null && !RUOLI.includes(ruolo)) return json({ error: 'Ruolo non valido' }, 400);

  const adminCount = async () => (await admin.from('profili').select('id', { count: 'exact', head: true }).eq('ruolo', 'admin')).count ?? 0;

  if (azione === 'crea') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const nome = String(body.nome ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: 'Email non valida' }, 400);
    if (password.length < 10) return json({ error: 'La password deve avere almeno 10 caratteri' }, 400);
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nome } });
    if (error) return json({ error: error.message.includes('already') ? 'Esiste già un utente con questa email' : error.message }, 400);
    const { error: e2 } = await admin.from('profili').upsert({ id: data.user.id, email, nome: nome || null, ruolo });
    if (e2) return json({ error: e2.message }, 500);
    return json({ ok: true, id: data.user.id });
  }

  if (!id) return json({ error: 'Utente mancante' }, 400);

  if (azione === 'ruolo') {
    if (id === user.id && ruolo !== 'admin' && (await adminCount()) <= 1) return json({ error: 'Sei l’unico admin: nomina prima un altro admin' }, 400);
    const { error } = await admin.from('profili').update({ ruolo }).eq('id', id);
    return error ? json({ error: error.message }, 500) : json({ ok: true });
  }

  if (azione === 'password') {
    const password = String(body.password ?? '');
    if (password.length < 10) return json({ error: 'La password deve avere almeno 10 caratteri' }, 400);
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }

  if (azione === 'elimina') {
    if (id === user.id) return json({ error: 'Non puoi eliminare il tuo account' }, 400);
    const { error } = await admin.auth.admin.deleteUser(id);
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }

  return json({ error: 'Azione sconosciuta' }, 400);
});
