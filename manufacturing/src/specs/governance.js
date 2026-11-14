(function () {
var U, M = window.MFG;
window.SPEC = {
  app: 'mfg-governance',
  title: 'Manufacturing Governance',
  desc: 'Keep one dictionary of plant KPIs, run the weekly production and S&OP review from the same numbers, and log decisions with owners and review dates.',
  notice: 'Every tab is filled with sample data for a portable speaker plant. Type over it, or start blank.',
  headCap: 'Plan attainment last week',
  tones: {good: ['On target', 'Decided'], warn: ['Off target', 'Review due'], bad: []},
  notes: [
    'One KPI, one formula, one owner. The weekly review and every report use the names in the dictionary.',
    'Weekly review: plan attainment is good devices built over planned build. Clear to build is from the Production Planning workbook; shortages from Supply and Procurement; yield from Production Execution.',
    'S&OP: once a month, agree one demand number, one build plan and the decisions that follow (overtime, extra shift, expedite, stock build). Log each decision here.'
  ],
  tabs: [
    {id: 'kpis', title: 'KPI dictionary', badge: function (D) { return D.kOff ? D.kOff + ' off target' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'KPIs', sub: 'In the dictionary', v: function (D, S) { return S.t.kpis.length ? String(S.t.kpis.length) : ''; }},
        {label: 'On target', sub: 'Latest value', v: function (D, S) { return S.t.kpis.length ? String(D.kOn) : ''; }},
        {label: 'Off target', sub: 'Latest value', v: function (D, S) { return S.t.kpis.length ? String(D.kOff) : ''; }, bad: function (D) { return D.kOff > 0; }}
      ]},
      {type: 'table', k: 'kpis', title: 'KPIs', help: 'Keep it to the numbers the weekly review runs on.', add: 'Add a KPI', cols: [
        {k: 'name', label: 'KPI', kind: 'text', w: 190},
        {k: 'formula', label: 'Formula', kind: 'text', w: 290},
        {k: 'owner', label: 'Owner', kind: 'text', w: 110},
        {k: 'freq', label: 'Frequency', kind: 'sel', options: ['Shift', 'Daily', 'Weekly', 'Monthly'], w: 90},
        {k: 'dir', label: 'Better is', kind: 'sel', options: ['Higher', 'Lower'], w: 80},
        {k: 'target', label: 'Target', kind: 'num', w: 64},
        {k: 'value', label: 'Latest', kind: 'num', w: 64},
        {label: 'Status', w: 96, status: function (D, i) { return D.kpis[i]; }}
      ]}
    ]},
    {id: 'weekly', title: 'Weekly production review', badge: function (D) { return D.wLast ? U.fPct(D.wLast.att) : ''; }, sections: [
      {type: 'form', title: 'Targets', fields: [
        {k: 'tAtt', label: 'Plan attainment target', kind: 'pct', def: 95},
        {k: 'tRty', label: 'Rolled yield target', kind: 'pct', def: 92}
      ]},
      {type: 'tiles', items: [
        {label: 'Plan attainment', sub: 'Last week', v: function (D) { return D.wLast ? U.fPct(D.wLast.att) : ''; }, bad: function (D, S) { return D.wLast && D.wLast.att * 100 < U.n0(S.f.tAtt); }},
        {label: 'Good devices built', sub: 'Last week', v: function (D) { return D.wLastRow ? U.fInt(D.wLastRow.built) : ''; }},
        {label: 'Rolled yield', sub: 'Last week', v: function (D) { return D.wLastRow && U.isNum(D.wLastRow.rty) ? U.fPct(D.wLastRow.rty / 100) : ''; }},
        {label: 'Devices blocked', sub: 'By shortages, last week', v: function (D) { return D.wLastRow ? U.fInt(D.wLastRow.blocked) : ''; }}
      ]},
      {type: 'table', k: 'weeks', title: 'Weeks', help: 'One row per week, at the same cut-off time.', add: 'Add a week', cols: [
        {k: 'week', label: 'Week starting', kind: 'date', w: 128},
        {k: 'plan', label: 'Planned build', kind: 'int', w: 76},
        {k: 'built', label: 'Good built', kind: 'int', w: 76},
        {k: 'rty', label: 'Rolled yield %', kind: 'pct', w: 70},
        {k: 'oee', label: 'OEE %', kind: 'pct', w: 60},
        {k: 'ctb', label: 'Clear to build', kind: 'int', w: 76},
        {k: 'blocked', label: 'Devices blocked', kind: 'int', w: 76},
        {k: 'ncr', label: 'Open NCRs', kind: 'int', w: 60},
        {k: 'note', label: 'Main issue', kind: 'text', w: 200},
        {label: 'Attainment', w: 76, v: function (D, i) { return U.fPct(D.weeks[i].att); }},
        {label: 'Status', w: 90, status: function (D, i) { return D.weeks[i].status; }}
      ]},
      {type: 'charts', title: 'Trend', charts: [
        {kind: 'line', title: 'Plan attainment by week', sub: '% of planned build', data: function (D, S) { return {pts: D.wOrder.map(function (i) { return {label: S.t.weeks[i].week ? U.fDate(U.toUTC(S.t.weeks[i].week)).replace(/ \d{4}$/, '') : 'Week', y: D.weeks[i].att == null ? null : D.weeks[i].att * 100}; }), refs: [{v: S.f.tAtt, label: 'Target'}], fmt: 'dec1', unit: '%'}; }},
        {kind: 'line', title: 'Rolled yield by week', sub: '% of devices passing every station first time', data: function (D, S) { return {pts: D.wOrder.map(function (i) { return {label: S.t.weeks[i].week ? U.fDate(U.toUTC(S.t.weeks[i].week)).replace(/ \d{4}$/, '') : 'Week', y: S.t.weeks[i].rty}; }), refs: [{v: S.f.tRty, label: 'Target'}], fmt: 'dec1', unit: '%'}; }}
      ]}
    ]},
    {id: 'decisions', title: 'Decision log', badge: function (D) { return D.dDue ? D.dDue + ' reviews due' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Decisions', sub: 'All rows', v: function (D, S) { return S.t.dec.length ? String(S.t.dec.length) : ''; }},
        {label: 'Waiting for a decision', sub: 'Open', v: function (D, S) { return S.t.dec.length ? String(D.dOpen) : ''; }},
        {label: 'Reviews due', sub: 'Review date passed', v: function (D, S) { return S.t.dec.length ? String(D.dDue) : ''; }, bad: function (D) { return D.dDue > 0; }}
      ]},
      {type: 'table', k: 'dec', title: 'Decisions', help: 'Log S&OP and weekly review decisions: overtime, extra shifts, expediting, stock builds, engineering changes.', add: 'Add a decision', cols: [
        {k: 'date', label: 'Date', kind: 'date', w: 128},
        {k: 'area', label: 'Area', kind: 'sel', options: ['Planning', 'Supply', 'Production', 'Quality', 'Inventory', 'Cost', 'Compliance'], w: 110},
        {k: 'what', label: 'Decision', kind: 'text', w: 320},
        {k: 'by', label: 'Decided by', kind: 'text', w: 110},
        {k: 'state', label: 'State', kind: 'sel', options: ['Open', 'Decided', 'Reversed'], w: 96, tone: true},
        {k: 'review', label: 'Review on', kind: 'date', w: 128},
        {label: 'Status', w: 96, status: function (D, i) { return D.dec[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'KPIs off target', v: function (D) { return {text: String(D.kOff), tone: D.kOff ? 'warn' : ''}; }},
    {label: 'Plan attainment last week', v: function (D) { return D.wLast ? U.fPct(D.wLast.att) : 'No data'; }},
    {label: 'Devices blocked last week', v: function (D) { return D.wLastRow ? U.fInt(D.wLastRow.blocked) : 'No data'; }},
    {label: 'Decisions waiting', v: function (D) { return String(D.dOpen); }},
    {label: 'Reviews due', v: function (D) { return String(D.dDue); }}
  ],
  headline: function (D) {
    if (!D.wLast) return {unit: 'Add a week to the review'};
    return {num: U.fPct(D.wLast.att), unit: 'of planned build made last week', status: D.wLast.status, note: U.fInt(D.wLastRow.built) + ' of ' + U.fInt(D.wLastRow.plan) + ' devices'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExamplePlant'; S.biz.marketplace = 'Portable speaker S1';
    S.t.kpis = W.rows(['name', 'formula', 'owner', 'freq', 'dir', 'target', 'value'], [
      ['Plan attainment %', 'Good devices built over planned build', 'Production manager', 'Weekly', 'Higher', 95, 93.1],
      ['Rolled throughput yield %', 'Product of first-pass yield at every station', 'Quality manager', 'Weekly', 'Higher', 92, 90.2],
      ['OEE at the bottleneck %', 'Availability times performance times quality', 'Production manager', 'Daily', 'Higher', 75, 77.9],
      ['Clear to build, days', 'Devices clear to build over daily build', 'Planner', 'Daily', 'Higher', 10, 7.5],
      ['Supplier on time %', 'Receipts within 2 days of confirmed date', 'Purchasing', 'Weekly', 'Higher', 95, 89],
      ['Inventory accuracy %', 'Counts within tolerance over counts', 'Warehouse lead', 'Monthly', 'Higher', 98, 87.5],
      ['Standard cost per device', 'BOM, labor, overhead, freight and warranty', 'Cost accountant', 'Monthly', 'Lower', 50, 49.8],
      ['Days of inventory', 'Parts stock over daily material use', 'Planner', 'Weekly', 'Lower', 45, 52]
    ]);
    S.f.tAtt = 95; S.f.tRty = 92;
    S.t.weeks = W.rows(['week', 'plan', 'built', 'rty', 'oee', 'ctb', 'blocked', 'ncr', 'note'], [
      [M.monday(W, -6), 2600, 2590, 92.4, 81, 9800, 0, 2, ''],
      [M.monday(W, -5), 2600, 2560, 91.8, 80, 9200, 0, 3, ''],
      [M.monday(W, -4), 2700, 2610, 91.0, 78, 8100, 300, 3, 'Grille shortage, two shifts lost'],
      [M.monday(W, -3), 2700, 2680, 91.6, 80, 7400, 0, 4, ''],
      [M.monday(W, -2), 2800, 2690, 90.5, 79, 6200, 600, 3, 'Battery pack late from supplier'],
      [M.monday(W, -1), 2800, 2606, 90.2, 79, 4200, 1100, 3, 'Battery pack short, woofer rub and buzz']
    ]);
    var r = function (n) { return M.rel(W, n); };
    S.t.dec = W.rows(['date', 'area', 'what', 'by', 'state', 'review'], [
      [r(-30), 'Planning', 'Saturday shift in weeks 9 and 10 to build stock for peak', 'S&OP meeting', 'Decided', r(40)],
      [r(-14), 'Supply', 'Air freight 3,000 battery packs, cost to the supplier where late', 'Plant manager', 'Decided', r(-1)],
      [r(-7), 'Quality', 'Hold woofer lot AP-2231, 100% acoustic test until 8D closes', 'Quality manager', 'Decided', r(14)],
      [r(-3), 'Supply', 'Qualify a second battery cell supplier this quarter', 'S&OP meeting', 'Open', ''],
      [r(-2), 'Inventory', 'Monthly counts on all A parts until accuracy is above 98%', 'Plant manager', 'Open', '']
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {}, tdy = W.isoOf(today);
    D.kOn = 0; D.kOff = 0;
    D.kpis = S.t.kpis.map(function (k) {
      if (!W.isNum(k.target) || !W.isNum(k.value)) return '';
      var ok = k.dir === 'Lower' ? k.value <= k.target : k.value >= k.target;
      if (ok) D.kOn++; else D.kOff++;
      return ok ? 'On target' : 'Off target';
    });

    D.wOrder = S.t.weeks.map(function (w, i) { return i; }).sort(function (a, b) { return (S.t.weeks[a].week || '') < (S.t.weeks[b].week || '') ? -1 : 1; });
    D.weeks = S.t.weeks.map(function (w) {
      var att = w.plan > 0 && W.isNum(w.built) ? w.built / w.plan : null;
      if (att == null) return {status: ''};
      var off = att * 100 < n0(f.tAtt) || (W.isNum(w.rty) && w.rty < n0(f.tRty));
      return {att: att, status: off ? 'Off target' : 'On target'};
    });
    var li = D.wOrder.filter(function (i) { return D.weeks[i].att != null; }).pop();
    D.wLast = li != null ? D.weeks[li] : null;
    D.wLastRow = li != null ? S.t.weeks[li] : null;

    D.dOpen = 0; D.dDue = 0;
    D.dec = S.t.dec.map(function (d) {
      if (!d.what) return {status: ''};
      if (d.state === 'Open') { D.dOpen++; return {status: 'Open'}; }
      if (d.state === 'Reversed') return {status: 'Closed'};
      var due = d.review && W.days(tdy, d.review) < 0;
      if (due) D.dDue++;
      return {status: due ? 'Review due' : 'Decided'};
    });
    return D;
  }
};
})();
