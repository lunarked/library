(function () {
var U;
var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function rel(W, n) { var d = new Date(); return W.isoOf(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + n * W.DAY); }
window.SPEC = {
  app: 'esc-field-operations',
  title: 'Field Operations',
  desc: 'Size battery swap routes, plan field shifts and vans by weekday, log collections and redeployments, and track the response times each city requires.',
  notice: 'Every tab is filled with sample data for one city team. Type over it, or start blank.',
  headCap: 'Field staff needed',
  tones: {good: ['Staffed', 'Met'], warn: ['Tight', 'Near limit'], bad: ['Understaffed', 'Breached']},
  notes: [
    'Swaps per day assume a battery is swapped when it reaches the swap level and comes back full. Swaps per day are vehicles times daily drain over the gap between full and the swap level.',
    'Minutes per swap include walking or riding between vehicles. Swapper hours are swaps times minutes per swap. Staff needed divide hours by the productive hours of one shift.',
    'The shift plan adds swaps, collections, redeployments and street repairs per weekday. Tight is within 10% of the staff planned, Understaffed is above it. Vans needed cover collections and redeployments; swappers on cargo bikes are not counted.',
    'SLA compliance is the share of cases closed within the time the city requires, for example removing a misparked vehicle. Penalties are what the city charges per breach.'
  ],
  tabs: [
    {id: 'swaps', title: 'Battery swap and charging routes', badge: function (D) { return D.sSwaps ? U.fInt(D.sSwaps) + ' swaps a day' : ''; }, sections: [
      {type: 'form', title: 'Shift', fields: [
        {k: 'shiftH', label: 'Hours per shift', kind: 'num', def: 8},
        {k: 'prod', label: 'Productive share', kind: 'pct', def: 80, note: 'After breaks, loading and van time'},
        {k: 'packsVan', label: 'Charged packs per van load', kind: 'int', def: 60}
      ]},
      {type: 'tiles', items: [
        {label: 'Swaps per day', sub: 'All routes', v: function (D, S) { return S.t.routes.length ? U.fInt(D.sSwaps) : ''; }},
        {label: 'Swapper hours per day', sub: 'All routes', v: function (D, S) { return S.t.routes.length ? U.fDec1(D.sHours) : ''; }},
        {label: 'Swappers needed per day', sub: 'At the productive hours of a shift', v: function (D) { return U.fDec1(D.sStaff); }},
        {label: 'Van loads per day', sub: 'Charged packs out, empties back', v: function (D) { return U.fDec1(D.sLoads); }}
      ]},
      {type: 'table', k: 'routes', title: 'Routes', help: 'One row per swap route or zone. Drain is the share of battery used per vehicle per day, from telemetry.', add: 'Add a route', cols: [
        {k: 'route', label: 'Route or zone', kind: 'text', w: 160},
        {k: 'veh', label: 'Vehicles', kind: 'int', w: 66, foot: 'sum'},
        {k: 'drain', label: 'Drain per day %', kind: 'pct', w: 70},
        {k: 'level', label: 'Swap level %', kind: 'pct', w: 66},
        {k: 'min', label: 'Minutes per swap', kind: 'num', w: 70},
        {k: 'hub', label: 'Charging hub', kind: 'text', w: 140},
        {label: 'Swaps per day', w: 70, v: function (D, i) { return U.fInt(D.routes[i].swaps); }, foot: function (D) { return U.fInt(D.sSwaps); }},
        {label: 'Days between swaps', w: 76, v: function (D, i) { return U.fDec1(D.routes[i].every); }},
        {label: 'Hours per day', w: 66, v: function (D, i) { return U.fDec1(D.routes[i].hours); }, foot: function (D) { return U.fDec1(D.sHours); }},
        {label: 'Swappers', w: 66, v: function (D, i) { return U.fDec1(D.routes[i].staff); }}
      ]}
    ]},
    {id: 'shifts', title: 'Field shift plan', badge: function (D) { return D.hShortDays ? D.hShortDays + ' days short' : ''; }, sections: [
      {type: 'form', title: 'Minutes per task', fields: [
        {k: 'mSwap', label: 'Battery swap', kind: 'num', def: 6},
        {k: 'mCollect', label: 'Collect a vehicle', kind: 'num', def: 12},
        {k: 'mDeploy', label: 'Redeploy a vehicle', kind: 'num', def: 8},
        {k: 'mFix', label: 'Street repair', kind: 'num', def: 18},
        {k: 'vanStaff', label: 'Staff per van', kind: 'int', def: 2}
      ]},
      {type: 'tiles', items: [
        {label: 'Hours needed per week', sub: 'All tasks', v: function (D) { return D.hHours ? U.fInt(D.hHours) : ''; }},
        {label: 'Shifts planned per week', sub: 'All days', v: function (D) { return D.hPlanned ? U.fInt(D.hPlanned) : ''; }},
        {label: 'Shifts needed per week', sub: 'At the productive hours of a shift', v: function (D) { return D.hNeeded ? U.fDec1(D.hNeeded) : ''; }},
        {label: 'Days short', sub: 'Need above staff planned', v: function (D) { return D.hRows ? String(D.hShortDays) : ''; }, bad: function (D) { return D.hShortDays > 0; }}
      ]},
      {type: 'table', k: 'days', title: 'Week', help: 'Enter the tasks you expect on each weekday. Swaps per day come from the routes tab when the swaps cell is left empty.', fixed: DAYS, cols: [
        {fixedLabel: true, label: 'Day', w: 100, num: false},
        {k: 'swaps', label: 'Swaps', kind: 'int', w: 70, ph: 'Routes'},
        {k: 'collect', label: 'Collections', kind: 'int', w: 76},
        {k: 'deploy', label: 'Redeploys', kind: 'int', w: 76},
        {k: 'fix', label: 'Street repairs', kind: 'int', w: 76},
        {k: 'staff', label: 'Staff planned', kind: 'int', w: 76},
        {k: 'vans', label: 'Vans', kind: 'int', w: 60},
        {label: 'Hours needed', w: 74, v: function (D, i) { return U.fDec1(D.days[i].hours); }},
        {label: 'Staff needed', w: 74, v: function (D, i) { return U.fDec1(D.days[i].need); }},
        {label: 'Vans needed', w: 70, v: function (D, i) { return U.fDec1(D.days[i].vans); }},
        {label: 'Status', w: 110, status: function (D, i) { return D.days[i].status; }}
      ]},
      {type: 'charts', title: 'Load by day', charts: [
        {kind: 'bars', title: 'Staff needed by weekday', sub: 'Shifts of productive hours', data: function (D) { return {items: DAYS.map(function (d, i) { return {label: d, v: D.days[i].need}; }), fmt: 'dec1'}; }}
      ]}
    ]},
    {id: 'moves', title: 'Collect and redeploy log', badge: function (D) { return D.mPerHour != null ? U.fDec1(D.mPerHour) + ' per van hour' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Vehicles collected', sub: 'All rows', v: function (D, S) { return S.t.moves.length ? U.fInt(D.mCollect) : ''; }},
        {label: 'Vehicles redeployed', sub: 'All rows', v: function (D, S) { return S.t.moves.length ? U.fInt(D.mDeploy) : ''; }},
        {label: 'Sent to the workshop', sub: function (D) { return D.mCollect ? U.fPct(D.mShop / D.mCollect) + ' of collections' : ''; }, v: function (D, S) { return S.t.moves.length ? U.fInt(D.mShop) : ''; }},
        {label: 'Vehicles moved per van hour', sub: 'Collected plus redeployed', v: function (D) { return U.fDec1(D.mPerHour); }}
      ]},
      {type: 'table', k: 'moves', title: 'Daily log', help: 'One row per city and day.', add: 'Add a day', cols: [
        {k: 'date', label: 'Date', kind: 'date', w: 128},
        {k: 'city', label: 'City', kind: 'text', w: 96},
        {k: 'collect', label: 'Collected', kind: 'int', w: 70, foot: 'sum'},
        {k: 'deploy', label: 'Redeployed', kind: 'int', w: 74, foot: 'sum'},
        {k: 'shop', label: 'To workshop', kind: 'int', w: 74, foot: 'sum'},
        {k: 'mis', label: 'Misparked fixed', kind: 'int', w: 70, foot: 'sum'},
        {k: 'vanH', label: 'Van hours', kind: 'num', w: 66},
        {k: 'km', label: 'Van km', kind: 'int', w: 64},
        {label: 'Moved per van hour', w: 76, v: function (D, i) { return U.fDec1(D.moves[i].perH); }},
        {label: 'Km per vehicle moved', w: 80, v: function (D, i) { return U.fDec1(D.moves[i].kmPer); }},
        {label: 'Workshop share', w: 74, v: function (D, i) { return U.fPct(D.moves[i].shopShare); }}
      ]},
      {type: 'charts', title: 'Trend', charts: [
        {kind: 'line', title: 'Vehicles moved per van hour', sub: 'By day, all cities', data: function (D) { return {pts: D.mTrend, fmt: 'dec1'}; }}
      ]}
    ]},
    {id: 'sla', title: 'City SLA tracker', badge: function (D) { return D.aBreached ? D.aBreached + ' breached' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Compliance', sub: 'Cases closed in time, all rows', v: function (D) { return U.fPct(D.aRate); }, bad: function (D) { return D.aRate != null && D.aRate < 0.95; }},
        {label: 'Breaches', sub: 'Cases closed late', v: function (D, S) { return S.t.sla.length ? U.fInt(D.aLate) : ''; }},
        {label: 'Penalties', sub: 'This period', v: function (D, S) { return S.t.sla.length ? U.fMoney(D.aPen, 0) : ''; }},
        {label: 'Rules breached', sub: 'Below their target rate', v: function (D, S) { return S.t.sla.length ? String(D.aBreached) : ''; }, bad: function (D) { return D.aBreached > 0; }}
      ]},
      {type: 'form', title: 'Currency', fields: [{k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']}]},
      {type: 'table', k: 'sla', title: 'City requirements', help: 'One row per rule in each permit. Count the cases for the current month.', add: 'Add a rule', cols: [
        {k: 'city', label: 'City', kind: 'text', w: 90},
        {k: 'rule', label: 'Requirement', kind: 'text', w: 230},
        {k: 'hours', label: 'Limit, hours', kind: 'num', w: 64},
        {k: 'target', label: 'Target rate %', kind: 'pct', w: 66},
        {k: 'cases', label: 'Cases', kind: 'int', w: 60, foot: 'sum'},
        {k: 'inTime', label: 'Closed in time', kind: 'int', w: 70, foot: 'sum'},
        {k: 'fine', label: 'Penalty per breach', kind: 'money', w: 74},
        {label: 'Compliance', w: 74, v: function (D, i) { return U.fPct(D.sla[i].rate); }},
        {label: 'Breaches', w: 64, v: function (D, i) { return U.fInt(D.sla[i].late); }},
        {label: 'Penalties', w: 74, v: function (D, i) { return U.fMoney(D.sla[i].pen, 0); }, foot: function (D) { return U.fMoney(D.aPen, 0); }},
        {label: 'Status', w: 96, status: function (D, i) { return D.sla[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Swaps per day', v: function (D) { return U.fInt(D.sSwaps) || 'No data'; }},
    {label: 'Shifts needed per week', v: function (D) { return U.fDec1(D.hNeeded) || 'No data'; }},
    {label: 'Days short of staff', v: function (D) { return {text: String(D.hShortDays), tone: D.hShortDays ? 'warn' : ''}; }},
    {label: 'SLA compliance', v: function (D) { return U.fPct(D.aRate) || 'No data'; }},
    {label: 'Penalties this period', v: function (D) { return U.fMoney(D.aPen, 0) || 'No data'; }}
  ],
  headline: function (D) {
    if (!D.hNeeded) return {unit: 'Fill in the routes and the week plan'};
    return {num: U.fDec1(D.hNeeded), unit: 'shifts needed this week', status: D.hShortDays ? 'Understaffed' : 'Staffed', note: U.fInt(D.hPlanned) + ' planned, ' + D.hShortDays + ' days short'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleMobility'; S.biz.marketplace = 'Berlin';
    var f = S.f; f.shiftH = 8; f.prod = 80; f.packsVan = 60; f.mSwap = 6; f.mCollect = 12; f.mDeploy = 8; f.mFix = 18; f.vanStaff = 2;
    S.t.routes = W.rows(['route', 'veh', 'drain', 'level', 'min', 'hub'], [
      ['Mitte north', 640, 24, 25, 5.5, 'Hub Wedding'],
      ['Mitte south', 580, 22, 25, 5.5, 'Hub Kreuzberg'],
      ['Kreuzberg', 820, 26, 25, 6.0, 'Hub Kreuzberg'],
      ['Prenzlauer Berg', 610, 20, 25, 6.5, 'Hub Wedding'],
      ['Charlottenburg', 530, 18, 20, 7.5, 'Hub Westend']
    ]);
    var col = [150, 140, 145, 150, 170, 120, 90], dep = [260, 240, 245, 250, 300, 180, 150], fix = [55, 50, 50, 55, 60, 35, 30], staff = [26, 26, 26, 26, 30, 22, 20], vans = [8, 8, 8, 8, 9, 7, 6];
    S.t.days.forEach(function (d, i) { d.collect = col[i]; d.deploy = dep[i]; d.fix = fix[i]; d.staff = staff[i]; d.vans = vans[i]; });
    S.t.days[5].swaps = 620; S.t.days[6].swaps = 560;
    S.t.moves = W.rows(['date', 'city', 'collect', 'deploy', 'shop', 'mis', 'vanH', 'km'], [
      [rel(W, -5), 'Berlin', 152, 265, 64, 48, 44, 520],
      [rel(W, -4), 'Berlin', 140, 238, 58, 51, 42, 495],
      [rel(W, -3), 'Berlin', 148, 250, 61, 44, 43, 505],
      [rel(W, -2), 'Berlin', 171, 305, 70, 62, 50, 590],
      [rel(W, -1), 'Berlin', 118, 176, 47, 70, 36, 410]
    ]);
    S.t.sla = W.rows(['city', 'rule', 'hours', 'target', 'cases', 'inTime', 'fine'], [
      ['Berlin', 'Remove misparked vehicle after report', 4, 95, 610, 571, 25],
      ['Berlin', 'Remove fallen vehicle from footpath', 2, 98, 240, 236, 40],
      ['Hamburg', 'Remove misparked vehicle after report', 3, 95, 330, 318, 30],
      ['Munich', 'Remove vehicle from no-parking zone', 6, 95, 180, 178, 50],
      ['Vienna', 'Answer authority request', 24, 100, 12, 12, 0]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    var shiftProd = n0(f.shiftH) * n0(f.prod) / 100;
    D.routes = S.t.routes.map(function (r) {
      var gap = 100 - n0(r.level);
      if (!W.isNum(r.veh) || !(r.drain > 0) || !(gap > 0)) return {};
      var swaps = r.veh * r.drain / gap, hours = swaps * n0(r.min) / 60;
      return {swaps: swaps, every: gap / r.drain, hours: hours, staff: shiftProd > 0 ? hours / shiftProd : null};
    });
    D.sSwaps = W.sum(D.routes.map(function (x) { return x.swaps; }));
    D.sHours = W.sum(D.routes.map(function (x) { return x.hours; }));
    D.sStaff = shiftProd > 0 && D.sHours ? D.sHours / shiftProd : null;
    D.sLoads = f.packsVan > 0 && D.sSwaps ? D.sSwaps / f.packsVan : null;

    D.hShortDays = 0; D.hRows = 0; D.hPlanned = 0;
    D.days = S.t.days.map(function (d) {
      var swaps = W.isNum(d.swaps) ? d.swaps : D.sSwaps;
      var hours = (swaps * n0(f.mSwap) + n0(d.collect) * n0(f.mCollect) + n0(d.deploy) * n0(f.mDeploy) + n0(d.fix) * n0(f.mFix)) / 60;
      if (!hours) return {};
      var need = shiftProd > 0 ? hours / shiftProd : null;
      var vanHours = (n0(d.collect) * n0(f.mCollect) + n0(d.deploy) * n0(f.mDeploy)) / 60;
      var vans = shiftProd > 0 && f.vanStaff > 0 ? vanHours / shiftProd / f.vanStaff : null;
      var status = '';
      if (W.isNum(d.staff) && need != null) {
        D.hRows++; D.hPlanned += d.staff;
        status = need > d.staff ? 'Understaffed' : need > d.staff * 0.9 ? 'Tight' : 'Staffed';
        if (status === 'Understaffed') D.hShortDays++;
      }
      return {hours: hours, need: need, vans: vans, status: status};
    });
    D.hHours = W.sum(D.days.map(function (x) { return x.hours; }));
    D.hNeeded = W.sum(D.days.map(function (x) { return x.need; }));

    D.moves = S.t.moves.map(function (m) {
      var moved = n0(m.collect) + n0(m.deploy);
      return {perH: m.vanH > 0 && moved ? moved / m.vanH : null, kmPer: moved && W.isNum(m.km) ? m.km / moved : null, shopShare: W.ratio(m.shop, m.collect)};
    });
    D.mCollect = W.sum(S.t.moves.map(function (m) { return m.collect; }));
    D.mDeploy = W.sum(S.t.moves.map(function (m) { return m.deploy; }));
    D.mShop = W.sum(S.t.moves.map(function (m) { return m.shop; }));
    var vh = W.sum(S.t.moves.map(function (m) { return m.vanH; }));
    D.mPerHour = vh > 0 ? (D.mCollect + D.mDeploy) / vh : null;
    var byDate = {};
    S.t.moves.forEach(function (m) { if (!m.date) return; var o = byDate[m.date] || (byDate[m.date] = {mv: 0, h: 0}); o.mv += n0(m.collect) + n0(m.deploy); o.h += n0(m.vanH); });
    D.mTrend = Object.keys(byDate).sort().map(function (k) { return {label: U.fDate(U.toUTC(k)).replace(/ \d{4}$/, ''), y: byDate[k].h > 0 ? byDate[k].mv / byDate[k].h : null}; });

    D.aBreached = 0;
    D.sla = S.t.sla.map(function (r) {
      if (!(r.cases > 0) || !W.isNum(r.inTime)) return {status: ''};
      var rate = r.inTime / r.cases, late = r.cases - r.inTime, t = n0(r.target) / 100;
      var status = rate < t ? 'Breached' : rate < t + 0.01 && late > 0 ? 'Near limit' : 'Met';
      if (status === 'Breached') D.aBreached++;
      return {rate: rate, late: late, pen: late * n0(r.fine), status: status};
    });
    var cases = W.sum(S.t.sla.map(function (r) { return W.isNum(r.inTime) ? r.cases : 0; }));
    D.aLate = W.sum(D.sla.map(function (x) { return x.late; }));
    D.aRate = cases > 0 ? (cases - D.aLate) / cases : null;
    D.aPen = W.sum(D.sla.map(function (x) { return x.pen; }));
    return D;
  }
};
})();
