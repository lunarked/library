(function () {
var U;
function rel(W, n) { var d = new Date(); return W.isoOf(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + n * W.DAY); }
window.SPEC = {
  app: 'plan-scenarios-risk',
  title: 'Scenarios and Risk Register',
  desc: 'Test the plan against what-ifs on demand, capacity and cost, keep a scored risk register with owners, and set the trigger points that start a plan change.',
  notice: 'Every tab is filled with sample data for a parcel network plan. Type over it, or start blank.',
  headCap: 'Worst scenario',
  tones: {good: ['Holds', 'Low', 'Not triggered'], warn: ['Medium', 'Strained', 'Watch'], bad: ['Breaks', 'High', 'Triggered']},
  notes: [
    'Scenarios change the base plan by a share: demand, capacity (a late site or a lost building is negative) and cost per unit. Use is peak-week demand over peak capacity. Holds is up to 90%, Strained 90% to 100%, Breaks above 100%.',
    'Expected cost weighs each scenario\'s cost change by its probability. It is a way to rank scenarios, not a forecast.',
    'Risk score is probability times impact, each from 1 to 5. High is 15 or more, Medium 8 to 14, Low below 8. Every High risk needs a mitigation with a date.',
    'Triggers: name the number that starts a plan change before it is needed. Watch is within 10% of the trigger.'
  ],
  tabs: [
    {id: 'switchboard', title: 'Scenario switchboard', badge: function (D) { return D.sBreak ? D.sBreak + ' break the plan' : ''; }, sections: [
      {type: 'form', title: 'Base plan, peak week', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']},
        {k: 'dem', label: 'Peak-week demand, thousands', kind: 'int'},
        {k: 'cap', label: 'Peak-week capacity, thousands', kind: 'int'},
        {k: 'cpu', label: 'Cost per unit', kind: 'money'},
        {k: 'yearUnits', label: 'Units a year, millions', kind: 'num'}
      ], stats: [
        {label: 'Base use', v: function (D) { return U.fPct(D.baseUse); }},
        {label: 'Base cost a year', v: function (D) { return U.fMoney(D.baseCost, 0); }}
      ]},
      {type: 'tiles', items: [
        {label: 'Scenarios that break the plan', sub: 'Peak use above 100%', v: function (D, S) { return S.t.scen.length ? String(D.sBreak) : ''; }, bad: function (D) { return D.sBreak > 0; }},
        {label: 'Worst use', sub: function (D) { return D.sWorst || ''; }, v: function (D) { return U.fPct(D.sWorstUse); }},
        {label: 'Expected cost change', sub: 'A year, weighted by probability', v: function (D, S) { return S.t.scen.length ? U.fMoney(D.sExp, 0) : ''; }},
        {label: 'Peak capacity to add', sub: 'For every scenario to hold', v: function (D, S) { return S.t.scen.length ? U.fInt(D.sAdd) + 'k a week' : ''; }}
      ]},
      {type: 'table', k: 'scen', title: 'Scenarios', help: 'Each row changes the base plan. Enter changes as plus or minus percent.', add: 'Add a scenario', cols: [
        {k: 'name', label: 'Scenario', kind: 'text', w: 220},
        {k: 'dDem', label: 'Demand change %', kind: 'pct', w: 76},
        {k: 'dCap', label: 'Capacity change %', kind: 'pct', w: 76},
        {k: 'dCost', label: 'Cost per unit change %', kind: 'pct', w: 86},
        {k: 'prob', label: 'Probability %', kind: 'pct', w: 70},
        {label: 'Peak demand', w: 76, v: function (D, i) { return U.fInt(D.scen[i].dem); }},
        {label: 'Peak capacity', w: 76, v: function (D, i) { return U.fInt(D.scen[i].cap); }},
        {label: 'Use', w: 64, v: function (D, i) { return U.fPct(D.scen[i].use); }},
        {label: 'Cost change a year', w: 96, v: function (D, i) { var c = D.scen[i].dc; return c == null ? '' : U.signed(U.fMoney(c, 0), c); }},
        {label: 'Result', w: 86, status: function (D, i) { return D.scen[i].status; }}
      ]},
      {type: 'charts', title: 'Stress', charts: [
        {kind: 'bars', title: 'Peak use by scenario', sub: '% of peak capacity', data: function (D, S) { return {items: S.t.scen.map(function (s, i) { return {label: s.name || 'Scenario ' + (i + 1), v: D.scen[i].use == null ? null : D.scen[i].use * 100}; }), fmt: 'int'}; }}
      ]}
    ]},
    {id: 'risks', title: 'Risk register', badge: function (D) { return D.rHigh ? D.rHigh + ' high' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Open risks', sub: 'All rows not closed', v: function (D, S) { return S.t.risks.length ? String(D.rOpen) : ''; }},
        {label: 'High', sub: 'Score 15 or more', v: function (D, S) { return S.t.risks.length ? String(D.rHigh) : ''; }, bad: function (D) { return D.rHigh > 0; }},
        {label: 'Mitigations overdue', sub: 'Due date passed, risk open', v: function (D, S) { return S.t.risks.length ? String(D.rOver) : ''; }, bad: function (D) { return D.rOver > 0; }},
        {label: 'High risks without mitigation', sub: 'Need an action and a date', v: function (D, S) { return S.t.risks.length ? String(D.rNoMit) : ''; }, bad: function (D) { return D.rNoMit > 0; }}
      ]},
      {type: 'table', k: 'risks', title: 'Risks', help: 'Write the risk as cause and effect, for example: permit delay at the new site pushes launch past peak.', add: 'Add a risk', cols: [
        {k: 'risk', label: 'Risk', kind: 'text', w: 246},
        {k: 'area', label: 'Area', kind: 'sel', options: ['Demand', 'Capacity', 'Sites', 'Transport', 'Labor', 'Cost', 'Regulation', 'Technology'], w: 100},
        {k: 'owner', label: 'Owner', kind: 'text', w: 96},
        {k: 'p', label: 'Probability 1 to 5', kind: 'int', w: 76},
        {k: 'i', label: 'Impact 1 to 5', kind: 'int', w: 70},
        {k: 'mit', label: 'Mitigation', kind: 'text', w: 220},
        {k: 'due', label: 'Due', kind: 'date', w: 128},
        {k: 'closed', label: 'Closed', kind: 'sel', options: ['No', 'Yes'], w: 70},
        {label: 'Score', w: 56, v: function (D, i) { return U.fInt(D.risks[i].score); }},
        {label: 'Rating', w: 76, status: function (D, i) { return D.risks[i].rating; }}
      ]},
      {type: 'charts', title: 'Exposure', charts: [
        {kind: 'bars', title: 'Risk score by area', sub: 'Sum of open risks', data: function (D) { return {items: D.rByArea, fmt: 'int', share: true}; }}
      ]}
    ]},
    {id: 'triggers', title: 'Trigger points', badge: function (D) { return D.tHit ? D.tHit + ' triggered' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Triggered', sub: 'Act now', v: function (D, S) { return S.t.trig.length ? String(D.tHit) : ''; }, bad: function (D) { return D.tHit > 0; }},
        {label: 'Watch', sub: 'Within 10% of the trigger', v: function (D, S) { return S.t.trig.length ? String(D.tWatch) : ''; }},
        {label: 'Not triggered', sub: 'All clear', v: function (D, S) { return S.t.trig.length ? String(D.tOk) : ''; }}
      ]},
      {type: 'table', k: 'trig', title: 'Triggers', help: 'Fires when means the trigger fires when the current value is above or below the trigger value.', add: 'Add a trigger', cols: [
        {k: 'metric', label: 'Metric', kind: 'text', w: 220},
        {k: 'cur', label: 'Current', kind: 'num', w: 76},
        {k: 'trig', label: 'Trigger', kind: 'num', w: 76},
        {k: 'dir', label: 'Fires when', kind: 'sel', options: ['Above', 'Below'], w: 90},
        {k: 'action', label: 'Action when it fires', kind: 'text', w: 300},
        {k: 'owner', label: 'Owner', kind: 'text', w: 96},
        {label: 'Distance', w: 76, v: function (D, i) { return U.fPct(D.trig[i].dist); }},
        {label: 'Status', w: 104, status: function (D, i) { return D.trig[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Base peak use', v: function (D) { return U.fPct(D.baseUse) || 'No data'; }},
    {label: 'Scenarios that break the plan', v: function (D) { return {text: String(D.sBreak), tone: D.sBreak ? 'warn' : ''}; }},
    {label: 'High risks', v: function (D) { return {text: String(D.rHigh), tone: D.rHigh ? 'warn' : ''}; }},
    {label: 'Mitigations overdue', v: function (D) { return {text: String(D.rOver), tone: D.rOver ? 'warn' : ''}; }},
    {label: 'Triggers fired', v: function (D) { return {text: String(D.tHit), tone: D.tHit ? 'bad' : ''}; }}
  ],
  headline: function (D) {
    if (!D.sWorst) return {unit: 'Set the base plan and add scenarios'};
    return {num: U.fPct(D.sWorstUse), unit: 'peak use in the worst scenario', status: D.sWorstUse > 1 ? 'Breaks' : D.sWorstUse > 0.9 ? 'Strained' : 'Holds', note: D.sWorst};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleNetwork'; S.biz.marketplace = '2027 to 2031';
    var f = S.f; f.currency = '€'; f.dem = 14200; f.cap = 15800; f.cpu = 1.43; f.yearUnits = 395;
    S.t.scen = W.rows(['name', 'dDem', 'dCap', 'dCost', 'prob'], [
      ['High demand case', 12, 0, -2, 20],
      ['New sort center six months late', 0, -5, 3, 30],
      ['Lose a large customer', -8, 0, 4, 10],
      ['High demand and late site', 12, -5, 2, 8],
      ['Labor cost up 8%', 0, 0, 5, 35],
      ['Fire closes one sort center for peak', 0, -14, 6, 3]
    ]);
    S.t.risks = W.rows(['risk', 'area', 'owner', 'p', 'i', 'mit', 'due', 'closed'], [
      ['Permit delay at SC-S2 pushes launch past peak', 'Sites', 'Real estate', 3, 5, 'Rent temporary sort space in the South for peak', rel(W, 30), 'No'],
      ['Grocery program volume above forecast', 'Demand', 'Network planning', 3, 3, 'Reserve 5% flex capacity at SC-C1', rel(W, 60), 'No'],
      ['Driver shortage in the Capital region', 'Labor', 'Last-mile lead', 4, 4, '', '', 'No'],
      ['Carrier group B exits two long lanes', 'Transport', 'Transport lead', 2, 4, 'Second carrier qualified on both lanes', rel(W, -10), 'No'],
      ['Sorter software upgrade fails at go-live', 'Technology', 'Engineering', 2, 5, 'Run the upgrade after peak, keep rollback', rel(W, 90), 'No'],
      ['Diesel price up 20%', 'Cost', 'Finance', 3, 2, 'Fuel clause in all contracts', rel(W, -40), 'Yes']
    ]);
    S.t.trig = W.rows(['metric', 'cur', 'trig', 'dir', 'action', 'owner'], [
      ['Peak-week forecast, thousands', 14200, 15000, 'Above', 'Open the temporary sort space and book spot carriers', 'Network planning'],
      ['SC-S2 launch slip, weeks', 6, 8, 'Above', 'Move South peak volume to SC-W1 and SC-C1', 'Real estate'],
      ['Sort center use, last 4 weeks %', 93, 90, 'Above', 'Start the next sort center search now', 'Network planning'],
      ['Hires against plan %', 96, 90, 'Below', 'Raise wage offer and add an agency', 'Labor lead'],
      ['Cost per unit against plan %', 101, 104, 'Above', 'Review transport mix and overtime', 'Finance']
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {}, tdy = W.isoOf(today);
    D.baseUse = f.cap > 0 && W.isNum(f.dem) ? f.dem / f.cap : null;
    D.baseCost = W.isNum(f.cpu) && W.isNum(f.yearUnits) ? f.cpu * f.yearUnits * 1e6 : null;
    D.sBreak = 0; D.sExp = 0; D.sWorst = ''; D.sWorstUse = null; D.sAdd = 0;
    D.scen = S.t.scen.map(function (s, i) {
      if (!W.isNum(f.dem) || !(f.cap > 0)) return {status: ''};
      var dem = f.dem * (1 + n0(s.dDem) / 100), cap = f.cap * (1 + n0(s.dCap) / 100), use = cap > 0 ? dem / cap : null;
      var cost = D.baseCost != null ? f.cpu * (1 + n0(s.dCost) / 100) * f.yearUnits * 1e6 * (1 + n0(s.dDem) / 100) : null;
      var dc = cost != null ? cost - D.baseCost * (1 + n0(s.dDem) / 100) : null;
      if (dc != null) D.sExp += dc * n0(s.prob) / 100;
      var status = use > 1 ? 'Breaks' : use > 0.9 ? 'Strained' : 'Holds';
      if (status === 'Breaks') D.sBreak++;
      if (use != null && (D.sWorstUse == null || use > D.sWorstUse)) { D.sWorstUse = use; D.sWorst = s.name || 'Scenario ' + (i + 1); }
      D.sAdd = Math.max(D.sAdd, dem - cap);
      return {dem: dem, cap: cap, use: use, dc: dc, status: status};
    });

    D.rOpen = 0; D.rHigh = 0; D.rOver = 0; D.rNoMit = 0;
    var by = {};
    D.risks = S.t.risks.map(function (r) {
      if (!W.isNum(r.p) || !W.isNum(r.i)) return {rating: ''};
      var score = r.p * r.i, rating = score >= 15 ? 'High' : score >= 8 ? 'Medium' : 'Low';
      if (r.closed === 'Yes') return {score: score, rating: 'Closed'};
      D.rOpen++;
      by[r.area] = n0(by[r.area]) + score;
      if (rating === 'High') { D.rHigh++; if (!r.mit || !r.due) D.rNoMit++; }
      if (r.due && W.days(tdy, r.due) < 0) D.rOver++;
      return {score: score, rating: r.due && W.days(tdy, r.due) < 0 ? 'Overdue' : rating};
    });
    D.rByArea = Object.keys(by).map(function (k) { return {label: k, v: by[k]}; }).sort(function (a, b) { return b.v - a.v; });

    D.tHit = 0; D.tWatch = 0; D.tOk = 0;
    D.trig = S.t.trig.map(function (t) {
      if (!W.isNum(t.cur) || !W.isNum(t.trig) || t.trig === 0) return {status: ''};
      var above = t.dir !== 'Below';
      var dist = above ? (t.trig - t.cur) / Math.abs(t.trig) : (t.cur - t.trig) / Math.abs(t.trig);
      var status = dist <= 0 ? 'Triggered' : dist <= 0.1 ? 'Watch' : 'Not triggered';
      if (status === 'Triggered') D.tHit++; else if (status === 'Watch') D.tWatch++; else D.tOk++;
      return {dist: dist, status: status};
    });
    return D;
  }
};
})();
