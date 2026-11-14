(function () {
var U, M = window.MFG;
var LINES = ['Material', 'Inbound freight and duty', 'Material scrap allowance', 'Direct labor', 'Line overhead', 'Packaging and outbound', 'Warranty provision'];
window.SPEC = {
  app: 'mfg-product-cost',
  title: 'Product Cost',
  desc: 'Roll up the standard cost of a device from BOM, labor and overhead, track purchase price variance by part, and run a cost-down plan against a target.',
  notice: 'Every tab is filled with sample data for a portable speaker with 30 parts. Type over it, or start blank.',
  headCap: 'Standard cost per device',
  tones: {good: ['Favorable', 'Done', 'Approved'], warn: ['Idea', 'Testing'], bad: ['Unfavorable', 'Dropped']},
  notes: [
    'Standard cost is the cost a device should have at planned prices and rates. Material comes from the BOM lines; freight and duty and the scrap allowance are a share of material; labor is minutes per device times the labor rate; overhead is a share of labor.',
    'Purchase price variance is actual price less standard cost, times quantity bought. Positive is Unfavorable: you paid more than standard.',
    'Cost-down: yearly saving is saving per unit times quantity per device times devices a year. Count a saving only from its start date; Done means the change is in production.'
  ],
  tabs: [
    {id: 'rollup', title: 'Standard cost roll-up', badge: function (D) { return D.rTotal != null ? U.fMoney(D.rTotal, 2) : ''; }, sections: [
      {type: 'form', title: 'Rates', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']},
        {k: 'freight', label: 'Inbound freight and duty, % of material', kind: 'pct', def: 6},
        {k: 'scrapA', label: 'Scrap allowance, % of material', kind: 'pct', def: 1.5},
        {k: 'laborMin', label: 'Labor minutes per device', kind: 'num'},
        {k: 'laborRate', label: 'Labor cost per hour', kind: 'money'},
        {k: 'oh', label: 'Line overhead, % of labor', kind: 'pct', def: 120},
        {k: 'pack', label: 'Packaging and outbound per device', kind: 'money'},
        {k: 'warr', label: 'Warranty provision per device', kind: 'money'},
        {k: 'price', label: 'Net selling price', kind: 'money'}
      ], stats: [
        {label: 'Standard cost', v: function (D) { return U.fMoney(D.rTotal, 2); }},
        {label: 'Gross margin', v: function (D) { return D.rMargin == null ? '' : {text: U.fPct(D.rMargin), tone: D.rMargin < 0.3 ? 'warn' : ''}; }}
      ]},
      {type: 'table', k: 'roll', title: 'Cost per device', help: 'Calculated from the rates above and the BOM lines below.', fixed: LINES, cols: [
        {fixedLabel: true, label: 'Cost line', w: 240, num: false},
        {label: 'Per device', w: 120, v: function (D, i) { return U.fMoney(D.roll[i], 2); }, foot: function (D) { return U.fMoney(D.rTotal, 2); }},
        {label: 'Share', w: 100, v: function (D, i) { return D.rTotal && D.roll[i] != null ? U.fPct(D.roll[i] / D.rTotal) : ''; }},
        {label: 'Per 1,000 devices', w: 140, v: function (D, i) { return D.roll[i] != null ? U.fMoney(D.roll[i] * 1000, 0) : ''; }},
        {k: 'note', label: 'Notes', kind: 'text', w: 300}
      ]},
      {type: 'table', k: 'bom', title: 'BOM lines at standard cost', help: 'Quantity per device and standard unit cost.', add: 'Add a line', cols: [
        {k: 'part', label: 'Part', kind: 'text', w: 90},
        {k: 'desc', label: 'Description', kind: 'text', w: 220},
        {k: 'qty', label: 'Qty', kind: 'num', w: 60},
        {k: 'cost', label: 'Standard cost', kind: 'num', w: 80},
        {label: 'Extended', w: 80, v: function (D, i) { return U.fMoney(D.bom[i], 2); }, foot: function (D) { return U.fMoney(D.rMat, 2); }},
        {label: 'Share of material', w: 90, v: function (D, i) { return D.rMat && D.bom[i] != null ? U.fPct(D.bom[i] / D.rMat) : ''; }}
      ]},
      {type: 'charts', title: 'Where the cost sits', charts: [
        {kind: 'bars', title: 'Cost per device by line', sub: 'With share', data: function (D) { return {items: LINES.map(function (l, i) { return {label: l, v: D.roll[i]}; }), fmt: 'money2', share: true}; }}
      ]}
    ]},
    {id: 'ppv', title: 'Purchase price variance', badge: function (D) { return D.vTot ? U.signed(U.fMoney(D.vTot, 0), D.vTot) : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Variance', sub: 'All receipts, positive is unfavorable', v: function (D, S) { return S.t.ppv.length ? U.signed(U.fMoney(D.vTot, 0), D.vTot) : ''; }, bad: function (D) { return D.vTot > 0; }},
        {label: 'Spend at actual', sub: 'All receipts', v: function (D, S) { return S.t.ppv.length ? U.fMoney(D.vSpend, 0) : ''; }},
        {label: 'Variance rate', sub: 'Of spend at standard', v: function (D) { return D.vRate == null ? '' : U.signed(U.fPct(D.vRate), D.vRate); }},
        {label: 'Largest variance', sub: function (D) { return D.vTopV != null ? U.signed(U.fMoney(D.vTopV, 0), D.vTopV) : ''; }, v: function (D) { return D.vTop; }}
      ]},
      {type: 'table', k: 'ppv', title: 'Receipts', help: 'One row per part received this period.', add: 'Add a receipt', cols: [
        {k: 'part', label: 'Part', kind: 'text', w: 90},
        {k: 'supplier', label: 'Supplier', kind: 'text', w: 130},
        {k: 'qty', label: 'Quantity', kind: 'int', w: 80},
        {k: 'std', label: 'Standard cost', kind: 'num', w: 80},
        {k: 'act', label: 'Actual price', kind: 'num', w: 80},
        {k: 'why', label: 'Reason', kind: 'text', w: 240},
        {label: 'Price change', w: 80, v: function (D, i) { var c = D.ppv[i].pct; return c == null ? '' : U.signed(U.fPct(c), c); }},
        {label: 'Variance', w: 86, v: function (D, i) { var v = D.ppv[i].v; return v == null ? '' : U.signed(U.fMoney(v, 0), v); }},
        {label: 'Status', w: 96, status: function (D, i) { return D.ppv[i].status; }}
      ]}
    ]},
    {id: 'costdown', title: 'Cost-down tracker', badge: function (D) { return D.cGap != null && D.cGap > 0 ? U.fMoney(D.cGap, 0) + ' to find' : ''; }, sections: [
      {type: 'form', title: 'Target', fields: [
        {k: 'devYear', label: 'Devices a year', kind: 'int'},
        {k: 'target', label: 'Saving target a year', kind: 'money'}
      ], stats: [
        {label: 'Saving in production', v: function (D) { return U.fMoney(D.cDone, 0); }},
        {label: 'Saving in pipeline', v: function (D) { return U.fMoney(D.cPipe, 0); }},
        {label: 'Still to find', v: function (D) { return D.cGap == null ? '' : {text: U.fMoney(Math.max(0, D.cGap), 0), tone: D.cGap > 0 ? 'warn' : ''}; }}
      ]},
      {type: 'table', k: 'cd', title: 'Ideas', help: 'Saving per unit of the part. One-off cost covers tooling, testing and approvals.', add: 'Add an idea', cols: [
        {k: 'idea', label: 'Idea', kind: 'text', w: 230},
        {k: 'part', label: 'Part', kind: 'text', w: 98},
        {k: 'save', label: 'Saving per unit', kind: 'num', w: 76},
        {k: 'qty', label: 'Qty per device', kind: 'num', w: 70},
        {k: 'oneoff', label: 'One-off cost', kind: 'money', w: 80},
        {k: 'start', label: 'Start', kind: 'date', w: 128},
        {k: 'state', label: 'State', kind: 'sel', options: ['Idea', 'Testing', 'Approved', 'Done', 'Dropped'], w: 96, tone: true},
        {label: 'Saving a year', w: 86, v: function (D, i) { return U.fMoney(D.cd[i].year, 0); }},
        {label: 'Payback, months', w: 76, v: function (D, i) { return U.fDec1(D.cd[i].pb); }},
        {label: 'Per device', w: 70, v: function (D, i) { return U.fMoney(D.cd[i].dev, 2); }}
      ]},
      {type: 'charts', title: 'Pipeline', charts: [
        {kind: 'bars', title: 'Yearly saving by idea', sub: 'Ideas not dropped', data: function (D, S) { return {items: S.t.cd.map(function (c, i) { return {label: c.idea || 'Idea ' + (i + 1), v: c.state === 'Dropped' ? null : D.cd[i].year}; }).filter(function (x) { return x.v; }).sort(function (a, b) { return b.v - a.v; }), fmt: 'money', share: true}; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Standard cost per device', v: function (D) { return U.fMoney(D.rTotal, 2) || 'No data'; }},
    {label: 'Material share', v: function (D) { return D.rTotal ? U.fPct(D.rMat / D.rTotal) : 'No data'; }},
    {label: 'Gross margin', v: function (D) { return U.fPct(D.rMargin) || 'No data'; }},
    {label: 'Purchase price variance', v: function (D) { return D.vTot ? {text: U.signed(U.fMoney(D.vTot, 0), D.vTot), tone: D.vTot > 0 ? 'warn' : ''} : 'No data'; }},
    {label: 'Cost-down still to find', v: function (D) { return D.cGap != null ? U.fMoney(Math.max(0, D.cGap), 0) : 'No data'; }}
  ],
  headline: function (D) {
    if (D.rTotal == null) return {unit: 'Add BOM lines and rates'};
    return {num: U.fMoney(D.rTotal, 2), unit: 'standard cost per device', status: D.rMargin != null ? (D.rMargin >= 0.3 ? 'Healthy' : 'Thin margin') : '', note: D.rMargin != null ? U.fPct(D.rMargin) + ' gross margin' : ''};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExamplePlant'; S.biz.marketplace = 'Portable speaker S1';
    var f = S.f; f.currency = '€'; f.freight = 6; f.scrapA = 1.5; f.laborMin = 14; f.laborRate = 32; f.oh = 120; f.pack = 0.9; f.warr = 1.1; f.price = 79;
    S.t.bom = M.BOM.map(function (b) { return {part: b[0], desc: b[1], qty: b[2], cost: b[3]}; });
    S.t.roll[0].note = 'From the BOM lines below'; S.t.roll[3].note = '14 minutes at final assembly, test and pack';
    S.t.ppv = W.rows(['part', 'supplier', 'qty', 'std', 'act', 'why'], [
      ['BAT-PACK', 'Cell Power', 8000, 5.40, 5.95, 'Air freight surcharge on split shipment'],
      ['IC-BT', 'Chip Distributor', 30000, 2.10, 2.02, 'Volume price break'],
      ['DRV-WOOF', 'Acoustic Parts', 12000, 3.20, 3.20, ''],
      ['GRL-MESH', 'Metal Works', 10000, 0.95, 1.04, 'Steel price clause'],
      ['BOX-RET', 'Print Co', 15000, 0.65, 0.61, 'New recycled board'],
      ['PCB-MAIN', 'Board House', 20000, 6.80, 6.90, 'Currency move']
    ]);
    f.devYear = 140000; f.target = 210000;
    var r = function (n) { return M.rel(W, n); };
    S.t.cd = W.rows(['idea', 'part', 'save', 'qty', 'oneoff', 'start', 'state'], [
      ['Second-source Bluetooth chip', 'IC-BT', 0.28, 1, 18000, r(75), 'Testing'],
      ['Combine top housing and grille clip', 'ENC-TOP', 0.12, 1, 42000, r(150), 'Idea'],
      ['Recycled retail box', 'BOX-RET', 0.04, 1, 3000, r(-30), 'Done'],
      ['Battery from second cell supplier', 'BAT-PACK', 0.45, 1, 25000, r(120), 'Approved'],
      ['Fewer screws, snap fit bottom', 'SCR-M2', 0.01, 6, 15000, r(200), 'Idea'],
      ['Thinner grille steel', 'GRL-MESH', 0.07, 1, 6000, r(-80), 'Dropped']
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    D.bom = S.t.bom.map(function (b) { return W.isNum(b.qty) && W.isNum(b.cost) ? b.qty * b.cost : null; });
    var any = D.bom.some(W.isNum);
    D.rMat = any ? W.sum(D.bom) : null;
    if (any) {
      var labor = n0(f.laborMin) / 60 * n0(f.laborRate);
      D.roll = [D.rMat, D.rMat * n0(f.freight) / 100, D.rMat * n0(f.scrapA) / 100, labor, labor * n0(f.oh) / 100, n0(f.pack), n0(f.warr)];
      D.rTotal = W.sum(D.roll);
    } else { D.roll = LINES.map(function () { return null; }); D.rTotal = null; }
    D.rMargin = D.rTotal != null && f.price > 0 ? 1 - D.rTotal / f.price : null;

    D.vTot = 0; D.vSpend = 0; D.vTop = ''; D.vTopV = null;
    var stdSpend = 0;
    D.ppv = S.t.ppv.map(function (p) {
      if (!W.isNum(p.qty) || !W.isNum(p.std) || !W.isNum(p.act)) return {status: ''};
      var v = (p.act - p.std) * p.qty;
      D.vTot += v; D.vSpend += p.act * p.qty; stdSpend += p.std * p.qty;
      if (D.vTopV == null || Math.abs(v) > Math.abs(D.vTopV)) { D.vTopV = v; D.vTop = p.part; }
      return {pct: p.std ? p.act / p.std - 1 : null, v: v, status: v > 0 ? 'Unfavorable' : v < 0 ? 'Favorable' : 'OK'};
    });
    D.vRate = stdSpend ? D.vTot / stdSpend : null;

    D.cDone = 0; D.cPipe = 0;
    D.cd = S.t.cd.map(function (c) {
      if (!W.isNum(c.save)) return {};
      var dev = c.save * n0(c.qty), year = dev * n0(f.devYear), pb = year > 0 ? n0(c.oneoff) / (year / 12) : null;
      if (c.state === 'Done') D.cDone += year; else if (c.state !== 'Dropped') D.cPipe += year;
      return {dev: dev, year: year, pb: pb};
    });
    D.cGap = W.isNum(f.target) ? f.target - D.cDone - D.cPipe : null;
    return D;
  }
};
})();
