(function () {
var U, M = window.MFG;
window.SPEC = {
  app: 'mfg-procurement',
  title: 'Supply and Procurement',
  desc: 'Track purchase orders against confirmed dates, run the shortage board by devices blocked, score suppliers, and keep a supply risk view of single-source, long-lead and end-of-life parts.',
  notice: 'Every tab is filled with sample data for a portable speaker with 30 parts. Type over it, or start blank.',
  headCap: 'Devices blocked by shortages',
  tones: {good: ['Received', 'On time', 'Strong', 'Low'], warn: ['Partial', 'At risk', 'Fair', 'Medium', 'Arriving'], bad: ['Late', 'Weak', 'High', 'No date']},
  notes: [
    'Delay is the expected date less the confirmed date. Late is more than 7 days; At risk is 1 to 7 days.',
    'Shortage board: devices blocked is the shortfall over quantity per device. Lost output is devices blocked times margin per device, a way to rank shortages, not an accounting figure.',
    'Supplier score is a weighted average of on-time delivery, quality (100 at 0 ppm, 0 at 5,000 ppm), lead time (100 at 2 weeks, 0 at 26) and responsiveness (1 to 5). Strong is 80 or more, Fair 60 to 80, Weak below 60.',
    'Supply risk scores each part from 1 to 5 on four factors: single source, lead time, end-of-life notice and supplier score. High is 12 or more, Medium 8 to 11.'
  ],
  tabs: [
    {id: 'pos', title: 'Purchase order tracker', badge: function (D) { return D.pLate ? D.pLate + ' late' : ''; }, sections: [
      {type: 'form', title: 'Currency', fields: [{k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']}]},
      {type: 'tiles', items: [
        {label: 'Open orders', sub: 'Not fully received', v: function (D, S) { return S.t.pos.length ? String(D.pOpen) : ''; }},
        {label: 'Open value', sub: 'Not yet received', v: function (D, S) { return S.t.pos.length ? U.fMoney(D.pValue, 0) : ''; }},
        {label: 'Late orders', sub: 'More than 7 days behind', v: function (D, S) { return S.t.pos.length ? String(D.pLate) : ''; }, bad: function (D) { return D.pLate > 0; }},
        {label: 'On time, received', sub: 'Received orders within 2 days of confirmed', v: function (D) { return U.fPct(D.pOt); }}
      ]},
      {type: 'table', k: 'pos', title: 'Orders', help: 'One row per order line.', add: 'Add an order', cols: [
        {k: 'po', label: 'PO', kind: 'text', w: 76},
        {k: 'part', label: 'Part', kind: 'text', w: 98},
        {k: 'supplier', label: 'Supplier', kind: 'text', w: 120},
        {k: 'qty', label: 'Ordered', kind: 'int', w: 70},
        {k: 'price', label: 'Unit price', kind: 'num', w: 64},
        {k: 'conf', label: 'Confirmed', kind: 'date', w: 128},
        {k: 'exp', label: 'Expected', kind: 'date', w: 128},
        {k: 'recv', label: 'Received', kind: 'int', w: 70},
        {label: 'Delay, days', w: 60, v: function (D, i) { var d = D.pos[i].delay; return d == null ? '' : U.signed(U.fInt(d), d); }},
        {label: 'Open value', w: 76, v: function (D, i) { return U.fMoney(D.pos[i].value, 0); }, foot: function (D) { return U.fMoney(D.pValue, 0); }},
        {label: 'Status', w: 84, status: function (D, i) { return D.pos[i].status; }}
      ]}
    ]},
    {id: 'shortages', title: 'Shortage board', badge: function (D) { return D.sDev ? U.fInt(D.sDev) + ' devices blocked' : ''; }, sections: [
      {type: 'form', title: 'Margin', fields: [
        {k: 'margin', label: 'Margin per device', kind: 'money', note: 'Selling price less variable cost'}
      ]},
      {type: 'tiles', items: [
        {label: 'Devices blocked', sub: 'Largest single shortage', v: function (D, S) { return S.t.short.length ? U.fInt(D.sDev) : ''; }, bad: function (D) { return D.sDev > 0; }},
        {label: 'Lost output', sub: 'Largest shortage, at the margin per device', v: function (D, S) { return S.t.short.length ? U.fMoney(D.sLost, 0) : ''; }},
        {label: 'No recovery date', sub: 'Shortages to chase', v: function (D, S) { return S.t.short.length ? String(D.sNoDate) : ''; }, bad: function (D) { return D.sNoDate > 0; }}
      ]},
      {type: 'table', k: 'short', title: 'Shortages', help: 'Short is units needed for the firm build less units on hand and arriving in time.', add: 'Add a shortage', cols: [
        {k: 'part', label: 'Part', kind: 'text', w: 98},
        {k: 'qty', label: 'Qty per device', kind: 'num', w: 66},
        {k: 'short', label: 'Units short', kind: 'int', w: 70},
        {k: 'eta', label: 'Recovery date', kind: 'date', w: 128},
        {k: 'action', label: 'Action', kind: 'text', w: 230},
        {k: 'owner', label: 'Owner', kind: 'text', w: 90},
        {label: 'Devices blocked', w: 76, v: function (D, i) { return U.fInt(D.short[i].dev); }},
        {label: 'Days to recover', w: 70, v: function (D, i) { return U.fInt(D.short[i].wait); }},
        {label: 'Lost output', w: 80, v: function (D, i) { return U.fMoney(D.short[i].lost, 0); }},
        {label: 'Status', w: 84, status: function (D, i) { return D.short[i].status; }}
      ]}
    ]},
    {id: 'suppliers', title: 'Supplier scorecard', badge: function (D) { return D.cWeak ? D.cWeak + ' weak' : ''; }, sections: [
      {type: 'form', title: 'Weights', fields: [
        {k: 'wOt', label: 'On-time delivery', kind: 'pct', def: 35},
        {k: 'wQ', label: 'Quality', kind: 'pct', def: 35},
        {k: 'wLt', label: 'Lead time', kind: 'pct', def: 15},
        {k: 'wR', label: 'Responsiveness', kind: 'pct', def: 15}
      ]},
      {type: 'tiles', items: [
        {label: 'Strong', sub: '80 or more', v: function (D, S) { return S.t.sup.length ? String(D.cStrong) : ''; }},
        {label: 'Fair', sub: '60 to 80', v: function (D, S) { return S.t.sup.length ? String(D.cFair) : ''; }},
        {label: 'Weak', sub: 'Below 60', v: function (D, S) { return S.t.sup.length ? String(D.cWeak) : ''; }, bad: function (D) { return D.cWeak > 0; }}
      ]},
      {type: 'table', k: 'sup', title: 'Suppliers', help: 'Use the last 6 months.', add: 'Add a supplier', cols: [
        {k: 'name', label: 'Supplier', kind: 'text', w: 130},
        {k: 'parts', label: 'Parts', kind: 'text', w: 170},
        {k: 'spend', label: 'Spend a year', kind: 'money', w: 86},
        {k: 'ot', label: 'On time %', kind: 'pct', w: 66},
        {k: 'ppm', label: 'Defects, ppm', kind: 'int', w: 70},
        {k: 'lt', label: 'Lead, weeks', kind: 'int', w: 60},
        {k: 'resp', label: 'Response 1 to 5', kind: 'int', w: 70},
        {label: 'Score', w: 60, v: function (D, i) { return U.fInt(D.sup[i].score); }},
        {label: 'Rating', w: 76, status: function (D, i) { return D.sup[i].status; }}
      ]},
      {type: 'charts', title: 'Ranking', charts: [
        {kind: 'bars', title: 'Supplier score', sub: '0 to 100', data: function (D, S) { return {items: S.t.sup.map(function (s, i) { return {label: s.name || 'Supplier ' + (i + 1), v: D.sup[i].score}; }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); }), fmt: 'int'}; }}
      ]}
    ]},
    {id: 'risk', title: 'Supply risk view', badge: function (D) { return D.rHigh ? D.rHigh + ' high' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'High risk parts', sub: 'Score 12 or more', v: function (D, S) { return S.t.risk.length ? String(D.rHigh) : ''; }, bad: function (D) { return D.rHigh > 0; }},
        {label: 'End-of-life notices', sub: 'Last-time buy pending', v: function (D, S) { return S.t.risk.length ? String(D.rEol) : ''; }},
        {label: 'Last-time buy value', sub: 'All end-of-life parts', v: function (D, S) { return S.t.risk.length ? U.fMoney(D.rLtb, 0) : ''; }}
      ]},
      {type: 'table', k: 'risk', title: 'Parts', help: 'Rate each factor from 1 (low) to 5 (high). For an end-of-life part, enter the units needed until the redesign is in production.', add: 'Add a part', cols: [
        {k: 'part', label: 'Part', kind: 'text', w: 98},
        {k: 'src', label: 'Single source 1 to 5', kind: 'int', w: 76},
        {k: 'lead', label: 'Lead time 1 to 5', kind: 'int', w: 70},
        {k: 'eol', label: 'End of life 1 to 5', kind: 'int', w: 70},
        {k: 'supp', label: 'Supplier 1 to 5', kind: 'int', w: 70},
        {k: 'ltbQty', label: 'Last-time buy units', kind: 'int', w: 80},
        {k: 'ltbCost', label: 'Unit cost', kind: 'num', w: 60},
        {k: 'mit', label: 'Mitigation', kind: 'text', w: 230},
        {label: 'Score', w: 56, v: function (D, i) { return U.fInt(D.risk[i].score); }},
        {label: 'Risk', w: 76, status: function (D, i) { return D.risk[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Open purchase orders', v: function (D) { return String(D.pOpen); }},
    {label: 'Late orders', v: function (D) { return {text: String(D.pLate), tone: D.pLate ? 'warn' : ''}; }},
    {label: 'Devices blocked', v: function (D) { return {text: U.fInt(D.sDev), tone: D.sDev ? 'bad' : ''}; }},
    {label: 'Weak suppliers', v: function (D) { return {text: String(D.cWeak), tone: D.cWeak ? 'warn' : ''}; }},
    {label: 'High risk parts', v: function (D) { return {text: String(D.rHigh), tone: D.rHigh ? 'warn' : ''}; }}
  ],
  headline: function (D, S) {
    if (!S.t.short.length) return {num: '0', unit: 'devices blocked by shortages', status: 'OK'};
    return {num: U.fInt(D.sDev), unit: 'devices blocked by shortages', status: D.sDev ? 'Short' : 'OK', note: D.pLate + ' late orders, ' + D.rHigh + ' high risk parts'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExamplePlant'; S.biz.marketplace = 'Portable speaker S1';
    var r = function (n) { return M.rel(W, n); };
    S.f.currency = '€'; S.f.margin = 18;
    S.t.pos = W.rows(['po', 'part', 'supplier', 'qty', 'price', 'conf', 'exp', 'recv'], [
      ['PO-7101', 'BAT-PACK', 'Cell Power', 8000, 5.40, r(4), r(16), 0],
      ['PO-7102', 'IC-BT', 'Chip Distributor', 30000, 2.10, r(10), r(10), 0],
      ['PO-7103', 'GSK-SEAL', 'Rubber Parts', 14000, 0.18, r(3), r(5), 0],
      ['PO-7104', 'PCB-MAIN', 'Board House', 20000, 6.80, r(30), r(30), 0],
      ['PO-7090', 'DRV-WOOF', 'Acoustic Parts', 12000, 3.20, r(-20), r(-18), 12000],
      ['PO-7091', 'GRL-MESH', 'Metal Works', 10000, 0.95, r(-12), r(-3), 6000],
      ['PO-7092', 'BOX-RET', 'Print Co', 15000, 0.65, r(-9), r(-9), 15000]
    ]);
    S.t.short = W.rows(['part', 'qty', 'short', 'eta', 'action', 'owner'], [
      ['BAT-PACK', 1, 1100, r(16), 'Split shipment: 3,000 by air this week', 'Buyer, battery'],
      ['GRL-MESH', 1, 400, r(6), 'Balance of PO-7091 promised next week', 'Buyer, mechanics'],
      ['LBL-RTG', 1, 2000, '', 'New label with updated rating, artwork not approved', 'Compliance']
    ]);
    S.t.sup = W.rows(['name', 'parts', 'spend', 'ot', 'ppm', 'lt', 'resp'], [
      ['Board House', 'Main board, LED board', 980000, 94, 600, 10, 4],
      ['Chip Distributor', 'Chips, USB-C, NFC', 520000, 88, 150, 22, 3],
      ['Acoustic Parts', 'Drivers, radiators', 590000, 96, 900, 8, 5],
      ['Cell Power', 'Battery pack', 650000, 71, 2400, 12, 2],
      ['Metal Works', 'Grille', 115000, 78, 1800, 7, 3],
      ['Print Co', 'Boxes, labels, guides', 210000, 98, 300, 3, 5]
    ]);
    S.t.risk = W.rows(['part', 'src', 'lead', 'eol', 'supp', 'ltbQty', 'ltbCost', 'mit'], [
      ['IC-BT', 5, 5, 1, 2, null, null, 'Second-source chip in engineering change EC-047'],
      ['BAT-PACK', 5, 3, 1, 4, null, null, 'Qualify a second cell supplier, hold 4 weeks of stock'],
      ['IC-AMP', 2, 4, 5, 2, 60000, 0.85, 'Last-time buy, redesign to new amplifier by next year'],
      ['DRV-WOOF', 5, 2, 1, 1, null, null, 'Tooling copy at second supplier'],
      ['GRL-MESH', 5, 2, 1, 3, null, null, 'Quote from two more metal shops']
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {}, tdy = W.isoOf(today);
    D.pOpen = 0; D.pLate = 0; D.pValue = 0;
    var recvN = 0, recvOt = 0;
    D.pos = S.t.pos.map(function (p) {
      if (!W.isNum(p.qty)) return {status: ''};
      var open = Math.max(0, p.qty - n0(p.recv)), delay = p.conf && p.exp ? W.days(p.conf, p.exp) : null, value = open * n0(p.price);
      if (!open) { recvN++; if (delay != null && delay <= 2) recvOt++; return {delay: delay, value: 0, status: 'Received'}; }
      D.pOpen++; D.pValue += value;
      var status = n0(p.recv) > 0 ? 'Partial' : delay > 7 ? 'Late' : delay > 0 ? 'At risk' : 'On time';
      if (status === 'Late') D.pLate++;
      return {delay: delay, value: value, status: status};
    });
    D.pOt = recvN ? recvOt / recvN : null;

    D.sDev = 0; D.sLost = 0; D.sNoDate = 0;
    D.short = S.t.short.map(function (s) {
      if (!(s.qty > 0) || !W.isNum(s.short)) return {status: ''};
      var dev = Math.ceil(s.short / s.qty), wait = s.eta ? Math.max(0, W.days(tdy, s.eta)) : null;
      D.sDev = Math.max(D.sDev, dev);
      var lost = dev * n0(f.margin);
      D.sLost = Math.max(D.sLost, lost);
      if (wait == null) D.sNoDate++;
      return {dev: dev, wait: wait, lost: lost, status: wait == null ? 'No date' : wait <= 7 ? 'Arriving' : 'Short'};
    });

    var wts = [f.wOt, f.wQ, f.wLt, f.wR].map(n0), clamp = function (v) { return Math.max(0, Math.min(100, v)); };
    D.cStrong = 0; D.cFair = 0; D.cWeak = 0;
    D.sup = S.t.sup.map(function (s) {
      if (!W.isNum(s.ot)) return {status: ''};
      var parts = [[clamp(s.ot), wts[0]], [W.isNum(s.ppm) ? clamp(100 - s.ppm / 50) : null, wts[1]], [W.isNum(s.lt) ? clamp(100 - (s.lt - 2) / 24 * 100) : null, wts[2]], [W.isNum(s.resp) ? clamp((s.resp - 1) * 25) : null, wts[3]]].filter(function (x) { return x[0] != null && x[1] > 0; });
      var ws = W.sum(parts.map(function (x) { return x[1]; }));
      var score = ws ? W.sum(parts.map(function (x) { return x[0] * x[1]; })) / ws : null;
      var status = score == null ? '' : score >= 80 ? 'Strong' : score >= 60 ? 'Fair' : 'Weak';
      if (status === 'Strong') D.cStrong++; else if (status === 'Fair') D.cFair++; else if (status === 'Weak') D.cWeak++;
      return {score: score, status: status};
    });

    D.rHigh = 0; D.rEol = 0; D.rLtb = 0;
    D.risk = S.t.risk.map(function (r) {
      var fs = [r.src, r.lead, r.eol, r.supp].filter(W.isNum);
      if (!fs.length) return {status: ''};
      var score = W.sum(fs);
      if (n0(r.eol) >= 4) { D.rEol++; D.rLtb += n0(r.ltbQty) * n0(r.ltbCost); }
      var status = score >= 12 ? 'High' : score >= 8 ? 'Medium' : 'Low';
      if (status === 'High') D.rHigh++;
      return {score: score, status: status};
    });
    return D;
  }
};
})();
