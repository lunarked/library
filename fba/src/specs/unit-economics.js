(function () {
var U = window.WBU || null;
var CATS = ['Consumer Electronics (8%)', 'Electronics Accessories (15% up to 100, 8% above)', 'Most categories (15%)'];
function referral(cat, price) {
  if (!(price > 0)) return 0;
  var fee = cat === CATS[0] ? price * 0.08 : cat === CATS[1] ? Math.min(price, 100) * 0.15 + Math.max(0, price - 100) * 0.08 : price * 0.15;
  return Math.max(0.3, fee);
}
function sortDims(a) { return a.slice().sort(function (x, y) { return y - x; }); }
window.SPEC = {
  app: 'unit-economics',
  title: 'Unit Economics and Pricing',
  desc: 'Work out profit per unit after every Amazon fee, build up landed cost, test promotions, and compare packaging by size tier.',
  notice: 'Every tab is filled with sample data for a 20 W Bluetooth speaker. Type over it, or start blank.',
  headCap: 'Profit per unit',
  notes: [
    'Referral fees follow Amazon US rates: 8% for Consumer Electronics, 15% up to 100 and 8% above for Electronics Accessories, 15% for most other categories, with a 0.30 minimum. Enter the FBA fulfillment fee from Amazon\'s revenue calculator for your exact size and weight.',
    'Size tiers use Amazon US limits: small standard up to 15 x 12 x 0.75 inches and 16 oz, large standard up to 18 x 14 x 8 inches and 20 lb. Dimensional weight is length x width x height / 139. Check the current rate card before you commit.',
    'Promo lift is the extra units you expect during the promotion. Incremental profit compares the promotion with selling at full price over the same days.'
  ],
  tabs: [
    {id: 'profit-calculator', title: 'FBA profit calculator', badge: function (D) { return D.price ? U.fPct(D.margin) : ''; }, sections: [
      {type: 'form', title: 'Price and costs', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['$', '€', '£']},
        {k: 'price', label: 'Selling price', kind: 'money'},
        {k: 'landed', label: 'Landed cost per unit', kind: 'money', note: 'From the Landed cost tab or your own'},
        {k: 'cat', label: 'Referral category', kind: 'sel', options: CATS},
        {k: 'fba', label: 'FBA fulfillment fee', kind: 'money', note: 'From Amazon\'s revenue calculator'},
        {k: 'storage', label: 'Storage per unit per month', kind: 'money'},
        {k: 'months', label: 'Months in storage', kind: 'num', def: 2, note: 'Average time a unit sits at FBA'},
        {k: 'retRate', label: 'Return rate', kind: 'pct'},
        {k: 'retCost', label: 'Cost per return', kind: 'money', note: 'Processing fee plus unsellable share'},
        {k: 'ppc', label: 'Ad cost per unit sold', kind: 'money'},
        {k: 'other', label: 'Other per unit', kind: 'money', note: 'Prep, labels, inbound placement'}
      ]},
      {type: 'tiles', items: [
        {label: 'Profit per unit', sub: 'After every cost, including ads', v: function (D) { return D.price ? U.fMoney(D.profit, 2) : ''; }, bad: function (D) { return D.profit <= 0; }},
        {label: 'Margin', sub: 'Profit over selling price', v: function (D) { return D.price ? U.fPct(D.margin) : ''; }, bad: function (D) { return D.margin < 0.1; }},
        {label: 'Return on landed cost', sub: 'Profit over what you paid for the unit', v: function (D) { return U.fPct(D.roi); }},
        {label: 'Break-even ACoS', sub: 'Ad spend above this share of sales loses money', v: function (D) { return D.price ? U.fPct(D.beAcos) : ''; }},
        {label: 'Break-even price', sub: 'Lowest price with zero profit', v: function (D) { return U.fMoney(D.bePrice, 2); }}
      ]},
      {type: 'charts', title: 'Where the price goes', charts: [
        {kind: 'bars', title: 'Selling price split per unit', sub: 'With share of the selling price', data: function (D) { return {items: D.split, fmt: 'money2', share: true}; }}
      ]}
    ]},
    {id: 'landed-cost', title: 'Landed cost calculator', badge: function (D) { return D.lPerUnit ? U.fMoney(D.lPerUnit, 2) : ''; }, sections: [
      {type: 'form', title: 'Shipment', fields: [
        {k: 'lUnits', label: 'Units in shipment', kind: 'int'},
        {k: 'lFob', label: 'Factory price per unit (FOB)', kind: 'money'},
        {k: 'lFreight', label: 'Freight total', kind: 'money', note: 'Port to port or door to door'},
        {k: 'lIns', label: 'Insurance', kind: 'pct', note: 'Of goods value'},
        {k: 'lDuty', label: 'Duty rate', kind: 'pct', note: 'From the HTS code'},
        {k: 'lTariff', label: 'Additional tariff', kind: 'pct', note: 'Section 301 or other extra duty'},
        {k: 'lBroker', label: 'Customs broker and fees', kind: 'money'},
        {k: 'lInland', label: 'Port to Amazon trucking', kind: 'money'},
        {k: 'lPrep', label: 'Prep and labels per unit', kind: 'money'},
        {k: 'lPlace', label: 'Inbound placement per unit', kind: 'money'}
      ]},
      {type: 'tiles', items: [
        {label: 'Landed cost per unit', sub: 'Everything to get one unit sellable at FBA', v: function (D) { return U.fMoney(D.lPerUnit, 2); }},
        {label: 'Above factory price', sub: 'Landed cost over FOB price', v: function (D) { return D.lUplift == null ? '' : U.signed(U.fPct(D.lUplift), D.lUplift); }},
        {label: 'Freight per unit', sub: 'Freight total over units', v: function (D) { return U.fMoney(D.lFreightU, 2); }},
        {label: 'Duty and tariff per unit', sub: 'On the goods value', v: function (D) { return U.fMoney(D.lDutyU, 2); }},
        {label: 'Shipment total', sub: 'Goods plus every cost', v: function (D) { return U.fMoney(D.lTotal, 0); }}
      ]},
      {type: 'charts', title: 'Cost build-up', charts: [
        {kind: 'bars', title: 'Landed cost per unit by part', sub: 'With share of landed cost', data: function (D) { return {items: D.lParts, fmt: 'money2', share: true}; }}
      ]}
    ]},
    {id: 'promo-planner', title: 'Price and promo planner', badge: function (D) { return D.promos.length ? U.fCompact(D.promoGain) : ''; }, sections: [
      {type: 'form', title: 'Normal sales', help: 'Price, landed cost, fees and ad cost come from the FBA profit calculator tab.', fields: [
        {k: 'baseDaily', label: 'Normal units per day', kind: 'num'}
      ], stats: [
        {label: 'Full price', v: function (D) { return U.fMoney(D.price, 2); }},
        {label: 'Profit per unit at full price', v: function (D) { return D.price ? U.fMoney(D.profit, 2) : ''; }}
      ]},
      {type: 'tiles', items: [
        {label: 'Best promotion', sub: function (D) { return D.bestPromo ? D.bestPromo : 'Highest incremental profit'; }, v: function (D) { return D.bestPromoGain == null ? '' : U.signed(U.fMoney(D.bestPromoGain, 0), D.bestPromoGain); }},
        {label: 'Incremental profit, all promos', sub: 'Against full price over the same days', v: function (D) { return D.promos.length ? U.signed(U.fMoney(D.promoGain, 0), D.promoGain) : ''; }, bad: function (D) { return D.promoGain < 0; }},
        {label: 'Promotions losing money', sub: 'Worse than not running them', v: function (D) { return D.promos.length ? String(D.promoLoss) : ''; }, bad: function (D) { return D.promoLoss > 0; }}
      ]},
      {type: 'table', k: 'promos', title: 'Promotions', help: 'Enter the discount, how long it runs, any fixed fee, and the lift you expect. A promotion pays when the extra units make up for the lower margin and the fee.', add: 'Add a promotion', cols: [
        {k: 'name', label: 'Promotion', kind: 'text', w: 150},
        {k: 'type', label: 'Type', kind: 'sel', options: ['Coupon', 'Lightning Deal', 'Best Deal', 'Prime Exclusive Discount', 'Price cut'], w: 150},
        {k: 'disc', label: 'Discount %', kind: 'pct', w: 66},
        {k: 'days', label: 'Days', kind: 'int', w: 52},
        {k: 'fee', label: 'Fixed fee', kind: 'money', w: 70},
        {k: 'lift', label: 'Lift %', kind: 'pct', w: 60},
        {label: 'Promo price', w: 74, v: function (D, i) { return U.fMoney(D.promos[i].price, 2); }},
        {label: 'Profit per unit', w: 74, v: function (D, i) { return U.fMoney(D.promos[i].unit, 2); }, tone: function (D, i) { return D.promos[i].unit < 0 ? 'bad' : ''; }},
        {label: 'Units', w: 60, v: function (D, i) { return U.fInt(D.promos[i].units); }},
        {label: 'Incremental profit', w: 86, v: function (D, i) { var g = D.promos[i].gain; return g == null ? '' : U.signed(U.fMoney(g, 0), g); }, foot: function (D) { return U.fMoney(D.promoGain, 0); }},
        {label: 'Result', w: 100, status: function (D, i) { return D.promos[i].status; }}
      ]}
    ]},
    {id: 'size-tier', title: 'Size tier and packaging', badge: function (D) { return D.packs.length ? D.packs.length + ' options' : ''; }, sections: [
      {type: 'form', title: 'Rates', fields: [
        {k: 'storageRate', label: 'Storage fee per cu ft per month', kind: 'money', note: 'Your current rate for the season'},
        {k: 'unitsMonth', label: 'Units sold per month', kind: 'int', note: 'To size the monthly saving'}
      ]},
      {type: 'tiles', items: [
        {label: 'Cheapest option', sub: function (D) { return D.bestPack ? D.bestPack : 'Lowest cost per unit'; }, v: function (D) { return U.fMoney(D.bestPackCost, 2); }},
        {label: 'Saving per unit', sub: 'Cheapest option against the first row', v: function (D) { return U.fMoney(D.packSaving, 2); }},
        {label: 'Saving per month', sub: 'At your monthly units', v: function (D) { return U.fMoney(D.packSavingMonth, 0); }}
      ]},
      {type: 'table', k: 'packs', title: 'Packaging options', help: 'Enter the packed dimensions and weight of each option and the FBA fee Amazon quotes for it. The tier is an estimate from the dimensions.', add: 'Add an option', cols: [
        {k: 'name', label: 'Option', kind: 'text', w: 150},
        {k: 'l', label: 'Length in', kind: 'num', w: 60},
        {k: 'w', label: 'Width in', kind: 'num', w: 60},
        {k: 'h', label: 'Height in', kind: 'num', w: 60},
        {k: 'lb', label: 'Weight lb', kind: 'num', w: 62},
        {k: 'pack', label: 'Packaging cost', kind: 'money', w: 70},
        {k: 'fee', label: 'FBA fee', kind: 'money', w: 66},
        {label: 'Tier', w: 110, num: false, v: function (D, i) { return D.packs[i].tier; }},
        {label: 'Dim weight lb', w: 66, v: function (D, i) { return U.fDec2(D.packs[i].dim); }},
        {label: 'Cu ft', w: 60, v: function (D, i) { return U.fDec2(D.packs[i].cuft); }},
        {label: 'Storage per unit', w: 70, v: function (D, i) { return U.fMoney(D.packs[i].stor, 2); }},
        {label: 'Cost per unit', w: 74, v: function (D, i) { return U.fMoney(D.packs[i].total, 2); }, tone: function (D, i) { return D.packs[i].best ? 'good' : ''; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Selling price', v: function (D) { return U.fMoney(D.price, 2); }},
    {label: 'Landed cost', v: function (D, S) { return U.fMoney(S.f.landed, 2); }},
    {label: 'Amazon fees per unit', v: function (D) { return D.price ? U.fMoney(D.fees, 2) : ''; }},
    {label: 'Break-even ACoS', v: function (D) { return D.price ? U.fPct(D.beAcos) : ''; }},
    {label: 'Best promotion', v: function (D) { return D.bestPromo || 'None'; }}
  ],
  headline: function (D) {
    if (!D.price) return {unit: 'Enter a price to see profit'};
    return {num: U.fMoney(D.profit, 2), unit: U.fPct(D.margin) + ' margin', status: D.profit <= 0 ? 'Loss' : D.margin < 0.1 ? 'Thin margin' : 'Profitable', note: 'after ads'};
  },
  sample: function (S, U2) {
    S.biz.brand = 'ExampleBrand'; S.biz.marketplace = 'Amazon.com (US)';
    var f = S.f;
    f.price = 49.99; f.landed = 14.5; f.cat = CATS[0]; f.fba = 6.85; f.storage = 0.09; f.months = 2; f.retRate = 6; f.retCost = 4.5; f.ppc = 6.5; f.other = 0.6;
    f.lUnits = 2000; f.lFob = 10.8; f.lFreight = 3400; f.lIns = 0.5; f.lDuty = 0; f.lTariff = 25; f.lBroker = 450; f.lInland = 900; f.lPrep = 0.35; f.lPlace = 0.27;
    f.baseDaily = 40;
    S.t.promos = U2.rows(['name', 'type', 'disc', 'days', 'fee', 'lift'], [
      ['Launch coupon', 'Coupon', 10, 14, 50, 25],
      ['Prime Day deal', 'Prime Exclusive Discount', 20, 2, 0, 250],
      ['Black Friday Lightning Deal', 'Lightning Deal', 25, 1, 150, 300],
      ['Spring price cut', 'Price cut', 15, 30, 0, 20]
    ]);
    f.storageRate = 0.78; f.unitsMonth = 1200;
    S.t.packs = U2.rows(['name', 'l', 'w', 'h', 'lb', 'pack', 'fee'], [
      ['Retail box with insert', 9.1, 6.2, 4.4, 1.6, 0.85, 6.85],
      ['Slim box, cable inside', 8.2, 5.6, 3.6, 1.45, 0.7, 6.32],
      ['Mailer box, no insert', 8.0, 5.5, 3.3, 1.38, 0.55, 6.32]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    D.price = W.isNum(f.price) && f.price > 0 ? f.price : null;
    var ref = referral(f.cat, D.price || 0);
    var fixedCost = n0(f.fba) + n0(f.storage) * n0(f.months) + n0(f.retRate) / 100 * n0(f.retCost) + n0(f.other);
    D.fees = ref + n0(f.fba);
    D.profit = D.price ? D.price - n0(f.landed) - ref - fixedCost - n0(f.ppc) : null;
    D.margin = D.price ? D.profit / D.price : null;
    D.roi = D.price && f.landed > 0 ? D.profit / f.landed : null;
    D.beAcos = D.price ? (D.profit + n0(f.ppc)) / D.price : null;
    var base = n0(f.landed) + fixedCost + n0(f.ppc), lo = 0, hi = 10000;
    for (var it = 0; it < 60; it++) { var mid = (lo + hi) / 2; if (mid - referral(f.cat, mid) - base > 0) hi = mid; else lo = mid; }
    D.bePrice = base > 0 ? hi : null;
    D.split = D.price ? [
      {label: 'Landed cost', v: n0(f.landed)}, {label: 'Referral fee', v: ref}, {label: 'FBA fulfillment', v: n0(f.fba)},
      {label: 'Storage', v: n0(f.storage) * n0(f.months)}, {label: 'Returns', v: n0(f.retRate) / 100 * n0(f.retCost)},
      {label: 'Advertising', v: n0(f.ppc)}, {label: 'Other', v: n0(f.other)}, {label: 'Profit', v: Math.max(0, D.profit)}
    ] : [];

    var u = n0(f.lUnits), goods = u * n0(f.lFob);
    var ins = goods * n0(f.lIns) / 100, duty = goods * (n0(f.lDuty) + n0(f.lTariff)) / 100;
    var shipTot = n0(f.lFreight) + ins + duty + n0(f.lBroker) + n0(f.lInland) + u * (n0(f.lPrep) + n0(f.lPlace));
    D.lTotal = u > 0 ? goods + shipTot : null;
    D.lPerUnit = u > 0 ? D.lTotal / u : null;
    D.lUplift = D.lPerUnit && f.lFob > 0 ? D.lPerUnit / f.lFob - 1 : null;
    D.lFreightU = u > 0 ? n0(f.lFreight) / u : null;
    D.lDutyU = u > 0 ? duty / u : null;
    D.lParts = u > 0 ? [
      {label: 'Factory price', v: n0(f.lFob)}, {label: 'Freight', v: n0(f.lFreight) / u}, {label: 'Duty and tariff', v: duty / u},
      {label: 'Insurance', v: ins / u}, {label: 'Broker and fees', v: n0(f.lBroker) / u}, {label: 'Trucking to Amazon', v: n0(f.lInland) / u},
      {label: 'Prep and labels', v: n0(f.lPrep)}, {label: 'Inbound placement', v: n0(f.lPlace)}
    ] : [];

    var baseDaily = n0(f.baseDaily);
    D.promos = S.t.promos.map(function (p) {
      if (!D.price || !W.isNum(p.disc) || !W.isNum(p.days)) return {status: ''};
      var price = D.price * (1 - p.disc / 100);
      var unit = price - n0(f.landed) - referral(f.cat, price) - fixedCost - n0(f.ppc);
      var units = baseDaily * p.days * (1 + n0(p.lift) / 100);
      var gain = units * unit - n0(p.fee) - baseDaily * p.days * D.profit;
      return {price: price, unit: unit, units: units, gain: gain, status: gain >= 0 ? 'Profitable' : 'Loss'};
    });
    var valid = D.promos.filter(function (p) { return p.gain != null; });
    D.promoGain = W.sum(valid.map(function (p) { return p.gain; }));
    D.promoLoss = valid.filter(function (p) { return p.gain < 0; }).length;
    var bi = -1;
    D.promos.forEach(function (p, i) { if (p.gain != null && (bi < 0 || p.gain > D.promos[bi].gain)) bi = i; });
    D.bestPromo = bi >= 0 ? S.t.promos[bi].name || 'Promotion ' + (bi + 1) : '';
    D.bestPromoGain = bi >= 0 ? D.promos[bi].gain : null;

    D.packs = S.t.packs.map(function (r) {
      if (![r.l, r.w, r.h].every(W.isNum)) return {tier: ''};
      var d = sortDims([r.l, r.w, r.h]), oz = n0(r.lb) * 16;
      var tier = d[0] <= 15 && d[1] <= 12 && d[2] <= 0.75 && oz <= 16 ? 'Small standard' : d[0] <= 18 && d[1] <= 14 && d[2] <= 8 && n0(r.lb) <= 20 ? 'Large standard' : 'Large bulky';
      var cuft = r.l * r.w * r.h / 1728, stor = cuft * n0(f.storageRate);
      return {tier: tier, dim: r.l * r.w * r.h / 139, cuft: cuft, stor: stor, total: W.isNum(r.fee) ? r.fee + n0(r.pack) + stor : null};
    });
    var bp = -1;
    D.packs.forEach(function (p, i) { if (p.total != null && (bp < 0 || p.total < D.packs[bp].total)) bp = i; });
    if (bp >= 0) D.packs[bp].best = true;
    D.bestPack = bp >= 0 ? S.t.packs[bp].name : '';
    D.bestPackCost = bp >= 0 ? D.packs[bp].total : null;
    D.packSaving = bp >= 0 && D.packs[0] && D.packs[0].total != null ? D.packs[0].total - D.bestPackCost : null;
    D.packSavingMonth = D.packSaving != null && W.isNum(f.unitsMonth) ? D.packSaving * f.unitsMonth : null;
    return D;
  }
};
})();
