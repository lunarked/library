(function () {
var U;
window.SPEC = {
  app: 'plan-transport',
  title: 'Middle-Mile Transport Plan',
  desc: 'Turn lane volumes into trucks and cost per unit, balance contracted, spot and own-fleet capacity, and compare network designs on cost, transit time and emissions.',
  notice: 'Every tab is filled with sample data for a line-haul network between fulfillment and sort centers. Type over it, or start blank.',
  headCap: 'Transport cost per unit',
  tones: {good: ['Best', 'Covered'], warn: ['Spot heavy'], bad: ['Not covered']},
  notes: [
    'Trucks per week are lane volume over units per truck at the planned fill rate. Cost blends contracted and spot loads: spot costs the contracted rate plus the spot premium. Spot heavy flags a lane where more than 30% of loads go to spot.',
    'Carrier mix: loads needed come from the lane plan. Each carrier type offers a weekly number of loads; Not covered means the lanes need more loads than all carriers together offer.',
    'Network designs: transport and handling cost per week come from your network model or from quotes. Emissions use a factor per truck km; a common planning figure for a loaded truck is around 0.8 to 1.0 kg CO2e per km.'
  ],
  tabs: [
    {id: 'lanes', title: 'Lane plan', badge: function (D) { return D.lCpu != null ? U.fMoney(D.lCpu, 2) + ' a unit' : ''; }, sections: [
      {type: 'form', title: 'Truck and rates', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']},
        {k: 'perTruck', label: 'Units per full truck', kind: 'int', def: 1800},
        {k: 'fill', label: 'Planned fill rate', kind: 'pct', def: 85},
        {k: 'spotPrem', label: 'Spot premium over contract', kind: 'pct', def: 25}
      ], stats: [
        {label: 'Units per truck at plan fill', v: function (D) { return U.fInt(D.lPer); }},
        {label: 'Trucks per week', v: function (D) { return U.fInt(D.lTrucks); }},
        {label: 'Cost per week', v: function (D) { return U.fMoney(D.lCost, 0); }}
      ]},
      {type: 'table', k: 'lanes', title: 'Lanes', help: 'Volume is units per average week. Rate is the contracted cost per truck km.', add: 'Add a lane', cols: [
        {k: 'from', label: 'Origin', kind: 'text', w: 86},
        {k: 'to', label: 'Destination', kind: 'text', w: 90},
        {k: 'vol', label: 'Units per week', kind: 'int', w: 84, foot: 'sum'},
        {k: 'km', label: 'Km', kind: 'int', w: 60},
        {k: 'rate', label: 'Rate per km', kind: 'money', w: 66},
        {k: 'contract', label: 'Contracted share %', kind: 'pct', w: 80},
        {k: 'hours', label: 'Transit hours', kind: 'num', w: 66},
        {label: 'Trucks per week', w: 70, v: function (D, i) { return U.fInt(D.lanes[i].trucks); }, foot: function (D) { return U.fInt(D.lTrucks); }},
        {label: 'Cost per truck', w: 74, v: function (D, i) { return U.fMoney(D.lanes[i].perTruck, 0); }},
        {label: 'Cost per week', w: 84, v: function (D, i) { return U.fMoney(D.lanes[i].cost, 0); }, foot: function (D) { return U.fMoney(D.lCost, 0); }},
        {label: 'Cost per unit', w: 70, v: function (D, i) { return U.fMoney(D.lanes[i].cpu, 2); }, foot: function (D) { return U.fMoney(D.lCpu, 2); }},
        {label: 'Status', w: 86, status: function (D, i) { return D.lanes[i].status; }}
      ]},
      {type: 'charts', title: 'Cost', charts: [
        {kind: 'bars', title: 'Cost per week by lane', sub: 'With share of the total', data: function (D, S) { return {items: S.t.lanes.map(function (l, i) { return {label: (l.from || '') + ' to ' + (l.to || ''), v: D.lanes[i].cost}; }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); }), fmt: 'money', share: true}; }}
      ]}
    ]},
    {id: 'carriers', title: 'Carrier mix', badge: function (D) { return D.cStatus || ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Loads needed per week', sub: 'From the lane plan', v: function (D) { return D.lTrucks ? U.fInt(D.lTrucks) : ''; }},
        {label: 'Loads offered per week', sub: 'All carriers', v: function (D, S) { return S.t.carriers.length ? U.fInt(D.cOffer) : ''; }},
        {label: 'Cover', sub: 'Offered over needed', v: function (D) { return U.fPct(D.cCover); }, bad: function (D) { return D.cCover != null && D.cCover < 1.05; }},
        {label: 'Average on-time', sub: 'Weighted by loads offered', v: function (D) { return U.fPct(D.cOt); }}
      ]},
      {type: 'table', k: 'carriers', title: 'Carriers', help: 'One row per carrier or carrier group. Share of loads is what this carrier would get if loads are spread by its offer.', add: 'Add a carrier', cols: [
        {k: 'name', label: 'Carrier', kind: 'text', w: 140},
        {k: 'kind', label: 'Type', kind: 'sel', options: ['Contracted', 'Spot', 'Own fleet', 'Partner carrier'], w: 120},
        {k: 'loads', label: 'Loads per week offered', kind: 'int', w: 90, foot: 'sum'},
        {k: 'cost', label: 'Cost per load', kind: 'money', w: 80},
        {k: 'ot', label: 'On time %', kind: 'pct', w: 70},
        {k: 'peak', label: 'Extra loads in peak %', kind: 'pct', w: 90},
        {label: 'Share of offer', w: 80, v: function (D, i) { return U.fPct(D.carriers[i].share); }},
        {label: 'Peak loads offered', w: 90, v: function (D, i) { return U.fInt(D.carriers[i].peak); }, foot: function (D) { return U.fInt(D.cPeak); }},
        {label: 'Cost per week at share', w: 100, v: function (D, i) { return U.fMoney(D.carriers[i].week, 0); }}
      ]},
      {type: 'note', title: 'Cover check', v: function (D) { return D.cStatus ? [D.cStatus, D.cText] : ['', 'Add lanes and carriers to see the cover.']; }}
    ]},
    {id: 'designs', title: 'Network design scenarios', badge: function (D) { return D.sBest ? 'best: ' + D.sBest : ''; }, sections: [
      {type: 'form', title: 'Basis', fields: [
        {k: 'units', label: 'Units per week', kind: 'int'},
        {k: 'co2', label: 'Kg CO2e per truck km', kind: 'num', def: 0.9}
      ]},
      {type: 'tiles', items: [
        {label: 'Lowest cost design', sub: function (D) { return D.sBestCpu != null ? U.fMoney(D.sBestCpu, 2) + ' a unit' : ''; }, v: function (D) { return D.sBest; }},
        {label: 'Fastest design', sub: function (D) { return D.sFastH != null ? U.fDec1(D.sFastH) + ' hours average transit' : ''; }, v: function (D) { return D.sFast; }},
        {label: 'Lowest emissions', sub: function (D) { return D.sGreenT != null ? U.fDec1(D.sGreenT) + ' tonnes CO2e a week' : ''; }, v: function (D) { return D.sGreen; }}
      ]},
      {type: 'table', k: 'designs', title: 'Designs', help: 'The first row is today\'s network, the baseline. Truck km per week drives the emissions estimate.', add: 'Add a design', cols: [
        {k: 'name', label: 'Design', kind: 'text', w: 220},
        {k: 'trans', label: 'Transport per week', kind: 'money', w: 96},
        {k: 'handle', label: 'Handling per week', kind: 'money', w: 96},
        {k: 'km', label: 'Truck km per week', kind: 'int', w: 90},
        {k: 'hours', label: 'Average transit hours', kind: 'num', w: 86},
        {label: 'Cost per unit', w: 76, v: function (D, i) { return U.fMoney(D.designs[i].cpu, 2); }},
        {label: 'Against baseline', w: 86, v: function (D, i) { var c = D.designs[i].vs; return c == null ? '' : U.signed(U.fPct(c), c); }},
        {label: 'Tonnes CO2e a week', w: 86, v: function (D, i) { return U.fDec1(D.designs[i].t); }},
        {label: 'Result', w: 76, status: function (D, i) { return D.designs[i].status; }}
      ]},
      {type: 'charts', title: 'Comparison', charts: [
        {kind: 'bars', title: 'Cost per unit by design', sub: 'Transport plus handling', data: function (D, S) { return {items: S.t.designs.map(function (d, i) { return {label: d.name || 'Design ' + (i + 1), v: D.designs[i].cpu}; }), fmt: 'money2'}; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Trucks per week', v: function (D) { return U.fInt(D.lTrucks) || 'No data'; }},
    {label: 'Transport cost per week', v: function (D) { return U.fMoney(D.lCost, 0) || 'No data'; }},
    {label: 'Carrier cover', v: function (D) { return D.cCover == null ? 'No data' : {text: U.fPct(D.cCover), tone: D.cCover < 1.05 ? 'warn' : ''}; }},
    {label: 'Spot heavy lanes', v: function (D) { return {text: String(D.lSpot), tone: D.lSpot ? 'warn' : ''}; }},
    {label: 'Lowest cost design', v: function (D) { return D.sBest || 'No data'; }}
  ],
  headline: function (D) {
    if (D.lCpu == null) return {unit: 'Add lanes to the plan'};
    return {num: U.fMoney(D.lCpu, 2), unit: 'transport cost per unit', status: D.cStatus, note: U.fInt(D.lTrucks) + ' trucks a week, ' + U.fMoney(D.lCost, 0) + ' a week'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleNetwork'; S.biz.marketplace = '2027 to 2031';
    var f = S.f; f.currency = '€'; f.perTruck = 1800; f.fill = 85; f.spotPrem = 25; f.units = 4300000; f.co2 = 0.9;
    S.t.lanes = W.rows(['from', 'to', 'vol', 'km', 'rate', 'contract', 'hours'], [
      ['FC-W1', 'SC-W1', 830000, 35, 2.4, 100, 1.5],
      ['FC-W1', 'SC-C1', 345000, 560, 1.55, 80, 8],
      ['FC-W1', 'SC-N1', 117000, 380, 1.6, 75, 6],
      ['FC-N1', 'SC-N1', 610000, 25, 2.5, 100, 1],
      ['FC-N1', 'SC-C1', 216000, 290, 1.6, 85, 4.5],
      ['FC-S1', 'SC-S1', 690000, 30, 2.4, 100, 1.2],
      ['FC-S1', 'SC-C1', 155000, 590, 1.5, 60, 8.5],
      ['FC-S1', 'SC-E1', 89000, 450, 1.6, 55, 7]
    ]);
    S.t.carriers = W.rows(['name', 'kind', 'loads', 'cost', 'ot', 'peak'], [
      ['Contract group A', 'Contracted', 900, 420, 96, 10],
      ['Contract group B', 'Contracted', 500, 460, 93, 15],
      ['Own shuttles', 'Own fleet', 450, 95, 98, 5],
      ['Spot market', 'Spot', 150, 690, 88, 40],
      ['Partner carriers', 'Partner carrier', 150, 510, 94, 20]
    ]);
    S.t.designs = W.rows(['name', 'trans', 'handle', 'km', 'hours'], [
      ['Today: all flows through regional sort centers', 1180000, 2150000, 690000, 5.2],
      ['Add a Capital region cross dock', 1090000, 2210000, 630000, 4.6],
      ['Direct injection from FCs to depots', 1290000, 1980000, 760000, 3.9],
      ['Rail for long lanes over 450 km', 1120000, 2150000, 520000, 7.1]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    D.lPer = W.isNum(f.perTruck) ? f.perTruck * n0(f.fill) / 100 : null;
    D.lSpot = 0;
    D.lanes = S.t.lanes.map(function (l) {
      if (!W.isNum(l.vol) || !(D.lPer > 0)) return {status: ''};
      var trucks = Math.ceil(l.vol / D.lPer), c = W.isNum(l.contract) ? l.contract / 100 : 1;
      var base = n0(l.km) * n0(l.rate), perTruck = base * (c + (1 - c) * (1 + n0(f.spotPrem) / 100));
      var cost = trucks * perTruck;
      var status = c < 0.7 ? 'Spot heavy' : 'OK';
      if (status === 'Spot heavy') D.lSpot++;
      return {trucks: trucks, perTruck: perTruck, cost: cost, cpu: l.vol ? cost / l.vol : null, status: status};
    });
    D.lTrucks = W.sum(D.lanes.map(function (x) { return x.trucks; }));
    D.lCost = W.sum(D.lanes.map(function (x) { return x.cost; }));
    var vol = W.sum(S.t.lanes.map(function (l) { return l.vol; }));
    D.lCpu = vol ? D.lCost / vol : null;

    D.cOffer = W.sum(S.t.carriers.map(function (c) { return c.loads; }));
    D.cCover = D.lTrucks && S.t.carriers.length ? D.cOffer / D.lTrucks : null;
    var otw = 0;
    D.carriers = S.t.carriers.map(function (c) {
      if (!W.isNum(c.loads)) return {};
      var share = D.cOffer ? c.loads / D.cOffer : null;
      if (W.isNum(c.ot)) otw += c.ot / 100 * c.loads;
      return {share: share, peak: c.loads * (1 + n0(c.peak) / 100), week: share != null && D.lTrucks ? share * D.lTrucks * n0(c.cost) : null};
    });
    D.cPeak = W.sum(D.carriers.map(function (x) { return x.peak; }));
    D.cOt = D.cOffer ? otw / D.cOffer : null;
    D.cStatus = D.cCover == null ? '' : D.cCover >= 1.05 ? 'Covered' : D.cCover >= 1 ? 'Tight' : 'Not covered';
    D.cText = D.cCover == null ? '' : D.cStatus === 'Covered' ? 'Carriers offer ' + U.fInt(D.cOffer - D.lTrucks) + ' loads a week above need. In peak they offer ' + U.fInt(D.cPeak) + ' loads.' : D.cStatus === 'Tight' ? 'Less than 5% spare loads. One carrier failing leaves lanes uncovered; book a reserve.' : 'Short by ' + U.fInt(D.lTrucks - D.cOffer) + ' loads a week. Contract more capacity before the plan goes live.';

    var base = null;
    D.sBest = ''; D.sBestCpu = null; D.sFast = ''; D.sFastH = null; D.sGreen = ''; D.sGreenT = null;
    D.designs = S.t.designs.map(function (d, i) {
      if (!W.isNum(d.trans)) return {status: ''};
      var tot = d.trans + n0(d.handle), cpu = f.units > 0 ? tot / f.units : null, t = W.isNum(d.km) ? d.km * n0(f.co2) / 1000 : null;
      if (base == null) base = tot;
      var nm = d.name || 'Design ' + (i + 1);
      if (cpu != null && (D.sBestCpu == null || cpu < D.sBestCpu)) { D.sBestCpu = cpu; D.sBest = nm; }
      if (W.isNum(d.hours) && (D.sFastH == null || d.hours < D.sFastH)) { D.sFastH = d.hours; D.sFast = nm; }
      if (t != null && (D.sGreenT == null || t < D.sGreenT)) { D.sGreenT = t; D.sGreen = nm; }
      return {cpu: cpu, vs: base ? tot / base - 1 : null, t: t};
    });
    D.designs.forEach(function (x, i) { if (x.cpu != null) x.status = (S.t.designs[i].name || 'Design ' + (i + 1)) === D.sBest ? 'Best' : i === 0 ? 'Baseline' : ''; });
    return D;
  }
};
})();
