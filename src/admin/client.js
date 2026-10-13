import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Panel client: keeps the login session in this browser (separate storage key from the public site).
export const db = createClient(url, key, { auth: { storageKey: 'sq-admin-auth', persistSession: true, autoRefreshToken: true } });

export const mediaUrl = path => !path ? '' : /^https?:\/\//.test(path) ? path : url + '/storage/v1/object/public/media/' + path.replace(/^\/+/, '');

// Calls the "gestione-utenti" Edge Function with the signed-in admin's session.
export async function gestioneUtenti(body) {
  const { data, error } = await db.functions.invoke('gestione-utenti', { body });
  if (error) {
    let msg = error.message;
    try { const b = await error.context?.json?.(); if (b?.error) msg = b.error; } catch (_) { /* keep generic */ }
    throw new Error(msg);
  }
  return data;
}

// Rows -> CSV file download (semicolon-separated so Excel in Italian opens it in columns).
export function scaricaCsv(nome, righe, colonne) {
  const esc = v => {
    const s = v == null ? '' : typeof v === 'boolean' ? (v ? 'sì' : 'no') : String(v);
    return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = [colonne.map(c => c.label).join(';'), ...righe.map(r => colonne.map(c => esc(c.csv ? c.csv(r) : r[c.key])).join(';'))].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = nome + '-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const fmtData = d => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
export const fmtDataOra = d => d ? new Date(d).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
