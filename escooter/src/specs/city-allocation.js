(function () {
var U;
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function rel(W, n) { var d = new Date(); return W.isoOf(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + n * W.DAY); }
window.SPEC = {
  app: 'esc-city-allocation',
  title: 'City Fleet Allocation',
  desc: 'Split the deployable fleet across cities by demand and permit caps, rebalance zones, track permits and city duties, and plan the fleet by season.',
  notice: 'Every tab is filled with sample data for an operator in five cities. Type over it, or start blank.',
  headCap: 'Deployable fleet',
  tones: {good: ['Allocated', 'Balanced'], warn: ['Capped', 'Report due', 'Surplus', 'Deficit'], bad: ['Below minimum', 'Short']},
  notes: [
    'Allocation runs on deployable vehicles only: live plus low battery, from the Fleet Health workbook. Vehicles in repair or awaiting parts are not counted, so no city is promised fleet it cannot get.',
    'Need per city is forecast rides per day over the target rides per vehicle per day. Each city gets at least its contract minimum and never more than its permit cap. If the pool is too small, every city first gets its minimum, then the rest goes to cities in order of net revenue per ride, so the city that earns least per ride is the one left short.',
    'Zone targets split a city\'s fleet by each zone\'s share of rides. A move is one vehicle taken from a surplus zone to a deficit zone.',
    'Seasonality is a monthly index where 100% is the peak month. Plan the fleet close to demand: a gap above 10 points means riders wait, a fleet more than 15 points above demand means vehicles stand idle and cost money.'
  ],
  tabs: [
    {id: 'allocation', title: 'City allocation model', badge: function (D) { return D.aCities ? D.aCities + ' cities' : ''; }, sections: [
      {type: 'form', title: 'Fleet pool and targets', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']},
        {k: 'pool', label: 'Deployable vehicles to allocate', kind: 'int', note: 'Live plus low battery, all cities'},
        {k: 'rpvd', label: 'Target rides per vehicle per day', kind: 'num', def: 3.5},
        {k: 'reserve', label: 'Reserve kept back', kind: 'pct', def: 3, note: 'Held for swaps and new launches'}
      ], stats: [
        {label: 'Vehicles to allocate', v: function (D) { return U.fInt(D.aPoolNet); }},
        {label: 'Total need', v: function (D) { return U.fInt(D.aNeed); }},
        {label: 'Pool against need', v: function (D) { return D.aCover == null ? '' : {text: U.fPct(D.aCover), tone: D.aCover < 1 ? 'warn' : ''}; }}
      ]},
      {type: 'tiles', items: [
        {label: 'Allocated', sub: 'Across all cities', v: function (D, S) { return S.t.cities.length ? U.fInt(D.aAlloc) : ''; }},
        {label: 'Rides per vehicle per day', sub: 'Expected at this allocation', v: function (D) { return U.fDec2(D.aRpvd); }},
        {label: 'Rides per day', sub: 'Forecast, all cities', v: function (D, S) { return S.t.cities.length ? U.fInt(D.aRides) : ''; }},
        {label: 'Cities short', sub: 'Allocation below need', v: function (D, S) { return S.t.cities.length ? String(D.aShort) : ''; }, bad: function (D) { return D.aShort > 0; }}
      ]},
      {type: 'table', k: 'cities', title: 'Cities', help: 'Forecast rides per day for the coming weeks. Minimum is the fleet the city contract or tender requires. Cap is the permit limit.', add: 'Add a city', cols: [
        {k: 'city', label: 'City', kind: 'text', w: 120},
        {k: 'rides', label: 'Rides per day', kind: 'int', w: 76, foot: 'sum'},
        {k: 'rev', label: 'Net revenue per ride', kind: 'money', w: 76},
        {k: 'min', label: 'Contract minimum', kind: 'int', w: 76},
        {k: 'cap', label: 'Permit cap', kind: 'int', w: 70},
        {k: 'now', label: 'Deployed now', kind: 'int', w: 74, foot: 'sum'},
        {label: 'Need', w: 64, v: function (D, i) { return U.fInt(D.cities[i].need); }},
        {label: 'Allocate', w: 70, v: function (D, i) { return U.fInt(D.cities[i].alloc); }, foot: function (D) { return U.fInt(D.aAlloc); }},
        {label: 'Change', w: 64, v: function (D, i) { var c = D.cities[i].chg; return c == null ? '' : U.signed(U.fInt(c), c); }},
        {label: 'Rides per vehicle', w: 70, v: function (D, i) { return U.fDec2(D.cities[i].rpvd); }},
        {label: 'Revenue per vehicle per day', w: 90, v: function (D, i) { return U.fMoney(D.cities[i].rpv, 2); }},
        {label: 'Status', w: 104, status: function (D, i) { return D.cities[i].status; }}
      ]},
      {type: 'charts', title: 'Allocation', charts: [
        {kind: 'bars', title: 'Vehicles allocated by city', sub: 'With share of the pool', data: function (D, S) { return {items: S.t.cities.map(function (c, i) { return {label: c.city || 'City ' + (i + 1), v: D.cities[i].alloc}; }), fmt: 'int', share: true}; }}
      ]}
    ]},
    {id: 'rebalancing', title: 'Zone rebalancing plan', badge: function (D) { return D.zMoves ? D.zMoves + ' moves' : ''; }, sections: [
      {type: 'form', title: 'Van and crew', fields: [
        {k: 'perTrip', label: 'Vehicles per van trip', kind: 'int', def: 12},
        {k: 'tripMin', label: 'Minutes per van trip', kind: 'int', def: 45, note: 'Load, drive, unload and place'},
        {k: 'vanHours', label: 'Van hours per night', kind: 'num', def: 7}
      ]},
      {type: 'tiles', items: [
        {label: 'Vehicles to move', sub: 'From surplus to deficit zones', v: function (D, S) { return S.t.zones.length ? U.fInt(D.zMoves) : ''; }},
        {label: 'Van trips', sub: 'At the vehicles per trip above', v: function (D, S) { return S.t.zones.length ? U.fInt(D.zTrips) : ''; }},
        {label: 'Van hours', sub: 'For tonight\'s moves', v: function (D, S) { return S.t.zones.length ? U.fDec1(D.zHours) : ''; }},
        {label: 'Vans needed', sub: 'At the van hours per night above', v: function (D, S) { return S.t.zones.length ? U.fInt(D.zVans) : ''; }}
      ]},
      {type: 'table', k: 'zones', title: 'Zones', help: 'One row per zone. Ride share is the zone\'s share of its city\'s rides over the last 14 days. Shares in one city should add up to 100%.', add: 'Add a zone', cols: [
        {k: 'city', label: 'City', kind: 'text', w: 104},
        {k: 'zone', label: 'Zone', kind: 'text', w: 150},
        {k: 'share', label: 'Ride share %', kind: 'pct', w: 70},
        {k: 'now', label: 'Vehicles now', kind: 'int', w: 72},
        {label: 'City fleet', w: 70, v: function (D, i) { return U.fInt(D.zones[i].fleet); }},
        {label: 'Target', w: 64, v: function (D, i) { return U.fInt(D.zones[i].target); }},
        {label: 'Gap', w: 64, v: function (D, i) { var g = D.zones[i].gap; return g == null ? '' : U.signed(U.fInt(g), g); }},
        {label: 'Shares in city', w: 74, v: function (D, i) { var s = D.zones[i].cityShare; return s == null ? '' : {text: U.fPct(s / 100), tone: Math.abs(s - 100) > 1 ? 'warn' : ''}; }},
        {label: 'Status', w: 90, status: function (D, i) { return D.zones[i].status; }}
      ]}
    ]},
    {id: 'permits', title: 'Permit and cap register', badge: function (D) { return D.pAlert ? D.pAlert + ' to act on' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Permits held', sub: 'Cities in the register', v: function (D, S) { return S.t.permits.length ? String(S.t.permits.length) : ''; }},
        {label: 'Next expiry', sub: function (D) { return D.pNextCity ? D.pNextCity : 'Earliest permit end'; }, v: function (D) { return D.pNext != null ? U.fDate(D.pNext) : ''; }},
        {label: 'Reports due in 14 days', sub: 'City data reporting', v: function (D, S) { return S.t.permits.length ? String(D.pReports) : ''; }, bad: function (D) { return D.pReports > 0; }},
        {label: 'Permit fees per year', sub: 'At the current cap', v: function (D, S) { return S.t.permits.length ? U.fMoney(D.pFees, 0) : ''; }}
      ]},
      {type: 'table', k: 'permits', title: 'Permits', help: 'One row per city. Write the main rule set in Rules, for example parking only in marked bays or no riding in parks.', add: 'Add a permit', cols: [
        {k: 'city', label: 'City', kind: 'text', w: 96},
        {k: 'owner', label: 'Owner', kind: 'text', w: 96},
        {k: 'end', label: 'Permit ends', kind: 'date', w: 128},
        {k: 'cap', label: 'Fleet cap', kind: 'int', w: 64},
        {k: 'dep', label: 'Deployed', kind: 'int', w: 64},
        {k: 'fee', label: 'Fee per vehicle per year', kind: 'money', w: 80},
        {k: 'rules', label: 'Rules', kind: 'text', w: 170},
        {k: 'report', label: 'Next report due', kind: 'date', w: 128},
        {label: 'Cap used', w: 60, v: function (D, i) { var u = D.permits[i].use; return u == null ? '' : {text: U.fPct(u), tone: u > 1 ? 'bad' : u > 0.95 ? 'warn' : ''}; }},
        {label: 'Days left', w: 56, v: function (D, i) { return U.fInt(D.permits[i].left); }},
        {label: 'Status', w: 104, status: function (D, i) { return D.permits[i].status; }}
      ]}
    ]},
    {id: 'season', title: 'Season and weather plan', badge: function (D) { return D.sGaps ? D.sGaps + ' months off plan' : ''; }, sections: [
      {type: 'form', title: 'Peak fleet', fields: [
        {k: 'peak', label: 'Fleet in the peak month', kind: 'int', note: 'All cities, deployable'}
      ], stats: [
        {label: 'Lowest month fleet', v: function (D) { return U.fInt(D.sLow); }},
        {label: 'Vehicles to store off season', v: function (D) { return U.fInt(D.sStore); }},
        {label: 'Months off plan', v: function (D) { return D.sRows ? {text: String(D.sGaps), tone: D.sGaps ? 'warn' : ''} : ''; }}
      ]},
      {type: 'table', k: 'months', title: 'Months', help: 'Demand is rides as a share of the peak month. Rain days and frost days come from the weather record. Fleet plan is the share of peak fleet you will deploy.', fixed: MON, cols: [
        {fixedLabel: true, label: 'Month', w: 70, num: false},
        {k: 'demand', label: 'Demand % of peak', kind: 'pct', w: 90},
        {k: 'rain', label: 'Rain days', kind: 'int', w: 70},
        {k: 'frost', label: 'Frost days', kind: 'int', w: 70},
        {k: 'plan', label: 'Fleet % of peak', kind: 'pct', w: 90},
        {label: 'Fleet', w: 80, v: function (D, i) { return U.fInt(D.months[i].fleet); }},
        {label: 'Gap, points', w: 80, v: function (D, i) { var g = D.months[i].gap; return g == null ? '' : U.signed(U.fInt(g), g); }},
        {k: 'note', label: 'Notes', kind: 'text', w: 230},
        {label: 'Status', w: 90, status: function (D, i) { return D.months[i].status; }}
      ]},
      {type: 'charts', title: 'Demand and fleet', charts: [
        {kind: 'line', title: 'Demand by month', sub: '% of the peak month', data: function (D, S) { return {pts: S.t.months.map(function (m, i) { return {label: MON[i], y: W0(m.demand)}; }), fmt: 'int', unit: '%', area: true}; }},
        {kind: 'line', title: 'Fleet plan by month', sub: 'Vehicles deployed', data: function (D, S) { return {pts: D.months.map(function (m, i) { return {label: MON[i], y: m.fleet}; }), fmt: 'int'}; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Cities', v: function (D) { return String(D.aCities); }},
    {label: 'Vehicles allocated', v: function (D) { return U.fInt(D.aAlloc) || 'No data'; }},
    {label: 'Cities short', v: function (D) { return {text: String(D.aShort), tone: D.aShort ? 'warn' : ''}; }},
    {label: 'Zone moves tonight', v: function (D) { return String(D.zMoves); }},
    {label: 'Permits to act on', v: function (D) { return {text: String(D.pAlert), tone: D.pAlert ? 'warn' : ''}; }}
  ],
  headline: function (D, S) {
    if (!U.isNum(S.f.pool)) return {unit: 'Enter the deployable fleet to allocate'};
    return {num: U.fInt(S.f.pool), unit: 'vehicles to allocate', status: D.aShort ? 'Short' : D.aCities ? 'Allocated' : '', note: D.aCities ? D.aCities + ' cities, ' + U.fDec2(D.aRpvd) + ' rides per vehicle per day' : ''};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleMobility'; S.biz.marketplace = 'Germany and Austria';
    var f = S.f; f.pool = 7400; f.rpvd = 3.5; f.reserve = 3; f.peak = 8200;
    S.t.cities = W.rows(['city', 'rides', 'rev', 'min', 'cap', 'now'], [
      ['Berlin', 9800, 2.35, 2000, 3000, 2600],
      ['Munich', 6300, 2.60, 1200, 1800, 1650],
      ['Hamburg', 5200, 2.30, 1000, 1600, 1500],
      ['Cologne', 3400, 2.20, 600, 1000, 900],
      ['Vienna', 4100, 2.50, 800, 1500, 1050]
    ]);
    S.t.zones = W.rows(['city', 'zone', 'share', 'now'], [
      ['Berlin', 'Mitte', 30, 640], ['Berlin', 'Kreuzberg and Neukoelln', 28, 820], ['Berlin', 'Prenzlauer Berg', 22, 610], ['Berlin', 'Charlottenburg', 20, 530],
      ['Munich', 'Altstadt', 40, 520], ['Munich', 'Schwabing', 35, 640], ['Munich', 'Sendling', 25, 490]
    ]);
    S.t.permits = W.rows(['city', 'owner', 'end', 'cap', 'dep', 'fee', 'rules', 'report'], [
      ['Berlin', 'Lena K.', rel(W, 410), 3000, 2600, 48, 'Parking bays in the inner ring', rel(W, 9)],
      ['Munich', 'Tobias R.', rel(W, 52), 1800, 1650, 60, 'No parking on pavements under 2.5 m', rel(W, 23)],
      ['Hamburg', 'Mia S.', rel(W, 230), 1600, 1500, 40, 'Remove misparked within 3 hours', rel(W, 5)],
      ['Cologne', 'Jonas W.', rel(W, 140), 1000, 1030, 50, 'Slow zones on the Rhine banks', rel(W, 40)],
      ['Vienna', 'Anna H.', rel(W, 300), 1500, 1050, 30, 'Fixed parking zones in districts 1 to 9', rel(W, 18)]
    ]);
    var dem = [42, 45, 62, 80, 92, 100, 98, 96, 85, 68, 50, 40], rain = [10, 9, 10, 9, 11, 10, 11, 10, 9, 9, 10, 11], frost = [16, 14, 8, 2, 0, 0, 0, 0, 0, 2, 7, 14], plan = [50, 50, 65, 82, 95, 100, 100, 100, 88, 70, 62, 50];
    S.t.months.forEach(function (m, i) { m.demand = dem[i]; m.rain = rain[i]; m.frost = frost[i]; m.plan = plan[i]; });
    S.t.months[0].note = 'Winter storage, battery checks'; S.t.months[2].note = 'Spring relaunch, full service'; S.t.months[10].note = 'Fleet too high for demand';
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    var poolNet = W.isNum(f.pool) ? Math.floor(f.pool * (1 - n0(f.reserve) / 100)) : null;
    D.aPoolNet = poolNet;
    var rp = f.rpvd > 0 ? f.rpvd : null;
    var base = S.t.cities.map(function (c) {
      if (!W.isNum(c.rides) || !rp) return null;
      var need = Math.ceil(c.rides / rp);
      if (W.isNum(c.cap)) need = Math.min(need, c.cap);
      if (W.isNum(c.min)) need = Math.max(need, c.min);
      return need;
    });
    D.aNeed = W.sum(base);
    var mins = S.t.cities.map(function (c, i) { return base[i] == null ? 0 : Math.min(n0(c.min), base[i]); });
    var alloc = base.slice();
    if (poolNet != null && D.aNeed > poolNet) {
      var left = Math.max(0, poolNet - W.sum(mins));
      alloc = base.map(function (b, i) { return b == null ? null : mins[i]; });
      var order = base.map(function (b, i) { return i; }).filter(function (i) { return base[i] != null; }).sort(function (a, b) { return n0(S.t.cities[b].rev) - n0(S.t.cities[a].rev); });
      order.forEach(function (i) { var add = Math.min(base[i] - mins[i], left); alloc[i] += add; left -= add; });
    }
    D.aCover = poolNet != null && D.aNeed > 0 ? poolNet / D.aNeed : null;
    D.cities = S.t.cities.map(function (c, i) {
      var a = alloc[i];
      if (a == null) return {status: ''};
      var rpvd = a > 0 ? c.rides / a : null;
      var status = W.isNum(c.min) && a < c.min ? 'Below minimum' : a < base[i] ? 'Short' : W.isNum(c.cap) && a >= c.cap ? 'Capped' : 'Allocated';
      return {need: base[i], alloc: a, chg: W.isNum(c.now) ? a - c.now : null, rpvd: rpvd, rpv: rpvd != null && W.isNum(c.rev) ? rpvd * c.rev : null, status: status};
    });
    D.aCities = D.cities.filter(function (c) { return c.alloc != null; }).length;
    D.aAlloc = W.sum(D.cities.map(function (c) { return c.alloc; }));
    D.aRides = W.sum(S.t.cities.map(function (c) { return c.rides; }));
    D.aRpvd = D.aAlloc > 0 ? D.aRides / D.aAlloc : null;
    D.aShort = D.cities.filter(function (c) { return c.status === 'Short' || c.status === 'Below minimum'; }).length;

    var cityFleet = {}, cityShare = {};
    S.t.zones.forEach(function (z) { var k = (z.city || '').trim().toLowerCase(); cityFleet[k] = n0(cityFleet[k]) + n0(z.now); cityShare[k] = n0(cityShare[k]) + n0(z.share); });
    var surplus = 0, deficit = 0;
    D.zones = S.t.zones.map(function (z) {
      var k = (z.city || '').trim().toLowerCase();
      if (!W.isNum(z.share) || !W.isNum(z.now)) return {status: ''};
      var fleet = cityFleet[k], target = Math.round(fleet * z.share / 100), gap = z.now - target;
      if (gap > 0) surplus += gap; else deficit -= gap;
      var tol = Math.max(5, target * 0.05);
      return {fleet: fleet, target: target, gap: gap, cityShare: cityShare[k], status: Math.abs(gap) <= tol ? 'Balanced' : gap > 0 ? 'Surplus' : 'Deficit'};
    });
    D.zMoves = Math.min(surplus, deficit);
    D.zTrips = f.perTrip > 0 ? Math.ceil(D.zMoves / f.perTrip) : null;
    D.zHours = D.zTrips != null ? D.zTrips * n0(f.tripMin) / 60 : null;
    D.zVans = D.zHours != null && f.vanHours > 0 ? Math.ceil(D.zHours / f.vanHours) : null;

    var td = W.isoOf(today);
    D.pReports = 0; D.pAlert = 0; D.pNext = null; D.pNextCity = '';
    D.permits = S.t.permits.map(function (p) {
      var left = p.end ? W.days(td, p.end) : null, rep = p.report ? W.days(td, p.report) : null;
      var use = W.isNum(p.dep) && p.cap > 0 ? p.dep / p.cap : null;
      if (rep != null && rep >= 0 && rep <= 14) D.pReports++;
      if (p.end) { var t = W.toUTC(p.end); if (D.pNext == null || t < D.pNext) { D.pNext = t; D.pNextCity = p.city; } }
      var status = !p.end && !p.city ? '' : left == null ? 'Missing' : left < 0 ? 'Expired' : use != null && use > 1 ? 'Over limit' : left <= 90 ? 'Expiring soon' : rep != null && rep < 0 ? 'Overdue' : rep != null && rep <= 14 ? 'Report due' : 'Valid';
      if (status && status !== 'Valid') D.pAlert++;
      return {left: left, use: use, status: status};
    });
    D.pFees = W.sum(S.t.permits.map(function (p) { return W.isNum(p.fee) && W.isNum(p.cap) ? p.fee * p.cap : 0; }));

    D.sGaps = 0; D.sRows = 0;
    D.months = S.t.months.map(function (m) {
      var fleet = W.isNum(f.peak) && W.isNum(m.plan) ? Math.round(f.peak * m.plan / 100) : null;
      if (!W.isNum(m.demand) || !W.isNum(m.plan)) return {fleet: fleet, status: ''};
      D.sRows++;
      var gap = m.plan - m.demand, status = gap < -10 ? 'Short' : gap > 15 ? 'Excess' : 'On track';
      if (status !== 'On track') D.sGaps++;
      return {fleet: fleet, gap: gap, status: status};
    });
    var fl = D.months.map(function (m) { return m.fleet; }).filter(W.isNum);
    D.sLow = fl.length ? Math.min.apply(null, fl) : null;
    D.sStore = fl.length ? Math.max.apply(null, fl) - D.sLow : null;
    return D;
  }
};
function W0(v) { return typeof v === 'number' && isFinite(v) ? v : null; }
})();
