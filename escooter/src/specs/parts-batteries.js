(function () {
var U;
var MODELS = ['S2', 'S3', 'Both'];
function rel(W, n) { var d = new Date(); return W.isoOf(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + n * W.DAY); }
window.SPEC = {
  app: 'esc-parts-batteries',
  title: 'Parts and Batteries',
  desc: 'Plan spare parts from failure rates and fleet size per model, run the critical shortage board, plan battery replacement and make cannibalization visible.',
  notice: 'Every tab is filled with sample data for a fleet of two models. Type over it, or start blank.',
  headCap: 'Parts to order now',
  tones: {good: ['Restored'], warn: ['Replace soon', 'Arriving'], bad: ['Replace now', 'No date', 'Donor down']},
  notes: [
    'Weekly demand is the failure rate per 1,000 vehicles per week times the fleet of the models that use the part, divided by 1,000. Take failure rates from the fault code list, per model, over the last 8 weeks.',
    'Order point is demand over the lead time plus safety weeks. Order now when stock on hand plus on order is below it. The order quantity brings cover back to lead time plus safety plus the review period.',
    'Lost revenue on the shortage board is vehicles waiting times net revenue per vehicle per day times the days until the part arrives.',
    'Battery state of health falls with every charge cycle. Weeks to replacement are the cycles left until the replacement threshold, at the current cycles per week. Lithium-ion packs ship as dangerous goods: UN3480 on their own, UN3481 when packed with or inside the vehicle.',
    'Cannibalization takes a part from one vehicle to fix another. Each open row is a vehicle out of service that the shortage board does not show.'
  ],
  tabs: [
    {id: 'demand', title: 'Parts demand planner', badge: function (D) { return D.dNow ? D.dNow + ' to order now' : ''; }, sections: [
      {type: 'form', title: 'Fleet and policy', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']},
        {k: 'fleetS2', label: 'Active fleet, model S2', kind: 'int'},
        {k: 'fleetS3', label: 'Active fleet, model S3', kind: 'int'},
        {k: 'review', label: 'Review period, weeks', kind: 'int', def: 2, note: 'How often you place parts orders'}
      ]},
      {type: 'tiles', items: [
        {label: 'Order now', sub: 'Below the order point', v: function (D, S) { return S.t.parts.length ? String(D.dNow) : ''; }, bad: function (D) { return D.dNow > 0; }},
        {label: 'Order soon', sub: 'Within 2 weeks of the order point', v: function (D, S) { return S.t.parts.length ? String(D.dSoon) : ''; }},
        {label: 'Order value', sub: 'All order now lines', v: function (D, S) { return S.t.parts.length ? U.fMoney(D.dValue, 0) : ''; }},
        {label: 'Stock value', sub: 'On hand, at unit cost', v: function (D, S) { return S.t.parts.length ? U.fMoney(D.dStock, 0) : ''; }}
      ]},
      {type: 'table', k: 'parts', title: 'Parts', help: 'Model says which fleet uses the part. Lead time is order to shelf, in weeks.', add: 'Add a part', cols: [
        {k: 'part', label: 'Part', kind: 'text', w: 150},
        {k: 'model', label: 'Model', kind: 'sel', options: MODELS, w: 70},
        {k: 'rate', label: 'Failures per 1,000 per week', kind: 'num', w: 86},
        {k: 'lead', label: 'Lead time, weeks', kind: 'int', w: 70},
        {k: 'safety', label: 'Safety weeks', kind: 'int', w: 62},
        {k: 'onhand', label: 'On hand', kind: 'int', w: 64},
        {k: 'onorder', label: 'On order', kind: 'int', w: 64},
        {k: 'cost', label: 'Unit cost', kind: 'money', w: 66},
        {label: 'Per week', w: 60, v: function (D, i) { return U.fDec1(D.parts[i].wk); }},
        {label: 'Cover, weeks', w: 64, v: function (D, i) { return U.fDec1(D.parts[i].cover); }},
        {label: 'Order point', w: 64, v: function (D, i) { return U.fInt(D.parts[i].rop); }},
        {label: 'Order qty', w: 64, v: function (D, i) { return U.fInt(D.parts[i].qty); }},
        {label: 'Status', w: 96, status: function (D, i) { return D.parts[i].status; }}
      ]},
      {type: 'charts', title: 'Cover', charts: [
        {kind: 'bars', title: 'Weeks of cover by part', sub: 'Stock on hand plus on order over weekly demand', data: function (D, S) { return {items: S.t.parts.map(function (p, i) { return {label: (p.part || 'Part ' + (i + 1)) + ' (' + p.model + ')', v: D.parts[i].cover}; }).sort(function (a, b) { return (a.v == null ? 1e9 : a.v) - (b.v == null ? 1e9 : b.v); }), fmt: 'dec1'}; }}
      ]}
    ]},
    {id: 'shortages', title: 'Critical shortage board', badge: function (D) { return D.bVeh ? D.bVeh + ' vehicles waiting' : ''; }, sections: [
      {type: 'form', title: 'Revenue at stake', fields: [
        {k: 'revDay', label: 'Net revenue per vehicle per day', kind: 'money', note: 'From the Unit Economics workbook'}
      ]},
      {type: 'tiles', items: [
        {label: 'Vehicles waiting', sub: 'Awaiting parts, all shortages', v: function (D, S) { return S.t.short.length ? U.fInt(D.bVeh) : ''; }, bad: function (D) { return D.bVeh > 0; }},
        {label: 'Revenue lost per day', sub: 'While they wait', v: function (D, S) { return S.t.short.length ? U.fMoney(D.bDay, 0) : ''; }},
        {label: 'Revenue lost until arrival', sub: 'All shortages with a date', v: function (D, S) { return S.t.short.length ? U.fMoney(D.bLost, 0) : ''; }},
        {label: 'No arrival date', sub: 'Shortages to chase', v: function (D, S) { return S.t.short.length ? String(D.bNoDate) : ''; }, bad: function (D) { return D.bNoDate > 0; }}
      ]},
      {type: 'table', k: 'short', title: 'Shortages', help: 'One row per part that is blocking vehicles. Review it in the weekly ops meeting, biggest loss first.', add: 'Add a shortage', cols: [
        {k: 'part', label: 'Part', kind: 'text', w: 150},
        {k: 'model', label: 'Model', kind: 'sel', options: MODELS, w: 70},
        {k: 'veh', label: 'Vehicles waiting', kind: 'int', w: 70, foot: 'sum'},
        {k: 'since', label: 'Short since', kind: 'date', w: 128},
        {k: 'eta', label: 'Expected arrival', kind: 'date', w: 128},
        {k: 'fix', label: 'Workaround', kind: 'text', w: 170},
        {k: 'owner', label: 'Owner', kind: 'text', w: 86},
        {label: 'Days short', w: 56, v: function (D, i) { return U.fInt(D.short[i].age); }},
        {label: 'Days to arrival', w: 60, v: function (D, i) { return U.fInt(D.short[i].wait); }},
        {label: 'Revenue lost', w: 74, v: function (D, i) { return U.fMoney(D.short[i].lost, 0); }, foot: function (D) { return U.fMoney(D.bLost, 0); }},
        {label: 'Status', w: 84, status: function (D, i) { return D.short[i].status; }}
      ]}
    ]},
    {id: 'batteries', title: 'Battery health and replacement', badge: function (D) { return D.yNow ? D.yNow + ' cohorts now' : ''; }, sections: [
      {type: 'form', title: 'Policy', fields: [
        {k: 'sohMin', label: 'Replace at state of health', kind: 'pct', def: 70},
        {k: 'packCost', label: 'Cost per new pack', kind: 'money'},
        {k: 'horizon', label: 'Plan horizon, weeks', kind: 'int', def: 26}
      ]},
      {type: 'tiles', items: [
        {label: 'Packs to replace now', sub: 'At or below the threshold', v: function (D, S) { return S.t.bat.length ? U.fInt(D.yNowPacks) : ''; }, bad: function (D) { return D.yNowPacks > 0; }},
        {label: 'Packs within horizon', sub: function (D, S) { return 'Next ' + (S.f.horizon || 0) + ' weeks'; }, v: function (D, S) { return S.t.bat.length ? U.fInt(D.yHorPacks) : ''; }},
        {label: 'Budget within horizon', sub: 'Now plus horizon, at pack cost', v: function (D, S) { return S.t.bat.length ? U.fMoney(D.yBudget, 0) : ''; }},
        {label: 'Packs tracked', sub: 'All cohorts', v: function (D, S) { return S.t.bat.length ? U.fInt(D.yPacks) : ''; }}
      ]},
      {type: 'table', k: 'bat', title: 'Battery cohorts', help: 'Group packs by model and delivery batch. State of health and cycles come from the battery management system.', add: 'Add a cohort', cols: [
        {k: 'cohort', label: 'Cohort', kind: 'text', w: 110},
        {k: 'model', label: 'Model', kind: 'sel', options: MODELS, w: 70},
        {k: 'packs', label: 'Packs', kind: 'int', w: 64, foot: 'sum'},
        {k: 'cycles', label: 'Average cycles', kind: 'int', w: 70},
        {k: 'soh', label: 'State of health %', kind: 'pct', w: 76},
        {k: 'loss', label: 'Health lost per 100 cycles %', kind: 'num', w: 90},
        {k: 'perWeek', label: 'Cycles per week', kind: 'num', w: 70},
        {label: 'Cycles left', w: 64, v: function (D, i) { return U.fInt(D.bat[i].left); }},
        {label: 'Weeks left', w: 60, v: function (D, i) { return U.fDec1(D.bat[i].weeks); }},
        {label: 'Replace by', w: 100, v: function (D, i) { return D.bat[i].date; }, num: false},
        {label: 'Cost', w: 80, v: function (D, i) { return U.fMoney(D.bat[i].cost, 0); }},
        {label: 'Status', w: 100, status: function (D, i) { return D.bat[i].status; }}
      ]}
    ]},
    {id: 'cannibal', title: 'Cannibalization log', badge: function (D) { return D.kOpen ? D.kOpen + ' donors down' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Donors still down', sub: 'Part not yet replaced', v: function (D, S) { return S.t.cann.length ? String(D.kOpen) : ''; }, bad: function (D) { return D.kOpen > 0; }},
        {label: 'Vehicle days lost', sub: 'Donor days out of service, all rows', v: function (D, S) { return S.t.cann.length ? U.fInt(D.kDays) : ''; }},
        {label: 'Average days down', sub: 'Per donor', v: function (D) { return U.fDec1(D.kAvg); }},
        {label: 'Most taken part', sub: function (D) { return D.kTopN ? D.kTopN + ' times' : ''; }, v: function (D) { return D.kTop; }}
      ]},
      {type: 'table', k: 'cann', title: 'Parts taken', help: 'Log every part taken from one vehicle to fix another. Fill in Restored when the donor is fixed.', add: 'Add a row', cols: [
        {k: 'date', label: 'Date', kind: 'date', w: 128},
        {k: 'part', label: 'Part', kind: 'text', w: 140},
        {k: 'donor', label: 'Donor vehicle', kind: 'text', w: 90},
        {k: 'recv', label: 'Fixed vehicle', kind: 'text', w: 90},
        {k: 'reason', label: 'Reason', kind: 'sel', options: ['Part out of stock', 'City SLA at risk', 'High-earning zone', 'Other'], w: 140},
        {k: 'by', label: 'Approved by', kind: 'text', w: 90},
        {k: 'back', label: 'Donor restored', kind: 'date', w: 128},
        {label: 'Days down', w: 60, v: function (D, i) { return U.fInt(D.cann[i].days); }},
        {label: 'Status', w: 96, status: function (D, i) { return D.cann[i].status; }}
      ]},
      {type: 'charts', title: 'Hidden shortages', charts: [
        {kind: 'bars', title: 'Times taken by part', sub: 'All rows', data: function (D) { return {items: D.kBy, fmt: 'int', share: true}; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Parts to order now', v: function (D) { return {text: String(D.dNow), tone: D.dNow ? 'warn' : ''}; }},
    {label: 'Vehicles awaiting parts', v: function (D) { return U.fInt(D.bVeh); }},
    {label: 'Revenue lost per day', v: function (D) { return U.fMoney(D.bDay, 0) || 'No data'; }},
    {label: 'Battery packs to replace now', v: function (D) { return U.fInt(D.yNowPacks); }},
    {label: 'Donors still down', v: function (D) { return String(D.kOpen); }}
  ],
  headline: function (D, S) {
    if (!S.t.parts.length) return {unit: 'Add parts to the demand planner'};
    return {num: String(D.dNow), unit: D.dNow === 1 ? 'part to order now' : 'parts to order now', status: D.dNow ? 'Order now' : 'OK', note: U.fMoney(D.dValue, 0) + ' to order, ' + U.fInt(D.bVeh) + ' vehicles waiting for parts'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleMobility'; S.biz.marketplace = 'Germany and Austria';
    var f = S.f; f.fleetS2 = 6800; f.fleetS3 = 1100; f.review = 2; f.revDay = 9.2; f.sohMin = 70; f.packCost = 210; f.horizon = 26;
    S.t.parts = W.rows(['part', 'model', 'rate', 'lead', 'safety', 'onhand', 'onorder', 'cost'], [
      ['Inner tube 10 inch', 'S2', 9.5, 3, 2, 420, 300, 2.8],
      ['Brake pads, pair', 'Both', 6.0, 4, 2, 620, 0, 3.5],
      ['Folding joint kit', 'S2', 3.2, 8, 3, 130, 0, 14],
      ['Controller', 'S2', 1.4, 10, 3, 160, 100, 62],
      ['IoT module', 'Both', 1.2, 12, 4, 95, 0, 48],
      ['Motor wheel', 'S3', 2.0, 10, 3, 85, 40, 115],
      ['Front light', 'Both', 2.5, 6, 2, 210, 0, 9]
    ]);
    S.t.short = W.rows(['part', 'model', 'veh', 'since', 'eta', 'fix', 'owner'], [
      ['IoT module', 'Both', 64, rel(W, -12), rel(W, 9), 'Refurbish failed units from the bench', 'Parts lead'],
      ['Folding joint kit', 'S2', 41, rel(W, -6), rel(W, 21), 'Air freight 100 kits', 'Buyer'],
      ['Motor wheel', 'S3', 18, rel(W, -3), '', 'Warranty swap with OEM', 'NPI lead'],
      ['Rear fender', 'S2', 9, rel(W, -2), rel(W, 4), 'Ride without fender is not allowed', 'Buyer']
    ]);
    S.t.bat = W.rows(['cohort', 'model', 'packs', 'cycles', 'soh', 'loss', 'perWeek'], [
      ['P-2023-04', 'S2', 1300, 760, 71, 3.8, 5.5],
      ['P-2024-03', 'S2', 1650, 560, 79, 3.7, 5.2],
      ['P-2024-09', 'S2', 1600, 450, 83, 3.6, 5.0],
      ['P-2025-04', 'S2', 1750, 320, 88, 3.6, 5.3],
      ['P-2026-03', 'S3', 1250, 120, 97, 2.4, 4.8]
    ]);
    S.t.cann = W.rows(['date', 'part', 'donor', 'recv', 'reason', 'by', 'back'], [
      [rel(W, -20), 'IoT module', 'BER-2231', 'BER-1180', 'Part out of stock', 'Workshop lead', rel(W, -4)],
      [rel(W, -15), 'IoT module', 'BER-2675', 'BER-0912', 'Part out of stock', 'Workshop lead', ''],
      [rel(W, -11), 'Folding joint kit', 'HAM-0450', 'HAM-1032', 'City SLA at risk', 'City manager', ''],
      [rel(W, -8), 'IoT module', 'BER-3110', 'BER-2004', 'High-earning zone', 'Workshop lead', ''],
      [rel(W, -5), 'Controller', 'MUC-0771', 'MUC-1450', 'Part out of stock', 'Workshop lead', rel(W, -1)]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    var fleetOf = function (m) { return m === 'S2' ? n0(f.fleetS2) : m === 'S3' ? n0(f.fleetS3) : n0(f.fleetS2) + n0(f.fleetS3); };
    D.dNow = 0; D.dSoon = 0; D.dValue = 0;
    D.parts = S.t.parts.map(function (p) {
      if (!W.isNum(p.rate)) return {status: ''};
      var wk = p.rate * fleetOf(p.model) / 1000, pos = n0(p.onhand) + n0(p.onorder);
      var rop = wk * (n0(p.lead) + n0(p.safety));
      var cover = wk > 0 ? pos / wk : null;
      var target = wk * (n0(p.lead) + n0(p.safety) + n0(f.review));
      var status = pos < rop ? 'Order now' : pos < rop + 2 * wk ? 'Order soon' : 'OK';
      var qty = status === 'OK' ? 0 : Math.ceil(target - pos);
      if (status === 'Order now') { D.dNow++; D.dValue += qty * n0(p.cost); }
      if (status === 'Order soon') D.dSoon++;
      return {wk: wk, cover: cover, rop: rop, qty: qty, status: status};
    });
    D.dStock = W.sum(S.t.parts.map(function (p) { return n0(p.onhand) * n0(p.cost); }));

    var tdy = W.isoOf(today);
    D.bNoDate = 0;
    D.short = S.t.short.map(function (r) {
      if (!W.isNum(r.veh)) return {status: ''};
      var wait = r.eta ? Math.max(0, W.days(tdy, r.eta)) : null;
      if (wait == null) D.bNoDate++;
      return {age: r.since ? W.days(r.since, tdy) : null, wait: wait, lost: wait != null ? r.veh * n0(f.revDay) * wait : null, status: wait == null ? 'No date' : wait <= 7 ? 'Arriving' : 'Short'};
    });
    D.bVeh = W.sum(S.t.short.map(function (r) { return r.veh; }));
    D.bDay = D.bVeh * n0(f.revDay);
    D.bLost = W.sum(D.short.map(function (x) { return x.lost; }));

    D.yNow = 0; D.yNowPacks = 0; D.yHorPacks = 0;
    D.bat = S.t.bat.map(function (b) {
      if (!W.isNum(b.soh)) return {status: ''};
      var left = b.loss > 0 ? Math.max(0, (b.soh - n0(f.sohMin)) / b.loss * 100) : null;
      var weeks = left != null && b.perWeek > 0 ? left / b.perWeek : null;
      var date = weeks != null ? U.fDate(today + Math.round(weeks * 7) * W.DAY) : '';
      var status = b.soh <= n0(f.sohMin) || weeks === 0 ? 'Replace now' : weeks != null && weeks <= n0(f.horizon) ? 'Replace soon' : 'Healthy';
      if (status === 'Replace now') { D.yNow++; D.yNowPacks += n0(b.packs); }
      if (status === 'Replace soon') D.yHorPacks += n0(b.packs);
      return {left: left, weeks: weeks, date: date, cost: status !== 'Healthy' ? n0(b.packs) * n0(f.packCost) : null, status: status};
    });
    D.yPacks = W.sum(S.t.bat.map(function (b) { return b.packs; }));
    D.yBudget = (D.yNowPacks + D.yHorPacks) * n0(f.packCost);

    var by = {};
    D.kOpen = 0;
    D.cann = S.t.cann.map(function (r) {
      if (!r.date) return {status: ''};
      var end = r.back || tdy, days = Math.max(0, W.days(r.date, end));
      if (!r.back) D.kOpen++;
      if (r.part) by[r.part] = n0(by[r.part]) + 1;
      return {days: days, status: r.back ? 'Restored' : 'Donor down'};
    });
    D.kDays = W.sum(D.cann.map(function (x) { return x.days; }));
    var nRows = D.cann.filter(function (x) { return x.days != null; }).length;
    D.kAvg = nRows ? D.kDays / nRows : null;
    D.kBy = Object.keys(by).map(function (k) { return {label: k, v: by[k]}; }).sort(function (a, b) { return b.v - a.v; });
    D.kTop = D.kBy.length ? D.kBy[0].label : ''; D.kTopN = D.kBy.length ? D.kBy[0].v : 0;
    return D;
  }
};
})();
