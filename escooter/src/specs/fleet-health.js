(function () {
var U;
var STATUSES = ['Live', 'Low battery', 'Field repair', 'In workshop', 'Awaiting parts', 'Missing', 'Retired'];
var KEYS = ['live', 'low', 'field', 'shop', 'parts', 'missing'];
function rel(W, n) { var d = new Date(); return W.isoOf(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + n * W.DAY); }
window.SPEC = {
  app: 'esc-fleet-health',
  title: 'Fleet Health',
  desc: 'See how much of the fleet can earn today under one shared status model, track vehicle age and wear by batch, and log losses, theft and vandalism.',
  notice: 'Every tab is filled with sample data for an operator in five cities. Type over it, or start blank.',
  headCap: 'Deployable today',
  tones: {good: ['Above target'], warn: ['Below target', 'Plan replacement'], bad: ['Replace', 'High loss']},
  notes: [
    'One status model for every team: Live and Low battery are deployable. Field repair, In workshop and Awaiting parts are in repair. Missing is not found for 48 hours or more. Retired leaves the fleet and is not counted in the active fleet.',
    'Deployable rate is deployable vehicles over the active fleet, which is every vehicle except Retired.',
    'Life used is the higher of distance over design distance and battery cycles over design cycles. Plan replacement from 75%, replace from 90%.',
    'Net loss is vehicles reported missing less those found again. Loss rate is net loss over the fleet in that city and month.'
  ],
  tabs: [
    {id: 'status', title: 'Fleet status dashboard', badge: function (D) { return D.dep != null ? U.fPct(D.dep) + ' deployable' : ''; }, sections: [
      {type: 'form', title: 'Target', fields: [
        {k: 'target', label: 'Deployable rate target', kind: 'pct', def: 85},
        {k: 'asOf', label: 'Counted on', kind: 'date'}
      ]},
      {type: 'tiles', items: [
        {label: 'Deployable', sub: function (D) { return D.dep != null ? U.fInt(D.depN) + ' of ' + U.fInt(D.active) + ' active vehicles' : 'Live plus low battery'; }, v: function (D) { return U.fPct(D.dep); }, bad: function (D, S) { return D.dep != null && D.dep * 100 < U.n0(S.f.target); }},
        {label: 'In repair', sub: 'Field repair and workshop', v: function (D, S) { return S.t.cities.length ? U.fInt(D.tot.field + D.tot.shop) : ''; }},
        {label: 'Awaiting parts', sub: function (D) { return D.active ? U.fPct(D.tot.parts / D.active) + ' of the active fleet' : ''; }, v: function (D, S) { return S.t.cities.length ? U.fInt(D.tot.parts) : ''; }, bad: function (D) { return D.active && D.tot.parts / D.active > 0.05; }},
        {label: 'Missing', sub: 'Not found for 48 hours or more', v: function (D, S) { return S.t.cities.length ? U.fInt(D.tot.missing) : ''; }}
      ]},
      {type: 'table', k: 'cities', title: 'Vehicles by city and status', help: 'Count every vehicle once, in its status at the cut-off time. Retired vehicles are left out of the active fleet.', add: 'Add a city', cols: [
        {k: 'city', label: 'City', kind: 'text', w: 110},
        {k: 'live', label: 'Live', kind: 'int', w: 64, foot: 'sum'},
        {k: 'low', label: 'Low battery', kind: 'int', w: 66, foot: 'sum'},
        {k: 'field', label: 'Field repair', kind: 'int', w: 66, foot: 'sum'},
        {k: 'shop', label: 'In workshop', kind: 'int', w: 70, foot: 'sum'},
        {k: 'parts', label: 'Awaiting parts', kind: 'int', w: 70, foot: 'sum'},
        {k: 'missing', label: 'Missing', kind: 'int', w: 64, foot: 'sum'},
        {k: 'retired', label: 'Retired this month', kind: 'int', w: 74, foot: 'sum'},
        {label: 'Active fleet', w: 70, v: function (D, i) { return U.fInt(D.cities[i].active); }, foot: function (D) { return U.fInt(D.active); }},
        {label: 'Deployable', w: 76, v: function (D, i) { return U.fInt(D.cities[i].dep); }, foot: function (D) { return U.fInt(D.depN); }},
        {label: 'Deployable rate', w: 76, v: function (D, i) { return U.fPct(D.cities[i].rate); }, foot: function (D) { return U.fPct(D.dep); }},
        {label: 'Status', w: 104, status: function (D, i) { return D.cities[i].status; }}
      ]},
      {type: 'charts', title: 'Where the fleet is', charts: [
        {kind: 'bars', title: 'Active fleet by status', sub: 'All cities, with share', data: function (D) { return {items: STATUSES.slice(0, 6).map(function (s, i) { return {label: s, v: D.tot[KEYS[i]]}; }), fmt: 'int', share: true}; }},
        {kind: 'bars', title: 'Deployable rate by city', sub: 'Against the target', data: function (D, S) { return {items: S.t.cities.map(function (c, i) { return {label: c.city || 'City ' + (i + 1), v: D.cities[i].rate == null ? null : D.cities[i].rate * 100}; }), fmt: 'dec1'}; }}
      ]},
      {type: 'table', k: 'defs', title: 'Status definitions', help: 'Agree these once with every team and use the same words in every report.', fixed: STATUSES, cols: [
        {fixedLabel: true, label: 'Status', w: 130, num: false},
        {k: 'def', label: 'Definition', kind: 'text', w: 430},
        {k: 'counts', label: 'Deployable', kind: 'sel', options: ['No', 'Yes'], w: 90},
        {k: 'owner', label: 'Owner', kind: 'text', w: 150},
        {k: 'exit', label: 'Leaves this status when', kind: 'text', w: 260}
      ]}
    ]},
    {id: 'lifecycle', title: 'Vehicle lifecycle tracker', badge: function (D) { return D.lReplace ? D.lReplace + ' to replace' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Vehicles tracked', sub: 'All batches', v: function (D, S) { return S.t.batches.length ? U.fInt(D.lVeh) : ''; }},
        {label: 'Average age', sub: 'Months in service, weighted by vehicles', v: function (D) { return D.lAge != null ? U.fDec1(D.lAge) + ' months' : ''; }},
        {label: 'Plan replacement', sub: 'Vehicles in batches at 75% to 90% of life', v: function (D, S) { return S.t.batches.length ? U.fInt(D.lPlanV) : ''; }},
        {label: 'Replace', sub: 'Vehicles in batches past 90% of life', v: function (D, S) { return S.t.batches.length ? U.fInt(D.lReplaceV) : ''; }, bad: function (D) { return D.lReplaceV > 0; }}
      ]},
      {type: 'table', k: 'batches', title: 'Batches', help: 'One row per delivery batch. Take average distance and battery cycles from the vehicle telemetry.', add: 'Add a batch', cols: [
        {k: 'batch', label: 'Batch', kind: 'text', w: 96},
        {k: 'model', label: 'Model', kind: 'text', w: 80},
        {k: 'city', label: 'City', kind: 'text', w: 90},
        {k: 'veh', label: 'Vehicles', kind: 'int', w: 64, foot: 'sum'},
        {k: 'since', label: 'In service since', kind: 'date', w: 128},
        {k: 'km', label: 'Average km', kind: 'int', w: 70},
        {k: 'cycles', label: 'Average battery cycles', kind: 'int', w: 76},
        {k: 'lifeKm', label: 'Design life km', kind: 'int', w: 72},
        {k: 'lifeCycles', label: 'Design life cycles', kind: 'int', w: 72},
        {label: 'Age, months', w: 62, v: function (D, i) { return U.fDec1(D.batches[i].age); }},
        {label: 'Life used', w: 62, v: function (D, i) { return U.fPct(D.batches[i].used); }},
        {label: 'Months left', w: 62, v: function (D, i) { return U.fDec1(D.batches[i].leftM); }},
        {label: 'Status', w: 124, status: function (D, i) { return D.batches[i].status; }}
      ]},
      {type: 'charts', title: 'Wear', charts: [
        {kind: 'bars', title: 'Life used by batch', sub: 'Higher of distance and battery cycles, %', data: function (D, S) { return {items: S.t.batches.map(function (b, i) { return {label: (b.batch || 'Batch ' + (i + 1)) + (b.model ? ' (' + b.model + ')' : ''), v: D.batches[i].used == null ? null : D.batches[i].used * 100}; }), fmt: 'dec1'}; }}
      ]}
    ]},
    {id: 'losses', title: 'Loss, theft and vandalism log', badge: function (D) { return D.xRate != null ? U.fPct(D.xRate) + ' lost' : ''; }, sections: [
      {type: 'form', title: 'Costs', fields: [
        {k: 'vehValue', label: 'Book value of a lost vehicle', kind: 'money', note: 'Purchase price less depreciation so far'},
        {k: 'vandalCost', label: 'Average vandalism repair', kind: 'money'},
        {k: 'lossLimit', label: 'Loss rate limit per month', kind: 'pct', def: 0.5}
      ]},
      {type: 'tiles', items: [
        {label: 'Net vehicles lost', sub: 'All rows', v: function (D, S) { return S.t.loss.length ? U.fInt(D.xNet) : ''; }},
        {label: 'Loss rate', sub: 'Net lost over fleet, all rows', v: function (D) { return U.fPct(D.xRate); }, bad: function (D, S) { return D.xRate != null && D.xRate * 100 > U.n0(S.f.lossLimit); }},
        {label: 'Vandalism repairs', sub: 'All rows', v: function (D, S) { return S.t.loss.length ? U.fInt(D.xVandal) : ''; }},
        {label: 'Cost', sub: 'Lost vehicles plus vandalism repairs', v: function (D, S) { return S.t.loss.length ? U.fMoney(D.xCost, 0) : ''; }}
      ]},
      {type: 'table', k: 'loss', title: 'Monthly log', help: 'One row per city and month. Stolen is confirmed theft with a police report number on file.', add: 'Add a month', cols: [
        {k: 'month', label: 'Month starting', kind: 'date', w: 128},
        {k: 'city', label: 'City', kind: 'text', w: 96},
        {k: 'fleet', label: 'Fleet', kind: 'int', w: 64},
        {k: 'missing', label: 'Reported missing', kind: 'int', w: 70, foot: 'sum'},
        {k: 'found', label: 'Found again', kind: 'int', w: 64, foot: 'sum'},
        {k: 'stolen', label: 'Stolen, confirmed', kind: 'int', w: 70, foot: 'sum'},
        {k: 'water', label: 'Recovered from water', kind: 'int', w: 76, foot: 'sum'},
        {k: 'vandal', label: 'Vandalism repairs', kind: 'int', w: 74, foot: 'sum'},
        {label: 'Net lost', w: 60, v: function (D, i) { return U.fInt(D.loss[i].net); }, foot: function (D) { return U.fInt(D.xNet); }},
        {label: 'Loss rate', w: 64, v: function (D, i) { return U.fPct(D.loss[i].rate); }},
        {label: 'Cost', w: 76, v: function (D, i) { return U.fMoney(D.loss[i].cost, 0); }, foot: function (D) { return U.fMoney(D.xCost, 0); }},
        {label: 'Status', w: 90, status: function (D, i) { return D.loss[i].status; }}
      ]},
      {type: 'charts', title: 'Trend', charts: [
        {kind: 'bars', title: 'Net vehicles lost by city', sub: 'All rows', data: function (D) { return {items: D.xByCity, fmt: 'int', share: true}; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Active fleet', v: function (D) { return U.fInt(D.active) || 'No data'; }},
    {label: 'Awaiting parts', v: function (D) { return U.fInt(D.tot.parts); }},
    {label: 'Cities below target', v: function (D) { return {text: String(D.below), tone: D.below ? 'warn' : ''}; }},
    {label: 'Batches to replace', v: function (D) { return {text: String(D.lReplace), tone: D.lReplace ? 'warn' : ''}; }},
    {label: 'Loss rate', v: function (D) { return U.fPct(D.xRate) || 'No data'; }}
  ],
  headline: function (D, S) {
    if (D.dep == null) return {unit: 'Count the fleet by city and status'};
    return {num: U.fPct(D.dep), unit: 'of the active fleet deployable', status: D.dep * 100 >= U.n0(S.f.target) ? 'Above target' : 'Below target', note: U.fInt(D.depN) + ' of ' + U.fInt(D.active) + ' vehicles' + (S.f.asOf ? ', ' + U.fDate(U.toUTC(S.f.asOf)) : '')};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleMobility'; S.biz.marketplace = 'Germany and Austria';
    S.f.target = 85; S.f.asOf = rel(W, -1); S.f.vehValue = 380; S.f.vandalCost = 65; S.f.lossLimit = 0.5;
    S.t.cities = W.rows(['city', 'live', 'low', 'field', 'shop', 'parts', 'missing', 'retired'], [
      ['Berlin', 2120, 260, 70, 180, 160, 48, 12],
      ['Munich', 1380, 150, 30, 60, 22, 14, 4],
      ['Hamburg', 1180, 140, 38, 70, 60, 22, 6],
      ['Cologne', 720, 80, 20, 40, 34, 12, 3],
      ['Vienna', 900, 80, 18, 36, 14, 8, 2]
    ]);
    var defs = [
      ['On the street, battery above swap level, no open fault', 'Yes', 'City ops', 'Battery drops below swap level or a fault is reported'],
      ['On the street, battery below swap level, still rentable', 'Yes', 'Field ops', 'Battery is swapped'],
      ['Fault found, fixed on the street or in the van', 'No', 'Field ops', 'Fixed in 24 hours, or moved to the workshop'],
      ['In the workshop, repair started or queued', 'No', 'Repair', 'Repair done and quality check passed'],
      ['Repair blocked by a missing part', 'No', 'Parts', 'Part arrives and repair restarts'],
      ['No signal or not found for 48 hours', 'No', 'City ops', 'Found, or written off after 30 days'],
      ['Written off, sold or scrapped', 'No', 'Fleet manager', 'Never: final status']
    ];
    S.t.defs.forEach(function (r, i) { r.def = defs[i][0]; r.counts = defs[i][1]; r.owner = defs[i][2]; r.exit = defs[i][3]; });
    S.t.batches = W.rows(['batch', 'model', 'city', 'veh', 'since', 'km', 'cycles', 'lifeKm', 'lifeCycles'], [
      ['B-2023-04', 'S2', 'Berlin', 1200, rel(W, -1290), 8900, 760, 10000, 800],
      ['B-2024-03', 'S2', 'Munich', 1500, rel(W, -960), 6800, 560, 10000, 800],
      ['B-2024-09', 'S2', 'Hamburg', 1450, rel(W, -780), 5200, 450, 10000, 800],
      ['B-2025-04', 'S2', 'Berlin', 1600, rel(W, -575), 3900, 320, 10000, 800],
      ['B-2026-03', 'S3', 'Vienna', 1100, rel(W, -250), 1500, 120, 14000, 1200]
    ]);
    var m = function (k) { var d = new Date(); return W.isoOf(Date.UTC(d.getFullYear(), d.getMonth() - k, 1)); };
    S.t.loss = W.rows(['month', 'city', 'fleet', 'missing', 'found', 'stolen', 'water', 'vandal'], [
      [m(2), 'Berlin', 2850, 64, 41, 14, 3, 120],
      [m(2), 'Hamburg', 1560, 30, 21, 6, 2, 48],
      [m(1), 'Berlin', 2800, 71, 40, 19, 4, 136],
      [m(1), 'Hamburg', 1540, 28, 22, 4, 1, 52],
      [m(1), 'Cologne', 920, 12, 9, 2, 3, 30]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    D.tot = {}; KEYS.forEach(function (k) { D.tot[k] = W.sum(S.t.cities.map(function (c) { return c[k]; })); });
    D.below = 0;
    D.cities = S.t.cities.map(function (c) {
      var active = W.sum(KEYS.map(function (k) { return c[k]; }));
      if (!active) return {status: ''};
      var dep = n0(c.live) + n0(c.low), rate = dep / active;
      var ok = rate * 100 >= n0(f.target);
      if (!ok) D.below++;
      return {active: active, dep: dep, rate: rate, status: ok ? 'Above target' : 'Below target'};
    });
    D.active = W.sum(KEYS.map(function (k) { return D.tot[k]; }));
    D.depN = D.tot.live + D.tot.low;
    D.dep = D.active ? D.depN / D.active : null;

    var tdy = W.isoOf(today), ageW = 0, ageN = 0;
    D.lReplace = 0; D.lReplaceV = 0; D.lPlanV = 0;
    D.batches = S.t.batches.map(function (b) {
      var age = b.since ? W.days(b.since, tdy) / 30.44 : null;
      var uk = W.ratio(b.km, b.lifeKm), uc = W.ratio(b.cycles, b.lifeCycles);
      var used = uk == null && uc == null ? null : Math.max(n0(uk), n0(uc));
      if (used == null) return {age: age, status: ''};
      var leftM = age > 0 && used > 0 && used < 1 ? age * (1 - used) / used : used >= 1 ? 0 : null;
      var status = used >= 0.9 ? 'Replace' : used >= 0.75 ? 'Plan replacement' : 'Healthy';
      if (status === 'Replace') { D.lReplace++; D.lReplaceV += n0(b.veh); }
      if (status === 'Plan replacement') D.lPlanV += n0(b.veh);
      if (age != null && W.isNum(b.veh)) { ageW += age * b.veh; ageN += b.veh; }
      return {age: age, used: used, leftM: leftM, status: status};
    });
    D.lVeh = W.sum(S.t.batches.map(function (b) { return b.veh; }));
    D.lAge = ageN ? ageW / ageN : null;

    var byCity = {}, fleetSum = 0;
    D.loss = S.t.loss.map(function (r) {
      if (!W.isNum(r.missing)) return {status: ''};
      var net = r.missing - n0(r.found), rate = r.fleet > 0 ? net / r.fleet : null;
      var cost = net * n0(f.vehValue) + n0(r.vandal) * n0(f.vandalCost);
      var k = r.city || 'No city'; byCity[k] = n0(byCity[k]) + net;
      fleetSum += n0(r.fleet);
      return {net: net, rate: rate, cost: cost, status: rate == null ? '' : rate * 100 > n0(f.lossLimit) ? 'High loss' : 'OK'};
    });
    D.xNet = W.sum(D.loss.map(function (x) { return x.net; }));
    D.xVandal = W.sum(S.t.loss.map(function (r) { return r.vandal; }));
    D.xCost = W.sum(D.loss.map(function (x) { return x.cost; }));
    D.xRate = fleetSum > 0 ? D.xNet / fleetSum : null;
    D.xByCity = Object.keys(byCity).map(function (k) { return {label: k, v: byCity[k]}; }).sort(function (a, b) { return b.v - a.v; });
    return D;
  }
};
})();
