import { createClient } from '@supabase/supabase-js';

// Set in .env.local (local) and in the GitHub repository variables (online build).
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key
  ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

if (!supabase) console.warn('[squisitus] Supabase non configurato: i moduli mostrano la conferma ma non salvano nulla.');

// Inserts one row; visitors can only insert (see supabase/schema.sql), so nothing is read back.
// Resolves to { ok: true } or { ok: false, duplicate, message }.
export async function saveForm(table, row) {
  if (!supabase) return { ok: true };
  try {
    const { error } = await supabase.from(table).insert(row);
    if (!error) return { ok: true };
    console.error('[squisitus] ' + table + ':', error);
    return { ok: false, duplicate: error.code === '23505', message: error.message };
  } catch (e) {
    console.error('[squisitus] ' + table + ':', e);
    return { ok: false, duplicate: false, message: String(e) };
  }
}

// Public URL for a file in the "media" bucket; full URLs are returned as they are.
export function mediaUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return url + '/storage/v1/object/public/media/' + path.replace(/^\/+/, '').replace(/^media\//, '');
}

// Download link for a press kit file (Supabase serves it as an attachment with its original name).
export function presskitUrl(path, nome) {
  return url + '/storage/v1/object/public/presskit/' + path.split('/').map(encodeURIComponent).join('/') + '?download=' + encodeURIComponent(nome || '');
}

// Press articles and partners managed from the Supabase dashboard (only published rows are readable).
// Resolves to null when Supabase is not configured or the request fails, so the site keeps its defaults.
export async function loadContent() {
  if (!supabase) return null;
  try {
    const [a, p, k] = await Promise.all([
      supabase.from('articoli').select('id,tipo,testata,titolo,link,data,occhiello,testo,in_evidenza,ordine')
        .order('data', { ascending: false, nullsFirst: false }).order('ordine'),
      supabase.from('partner').select('id,nome,livello,logo,link,ordine').order('ordine').order('nome'),
      supabase.from('presskit').select('id,cartella,titolo,descrizione,tipo,file,nome_file,dimensione,link,ordine').order('ordine').order('created_at')
    ]);
    if (a.error || p.error || k.error) throw a.error || p.error || k.error;
    return { articoli: a.data, partner: p.data, presskit: k.data };
  } catch (e) {
    console.error('[squisitus] contenuti:', e);
    return null;
  }
}
