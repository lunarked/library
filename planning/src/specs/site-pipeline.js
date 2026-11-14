(function () {
var U;
var STAGES = ['Site search and selection', 'Land or lease signed', 'Permits', 'Construction or fit-out', 'Automation and equipment', 'Hiring and training', 'Launch readiness', 'Ramp to full rate'];
var STEPS = ['Selection', 'Lease signed', 'Permits', 'Fit-out', 'Equipment', 'Hiring', 'Launched', 'At full rate'];
var WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 6', 'Week 8', 'Week 10', 'Week 12', 'Week 16', 'Week 20'];
var WN = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20];
function rel(W, n) { var d = new Date(); return W.isoOf(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + n * W.DAY); }
function addMonths(t, m) { var d = new Date(t); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + Math.round(m), d.getUTCDate()); }
window.SPEC = {
  app: 'plan-site-pipeline',
  title: 'Site and Footprint Pipeline',
  desc: 'Track every new build, expansion, conversion and closure with its capacity and launch date, work back from a launch date through the stage gates, and plan the ramp to full rate.',
  notice: 'Every tab is filled with sample data for a network adding sort centers and depots. Type over it, or start blank.',
  headCap: 'Capacity added in the pipeline',
  tones: {good: ['Launched', 'At full rate'], warn: ['Start now'], bad: ['Too late']},
  notes: [
    'Capacity change is peak capacity in thousands of units a week, negative for a closure. A project is Late when its launch forecast is later than the date the capacity gap opens; set that date in Needed by.',
    'Stage gates: enter the usual months for each stage. Latest start is worked back from the target launch, so the first gate shows the last day you can start the search and still launch on time. New buildings often need 18 to 36 months from search to launch.',
    'Ramp: a new site rarely runs at full rate in its first weeks. Lost capacity is what the site would have handled at full rate less what it handles during the ramp; plan that volume on other nodes.'
  ],
  tabs: [
    {id: 'projects', title: 'Project pipeline', badge: function (D) { return D.pLate ? D.pLate + ' late' : ''; }, sections: [
      {type: 'form', title: 'Currency', fields: [{k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']}]},
      {type: 'tiles', items: [
        {label: 'Projects', sub: 'Not yet launched', v: function (D, S) { return S.t.proj.length ? String(D.pOpen) : ''; }},
        {label: 'Capacity added', sub: 'Thousands of units a week, open projects', v: function (D, S) { return S.t.proj.length ? U.fInt(D.pCap) : ''; }},
        {label: 'Capex committed', sub: 'Open projects', v: function (D, S) { return S.t.proj.length ? U.fMoney(D.pCapex, 0) : ''; }},
        {label: 'Late against need', sub: 'Launch after the gap opens', v: function (D, S) { return S.t.proj.length ? String(D.pLate) : ''; }, bad: function (D) { return D.pLate > 0; }}
      ]},
      {type: 'table', k: 'proj', title: 'Projects', help: 'One row per project. Needed by is the date the capacity gap opens, from the Network Capacity and Gap workbook.', add: 'Add a project', cols: [
        {k: 'name', label: 'Project', kind: 'text', w: 116},
        {k: 'type', label: 'Type', kind: 'sel', options: ['New build', 'Expansion', 'Conversion', 'Closure'], w: 100},
        {k: 'region', label: 'Region', kind: 'text', w: 90},
        {k: 'cap', label: 'Capacity change', kind: 'int', w: 70},
        {k: 'stage', label: 'Current stage', kind: 'sel', options: STEPS, w: 110},
        {k: 'launch', label: 'Launch forecast', kind: 'date', w: 128},
        {k: 'need', label: 'Needed by', kind: 'date', w: 128},
        {k: 'capex', label: 'Capex', kind: 'money', w: 90, foot: 'sum'},
        {label: 'Months to launch', w: 66, v: function (D, i) { return U.fDec1(D.proj[i].months); }},
        {label: 'Days late', w: 60, v: function (D, i) { return U.fInt(D.proj[i].late); }},
        {label: 'Capex per unit a week', w: 76, v: function (D, i) { return U.fMoney(D.proj[i].cpu, 0); }},
        {label: 'Status', w: 86, status: function (D, i) { return D.proj[i].status; }}
      ]},
      {type: 'charts', title: 'When capacity lands', charts: [
        {kind: 'bars', title: 'Capacity added by launch year', sub: 'Thousands of units a week, net of closures', data: function (D) { return {items: D.pByYear, fmt: 'int'}; }}
      ]}
    ]},
    {id: 'gates', title: 'Stage gates and lead times', badge: function (D) { return D.gStatus || ''; }, sections: [
      {type: 'form', title: 'Target', fields: [
        {k: 'target', label: 'Target launch date', kind: 'date'},
        {k: 'buffer', label: 'Buffer', kind: 'pct', def: 15, note: 'Added to every stage for delays'}
      ], stats: [
        {label: 'Total lead time', v: function (D) { return D.gTotal ? U.fDec1(D.gTotal) + ' months' : ''; }},
        {label: 'Start the search by', v: function (D) { return D.gStart != null ? U.fDate(D.gStart) : ''; }},
        {label: 'Time left to start', v: function (D) { return D.gLeft == null ? '' : {text: D.gLeft < 0 ? U.fInt(-D.gLeft) + ' days too late' : U.fInt(D.gLeft) + ' days', tone: D.gLeft < 0 ? 'bad' : D.gLeft < 60 ? 'warn' : ''}; }}
      ]},
      {type: 'table', k: 'gates', title: 'Stages', help: 'Stages that can overlap, such as hiring during fit-out, count as zero extra months here; enter only the months they add to the critical path.', fixed: STAGES, cols: [
        {fixedLabel: true, label: 'Stage', w: 220, num: false},
        {k: 'months', label: 'Months', kind: 'num', w: 80},
        {k: 'owner', label: 'Owner', kind: 'text', w: 130},
        {k: 'exit', label: 'Gate passed when', kind: 'text', w: 300},
        {label: 'With buffer', w: 80, v: function (D, i) { return U.fDec1(D.gates[i].m); }},
        {label: 'Latest start', w: 110, v: function (D, i) { return D.gates[i].start != null ? U.fDate(D.gates[i].start) : ''; }, num: false},
        {label: 'Status', w: 86, status: function (D, i) { return D.gates[i].status; }}
      ]}
    ]},
    {id: 'ramp', title: 'Ramp curve', badge: function (D) { return D.rLost ? U.fInt(D.rLost) + 'k lost' : ''; }, sections: [
      {type: 'form', title: 'Site', fields: [
        {k: 'full', label: 'Full weekly capacity, thousands', kind: 'int'},
        {k: 'rLaunch', label: 'Launch date', kind: 'date'}
      ], stats: [
        {label: 'Weeks to full rate', v: function (D) { return D.rFullWeek ? String(D.rFullWeek) : 'Not within 20 weeks'; }},
        {label: 'Capacity lost in ramp', v: function (D) { return D.rLost != null ? U.fInt(D.rLost) + 'k units' : ''; }},
        {label: 'Full rate from', v: function (D) { return D.rFullDate || ''; }}
      ]},
      {type: 'table', k: 'ramp', title: 'Ramp', help: 'Share of full rate the site reaches in each week. Base it on the last launch of the same building type.', fixed: WEEKS, cols: [
        {fixedLabel: true, label: 'Week', w: 100, num: false},
        {k: 'pct', label: '% of full rate', kind: 'pct', w: 100},
        {label: 'Week starting', w: 120, v: function (D, i) { return D.ramp[i].date; }, num: false},
        {label: 'Capacity, thousands', w: 120, v: function (D, i) { return U.fInt(D.ramp[i].cap); }},
        {label: 'Lost against full', w: 120, v: function (D, i) { return U.fInt(D.ramp[i].lost); }},
        {k: 'note', label: 'Notes', kind: 'text', w: 300}
      ]},
      {type: 'charts', title: 'Ramp', charts: [
        {kind: 'line', title: 'Capacity by week after launch', sub: 'Thousands of units a week', data: function (D, S) { return {pts: WEEKS.map(function (w, i) { return {label: 'W' + WN[i], y: D.ramp[i].cap}; }), refs: W0(S.f.full) ? [{v: S.f.full, label: 'Full'}] : [], fmt: 'int', area: true}; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Open projects', v: function (D) { return String(D.pOpen); }},
    {label: 'Capacity in the pipeline', v: function (D) { return D.pOpen ? U.fInt(D.pCap) + 'k a week' : 'No data'; }},
    {label: 'Projects late against need', v: function (D) { return {text: String(D.pLate), tone: D.pLate ? 'warn' : ''}; }},
    {label: 'Start the next search by', v: function (D) { return D.gStart != null ? U.fDate(D.gStart) : 'No data'; }},
    {label: 'Weeks to full rate', v: function (D) { return D.rFullWeek ? String(D.rFullWeek) : 'No data'; }}
  ],
  headline: function (D, S) {
    if (!S.t.proj.length) return {unit: 'Add projects to the pipeline'};
    return {num: U.fInt(D.pCap) + 'k', unit: 'units a week of capacity in the pipeline', status: D.pLate ? 'Late' : 'On track', note: D.pOpen + ' open projects, ' + D.pLate + ' late against need'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleNetwork'; S.biz.marketplace = '2027 to 2031';
    S.f.currency = '€';
    S.t.proj = W.rows(['name', 'type', 'region', 'cap', 'stage', 'launch', 'need', 'capex'], [
      ['SC-S2 new sort center', 'New build', 'South', 800, 'Fit-out', rel(W, 230), rel(W, 300), 62000000],
      ['SC-C1 mezzanine', 'Expansion', 'Capital region', 600, 'Permits', rel(W, 520), rel(W, 410), 18000000],
      ['SC-C2 new sort center', 'New build', 'Capital region', 1400, 'Selection', rel(W, 1020), rel(W, 780), 85000000],
      ['DD-C3 depot', 'New build', 'Capital region', 700, 'Lease signed', rel(W, 160), rel(W, 200), 6500000],
      ['FC-N1 to sort conversion', 'Conversion', 'North', 500, 'Equipment', rel(W, 90), rel(W, 900), 9000000],
      ['DD-W4 old depot', 'Closure', 'West', -300, 'Selection', rel(W, 200), '', 0],
      ['DD-E1 depot', 'New build', 'East', 450, 'Launched', rel(W, -60), rel(W, -30), 5800000]
    ]);
    S.f.target = rel(W, 1200); S.f.buffer = 15;
    var g = [[4, 'Network planning', 'Shortlist of 3 sites with cost and coverage'], [3, 'Real estate', 'Lease or purchase signed'], [6, 'Real estate', 'Building and operating permits granted'], [9, 'Engineering', 'Building handed over'], [4, 'Engineering', 'Sorter commissioned at design rate'], [1, 'Site lead', 'Day-one headcount trained'], [1, 'Launch team', 'Test volume run, go-live signed off'], [0, 'Site lead', 'At full rate for two weeks']];
    S.t.gates.forEach(function (r, i) { r.months = g[i][0]; r.owner = g[i][1]; r.exit = g[i][2]; });
    S.f.full = 900; S.f.rLaunch = rel(W, 230);
    var p = [25, 35, 45, 55, 65, 75, 82, 88, 95, 100];
    S.t.ramp.forEach(function (r, i) { r.pct = p[i]; });
    S.t.ramp[0].note = 'One shift, test customers only'; S.t.ramp[4].note = 'Second shift starts'; S.t.ramp[8].note = 'Peak readiness check';
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {}, tdy = W.isoOf(today);
    D.pOpen = 0; D.pCap = 0; D.pCapex = 0; D.pLate = 0;
    var byY = {};
    D.proj = S.t.proj.map(function (p) {
      if (!p.name && !W.isNum(p.cap)) return {status: ''};
      var launched = p.stage === 'Launched' || p.stage === 'At full rate';
      var months = p.launch ? W.days(tdy, p.launch) / 30.44 : null;
      var late = p.launch && p.need ? W.days(p.need, p.launch) : null;
      if (!launched) { D.pOpen++; D.pCap += n0(p.cap); D.pCapex += n0(p.capex); if (p.launch) { var y = p.launch.slice(0, 4); byY[y] = n0(byY[y]) + n0(p.cap); } }
      var status = launched ? p.stage : late != null && late > 0 ? 'Late' : months != null && months < 0 ? 'Overdue' : 'On track';
      if (status === 'Late') D.pLate++;
      return {months: launched ? null : months, late: late > 0 && !launched ? late : null, cpu: p.cap > 0 && W.isNum(p.capex) ? p.capex / (p.cap * 1000) : null, status: status};
    });
    D.pByYear = Object.keys(byY).sort().map(function (y) { return {label: y, v: byY[y]}; });

    var buf = 1 + n0(f.buffer) / 100;
    var ms = S.t.gates.map(function (g) { return W.isNum(g.months) ? g.months * buf : null; });
    D.gTotal = W.sum(ms);
    var t = W.toUTC(f.target), after = 0;
    var starts = [];
    for (var i = ms.length - 1; i >= 0; i--) { after += n0(ms[i]); starts[i] = t != null ? addMonths(t, -after) : null; }
    D.gStart = starts[0] != null && D.gTotal ? starts[0] : null;
    D.gLeft = D.gStart != null ? Math.round((D.gStart - today) / W.DAY) : null;
    D.gStatus = D.gLeft == null ? '' : D.gLeft < 0 ? 'Too late' : D.gLeft < 60 ? 'Start now' : 'On track';
    D.gates = S.t.gates.map(function (g, i) {
      if (ms[i] == null) return {status: ''};
      var st = starts[i];
      return {m: ms[i], start: st, status: st == null ? '' : st < today ? 'Too late' : st - today < 60 * W.DAY ? 'Start now' : 'On track'};
    });

    var full = W.isNum(f.full) ? f.full : null, lt = W.toUTC(f.rLaunch);
    D.rLost = full != null ? 0 : null; D.rFullWeek = null; D.rFullDate = '';
    D.ramp = S.t.ramp.map(function (r, i) {
      var cap = full != null && W.isNum(r.pct) ? full * r.pct / 100 : null;
      var span = i === 0 ? 1 : WN[i] - WN[i - 1];
      var lost = cap != null ? (full - cap) * span : null;
      if (lost != null) D.rLost += lost;
      if (r.pct >= 100 && D.rFullWeek == null) { D.rFullWeek = WN[i]; if (lt != null) D.rFullDate = U.fDate(lt + (WN[i] - 1) * 7 * W.DAY); }
      return {cap: cap, lost: lost, date: lt != null ? U.fDate(lt + (WN[i] - 1) * 7 * W.DAY) : ''};
    });
    return D;
  }
};
function W0(v) { return typeof v === 'number' && isFinite(v); }
})();
