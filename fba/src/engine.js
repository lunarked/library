/* Spreadsheet workbook engine. Each page sets window.SPEC, then this file renders it.
   SPEC describes tabs and sections; SPEC.derive computes every figure from the state. */
(function () {
'use strict';
var SPEC = window.SPEC;
var DAY = 86400000, CURRENCIES = ['$', '€', '£'];
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var TEXT_KINDS = ['text', 'date', 'sel'];

function isNum(v) { return typeof v === 'number' && isFinite(v); }
function n0(v) { return isNum(v) ? v : 0; }
function roundTo(v, d) {
  if (!isNum(v)) return v;
  var a = Math.abs(v);
  if (a === 0) return 0;
  if (a < 1e-6 || a >= 1e15) { var p = Math.pow(10, d); return Math.round(v * p) / p; }
  var s = Number(a.toPrecision(15));
  var r = Number(Math.round(Number(s + 'e' + d)) + 'e-' + d);
  return v < 0 ? -r : r;
}
function parseNum(s) {
  if (typeof s === 'number') return isFinite(s) ? s : null;
  s = String(s == null ? '' : s).trim().replace(/[\s$€£%×]/g, '');
  if (!s) return null;
  if (s.indexOf('.') < 0 && /^[-+]?\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');
  else s = s.replace(/,/g, '');
  var n = Number(s);
  return isFinite(n) ? n : null;
}
function pad2(n) { return String(n).padStart(2, '0'); }
function toUTC(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  var t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return isFinite(t) && new Date(t).getUTCDate() === +m[3] ? t : null;
}
function isoOf(t) { var d = new Date(t); return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate()); }
function fDate(t, weekday) {
  if (t == null) return '';
  var d = new Date(t);
  return (weekday ? WD[d.getUTCDay()] + ' ' : '') + d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
}
function todayUTC() { var n = new Date(); return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()); }
function sum(a) { return a.reduce(function (x, y) { return x + n0(y); }, 0); }
function mean(a) { var b = a.filter(isNum); return b.length ? sum(b) / b.length : null; }
function invNorm(p) {
  var a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  var b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  var c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  var d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  var q, r, lo = 0.02425;
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p < lo) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - lo) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

var nf0 = new Intl.NumberFormat('en-US', {maximumFractionDigits: 0});
var nf1 = new Intl.NumberFormat('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1});
var nf2 = new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
var state = null, D = null;
function cur() { return state && state.f.currency ? state.f.currency : '$'; }
function fInt(v) { return isNum(v) ? nf0.format(roundTo(v, 0)) : ''; }
function fDec1(v) { return isNum(v) ? nf1.format(roundTo(v, 1)) : ''; }
function fDec2(v) { return isNum(v) ? nf2.format(roundTo(v, 2)) : ''; }
function fMoney(v, d) {
  if (!isNum(v)) return '';
  var r = roundTo(v, d || 0);
  return (r < 0 ? '-' : '') + cur() + (d === 2 ? nf2 : nf0).format(Math.abs(r));
}
function fPct(v) { return isNum(v) ? nf1.format(roundTo(v * 100, 1)) + '%' : ''; }
function fCompact(v) {
  if (!isNum(v)) return '';
  var a = Math.abs(v);
  return a >= 1e6 ? nf1.format(roundTo(v / 1e6, 1)) + 'm' : a >= 10000 ? nf0.format(roundTo(v / 1000, 0)) + 'k' : a >= 1000 ? nf1.format(roundTo(v / 1000, 1)) + 'k' : nf0.format(roundTo(v, 0));
}
function signed(text, v) { return v > 0 ? '+' + text : text; }
function fmtBy(kind, v) {
  return kind === 'money' ? fMoney(v, 0) : kind === 'money2' ? fMoney(v, 2) : kind === 'pct' ? fPct(v) : kind === 'dec1' ? fDec1(v) : kind === 'dec2' ? fDec2(v) : fInt(v);
}
var U = {
  DAY: DAY, isNum: isNum, n0: n0, roundTo: roundTo, toUTC: toUTC, isoOf: isoOf, fDate: fDate, sum: sum, mean: mean, invNorm: invNorm,
  fInt: fInt, fDec1: fDec1, fDec2: fDec2, fMoney: fMoney, fPct: fPct, fCompact: fCompact, signed: signed, cur: cur,
  days: function (a, b) { var x = toUTC(a), y = toUTC(b); return x == null || y == null ? null : Math.round((y - x) / DAY); },
  ratio: function (a, b) { return isNum(a) && isNum(b) && b !== 0 ? a / b : null; },
  rows: function (keys, data) { return data.map(function (a) { var o = {}; keys.forEach(function (k, i) { o[k] = a[i] === undefined ? null : a[i]; }); return o; }); }
};
window.WBU = U;

/* ---------- schema ---------- */
var FORM = {}, TABLES = {};
SPEC.tabs.forEach(function (tab) {
  tab.sections.forEach(function (sec) {
    sec.tab = tab.id;
    if (sec.type === 'form') sec.fields.forEach(function (f) { FORM[f.k] = f; });
    if (sec.type === 'table') TABLES[sec.k] = sec;
  });
});
function isText(kind) { return TEXT_KINDS.indexOf(kind) >= 0; }
function defOf(f) { return f.def !== undefined ? f.def : isText(f.kind) ? (f.kind === 'sel' && f.options ? String(f.options[0]) : '') : null; }
function rowBlank(tbl) { var o = {}; tbl.cols.forEach(function (c) { if (c.k) o[c.k] = defOf(c); }); return o; }
function blank() {
  var S = {v: 1, updatedAt: 0, notice: false, biz: {brand: '', marketplace: ''}, f: {}, t: {}};
  Object.keys(FORM).forEach(function (k) { S.f[k] = defOf(FORM[k]); });
  Object.keys(TABLES).forEach(function (k) {
    var tb = TABLES[k];
    S.t[k] = tb.fixed ? tb.fixed.map(function () { return rowBlank(tb); }) : [];
  });
  return S;
}
function coerce(f, v) {
  if (f.kind === 'text') return (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, 2000);
  if (f.kind === 'date') return typeof v === 'string' && toUTC(v) != null ? v : '';
  if (f.kind === 'sel') { var o = (f.options || []).map(String); return o.indexOf(String(v)) >= 0 ? String(v) : defOf(f); }
  return typeof v === 'number' ? (isFinite(v) ? v : null) : typeof v === 'string' ? parseNum(v) : null;
}
function normalize(inp) {
  var S = blank();
  if (!inp || typeof inp !== 'object') return S;
  var obj = function (x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; };
  S.updatedAt = isNum(inp.updatedAt) ? inp.updatedAt : 0;
  S.notice = inp.notice === true;
  var B = obj(inp.biz);
  S.biz.brand = String(B.brand || '').slice(0, 300);
  S.biz.marketplace = String(B.marketplace || '').slice(0, 300);
  var F = obj(inp.f);
  Object.keys(FORM).forEach(function (k) { if (k in F) S.f[k] = coerce(FORM[k], F[k]); });
  var T = obj(inp.t);
  Object.keys(TABLES).forEach(function (k) {
    var tb = TABLES[k];
    if (!Array.isArray(T[k])) return;
    var rows = T[k].slice(0, 500).filter(function (r) { return r && typeof r === 'object'; }).map(function (r) {
      var o = rowBlank(tb);
      tb.cols.forEach(function (c) { if (c.k && c.k in r) o[c.k] = coerce(c, r[c.k]); });
      return o;
    });
    if (tb.fixed) rows = tb.fixed.map(function (x, i) { return rows[i] || rowBlank(tb); });
    S.t[k] = rows;
  });
  return S;
}
function sampleState() { var S = blank(); SPEC.sample(S, U); S.notice = true; return S; }

/* ---------- dom helpers ---------- */
var $ = function (id) { return document.getElementById(id); };
var PAGE = document.documentElement.cloneNode(true);
function h(tag, attrs) {
  var el = document.createElement(tag), k, v, i;
  if (attrs) for (k in attrs) {
    v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  var kids = Array.prototype.slice.call(arguments, 2);
  kids = kids.concat.apply([], kids);
  kids = kids.concat.apply([], kids);
  for (i = 0; i < kids.length; i++) {
    if (kids[i] == null || kids[i] === false) continue;
    el.appendChild(kids[i].nodeType ? kids[i] : document.createTextNode(String(kids[i])));
  }
  return el;
}
var TONES = {
  good: ['Healthy', 'On track', 'Covered', 'OK', 'Done', 'Pass', 'Go', 'Valid', 'Received', 'Matched', 'Profitable', 'Scale', 'Strong', 'Registered', 'Filed', 'Paid', 'Closed', 'Approved', 'Delivered', 'Good', 'Keep', 'Ready', 'Target'],
  warn: ['In progress', 'Order soon', 'Excess', 'Aged', 'Watch', 'Expiring soon', 'Pending', 'In transit', 'Open', 'Borderline', 'Fix', 'Thin margin', 'Due soon', 'Claim open', 'Review', 'At risk', 'Booked', 'Partial', 'Draft', 'Optimize', 'Test', 'Fair', 'Liquidate', 'Refurbish'],
  bad: ['Order now', 'Low stock', 'Over limit', 'Blocked', 'Fail', 'No go', 'Expired', 'Missing', 'Overdue', 'Late', 'Loss', 'Kill', 'Short', 'Over budget', 'Not registered', 'Critical', 'Rejected', 'Discrepancy', 'Unprofitable', 'Dispose', 'Weak', 'Cut', 'Poor']
};
if (SPEC.tones) Object.keys(SPEC.tones).forEach(function (t) { TONES[t] = TONES[t].concat(SPEC.tones[t]); });
function toneOf(v) { for (var t in TONES) if (TONES[t].indexOf(v) >= 0) return t; return 'idle'; }
function pill() { return h('span', {class: 'pill'}); }
function setPill(el, text, tone) { el.textContent = text || ''; el.dataset.tone = tone || toneOf(text); el.hidden = !text; }

/* ---------- saving ---------- */
var LS_KEY = 'fba-' + SPEC.app + ':v1', storageOK = false, saveTimer = 0, started = false;
function probeStorage() { try { localStorage.setItem(LS_KEY + ':p', '1'); localStorage.removeItem(LS_KEY + ':p'); return true; } catch (e) { return false; } }
function loadLocal() { try { var raw = localStorage.getItem(LS_KEY); return raw ? normalize(JSON.parse(raw)) : null; } catch (e) { return null; } }
function saveLocal() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); storageOK = true; } catch (e) { storageOK = false; } }
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { saveLocal(); saveNote(); }, 400); }
function flushSave() { clearTimeout(saveTimer); if (state) { saveLocal(); saveNote(); } }
function saveNote() {
  $('foot-save').textContent = storageOK
    ? 'Your entries are stored in this browser. Save local copy downloads this page with your data inside, so it opens in any browser. Back up puts the data alone in a file that Restore can load.'
    : 'This browser is blocking storage, so entries last only until you close the page. Use Save local copy or Back up to keep them.';
}
function readSeed() {
  var el = document.getElementById('seed');
  if (!el) return null;
  try { var s = normalize(JSON.parse(el.textContent)); s.notice = false; return s; } catch (e) { return null; }
}
function pickStart() {
  var seed = readSeed(), local = loadLocal();
  if (seed && (!local || seed.updatedAt > local.updatedAt)) return seed;
  return local || sampleState();
}

/* ---------- bound inputs ---------- */
var ups = {global: []}, charts = {};
function edit() { state.updatedAt = Date.now(); scheduleSave(); recalc(); }
function merge(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
function showNum(v, kind) {
  if (!isNum(v)) return '';
  if (kind === 'int') return nf0.format(v);
  if (kind === 'money') return Math.round(v) === v ? nf0.format(v) : nf2.format(roundTo(v, 2));
  return String(v);
}
function bind(obj, key, f, attrs, onChange) {
  var el, kind = f.kind;
  if (kind === 'text') {
    el = h('input', merge({type: 'text', class: 'in', autocomplete: 'off', placeholder: f.ph}, attrs));
    el.value = obj[key] || '';
    el.addEventListener('input', function () { obj[key] = el.value; edit(); });
  } else if (kind === 'date') {
    el = h('input', merge({type: 'date', class: 'in'}, attrs));
    el.value = obj[key] || '';
    var on = function () { var v = toUTC(el.value) != null ? el.value : ''; if (v !== obj[key]) { obj[key] = v; edit(); } };
    el.addEventListener('input', on); el.addEventListener('change', on);
  } else if (kind === 'sel') {
    el = h('select', merge({class: 'in'}, attrs));
    (f.options || []).forEach(function (o) { el.appendChild(h('option', {value: String(o), text: String(o)})); });
    el.value = obj[key] == null ? '' : String(obj[key]);
    var paint = function () { if (f.tone) el.dataset.tone = toneOf(obj[key]); };
    paint();
    el.addEventListener('change', function () { obj[key] = el.value; paint(); edit(); if (onChange) onChange(); });
  } else {
    var nk = kind === 'int' ? 'int' : kind === 'money' ? 'money' : 'num';
    el = h('input', merge({type: 'text', class: 'in num', autocomplete: 'off', inputmode: nk === 'int' ? 'numeric' : 'decimal', placeholder: f.ph}, attrs));
    el.value = showNum(obj[key], nk);
    el.addEventListener('input', function () { var v = parseNum(el.value); if (v != null && nk === 'int') v = Math.round(v); obj[key] = v; edit(); });
    el.addEventListener('blur', function () { el.value = showNum(obj[key], nk); });
  }
  return el;
}

/* ---------- sections ---------- */
function secWrap(sec, body) {
  return h('section', {class: 'sec'}, h('div', {class: 'sec-head'}, h('h2', {text: sec.title}), sec.help ? h('p', {class: 'help', text: sec.help}) : null), body);
}
function textOf(r) { return r && typeof r === 'object' ? r.text : r; }
function toneIn(r) { return r && typeof r === 'object' ? r.tone : ''; }
function renderForm(sec, tab) {
  var form = h('div', {class: 'form'}, sec.fields.map(function (f) {
    var input = bind(state.f, f.k, f, {id: 'f-' + f.k}, f.k === 'currency' ? function () { renderAll(); var el = $('f-currency'); if (el) el.focus(); } : null);
    return h('div', {class: 'field'}, h('label', {for: 'f-' + f.k, text: f.label + (f.kind === 'pct' ? ' %' : '')}), input, f.note ? h('small', {text: f.note}) : null);
  }));
  var stats = sec.stats ? h('div', {class: 'strip'}, sec.stats.map(function (st) {
    var val = h('strong');
    ups[tab].push(function () { var r = st.v(D, state); val.textContent = textOf(r) || 'No data yet'; val.dataset.tone = toneIn(r) || ''; });
    return h('div', {class: 'stat'}, h('span', {class: 'cap', text: st.label}), val);
  })) : null;
  return secWrap(sec, [form, stats]);
}
function renderTiles(sec, tab) {
  return h('div', {class: 'tiles'}, sec.items.map(function (it) {
    var val = h('strong'), sub = h('span', {class: 'sub'}), box = h('div', {class: 'tile'}, h('span', {class: 'cap', text: it.label}), val, sub);
    ups[tab].push(function () {
      var t = it.v(D, state);
      val.textContent = t || 'No data yet';
      box.dataset.tone = !t ? 'none' : it.bad && it.bad(D, state) ? 'bad' : '';
      sub.textContent = typeof it.sub === 'function' ? it.sub(D, state) : it.sub || '';
    });
    return box;
  }));
}
function renderNote(sec, tab) {
  var p = pill(), t = h('p');
  ups[tab].push(function () { var r = sec.v(D, state); setPill(p, r[0]); t.textContent = r[1] || ''; });
  return secWrap(sec, h('div', {class: 'state'}, p, t));
}
function renderTable(sec, tab) {
  var rows = state.t[sec.k], fixed = !!sec.fixed, prefix = 't-' + sec.k;
  var head = h('tr', null, sec.cols.map(function (c) {
    return h('th', {scope: 'col', class: isNumCol(c) ? 'num' : null, style: c.w ? 'min-width:' + c.w + 'px;width:' + c.w + 'px' : null, text: c.label});
  }), fixed ? null : h('th', {class: 'x'}, h('span', {class: 'vh', text: 'Remove'})));
  var body = h('tbody');
  rows.forEach(function (row, i) {
    var tr = h('tr');
    sec.cols.forEach(function (c, ci) {
      var td = h('td', {class: isNumCol(c) ? 'num' + (c.k ? '' : ' calc') : (c.k ? null : 'calc')});
      var id = prefix + '-' + i + '-' + (c.k || ci);
      if (c.fixedLabel) td.appendChild(h('span', {class: 'strong', text: sec.fixed[i]}));
      else if (c.k && c.auto && c.auto(i)) td.appendChild(h('span', {class: 'muted', text: 'Calculated'}));
      else if (c.k) td.appendChild(bind(row, c.k, c, {id: id, 'aria-label': c.label + ', row ' + (i + 1)}));
      else if (c.status) {
        var p = pill();
        ups[tab].push(function () { setPill(p, c.status(D, i, state)); });
        td.appendChild(p);
      } else {
        var el = h('span', {class: 'v'});
        ups[tab].push(function () {
          var r = c.v(D, i, state);
          el.textContent = textOf(r) == null ? '' : textOf(r);
          el.dataset.tone = toneIn(r) || (c.tone ? c.tone(D, i, state) : '') || '';
        });
        td.appendChild(el);
      }
      tr.appendChild(td);
    });
    if (!fixed) tr.appendChild(h('td', {class: 'x'}, h('button', {type: 'button', class: 'del', 'aria-label': 'Remove row ' + (i + 1), title: 'Remove row', onclick: function () { removeRow(tab, rows, i); }}, '×')));
    body.appendChild(tr);
  });
  if (!rows.length) body.appendChild(h('tr', null, h('td', {class: 'empty', colspan: sec.cols.length + 1, text: sec.empty || 'Nothing here yet. Add a row below.'})));
  var t = h('table', {class: 'grid', id: prefix}, h('caption', {class: 'vh', text: sec.title}), h('thead', null, head), body);
  if (sec.cols.some(function (c) { return c.foot; })) {
    var cells = sec.cols.map(function (c, ci) {
      var td = h('td', {class: isNumCol(c) ? 'num calc' : null});
      if (c.foot === 'sum') ups[tab].push(function () { var s = sum(state.t[sec.k].map(function (r) { return r[c.k]; })); td.textContent = c.kind === 'money' ? fMoney(s, 0) : fInt(s); });
      else if (typeof c.foot === 'function') ups[tab].push(function () { td.textContent = textOf(c.foot(D, state)) || ''; });
      else if (ci === 0) td.textContent = 'Total';
      return td;
    });
    t.appendChild(h('tfoot', null, h('tr', null, cells, fixed ? null : h('td'))));
  }
  var tools = fixed ? null : h('div', {class: 'toolbar'}, h('button', {type: 'button', class: 'btn small', onclick: function () {
    rows.push(rowBlank(sec)); structural(tab);
    var first = sec.cols.filter(function (c) { return c.k; })[0];
    var el = first && $(prefix + '-' + (rows.length - 1) + '-' + first.k);
    if (el) el.focus();
  }}, sec.add || 'Add a row'));
  return secWrap(sec, [h('div', {class: 'scroll'}, t), tools]);
}
function isNumCol(c) { return c.num != null ? c.num : c.k ? ['num', 'int', 'money', 'pct'].indexOf(c.kind) >= 0 : !c.status; }
function renderCharts(sec, tab) {
  var figs = sec.charts.map(function (ch, j) {
    var id = 'plot-' + tab + '-' + j + '-' + Math.random().toString(36).slice(2, 7);
    charts[tab].push(function () { var host = $(id); if (host) (ch.kind === 'bars' ? bars : line)(host, ch.data(D, state), ch); });
    return h('figure', {class: 'chart'}, h('figcaption', null, ch.title, h('span', {text: ch.sub || ''})), h('div', {class: 'plot' + (ch.kind === 'bars' ? ' bars' : ''), id: id}));
  });
  return secWrap(sec, h('div', {class: 'charts'}, figs));
}
function renderTab(tab) {
  ups[tab.id] = []; charts[tab.id] = [];
  var p = $('panel-' + tab.id);
  p.replaceChildren.apply(p, tab.sections.map(function (sec) {
    return ({form: renderForm, tiles: renderTiles, table: renderTable, note: renderNote, charts: renderCharts})[sec.type](sec, tab.id);
  }));
}
function structural(tab) { state.updatedAt = Date.now(); scheduleSave(); renderTab(SPEC.tabs.filter(function (t) { return t.id === tab; })[0]); recalc(); }
function removeRow(tab, rows, i) {
  var row = rows.splice(i, 1)[0];
  structural(tab);
  toast('Row removed.', 'Undo', function () { rows.splice(Math.min(i, rows.length), 0, row); structural(tab); });
}

/* ---------- charts ---------- */
var SVG = 'http://www.w3.org/2000/svg';
function s(tag, attrs, text) {
  var el = document.createElementNS(SVG, tag), k;
  for (k in attrs) if (attrs[k] != null) el.setAttribute(k, attrs[k]);
  if (text != null) el.textContent = text;
  return el;
}
function niceStep(raw) { var p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }
function line(host, d, ch) {
  var pts = (d.pts || []).filter(function (q) { return isNum(q.y); }), fmt = d.fmt || 'int';
  if (pts.length < 2) { host.replaceChildren(h('p', {class: 'chart-empty', text: ch.empty || 'Not enough data to draw this chart yet.'})); return; }
  var W = Math.max(280, Math.floor(host.clientWidth || 520)), H = 240, m = {l: 54, r: 60, t: 24, b: 30};
  var iw = W - m.l - m.r, ih = H - m.t - m.b, n = pts.length;
  var refs = (d.refs || []).filter(function (r) { return isNum(r.v); });
  var ys = pts.map(function (q) { return q.y; }).concat(refs.map(function (r) { return r.v; }));
  var mx = Math.max.apply(null, ys.concat([0])), mn = Math.min.apply(null, ys.concat([0]));
  if (mx === mn) mx = mn + 1;
  var step = niceStep((mx - mn) / 4), lo = Math.floor(mn / step + 1e-9) * step, hi = Math.ceil(mx / step - 1e-9) * step;
  var x = function (i) { return m.l + i * iw / (n - 1); };
  var y = function (v) { return m.t + ih - (v - lo) / (hi - lo) * ih; };
  var tick = function (v) { return fmt === 'pct' ? nf0.format(roundTo(v * 100, 0)) + '%' : fmt.indexOf('money') === 0 ? (v < 0 ? '-' : '') + cur() + fCompact(Math.abs(v)) : fCompact(v); };
  var full = function (v) { return fmtBy(fmt, v); };
  var svg = s('svg', {viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, tabindex: 0, role: 'img', 'aria-label': ch.title + '. Arrow keys step through the points.'});
  var v, yy;
  for (v = lo; v <= hi + 1e-9; v += step) {
    yy = Math.round(y(v)) + 0.5;
    svg.appendChild(s('line', {x1: m.l, x2: W - m.r, y1: yy, y2: yy, class: Math.abs(v) < 1e-9 ? 'ch-axis' : 'ch-grid'}));
    svg.appendChild(s('text', {x: m.l - 8, y: yy + 4, class: 'ch-tick', 'text-anchor': 'end'}, tick(v)));
  }
  var marks = n >= 5 ? [0, Math.floor((n - 1) / 2), n - 1] : [0, n - 1];
  marks.forEach(function (i, j) { svg.appendChild(s('text', {x: x(i), y: H - 9, class: 'ch-tick', 'text-anchor': j === 0 ? 'start' : j === marks.length - 1 ? 'end' : 'middle'}, pts[i].label)); });
  var used = [];
  refs.forEach(function (r) {
    yy = Math.round(y(r.v)) + 0.5;
    svg.appendChild(s('line', {x1: m.l, x2: W - m.r, y1: yy, y2: yy, class: 'ch-target'}));
    var ly = yy - 6;
    if (used.some(function (u) { return Math.abs(u - ly) < 13; })) ly = yy + 15;
    used.push(ly);
    svg.appendChild(s('text', {x: W - m.r - 4, y: ly, class: 'ch-target-label', 'text-anchor': 'end'}, r.label + ' ' + full(r.v)));
  });
  var path = function (from, to) { var o = ''; for (var i = from; i <= to; i++) o += (i === from ? 'M' : 'L') + x(i).toFixed(1) + ' ' + y(pts[i].y).toFixed(1) + ' '; return o; };
  if (d.area) svg.appendChild(s('path', {d: path(0, n - 1) + 'L' + x(n - 1).toFixed(1) + ' ' + y(Math.max(lo, 0)).toFixed(1) + ' L' + x(0).toFixed(1) + ' ' + y(Math.max(lo, 0)).toFixed(1) + ' Z', class: 'ch-area'}));
  var split = d.split;
  if (split > 0 && split < n) {
    var xd = (x(split - 1) + x(split)) / 2;
    svg.appendChild(s('line', {x1: xd, x2: xd, y1: m.t - 6, y2: m.t + ih, class: 'ch-divider'}));
    svg.appendChild(s('text', {x: xd - 6, y: m.t - 10, class: 'ch-phase', 'text-anchor': 'end'}, d.splitLabels ? d.splitLabels[0] : 'Actual'));
    svg.appendChild(s('text', {x: xd + 6, y: m.t - 10, class: 'ch-phase'}, d.splitLabels ? d.splitLabels[1] : 'Forecast'));
    svg.appendChild(s('path', {d: path(0, split - 1), class: 'ch-line'}));
    svg.appendChild(s('path', {d: path(split - 1, n - 1), class: 'ch-line dash'}));
  } else svg.appendChild(s('path', {d: path(0, n - 1), class: 'ch-line'}));
  var last = pts[n - 1];
  var cross = s('line', {y1: m.t, y2: m.t + ih, class: 'ch-cross', visibility: 'hidden'}), hov = s('circle', {r: 4.5, class: 'ch-dot', visibility: 'hidden'});
  svg.appendChild(cross);
  svg.appendChild(s('circle', {cx: x(n - 1), cy: y(last.y), r: 4.5, class: 'ch-dot'}));
  svg.appendChild(s('text', {x: x(n - 1) + 10, y: y(last.y) + 4, class: 'ch-end'}, tick(last.y)));
  svg.appendChild(hov);
  var tipVal = h('strong'), tipSub = h('span'), tip = h('div', {class: 'tip', hidden: true}, tipVal, tipSub), at = -1;
  var show = function (i) {
    var q = pts[i], px = x(i), py = y(q.y);
    cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('visibility', 'visible');
    hov.setAttribute('cx', px); hov.setAttribute('cy', py); hov.setAttribute('visibility', 'visible');
    tipVal.textContent = full(q.y) + (d.unit ? ' ' + d.unit : '');
    tipSub.textContent = q.label;
    tip.hidden = false;
    var tw = tip.offsetWidth, left = px + 12;
    if (left + tw > W - 4) left = px - 12 - tw;
    tip.style.left = Math.max(4, left) + 'px'; tip.style.top = Math.max(4, py - 48) + 'px';
    at = i;
  };
  var hide = function () { cross.setAttribute('visibility', 'hidden'); hov.setAttribute('visibility', 'hidden'); tip.hidden = true; at = -1; };
  svg.addEventListener('pointermove', function (e) { var px = e.clientX - svg.getBoundingClientRect().left; show(Math.max(0, Math.min(n - 1, Math.round((px - m.l) / (iw / (n - 1)))))); });
  svg.addEventListener('pointerleave', hide);
  svg.addEventListener('focus', function () { show(n - 1); });
  svg.addEventListener('blur', hide);
  svg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); show(Math.max(0, Math.min(n - 1, (at < 0 ? n - 1 : at) + (e.key === 'ArrowLeft' ? -1 : 1)))); }
    else if (e.key === 'Escape') hide();
  });
  host.replaceChildren(svg, tip);
}
function bars(host, d, ch) {
  var items = (d.items || []).filter(function (it) { return isNum(it.v) && it.v > 0; }), fmt = d.fmt || 'int';
  if (!items.length) { host.replaceChildren(h('p', {class: 'chart-empty', text: ch.empty || 'Nothing to chart yet.'})); return; }
  var total = isNum(d.total) && d.total > 0 ? d.total : sum(items.map(function (it) { return it.v; }));
  var W = Math.max(280, Math.floor(host.clientWidth || 520)), rowH = 32, lab = Math.min(190, Math.max(110, W * 0.26)), valW = 130;
  var H = items.length * rowH + 6, iw = Math.max(40, W - lab - valW);
  var mx = Math.max.apply(null, items.map(function (it) { return it.v; }));
  var svg = s('svg', {viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': ch.title + ': ' + items.map(function (it) { return it.label + ' ' + fmtBy(fmt, it.v); }).join(', ')});
  items.forEach(function (it, i) {
    var top = 3 + i * rowH, w = Math.max(2, it.v / mx * iw);
    var label = it.label.length > 26 ? it.label.slice(0, 25) + '…' : it.label;
    svg.appendChild(s('text', {x: lab - 12, y: top + rowH / 2 + 4, class: 'ch-bar-label', 'text-anchor': 'end'}, label));
    var r = w > 6 ? s('path', {d: 'M' + lab + ' ' + (top + 7) + 'h' + (w - 4) + 'a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h' + (-(w - 4)) + 'z', class: 'ch-bar'}) : s('rect', {x: lab, y: top + 7, width: w, height: 18, class: 'ch-bar'});
    r.appendChild(s('title', {}, it.label + ': ' + fmtBy(fmt, it.v)));
    svg.appendChild(r);
    var t = s('text', {x: lab + w + 8, y: top + rowH / 2 + 4, class: 'ch-val'}, fmtBy(fmt, it.v));
    if (d.share) t.appendChild(s('tspan', {dx: 6}, fPct(it.v / total)));
    svg.appendChild(t);
  });
  svg.appendChild(s('line', {x1: lab + 0.5, x2: lab + 0.5, y1: 0, y2: H, class: 'ch-axis'}));
  host.replaceChildren(svg);
}

/* ---------- header ---------- */
function buildHeader() {
  if (SPEC.download) {
    var bar = document.querySelector('.top .actions'), copyBtn = $('btn-copy');
    bar.insertBefore(h('a', {class: 'btn', href: SPEC.download.href, download: '', text: SPEC.download.label || 'Download Excel'}), copyBtn);
  }
  ['brand', 'marketplace'].forEach(function (k) {
    var el = $('b-' + k);
    el.addEventListener('input', function () { state.biz[k] = el.value; edit(); });
  });
  (SPEC.figs || []).forEach(function (fg) {
    var b = h('b');
    $('figs').appendChild(h('li', null, h('span', {text: fg.label}), b));
    ups.global.push(function () { var r = fg.v(D, state); b.textContent = textOf(r) || 'No data'; b.dataset.tone = toneIn(r) || ''; });
  });
  var hp = pill(), ht = h('span');
  $('count-date').replaceChildren(hp, ' ', ht);
  ups.global.push(function () {
    var r = SPEC.headline(D, state) || {}, num = $('count-num');
    num.hidden = r.num == null || r.num === '';
    num.textContent = r.num == null ? '' : r.num;
    $('count-unit').textContent = r.unit || '';
    setPill(hp, r.status || ''); ht.textContent = r.note || '';
  });
  ups.global.push(function () {
    SPEC.tabs.forEach(function (t) { $('badge-' + t.id).textContent = t.badge ? t.badge(D, state) || '' : ''; });
    $('notice').hidden = !state.notice;
  });
}

/* ---------- render cycle ---------- */
function currentTab() {
  var ids = SPEC.tabs.map(function (t) { return t.id; }), id = (location.hash || '').replace('#', '');
  if (ids.indexOf(id) >= 0) return id;
  try { id = localStorage.getItem(LS_KEY + ':tab'); } catch (e) { id = null; }
  return ids.indexOf(id) >= 0 ? id : ids[0];
}
function drawCharts() { var t = currentTab(); (charts[t] || []).forEach(function (fn) { fn(); }); }
function recalc() {
  D = SPEC.derive(state, todayUTC(), U);
  Object.keys(ups).forEach(function (k) { ups[k].forEach(function (fn) { fn(); }); });
  drawCharts();
}
function renderAll() {
  D = SPEC.derive(state, todayUTC(), U);
  $('b-brand').value = state.biz.brand; $('b-marketplace').value = state.biz.marketplace;
  SPEC.tabs.forEach(renderTab);
  recalc();
}
function route() {
  var id = currentTab();
  SPEC.tabs.forEach(function (t) {
    var on = t.id === id, tab = $('tab-' + t.id);
    tab.setAttribute('aria-selected', on ? 'true' : 'false'); tab.tabIndex = on ? 0 : -1;
    $('panel-' + t.id).hidden = !on;
  });
  try { localStorage.setItem(LS_KEY + ':tab', id); } catch (e) {}
  drawCharts();
}

/* ---------- toast, dialogs, files ---------- */
var toastTimer = 0;
function toast(msg, actLabel, act) {
  var t = $('toast'), b = $('toast-act');
  $('toast-text').textContent = msg;
  b.hidden = !actLabel;
  if (actLabel) { b.textContent = actLabel; b.onclick = function () { t.hidden = true; act(); }; }
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.hidden = true; }, actLabel ? 8000 : 3500);
}
function openDialog(title, body, actions) {
  var d = $('dlg'), bar = $('dlg-actions');
  $('dlg-title').textContent = title;
  $('dlg-body').replaceChildren.apply($('dlg-body'), body);
  bar.replaceChildren();
  actions.forEach(function (a) { bar.appendChild(h('button', {type: 'button', class: 'btn ' + (a.cls || ''), onclick: function () { if (!a.run || a.run() !== false) closeDialog(); }}, a.label)); });
  if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
}
function closeDialog() { var d = $('dlg'); if (typeof d.close === 'function') { if (d.open) d.close(); } else d.removeAttribute('open'); }
function replaceState(next, msg) {
  var prev = state;
  next.updatedAt = Date.now(); state = next;
  flushSave(); renderAll();
  toast(msg, 'Undo', function () { state = prev; state.updatedAt = Date.now(); flushSave(); renderAll(); });
}
function slug() { return String(state.biz.brand || '').toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/^-+|-+$/g, '') || 'workbook'; }
function download(name, text, type) {
  try {
    var url = URL.createObjectURL(new Blob([text], {type: type}));
    var a = h('a', {href: url, download: name});
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    return true;
  } catch (e) { return false; }
}
function backup() {
  flushSave();
  var text = JSON.stringify({app: SPEC.app, v: 1, savedAt: new Date().toISOString(), state: state}, null, 2);
  var name = SPEC.app + '-' + slug() + '-' + isoOf(todayUTC()) + '.json';
  if (download(name, text, 'application/json')) toast('Backup saved as ' + name + '.');
  else toast('This browser blocked the download.');
}
function saveCopy() {
  flushSave();
  var doc = PAGE.cloneNode(true);
  var old = doc.querySelector('#seed');
  if (old) old.remove();
  var seed = document.createElement('script');
  seed.id = 'seed'; seed.type = 'application/json';
  seed.textContent = JSON.stringify(state).replace(/</g, '\\u003c');
  var first = doc.querySelector('script');
  first.parentNode.insertBefore(seed, first);
  var name = SPEC.app + '-' + slug() + '-' + isoOf(todayUTC()) + '.html';
  if (download(name, '<!DOCTYPE html>\n' + doc.outerHTML, 'text/html')) toast('Local copy saved as ' + name + '. Open it in any browser, online or off.');
  else toast('This browser blocked the download. Use Back up instead.');
}
function restoreDialog() {
  var file = h('input', {type: 'file', id: 'restore-file', accept: '.json,application/json'});
  var ta = h('textarea', {class: 'in mono', rows: 6, id: 'restore-text', placeholder: 'Or paste backup text here'});
  var err = h('p', {class: 'err', role: 'alert', hidden: true});
  var fail = function (msg) { err.textContent = msg; err.hidden = false; return false; };
  file.addEventListener('change', function () {
    var f = file.files && file.files[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () { ta.value = String(rd.result || ''); err.hidden = true; };
    rd.onerror = function () { fail('Could not read that file. Open it and paste its text below.'); };
    rd.readAsText(f);
  });
  openDialog('Restore from a backup', [
    h('p', {class: 'help', text: 'Restoring replaces everything in every tab with what the backup holds.'}),
    h('label', {class: 'cap', for: 'restore-file', text: 'Backup file'}), file,
    h('label', {class: 'cap', for: 'restore-text', text: 'Backup text'}), ta, err
  ], [
    {label: 'Restore', cls: 'primary', run: function () {
      var text = ta.value.trim(), parsed;
      if (!text) return fail('Choose a backup file or paste backup text first.');
      try { parsed = JSON.parse(text); } catch (e) { return fail('That text is not a complete backup.'); }
      if (!parsed || parsed.app !== SPEC.app || !parsed.state) return fail('That file is not a backup of this workbook.');
      var next = normalize(parsed.state); next.notice = false;
      replaceState(next, 'Backup restored.');
    }},
    {label: 'Cancel', cls: 'quiet'}
  ]);
}
function blankDialog() {
  openDialog('Start with a blank workbook?', [h('p', {class: 'help', text: 'This clears every entry in every tab. Back up first if you want to keep what is here.'})], [
    {label: 'Clear all entries', cls: 'danger', run: function () { replaceState(blank(), 'Workbook cleared.'); }},
    {label: 'Load the sample', cls: 'quiet', run: function () { replaceState(sampleState(), 'Sample data loaded.'); }},
    {label: 'Cancel', cls: 'quiet'}
  ]);
}

/* ---------- start ---------- */
function buildShell() {
  $('wb-title').textContent = SPEC.title;
  $('count-cap').textContent = SPEC.headCap || 'Status';
  $('notice-text').textContent = SPEC.notice || 'Every tab is filled with sample data. Type over it, or start blank.';
  var nav = $('tabs'), main = document.querySelector('main');
  SPEC.tabs.forEach(function (t) {
    nav.appendChild(h('a', {class: 'tab', role: 'tab', id: 'tab-' + t.id, href: '#' + t.id, 'aria-controls': 'panel-' + t.id}, t.title, ' ', h('small', {id: 'badge-' + t.id})));
    main.appendChild(h('div', {class: 'panel', id: 'panel-' + t.id, role: 'tabpanel', 'aria-labelledby': 'tab-' + t.id, hidden: true}));
  });
  var foot = $('foot-notes');
  (SPEC.notes || []).forEach(function (n) { foot.appendChild(h('p', {text: n})); });
}
function start() {
  if (started) return;
  started = true;
  buildShell();
  storageOK = probeStorage();
  state = pickStart();
  buildHeader();
  $('btn-copy').addEventListener('click', saveCopy);
  $('btn-backup').addEventListener('click', backup);
  $('btn-restore').addEventListener('click', restoreDialog);
  $('btn-blank').addEventListener('click', blankDialog);
  $('notice-blank').addEventListener('click', blankDialog);
  $('notice-keep').addEventListener('click', function () { state.notice = false; edit(); });
  document.querySelector('.tabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var ids = SPEC.tabs.map(function (t) { return t.id; }), i = ids.indexOf(currentTab()) + (e.key === 'ArrowLeft' ? -1 : 1);
    var id = ids[(i + ids.length) % ids.length];
    e.preventDefault(); location.hash = id; $('tab-' + id).focus();
  });
  window.addEventListener('hashchange', route);
  window.addEventListener('pagehide', flushSave);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushSave(); });
  var lastW = 0, roTimer = 0;
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(function () {
    var w = document.querySelector('main').clientWidth;
    if (w === lastW) return;
    lastW = w; clearTimeout(roTimer); roTimer = setTimeout(drawCharts, 80);
  }).observe(document.querySelector('main'));
  saveNote();
  renderAll(); route();
}
window.WB_TEST = {blank: blank, sampleState: sampleState, normalize: normalize};
if (document.getElementById('app')) start();
})();
