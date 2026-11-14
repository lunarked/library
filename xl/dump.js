// Dumps a workbook's sample state as JSON: node xl/dump.js <folder> <name>
global.window = {SPEC: {tabs: []}};
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), folder = process.argv[2], name = process.argv[3];
const eng = fs.readFileSync(path.join(root, 'fba/src/engine.js'), 'utf8');
const helpers = eng.slice(eng.indexOf('var DAY'), eng.indexOf('/* ---------- schema'));
const U = (new Function('window', 'var SPEC=window.SPEC;' + helpers + ';return U;'))(window);
const common = path.join(root, folder, 'src/common.js');
if (fs.existsSync(common)) require(common);
require(path.join(root, folder, 'src/specs', name + '.js'));
const S = window.SPEC, st = {f: {}, t: {}, biz: {}};
const fields = {}, tables = {};
S.tabs.forEach(t => t.sections.forEach(s => {
  if (s.type === 'form') s.fields.forEach(x => { fields[x.k] = x; st.f[x.k] = x.def !== undefined ? x.def : (x.kind === 'sel' ? String(x.options[0]) : null); });
  if (s.type === 'table') { tables[s.k] = s; st.t[s.k] = s.fixed ? s.fixed.map(() => ({})) : []; }
}));
S.sample(st, U);
const now = new Date(), today = U.isoOf(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
const tbl = {};
Object.keys(tables).forEach(k => { tbl[k] = {fixed: tables[k].fixed || null}; });
const ENG = eng.slice(eng.indexOf('var TONES'), eng.indexOf('if (SPEC.tones)'));
const TONES = (new Function(ENG + ';return TONES;'))();
if (S.tones) Object.keys(S.tones).forEach(t => { TONES[t] = TONES[t].concat(S.tones[t]); });
console.log(JSON.stringify({today, title: S.title, desc: S.desc, notes: S.notes || [], f: st.f, t: st.t, biz: st.biz, tables: tbl, tones: TONES}));
