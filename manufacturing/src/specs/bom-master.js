(function () {
var U, M = window.MFG;
window.SPEC = {
  app: 'mfg-bom-master',
  title: 'BOM and Master Data',
  desc: 'Keep one bill of materials with cost, lead time, MOQ and sourcing per line, see which parts several products share, and log engineering changes with what happens to old stock.',
  notice: 'Every tab is filled with sample data for a portable speaker with 30 parts. Type over it, or start blank.',
  headCap: 'Material cost per device',
  tones: {good: ['Released', 'Implemented'], warn: ['Long lead', 'Single source', 'In review'], bad: ['Long lead, single source']},
  notes: [
    'Extended cost is quantity per device times unit cost. Long lead flags a part whose lead time is at or above the limit you set; those parts set how far ahead the production plan must be fixed.',
    'Single source means only one approved supplier. A single-source, long-lead part is the biggest supply risk on the BOM: qualify a second source or hold extra stock.',
    'Where-used: a part used in several products is planned on total demand. A change to it needs sign-off from every product that uses it.',
    'Engineering changes: every change names the new BOM revision, the date it takes effect and the plan for old stock (use up, rework or scrap). Scrap value is old stock times unit cost.'
  ],
  tabs: [
    {id: 'bom', title: 'BOM register', badge: function (D) { return D.bLines ? D.bLines + ' lines' : ''; }, sections: [
      {type: 'form', title: 'Product', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']},
        {k: 'rev', label: 'BOM revision', kind: 'text'},
        {k: 'longLead', label: 'Long lead from, weeks', kind: 'int', def: 12}
      ]},
      {type: 'tiles', items: [
        {label: 'Material cost per device', sub: 'All lines', v: function (D) { return D.bLines ? U.fMoney(D.bCost, 2) : ''; }},
        {label: 'Top 5 lines', sub: 'Share of material cost', v: function (D) { return U.fPct(D.bTop5); }},
        {label: 'Long lead lines', sub: function (D) { return D.bMaxLead ? 'Longest ' + D.bMaxLead + ' weeks' : ''; }, v: function (D) { return D.bLines ? String(D.bLong) : ''; }},
        {label: 'Single source, long lead', sub: 'Biggest supply risk', v: function (D) { return D.bLines ? String(D.bRisk) : ''; }, bad: function (D) { return D.bRisk > 0; }}
      ]},
      {type: 'table', k: 'bom', title: 'Bill of materials', help: 'One line per part. Quantity is per finished device; use decimals for shared items such as a carton for six devices.', add: 'Add a line', cols: [
        {k: 'part', label: 'Part', kind: 'text', w: 98},
        {k: 'desc', label: 'Description', kind: 'text', w: 150},
        {k: 'qty', label: 'Qty', kind: 'num', w: 50},
        {k: 'cost', label: 'Unit cost', kind: 'num', w: 64},
        {k: 'lead', label: 'Lead, weeks', kind: 'int', w: 56},
        {k: 'moq', label: 'MOQ', kind: 'int', w: 64},
        {k: 'supplier', label: 'Supplier', kind: 'text', w: 120},
        {k: 'single', label: 'Single source', kind: 'sel', options: ['No', 'Yes'], w: 66},
        {k: 'make', label: 'Make or buy', kind: 'sel', options: ['Buy', 'Make'], w: 74},
        {label: 'Extended cost', w: 70, v: function (D, i) { return U.fMoney(D.bom[i].ext, 2); }, foot: function (D) { return U.fMoney(D.bCost, 2); }},
        {label: 'Share', w: 54, v: function (D, i) { return U.fPct(D.bom[i].share); }},
        {label: 'Flag', w: 150, status: function (D, i) { return D.bom[i].flag; }}
      ]},
      {type: 'charts', title: 'Cost', charts: [
        {kind: 'bars', title: 'Top 10 lines by extended cost', sub: 'With share of material cost', data: function (D, S) { return {items: S.t.bom.map(function (b, i) { return {label: (b.part || '') + ' ' + (b.desc || ''), v: D.bom[i].ext}; }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); }).slice(0, 10), fmt: 'money2', share: true, total: D.bCost}; }}
      ]}
    ]},
    {id: 'whereused', title: 'Where-used', badge: function (D) { return D.wShared ? D.wShared + ' shared parts' : ''; }, sections: [
      {type: 'form', title: 'Products and yearly volume', fields: [
        {k: 'pA', label: 'Product A', kind: 'text'}, {k: 'vA', label: 'Units a year, A', kind: 'int'},
        {k: 'pB', label: 'Product B', kind: 'text'}, {k: 'vB', label: 'Units a year, B', kind: 'int'},
        {k: 'pC', label: 'Product C', kind: 'text'}, {k: 'vC', label: 'Units a year, C', kind: 'int'}
      ]},
      {type: 'tiles', items: [
        {label: 'Parts shared by two or more products', sub: 'Change needs every product to sign off', v: function (D, S) { return S.t.wu.length ? String(D.wShared) : ''; }},
        {label: 'Highest yearly demand', sub: function (D) { return D.wTopN != null ? U.fInt(D.wTopN) + ' a year' : ''; }, v: function (D) { return D.wTop; }}
      ]},
      {type: 'table', k: 'wu', title: 'Parts across products', help: 'Quantity per device in each product. Leave empty where a product does not use the part.', add: 'Add a part', cols: [
        {k: 'part', label: 'Part', kind: 'text', w: 100},
        {k: 'desc', label: 'Description', kind: 'text', w: 200},
        {k: 'qA', label: 'Qty in A', kind: 'num', w: 76},
        {k: 'qB', label: 'Qty in B', kind: 'num', w: 76},
        {k: 'qC', label: 'Qty in C', kind: 'num', w: 76},
        {label: 'Products', w: 70, v: function (D, i) { return U.fInt(D.wu[i].n); }},
        {label: 'Demand a year', w: 100, v: function (D, i) { return U.fInt(D.wu[i].dem); }},
        {label: 'Status', w: 90, status: function (D, i) { return D.wu[i].status; }}
      ]}
    ]},
    {id: 'changes', title: 'Engineering change log', badge: function (D) { return D.eOpen ? D.eOpen + ' open' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Open changes', sub: 'Not yet implemented', v: function (D, S) { return S.t.eco.length ? String(D.eOpen) : ''; }},
        {label: 'Old stock to scrap', sub: 'Value, all changes', v: function (D, S) { return S.t.eco.length ? U.fMoney(D.eScrap, 0) : ''; }, bad: function (D) { return D.eScrap > 0; }},
        {label: 'Past effective date', sub: 'Open and late', v: function (D, S) { return S.t.eco.length ? String(D.eLate) : ''; }, bad: function (D) { return D.eLate > 0; }}
      ]},
      {type: 'table', k: 'eco', title: 'Changes', help: 'One row per engineering change. Old stock is the units of the old part on hand and on order when the change is approved.', add: 'Add a change', cols: [
        {k: 'id', label: 'Change', kind: 'text', w: 70},
        {k: 'part', label: 'Part', kind: 'text', w: 98},
        {k: 'what', label: 'What changes', kind: 'text', w: 220},
        {k: 'revTo', label: 'New revision', kind: 'text', w: 70},
        {k: 'eff', label: 'Effective', kind: 'date', w: 128},
        {k: 'old', label: 'Old stock, units', kind: 'int', w: 76},
        {k: 'oldCost', label: 'Old unit cost', kind: 'num', w: 70},
        {k: 'plan', label: 'Old stock', kind: 'sel', options: ['Use up', 'Rework', 'Scrap'], w: 86},
        {k: 'state', label: 'State', kind: 'sel', options: ['Draft', 'In review', 'Released', 'Implemented'], w: 100, tone: true},
        {label: 'Scrap value', w: 76, v: function (D, i) { return U.fMoney(D.eco[i].scrap, 0); }},
        {label: 'Status', w: 86, status: function (D, i) { return D.eco[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'BOM lines', v: function (D) { return String(D.bLines); }},
    {label: 'Material cost per device', v: function (D) { return U.fMoney(D.bCost, 2) || 'No data'; }},
    {label: 'Longest lead time', v: function (D) { return D.bMaxLead ? D.bMaxLead + ' weeks' : 'No data'; }},
    {label: 'Single source, long lead', v: function (D) { return {text: String(D.bRisk), tone: D.bRisk ? 'warn' : ''}; }},
    {label: 'Open engineering changes', v: function (D) { return String(D.eOpen); }}
  ],
  headline: function (D, S) {
    if (!D.bLines) return {unit: 'Add the bill of materials'};
    return {num: U.fMoney(D.bCost, 2), unit: 'material cost per device', status: S.f.rev ? 'Released' : '', note: D.bLines + ' lines' + (S.f.rev ? ', revision ' + S.f.rev : '')};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExamplePlant'; S.biz.marketplace = 'Portable speaker S1';
    S.f.currency = '€'; S.f.rev = 'C'; S.f.longLead = 12;
    S.t.bom = M.BOM.map(function (b) { return {part: b[0], desc: b[1], qty: b[2], cost: b[3], lead: b[4], moq: b[5], supplier: b[6], single: b[7], make: b[8]}; });
    S.f.pA = 'Speaker S1'; S.f.vA = 120000; S.f.pB = 'Speaker S1 Mini'; S.f.vB = 60000; S.f.pC = 'Soundbar B2'; S.f.vC = 25000;
    S.t.wu = W.rows(['part', 'desc', 'qA', 'qB', 'qC'], [
      ['IC-BT', 'Bluetooth audio chip', 1, 1, 1], ['IC-AMP', 'Class D amplifier chip', 1, 1, 2], ['IC-CHG', 'Battery charger chip', 1, 1, null],
      ['BAT-PACK', 'Battery pack 2600 mAh', 1, null, null], ['DRV-TWT', 'Tweeter 20 mm', 2, 1, 4], ['CON-USBC', 'USB-C connector', 1, 1, 1],
      ['SCR-M2', 'Screw M2 x 6', 12, 8, 16], ['ENC-TOP', 'Top housing', 1, null, null]
    ]);
    var r = function (n) { return M.rel(W, n); };
    S.t.eco = W.rows(['id', 'part', 'what', 'revTo', 'eff', 'old', 'oldCost', 'plan', 'state'], [
      ['EC-041', 'GSK-SEAL', 'Thicker seal after water test failures', 'C', r(-40), 4000, 0.16, 'Scrap', 'Implemented'],
      ['EC-044', 'PCB-MAIN', 'Board rev 3: ESD diode on USB-C', 'D', r(-5), 1800, 6.80, 'Rework', 'Released'],
      ['EC-045', 'BOX-RET', 'New retail box with recycled board', 'D', r(30), 6000, 0.65, 'Use up', 'In review'],
      ['EC-047', 'IC-BT', 'Second-source Bluetooth chip, same footprint', 'D', r(75), 0, 2.10, 'Use up', 'Draft']
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {}, tdy = W.isoOf(today);
    var ll = n0(f.longLead);
    D.bom = S.t.bom.map(function (b) {
      var ext = W.isNum(b.qty) && W.isNum(b.cost) ? b.qty * b.cost : null;
      var long = W.isNum(b.lead) && ll > 0 && b.lead >= ll, single = b.single === 'Yes';
      return {ext: ext, long: long, single: single, flag: long && single ? 'Long lead, single source' : long ? 'Long lead' : single ? 'Single source' : ''};
    });
    D.bLines = S.t.bom.filter(function (b) { return b.part || b.desc; }).length;
    D.bCost = W.sum(D.bom.map(function (x) { return x.ext; }));
    D.bom.forEach(function (x) { x.share = D.bCost && x.ext != null ? x.ext / D.bCost : null; });
    var sorted = D.bom.map(function (x) { return x.ext || 0; }).sort(function (a, b) { return b - a; });
    D.bTop5 = D.bCost ? W.sum(sorted.slice(0, 5)) / D.bCost : null;
    D.bLong = D.bom.filter(function (x) { return x.long; }).length;
    D.bRisk = D.bom.filter(function (x) { return x.long && x.single; }).length;
    var leads = S.t.bom.map(function (b) { return b.lead; }).filter(W.isNum);
    D.bMaxLead = leads.length ? Math.max.apply(null, leads) : null;

    D.wShared = 0; D.wTop = ''; D.wTopN = null;
    D.wu = S.t.wu.map(function (r) {
      var qs = [r.qA, r.qB, r.qC], vs = [f.vA, f.vB, f.vC];
      var n = qs.filter(function (q) { return q > 0; }).length;
      if (!n) return {status: ''};
      var dem = W.sum(qs.map(function (q, i) { return q > 0 ? q * n0(vs[i]) : 0; }));
      if (n > 1) D.wShared++;
      if (D.wTopN == null || dem > D.wTopN) { D.wTopN = dem; D.wTop = r.part; }
      return {n: n, dem: dem, status: n > 1 ? 'Shared' : 'One product'};
    });

    D.eOpen = 0; D.eScrap = 0; D.eLate = 0;
    D.eco = S.t.eco.map(function (e) {
      if (!e.id && !e.part) return {status: ''};
      var scrap = e.plan === 'Scrap' ? n0(e.old) * n0(e.oldCost) : null;
      if (scrap) D.eScrap += scrap;
      var done = e.state === 'Implemented';
      if (!done) D.eOpen++;
      var late = !done && e.eff && W.days(tdy, e.eff) < 0;
      if (late) D.eLate++;
      return {scrap: scrap, status: done ? 'Implemented' : late ? 'Overdue' : 'Open'};
    });
    return D;
  }
};
})();
