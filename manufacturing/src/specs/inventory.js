(function () {
var U, M = window.MFG;
window.SPEC = {
  app: 'mfg-inventory',
  title: 'Inventory Control',
  desc: 'Set safety stock and reorder points per part, see days of cover and stock value, measure inventory accuracy from cycle counts, and find excess and obsolete stock.',
  notice: 'Every tab is filled with sample data for a portable speaker with 30 parts. Type over it, or start blank.',
  headCap: 'Inventory value',
  tones: {good: ['Healthy', 'Accurate'], warn: ['Reorder', 'Excess', 'Recount'], bad: ['Below safety', 'Obsolete', 'Inaccurate']},
  notes: [
    'Daily use is quantity per device times devices built per day. Safety stock is z times daily use variation times the square root of lead time in days; the service level sets z. Reorder point is daily use times lead days plus safety stock.',
    'Days of cover is stock on hand over daily use. Excess is cover above the limit you set.',
    'Cycle count: a count is accurate when the difference is within the tolerance. Accuracy is accurate counts over all counts; aim for 98% or better so MRP can be trusted.',
    'Excess and obsolete: stock with no use in the plan (for example after an engineering change) is Obsolete; stock above the excess limit is Excess. The provision rate is the share of value finance writes down.'
  ],
  tabs: [
    {id: 'stock', title: 'Stock and cover', badge: function (D) { return D.sBelow ? D.sBelow + ' below safety' : ''; }, sections: [
      {type: 'form', title: 'Policy', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']},
        {k: 'perDay', label: 'Devices built per day', kind: 'int'},
        {k: 'cv', label: 'Daily use variation', kind: 'pct', def: 25, note: 'Standard deviation over average'},
        {k: 'svc', label: 'Service level', kind: 'pct', def: 97},
        {k: 'excessDays', label: 'Excess above, days of cover', kind: 'int', def: 120}
      ], stats: [
        {label: 'Safety factor z', v: function (D) { return U.fDec2(D.z); }}
      ]},
      {type: 'tiles', items: [
        {label: 'Inventory value', sub: 'All parts at unit cost', v: function (D, S) { return S.t.stock.length ? U.fMoney(D.sValue, 0) : ''; }},
        {label: 'Days of cover', sub: 'Value weighted', v: function (D) { return U.fDec1(D.sCover); }},
        {label: 'Below safety stock', sub: 'Expedite', v: function (D, S) { return S.t.stock.length ? String(D.sBelow) : ''; }, bad: function (D) { return D.sBelow > 0; }},
        {label: 'At reorder point', sub: 'Order now', v: function (D, S) { return S.t.stock.length ? String(D.sReorder) : ''; }}
      ]},
      {type: 'table', k: 'stock', title: 'Parts', help: 'Quantity per device and lead time from the BOM.', add: 'Add a part', cols: [
        {k: 'part', label: 'Part', kind: 'text', w: 98},
        {k: 'qty', label: 'Qty', kind: 'num', w: 50},
        {k: 'lead', label: 'Lead, days', kind: 'int', w: 60},
        {k: 'onhand', label: 'On hand', kind: 'int', w: 70},
        {k: 'cost', label: 'Unit cost', kind: 'num', w: 60},
        {label: 'Use per day', w: 66, v: function (D, i) { return U.fInt(D.stock[i].use); }},
        {label: 'Safety stock', w: 70, v: function (D, i) { return U.fInt(D.stock[i].ss); }},
        {label: 'Reorder point', w: 70, v: function (D, i) { return U.fInt(D.stock[i].rop); }},
        {label: 'Days of cover', w: 66, v: function (D, i) { return U.fDec1(D.stock[i].cover); }},
        {label: 'Value', w: 76, v: function (D, i) { return U.fMoney(D.stock[i].value, 0); }, foot: function (D) { return U.fMoney(D.sValue, 0); }},
        {label: 'Status', w: 96, status: function (D, i) { return D.stock[i].status; }}
      ]},
      {type: 'charts', title: 'Cover', charts: [
        {kind: 'bars', title: 'Days of cover, lowest ten', sub: 'Against lead time', data: function (D, S) { return {items: S.t.stock.map(function (p, i) { return {label: p.part || 'Part ' + (i + 1), v: D.stock[i].cover}; }).filter(function (x) { return x.v != null; }).sort(function (a, b) { return a.v - b.v; }).slice(0, 10), fmt: 'dec1'}; }}
      ]}
    ]},
    {id: 'counts', title: 'Cycle count accuracy', badge: function (D) { return D.cAcc != null ? U.fPct(D.cAcc) + ' accurate' : ''; }, sections: [
      {type: 'form', title: 'Tolerance', fields: [
        {k: 'tol', label: 'Count tolerance', kind: 'pct', def: 2, note: 'Use 0% for high-value parts'},
        {k: 'accTarget', label: 'Accuracy target', kind: 'pct', def: 98}
      ]},
      {type: 'tiles', items: [
        {label: 'Inventory accuracy', sub: 'Counts within tolerance', v: function (D) { return U.fPct(D.cAcc); }, bad: function (D, S) { return D.cAcc != null && D.cAcc * 100 < U.n0(S.f.accTarget); }},
        {label: 'Counts', sub: 'All rows', v: function (D, S) { return S.t.counts.length ? String(D.cN) : ''; }},
        {label: 'Net adjustment', sub: 'Value, all counts', v: function (D, S) { return S.t.counts.length ? U.signed(U.fMoney(D.cNet, 0), D.cNet) : ''; }},
        {label: 'Gross adjustment', sub: 'Value of all differences', v: function (D, S) { return S.t.counts.length ? U.fMoney(D.cGross, 0) : ''; }}
      ]},
      {type: 'table', k: 'counts', title: 'Counts', help: 'Count A parts (high value) monthly, B quarterly, C twice a year.', add: 'Add a count', cols: [
        {k: 'date', label: 'Date', kind: 'date', w: 128},
        {k: 'part', label: 'Part', kind: 'text', w: 98},
        {k: 'loc', label: 'Location', kind: 'text', w: 86},
        {k: 'system', label: 'System qty', kind: 'int', w: 76},
        {k: 'counted', label: 'Counted', kind: 'int', w: 76},
        {k: 'cost', label: 'Unit cost', kind: 'num', w: 60},
        {k: 'reason', label: 'Reason found', kind: 'text', w: 200},
        {label: 'Difference', w: 70, v: function (D, i) { var d = D.counts[i].diff; return d == null ? '' : U.signed(U.fInt(d), d); }},
        {label: 'Difference %', w: 70, v: function (D, i) { return U.fPct(D.counts[i].pct); }},
        {label: 'Value', w: 70, v: function (D, i) { var v = D.counts[i].val; return v == null ? '' : U.signed(U.fMoney(v, 0), v); }},
        {label: 'Status', w: 90, status: function (D, i) { return D.counts[i].status; }}
      ]}
    ]},
    {id: 'eo', title: 'Excess and obsolete', badge: function (D) { return D.eValue ? U.fMoney(D.eValue, 0) + ' at risk' : ''; }, sections: [
      {type: 'form', title: 'Provision', fields: [
        {k: 'provEx', label: 'Provision on excess', kind: 'pct', def: 30},
        {k: 'provOb', label: 'Provision on obsolete', kind: 'pct', def: 100}
      ]},
      {type: 'tiles', items: [
        {label: 'Excess value', sub: 'Above the cover limit', v: function (D, S) { return S.t.eo.length ? U.fMoney(D.eEx, 0) : ''; }},
        {label: 'Obsolete value', sub: 'No use in the plan', v: function (D, S) { return S.t.eo.length ? U.fMoney(D.eOb, 0) : ''; }, bad: function (D) { return D.eOb > 0; }},
        {label: 'Provision', sub: 'At the rates above', v: function (D, S) { return S.t.eo.length ? U.fMoney(D.eProv, 0) : ''; }}
      ]},
      {type: 'table', k: 'eo', title: 'Parts to review', help: 'Use per year is the demand in the current plan. Zero means no product uses the part any more.', add: 'Add a part', cols: [
        {k: 'part', label: 'Part', kind: 'text', w: 98},
        {k: 'desc', label: 'Description', kind: 'text', w: 190},
        {k: 'onhand', label: 'On hand', kind: 'int', w: 70},
        {k: 'cost', label: 'Unit cost', kind: 'num', w: 60},
        {k: 'year', label: 'Use per year', kind: 'int', w: 76},
        {k: 'action', label: 'Action', kind: 'sel', options: ['Keep', 'Use in other product', 'Return to supplier', 'Sell', 'Scrap'], w: 150},
        {label: 'Days of cover', w: 70, v: function (D, i) { return U.fInt(D.eo[i].cover); }},
        {label: 'Excess units', w: 70, v: function (D, i) { return U.fInt(D.eo[i].ex); }},
        {label: 'Value at risk', w: 80, v: function (D, i) { return U.fMoney(D.eo[i].risk, 0); }},
        {label: 'Status', w: 90, status: function (D, i) { return D.eo[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Inventory value', v: function (D) { return U.fMoney(D.sValue, 0) || 'No data'; }},
    {label: 'Days of cover', v: function (D) { return U.fDec1(D.sCover) || 'No data'; }},
    {label: 'Parts below safety stock', v: function (D) { return {text: String(D.sBelow), tone: D.sBelow ? 'bad' : ''}; }},
    {label: 'Inventory accuracy', v: function (D) { return U.fPct(D.cAcc) || 'No data'; }},
    {label: 'Excess and obsolete', v: function (D) { return U.fMoney(D.eValue, 0) || 'No data'; }}
  ],
  headline: function (D, S) {
    if (!S.t.stock.length) return {unit: 'Add parts with stock on hand'};
    return {num: U.fMoney(D.sValue, 0), unit: 'in parts stock', status: D.sBelow ? 'Below safety' : 'Healthy', note: U.fDec1(D.sCover) + ' days of cover, ' + D.sBelow + ' parts below safety'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExamplePlant'; S.biz.marketplace = 'Portable speaker S1';
    var f = S.f; f.currency = '€'; f.perDay = 560; f.cv = 25; f.svc = 97; f.excessDays = 120; f.tol = 2; f.accTarget = 98; f.provEx = 30; f.provOb = 100;
    var oh = {'BAT-PACK': 4200, 'GSK-SEAL': 5200, 'IC-BT': 9000, 'GRL-MESH': 9800, 'SCR-M2': 900000, 'BOX-RET': 95000, 'QSG': 160000, 'IC-AMP': 61000};
    S.t.stock = M.BOM.map(function (b) { return {part: b[0], qty: b[2], lead: b[4] * 7, onhand: oh[b[0]] != null ? oh[b[0]] : Math.round(b[2] * 30000), cost: b[3]}; });
    var r = function (n) { return M.rel(W, n); };
    S.t.counts = W.rows(['date', 'part', 'loc', 'system', 'counted', 'cost', 'reason'], [
      [r(-12), 'IC-BT', 'Cage A1', 9040, 9040, 2.10, ''], [r(-12), 'BAT-PACK', 'Battery room', 4250, 4200, 5.40, 'Scrap not booked'],
      [r(-9), 'DRV-WOOF', 'Rack B4', 30500, 30420, 3.20, ''], [r(-9), 'PCB-MAIN', 'Cage A2', 16000, 15840, 6.80, 'Rework units not booked back'],
      [r(-5), 'GRL-MESH', 'Rack C1', 10200, 9800, 0.95, 'Damaged units moved to quarantine'], [r(-5), 'SCR-M2', 'Line side', 905000, 900000, 0.01, ''],
      [r(-2), 'CON-USBC', 'Cage A1', 30000, 30000, 0.22, ''], [r(-2), 'BOX-RET', 'Rack D2', 95000, 95000, 0.65, '']
    ]);
    S.t.eo = W.rows(['part', 'desc', 'onhand', 'cost', 'year', 'action'], [
      ['GSK-SEAL-B', 'Old waterproof seal, before change EC-041', 3600, 0.16, 0, 'Scrap'],
      ['BOX-RET', 'Retail box, old design after EC-045', 95000, 0.65, 140000, 'Keep'],
      ['QSG', 'Quick start guide', 160000, 0.06, 140000, 'Keep'],
      ['IC-AMP', 'Amplifier chip, last-time buy', 61000, 0.85, 140000, 'Keep'],
      ['PCB-MAIN-R2', 'Main board revision 2', 1200, 6.40, 0, 'Use in other product']
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    var svc = Math.min(0.9999, Math.max(0.5, n0(f.svc) / 100));
    D.z = W.invNorm(svc);
    D.sBelow = 0; D.sReorder = 0; D.sValue = 0;
    var wCover = 0;
    D.stock = S.t.stock.map(function (p) {
      if (!(p.qty > 0) || !W.isNum(p.onhand)) return {status: ''};
      var use = W.isNum(f.perDay) ? p.qty * f.perDay : null, value = p.onhand * n0(p.cost);
      D.sValue += value;
      if (!use) return {value: value, status: ''};
      var ss = D.z * use * n0(f.cv) / 100 * Math.sqrt(n0(p.lead)), rop = use * n0(p.lead) + ss, cover = p.onhand / use;
      wCover += cover * value;
      var status = p.onhand < ss ? 'Below safety' : p.onhand <= rop ? 'Reorder' : cover > n0(f.excessDays) ? 'Excess' : 'Healthy';
      if (status === 'Below safety') D.sBelow++;
      if (status === 'Reorder') D.sReorder++;
      return {use: use, ss: ss, rop: rop, cover: cover, value: value, status: status};
    });
    D.sCover = D.sValue ? wCover / D.sValue : null;

    var tol = n0(f.tol) / 100;
    D.cN = 0; D.cOk = 0; D.cNet = 0; D.cGross = 0;
    D.counts = S.t.counts.map(function (c) {
      if (!W.isNum(c.system) || !W.isNum(c.counted)) return {status: ''};
      D.cN++;
      var diff = c.counted - c.system, pct = c.system ? diff / c.system : null, val = diff * n0(c.cost);
      var ok = pct == null ? diff === 0 : Math.abs(pct) <= tol;
      if (ok) D.cOk++;
      D.cNet += val; D.cGross += Math.abs(val);
      return {diff: diff, pct: pct, val: val, status: ok ? 'Accurate' : Math.abs(pct) <= 2 * tol ? 'Recount' : 'Inaccurate'};
    });
    D.cAcc = D.cN ? D.cOk / D.cN : null;

    D.eEx = 0; D.eOb = 0;
    var lim = n0(f.excessDays);
    D.eo = S.t.eo.map(function (e) {
      if (!W.isNum(e.onhand)) return {status: ''};
      var perDay = n0(e.year) / 365, cover = perDay ? e.onhand / perDay : null;
      if (!perDay) { var v = e.onhand * n0(e.cost); D.eOb += v; return {cover: null, ex: e.onhand, risk: v, status: 'Obsolete'}; }
      var ex = Math.max(0, Math.round(e.onhand - perDay * lim)), risk = ex * n0(e.cost);
      D.eEx += risk;
      return {cover: cover, ex: ex, risk: risk, status: ex > 0 ? 'Excess' : 'Healthy'};
    });
    D.eValue = D.eEx + D.eOb;
    D.eProv = D.eEx * n0(f.provEx) / 100 + D.eOb * n0(f.provOb) / 100;
    return D;
  }
};
})();
