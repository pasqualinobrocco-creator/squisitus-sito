// Converts a Claude Design ".dc.html" file into a plain React component (src/Site.jsx),
// a global stylesheet (src/styles.css) and the <head> fragment used by index.html.
//
//   node scripts/convert-dc.mjs "../Squisitus Sito v3.dc.html"
//
// The dc template language maps onto JSX like this:
//   {{ path }}            -> v.path (or the loop variable inside <sc-for>)
//   <sc-if value>         -> {cond ? <>…</> : null}
//   <sc-for list as>      -> {list.map((as, $index) => …)}
//   style-hover="…"       -> generated class with a :hover rule in styles.css
//   <helmet>              -> <title>/<link> into index.html, <style> into styles.css
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'htmlparser2';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcPath = process.argv[2];
if (!srcPath) { console.error('usage: node scripts/convert-dc.mjs <file.dc.html>'); process.exit(1); }
const src = readFileSync(srcPath, 'utf8');

const scriptMatch = src.match(/<script type="text\/x-dc" data-dc-script>([\s\S]*?)<\/script>/);
if (!scriptMatch) throw new Error('no <script data-dc-script> found');
const logic = scriptMatch[1];

const open = /<x-dc(?:\s[^>]*)?>/.exec(src);
const tplSrc = src.slice(open.index + open[0].length, src.lastIndexOf('</x-dc>'));
const doc = parseDocument(tplSrc, { lowerCaseAttributeNames: false, lowerCaseTags: true, recognizeSelfClosing: true });

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const ATTR = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', novalidate: 'noValidate', referrerpolicy: 'referrerPolicy', allowfullscreen: 'allowFullScreen', autocomplete: 'autoComplete', charset: 'charSet', readonly: 'readOnly', maxlength: 'maxLength', viewbox: 'viewBox' };
const BOOL = new Set(['noValidate', 'allowFullScreen', 'readOnly', 'disabled', 'required', 'multiple']);
const camel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const q = s => JSON.stringify(s);

const hover = new Map();
const hoverClass = decls => {
  if (!hover.has(decls)) hover.set(decls, 'sqh-' + hover.size);
  return hover.get(decls);
};

// {{ expr }} -> JS expression. Supports the subset the runtime does: literals, !, paths.
function expr(raw, scope) {
  const e = raw.trim();
  if (e[0] === '!') return '!(' + expr(e.slice(1), scope) + ')';
  if (/^(true|false|null|undefined|-?\d+(\.\d+)?)$/.test(e)) return e;
  if (/^(['"]).*\1$/.test(e)) return q(e.slice(1, -1));
  if (/[=<>&|?:()+*\/]/.test(e)) throw new Error('unsupported expression: ' + e);
  const [head, ...rest] = e.split('.');
  const base = scope.includes(head) ? head : '$v.' + head;
  return base + rest.map(p => '?.' + p).join('');
}
const BIND = /\{\{([\s\S]+?)\}\}/g;
const whole = s => s.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
// attribute string with interpolations -> template literal
function interp(raw, scope) {
  const parts = raw.split(BIND);
  return '`' + parts.map((p, i) => i & 1 ? '${' + expr(p, scope) + ' ?? ""}' : p.replace(/[`\\$]/g, '\\$&')).join('') + '`';
}

function styleObj(css, scope) {
  // later declarations win, as in the dc runtime (e.g. "height:100vh;height:100svh")
  const out = new Map();
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    const key = prop.startsWith('--') ? q(prop) : camel(prop);
    out.delete(key);
    out.set(key, val.includes('{{') ? interp(val, scope) : q(val));
  }
  return '{{ ' + [...out].map(([k, val]) => k + ': ' + val).join(', ') + ' }}';
}

function attrs(el, scope) {
  const out = [];
  const classes = [];
  for (const [name, value] of Object.entries(el.attribs)) {
    if (name.startsWith('hint-')) continue;
    if (name === 'style-hover') { classes.push(hoverClass(value)); continue; }
    if (name.startsWith('style-')) throw new Error('unsupported pseudo attr ' + name);
    let key = ATTR[name.toLowerCase()] || name;
    if (!key.startsWith('aria-') && !key.startsWith('data-') && key.includes('-')) key = camel(key);
    if (key === 'style') { out.push('style=' + styleObj(value, scope)); continue; }
    if (key === 'className') { classes.push(value); continue; }
    const w = whole(value);
    if (w) {
      let e = expr(w[1], scope);
      if (key === 'value') e = '(' + e + ') ?? ""';
      if (key === 'checked') e = '!!(' + e + ')';
      out.push(key + '={' + e + '}');
    } else if (value.includes('{{')) out.push(key + '={' + interp(value, scope) + '}');
    else if (BOOL.has(key) && value === '') out.push(key);
    else out.push(key + '=' + q(value));
  }
  if (classes.length) out.unshift('className=' + q(classes.join(' ')));
  return out.length ? ' ' + out.join(' ') : '';
}

function text(t, scope) {
  if (!t.includes('{{')) {
    if (!t.trim()) return t.includes(' ') ? '{" "}' : '';
    return '{' + q(t.replace(/\s+/g, ' ')) + '}';
  }
  return t.split(BIND).map((p, i) => {
    if (i & 1) return '{' + expr(p, scope) + '}';
    if (!p) return '';
    if (!p.trim()) return p.includes(' ') ? '{" "}' : '';
    return '{' + q(p.replace(/\s+/g, ' ')) + '}';
  }).join('');
}

const helmet = { head: [], css: [] };
let loopDepth = 0;

function kids(node, scope, ind) {
  return node.children.map(c => walk(c, scope, ind)).filter(Boolean).join('\n');
}
function walk(node, scope, ind) {
  const pad = '  '.repeat(ind);
  if (node.type === 'text') { const t = text(node.data, scope); return t ? pad + t : ''; }
  if (node.type !== 'tag' && node.type !== 'script' && node.type !== 'style') return '';
  const tag = node.name;
  if (tag === 'helmet') {
    for (const c of node.children) {
      if (c.type === 'style') helmet.css.push(c.children.map(x => x.data).join(''));
      else if (c.type === 'tag' && c.name === 'title') helmet.head.push('<title>' + c.children.map(x => x.data).join('') + '</title>');
      else if (c.type === 'tag') helmet.head.push('<' + c.name + Object.entries(c.attribs).map(([k, val]) => ' ' + k + '="' + val + '"').join('') + '>');
    }
    return '';
  }
  if (tag === 'sc-if') {
    const cond = expr(whole(node.attribs.value)[1], scope);
    return pad + '{' + cond + ' ? (<>\n' + kids(node, scope, ind + 1) + '\n' + pad + '</>) : null}';
  }
  if (tag === 'sc-for') {
    const as = node.attribs.as || 'item';
    const list = expr(whole(node.attribs.list)[1], scope);
    loopDepth++;
    const body = kids(node, [...scope, as, '$index'], ind + 2);
    loopDepth--;
    return pad + '{(' + list + ' ?? []).map((' + as + ', $index) => (\n' + pad + '  <React.Fragment key={$index}>\n' + body + '\n' + pad + '  </React.Fragment>\n' + pad + '))}';
  }
  if (tag.includes('-')) throw new Error('unsupported custom element <' + tag + '>');
  const a = attrs(node, scope);
  if (VOID.has(tag) || !node.children.length) return pad + '<' + tag + a + ' />';
  const inner = kids(node, scope, ind + 1);
  return pad + '<' + tag + a + '>\n' + inner + '\n' + pad + '</' + tag + '>';
}

const jsx = kids(doc, [], 3);

const out = `// GENERATED by scripts/convert-dc.mjs from "${srcPath.split('/').pop()}" — edit the design and re-run the converter.
/* eslint-disable */
import React from 'react';

${logic.trim().replace(/class Component extends DCLogic/, 'export default class Site extends React.Component')}

Site.prototype.render = function render() {
  const $v = this.renderVals();
  return (
    <>
${jsx}
    </>
  );
};
`;

mkdirSync(resolve(root, 'src'), { recursive: true });
writeFileSync(resolve(root, 'src/Site.jsx'), out);
writeFileSync(resolve(root, 'src/styles.css'),
  '/* GENERATED by scripts/convert-dc.mjs */\n' + helmet.css.join('\n').trim() + '\n\n/* style-hover */\n' +
  [...hover].map(([decls, cls]) => '.' + cls + ':hover{' + decls.split(';').map(d => d.trim()).filter(Boolean).map(d => /!\s*important$/.test(d) ? d : d + ' !important').join(';') + '}').join('\n') + '\n');
writeFileSync(resolve(root, 'src/head.html'), helmet.head.join('\n') + '\n');
console.log('wrote src/Site.jsx, src/styles.css, src/head.html (' + hover.size + ' hover classes)');
