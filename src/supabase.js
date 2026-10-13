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
