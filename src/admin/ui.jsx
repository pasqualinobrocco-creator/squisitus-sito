import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// --- notifications -------------------------------------------------------
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [t, setT] = useState(null);
  const timer = useRef();
  const show = useCallback((msg, kind = 'ok') => {
    clearTimeout(timer.current);
    setT({ msg, kind });
    timer.current = setTimeout(() => setT(null), kind === 'error' ? 6000 : 3000);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {t && <div className={'toast' + (t.kind === 'error' ? ' error' : '')} role="status">{t.msg}</div>}
    </ToastCtx.Provider>
  );
}

// --- modal ---------------------------------------------------------------
export function Modal({ title, onClose, children, footer }) {
  const ref = useRef();
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.querySelector('input,select,textarea,button')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <header><h2>{title}</h2><button className="btn ghost small" onClick={onClose} aria-label="Chiudi">✕</button></header>
        <div className="body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

export function Field({ label, hint, full, children }) {
  return <label className={'field' + (full ? ' full' : '')}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

// --- table ---------------------------------------------------------------
// columns: [{ key, label, render?(row) }]
export function Table({ columns, rows, onRow, actions, empty = 'Nessun elemento.' }) {
  if (!rows.length) return <div className="table-wrap"><div className="empty">{empty}</div></div>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}{actions && <th aria-label="Azioni" />}</tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className={onRow ? 'click' : undefined} onClick={onRow ? () => onRow(r) : undefined}>
              {columns.map(c => <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>)}
              {actions && <td className="actions" onClick={e => e.stopPropagation()}>{actions(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Si = ({ v, si = 'Sì', no = 'No' }) => <span className={'badge' + (v ? ' green' : '')}>{v ? si : no}</span>;

// In-panel confirmation (window.confirm is blocked in some browsers and embedded views).
// Usage: const conferma = useConfirm(); if (!(await conferma('Eliminare…?'))) return;
const ConfirmCtx = createContext(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);
export function ConfirmProvider({ children }) {
  const [req, setReq] = useState(null);
  const ask = useCallback((msg, ok = 'Elimina') => new Promise(resolve => setReq({ msg, ok, resolve })), []);
  const close = v => { req?.resolve(v); setReq(null); };
  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      {req && (
        <div className="overlay" style={{ zIndex: 70 }} onMouseDown={e => e.target === e.currentTarget && close(false)}>
          <div className="modal" role="alertdialog" aria-modal="true" aria-label="Conferma" style={{ width: 'min(460px, 100%)' }}>
            <div className="body"><p style={{ margin: 0, fontSize: 16 }}>{req.msg}</p></div>
            <footer>
              <button className="btn" onClick={() => close(false)} autoFocus>Annulla</button>
              <button className="btn danger" onClick={() => close(true)}>{req.ok}</button>
            </footer>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

// Loads rows with a Supabase query builder; returns [rows, reload, loading].
export function useRows(query, deps = []) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await query();
    setLoading(false);
    if (error) { toast('Errore nel caricamento: ' + error.message, 'error'); return; }
    setRows(data || []);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  return [rows, load, loading];
}

export function Page({ title, subtitle, actions, children }) {
  return (
    <>
      <div className="top"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{actions && <div className="toolbar" style={{ margin: 0 }}>{actions}</div>}</div>
      {children}
    </>
  );
}
