(function () {
var U, M = window.MFG;
var LOTS = [2, 9, 16, 26, 51, 91, 151, 281, 501, 1201, 3201, 10001, 35001, 150001];
var NS = [2, 3, 5, 8, 13, 20, 32, 50, 80, 125, 200, 315, 500, 800];
var AC = {
  '0.65': ['d', 'd', 'd', 'd', 'd', 0, 'u', 1, 1, 2, 3, 5, 7, 10],
  '1.0': ['d', 'd', 'd', 'd', 0, 'u', 1, 1, 2, 3, 5, 7, 10, 14],
  '1.5': ['d', 'd', 'd', 0, 'u', 1, 1, 2, 3, 5, 7, 10, 14, 21],
  '2.5': ['d', 'd', 0, 'u', 1, 1, 2, 3, 5, 7, 10, 14, 21, 21],
  '4.0': ['d', 0, 'u', 1, 1, 2, 3, 5, 7, 10, 14, 21, 21, 21]
};
function plan(lot, aql) {
  if (!(lot > 0) || lot > 500000) return null;
  var k = 0; LOTS.forEach(function (v, i) { if (lot >= v) k = i; });
  var row = AC[aql] || AC['1.0'];
  while (row[k] === 'd') k++;
  while (row[k] === 'u') k--;
  return {n: Math.min(NS[k], lot), ac: row[k]};
}
window.SPEC = {
  app: 'mfg-quality',
  title: 'Quality',
  desc: 'Inspect incoming lots with AQL sampling, rank defects by part and cause, run nonconformance and 8D actions to closure, and trace part lots to device serial numbers.',
  notice: 'Every tab is filled with sample data for a portable speaker line. Type over it, or start blank.',
  headCap: 'Incoming lots accepted',
  tones: {good: ['Accept', 'Closed', 'A'], warn: ['D3 containment', 'D4 root cause', 'D5 to D6 fix', 'D7 prevent', 'B'], bad: ['Reject']},
  notes: [
    'Sample size and accept number follow general inspection level II with single sampling, as in ISO 2859-1, for lots up to 500,000. Where the standard points to another plan with an arrow, the workbook uses that plan. Accept the lot when defects found are at or below the accept number.',
    'Defect classes: A is the parts and causes that make up the first 80% of defects, B the next 15%, C the rest.',
    'An 8D runs D1 team, D2 problem, D3 containment, D4 root cause, D5 and D6 fix, D7 prevent recurrence, D8 close. Containment should be in place within 24 hours; root cause within 10 working days.',
    'Traceability links each part lot to the serial numbers it went into. In a recall, the affected serials come from this list, not from the build dates.'
  ],
  tabs: [
    {id: 'incoming', title: 'Incoming inspection', badge: function (D) { return D.iRej ? D.iRej + ' rejected' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Lots inspected', sub: 'All rows', v: function (D, S) { return S.t.lots.length ? String(D.iN) : ''; }},
        {label: 'Accepted', sub: 'Share of lots', v: function (D) { return U.fPct(D.iAcc); }, bad: function (D) { return D.iAcc != null && D.iAcc < 0.95; }},
        {label: 'Rejected', sub: 'Return, sort or concession', v: function (D, S) { return S.t.lots.length ? String(D.iRej) : ''; }, bad: function (D) { return D.iRej > 0; }},
        {label: 'Defect rate in samples', sub: 'Parts per million', v: function (D) { return D.iPpm != null ? U.fInt(D.iPpm) : ''; }}
      ]},
      {type: 'table', k: 'lots', title: 'Lots', help: 'Pick the AQL agreed with the supplier for this part. Sample size and accept number fill in from the lot size.', add: 'Add a lot', cols: [
        {k: 'date', label: 'Date', kind: 'date', w: 128},
        {k: 'part', label: 'Part', kind: 'text', w: 98},
        {k: 'supplier', label: 'Supplier', kind: 'text', w: 120},
        {k: 'lot', label: 'Lot', kind: 'text', w: 86},
        {k: 'size', label: 'Lot size', kind: 'int', w: 70},
        {k: 'aql', label: 'AQL', kind: 'sel', options: ['0.65', '1.0', '1.5', '2.5', '4.0'], w: 64},
        {k: 'found', label: 'Defects found', kind: 'int', w: 66},
        {label: 'Sample', w: 60, v: function (D, i) { return U.fInt(D.lots[i].n); }},
        {label: 'Accept up to', w: 66, v: function (D, i) { return U.fInt(D.lots[i].ac); }},
        {k: 'defect', label: 'Defect seen', kind: 'text', w: 170},
        {label: 'Result', w: 76, status: function (D, i) { return D.lots[i].status; }}
      ]}
    ]},
    {id: 'pareto', title: 'Defect Pareto', badge: function (D) { return D.pA ? D.pA + ' class A' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Defects', sub: 'Line and field, last 30 days', v: function (D, S) { return S.t.def.length ? U.fInt(D.pTot) : ''; }},
        {label: 'Class A', sub: 'First 80% of defects', v: function (D, S) { return S.t.def.length ? String(D.pA) : ''; }},
        {label: 'Top defect', sub: function (D) { return D.pTopShare != null ? U.fPct(D.pTopShare) + ' of all defects' : ''; }, v: function (D) { return D.pTop; }},
        {label: 'Field share', sub: 'Defects found by customers', v: function (D) { return U.fPct(D.pField); }}
      ]},
      {type: 'table', k: 'def', title: 'Defects by part and cause', help: 'One row per part and defect. Line counts come from test; field counts from returns.', add: 'Add a row', cols: [
        {k: 'part', label: 'Part', kind: 'text', w: 98},
        {k: 'defect', label: 'Defect', kind: 'text', w: 200},
        {k: 'cause', label: 'Cause', kind: 'sel', options: ['Supplier', 'Process', 'Design', 'Handling', 'Unknown'], w: 100},
        {k: 'line', label: 'Found on line', kind: 'int', w: 76},
        {k: 'field', label: 'Found in field', kind: 'int', w: 76},
        {label: 'Total', w: 60, v: function (D, i) { return U.fInt(D.def[i].tot); }},
        {label: 'Share', w: 60, v: function (D, i) { return U.fPct(D.def[i].share); }},
        {label: 'Cumulative', w: 76, v: function (D, i) { return U.fPct(D.def[i].cum); }},
        {label: 'Class', w: 60, status: function (D, i) { return D.def[i].cls; }}
      ]},
      {type: 'charts', title: 'Pareto', charts: [
        {kind: 'bars', title: 'Defects by part and defect', sub: 'Largest first, with share', data: function (D, S) { return {items: S.t.def.map(function (r, i) { return {label: (r.part || '') + ' ' + (r.defect || ''), v: D.def[i].tot}; }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); }), fmt: 'int', share: true}; }}
      ]}
    ]},
    {id: 'ncr', title: 'NCR and 8D tracker', badge: function (D) { return D.nOpen ? D.nOpen + ' open' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Open', sub: 'Not yet closed', v: function (D, S) { return S.t.ncr.length ? String(D.nOpen) : ''; }},
        {label: 'Over 30 days open', sub: 'Escalate', v: function (D, S) { return S.t.ncr.length ? String(D.nOld) : ''; }, bad: function (D) { return D.nOld > 0; }},
        {label: 'Average days to close', sub: 'Closed reports', v: function (D) { return U.fDec1(D.nAvg); }}
      ]},
      {type: 'table', k: 'ncr', title: 'Reports', help: 'One row per nonconformance. Move the 8D step as the work progresses.', add: 'Add a report', cols: [
        {k: 'id', label: 'NCR', kind: 'text', w: 70},
        {k: 'opened', label: 'Opened', kind: 'date', w: 128},
        {k: 'part', label: 'Part', kind: 'text', w: 98},
        {k: 'what', label: 'Problem', kind: 'text', w: 220},
        {k: 'owner', label: 'Owner', kind: 'text', w: 100},
        {k: 'step', label: '8D step', kind: 'sel', options: ['D3 containment', 'D4 root cause', 'D5 to D6 fix', 'D7 prevent', 'Closed'], w: 120, tone: true},
        {k: 'closed', label: 'Closed on', kind: 'date', w: 128},
        {label: 'Days open', w: 60, v: function (D, i) { return U.fInt(D.ncr[i].days); }},
        {label: 'Status', w: 86, status: function (D, i) { return D.ncr[i].status; }}
      ]}
    ]},
    {id: 'trace', title: 'Lot traceability', badge: function (D) { return D.tLots ? D.tLots + ' lots' : ''; }, sections: [
      {type: 'form', title: 'Search', fields: [
        {k: 'qLot', label: 'Find part lot', kind: 'text', note: 'Lists the serial ranges it went into'}
      ], stats: [
        {label: 'Devices with this lot', v: function (D) { return D.qN != null ? U.fInt(D.qN) : ''; }},
        {label: 'Serial ranges', v: function (D) { return D.qRanges || ''; }}
      ]},
      {type: 'table', k: 'tr', title: 'Lots to serials', help: 'One row per part lot and serial range it was built into. Serials are numbers so ranges can be counted.', add: 'Add a row', cols: [
        {k: 'part', label: 'Part', kind: 'text', w: 98},
        {k: 'lot', label: 'Part lot', kind: 'text', w: 100},
        {k: 'supplier', label: 'Supplier', kind: 'text', w: 120},
        {k: 'wo', label: 'Work order', kind: 'text', w: 86},
        {k: 'from', label: 'First serial', kind: 'text', w: 90},
        {k: 'to', label: 'Last serial', kind: 'text', w: 90},
        {k: 'date', label: 'Built', kind: 'date', w: 128},
        {label: 'Devices', w: 70, v: function (D, i) { return U.fInt(D.tr[i].n); }},
        {label: 'Match', w: 70, v: function (D, i) { return D.tr[i].hit ? {text: 'Found', tone: 'warn'} : ''; }, num: false}
      ]}
    ]}
  ],
  figs: [
    {label: 'Incoming lots accepted', v: function (D) { return U.fPct(D.iAcc) || 'No data'; }},
    {label: 'Top defect', v: function (D) { return D.pTop || 'No data'; }},
    {label: 'Open NCRs', v: function (D) { return String(D.nOpen); }},
    {label: 'NCRs over 30 days', v: function (D) { return {text: String(D.nOld), tone: D.nOld ? 'warn' : ''}; }},
    {label: 'Lots traced', v: function (D) { return String(D.tLots); }}
  ],
  headline: function (D) {
    if (D.iAcc == null) return {unit: 'Log incoming inspections'};
    return {num: U.fPct(D.iAcc), unit: 'of incoming lots accepted', status: D.iRej ? 'Reject' : 'Accept', note: D.iRej + ' rejected, ' + D.nOpen + ' NCRs open'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExamplePlant'; S.biz.marketplace = 'Portable speaker S1';
    var r = function (n) { return M.rel(W, n); };
    S.t.lots = W.rows(['date', 'part', 'supplier', 'lot', 'size', 'aql', 'found', 'defect'], [
      [r(-9), 'DRV-WOOF', 'Acoustic Parts', 'AP-2231', 12000, '1.0', 9, 'Rub and buzz'],
      [r(-8), 'BOX-RET', 'Print Co', 'PC-8812', 15000, '2.5', 4, 'Color shift'],
      [r(-6), 'GRL-MESH', 'Metal Works', 'MW-0419', 6000, '1.0', 6, 'Dents and burrs'],
      [r(-5), 'BAT-PACK', 'Cell Power', 'CP-5520', 4000, '0.65', 0, ''],
      [r(-3), 'PCB-MAIN', 'Board House', 'BH-1190', 8000, '0.65', 1, 'Solder bridge'],
      [r(-2), 'GSK-SEAL', 'Rubber Parts', 'RP-3307', 14000, '1.0', 2, 'Flash on edge'],
      [r(-1), 'DRV-TWT', 'Acoustic Parts', 'AP-2240', 20000, '1.0', 3, 'Low output']
    ]);
    S.t.def = W.rows(['part', 'defect', 'cause', 'line', 'field'], [
      ['DRV-WOOF', 'Rub and buzz', 'Supplier', 86, 21], ['GSK-SEAL', 'Leak at USB-C port', 'Design', 53, 34], ['PCB-MAIN', 'USB-C solder bridge', 'Process', 58, 3],
      ['BAT-PACK', 'Does not charge to full', 'Supplier', 12, 29], ['GRL-MESH', 'Dent', 'Handling', 44, 6], ['IC-BT', 'Pairing drops', 'Design', 17, 15],
      ['ENC-TOP', 'Scratch', 'Handling', 21, 4], ['LBL-RTG', 'Label missing', 'Process', 4, 0]
    ]);
    S.t.ncr = W.rows(['id', 'opened', 'part', 'what', 'owner', 'step', 'closed'], [
      ['NCR-301', r(-48), 'GSK-SEAL', 'Water test failures at USB-C seal', 'Quality engineer', 'D7 prevent', ''],
      ['NCR-305', r(-21), 'DRV-WOOF', 'Rub and buzz above 0.7% on lot AP-2231', 'Supplier quality', 'D4 root cause', ''],
      ['NCR-307', r(-12), 'PCB-MAIN', 'USB-C solder bridges after stencil change', 'Process engineer', 'D5 to D6 fix', ''],
      ['NCR-296', r(-60), 'BOX-RET', 'Wrong color on retail box', 'Supplier quality', 'Closed', r(-41)],
      ['NCR-299', r(-50), 'ENC-TOP', 'Sink marks after mold repair', 'Molding lead', 'Closed', r(-38)]
    ]);
    S.f.qLot = 'AP-2231';
    S.t.tr = W.rows(['part', 'lot', 'supplier', 'wo', 'from', 'to', 'date'], [
      ['DRV-WOOF', 'AP-2231', 'Acoustic Parts', 'WO-5501', '2401000', '2402599', r(-10)],
      ['DRV-WOOF', 'AP-2231', 'Acoustic Parts', 'WO-5502', '2402600', '2403420', r(-5)],
      ['BAT-PACK', 'CP-5520', 'Cell Power', 'WO-5502', '2402600', '2404239', r(-5)],
      ['PCB-MAIN', 'BH-1190', 'Board House', 'WO-5503', '2404240', '2404849', r(-2)],
      ['GSK-SEAL', 'RP-3307', 'Rubber Parts', 'WO-5503', '2404240', '2404849', r(-2)]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {}, tdy = W.isoOf(today);
    D.iN = 0; D.iRej = 0;
    var sampled = 0, found = 0;
    D.lots = S.t.lots.map(function (l) {
      var p = plan(l.size, l.aql);
      if (!p) return {status: ''};
      if (!W.isNum(l.found)) return {n: p.n, ac: p.ac, status: ''};
      D.iN++; sampled += p.n; found += l.found;
      var ok = l.found <= p.ac;
      if (!ok) D.iRej++;
      return {n: p.n, ac: p.ac, status: ok ? 'Accept' : 'Reject'};
    });
    D.iAcc = D.iN ? (D.iN - D.iRej) / D.iN : null;
    D.iPpm = sampled ? found / sampled * 1e6 : null;

    var tots = S.t.def.map(function (r) { return W.isNum(r.line) || W.isNum(r.field) ? n0(r.line) + n0(r.field) : null; });
    D.pTot = W.sum(tots);
    D.pField = D.pTot ? W.sum(S.t.def.map(function (r) { return r.field; })) / D.pTot : null;
    D.def = tots.map(function (t) { return {tot: t}; });
    var idx = tots.map(function (t, i) { return i; }).filter(function (i) { return tots[i] != null; }).sort(function (a, b) { return tots[b] - tots[a]; });
    var cum = 0;
    idx.forEach(function (i) { var prev = cum; cum += tots[i]; var x = D.def[i]; x.share = tots[i] / D.pTot; x.cum = cum / D.pTot; x.cls = prev / D.pTot < 0.8 ? 'A' : prev / D.pTot < 0.95 ? 'B' : 'C'; });
    D.pA = D.def.filter(function (x) { return x.cls === 'A'; }).length;
    D.pTop = idx.length ? (S.t.def[idx[0]].part || '') + ' ' + (S.t.def[idx[0]].defect || '') : '';
    D.pTopShare = idx.length && D.pTot ? tots[idx[0]] / D.pTot : null;

    D.nOpen = 0; D.nOld = 0;
    var closedDays = [];
    D.ncr = S.t.ncr.map(function (n) {
      if (!n.opened) return {status: ''};
      var closed = n.step === 'Closed', end = closed && n.closed ? n.closed : tdy, days = W.days(n.opened, end);
      if (closed) { closedDays.push(days); return {days: days, status: 'Closed'}; }
      D.nOpen++;
      if (days > 30) D.nOld++;
      return {days: days, status: days > 30 ? 'Overdue' : 'Open'};
    });
    D.nAvg = closedDays.length ? W.mean(closedDays) : null;

    var q = String(f.qLot || '').trim().toLowerCase(), ranges = [];
    D.qN = q ? 0 : null;
    var lots = {};
    D.tr = S.t.tr.map(function (r) {
      var a = parseInt(String(r.from).replace(/\D/g, ''), 10), b = parseInt(String(r.to).replace(/\D/g, ''), 10);
      var n = isFinite(a) && isFinite(b) && b >= a ? b - a + 1 : null;
      if (r.lot) lots[r.lot] = 1;
      var hit = q && String(r.lot || '').trim().toLowerCase() === q;
      if (hit && n != null) { D.qN += n; ranges.push(r.from + ' to ' + r.to); }
      return {n: n, hit: hit};
    });
    D.qRanges = ranges.join(', ');
    D.tLots = Object.keys(lots).length;
    return D;
  }
};
})();
