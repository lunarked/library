(function () {
var U;
var PO_STATUS = ['Draft', 'Deposit paid', 'In production', 'QC booked', 'Ready', 'Shipped', 'Closed'];
window.SPEC = {
  app: 'sourcing-suppliers',
  title: 'Sourcing and Suppliers',
  desc: 'Score supplier quotes, track purchase orders through production, log QC inspections, and find the cheapest order size across price breaks.',
  notice: 'Every tab is filled with sample data for a speaker and its suppliers. Type over it, or start blank.',
  headCap: 'Open purchase orders',
  tones: {good: ['Best'], warn: ['Deposit paid', 'In production', 'QC booked']},
  notes: [
    'Supplier scores compare each quote with the best one: the lowest price, shortest lead time and lowest MOQ each score 5, and the others score in proportion. Sample quality, communication and certifications are your own 1 to 5 ratings.',
    'An inspection fails on any critical defect, or when major or minor defects exceed the numbers your AQL plan allows for that sample size.',
    'The order size model weighs the unit price at each break against the cost of placing orders and holding stock, and picks the lowest total cost per year.'
  ],
  tabs: [
    {id: 'supplier-rfq', title: 'Supplier RFQ scorecard', badge: function (D) { return D.best ? 'best: ' + D.best : ''; }, sections: [
      {type: 'form', title: 'Weights', help: 'Rescaled to 100, so only the proportions matter.', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['$', '€', '£']},
        {k: 'wPrice', label: 'Price', kind: 'pct', def: 30},
        {k: 'wQual', label: 'Sample quality', kind: 'pct', def: 25},
        {k: 'wLead', label: 'Lead time', kind: 'pct', def: 15},
        {k: 'wMoq', label: 'MOQ', kind: 'pct', def: 10},
        {k: 'wComm', label: 'Communication', kind: 'pct', def: 10},
        {k: 'wCert', label: 'Certifications', kind: 'pct', def: 10}
      ]},
      {type: 'table', k: 'sups', title: 'Supplier quotes', help: 'One row per quote for the same product spec. Rate sample quality, communication and certifications from 1 to 5.', add: 'Add a supplier', cols: [
        {k: 'name', label: 'Supplier', kind: 'text', w: 150},
        {k: 'city', label: 'City', kind: 'text', w: 92},
        {k: 'price', label: 'Unit price', kind: 'money', w: 70},
        {k: 'moq', label: 'MOQ', kind: 'int', w: 64},
        {k: 'lead', label: 'Lead days', kind: 'int', w: 60},
        {k: 'qual', label: 'Sample quality', kind: 'sel', options: ['', '1', '2', '3', '4', '5'], w: 64},
        {k: 'comm', label: 'Commun\u00ADication', kind: 'sel', options: ['', '1', '2', '3', '4', '5'], w: 64},
        {k: 'cert', label: 'Certs', kind: 'sel', options: ['', '1', '2', '3', '4', '5'], w: 64},
        {k: 'terms', label: 'Payment terms', kind: 'text', w: 130},
        {label: 'Score', w: 56, v: function (D, i) { return U.fInt(D.sups[i].score); }},
        {label: 'Rating', w: 92, status: function (D, i) { return D.sups[i].status; }}
      ]},
      {type: 'charts', title: 'Scores', charts: [
        {kind: 'bars', title: 'Weighted score by supplier', sub: 'Out of 100', data: function (D, S) { return {items: S.t.sups.map(function (r, i) { return {label: r.name || 'Supplier ' + (i + 1), v: D.sups[i].score}; })}; }}
      ]}
    ]},
    {id: 'po-tracker', title: 'PO and production tracker', badge: function (D) { return D.late ? D.late + ' late' : D.open + ' open'; }, sections: [
      {type: 'tiles', items: [
        {label: 'Open POs', sub: 'Not yet shipped or closed', v: function (D, S) { return S.t.pos.length ? String(D.open) : ''; }},
        {label: 'Open PO value', sub: 'Units times unit cost', v: function (D, S) { return S.t.pos.length ? U.fMoney(D.openValue, 0) : ''; }},
        {label: 'Balance still to pay', sub: 'Value minus deposits, open POs', v: function (D, S) { return S.t.pos.length ? U.fMoney(D.balance, 0) : ''; }},
        {label: 'Late POs', sub: 'Past ex-factory date and not ready', v: function (D, S) { return S.t.pos.length ? String(D.late) : ''; }, bad: function (D) { return D.late > 0; }}
      ]},
      {type: 'table', k: 'pos', title: 'Purchase orders', help: 'Update the status as each PO moves. Late means the ex-factory date has passed and goods are not ready.', add: 'Add a PO', cols: [
        {k: 'po', label: 'PO', kind: 'text', w: 104},
        {k: 'sup', label: 'Supplier', kind: 'text', w: 108},
        {k: 'sku', label: 'SKU', kind: 'text', w: 120},
        {k: 'units', label: 'Units', kind: 'int', w: 64, foot: 'sum'},
        {k: 'cost', label: 'Unit cost', kind: 'money', w: 64},
        {k: 'dep', label: 'Deposit %', kind: 'pct', w: 60, def: 30},
        {k: 'placed', label: 'Placed', kind: 'date', w: 128},
        {k: 'exf', label: 'Ex-factory', kind: 'date', w: 128},
        {k: 'status', label: 'Stage', kind: 'sel', options: PO_STATUS, w: 120, tone: true},
        {label: 'Value', w: 76, v: function (D, i) { return U.fMoney(D.pos[i].value, 0); }, foot: function (D) { return U.fMoney(D.poValue, 0); }},
        {label: 'Days to ex-factory', w: 70, v: function (D, i) { return U.fInt(D.pos[i].left); }},
        {label: 'Status', w: 96, status: function (D, i) { return D.pos[i].flag; }}
      ]}
    ]},
    {id: 'qc-log', title: 'QC inspection log', badge: function (D) { return D.qcN ? U.fPct(D.passRate) + ' pass' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Inspections', sub: 'Rows with a sample size', v: function (D) { return D.qcN ? String(D.qcN) : ''; }},
        {label: 'Pass rate', sub: 'Share of inspections passed', v: function (D) { return U.fPct(D.passRate); }, bad: function (D) { return D.passRate < 0.8; }},
        {label: 'Average defect rate', sub: 'Major and minor defects over units checked', v: function (D) { return U.fPct(D.defRate); }},
        {label: 'Latest result', sub: function (D) { return D.lastPo || 'Most recent inspection'; }, v: function (D) { return D.lastResult; }, bad: function (D) { return D.lastResult === 'Fail'; }}
      ]},
      {type: 'table', k: 'qc', title: 'Inspections', help: 'Allowed major and minor come from your AQL table for the sample size, for example AQL 2.5 major and 4.0 minor at General Inspection Level II.', add: 'Add an inspection', cols: [
        {k: 'date', label: 'Date', kind: 'date', w: 128},
        {k: 'po', label: 'PO', kind: 'text', w: 100},
        {k: 'by', label: 'Inspector', kind: 'text', w: 110},
        {k: 'sample', label: 'Sample size', kind: 'int', w: 64},
        {k: 'crit', label: 'Critical', kind: 'int', w: 60},
        {k: 'maj', label: 'Major', kind: 'int', w: 56},
        {k: 'min', label: 'Minor', kind: 'int', w: 56},
        {k: 'amaj', label: 'Allowed major', kind: 'int', w: 64},
        {k: 'amin', label: 'Allowed minor', kind: 'int', w: 64},
        {k: 'notes', label: 'Main finding', kind: 'text', w: 170},
        {label: 'Defect rate', w: 64, v: function (D, i) { return U.fPct(D.qc[i].rate); }},
        {label: 'Result', w: 80, status: function (D, i) { return D.qc[i].result; }}
      ]}
    ]},
    {id: 'moq-price-breaks', title: 'MOQ and price breaks', badge: function (D) { return D.bestQ ? U.fInt(D.bestQ) + ' units' : ''; }, sections: [
      {type: 'form', title: 'Demand and costs', fields: [
        {k: 'annual', label: 'Units per year', kind: 'int'},
        {k: 'orderCost', label: 'Cost per order', kind: 'money', note: 'Inspection, freight booking, admin'},
        {k: 'hold', label: 'Holding cost per year', kind: 'pct', note: 'Storage, capital and risk, as % of unit price', def: 25}
      ]},
      {type: 'tiles', items: [
        {label: 'Best order size', sub: function (D) { return D.bestQ ? 'At ' + U.fMoney(D.bestPrice, 2) + ' per unit' : 'Lowest total cost per year'; }, v: function (D) { return U.fInt(D.bestQ); }},
        {label: 'Total cost per year', sub: 'Goods, ordering and holding', v: function (D) { return U.fMoney(D.bestCost, 0); }},
        {label: 'Saving against the first break', sub: 'Per year', v: function (D) { return U.fMoney(D.moqSaving, 0); }},
        {label: 'Orders per year', sub: 'At the best order size', v: function (D) { return U.fDec1(D.ordersYear); }}
      ]},
      {type: 'table', k: 'breaks', title: 'Price breaks', help: 'One row per break, lowest quantity first. The order size is the economic order quantity at that price, raised to the break if needed.', add: 'Add a break', cols: [
        {k: 'min', label: 'From units', kind: 'int', w: 90},
        {k: 'price', label: 'Unit price', kind: 'money', w: 90},
        {label: 'Order size', w: 90, v: function (D, i) { return U.fInt(D.breaks[i].q); }},
        {label: 'Goods per year', w: 100, v: function (D, i) { return U.fMoney(D.breaks[i].goods, 0); }},
        {label: 'Ordering per year', w: 100, v: function (D, i) { return U.fMoney(D.breaks[i].ord, 0); }},
        {label: 'Holding per year', w: 100, v: function (D, i) { return U.fMoney(D.breaks[i].holdC, 0); }},
        {label: 'Total per year', w: 100, v: function (D, i) { return U.fMoney(D.breaks[i].total, 0); }, tone: function (D, i) { return D.breaks[i].best ? 'good' : ''; }},
        {label: 'Result', w: 80, status: function (D, i) { return D.breaks[i].best ? 'Best' : ''; }}
      ]},
      {type: 'charts', title: 'Cost by break', charts: [
        {kind: 'bars', title: 'Total cost per year by price break', sub: 'Lower is better', data: function (D, S) { return {items: S.t.breaks.map(function (r, i) { return {label: 'From ' + U.fInt(r.min), v: D.breaks[i].total}; }), fmt: 'money'}; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Best supplier', v: function (D) { return D.best || 'None yet'; }},
    {label: 'Open PO value', v: function (D) { return U.fMoney(D.openValue, 0); }},
    {label: 'Balance to pay', v: function (D) { return U.fMoney(D.balance, 0); }},
    {label: 'QC pass rate', v: function (D) { return D.qcN ? U.fPct(D.passRate) : 'No data'; }},
    {label: 'Best order size', v: function (D) { return D.bestQ ? U.fInt(D.bestQ) + ' units' : 'No data'; }}
  ],
  headline: function (D, S) {
    return {num: String(D.open), unit: 'open POs, ' + U.fMoney(D.openValue, 0), status: D.late ? 'Late' : S.t.pos.length ? 'On track' : '', note: D.late ? D.late + ' past ex-factory' : ''};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleBrand'; S.biz.marketplace = 'Amazon.com (US)';
    S.t.sups = W.rows(['name', 'city', 'price', 'moq', 'lead', 'qual', 'comm', 'cert', 'terms'], [
      ['Shenzhen Audio Tech', 'Shenzhen', 10.8, 1000, 30, '4', '5', '5', '30% deposit, 70% before shipping'],
      ['Dongguan Sound Co.', 'Dongguan', 9.9, 2000, 40, '3', '3', '4', '30/70'],
      ['Ningbo Acoustic', 'Ningbo', 11.4, 500, 25, '5', '4', '4', '50/50'],
      ['Hanoi Electronics', 'Hanoi', 11.9, 1500, 45, '4', '3', '3', '30/70, net 30 after BL']
    ]);
    S.t.pos = W.rows(['po', 'sup', 'sku', 'units', 'cost', 'dep', 'placed', 'exf', 'status'], [
      ['PO-2609-02', 'Shenzhen Audio Tech', 'EB-SPK-20-BLK', 2000, 10.8, 30, '2026-09-10', '2026-10-15', 'Closed'],
      ['PO-2610-04', 'Shenzhen Audio Tech', 'EB-SPK-20-BLU', 1000, 10.8, 30, '2026-10-12', '2026-11-10', 'In production'],
      ['PO-2611-01', 'Shenzhen Audio Tech', 'EB-SPK-20-BLK', 1500, 10.6, 30, '2026-11-05', '2026-12-08', 'Deposit paid'],
      ['PO-2611-03', 'Ningbo Acoustic', 'EB-SPK-MINI', 800, 7.4, 50, '2026-11-12', '2026-12-15', 'Draft']
    ]);
    S.t.qc = W.rows(['date', 'po', 'by', 'sample', 'crit', 'maj', 'min', 'amaj', 'amin', 'notes'], [
      ['2026-07-28', 'PO-2607-01', 'QIMA', 125, 0, 2, 5, 7, 10, 'Logo print slightly off-center'],
      ['2026-10-13', 'PO-2609-02', 'QIMA', 125, 0, 9, 6, 7, 10, 'Bluetooth pairing fails on 9 units'],
      ['2026-10-20', 'PO-2609-02 re-inspection', 'QIMA', 125, 0, 3, 4, 7, 10, 'Firmware fix confirmed']
    ]);
    S.f.annual = 18000; S.f.orderCost = 650; S.f.hold = 25;
    S.t.breaks = W.rows(['min', 'price'], [[500, 11.6], [1000, 10.8], [3000, 10.3], [5000, 9.95]]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    var w = [f.wPrice, f.wQual, f.wLead, f.wMoq, f.wComm, f.wCert].map(n0), ws = W.sum(w) || 1;
    var minOf = function (k) { var v = S.t.sups.map(function (r) { return r[k]; }).filter(function (x) { return W.isNum(x) && x > 0; }); return v.length ? Math.min.apply(null, v) : null; };
    var mp = minOf('price'), ml = minOf('lead'), mm = minOf('moq');
    D.sups = S.t.sups.map(function (r) {
      if (!(r.price > 0)) return {status: ''};
      var parts = [5 * mp / r.price, n0(Number(r.qual)), r.lead > 0 ? 5 * ml / r.lead : 0, r.moq > 0 ? 5 * mm / r.moq : 0, n0(Number(r.comm)), n0(Number(r.cert))];
      var score = W.roundTo(parts.reduce(function (a, p, j) { return a + p / 5 * w[j]; }, 0) / ws * 100, 0);
      return {score: score, status: score >= 75 ? 'Strong' : score >= 60 ? 'Fair' : 'Weak'};
    });
    var bi = -1;
    D.sups.forEach(function (x, i) { if (x.score != null && (bi < 0 || x.score > D.sups[bi].score)) bi = i; });
    D.best = bi >= 0 ? S.t.sups[bi].name : '';

    D.pos = S.t.pos.map(function (p) {
      var value = W.isNum(p.units) && W.isNum(p.cost) ? p.units * p.cost : null;
      var ex = W.toUTC(p.exf), left = ex == null ? null : Math.round((ex - today) / W.DAY);
      var done = ['Shipped', 'Closed'].indexOf(p.status) >= 0, ready = p.status === 'Ready';
      var flag = p.status === 'Closed' ? 'Closed' : done ? 'Shipped' : left == null ? '' : left < 0 && !ready ? 'Late' : left <= 14 && !ready ? 'Due soon' : 'On track';
      return {value: value, left: done ? null : left, flag: flag, open: !done, paidDep: p.status !== 'Draft'};
    });
    D.poValue = W.sum(D.pos.map(function (p) { return p.value; }));
    var open = D.pos.filter(function (p) { return p.open; });
    D.open = open.length;
    D.openValue = W.sum(open.map(function (p) { return p.value; }));
    D.balance = W.sum(D.pos.map(function (p, i) { return p.open ? n0(p.value) * (1 - (p.paidDep ? n0(S.t.pos[i].dep) / 100 : 0)) : 0; }));
    D.late = D.pos.filter(function (p) { return p.flag === 'Late'; }).length;

    D.qc = S.t.qc.map(function (q) {
      if (!(q.sample > 0)) return {result: ''};
      var fail = n0(q.crit) > 0 || (W.isNum(q.amaj) && n0(q.maj) > q.amaj) || (W.isNum(q.amin) && n0(q.min) > q.amin);
      return {rate: (n0(q.maj) + n0(q.min)) / q.sample, result: fail ? 'Fail' : 'Pass'};
    });
    var done = D.qc.filter(function (q) { return q.result; });
    D.qcN = done.length;
    D.passRate = D.qcN ? done.filter(function (q) { return q.result === 'Pass'; }).length / D.qcN : null;
    D.defRate = W.mean(done.map(function (q) { return q.rate; }));
    var li = -1;
    S.t.qc.forEach(function (q, i) { if (D.qc[i].result && (li < 0 || (q.date || '') >= (S.t.qc[li].date || ''))) li = i; });
    D.lastResult = li >= 0 ? D.qc[li].result : '';
    D.lastPo = li >= 0 ? S.t.qc[li].po : '';

    var A = n0(f.annual), K = n0(f.orderCost), h = n0(f.hold) / 100;
    var rows = S.t.breaks;
    D.breaks = rows.map(function (b, i) {
      if (!(b.price > 0) || !(A > 0) || !(h > 0)) return {};
      var eoq = Math.sqrt(2 * A * K / (h * b.price));
      var next = rows.slice(i + 1).map(function (r) { return r.min; }).filter(W.isNum).sort(function (x, y) { return x - y; })[0];
      var q = Math.max(n0(b.min), eoq);
      if (next != null && q >= next) q = next - 1;
      if (q < n0(b.min)) return {};
      q = Math.ceil(q);
      var goods = A * b.price, ord = A / q * K, holdC = q / 2 * h * b.price;
      return {q: q, goods: goods, ord: ord, holdC: holdC, total: goods + ord + holdC};
    });
    var bb = -1;
    D.breaks.forEach(function (b, i) { if (b.total != null && (bb < 0 || b.total < D.breaks[bb].total)) bb = i; });
    if (bb >= 0) D.breaks[bb].best = true;
    D.bestQ = bb >= 0 ? D.breaks[bb].q : null;
    D.bestPrice = bb >= 0 ? rows[bb].price : null;
    D.bestCost = bb >= 0 ? D.breaks[bb].total : null;
    D.moqSaving = bb >= 0 && D.breaks[0] && D.breaks[0].total != null ? D.breaks[0].total - D.bestCost : null;
    D.ordersYear = D.bestQ ? A / D.bestQ : null;
    return D;
  }
};
})();
