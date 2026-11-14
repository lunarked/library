(function () {
var U, M = window.MFG;
var WKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'];
window.SPEC = {
  app: 'mfg-production-planning',
  title: 'Production Planning',
  desc: 'Set the master production schedule against demand and line capacity, explode it through the BOM into part requirements and order dates, and see how many devices you can build today.',
  notice: 'Every tab is filled with sample data for a portable speaker with 30 parts. Type over it, or start blank.',
  headCap: 'Clear to build today',
  download: {href: 'production-planning.xlsx', label: 'Download Excel'},
  tones: {good: ['Covered'], warn: ['Order soon', 'Over capacity', 'Below safety'], bad: ['Late', 'Stock out']},
  notes: [
    'Demand each week is the larger of forecast and firm orders. Finished stock is last week\'s stock plus the build less demand. Below safety means finished stock falls under the safety level; Stock out means it goes below zero.',
    'MRP: each part\'s requirement is quantity per device times the planned build, week by week. Stock on hand plus the open order (from its due week) covers it until the first short week. Order by is that week less the lead time. Late means even an order today arrives after the part runs out.',
    'Order quantity covers the 12-week requirement plus safety stock less what is on hand and on order, rounded up to the MOQ.',
    'Clear to build is the smallest number of devices any single part allows. The part that sets it is the limiting part; that is the one to expedite.'
  ],
  tabs: [
    {id: 'mps', title: 'Master production schedule', badge: function (D) { return D.mIssues ? D.mIssues + ' weeks to fix' : ''; }, sections: [
      {type: 'form', title: 'Line and stock', fields: [
        {k: 'start', label: 'Week 1 starts', kind: 'date'},
        {k: 'cap', label: 'Line capacity per week', kind: 'int', note: 'Devices, at planned shifts'},
        {k: 'fg0', label: 'Finished stock now', kind: 'int'},
        {k: 'fgSafe', label: 'Finished safety stock', kind: 'int'}
      ], stats: [
        {label: 'Build, 12 weeks', v: function (D) { return U.fInt(D.mBuild); }},
        {label: 'Demand, 12 weeks', v: function (D) { return U.fInt(D.mDem); }},
        {label: 'Average line use', v: function (D) { return U.fPct(D.mUse); }}
      ]},
      {type: 'table', k: 'mps', title: 'Weeks', help: 'Forecast and firm orders in devices. Planned build is what the line will make.', fixed: WKS, cols: [
        {fixedLabel: true, label: 'Week', w: 80, num: false},
        {label: 'Starts', w: 110, v: function (D, i) { return D.mps[i].date; }, num: false},
        {k: 'fc', label: 'Forecast', kind: 'int', w: 80},
        {k: 'orders', label: 'Firm orders', kind: 'int', w: 80},
        {k: 'build', label: 'Planned build', kind: 'int', w: 90},
        {label: 'Demand', w: 76, v: function (D, i) { return U.fInt(D.mps[i].dem); }},
        {label: 'Finished stock', w: 90, v: function (D, i) { return U.fInt(D.mps[i].fg); }},
        {label: 'Line use', w: 70, v: function (D, i) { return U.fPct(D.mps[i].use); }},
        {label: 'Status', w: 104, status: function (D, i) { return D.mps[i].status; }}
      ]},
      {type: 'charts', title: 'Plan', charts: [
        {kind: 'line', title: 'Finished stock by week', sub: 'Devices, against the safety level', data: function (D, S) { return {pts: WKS.map(function (w, i) { return {label: 'W' + (i + 1), y: D.mps[i].fg}; }), refs: U.isNum(S.f.fgSafe) ? [{v: S.f.fgSafe, label: 'Safety'}] : [], fmt: 'int', area: true}; }},
        {kind: 'line', title: 'Planned build by week', sub: 'Devices, against line capacity', data: function (D, S) { return {pts: S.t.mps.map(function (r, i) { return {label: 'W' + (i + 1), y: r.build}; }), refs: U.isNum(S.f.cap) ? [{v: S.f.cap, label: 'Capacity'}] : [], fmt: 'int'}; }}
      ]}
    ]},
    {id: 'mrp', title: 'MRP part requirements', badge: function (D) { return D.rLate ? D.rLate + ' late' : D.rNow ? D.rNow + ' to order' : ''; }, sections: [
      {type: 'form', title: 'Currency', fields: [{k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']}]},
      {type: 'tiles', items: [
        {label: 'Late', sub: 'Runs out before an order can arrive', v: function (D, S) { return S.t.parts.length ? String(D.rLate) : ''; }, bad: function (D) { return D.rLate > 0; }},
        {label: 'Order this week', sub: 'Order by week 1', v: function (D, S) { return S.t.parts.length ? String(D.rNow) : ''; }},
        {label: 'Order soon', sub: 'Order by within 4 weeks', v: function (D, S) { return S.t.parts.length ? String(D.rSoon) : ''; }},
        {label: 'Order value', sub: 'Late and order this week lines', v: function (D, S) { return S.t.parts.length ? U.fMoney(D.rValue, 0) : ''; }}
      ]},
      {type: 'table', k: 'parts', title: 'Parts', help: 'Quantity per device from the BOM. On order arrives in its due week.', add: 'Add a part', cols: [
        {k: 'part', label: 'Part', kind: 'text', w: 98},
        {k: 'qty', label: 'Qty', kind: 'num', w: 50},
        {k: 'onhand', label: 'On hand', kind: 'int', w: 70},
        {k: 'onorder', label: 'On order', kind: 'int', w: 70},
        {k: 'due', label: 'Due week', kind: 'int', w: 56},
        {k: 'lead', label: 'Lead, weeks', kind: 'int', w: 56},
        {k: 'safety', label: 'Safety stock', kind: 'int', w: 66},
        {k: 'moq', label: 'MOQ', kind: 'int', w: 60},
        {k: 'cost', label: 'Unit cost', kind: 'num', w: 60},
        {label: 'Need, 12 weeks', w: 70, v: function (D, i) { return U.fInt(D.parts[i].gross); }},
        {label: 'Short in', w: 60, v: function (D, i) { return D.parts[i].shortW ? 'W' + D.parts[i].shortW : 'None'; }, num: false},
        {label: 'Order by', w: 60, v: function (D, i) { var o = D.parts[i].orderBy; return o == null ? '' : o < 1 ? 'Now' : 'W' + o; }, num: false},
        {label: 'Order qty', w: 66, v: function (D, i) { return U.fInt(D.parts[i].qty); }},
        {label: 'Status', w: 86, status: function (D, i) { return D.parts[i].status; }}
      ]}
    ]},
    {id: 'ctb', title: 'Clear to build', badge: function (D) { return D.cNow != null ? U.fInt(D.cNow) + ' devices' : ''; }, sections: [
      {type: 'form', title: 'Build target', fields: [
        {k: 'target', label: 'Devices you want to build', kind: 'int'}
      ]},
      {type: 'tiles', items: [
        {label: 'Clear to build now', sub: 'From stock on hand', v: function (D) { return U.fInt(D.cNow); }},
        {label: 'Limiting part', sub: function (D) { return D.cLimDesc || ''; }, v: function (D) { return D.cLim; }},
        {label: 'With open orders', sub: 'On hand plus on order', v: function (D) { return U.fInt(D.cAll); }},
        {label: 'Parts short for the target', sub: function (D, S) { return U.isNum(S.f.target) ? 'For ' + U.fInt(S.f.target) + ' devices' : 'Set a target'; }, v: function (D, S) { return U.isNum(S.f.target) && S.t.parts.length ? String(D.cShortN) : ''; }, bad: function (D) { return D.cShortN > 0; }}
      ]},
      {type: 'note', title: 'What stops the target', v: function (D, S) { return !U.isNum(S.f.target) ? ['', 'Enter the number of devices you want to build.'] : D.cShortN ? ['Short', D.cText] : ['Covered', 'Every part is on hand for ' + U.fInt(S.f.target) + ' devices.']; }},
      {type: 'charts', title: 'Limits', charts: [
        {kind: 'bars', title: 'Devices each part allows', sub: 'Ten lowest, from stock on hand', data: function (D, S) { return {items: S.t.parts.map(function (p, i) { return {label: p.part || 'Part ' + (i + 1), v: D.parts[i].ctb}; }).filter(function (x) { return x.v != null; }).sort(function (a, b) { return a.v - b.v; }).slice(0, 10), fmt: 'int'}; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Build, 12 weeks', v: function (D) { return U.fInt(D.mBuild) || 'No data'; }},
    {label: 'Weeks to fix in the schedule', v: function (D) { return {text: String(D.mIssues), tone: D.mIssues ? 'warn' : ''}; }},
    {label: 'Parts late', v: function (D) { return {text: String(D.rLate), tone: D.rLate ? 'bad' : ''}; }},
    {label: 'Parts to order this week', v: function (D) { return String(D.rNow); }},
    {label: 'Limiting part', v: function (D) { return D.cLim || 'No data'; }}
  ],
  headline: function (D) {
    if (D.cNow == null) return {unit: 'Add parts with stock on hand'};
    return {num: U.fInt(D.cNow), unit: 'devices clear to build from stock', status: D.rLate ? 'Late' : 'Covered', note: 'Limited by ' + D.cLim + ', ' + D.rLate + ' parts late'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExamplePlant'; S.biz.marketplace = 'Portable speaker S1';
    var f = S.f; f.start = M.monday(W, 1); f.cap = 3000; f.fg0 = 4200; f.fgSafe = 2500; f.currency = '€'; f.target = 9000;
    var fc = [2400, 2500, 2500, 2600, 2700, 2800, 3000, 3200, 3400, 3600, 3400, 3000], ord = [2650, 2300, 1800, 1200, 800, 400, 200, 0, 0, 0, 0, 0], bld = [2600, 2700, 2700, 2800, 2800, 2900, 3000, 3000, 3200, 3200, 3000, 2900];
    S.t.mps.forEach(function (r, i) { r.fc = fc[i]; r.orders = ord[i]; r.build = bld[i]; });
    var cover = {'IC-BT': [9000, 30000, 3, 2000], 'BAT-PACK': [4200, 8000, 3, 1500], 'GRL-MESH': [24000, 0, null, 1000], 'DRV-WOOF': [26000, 0, null, 2000], 'GSK-SEAL': [5200, 14000, 2, 1500], 'PCB-MAIN': [16000, 20000, 6, 2000]};
    S.t.parts = M.BOM.map(function (b) {
      var c = cover[b[0]] || [Math.round(b[2] * 40000 / 100) * 100, 0, null, Math.round(b[2] * 2000)];
      return {part: b[0], qty: b[2], onhand: c[0], onorder: c[1], due: c[2], lead: b[4], safety: c[3], moq: b[5], cost: b[3]};
    });
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    var t0 = W.toUTC(f.start), fg = W.isNum(f.fg0) ? f.fg0 : null;
    D.mIssues = 0; D.mBuild = 0; D.mDem = 0;
    var uses = [];
    D.mps = S.t.mps.map(function (r, i) {
      var dem = Math.max(n0(r.fc), n0(r.orders)), build = n0(r.build);
      D.mBuild += build; D.mDem += dem;
      if (fg != null) fg = fg + build - dem;
      var use = f.cap > 0 && W.isNum(r.build) ? r.build / f.cap : null;
      if (use != null) uses.push(use);
      var status = !W.isNum(r.build) && !dem ? '' : fg != null && fg < 0 ? 'Stock out' : use > 1 ? 'Over capacity' : fg != null && W.isNum(f.fgSafe) && fg < f.fgSafe ? 'Below safety' : 'OK';
      if (status && status !== 'OK') D.mIssues++;
      return {date: t0 != null ? U.fDate(t0 + i * 7 * W.DAY) : '', dem: dem, fg: fg, use: use, status: status};
    });
    D.mUse = uses.length ? W.mean(uses) : null;
    var builds = S.t.mps.map(function (r) { return n0(r.build); });

    D.rLate = 0; D.rNow = 0; D.rSoon = 0; D.rValue = 0;
    D.cNow = null; D.cAll = null; D.cLim = ''; D.cLimDesc = '';
    var tgt = W.isNum(f.target) ? f.target : null, short = [];
    D.parts = S.t.parts.map(function (p) {
      if (!(p.qty > 0)) return {status: ''};
      var oh = n0(p.onhand), oo = n0(p.onorder), due = W.isNum(p.due) ? p.due : 1, safe = n0(p.safety);
      var cum = 0, shortW = null, gross = 0;
      builds.forEach(function (b, i) {
        var g = b * p.qty; gross += g; cum += g;
        var avail = oh + (i + 1 >= due ? oo : 0) - safe;
        if (shortW == null && cum > avail) shortW = i + 1;
      });
      var orderBy = shortW != null && W.isNum(p.lead) ? shortW - p.lead : null;
      var status = shortW == null ? 'Covered' : orderBy == null ? 'Order soon' : orderBy < 1 ? 'Late' : orderBy === 1 ? 'Order now' : orderBy <= 4 ? 'Order soon' : 'Covered';
      var net = Math.max(0, gross + safe - oh - oo), qty = 0;
      if (status !== 'Covered' && net > 0) qty = Math.max(net, n0(p.moq));
      if (status === 'Late') D.rLate++;
      if (status === 'Order now') D.rNow++;
      if (status === 'Order soon') D.rSoon++;
      if (status === 'Late' || status === 'Order now') D.rValue += qty * n0(p.cost);
      var ctb = Math.floor(oh / p.qty), ctbAll = Math.floor((oh + oo) / p.qty);
      if (D.cNow == null || ctb < D.cNow) { D.cNow = ctb; D.cLim = p.part || ''; }
      D.cAll = D.cAll == null ? ctbAll : Math.min(D.cAll, ctbAll);
      if (tgt != null && ctb < tgt) short.push({part: p.part, miss: Math.ceil(tgt * p.qty - oh)});
      return {gross: gross, shortW: shortW, orderBy: orderBy, qty: qty, ctb: ctb, status: status};
    });
    var bom = M.BOM.filter(function (b) { return b[0] === D.cLim; })[0];
    D.cLimDesc = bom ? bom[1] : '';
    short.sort(function (a, b) { return b.miss - a.miss; });
    D.cShortN = short.length;
    D.cText = short.slice(0, 6).map(function (s) { return s.part + ' short by ' + U.fInt(s.miss); }).join(', ') + (short.length > 6 ? ', and ' + (short.length - 6) + ' more.' : '.');
    return D;
  }
};
})();
