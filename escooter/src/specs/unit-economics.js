(function () {
var U;
window.SPEC = {
  app: 'esc-unit-economics',
  title: 'E-scooter Unit Economics',
  desc: 'Build the profit of one vehicle per day, compare cities on a full P&L, and work out payback and lifetime profit for each vehicle model.',
  notice: 'Every tab is filled with sample data for a German operator. Type over it, or start blank.',
  headCap: 'Profit per vehicle per day',
  tones: {good: [], warn: [], bad: []},
  notes: [
    'Prices include VAT, so net revenue removes VAT first, then payment fees and discounts. Germany charges 19% VAT, Austria 20%.',
    'Contribution covers costs that rise with every ride or vehicle: swaps, field moves, repairs, parts and insurance. EBITDA also takes permit fees, warehouse and city staff. Depreciation spreads the vehicle cost over its life in the fleet.',
    'City margins: Profitable is a margin of 10% or more after city costs, Thin margin is 0% to 10%, Loss is below 0%.',
    'Payback per model uses profit per vehicle per day times uptime, over the purchase and launch cost per vehicle. Uptime is the share of days a vehicle is deployable.'
  ],
  tabs: [
    {id: 'vehicle', title: 'Vehicle P&L', badge: function (D) { return D.vEbitda != null ? U.fMoney(D.vEbitda, 2) + ' a day' : ''; }, sections: [
      {type: 'form', title: 'Revenue per vehicle per day', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']},
        {k: 'rides', label: 'Rides per vehicle per day', kind: 'num'},
        {k: 'mins', label: 'Average ride minutes', kind: 'num'},
        {k: 'unlock', label: 'Unlock fee', kind: 'money'},
        {k: 'perMin', label: 'Price per minute', kind: 'money'},
        {k: 'passShare', label: 'Rides on passes or subscriptions', kind: 'pct', note: 'Paid at a lower average price'},
        {k: 'passDisc', label: 'Pass discount on list price', kind: 'pct'},
        {k: 'vat', label: 'VAT', kind: 'pct', def: 19},
        {k: 'payFee', label: 'Payment fees', kind: 'pct', def: 3}
      ], stats: [
        {label: 'Price per ride, list', v: function (D) { return U.fMoney(D.vList, 2); }},
        {label: 'Net revenue per ride', v: function (D) { return U.fMoney(D.vNetRide, 2); }},
        {label: 'Net revenue per vehicle per day', v: function (D) { return U.fMoney(D.vRev, 2); }}
      ]},
      {type: 'form', title: 'Costs per vehicle per day', fields: [
        {k: 'swapCost', label: 'Battery swap cost', kind: 'money', note: 'Per swap: labor, van, energy'},
        {k: 'swapsDay', label: 'Swaps per vehicle per day', kind: 'num'},
        {k: 'fieldCost', label: 'Field moves and rebalancing', kind: 'money'},
        {k: 'kmDay', label: 'Km per vehicle per day', kind: 'num'},
        {k: 'repairKm', label: 'Repair and parts per km', kind: 'money'},
        {k: 'insYear', label: 'Insurance per vehicle per year', kind: 'money'},
        {k: 'permitYear', label: 'Permit fee per vehicle per year', kind: 'money'},
        {k: 'cityDay', label: 'Warehouse and city staff per vehicle per day', kind: 'money'},
        {k: 'vehCost', label: 'Vehicle cost', kind: 'money'},
        {k: 'lifeMonths', label: 'Life in the fleet, months', kind: 'int'}
      ]},
      {type: 'table', k: 'pl', title: 'Profit per vehicle', help: 'All figures are per vehicle. Per day assumes the vehicle is deployed every day.', fixed: ['Net revenue', 'Battery swaps', 'Field moves', 'Repair and parts', 'Insurance', 'Contribution', 'Permit fees', 'Warehouse and city staff', 'EBITDA', 'Depreciation', 'Profit after depreciation'], cols: [
        {fixedLabel: true, label: 'Line', w: 260, num: false},
        {label: 'Per ride', w: 120, v: function (D, i) { return U.fMoney(D.pl[i].ride, 2); }},
        {label: 'Per day', w: 120, v: function (D, i) { return U.fMoney(D.pl[i].day, 2); }},
        {label: 'Per month', w: 120, v: function (D, i) { return U.fMoney(D.pl[i].month, 0); }},
        {label: 'Share of revenue', w: 120, v: function (D, i) { return U.fPct(D.pl[i].share); }}
      ]}
    ]},
    {id: 'city', title: 'City P&L', badge: function (D) { return D.cLoss ? D.cLoss + ' at a loss' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Net revenue per month', sub: 'All cities', v: function (D, S) { return S.t.cities.length ? U.fMoney(D.cRev, 0) : ''; }},
        {label: 'City EBITDA per month', sub: 'All cities', v: function (D, S) { return S.t.cities.length ? U.fMoney(D.cEbitda, 0) : ''; }, bad: function (D) { return D.cEbitda < 0; }},
        {label: 'Margin', sub: 'EBITDA over net revenue', v: function (D) { return U.fPct(D.cMargin); }},
        {label: 'Cities at a loss', sub: 'Margin below 0%', v: function (D, S) { return S.t.cities.length ? String(D.cLoss) : ''; }, bad: function (D) { return D.cLoss > 0; }}
      ]},
      {type: 'table', k: 'cities', title: 'Cities, last month', help: 'Enter costs for the month. Net revenue per ride is after VAT, payment fees and discounts.', add: 'Add a city', cols: [
        {k: 'city', label: 'City', kind: 'text', w: 96},
        {k: 'veh', label: 'Average fleet', kind: 'int', w: 70},
        {k: 'rides', label: 'Rides', kind: 'int', w: 76},
        {k: 'net', label: 'Net revenue per ride', kind: 'money', w: 74},
        {k: 'field', label: 'Swaps and field', kind: 'money', w: 80},
        {k: 'repair', label: 'Repair and parts', kind: 'money', w: 80},
        {k: 'fees', label: 'Permit and insurance', kind: 'money', w: 80},
        {k: 'site', label: 'Warehouse and staff', kind: 'money', w: 80},
        {label: 'Net revenue', w: 84, v: function (D, i) { return U.fMoney(D.cities[i].rev, 0); }, foot: function (D) { return U.fMoney(D.cRev, 0); }},
        {label: 'EBITDA', w: 80, v: function (D, i) { return U.fMoney(D.cities[i].ebitda, 0); }, foot: function (D) { return U.fMoney(D.cEbitda, 0); }, tone: function (D, i) { return D.cities[i].ebitda < 0 ? 'bad' : ''; }},
        {label: 'Margin', w: 60, v: function (D, i) { return U.fPct(D.cities[i].margin); }},
        {label: 'Per vehicle per day', w: 74, v: function (D, i) { return U.fMoney(D.cities[i].pvd, 2); }},
        {label: 'Status', w: 104, status: function (D, i) { return D.cities[i].status; }}
      ]},
      {type: 'charts', title: 'Comparison', charts: [
        {kind: 'bars', title: 'EBITDA per vehicle per day', sub: 'By city', data: function (D, S) { return {items: S.t.cities.map(function (c, i) { return {label: c.city || 'City ' + (i + 1), v: D.cities[i].pvd}; }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); }), fmt: 'money2'}; }}
      ]}
    ]},
    {id: 'payback', title: 'Payback per vehicle by model', badge: function (D) { return D.mBest ? 'best: ' + D.mBest : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Fastest payback', sub: function (D) { return D.mBestPb != null ? U.fDec1(D.mBestPb) + ' months' : ''; }, v: function (D) { return D.mBest; }},
        {label: 'Highest lifetime profit', sub: function (D) { return D.mTopLife != null ? U.fMoney(D.mTopLife, 0) + ' per vehicle' : ''; }, v: function (D) { return D.mTop; }},
        {label: 'Models that never pay back', sub: 'Within their life', v: function (D, S) { return S.t.models.length ? String(D.mNever) : ''; }, bad: function (D) { return D.mNever > 0; }}
      ]},
      {type: 'table', k: 'models', title: 'Models', help: 'Take profit per day from the Vehicle P&L for each model. Launch cost per vehicle covers spares, tools, training and setup spread over the batch.', add: 'Add a model', cols: [
        {k: 'model', label: 'Model', kind: 'text', w: 100},
        {k: 'cost', label: 'Purchase cost', kind: 'money', w: 80},
        {k: 'launch', label: 'Launch cost per vehicle', kind: 'money', w: 84},
        {k: 'rev', label: 'Net revenue per day', kind: 'money', w: 80},
        {k: 'opex', label: 'Running cost per day', kind: 'money', w: 80},
        {k: 'up', label: 'Uptime %', kind: 'pct', w: 66},
        {k: 'life', label: 'Life, months', kind: 'int', w: 66},
        {k: 'resale', label: 'Resale at end', kind: 'money', w: 74},
        {label: 'Profit per month', w: 80, v: function (D, i) { return U.fMoney(D.models[i].month, 0); }},
        {label: 'Payback, months', w: 74, v: function (D, i) { return U.fDec1(D.models[i].pb); }},
        {label: 'Lifetime profit', w: 84, v: function (D, i) { return U.fMoney(D.models[i].life, 0); }},
        {label: 'Return on cost', w: 70, v: function (D, i) { return U.fPct(D.models[i].roi); }},
        {label: 'Status', w: 104, status: function (D, i) { return D.models[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Net revenue per ride', v: function (D) { return U.fMoney(D.vNetRide, 2) || 'No data'; }},
    {label: 'Contribution per vehicle per day', v: function (D) { return U.fMoney(D.vContrib, 2) || 'No data'; }},
    {label: 'City EBITDA per month', v: function (D) { return U.fMoney(D.cEbitda, 0) || 'No data'; }},
    {label: 'Cities at a loss', v: function (D) { return {text: String(D.cLoss), tone: D.cLoss ? 'warn' : ''}; }},
    {label: 'Fastest payback', v: function (D) { return D.mBest ? D.mBest + ', ' + U.fDec1(D.mBestPb) + ' months' : 'No data'; }}
  ],
  headline: function (D) {
    if (D.vEbitda == null) return {unit: 'Fill in the vehicle P&L'};
    return {num: U.fMoney(D.vAfter != null ? D.vAfter : D.vEbitda, 2), unit: D.vAfter != null ? 'profit per vehicle per day after depreciation' : 'EBITDA per vehicle per day', status: (D.vAfter != null ? D.vAfter : D.vEbitda) >= 0 ? 'Profitable' : 'Loss', note: 'EBITDA ' + U.fMoney(D.vEbitda, 2) + ', ' + U.fPct(D.vMargin) + ' of net revenue'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleMobility'; S.biz.marketplace = 'Germany';
    var f = S.f;
    f.rides = 3.2; f.mins = 12; f.unlock = 1; f.perMin = 0.25; f.passShare = 30; f.passDisc = 40; f.vat = 19; f.payFee = 3;
    f.swapCost = 2.4; f.swapsDay = 0.35; f.fieldCost = 2.2; f.kmDay = 9; f.repairKm = 0.18; f.insYear = 28; f.permitYear = 50; f.cityDay = 1.8; f.vehCost = 640; f.lifeMonths = 36;
    S.t.cities = W.rows(['city', 'veh', 'rides', 'net', 'field', 'repair', 'fees', 'site'], [
      ['Berlin', 2700, 285000, 2.35, 260000, 140000, 18000, 150000],
      ['Munich', 1750, 186000, 2.60, 170000, 90000, 13000, 120000],
      ['Hamburg', 1500, 152000, 2.30, 150000, 82000, 8500, 95000],
      ['Cologne', 900, 92000, 2.20, 98000, 52000, 6000, 70000],
      ['Vienna', 1100, 121000, 2.50, 115000, 55000, 5000, 80000]
    ]);
    S.t.models = W.rows(['model', 'cost', 'launch', 'rev', 'opex', 'up', 'life', 'resale'], [
      ['S2', 520, 20, 8.1, 6.2, 87, 36, 40],
      ['S3', 640, 85, 9.4, 6.0, 91, 48, 60],
      ['S2 refurbished', 180, 10, 7.6, 6.9, 80, 18, 0]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    D.vList = W.isNum(f.perMin) || W.isNum(f.unlock) ? n0(f.unlock) + n0(f.perMin) * n0(f.mins) : null;
    D.vNetRide = D.vList != null ? D.vList * (1 - n0(f.passShare) / 100 * n0(f.passDisc) / 100) / (1 + n0(f.vat) / 100) * (1 - n0(f.payFee) / 100) : null;
    D.vRev = D.vNetRide != null && W.isNum(f.rides) ? D.vNetRide * f.rides : null;
    var lines = null;
    if (D.vRev != null) {
      var swaps = n0(f.swapCost) * n0(f.swapsDay), field = n0(f.fieldCost), rep = n0(f.kmDay) * n0(f.repairKm), ins = n0(f.insYear) / 365;
      var contrib = D.vRev - swaps - field - rep - ins;
      var permit = n0(f.permitYear) / 365, site = n0(f.cityDay);
      var ebitda = contrib - permit - site;
      var dep = f.lifeMonths > 0 && W.isNum(f.vehCost) ? f.vehCost / (f.lifeMonths * 30.44) : null;
      var after = dep != null ? ebitda - dep : null;
      lines = [D.vRev, -swaps, -field, -rep, -ins, contrib, -permit, -site, ebitda, dep != null ? -dep : null, after];
      D.vContrib = contrib; D.vEbitda = ebitda; D.vAfter = after; D.vMargin = D.vRev ? ebitda / D.vRev : null;
    } else { D.vContrib = null; D.vEbitda = null; D.vAfter = null; }
    D.pl = (lines || new Array(11).fill(null)).map(function (v) {
      return {day: v, ride: v != null && f.rides > 0 ? v / f.rides : null, month: v != null ? v * 30.44 : null, share: v != null && D.vRev ? v / D.vRev : null};
    });

    D.cLoss = 0;
    D.cities = S.t.cities.map(function (c) {
      if (!W.isNum(c.rides) || !W.isNum(c.net)) return {status: ''};
      var rev = c.rides * c.net, ebitda = rev - n0(c.field) - n0(c.repair) - n0(c.fees) - n0(c.site), margin = rev ? ebitda / rev : null;
      var status = margin == null ? '' : margin >= 0.1 ? 'Profitable' : margin >= 0 ? 'Thin margin' : 'Loss';
      if (status === 'Loss') D.cLoss++;
      return {rev: rev, ebitda: ebitda, margin: margin, pvd: c.veh > 0 ? ebitda / c.veh / 30.44 : null, status: status};
    });
    D.cRev = W.sum(D.cities.map(function (c) { return c.rev; }));
    D.cEbitda = W.sum(D.cities.map(function (c) { return c.ebitda; }));
    D.cMargin = D.cRev ? D.cEbitda / D.cRev : null;

    D.mNever = 0; D.mBest = ''; D.mBestPb = null; D.mTop = ''; D.mTopLife = null;
    D.models = S.t.models.map(function (m, i) {
      if (!W.isNum(m.cost) || !W.isNum(m.rev)) return {status: ''};
      var invest = m.cost + n0(m.launch), month = (m.rev - n0(m.opex)) * n0(m.up) / 100 * 30.44;
      var pb = month > 0 ? invest / month : null;
      var life = W.isNum(m.life) ? month * m.life + n0(m.resale) - invest : null;
      var status = pb == null || (W.isNum(m.life) && pb > m.life) ? 'Loss' : pb <= 12 ? 'Strong' : 'Fair';
      if (status === 'Loss') D.mNever++;
      if (pb != null && (D.mBestPb == null || pb < D.mBestPb)) { D.mBestPb = pb; D.mBest = m.model || 'Model ' + (i + 1); }
      if (life != null && (D.mTopLife == null || life > D.mTopLife)) { D.mTopLife = life; D.mTop = m.model || 'Model ' + (i + 1); }
      return {month: month, pb: pb, life: life, roi: life != null && invest ? life / invest : null, status: status};
    });
    return D;
  }
};
})();
