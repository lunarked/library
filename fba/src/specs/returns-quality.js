(function () {
var U;
var REASONS = ['Defective', 'Not as described', 'No longer needed', 'Ordered wrong item', 'Better price elsewhere', 'Arrived damaged', 'Missing parts', 'Incompatible'];
window.SPEC = {
  app: 'returns-quality',
  title: 'Returns and Quality',
  desc: 'Find which SKUs return above Amazon\'s threshold and why, log defects to root cause, run warranty cases, choose what to do with returned stock, and watch account health.',
  notice: 'Every tab is filled with sample data for an electronics range. Type over it, or start blank.',
  headCap: 'Return rate',
  tones: {good: ['Best', 'Fixed', 'Replace', 'Refund'], bad: ['Critical'], warn: ['Medium', 'High']},
  notes: [
    'Amazon charges a returns processing fee on units returned above the return-rate threshold for your category. Enter the threshold and fee from Seller Central for your category and size tier.',
    'Order defect rate is negative feedback, A-to-z claims and chargebacks over orders. Amazon expects it under 1%.',
    'The recovery calculator compares what one returned unit earns or costs under each option. Grade rates and recovery shares are your own estimates.'
  ],
  tabs: [
    {id: 'returns-analysis', title: 'Returns analysis', badge: function (D) { return D.rOver ? D.rOver + ' over' : U.fPct(D.rRate); }, sections: [
      {type: 'form', title: 'Threshold', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['$', '€', '£']},
        {k: 'thr', label: 'Category return threshold', kind: 'pct'},
        {k: 'fee', label: 'Returns processing fee per unit', kind: 'money'}
      ]},
      {type: 'tiles', items: [
        {label: 'Return rate', sub: 'All SKUs, units returned over units sold', v: function (D) { return U.fPct(D.rRate); }},
        {label: 'Units returned', sub: 'Last 30 days', v: function (D, S) { return S.t.ret.length ? U.fInt(D.rUnits) : ''; }},
        {label: 'SKUs over threshold', sub: 'Paying the processing fee', v: function (D, S) { return S.t.ret.length ? String(D.rOver) : ''; }, bad: function (D) { return D.rOver > 0; }},
        {label: 'Fee exposure', sub: 'Units above threshold times fee', v: function (D, S) { return S.t.ret.length ? U.fMoney(D.rFee, 0) : ''; }, bad: function (D) { return D.rFee > 0; }}
      ]},
      {type: 'table', k: 'ret', title: 'Returns by SKU, last 30 days', help: 'Enter units sold and returned from the FBA customer returns report, with the reason that comes up most.', add: 'Add a SKU', cols: [
        {k: 'sku', label: 'SKU', kind: 'text', w: 140},
        {k: 'sold', label: 'Units sold', kind: 'int', w: 70, foot: 'sum'},
        {k: 'returned', label: 'Units returned', kind: 'int', w: 76, foot: 'sum'},
        {k: 'reason', label: 'Top reason', kind: 'sel', options: REASONS, w: 170},
        {k: 'share', label: 'Top reason share %', kind: 'pct', w: 76},
        {label: 'Return rate', w: 70, v: function (D, i) { return U.fPct(D.ret[i].rate); }},
        {label: 'Above threshold', w: 76, v: function (D, i) { return U.fInt(D.ret[i].above); }},
        {label: 'Fee', w: 70, v: function (D, i) { return U.fMoney(D.ret[i].fee, 0); }},
        {label: 'Status', w: 96, status: function (D, i) { return D.ret[i].status; }}
      ]},
      {type: 'charts', title: 'Why units come back', charts: [
        {kind: 'bars', title: 'Returned units by top reason', sub: 'Top reason share times units returned, all SKUs', data: function (D) { return {items: D.byReason, share: true}; }}
      ]}
    ]},
    {id: 'defect-tracker', title: 'Defect and feedback tracker', badge: function (D) { return D.dOpen ? D.dOpen + ' open' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Open issues', sub: 'Not yet fixed', v: function (D, S) { return S.t.def.length ? String(D.dOpen) : ''; }},
        {label: 'Critical open', sub: 'Safety or total failure', v: function (D, S) { return S.t.def.length ? String(D.dCrit) : ''; }, bad: function (D) { return D.dCrit > 0; }},
        {label: 'Top defect', sub: function (D) { return D.dTop ? U.fInt(D.dTopN) + ' reports' : 'Most reported defect type'; }, v: function (D) { return D.dTop; }}
      ]},
      {type: 'table', k: 'def', title: 'Defect log', help: 'Log each defect pattern once and add to the count as reports come in. Close it when the fix reaches new stock.', add: 'Add a defect', cols: [
        {k: 'date', label: 'First seen', kind: 'date', w: 128},
        {k: 'sku', label: 'SKU', kind: 'text', w: 130},
        {k: 'source', label: 'Source', kind: 'sel', options: ['Review', 'Return comment', 'Customer message', 'Seller feedback', 'A-to-z claim', 'QC inspection'], w: 140},
        {k: 'type', label: 'Defect', kind: 'sel', options: ['Charging or battery', 'Connectivity', 'Sound or display', 'Physical damage', 'Missing parts', 'Instructions unclear', 'Other'], w: 150},
        {k: 'sev', label: 'Severity', kind: 'sel', options: ['Low', 'Medium', 'High', 'Critical'], w: 92, tone: true},
        {k: 'count', label: 'Reports', kind: 'int', w: 62},
        {k: 'cause', label: 'Root cause and fix', kind: 'text', w: 230},
        {k: 'status', label: 'Status', kind: 'sel', options: ['Open', 'In progress', 'Fixed'], w: 104, tone: true}
      ]},
      {type: 'charts', title: 'Defect mix', charts: [
        {kind: 'bars', title: 'Reports by defect type', sub: 'All rows', data: function (D) { return {items: D.byType, share: true}; }}
      ]}
    ]},
    {id: 'warranty-rma', title: 'Warranty and RMA log', badge: function (D) { return D.mOver ? D.mOver + ' overdue' : D.mOpen ? D.mOpen + ' open' : ''; }, sections: [
      {type: 'form', title: 'Service level', fields: [{k: 'sla', label: 'Days to resolve', kind: 'int', def: 7}]},
      {type: 'tiles', items: [
        {label: 'Open cases', sub: 'No close date yet', v: function (D, S) { return S.t.rma.length ? String(D.mOpen) : ''; }},
        {label: 'Overdue', sub: 'Open longer than your service level', v: function (D, S) { return S.t.rma.length ? String(D.mOver) : ''; }, bad: function (D) { return D.mOver > 0; }},
        {label: 'Average days to close', sub: 'Closed cases', v: function (D) { return U.fDec1(D.mAvg); }},
        {label: 'Cost of cases', sub: 'Replacements, refunds and shipping', v: function (D, S) { return S.t.rma.length ? U.fMoney(D.mCost, 0) : ''; }}
      ]},
      {type: 'table', k: 'rma', title: 'Cases', add: 'Add a case', cols: [
        {k: 'id', label: 'Case', kind: 'text', w: 90},
        {k: 'opened', label: 'Opened', kind: 'date', w: 128},
        {k: 'sku', label: 'SKU', kind: 'text', w: 130},
        {k: 'order', label: 'Order ID', kind: 'text', w: 150},
        {k: 'issue', label: 'Issue', kind: 'text', w: 180},
        {k: 'res', label: 'Resolution', kind: 'sel', options: ['Pending', 'Replace', 'Refund', 'Repair', 'Rejected'], w: 100, tone: true},
        {k: 'cost', label: 'Cost', kind: 'money', w: 64, foot: 'sum'},
        {k: 'closed', label: 'Closed', kind: 'date', w: 128},
        {label: 'Days open', w: 60, v: function (D, i) { return U.fInt(D.rma[i].days); }},
        {label: 'Status', w: 88, status: function (D, i) { return D.rma[i].status; }}
      ]}
    ]},
    {id: 'recovery-decision', title: 'Recovery decision', badge: function (D) { return D.bestOpt || ''; }, sections: [
      {type: 'form', title: 'Returned stock', fields: [
        {k: 'qUnits', label: 'Units to decide on', kind: 'int'},
        {k: 'qCost', label: 'Unit cost', kind: 'money'},
        {k: 'qPrice', label: 'New selling price', kind: 'money'},
        {k: 'qFees', label: 'Amazon fees at new price', kind: 'money'}
      ]},
      {type: 'form', title: 'Assumptions', fields: [
        {k: 'gradeShare', label: 'Units sellable as used', kind: 'pct', def: 55},
        {k: 'usedPrice', label: 'Used price, share of new', kind: 'pct', def: 70},
        {k: 'refurbCost', label: 'Refurbish cost per unit', kind: 'money'},
        {k: 'refurbYield', label: 'Refurbish success rate', kind: 'pct', def: 85},
        {k: 'removal', label: 'Removal fee per unit', kind: 'money'},
        {k: 'liq', label: 'Liquidation recovery, share of cost', kind: 'pct', def: 12},
        {k: 'disposal', label: 'Disposal fee per unit', kind: 'money'}
      ]},
      {type: 'table', k: 'opts', title: 'Options compared', help: 'Net per unit is what a returned unit earns under each option, after fees. The best option has the highest net.', fixed: ['Resell as used at FBA', 'Remove and refurbish', 'Liquidate through Amazon', 'Dispose'], cols: [
        {fixedLabel: true, label: 'Option', w: 260, num: false},
        {label: 'How it works', w: 360, num: false, v: function (D, i) { return D.opts[i].how; }},
        {label: 'Net per unit', w: 90, v: function (D, i) { return U.fMoney(D.opts[i].net, 2); }, tone: function (D, i) { return D.opts[i].net < 0 ? 'bad' : ''; }},
        {label: 'Total', w: 90, v: function (D, i) { return U.fMoney(D.opts[i].total, 0); }},
        {label: 'Result', w: 80, status: function (D, i) { return D.opts[i].best ? 'Best' : ''; }}
      ]}
    ]},
    {id: 'account-health', title: 'Account health', badge: function (D) { return D.hLast ? U.fPct(D.hLast.odr) : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Order defect rate', sub: 'Latest week, target under 1%', v: function (D) { return D.hLast ? U.fPct(D.hLast.odr) : ''; }, bad: function (D) { return D.hLast && D.hLast.odr >= 0.01; }},
        {label: 'Policy warnings, 4 weeks', sub: 'Listing, IP or safety', v: function (D, S) { return S.t.health.length ? String(D.hWarn) : ''; }, bad: function (D) { return D.hWarn > 0; }},
        {label: 'Suppressed listings', sub: 'Latest week', v: function (D) { return D.hLastRow ? U.fInt(D.hLastRow.supp) : ''; }, bad: function (D) { return D.hLastRow && D.hLastRow.supp > 0; }}
      ]},
      {type: 'charts', title: 'Trend', charts: [
        {kind: 'line', title: 'Order defect rate by week', sub: 'Against the 1% limit', data: function (D, S) { return {pts: S.t.health.map(function (w, i) { return {label: w.week ? U.fDate(U.toUTC(w.week)).replace(/ \d{4}$/, '') : 'Week ' + (i + 1), y: D.health[i].odr}; }), refs: [{v: 0.01, label: 'Limit'}], fmt: 'pct'}; }}
      ]},
      {type: 'table', k: 'health', title: 'Weekly metrics', help: 'From the Account Health dashboard. One row per week.', add: 'Add a week', cols: [
        {k: 'week', label: 'Week starting', kind: 'date', w: 128},
        {k: 'orders', label: 'Orders', kind: 'int', w: 70},
        {k: 'neg', label: 'Negative feedback', kind: 'int', w: 80},
        {k: 'atoz', label: 'A-to-z claims', kind: 'int', w: 70},
        {k: 'cb', label: 'Chargebacks', kind: 'int', w: 76},
        {k: 'warn', label: 'Policy warnings', kind: 'int', w: 70},
        {k: 'supp', label: 'Suppressed listings', kind: 'int', w: 80},
        {label: 'Defect rate', w: 70, v: function (D, i) { return U.fPct(D.health[i].odr); }},
        {label: 'Status', w: 92, status: function (D, i) { return D.health[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Return rate', v: function (D) { return U.fPct(D.rRate) || 'No data'; }},
    {label: 'Return fee exposure', v: function (D) { return {text: U.fMoney(D.rFee, 0), tone: D.rFee > 0 ? 'warn' : ''}; }},
    {label: 'Critical defects open', v: function (D) { return {text: String(D.dCrit), tone: D.dCrit ? 'bad' : ''}; }},
    {label: 'Warranty cases open', v: function (D) { return String(D.mOpen); }},
    {label: 'Order defect rate', v: function (D) { return D.hLast ? {text: U.fPct(D.hLast.odr), tone: D.hLast.odr >= 0.01 ? 'bad' : ''} : 'No data'; }}
  ],
  headline: function (D) {
    if (D.rRate == null) return {unit: 'Add returns to see the rate'};
    return {num: U.fPct(D.rRate), unit: 'of units returned, last 30 days', status: D.rOver ? 'At risk' : 'OK', note: D.rOver ? D.rOver + ' SKU' + (D.rOver === 1 ? '' : 's') + ' over threshold' : 'all SKUs under threshold'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleBrand'; S.biz.marketplace = 'Amazon.com (US)';
    S.f.thr = 10; S.f.fee = 3.35;
    S.t.ret = W.rows(['sku', 'sold', 'returned', 'reason', 'share'], [
      ['EB-SPK-20-BLK', 1150, 64, 'Defective', 45],
      ['EB-SPK-20-BLU', 210, 9, 'No longer needed', 50],
      ['EB-BUD-PRO-WHT', 1500, 186, 'Not as described', 40],
      ['EB-CHG-65W', 600, 41, 'Incompatible', 55],
      ['EB-CBL-USBC-2M', 1900, 38, 'Defective', 60]
    ]);
    S.t.def = W.rows(['date', 'sku', 'source', 'type', 'sev', 'count', 'cause', 'status'], [
      ['2026-09-30', 'EB-SPK-20-BLK', 'Review', 'Connectivity', 'High', 14, 'Firmware drops pairing after sleep. Fixed in v1.3 for PO-2611-01', 'In progress'],
      ['2026-10-08', 'EB-BUD-PRO-WHT', 'Return comment', 'Sound or display', 'Medium', 22, 'Listing says noise cancelling; it is passive only. Rewrite bullet 2', 'Open'],
      ['2026-10-15', 'EB-CHG-65W', 'Customer message', 'Charging or battery', 'Critical', 3, 'Overheating reported on 3 units. Batch quarantined, lab test booked', 'Open'],
      ['2026-08-20', 'EB-SPK-20-BLK', 'QC inspection', 'Missing parts', 'Low', 6, 'Cable missing. Pack-out checklist added', 'Fixed']
    ]);
    S.t.rma = W.rows(['id', 'opened', 'sku', 'order', 'issue', 'res', 'cost', 'closed'], [
      ['RMA-0412', '2026-10-28', 'EB-SPK-20-BLK', '113-4829174-2291044', 'Will not pair', 'Replace', 18.9, '2026-11-02'],
      ['RMA-0415', '2026-11-03', 'EB-CHG-65W', '112-0039281-7712093', 'Gets hot while charging', 'Refund', 39.99, '2026-11-05'],
      ['RMA-0418', '2026-11-04', 'EB-BUD-PRO-WHT', '114-5590213-8812274', 'Left bud silent', 'Pending', null, ''],
      ['RMA-0420', '2026-11-11', 'EB-SPK-20-BLK', '113-7720041-1199820', 'Crackling at high volume', 'Pending', null, '']
    ]);
    var f = S.f;
    f.qUnits = 120; f.qCost = 14.5; f.qPrice = 49.99; f.qFees = 10.85; f.refurbCost = 4.5; f.removal = 1.17; f.disposal = 0.84;
    S.t.health = W.rows(['week', 'orders', 'neg', 'atoz', 'cb', 'warn', 'supp'], [
      ['2026-10-05', 980, 3, 1, 0, 0, 0],
      ['2026-10-12', 1040, 4, 1, 1, 0, 0],
      ['2026-10-19', 1110, 6, 2, 0, 1, 1],
      ['2026-10-26', 1240, 5, 2, 1, 0, 1],
      ['2026-11-02', 1310, 4, 1, 0, 0, 0]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {}, thr = W.isNum(f.thr) ? f.thr / 100 : null;
    D.ret = S.t.ret.map(function (r) {
      var rate = r.sold > 0 && W.isNum(r.returned) ? r.returned / r.sold : null;
      var above = rate != null && thr != null ? Math.max(0, Math.round(r.returned - thr * r.sold)) : null;
      return {rate: rate, above: above, fee: above != null && W.isNum(f.fee) ? above * f.fee : null,
        status: rate == null ? '' : thr == null ? '' : rate > thr ? 'Over limit' : rate > thr * 0.8 ? 'Watch' : 'OK'};
    });
    var sold = W.sum(S.t.ret.map(function (r) { return r.sold; }));
    D.rUnits = W.sum(S.t.ret.map(function (r) { return r.returned; }));
    D.rRate = sold > 0 ? D.rUnits / sold : null;
    D.rOver = D.ret.filter(function (r) { return r.status === 'Over limit'; }).length;
    D.rFee = W.sum(D.ret.map(function (r) { return r.fee; }));
    var by = {};
    S.t.ret.forEach(function (r) { if (W.isNum(r.returned)) by[r.reason] = (by[r.reason] || 0) + r.returned * (W.isNum(r.share) ? r.share / 100 : 1); });
    D.byReason = Object.keys(by).map(function (k) { return {label: k, v: Math.round(by[k])}; }).sort(function (a, b) { return b.v - a.v; });

    var open = S.t.def.filter(function (d) { return d.status !== 'Fixed'; });
    D.dOpen = open.length;
    D.dCrit = open.filter(function (d) { return d.sev === 'Critical'; }).length;
    var bt = {};
    S.t.def.forEach(function (d) { bt[d.type] = (bt[d.type] || 0) + n0(d.count); });
    D.byType = Object.keys(bt).map(function (k) { return {label: k, v: bt[k]}; }).sort(function (a, b) { return b.v - a.v; });
    D.dTop = D.byType.length && D.byType[0].v > 0 ? D.byType[0].label : '';
    D.dTopN = D.byType.length ? D.byType[0].v : 0;

    var sla = n0(f.sla);
    D.rma = S.t.rma.map(function (r) {
      var o = W.toUTC(r.opened), c = W.toUTC(r.closed);
      if (o == null) return {status: ''};
      var days = Math.round(((c != null ? c : today) - o) / W.DAY);
      return {days: days, closed: c != null, status: c != null ? 'Closed' : days > sla ? 'Overdue' : 'Open'};
    });
    D.mOpen = D.rma.filter(function (r) { return r.status === 'Open' || r.status === 'Overdue'; }).length;
    D.mOver = D.rma.filter(function (r) { return r.status === 'Overdue'; }).length;
    D.mAvg = W.mean(D.rma.filter(function (r) { return r.closed; }).map(function (r) { return r.days; }));
    D.mCost = W.sum(S.t.rma.map(function (r) { return r.cost; }));

    var P = n0(f.qPrice), fee = n0(f.qFees), grade = n0(f.gradeShare) / 100, used = n0(f.usedPrice) / 100;
    var usedNet = P * used - fee * used;
    var resell = grade * usedNet + (1 - grade) * (-n0(f.disposal));
    var yieldR = n0(f.refurbYield) / 100;
    var refurb = yieldR * usedNet - n0(f.refurbCost) - n0(f.removal) - (1 - yieldR) * n0(f.disposal);
    var liq = n0(f.qCost) * n0(f.liq) / 100;
    var disp = -n0(f.disposal);
    var nets = P > 0 ? [resell, refurb, liq, disp] : [null, null, null, null];
    var hows = [
      'Amazon grades the return. The sellable share sells as used, the rest is disposed of.',
      'Remove the units, repair them, and send the working ones back to sell as used.',
      'Amazon sells the units to a liquidator and pays you a share of their value.',
      'Amazon destroys or recycles the units for a fee.'
    ];
    var best = -1;
    nets.forEach(function (v, i) { if (v != null && (best < 0 || v > nets[best])) best = i; });
    D.opts = nets.map(function (v, i) { return {how: hows[i], net: v, total: v == null ? null : v * n0(f.qUnits), best: i === best}; });
    D.bestOpt = best >= 0 ? ['Resell', 'Refurbish', 'Liquidate', 'Dispose'][best] : '';

    D.health = S.t.health.map(function (w) {
      var odr = w.orders > 0 ? (n0(w.neg) + n0(w.atoz) + n0(w.cb)) / w.orders : null;
      return {odr: odr, status: odr == null ? '' : odr >= 0.01 ? 'Critical' : odr >= 0.005 ? 'Watch' : 'Healthy'};
    });
    var rows = S.t.health.map(function (w, i) { return {w: w, d: D.health[i]}; }).filter(function (o) { return o.d.odr != null; });
    rows.sort(function (a, b) { return (a.w.week || '') < (b.w.week || '') ? -1 : 1; });
    D.hLast = rows.length ? rows[rows.length - 1].d : null;
    D.hLastRow = rows.length ? rows[rows.length - 1].w : null;
    D.hWarn = W.sum(rows.slice(-4).map(function (o) { return o.w.warn; }));
    return D;
  }
};
})();
