(function () {
var U;
function rel(W, n) { var d = new Date(); return W.isoOf(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + n * W.DAY); }
window.SPEC = {
  app: 'esc-supply-suppliers',
  title: 'Supply and Suppliers',
  desc: 'Track vehicle orders and deliveries against the fleet plan, score suppliers on delivery, quality, lead time and cost, and recover money through OEM warranty claims.',
  notice: 'Every tab is filled with sample data for a vehicle OEM and five parts suppliers. Type over it, or start blank.',
  headCap: 'Vehicles due in 30 days',
  tones: {good: ['On time', 'Recovered'], warn: ['Submitted', 'Ageing'], bad: ['Write off']},
  notes: [
    'Delay is the expected date less the confirmed date. A delivery later than 14 days moves the fleet plan: update the City Fleet Allocation and NPI transition plans.',
    'Supplier score is a weighted average of five ratings from 0 to 100: on-time delivery, quality (100 at 0 ppm falling to 0 at 5,000 ppm), lead time (100 at 2 weeks falling to 0 at 16), price change (100 at 5% down, 0 at 10% up) and responsiveness (1 to 5). Strong is 80 or more, Fair 60 to 80, Weak below 60.',
    'Recovery rate is paid over claimed, on closed claims. Claims older than 60 days without payment are Ageing; chase them in the supplier review. Check the warranty period in each contract: it often runs from delivery, not from deployment.'
  ],
  tabs: [
    {id: 'orders', title: 'Vehicle order and delivery schedule', badge: function (D) { return D.oLate ? D.oLate + ' late' : ''; }, sections: [
      {type: 'form', title: 'Currency', fields: [{k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']}]},
      {type: 'tiles', items: [
        {label: 'Due in 30 days', sub: 'Vehicles not yet received', v: function (D, S) { return S.t.orders.length ? U.fInt(D.o30) : ''; }},
        {label: 'Open on order', sub: 'All open orders', v: function (D, S) { return S.t.orders.length ? U.fInt(D.oOpen) : ''; }},
        {label: 'Late orders', sub: 'More than 14 days behind', v: function (D, S) { return S.t.orders.length ? String(D.oLate) : ''; }, bad: function (D) { return D.oLate > 0; }},
        {label: 'Open order value', sub: 'Not yet received', v: function (D, S) { return S.t.orders.length ? U.fMoney(D.oValue, 0) : ''; }}
      ]},
      {type: 'table', k: 'orders', title: 'Purchase orders', help: 'One row per order or delivery batch. Confirmed is the date the OEM committed to; Expected is the latest update.', add: 'Add an order', cols: [
        {k: 'po', label: 'Order', kind: 'text', w: 90},
        {k: 'model', label: 'Model', kind: 'text', w: 70},
        {k: 'dest', label: 'City', kind: 'text', w: 90},
        {k: 'qty', label: 'Quantity', kind: 'int', w: 70, foot: 'sum'},
        {k: 'conf', label: 'Confirmed', kind: 'date', w: 128},
        {k: 'exp', label: 'Expected', kind: 'date', w: 128},
        {k: 'recv', label: 'Received', kind: 'int', w: 70, foot: 'sum'},
        {k: 'price', label: 'Unit price', kind: 'money', w: 70},
        {label: 'Delay, days', w: 66, v: function (D, i) { var d = D.orders[i].delay; return d == null ? '' : U.signed(U.fInt(d), d); }},
        {label: 'Days to arrival', w: 66, v: function (D, i) { return U.fInt(D.orders[i].toGo); }},
        {label: 'Open value', w: 80, v: function (D, i) { return U.fMoney(D.orders[i].value, 0); }, foot: function (D) { return U.fMoney(D.oValue, 0); }},
        {label: 'Status', w: 90, status: function (D, i) { return D.orders[i].status; }}
      ]},
      {type: 'charts', title: 'Arrivals', charts: [
        {kind: 'bars', title: 'Open vehicles by expected month', sub: 'Not yet received', data: function (D) { return {items: D.oByMonth, fmt: 'int'}; }}
      ]}
    ]},
    {id: 'scorecard', title: 'Supplier scorecard', badge: function (D) { return D.sWeak ? D.sWeak + ' weak' : ''; }, sections: [
      {type: 'form', title: 'Weights', fields: [
        {k: 'wOt', label: 'On-time delivery', kind: 'pct', def: 30},
        {k: 'wQ', label: 'Quality', kind: 'pct', def: 30},
        {k: 'wLt', label: 'Lead time', kind: 'pct', def: 15},
        {k: 'wP', label: 'Price', kind: 'pct', def: 15},
        {k: 'wR', label: 'Responsiveness', kind: 'pct', def: 10}
      ], stats: [
        {label: 'Weights add up to', v: function (D) { return D.sW == null ? '' : {text: U.fPct(D.sW / 100), tone: Math.abs(D.sW - 100) > 0.5 ? 'warn' : ''}; }}
      ]},
      {type: 'tiles', items: [
        {label: 'Strong', sub: 'Score 80 or more', v: function (D, S) { return S.t.sup.length ? String(D.sStrong) : ''; }},
        {label: 'Fair', sub: '60 to 80', v: function (D, S) { return S.t.sup.length ? String(D.sFair) : ''; }},
        {label: 'Weak', sub: 'Below 60', v: function (D, S) { return S.t.sup.length ? String(D.sWeak) : ''; }, bad: function (D) { return D.sWeak > 0; }},
        {label: 'Spend with weak suppliers', sub: 'Share of 12-month spend', v: function (D) { return U.fPct(D.sWeakSpend); }}
      ]},
      {type: 'table', k: 'sup', title: 'Suppliers', help: 'Use the last 6 months. Price change compares with the same parts a year ago.', add: 'Add a supplier', cols: [
        {k: 'name', label: 'Supplier', kind: 'text', w: 130},
        {k: 'cat', label: 'Supplies', kind: 'text', w: 120},
        {k: 'spend', label: 'Spend, 12 months', kind: 'money', w: 86},
        {k: 'ot', label: 'On time %', kind: 'pct', w: 64},
        {k: 'ppm', label: 'Defects, ppm', kind: 'int', w: 70},
        {k: 'lt', label: 'Lead time, weeks', kind: 'num', w: 70},
        {k: 'pc', label: 'Price change %', kind: 'pct', w: 66},
        {k: 'resp', label: 'Response 1 to 5', kind: 'int', w: 70},
        {label: 'Quality', w: 56, v: function (D, i) { return U.fInt(D.sup[i].q); }},
        {label: 'Lead', w: 50, v: function (D, i) { return U.fInt(D.sup[i].l); }},
        {label: 'Price', w: 50, v: function (D, i) { return U.fInt(D.sup[i].p); }},
        {label: 'Score', w: 56, v: function (D, i) { return U.fInt(D.sup[i].score); }},
        {label: 'Rating', w: 78, status: function (D, i) { return D.sup[i].status; }}
      ]},
      {type: 'charts', title: 'Ranking', charts: [
        {kind: 'bars', title: 'Supplier score', sub: '0 to 100', data: function (D, S) { return {items: S.t.sup.map(function (s, i) { return {label: s.name || 'Supplier ' + (i + 1), v: D.sup[i].score}; }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); }), fmt: 'int'}; }}
      ]}
    ]},
    {id: 'warranty', title: 'OEM warranty claims', badge: function (D) { return D.wOpenN ? D.wOpenN + ' open' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Open claim value', sub: 'Draft, submitted or approved', v: function (D, S) { return S.t.claims.length ? U.fMoney(D.wOpen, 0) : ''; }},
        {label: 'Recovered', sub: 'Paid, all claims', v: function (D, S) { return S.t.claims.length ? U.fMoney(D.wPaid, 0) : ''; }},
        {label: 'Recovery rate', sub: 'Paid over claimed, closed claims', v: function (D) { return U.fPct(D.wRate); }},
        {label: 'Claims ageing', sub: 'Over 60 days, not paid', v: function (D, S) { return S.t.claims.length ? String(D.wAge) : ''; }, bad: function (D) { return D.wAge > 0; }}
      ]},
      {type: 'table', k: 'claims', title: 'Claims', help: 'One row per claim. Attach the fault code and vehicle IDs in the claim itself; keep the summary here.', add: 'Add a claim', cols: [
        {k: 'id', label: 'Claim', kind: 'text', w: 80},
        {k: 'sup', label: 'Supplier', kind: 'text', w: 110},
        {k: 'part', label: 'Part or fault', kind: 'text', w: 160},
        {k: 'veh', label: 'Vehicles', kind: 'int', w: 64, foot: 'sum'},
        {k: 'date', label: 'Filed', kind: 'date', w: 128},
        {k: 'value', label: 'Claimed', kind: 'money', w: 76, foot: 'sum'},
        {k: 'state', label: 'State', kind: 'sel', options: ['Draft', 'Submitted', 'Approved', 'Paid', 'Rejected'], w: 100, tone: true},
        {k: 'paid', label: 'Paid', kind: 'money', w: 76, foot: 'sum'},
        {label: 'Age, days', w: 60, v: function (D, i) { return U.fInt(D.claims[i].age); }},
        {label: 'Recovered', w: 70, v: function (D, i) { return U.fPct(D.claims[i].rate); }},
        {label: 'Status', w: 86, status: function (D, i) { return D.claims[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Vehicles due in 30 days', v: function (D) { return U.fInt(D.o30); }},
    {label: 'Late orders', v: function (D) { return {text: String(D.oLate), tone: D.oLate ? 'warn' : ''}; }},
    {label: 'Weak suppliers', v: function (D) { return {text: String(D.sWeak), tone: D.sWeak ? 'warn' : ''}; }},
    {label: 'Open warranty value', v: function (D) { return U.fMoney(D.wOpen, 0) || 'No data'; }},
    {label: 'Warranty recovery rate', v: function (D) { return U.fPct(D.wRate) || 'No data'; }}
  ],
  headline: function (D, S) {
    if (!S.t.orders.length) return {unit: 'Add vehicle orders'};
    return {num: U.fInt(D.o30), unit: 'vehicles due in 30 days', status: D.oLate ? 'Late' : 'On time', note: U.fInt(D.oOpen) + ' open on order, ' + D.oLate + ' orders late'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleMobility'; S.biz.marketplace = 'Germany and Austria';
    S.t.orders = W.rows(['po', 'model', 'dest', 'qty', 'conf', 'exp', 'recv', 'price'], [
      ['PO-3101', 'S3', 'Vienna', 600, rel(W, -60), rel(W, -55), 600, 640],
      ['PO-3102', 'S3', 'Vienna', 400, rel(W, 12), rel(W, 18), 0, 640],
      ['PO-3103', 'S3', 'Munich', 600, rel(W, 40), rel(W, 63), 0, 630],
      ['PO-3104', 'S3', 'Munich', 700, rel(W, 70), rel(W, 70), 0, 630],
      ['PO-3105', 'S3', 'Hamburg', 800, rel(W, 100), rel(W, 104), 0, 625],
      ['PO-2990', 'S2', 'Berlin', 300, rel(W, -10), rel(W, 6), 120, 520]
    ]);
    S.t.sup = W.rows(['name', 'cat', 'spend', 'ot', 'ppm', 'lt', 'pc', 'resp'], [
      ['Vehicle OEM', 'Vehicles, S2 and S3', 4200000, 82, 1800, 14, -3, 3],
      ['TirePro', 'Tires and tubes', 96000, 97, 400, 3, 2, 5],
      ['BrakeTech', 'Brake parts', 74000, 91, 900, 4, 0, 4],
      ['CellPower', 'Battery packs', 820000, 76, 2600, 12, 6, 2],
      ['IoT Systems', 'IoT modules', 210000, 64, 3100, 12, 4, 3]
    ]);
    S.t.claims = W.rows(['id', 'sup', 'part', 'veh', 'date', 'value', 'state', 'paid'], [
      ['WC-101', 'Vehicle OEM', 'Folding joint cracks, S2 batch 2024-03', 120, rel(W, -150), 18600, 'Paid', 15800],
      ['WC-107', 'CellPower', 'Packs below 80% health under 300 cycles', 85, rel(W, -95), 17850, 'Approved', null],
      ['WC-112', 'IoT Systems', 'IoT modules dead on arrival', 64, rel(W, -40), 3070, 'Submitted', null],
      ['WC-115', 'Vehicle OEM', 'S3 motor wheel noise in pilot', 18, rel(W, -6), 2070, 'Draft', null],
      ['WC-099', 'BrakeTech', 'Brake levers bent, transport damage', 40, rel(W, -200), 1200, 'Rejected', 0]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {}, tdy = W.isoOf(today);
    D.o30 = 0; D.oOpen = 0; D.oLate = 0; D.oValue = 0;
    var byM = {};
    D.orders = S.t.orders.map(function (o) {
      if (!W.isNum(o.qty)) return {status: ''};
      var open = Math.max(0, o.qty - n0(o.recv));
      var delay = o.conf && o.exp ? W.days(o.conf, o.exp) : null;
      var toGo = o.exp && open ? W.days(tdy, o.exp) : null;
      var value = open * n0(o.price);
      D.oOpen += open; D.oValue += value;
      if (open && toGo != null && toGo <= 30) D.o30 += open;
      if (open && o.exp) { var key = o.exp.slice(0, 7); byM[key] = n0(byM[key]) + open; }
      var status = !open ? 'Delivered' : n0(o.recv) > 0 ? 'Partial' : delay > 14 ? 'Late' : delay > 0 ? 'At risk' : 'On time';
      if (status === 'Late') D.oLate++;
      return {delay: delay, toGo: toGo, value: value, status: status};
    });
    D.oByMonth = Object.keys(byM).sort().map(function (k) { return {label: U.fDate(U.toUTC(k + '-01')).replace(/^\d+ /, ''), v: byM[k]}; });

    var wts = [f.wOt, f.wQ, f.wLt, f.wP, f.wR].map(n0);
    D.sW = W.sum(wts);
    var clamp = function (v) { return Math.max(0, Math.min(100, v)); };
    D.sStrong = 0; D.sFair = 0; D.sWeak = 0;
    var weakSpend = 0;
    D.sup = S.t.sup.map(function (s) {
      if (!W.isNum(s.ot)) return {status: ''};
      var q = W.isNum(s.ppm) ? clamp(100 - s.ppm / 50) : null;
      var l = W.isNum(s.lt) ? clamp(100 - (s.lt - 2) / 14 * 100) : null;
      var p = W.isNum(s.pc) ? clamp(100 - (s.pc + 5) / 15 * 100) : null;
      var r = W.isNum(s.resp) ? clamp((s.resp - 1) * 25) : null;
      var parts = [[clamp(s.ot), wts[0]], [q, wts[1]], [l, wts[2]], [p, wts[3]], [r, wts[4]]].filter(function (x) { return x[0] != null && x[1] > 0; });
      var ws = W.sum(parts.map(function (x) { return x[1]; }));
      var score = ws ? W.sum(parts.map(function (x) { return x[0] * x[1]; })) / ws : null;
      var status = score == null ? '' : score >= 80 ? 'Strong' : score >= 60 ? 'Fair' : 'Weak';
      if (status === 'Strong') D.sStrong++; if (status === 'Fair') D.sFair++; if (status === 'Weak') { D.sWeak++; weakSpend += n0(s.spend); }
      return {q: q, l: l, p: p, score: score, status: status};
    });
    var spend = W.sum(S.t.sup.map(function (s) { return s.spend; }));
    D.sWeakSpend = spend > 0 ? weakSpend / spend : null;

    D.wOpen = 0; D.wOpenN = 0; D.wAge = 0;
    var closedClaim = 0, closedPaid = 0;
    D.claims = S.t.claims.map(function (c) {
      if (!W.isNum(c.value)) return {status: ''};
      var age = c.date ? W.days(c.date, tdy) : null;
      var closed = c.state === 'Paid' || c.state === 'Rejected';
      if (!closed) { D.wOpen += c.value; D.wOpenN++; }
      if (closed) { closedClaim += c.value; closedPaid += n0(c.paid); }
      var ageing = !closed && age > 60;
      if (ageing) D.wAge++;
      return {age: age, rate: closed ? n0(c.paid) / c.value : null, status: c.state === 'Paid' ? 'Recovered' : c.state === 'Rejected' ? 'Write off' : ageing ? 'Ageing' : c.state === 'Draft' ? 'Draft' : 'Open'};
    });
    D.wPaid = W.sum(S.t.claims.map(function (c) { return c.paid; }));
    D.wRate = closedClaim > 0 ? closedPaid / closedClaim : null;
    return D;
  }
};
})();
