(function () {
var U;
var CHECKS = [
  'States the plan in one paragraph: volume, capacity, cost, capex',
  'Bridges this plan to the last plan, with every driver named',
  'Lists the main assumptions and where each comes from',
  'Shows base, high and low cases and which one capacity is built for',
  'Names the first year each region runs short and the fix',
  'Lists the site projects with launch dates and the latest start dates',
  'Shows labor needs and the hiring risk by site',
  'Ties volume and cost to the finance plan',
  'Lists the top risks with owners and trigger points',
  'States the decisions needed now, with a date for each'
];
function rel(W, n) { var d = new Date(); return W.isoOf(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + n * W.DAY); }
window.SPEC = {
  app: 'plan-governance',
  title: 'Planning Governance',
  desc: 'Run the planning calendar from the annual plan to peak readiness, keep one dictionary of planning KPIs, log decisions with review dates, and check the plan document before it goes out.',
  notice: 'Every tab is filled with sample data for a network planning team. Type over it, or start blank.',
  headCap: 'Next milestone',
  tones: {good: ['Done', 'On target', 'Decided', 'Complete'], warn: ['Due soon', 'Off target', 'Review due', 'Partly'], bad: ['Overdue', 'Not done']},
  notes: [
    'A common rhythm: the annual plan sets volume, capacity and budget for the coming year; a mid-year refresh updates it with actuals; quarterly refreshes move the five-year view; peak readiness checks the network weeks before the busiest period.',
    'Every report uses the KPI names and formulas in the dictionary. A definition changes only through a logged decision.',
    'The plan document should let a reader who was not in the room understand the plan, the change from the last plan and the decisions needed. Every line in the checklist should be Yes before it goes out.'
  ],
  tabs: [
    {id: 'calendar', title: 'Planning calendar', badge: function (D) { return D.cOver ? D.cOver + ' overdue' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Next milestone', sub: function (D) { return D.cNextDate || ''; }, v: function (D) { return D.cNext; }},
        {label: 'Due in 30 days', sub: 'Not yet done', v: function (D, S) { return S.t.cal.length ? String(D.cSoon) : ''; }},
        {label: 'Overdue', sub: 'Date passed, not done', v: function (D, S) { return S.t.cal.length ? String(D.cOver) : ''; }, bad: function (D) { return D.cOver > 0; }},
        {label: 'Done', sub: 'This cycle', v: function (D, S) { return S.t.cal.length ? D.cDone + ' of ' + S.t.cal.length : ''; }}
      ]},
      {type: 'table', k: 'cal', title: 'Milestones', help: 'One row per milestone in the planning year.', add: 'Add a milestone', cols: [
        {k: 'date', label: 'Date', kind: 'date', w: 128},
        {k: 'cycle', label: 'Cycle', kind: 'sel', options: ['Annual plan', 'Mid-year refresh', 'Quarterly refresh', 'Peak readiness', 'Five-year plan'], w: 130},
        {k: 'what', label: 'Milestone', kind: 'text', w: 330},
        {k: 'owner', label: 'Owner', kind: 'text', w: 120},
        {k: 'audience', label: 'Reviewed by', kind: 'text', w: 130},
        {k: 'done', label: 'Done', kind: 'sel', options: ['No', 'Yes'], w: 70},
        {label: 'Days left', w: 64, v: function (D, i) { return U.fInt(D.cal[i].left); }},
        {label: 'Status', w: 90, status: function (D, i) { return D.cal[i].status; }}
      ]}
    ]},
    {id: 'kpis', title: 'Planning KPI dictionary', badge: function (D) { return D.kOff ? D.kOff + ' off target' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'KPIs', sub: 'In the dictionary', v: function (D, S) { return S.t.kpis.length ? String(S.t.kpis.length) : ''; }},
        {label: 'On target', sub: 'Latest value', v: function (D, S) { return S.t.kpis.length ? String(D.kOn) : ''; }},
        {label: 'Off target', sub: 'Latest value', v: function (D, S) { return S.t.kpis.length ? String(D.kOff) : ''; }, bad: function (D) { return D.kOff > 0; }}
      ]},
      {type: 'table', k: 'kpis', title: 'KPIs', help: 'Keep the planning KPIs few and stable, so a trend over years means something.', add: 'Add a KPI', cols: [
        {k: 'name', label: 'KPI', kind: 'text', w: 190},
        {k: 'formula', label: 'Formula', kind: 'text', w: 280},
        {k: 'owner', label: 'Owner', kind: 'text', w: 110},
        {k: 'freq', label: 'Frequency', kind: 'sel', options: ['Weekly', 'Monthly', 'Quarterly', 'Yearly'], w: 96},
        {k: 'dir', label: 'Better is', kind: 'sel', options: ['Higher', 'Lower'], w: 80},
        {k: 'target', label: 'Target', kind: 'num', w: 66},
        {k: 'value', label: 'Latest', kind: 'num', w: 66},
        {label: 'Status', w: 96, status: function (D, i) { return D.kpis[i]; }}
      ]}
    ]},
    {id: 'decisions', title: 'Decision log', badge: function (D) { return D.dDue ? D.dDue + ' reviews due' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Decisions', sub: 'All rows', v: function (D, S) { return S.t.dec.length ? String(S.t.dec.length) : ''; }},
        {label: 'Waiting for a decision', sub: 'Open', v: function (D, S) { return S.t.dec.length ? String(D.dOpen) : ''; }},
        {label: 'Decide by date passed', sub: 'Open and late', v: function (D, S) { return S.t.dec.length ? String(D.dLate) : ''; }, bad: function (D) { return D.dLate > 0; }},
        {label: 'Reviews due', sub: 'Decided, review date passed', v: function (D, S) { return S.t.dec.length ? String(D.dDue) : ''; }}
      ]},
      {type: 'table', k: 'dec', title: 'Decisions', help: 'Log decisions that change volume, capacity, sites, budget or a KPI. Decide by is the last date that keeps the plan on track.', add: 'Add a decision', cols: [
        {k: 'what', label: 'Decision', kind: 'text', w: 300},
        {k: 'area', label: 'Area', kind: 'sel', options: ['Demand', 'Capacity', 'Sites', 'Transport', 'Labor', 'Cost', 'Governance'], w: 100},
        {k: 'by', label: 'Decided by', kind: 'text', w: 110},
        {k: 'state', label: 'State', kind: 'sel', options: ['Open', 'Decided', 'Reversed'], w: 96, tone: true},
        {k: 'deadline', label: 'Decide by', kind: 'date', w: 128},
        {k: 'review', label: 'Review on', kind: 'date', w: 128},
        {label: 'Days left', w: 60, v: function (D, i) { return U.fInt(D.dec[i].left); }},
        {label: 'Status', w: 96, status: function (D, i) { return D.dec[i].status; }}
      ]}
    ]},
    {id: 'document', title: 'Plan document checklist', badge: function (D) { return D.pScore != null ? U.fPct(D.pScore) + ' ready' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Ready', sub: 'Yes counts 1, Partly counts 0.5', v: function (D) { return U.fPct(D.pScore); }},
        {label: 'Lines not done', sub: 'Block sending the plan', v: function (D) { return D.pAny ? String(D.pOpen) : ''; }, bad: function (D) { return D.pOpen > 0; }},
        {label: 'Document state', sub: 'All lines Yes to send', v: function (D) { return D.pAny ? (D.pOpen ? 'Draft' : 'Complete') : ''; }}
      ]},
      {type: 'table', k: 'doc', title: 'The plan document', help: 'Check the written plan line by line. Section is where the answer sits in the document.', fixed: CHECKS, cols: [
        {fixedLabel: true, label: 'The document', w: 440, num: false},
        {k: 'done', label: 'Done', kind: 'sel', options: ['No', 'Partly', 'Yes'], w: 90},
        {k: 'sec', label: 'Section', kind: 'text', w: 120},
        {k: 'owner', label: 'Owner', kind: 'text', w: 120},
        {k: 'note', label: 'Notes', kind: 'text', w: 220},
        {label: 'Status', w: 90, status: function (D, i) { return D.doc[i]; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Next milestone', v: function (D) { return D.cNext || 'None'; }},
    {label: 'Milestones overdue', v: function (D) { return {text: String(D.cOver), tone: D.cOver ? 'warn' : ''}; }},
    {label: 'KPIs off target', v: function (D) { return {text: String(D.kOff), tone: D.kOff ? 'warn' : ''}; }},
    {label: 'Decisions waiting', v: function (D) { return String(D.dOpen); }},
    {label: 'Plan document ready', v: function (D) { return U.fPct(D.pScore) || 'No data'; }}
  ],
  headline: function (D) {
    if (!D.cNext) return {unit: 'Add milestones to the planning calendar'};
    return {num: D.cNext, unit: D.cNextDate ? 'on ' + D.cNextDate : '', status: D.cOver ? 'Overdue' : 'On track', note: D.cDone + ' milestones done, ' + D.dOpen + ' decisions waiting'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleNetwork'; S.biz.marketplace = '2027 to 2031';
    S.t.cal = W.rows(['date', 'cycle', 'what', 'owner', 'audience', 'done'], [
      [rel(W, -70), 'Peak readiness', 'Peak capacity and labor check, all sites', 'Network planning', 'Operations leads', 'Yes'],
      [rel(W, -35), 'Annual plan', 'Volume forecast for next year signed off', 'Demand planning', 'Finance and operations', 'Yes'],
      [rel(W, -7), 'Annual plan', 'Capacity gap and site list agreed', 'Network planning', 'Operations leadership', 'No'],
      [rel(W, 10), 'Annual plan', 'Labor and cost plan submitted to finance', 'Finance partner', 'CFO', 'No'],
      [rel(W, 30), 'Annual plan', 'Plan document reviewed by leadership', 'Head of planning', 'Leadership team', 'No'],
      [rel(W, 120), 'Quarterly refresh', 'Five-year view updated with first-quarter actuals', 'Network planning', 'Operations leadership', 'No'],
      [rel(W, 210), 'Mid-year refresh', 'Volume and budget refreshed for second half', 'Demand planning', 'Finance and operations', 'No'],
      [rel(W, 300), 'Peak readiness', 'Peak plan locked, temporary capacity booked', 'Network planning', 'Operations leads', 'No']
    ]);
    S.t.kpis = W.rows(['name', 'formula', 'owner', 'freq', 'dir', 'target', 'value'], [
      ['Forecast accuracy, 12 months out %', '1 minus absolute error over actual volume', 'Demand planning', 'Monthly', 'Higher', 90, 87],
      ['Peak use of sort capacity %', 'Peak-week volume over peak capacity', 'Network planning', 'Yearly', 'Lower', 90, 93],
      ['Cost per unit', 'Network cost over units', 'Finance partner', 'Monthly', 'Lower', 1.45, 1.43],
      ['Sites launched on time %', 'Sites launched by plan date over sites due', 'Real estate', 'Quarterly', 'Higher', 90, 75],
      ['Plan to finance volume gap %', 'Absolute difference over finance volume', 'Finance partner', 'Quarterly', 'Lower', 2, 2.9],
      ['Hiring against plan %', 'Hires made over hires planned', 'Labor lead', 'Weekly', 'Higher', 95, 96]
    ]);
    S.t.dec = W.rows(['what', 'area', 'by', 'state', 'deadline', 'review'], [
      ['Build capacity to the peak week of the high case, not the base', 'Capacity', 'Head of operations', 'Decided', rel(W, -90), rel(W, 200)],
      ['Start the search for a second Capital region sort center', 'Sites', 'Leadership team', 'Open', rel(W, -5), ''],
      ['Rent temporary sort space in the South for next peak', 'Sites', 'Head of operations', 'Open', rel(W, 25), ''],
      ['Move long lanes over 450 km to rail where a terminal is near', 'Transport', 'Transport lead', 'Decided', rel(W, -60), rel(W, -3)],
      ['Use the finance volume as the single plan volume from next year', 'Governance', 'CFO and head of operations', 'Decided', rel(W, -30), rel(W, 330)]
    ]);
    var done = ['Yes', 'Partly', 'Yes', 'Yes', 'Yes', 'Partly', 'No', 'Partly', 'Yes', 'No'];
    var sec = ['Summary', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    var own = ['Head of planning', 'Demand planning', 'Demand planning', 'Demand planning', 'Network planning', 'Real estate', 'Labor lead', 'Finance partner', 'Network planning', 'Head of planning'];
    S.t.doc.forEach(function (r, i) { r.done = done[i]; r.sec = sec[i]; r.owner = own[i]; });
    S.t.doc[1].note = 'Method change still unexplained'; S.t.doc[6].note = 'Waiting for site hiring plans';
  },
  derive: function (S, today, W) {
    U = W;
    var D = {}, n0 = W.n0, tdy = W.isoOf(today);
    D.cSoon = 0; D.cOver = 0; D.cDone = 0; D.cNext = ''; D.cNextDate = '';
    var nextT = null;
    D.cal = S.t.cal.map(function (c) {
      if (!c.date) return {status: ''};
      var left = W.days(tdy, c.date), done = c.done === 'Yes';
      if (done) { D.cDone++; return {left: null, status: 'Done'}; }
      if (left < 0) D.cOver++; else if (left <= 30) D.cSoon++;
      var t = U.toUTC(c.date);
      if (left >= 0 && (nextT == null || t < nextT)) { nextT = t; D.cNext = c.what || c.cycle; D.cNextDate = U.fDate(t); }
      return {left: left, status: left < 0 ? 'Overdue' : left <= 14 ? 'Due soon' : 'On track'};
    });

    D.kOn = 0; D.kOff = 0;
    D.kpis = S.t.kpis.map(function (k) {
      if (!W.isNum(k.target) || !W.isNum(k.value)) return '';
      var ok = k.dir === 'Lower' ? k.value <= k.target : k.value >= k.target;
      if (ok) D.kOn++; else D.kOff++;
      return ok ? 'On target' : 'Off target';
    });

    D.dOpen = 0; D.dLate = 0; D.dDue = 0;
    D.dec = S.t.dec.map(function (d) {
      if (!d.what) return {status: ''};
      if (d.state === 'Open') {
        D.dOpen++;
        var left = d.deadline ? W.days(tdy, d.deadline) : null;
        if (left != null && left < 0) D.dLate++;
        return {left: left, status: left != null && left < 0 ? 'Overdue' : left != null && left <= 14 ? 'Due soon' : 'Open'};
      }
      if (d.state === 'Reversed') return {status: 'Closed'};
      var r = d.review ? W.days(tdy, d.review) : null;
      if (r != null && r < 0) D.dDue++;
      return {left: r, status: r != null && r < 0 ? 'Review due' : 'Decided'};
    });

    var pts = 0;
    D.pOpen = 0; D.pAny = S.t.doc.some(function (r) { return r.done !== 'No'; });
    D.doc = S.t.doc.map(function (r) {
      pts += r.done === 'Yes' ? 1 : r.done === 'Partly' ? 0.5 : 0;
      if (r.done !== 'Yes') D.pOpen++;
      return r.done === 'Yes' ? 'Done' : r.done === 'Partly' ? 'Partly' : 'Not done';
    });
    D.pScore = D.pAny ? pts / CHECKS.length : null;
    return D;
  }
};
})();
