(function () {
var U;
var YRS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
var DRIVERS = ['Organic growth', 'New programs and markets', 'Channel or share shift', 'Peak and seasonality', 'One-off events', 'Method or data change'];
function yl(S, i) { return U.isNum((+S.f.y0)) ? String((+S.f.y0) + i + 1) : YRS[i]; }
window.SPEC = {
  app: 'plan-demand-forecast',
  title: 'Long-Range Demand Forecast',
  desc: 'Forecast volume by region for five years with organic growth and new programs, set base, high and low scenarios with peak weeks, and bridge this plan to the last one.',
  notice: 'Every tab is filled with sample data for a parcel network in five regions. Type over it, or start blank.',
  headCap: 'Volume in the final plan year',
  tones: {good: ['Explained'], warn: ['Above last plan', 'Below last plan'], bad: ['Not explained']},
  notes: [
    'Volume is in millions of units a year. Each region grows at its organic rate from the base year. A new program adds its full-run volume from its start year, building up evenly over its ramp years.',
    'High and low scenarios move the base by a fixed share. Peak week is the average week times the peak factor; capacity is planned to the peak week of the high case, so the network can take a good year without failing at peak.',
    'The bridge explains the change from the last plan to this plan for one year. Leadership reads it first. Anything left in Not explained needs a driver before the plan goes out.'
  ],
  tabs: [
    {id: 'regions', title: 'Volume forecast by region', badge: function (D) { return D.cagr != null ? U.fPct(D.cagr) + ' a year' : ''; }, sections: [
      {type: 'form', title: 'Base year', fields: [
        {k: 'y0', label: 'Base year', kind: 'sel', options: ['2024', '2025', '2026', '2027', '2028', '2029', '2030'], def: '2026', note: 'Last full year of actuals'}
      ], stats: [
        {label: 'Base volume, millions', v: function (D) { return U.fDec1(D.base); }},
        {label: 'Final year, millions', v: function (D) { return U.fDec1(D.tot[4]); }},
        {label: 'Growth per year', v: function (D) { return U.fPct(D.cagr); }}
      ]},
      {type: 'table', k: 'regions', title: 'Regions', help: 'Base is actual volume in the base year. Program volume is the yearly volume of a new program or market at full run.', add: 'Add a region', cols: [
        {k: 'region', label: 'Region', kind: 'text', w: 120},
        {k: 'base', label: 'Base, millions', kind: 'num', w: 70, foot: function (D) { return U.fDec1(D.base); }},
        {k: 'g', label: 'Organic growth %', kind: 'pct', w: 70},
        {k: 'prog', label: 'Program, millions', kind: 'num', w: 70},
        {k: 'start', label: 'Program start year', kind: 'sel', options: ['None'].concat(YRS), w: 90},
        {k: 'ramp', label: 'Ramp years', kind: 'int', w: 60},
        {label: 'Year 1', w: 64, v: function (D, i) { return U.fDec1(D.rows[i][0]); }, foot: function (D) { return U.fDec1(D.tot[0]); }},
        {label: 'Year 2', w: 64, v: function (D, i) { return U.fDec1(D.rows[i][1]); }, foot: function (D) { return U.fDec1(D.tot[1]); }},
        {label: 'Year 3', w: 64, v: function (D, i) { return U.fDec1(D.rows[i][2]); }, foot: function (D) { return U.fDec1(D.tot[2]); }},
        {label: 'Year 4', w: 64, v: function (D, i) { return U.fDec1(D.rows[i][3]); }, foot: function (D) { return U.fDec1(D.tot[3]); }},
        {label: 'Year 5', w: 64, v: function (D, i) { return U.fDec1(D.rows[i][4]); }, foot: function (D) { return U.fDec1(D.tot[4]); }},
        {label: 'Growth per year', w: 70, v: function (D, i) { return U.fPct(D.rcagr[i]); }, foot: function (D) { return U.fPct(D.cagr); }},
        {label: 'Share, year 5', w: 66, v: function (D, i) { return U.fPct(D.share[i]); }}
      ]},
      {type: 'charts', title: 'Growth', charts: [
        {kind: 'line', title: 'Total volume', sub: 'Millions of units a year, base year then plan years', data: function (D, S) { return {pts: [{label: U.isNum((+S.f.y0)) ? String((+S.f.y0)) : 'Base', y: D.base || null}].concat(D.tot.map(function (v, i) { return {label: yl(S, i), y: v || null}; })), fmt: 'dec1', split: 1, splitLabels: ['Actual', 'Plan'], area: true}; }},
        {kind: 'bars', title: 'Year 5 volume by region', sub: 'With share', data: function (D, S) { return {items: S.t.regions.map(function (r, i) { return {label: r.region || 'Region ' + (i + 1), v: D.rows[i][4]}; }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); }), fmt: 'dec1', share: true}; }}
      ]}
    ]},
    {id: 'scenarios', title: 'Scenarios and peak', badge: function (D) { return D.peakHigh[4] != null ? U.fDec2(D.peakHigh[4]) + 'm peak week' : ''; }, sections: [
      {type: 'form', title: 'Scenario settings', fields: [
        {k: 'high', label: 'High case above base', kind: 'pct', def: 12},
        {k: 'low', label: 'Low case below base', kind: 'pct', def: 10},
        {k: 'peak', label: 'Peak week over average week', kind: 'num', def: 1.8, note: 'From last year\'s busiest week'}
      ]},
      {type: 'tiles', items: [
        {label: 'Final year, base', sub: 'Millions of units', v: function (D) { return U.fDec1(D.tot[4]); }},
        {label: 'Final year, range', sub: 'Low to high', v: function (D) { return D.tot[4] ? U.fDec1(D.lowT[4]) + ' to ' + U.fDec1(D.highT[4]) : ''; }},
        {label: 'Peak week to plan for', sub: 'High case, final year, millions', v: function (D) { return U.fDec2(D.peakHigh[4]); }},
        {label: 'Change to last plan', sub: 'Final year, base', v: function (D) { return D.vsLast[4] == null ? '' : U.signed(U.fPct(D.vsLast[4]), D.vsLast[4]); }}
      ]},
      {type: 'table', k: 'years', title: 'Plan years', help: 'Enter the last plan\'s base volume for each year so the change is visible. Volume in millions of units.', fixed: YRS, cols: [
        {fixedLabel: true, label: 'Year', w: 80, num: false},
        {label: 'Calendar year', w: 80, v: function (D, i, S) { return U.isNum((+S.f.y0)) ? String((+S.f.y0) + i + 1) : ''; }, num: false},
        {label: 'Low', w: 76, v: function (D, i) { return U.fDec1(D.lowT[i]); }},
        {label: 'Base', w: 76, v: function (D, i) { return U.fDec1(D.tot[i]); }},
        {label: 'High', w: 76, v: function (D, i) { return U.fDec1(D.highT[i]); }},
        {label: 'Average week, base', w: 90, v: function (D, i) { return U.fDec2(D.wk[i]); }},
        {label: 'Peak week, base', w: 90, v: function (D, i) { return U.fDec2(D.peakBase[i]); }},
        {label: 'Peak week, high', w: 90, v: function (D, i) { return U.fDec2(D.peakHigh[i]); }},
        {k: 'last', label: 'Last plan, base', kind: 'num', w: 90},
        {label: 'Change', w: 76, v: function (D, i) { var c = D.vsLast[i]; return c == null ? '' : U.signed(U.fPct(c), c); }}
      ]},
      {type: 'charts', title: 'Range', charts: [
        {kind: 'line', title: 'Peak week, high case', sub: 'Millions of units, the week to build capacity for', data: function (D, S) { return {pts: D.peakHigh.map(function (v, i) { return {label: yl(S, i), y: v}; }), fmt: 'dec2'}; }}
      ]}
    ]},
    {id: 'bridge', title: 'Plan-to-plan bridge', badge: function (D) { return D.bStatus || ''; }, sections: [
      {type: 'form', title: 'Year to bridge', fields: [
        {k: 'bYear', label: 'Plan year', kind: 'sel', options: YRS, def: 'Year 3'},
        {k: 'bLast', label: 'Last plan volume, millions', kind: 'num'}
      ], stats: [
        {label: 'This plan, millions', v: function (D) { return U.fDec2(D.bThis); }},
        {label: 'Change', v: function (D) { return D.bChg == null ? '' : U.signed(U.fDec2(D.bChg), D.bChg); }},
        {label: 'Not explained', v: function (D) { return D.bLeft == null ? '' : {text: U.signed(U.fDec2(D.bLeft), D.bLeft), tone: D.bStatus === 'Not explained' ? 'bad' : ''}; }}
      ]},
      {type: 'table', k: 'drivers', title: 'Drivers', help: 'Enter how much each driver moved the volume, in millions of units, plus or minus. Write the reason in a sentence a leader can repeat.', fixed: DRIVERS, cols: [
        {fixedLabel: true, label: 'Driver', w: 220, num: false},
        {k: 'delta', label: 'Change, millions', kind: 'num', w: 100},
        {k: 'why', label: 'Reason', kind: 'text', w: 420},
        {label: 'Running total', w: 100, v: function (D, i) { return U.fDec2(D.run[i]); }},
        {label: 'Share of change', w: 100, v: function (D, i) { return U.fPct(D.bShare[i]); }}
      ]},
      {type: 'note', title: 'Bridge check', v: function (D) { return D.bChg == null ? ['', 'Enter the last plan volume for the year to bridge.'] : [D.bStatus, D.bText]; }},
      {type: 'charts', title: 'Bridge', charts: [
        {kind: 'bars', title: 'Change by driver', sub: 'Millions of units, size of each move up or down', data: function (D, S) { var it = function (l, v) { return {label: l + (v < 0 ? ', down' : ', up'), v: v == null ? null : Math.abs(v)}; }; return {items: DRIVERS.map(function (d, i) { return it(d, S.t.drivers[i].delta); }).concat(D.bLeft != null ? [it('Not explained', D.bLeft)] : []), fmt: 'dec2'}; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Base volume, millions', v: function (D) { return U.fDec1(D.base) || 'No data'; }},
    {label: 'Final year, millions', v: function (D) { return U.fDec1(D.tot[4]) || 'No data'; }},
    {label: 'Growth per year', v: function (D) { return U.fPct(D.cagr) || 'No data'; }},
    {label: 'Peak week to plan for', v: function (D) { return D.peakHigh[4] != null ? U.fDec2(D.peakHigh[4]) + 'm' : 'No data'; }},
    {label: 'Bridge', v: function (D) { return D.bStatus ? {text: D.bStatus, tone: D.bStatus === 'Explained' ? '' : 'warn'} : 'No data'; }}
  ],
  headline: function (D, S) {
    if (!D.tot[4]) return {unit: 'Add regions with a base volume'};
    return {num: U.fDec1(D.tot[4]) + 'm', unit: 'units in ' + yl(S, 4), status: D.bStatus, note: U.fPct(D.cagr) + ' a year from ' + U.fDec1(D.base) + 'm'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleNetwork'; S.biz.marketplace = '2027 to 2031';
    S.f.y0 = '2026'; S.f.high = 12; S.f.low = 10; S.f.peak = 1.8; S.f.bYear = 'Year 3'; S.f.bLast = 462;
    S.t.regions = W.rows(['region', 'base', 'g', 'prog', 'start', 'ramp'], [
      ['North', 62, 6, 0, 'None', null],
      ['Capital region', 88, 9, 14, 'Year 2', 2],
      ['West', 104, 5, 0, 'None', null],
      ['South', 71, 7, 22, 'Year 3', 3],
      ['East', 38, 11, 0, 'None', null]
    ]);
    var last = [385, 418, 462, 500, 540];
    S.t.years.forEach(function (r, i) { r.last = last[i]; });
    var d = [[4.2, 'Faster growth in the Capital region after the second half of the base year'], [9.3, 'Grocery program brought forward one year in the Capital region'], [-6.0, 'Share moved to pickup points, which bypass the depot network'], [0, 'No change'], [-2.5, 'Large customer insourced its returns'], [1.4, 'Forecast now uses postcode level history']];
    S.t.drivers.forEach(function (r, i) { r.delta = d[i][0]; r.why = d[i][1]; });
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    D.rows = S.t.regions.map(function (r) {
      if (!W.isNum(r.base)) return [null, null, null, null, null];
      var st = YRS.indexOf(r.start), ramp = r.ramp > 0 ? r.ramp : 1;
      return YRS.map(function (y, i) {
        var v = r.base * Math.pow(1 + n0(r.g) / 100, i + 1);
        if (st >= 0 && i >= st) v += n0(r.prog) * Math.min(1, (i - st + 1) / ramp);
        return v;
      });
    });
    D.tot = YRS.map(function (y, i) { return W.sum(D.rows.map(function (r) { return r[i]; })); });
    D.base = W.sum(S.t.regions.map(function (r) { return r.base; }));
    D.cagr = D.base > 0 && D.tot[4] > 0 ? Math.pow(D.tot[4] / D.base, 1 / 5) - 1 : null;
    D.rcagr = S.t.regions.map(function (r, i) { return r.base > 0 && D.rows[i][4] ? Math.pow(D.rows[i][4] / r.base, 1 / 5) - 1 : null; });
    D.share = D.rows.map(function (r) { return D.tot[4] && r[4] != null ? r[4] / D.tot[4] : null; });
    var has = D.tot[4] > 0;
    D.lowT = D.tot.map(function (v) { return has ? v * (1 - n0(f.low) / 100) : null; });
    D.highT = D.tot.map(function (v) { return has ? v * (1 + n0(f.high) / 100) : null; });
    D.wk = D.tot.map(function (v) { return has ? v / 52 : null; });
    D.peakBase = D.wk.map(function (v) { return v != null && W.isNum(f.peak) ? v * f.peak : null; });
    D.peakHigh = D.highT.map(function (v) { return v != null && W.isNum(f.peak) ? v / 52 * f.peak : null; });
    D.vsLast = S.t.years.map(function (r, i) { return has && r.last > 0 ? D.tot[i] / r.last - 1 : null; });

    var bi = YRS.indexOf(f.bYear);
    D.bThis = has && bi >= 0 ? D.tot[bi] : null;
    D.bChg = D.bThis != null && W.isNum(f.bLast) ? D.bThis - f.bLast : null;
    var run = W.isNum(f.bLast) ? f.bLast : null;
    D.run = S.t.drivers.map(function (r) { if (run == null) return null; run += n0(r.delta); return run; });
    var expl = W.sum(S.t.drivers.map(function (r) { return r.delta; }));
    D.bLeft = D.bChg != null ? D.bChg - expl : null;
    D.bShare = S.t.drivers.map(function (r) { return D.bChg ? n0(r.delta) / D.bChg : null; });
    D.bStatus = D.bLeft == null ? '' : Math.abs(D.bLeft) <= 0.01 * f.bLast ? 'Explained' : 'Not explained';
    D.bText = D.bLeft == null ? '' : D.bStatus === 'Explained' ? 'The drivers explain the change to within 1% of the last plan.' : U.fDec2(Math.abs(D.bLeft)) + ' million units of the change have no driver yet. Find the driver before the plan goes out.';
    return D;
  }
};
})();
