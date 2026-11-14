(function () {
var U;
var GATES = ['Concept and business case', 'Prototype', 'Engineering validation', 'Operations readiness', 'Pilot city', 'Rollout decision', 'Scale rollout', 'Old model run-out'];
var READY = [
  ['Spare parts for the first 90 days in every workshop', 'Parts', 'Yes'],
  ['Special tools in every workshop', 'Repair', 'Yes'],
  ['Mechanics trained and signed off', 'Repair', 'Yes'],
  ['Repair manual and labor standards published', 'Repair', 'Yes'],
  ['New fault codes added to the shared list', 'Repair', 'Yes'],
  ['Diagnostics tool reads the new model', 'Repair', 'Yes'],
  ['Firmware release and rollback plan', 'Engineering', 'Yes'],
  ['Batteries fit the swap stations and chargers', 'Field ops', 'Yes'],
  ['Battery transport classified (UN3480, UN3481)', 'Logistics', 'Yes'],
  ['Type approval for each country (Germany: eKFV)', 'Compliance', 'Yes'],
  ['Insurance covers the new model', 'Compliance', 'Yes'],
  ['City permits allow the new model', 'City ops', 'Yes'],
  ['Vehicle master and status model updated', 'IT', 'Yes'],
  ['Rider app shows the new model', 'Product', 'No'],
  ['Warranty terms and claim process agreed with the OEM', 'Supply', 'Yes'],
  ['Field staff briefed on handling and swaps', 'Field ops', 'No']
];
var METRICS = [
  ['Failures per 1,000 rides', 'Lower'],
  ['Repair minutes per failure', 'Lower'],
  ['Rides per vehicle per day', 'Higher'],
  ['Range in km on one battery', 'Higher'],
  ['Vandalism repairs per 100 vehicles per month', 'Lower'],
  ['Rider rating, 1 to 5', 'Higher'],
  ['Deployable rate %', 'Higher'],
  ['Swaps per vehicle per week', 'Lower']
];
function rel(W, n) { var d = new Date(); return W.isoOf(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + n * W.DAY); }
window.SPEC = {
  app: 'esc-npi',
  title: 'New Product Introduction',
  desc: 'Run a new vehicle model through stage gates, check operations readiness before launch, compare the pilot against the current model and plan the fleet transition.',
  notice: 'Every tab is filled with sample data for a new model S3 replacing model S2. Type over it, or start blank.',
  headCap: 'Next gate',
  tones: {good: ['Passed', 'Better', 'Run-out matched'], warn: ['Partly', 'Slipping', 'Worse', 'Write-off risk', 'Old fleet still running'], bad: ['Not ready', 'Parts run out first']},
  notes: [
    'Operations owns the readiness gate. The new model may go to a pilot city only when every must-have line is Yes. Readiness counts Yes as 1 and Partly as 0.5.',
    'Slip is the forecast or actual date less the planned date. A gate more than 14 days late is Late, up to 14 days is Slipping.',
    'Pilot metrics compare the new model with the current one in the same city and weeks. Better means it beats the current model; Pass means it also meets the target.',
    'Transition: old-model parts demand falls as old vehicles retire. Parts run out first means the stock ends before the old fleet does, so plan a last order. Write-off risk means stock outlives the old fleet. Old fleet still running means the plan ends before the last old vehicle retires: add months.'
  ],
  tabs: [
    {id: 'gates', title: 'Stage-gate plan', badge: function (D) { return D.gNext ? D.gNext : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Gates passed', sub: function () { return 'Of ' + GATES.length; }, v: function (D) { return D.gAny ? String(D.gPassed) : ''; }},
        {label: 'Next gate', sub: function (D) { return D.gNextDate ? 'Forecast ' + D.gNextDate : ''; }, v: function (D) { return D.gNext; }},
        {label: 'Slip on next gate', sub: 'Forecast less plan', v: function (D) { return D.gNextSlip != null ? U.fInt(D.gNextSlip) + ' days' : ''; }, bad: function (D) { return D.gNextSlip > 14; }},
        {label: 'Gates blocked', sub: 'Need a decision', v: function (D) { return D.gAny ? String(D.gBlocked) : ''; }, bad: function (D) { return D.gBlocked > 0; }}
      ]},
      {type: 'table', k: 'gates', title: 'Gates', help: 'Plan is the date agreed at the start. Forecast is today\'s best date, or the actual date once passed.', fixed: GATES, cols: [
        {fixedLabel: true, label: 'Gate', w: 200, num: false},
        {k: 'plan', label: 'Planned', kind: 'date', w: 128},
        {k: 'fc', label: 'Forecast or actual', kind: 'date', w: 128},
        {k: 'owner', label: 'Owner', kind: 'text', w: 100},
        {k: 'state', label: 'State', kind: 'sel', options: ['Not started', 'In progress', 'Passed', 'Blocked'], w: 110, tone: true},
        {k: 'criteria', label: 'Exit criteria', kind: 'text', w: 260},
        {label: 'Slip, days', w: 64, v: function (D, i) { var s = D.gates[i].slip; return s == null ? '' : U.signed(U.fInt(s), s); }},
        {label: 'Status', w: 90, status: function (D, i) { return D.gates[i].status; }}
      ]}
    ]},
    {id: 'readiness', title: 'NPI readiness checklist', badge: function (D) { return D.rScore != null ? U.fPct(D.rScore) + ' ready' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Readiness', sub: 'Yes counts 1, Partly counts 0.5', v: function (D) { return U.fPct(D.rScore); }},
        {label: 'Must-haves open', sub: 'Block the pilot', v: function (D) { return String(D.rOpen); }, bad: function (D) { return D.rOpen > 0; }},
        {label: 'Lines done', sub: function () { return 'Of ' + READY.length; }, v: function (D) { return String(D.rYes); }},
        {label: 'Pilot gate', sub: 'Operations sign-off', v: function (D) { return D.rGate; }, bad: function (D) { return D.rGate === 'No go'; }}
      ]},
      {type: 'table', k: 'ready', title: 'Checklist', help: 'Each line has one owner. Must-have lines block the pilot until they are Yes.', fixed: READY.map(function (r) { return r[0]; }), cols: [
        {fixedLabel: true, label: 'Ready when', w: 360, num: false},
        {k: 'area', label: 'Area', kind: 'text', w: 110},
        {k: 'owner', label: 'Owner', kind: 'text', w: 110},
        {k: 'must', label: 'Must have', kind: 'sel', options: ['Yes', 'No'], w: 80},
        {k: 'done', label: 'Done', kind: 'sel', options: ['No', 'Partly', 'Yes'], w: 84},
        {k: 'due', label: 'Due', kind: 'date', w: 128},
        {k: 'note', label: 'Notes', kind: 'text', w: 180},
        {label: 'Status', w: 90, status: function (D, i) { return D.ready[i]; }}
      ]}
    ]},
    {id: 'pilot', title: 'Pilot scorecard', badge: function (D) { return D.pDecision || ''; }, sections: [
      {type: 'form', title: 'Pilot', fields: [
        {k: 'pCity', label: 'Pilot city', kind: 'text'},
        {k: 'pVeh', label: 'New model vehicles in pilot', kind: 'int'},
        {k: 'pWeeks', label: 'Weeks of pilot data', kind: 'int'}
      ]},
      {type: 'tiles', items: [
        {label: 'Metrics passed', sub: 'Better than current and on target', v: function (D) { return D.pRows ? D.pPass + ' of ' + D.pRows : ''; }},
        {label: 'Worse than current', sub: 'Need a fix before rollout', v: function (D) { return D.pRows ? String(D.pWorse) : ''; }, bad: function (D) { return D.pWorse > 0; }},
        {label: 'Failures per 1,000 rides', sub: 'Change against the current model', v: function (D) { return D.pFail != null ? U.signed(U.fPct(D.pFail), D.pFail) : ''; }},
        {label: 'Pilot result', sub: 'All metrics pass, and 8 weeks of data', v: function (D) { return D.pDecision; }}
      ]},
      {type: 'table', k: 'metrics', title: 'Metrics', help: 'Measure both models in the pilot city over the same weeks.', fixed: METRICS.map(function (m) { return m[0]; }), cols: [
        {fixedLabel: true, label: 'Metric', w: 300, num: false},
        {k: 'dir', label: 'Better is', kind: 'sel', options: ['Lower', 'Higher'], w: 90},
        {k: 'cur', label: 'Current model', kind: 'num', w: 90},
        {k: 'new', label: 'New model', kind: 'num', w: 90},
        {k: 'target', label: 'Target', kind: 'num', w: 80},
        {label: 'Change', w: 76, v: function (D, i) { var c = D.metrics[i].chg; return c == null ? '' : U.signed(U.fPct(c), c); }},
        {label: 'Against current', w: 96, status: function (D, i) { return D.metrics[i].vs; }},
        {label: 'Result', w: 80, status: function (D, i) { return D.metrics[i].res; }}
      ]}
    ]},
    {id: 'transition', title: 'Fleet transition plan', badge: function (D) { return D.tShare != null ? U.fPct(D.tShare) + ' new by end' : ''; }, sections: [
      {type: 'form', title: 'Start and old-model parts', fields: [
        {k: 'oldStart', label: 'Old model fleet at start', kind: 'int'},
        {k: 'newStart', label: 'New model fleet at start', kind: 'int'},
        {k: 'partsStock', label: 'Old-model parts stock, value', kind: 'money'},
        {k: 'partsUse', label: 'Parts use per 100 old vehicles per month, value', kind: 'money'},
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']}
      ], stats: [
        {label: 'Months of parts left', v: function (D) { return U.fDec1(D.tPartsMonths); }},
        {label: 'Old model gone in', v: function (D) { return D.tOldGone != null ? D.tOldGone + ' months' : 'Not in this plan'; }},
        {label: 'Parts check', v: function (D) { return D.tPartsStatus ? {text: D.tPartsStatus, tone: D.tPartsStatus === 'Run-out matched' ? '' : 'warn'} : ''; }}
      ]},
      {type: 'table', k: 'months', title: 'Months', help: 'One row per month. New is vehicles delivered and deployed, Retired is old-model vehicles taken out.', add: 'Add a month', cols: [
        {k: 'month', label: 'Month starting', kind: 'date', w: 128},
        {k: 'city', label: 'Cities switching', kind: 'text', w: 170},
        {k: 'add', label: 'New delivered', kind: 'int', w: 76, foot: 'sum'},
        {k: 'ret', label: 'Old retired', kind: 'int', w: 76, foot: 'sum'},
        {label: 'Old fleet', w: 74, v: function (D, i) { return U.fInt(D.months[i].old); }},
        {label: 'New fleet', w: 74, v: function (D, i) { return U.fInt(D.months[i].nw); }},
        {label: 'Total fleet', w: 76, v: function (D, i) { return U.fInt(D.months[i].tot); }},
        {label: 'New share', w: 70, v: function (D, i) { return U.fPct(D.months[i].share); }},
        {label: 'Old parts left', w: 86, v: function (D, i) { return U.fMoney(D.months[i].parts, 0); }}
      ]},
      {type: 'charts', title: 'Mix', charts: [
        {kind: 'line', title: 'New model share of the fleet', sub: '% by month', data: function (D) { return {pts: D.tOrder.map(function (o) { return {label: o.label, y: o.share == null ? null : o.share * 100}; }), fmt: 'int', unit: '%', area: true}; }},
        {kind: 'line', title: 'Old-model parts stock', sub: 'Value left at month end', data: function (D) { return {pts: D.tOrder.map(function (o) { return {label: o.label, y: o.parts}; }), fmt: 'money'}; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Next gate', v: function (D) { return D.gNext || 'None'; }},
    {label: 'Readiness', v: function (D) { return U.fPct(D.rScore) || 'No data'; }},
    {label: 'Must-haves open', v: function (D) { return {text: String(D.rOpen), tone: D.rOpen ? 'warn' : ''}; }},
    {label: 'Pilot result', v: function (D) { return D.pDecision || 'No data'; }},
    {label: 'Old-model parts', v: function (D) { return D.tPartsStatus || 'No data'; }}
  ],
  headline: function (D) {
    if (!D.gAny) return {unit: 'Plan the gates for the new model'};
    return {num: D.gNext || 'All passed', unit: D.gNextDate ? 'forecast ' + D.gNextDate : '', status: D.gNextStatus, note: D.gPassed + ' of ' + GATES.length + ' gates passed, readiness ' + (U.fPct(D.rScore) || 'not set')};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleMobility'; S.biz.marketplace = 'Model S3 launch';
    var g = [[-420, -420, 'Product lead', 'Passed', 'Business case approved, target cost per vehicle agreed'], [-300, -290, 'Engineering', 'Passed', 'Three prototypes ride 1,000 km each'], [-150, -128, 'Engineering', 'Passed', 'EN 17128 tests passed, IP rating confirmed'], [-40, 12, 'Ops lead', 'In progress', 'All must-have readiness lines Yes'], [20, 45, 'City ops', 'Not started', '300 vehicles, 8 weeks, pilot scorecard passes'], [80, 105, 'Leadership', 'Not started', 'Pilot passed, payback under 14 months'], [120, 150, 'Ops lead', 'Not started', 'All cities switched by plan'], [300, 330, 'Parts lead', 'Not started', 'Old-model parts used up or sold']];
    S.t.gates.forEach(function (r, i) { r.plan = rel(W, g[i][0]); r.fc = rel(W, g[i][1]); r.owner = g[i][2]; r.state = g[i][3]; r.criteria = g[i][4]; });
    var done = ['Partly', 'Yes', 'Partly', 'Yes', 'Yes', 'Partly', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Partly', 'Yes', 'No', 'Partly', 'No'];
    var owners = ['Parts lead', 'Workshop lead', 'Workshop lead', 'Workshop lead', 'Quality lead', 'Engineering', 'Engineering', 'Field lead', 'Logistics', 'Compliance', 'Compliance', 'City ops', 'IT', 'Product', 'Buyer', 'Field lead'];
    S.t.ready.forEach(function (r, i) { r.area = READY[i][1]; r.must = READY[i][2]; r.done = done[i]; r.owner = owners[i]; r.due = rel(W, -5 + i * 2); });
    S.t.ready[0].note = 'Motor wheels short, see shortage board'; S.t.ready[11].note = 'Munich approval pending';
    S.f.pCity = 'Vienna'; S.f.pVeh = 300; S.f.pWeeks = 9;
    var mv = [[4.8, 3.1, 3.5], [32, 27, 30], [3.4, 3.9, 3.6], [38, 55, 50], [6.5, 4.2, 5], [4.3, 4.5, 4.4], [86, 91, 88], [2.6, 1.6, 2]];
    S.t.metrics.forEach(function (r, i) { r.dir = METRICS[i][1]; r.cur = mv[i][0]; r.new = mv[i][1]; r.target = mv[i][2]; });
    S.t.metrics[1].new = 33;
    S.f.oldStart = 6800; S.f.newStart = 1100; S.f.partsStock = 210000; S.f.partsUse = 520; S.f.currency = '€';
    var m = function (k) { var d = new Date(); return W.isoOf(Date.UTC(d.getFullYear(), d.getMonth() + k, 1)); };
    S.t.months = W.rows(['month', 'city', 'add', 'ret'], [
      [m(1), 'Vienna', 300, 0], [m(2), 'Vienna', 400, 300], [m(3), 'Munich', 600, 500], [m(4), 'Munich', 700, 700],
      [m(5), 'Hamburg', 800, 800], [m(6), 'Hamburg, Cologne', 900, 900], [m(7), 'Berlin', 1000, 1000], [m(8), 'Berlin', 1000, 1000]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {}, tdy = W.isoOf(today);
    D.gPassed = 0; D.gBlocked = 0; D.gAny = false; D.gNext = ''; D.gNextDate = ''; D.gNextSlip = null; D.gNextStatus = '';
    D.gates = S.t.gates.map(function (g, i) {
      if (!g.plan) return {status: ''};
      D.gAny = true;
      var slip = g.fc ? W.days(g.plan, g.fc) : null;
      var status = g.state === 'Passed' ? 'Passed' : g.state === 'Blocked' ? 'Blocked' : slip > 14 ? 'Late' : slip > 0 ? 'Slipping' : 'On track';
      if (g.state === 'Passed') D.gPassed++;
      if (g.state === 'Blocked') D.gBlocked++;
      if (!D.gNext && g.state !== 'Passed') { D.gNext = GATES[i]; D.gNextDate = g.fc ? U.fDate(U.toUTC(g.fc)) : ''; D.gNextSlip = slip; D.gNextStatus = status; }
      return {slip: slip, status: status};
    });

    var pts = 0; D.rOpen = 0; D.rYes = 0;
    D.ready = S.t.ready.map(function (r) {
      pts += r.done === 'Yes' ? 1 : r.done === 'Partly' ? 0.5 : 0;
      if (r.done === 'Yes') D.rYes++;
      var open = r.must === 'Yes' && r.done !== 'Yes';
      if (open) D.rOpen++;
      return r.done === 'Yes' ? 'Done' : r.done === 'Partly' ? 'Partly' : r.must === 'Yes' ? 'Not ready' : 'Open';
    });
    var anyR = S.t.ready.some(function (r) { return r.done !== 'No'; });
    D.rScore = anyR ? pts / READY.length : null;
    D.rGate = anyR ? (D.rOpen ? 'No go' : 'Go') : '';

    D.pRows = 0; D.pPass = 0; D.pWorse = 0; D.pFail = null;
    D.metrics = S.t.metrics.map(function (m, i) {
      if (!W.isNum(m.cur) || !W.isNum(m.new)) return {vs: '', res: ''};
      D.pRows++;
      var chg = m.cur !== 0 ? m.new / m.cur - 1 : null;
      var better = m.dir === 'Lower' ? m.new < m.cur : m.new > m.cur;
      var worse = m.dir === 'Lower' ? m.new > m.cur : m.new < m.cur;
      var onT = !W.isNum(m.target) || (m.dir === 'Lower' ? m.new <= m.target : m.new >= m.target);
      if (worse) D.pWorse++;
      var pass = !worse && onT;
      if (pass) D.pPass++;
      if (i === 0) D.pFail = chg;
      return {chg: chg, vs: better ? 'Better' : worse ? 'Worse' : 'Same', res: pass ? 'Pass' : 'Fail'};
    });
    D.pDecision = !D.pRows ? '' : D.pPass === D.pRows && n0(f.pWeeks) >= 8 ? 'Go' : D.pWorse ? 'No go' : 'Review';

    var old = n0(f.oldStart), nw = n0(f.newStart), parts = W.isNum(f.partsStock) ? f.partsStock : null;
    var order = S.t.months.map(function (m, i) { return i; }).sort(function (a, b) { return (S.t.months[a].month || '') < (S.t.months[b].month || '') ? -1 : 1; });
    D.months = S.t.months.map(function () { return {}; });
    D.tOrder = []; D.tOldGone = null;
    var partsOutAt = null;
    order.forEach(function (i, k) {
      var m = S.t.months[i];
      old = Math.max(0, old - n0(m.ret)); nw += n0(m.add);
      if (parts != null) { parts = Math.max(0, parts - old / 100 * n0(f.partsUse)); if (parts === 0 && partsOutAt == null) partsOutAt = k + 1; }
      var tot = old + nw;
      D.months[i] = {old: old, nw: nw, tot: tot, share: tot ? nw / tot : null, parts: parts};
      if (old === 0 && D.tOldGone == null) D.tOldGone = k + 1;
      D.tOrder.push({label: m.month ? U.fDate(U.toUTC(m.month)).replace(/^\d+ /, '').replace(/ 20(\d\d)$/, ' $1') : 'Month ' + (k + 1), share: D.months[i].share, parts: parts});
    });
    D.tShare = D.tOrder.length ? D.tOrder[D.tOrder.length - 1].share : null;
    var use0 = n0(f.oldStart) / 100 * n0(f.partsUse);
    D.tPartsMonths = W.isNum(f.partsStock) && use0 > 0 ? f.partsStock / use0 : null;
    if (!W.isNum(f.partsStock) || !order.length) D.tPartsStatus = '';
    else if (partsOutAt != null && (D.tOldGone == null || partsOutAt < D.tOldGone)) D.tPartsStatus = 'Parts run out first';
    else if (D.tOldGone == null) D.tPartsStatus = 'Old fleet still running';
    else if (parts > use0) D.tPartsStatus = 'Write-off risk';
    else D.tPartsStatus = 'Run-out matched';
    return D;
  }
};
})();
