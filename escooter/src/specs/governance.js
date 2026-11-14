(function () {
var U;
var ROLES = [['rCity', 'City ops'], ['rField', 'Field ops'], ['rRepair', 'Repair'], ['rParts', 'Parts'], ['rNpi', 'NPI'], ['rFin', 'Finance'], ['rLead', 'Ops lead']];
var RACI = ['', 'R', 'A', 'C', 'I'];
var ISSUES = ['Deployable rate below target for 2 days', 'Critical part out of stock', 'City SLA breached', 'Serious incident or battery fire', 'Permit at risk or cap exceeded', 'NPI gate more than 14 days late', 'Vehicle delivery more than 14 days late', 'Workshop load above 100% for a week'];
function rel(W, n) { var d = new Date(); return W.isoOf(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + n * W.DAY); }
window.SPEC = {
  app: 'esc-governance',
  title: 'Ops Governance',
  desc: 'Agree one KPI dictionary, set who is responsible and accountable for each process, run the weekly ops review, log decisions and set the escalation path.',
  notice: 'Every tab is filled with sample data for an operator in five cities. Type over it, or start blank.',
  headCap: 'Deployable rate last week',
  tones: {good: ['On target', 'Clear', 'Decided'], warn: ['Off target', 'Review due', 'Gaps'], bad: ['No A', 'Two A']},
  notes: [
    'One KPI, one definition, one owner. Reports use the names in the KPI dictionary and nothing else. Change a definition only through the decision log.',
    'RACI: R does the work, A owns the result and signs off, C is asked before, I is told after. Every process needs exactly one A. Where no team is marked R, the A team does the work itself.',
    'Weekly review: cut off all numbers at the same time, for example Sunday 24:00, so fleet, repair and allocation match. Rides per vehicle per day use the deployable fleet.',
    'Escalation: level 1 acts within the response time; if the issue is still open, it goes to level 2, then level 3. Each level needs a named person, not a team.'
  ],
  tabs: [
    {id: 'kpis', title: 'KPI dictionary', badge: function (D) { return D.kOff ? D.kOff + ' off target' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'KPIs defined', sub: 'With an owner and a formula', v: function (D, S) { return S.t.kpis.length ? D.kDefined + ' of ' + S.t.kpis.length : ''; }},
        {label: 'On target', sub: 'Latest value', v: function (D, S) { return S.t.kpis.length ? String(D.kOn) : ''; }},
        {label: 'Off target', sub: 'Latest value', v: function (D, S) { return S.t.kpis.length ? String(D.kOff) : ''; }, bad: function (D) { return D.kOff > 0; }}
      ]},
      {type: 'table', k: 'kpis', title: 'KPIs', help: 'Keep the list short: the numbers the weekly review runs on.', add: 'Add a KPI', cols: [
        {k: 'name', label: 'KPI', kind: 'text', w: 170},
        {k: 'formula', label: 'Formula', kind: 'text', w: 250},
        {k: 'owner', label: 'Owner', kind: 'text', w: 96},
        {k: 'source', label: 'Source', kind: 'text', w: 110},
        {k: 'freq', label: 'Frequency', kind: 'sel', options: ['Daily', 'Weekly', 'Monthly'], w: 90},
        {k: 'dir', label: 'Better is', kind: 'sel', options: ['Higher', 'Lower'], w: 80},
        {k: 'target', label: 'Target', kind: 'num', w: 64},
        {k: 'value', label: 'Latest', kind: 'num', w: 64},
        {label: 'Status', w: 96, status: function (D, i) { return D.kpis[i]; }}
      ]}
    ]},
    {id: 'raci', title: 'RACI by process', badge: function (D) { return D.rGaps ? D.rGaps + ' gaps' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Processes', sub: 'In the matrix', v: function (D, S) { return S.t.raci.length ? String(S.t.raci.length) : ''; }},
        {label: 'Clear', sub: 'Exactly one A', v: function (D, S) { return S.t.raci.length ? String(D.rClear) : ''; }},
        {label: 'Gaps', sub: 'No A, or more than one', v: function (D, S) { return S.t.raci.length ? String(D.rGaps) : ''; }, bad: function (D) { return D.rGaps > 0; }},
        {label: 'Busiest A', sub: function (D) { return D.rTopN ? D.rTopN + ' processes' : ''; }, v: function (D) { return D.rTop; }}
      ]},
      {type: 'table', k: 'raci', title: 'Matrix', help: 'Choose R, A, C or I for each team. Leave a cell empty when the team is not involved.', add: 'Add a process', cols: [{k: 'proc', label: 'Process', kind: 'text', w: 250}].concat(ROLES.map(function (r) { return {k: r[0], label: r[1], kind: 'sel', options: RACI, w: 76}; })).concat([
        {label: 'Status', w: 90, status: function (D, i) { return D.raci[i]; }}
      ])}
    ]},
    {id: 'weekly', title: 'Weekly ops review', badge: function (D) { return D.wLast ? U.fPct(D.wLast.dep) : ''; }, sections: [
      {type: 'form', title: 'Targets', fields: [
        {k: 'tDep', label: 'Deployable rate target', kind: 'pct', def: 85},
        {k: 'tRpvd', label: 'Rides per vehicle per day target', kind: 'num', def: 3.5},
        {k: 'tBacklog', label: 'Workshop queue limit', kind: 'int', def: 300}
      ]},
      {type: 'tiles', items: [
        {label: 'Deployable rate', sub: 'Last week', v: function (D) { return D.wLast ? U.fPct(D.wLast.dep) : ''; }, bad: function (D, S) { return D.wLast && D.wLast.dep * 100 < U.n0(S.f.tDep); }},
        {label: 'Rides per vehicle per day', sub: 'Last week, deployable fleet', v: function (D) { return D.wLast ? U.fDec2(D.wLast.rpvd) : ''; }},
        {label: 'Workshop queue', sub: function (D) { return D.wLast && D.wLast.qChg != null ? U.signed(U.fInt(D.wLast.qChg), D.wLast.qChg) + ' on the week before' : 'Last week'; }, v: function (D, S) { return D.wLastRow ? U.fInt(D.wLastRow.queue) : ''; }, bad: function (D, S) { return D.wLastRow && D.wLastRow.queue > U.n0(S.f.tBacklog); }},
        {label: 'Awaiting parts', sub: 'Last week', v: function (D) { return D.wLastRow ? U.fInt(D.wLastRow.parts) : ''; }}
      ]},
      {type: 'table', k: 'weeks', title: 'Weeks', help: 'One row per week, all cities, at the cut-off time.', add: 'Add a week', cols: [
        {k: 'week', label: 'Week starting', kind: 'date', w: 128},
        {k: 'fleet', label: 'Active fleet', kind: 'int', w: 70},
        {k: 'dep', label: 'Deployable', kind: 'int', w: 72},
        {k: 'rides', label: 'Rides', kind: 'int', w: 76},
        {k: 'fixed', label: 'Repairs done', kind: 'int', w: 70},
        {k: 'queue', label: 'Workshop queue', kind: 'int', w: 70},
        {k: 'parts', label: 'Awaiting parts', kind: 'int', w: 70},
        {k: 'sla', label: 'SLA breaches', kind: 'int', w: 64},
        {k: 'inc', label: 'Serious incidents', kind: 'int', w: 70},
        {label: 'Deployable rate', w: 74, v: function (D, i) { return U.fPct(D.weeks[i].dep); }},
        {label: 'Rides per vehicle per day', w: 80, v: function (D, i) { return U.fDec2(D.weeks[i].rpvd); }},
        {label: 'Status', w: 96, status: function (D, i) { return D.weeks[i].status; }}
      ]},
      {type: 'charts', title: 'Trend', charts: [
        {kind: 'line', title: 'Deployable rate by week', sub: '% of the active fleet', data: function (D, S) { return {pts: D.wOrder.map(function (i) { return {label: S.t.weeks[i].week ? U.fDate(U.toUTC(S.t.weeks[i].week)).replace(/ \d{4}$/, '') : 'Week', y: D.weeks[i].dep == null ? null : D.weeks[i].dep * 100}; }), refs: [{v: S.f.tDep, label: 'Target'}], fmt: 'dec1', unit: '%'}; }},
        {kind: 'line', title: 'Rides per vehicle per day', sub: 'Deployable fleet', data: function (D, S) { return {pts: D.wOrder.map(function (i) { return {label: S.t.weeks[i].week ? U.fDate(U.toUTC(S.t.weeks[i].week)).replace(/ \d{4}$/, '') : 'Week', y: D.weeks[i].rpvd}; }), refs: [{v: S.f.tRpvd, label: 'Target'}], fmt: 'dec2'}; }}
      ]},
      {type: 'note', title: 'Points for this week', v: function (D) { return D.wLast ? [D.wLast.status, D.wText] : ['', 'Add a week to see the points to discuss.']; }}
    ]},
    {id: 'decisions', title: 'Decision log', badge: function (D) { return D.dDue ? D.dDue + ' reviews due' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Decisions logged', sub: 'All rows', v: function (D, S) { return S.t.dec.length ? String(S.t.dec.length) : ''; }},
        {label: 'Open', sub: 'Waiting for a decision', v: function (D, S) { return S.t.dec.length ? String(D.dOpen) : ''; }},
        {label: 'Reviews due', sub: 'Review date passed', v: function (D, S) { return S.t.dec.length ? String(D.dDue) : ''; }, bad: function (D) { return D.dDue > 0; }}
      ]},
      {type: 'table', k: 'dec', title: 'Decisions', help: 'Log every decision that changes a rule, a KPI, a priority or a budget. Set a review date for decisions that may need to change.', add: 'Add a decision', cols: [
        {k: 'date', label: 'Date', kind: 'date', w: 128},
        {k: 'area', label: 'Area', kind: 'sel', options: ['Allocation', 'Fleet', 'Repair', 'Parts', 'Field ops', 'NPI', 'Supply', 'Finance', 'Safety', 'Governance'], w: 104},
        {k: 'what', label: 'Decision', kind: 'text', w: 300},
        {k: 'by', label: 'Decided by', kind: 'text', w: 100},
        {k: 'state', label: 'State', kind: 'sel', options: ['Open', 'Decided', 'Reversed'], w: 96, tone: true},
        {k: 'review', label: 'Review on', kind: 'date', w: 128},
        {label: 'Days to review', w: 64, v: function (D, i) { return U.fInt(D.dec[i].left); }},
        {label: 'Status', w: 96, status: function (D, i) { return D.dec[i].status; }}
      ]}
    ]},
    {id: 'escalation', title: 'Escalation matrix', badge: function (D) { return D.eGaps ? D.eGaps + ' gaps' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Issues covered', sub: 'All three levels named', v: function (D) { return D.eReady + ' of ' + ISSUES.length; }},
        {label: 'Gaps', sub: 'A level without a name', v: function (D) { return String(D.eGaps); }, bad: function (D) { return D.eGaps > 0; }},
        {label: 'Fastest first response', sub: 'Hours', v: function (D) { return U.fDec1(D.eFast); }}
      ]},
      {type: 'table', k: 'esc', title: 'Issues', help: 'Name a person at each level. Response time is how fast level 1 must act.', fixed: ISSUES, cols: [
        {fixedLabel: true, label: 'Issue', w: 270, num: false},
        {k: 'trigger', label: 'Trigger', kind: 'text', w: 190},
        {k: 'l1', label: 'Level 1', kind: 'text', w: 110},
        {k: 'l2', label: 'Level 2', kind: 'text', w: 110},
        {k: 'l3', label: 'Level 3', kind: 'text', w: 110},
        {k: 'hours', label: 'Response, hours', kind: 'num', w: 76},
        {k: 'channel', label: 'Channel', kind: 'text', w: 110},
        {label: 'Status', w: 80, status: function (D, i) { return D.esc[i]; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'KPIs off target', v: function (D) { return {text: String(D.kOff), tone: D.kOff ? 'warn' : ''}; }},
    {label: 'RACI gaps', v: function (D) { return {text: String(D.rGaps), tone: D.rGaps ? 'warn' : ''}; }},
    {label: 'Rides per vehicle per day', v: function (D) { return D.wLast ? U.fDec2(D.wLast.rpvd) : 'No data'; }},
    {label: 'Decision reviews due', v: function (D) { return String(D.dDue); }},
    {label: 'Escalation gaps', v: function (D) { return {text: String(D.eGaps), tone: D.eGaps ? 'warn' : ''}; }}
  ],
  headline: function (D) {
    if (!D.wLast) return {unit: 'Add a week to the ops review'};
    return {num: U.fPct(D.wLast.dep), unit: 'deployable last week', status: D.wLast.status, note: U.fDec2(D.wLast.rpvd) + ' rides per vehicle per day'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleMobility'; S.biz.marketplace = 'Germany and Austria';
    S.t.kpis = W.rows(['name', 'formula', 'owner', 'source', 'freq', 'dir', 'target', 'value'], [
      ['Deployable rate %', 'Live plus low battery over active fleet', 'Ops lead', 'Fleet system', 'Daily', 'Higher', 85, 86.5],
      ['Rides per vehicle per day', 'Rides over deployable fleet over days', 'City ops', 'Rider app', 'Weekly', 'Higher', 3.5, 3.6],
      ['Workshop queue', 'Vehicles in workshop or awaiting parts', 'Repair', 'Workshop system', 'Daily', 'Lower', 300, 410],
      ['Repair minutes per vehicle', 'Repair labor minutes over vehicles fixed', 'Repair', 'Workshop system', 'Weekly', 'Lower', 30, 28],
      ['Rework rate %', 'Back for the same fault within 7 days over repairs', 'Repair', 'Workshop system', 'Weekly', 'Lower', 4, 3.6],
      ['Awaiting parts %', 'Awaiting parts over active fleet', 'Parts', 'Fleet system', 'Daily', 'Lower', 2.5, 3.1],
      ['SLA compliance %', 'City cases closed in time over cases', 'Field ops', 'City portals', 'Weekly', 'Higher', 95, 95.8],
      ['Loss rate %', 'Net vehicles lost over fleet per month', 'City ops', 'Fleet system', 'Monthly', 'Lower', 0.5, 0.7],
      ['EBITDA per vehicle per day', 'City EBITDA over fleet over days', 'Finance', 'Finance system', 'Monthly', 'Higher', 1.5, 1.8]
    ]);
    var rr = [
      ['City fleet allocation', 'A', 'C', 'I', '', '', 'C', 'R'],
      ['Battery swaps and rebalancing', 'C', 'A', '', '', '', '', 'I'],
      ['Workshop repair priority', 'C', '', 'R', 'C', '', '', 'A'],
      ['Parts demand and orders', '', '', 'C', 'A', 'C', 'C', 'I'],
      ['New model readiness gate', 'C', 'C', 'R', 'R', 'R', '', 'A'],
      ['City permits and reporting', 'A', 'C', '', '', '', '', 'I'],
      ['Recall campaigns', '', 'R', 'R', 'C', 'A', '', 'A'],
      ['Monthly city P&L', 'C', '', '', '', '', 'R', '']
    ];
    S.t.raci = rr.map(function (r) { var o = {proc: r[0]}; ROLES.forEach(function (x, j) { o[x[0]] = r[j + 1]; }); return o; });
    var w = function (k) { return rel(W, -7 * k - ((new Date().getDay() + 6) % 7)); };
    S.t.weeks = W.rows(['week', 'fleet', 'dep', 'rides', 'fixed', 'queue', 'parts', 'sla', 'inc'], [
      [w(6), 7850, 6830, 168000, 860, 280, 190, 31, 1],
      [w(5), 7880, 6890, 172000, 880, 270, 185, 28, 0],
      [w(4), 7900, 6870, 170500, 845, 300, 205, 36, 1],
      [w(3), 7920, 6780, 166000, 900, 340, 240, 41, 2],
      [w(2), 7900, 6720, 160000, 910, 380, 260, 39, 0],
      [w(1), 7890, 6820, 168500, 930, 410, 250, 33, 1]
    ]);
    S.t.dec = W.rows(['date', 'area', 'what', 'by', 'state', 'review'], [
      [rel(W, -60), 'Repair', 'Repair order: highest earning city first, then cheapest fix, then oldest in queue', 'Ops lead', 'Decided', rel(W, -2)],
      [rel(W, -45), 'Allocation', 'Allocate on deployable fleet only, cut-off Sunday 24:00', 'Ops lead', 'Decided', rel(W, 45)],
      [rel(W, -20), 'Parts', 'Cannibalization only with workshop lead approval, logged the same day', 'Parts lead', 'Decided', rel(W, 40)],
      [rel(W, -8), 'NPI', 'Delay S3 pilot until spares for 90 days are on the shelf', 'Ops lead', 'Open', rel(W, 7)],
      [rel(W, -3), 'Finance', 'Close Cologne if margin stays below 0% for two more months', 'CFO', 'Open', rel(W, 60)]
    ]);
    var esc = [
      ['Below 85% two days running', 'City manager', 'Ops lead', 'COO', 24, 'Ops channel'],
      ['Shortage blocks 20 or more vehicles', 'Parts lead', 'Ops lead', 'COO', 24, 'Ops channel'],
      ['Compliance below target', 'Field lead', 'City manager', 'Ops lead', 24, 'Email'],
      ['Any serious incident', 'City manager', 'Safety lead', 'CEO', 2, 'Phone'],
      ['Notice from the city', 'City manager', 'Public policy', 'CEO', 24, 'Phone'],
      ['Gate forecast 14 days late', 'NPI lead', 'Ops lead', '', 72, 'Weekly review'],
      ['OEM confirms delay', 'Buyer', 'Ops lead', 'CFO', 48, 'Email'],
      ['Queue grows 3 weeks running', 'Workshop lead', 'Ops lead', 'COO', 48, 'Weekly review']
    ];
    S.t.esc.forEach(function (r, i) { r.trigger = esc[i][0]; r.l1 = esc[i][1]; r.l2 = esc[i][2]; r.l3 = esc[i][3]; r.hours = esc[i][4]; r.channel = esc[i][5]; });
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {}, tdy = W.isoOf(today);
    D.kOn = 0; D.kOff = 0; D.kDefined = 0;
    D.kpis = S.t.kpis.map(function (k) {
      if (k.name && k.formula && k.owner) D.kDefined++;
      if (!W.isNum(k.target) || !W.isNum(k.value)) return k.name && (!k.formula || !k.owner) ? 'Gaps' : '';
      var ok = k.dir === 'Lower' ? k.value <= k.target : k.value >= k.target;
      if (ok) D.kOn++; else D.kOff++;
      return ok ? 'On target' : 'Off target';
    });

    var aCount = {};
    D.rClear = 0; D.rGaps = 0;
    D.raci = S.t.raci.map(function (r) {
      var vals = ROLES.map(function (x) { return r[x[0]]; });
      if (!r.proc && vals.every(function (v) { return !v; })) return '';
      var a = vals.filter(function (v) { return v === 'A'; }).length;
      ROLES.forEach(function (x) { if (r[x[0]] === 'A') aCount[x[1]] = n0(aCount[x[1]]) + 1; });
      var st = a === 0 ? 'No A' : a > 1 ? 'Two A' : 'Clear';
      if (st === 'Clear') D.rClear++; else D.rGaps++;
      return st;
    });
    var top = Object.keys(aCount).sort(function (a, b) { return aCount[b] - aCount[a]; })[0];
    D.rTop = top || ''; D.rTopN = top ? aCount[top] : 0;

    D.wOrder = S.t.weeks.map(function (w, i) { return i; }).sort(function (a, b) { return (S.t.weeks[a].week || '') < (S.t.weeks[b].week || '') ? -1 : 1; });
    D.weeks = S.t.weeks.map(function (w) {
      var dep = W.ratio(w.dep, w.fleet), rpvd = w.dep > 0 && W.isNum(w.rides) ? w.rides / w.dep / 7 : null;
      if (dep == null) return {status: ''};
      var off = dep * 100 < n0(f.tDep) || (rpvd != null && rpvd < n0(f.tRpvd)) || (W.isNum(w.queue) && w.queue > n0(f.tBacklog));
      return {dep: dep, rpvd: rpvd, status: off ? 'Off target' : 'On target'};
    });
    var valid = D.wOrder.filter(function (i) { return D.weeks[i].dep != null; });
    var li = valid[valid.length - 1], pi = valid[valid.length - 2];
    D.wLast = li != null ? D.weeks[li] : null;
    D.wLastRow = li != null ? S.t.weeks[li] : null;
    if (D.wLast) {
      var cur = S.t.weeks[li], prev = pi != null ? S.t.weeks[pi] : null, pts = [];
      D.wLast.qChg = prev && W.isNum(cur.queue) && W.isNum(prev.queue) ? cur.queue - prev.queue : null;
      if (D.wLast.dep * 100 < n0(f.tDep)) pts.push('Deployable rate ' + U.fPct(D.wLast.dep) + ' is below the ' + U.fPct(n0(f.tDep) / 100) + ' target.');
      if (W.isNum(cur.queue) && cur.queue > n0(f.tBacklog)) pts.push('Workshop queue of ' + U.fInt(cur.queue) + ' is above the limit of ' + U.fInt(f.tBacklog) + (D.wLast.qChg > 0 ? ' and grew by ' + U.fInt(D.wLast.qChg) + '.' : '.'));
      if (prev && W.isNum(cur.parts) && W.isNum(prev.parts) && cur.parts > prev.parts) pts.push('Vehicles awaiting parts rose to ' + U.fInt(cur.parts) + '.');
      if (D.wLast.rpvd != null && D.wLast.rpvd < n0(f.tRpvd)) pts.push('Rides per vehicle per day of ' + U.fDec2(D.wLast.rpvd) + ' are below target: check allocation.');
      if (cur.inc > 0) pts.push(U.fInt(cur.inc) + ' serious incident' + (cur.inc > 1 ? 's' : '') + ' to review.');
      D.wText = pts.length ? pts.join(' ') : 'All review numbers are on target.';
    }

    D.dOpen = 0; D.dDue = 0;
    D.dec = S.t.dec.map(function (d) {
      if (!d.what && !d.date) return {status: ''};
      var left = d.review ? W.days(tdy, d.review) : null;
      if (d.state === 'Open') D.dOpen++;
      var due = left != null && left < 0 && d.state !== 'Reversed';
      if (due) D.dDue++;
      return {left: left, status: due ? 'Review due' : d.state === 'Open' ? 'Open' : d.state === 'Reversed' ? 'Closed' : 'Decided'};
    });

    D.eReady = 0; D.eGaps = 0;
    D.esc = S.t.esc.map(function (r) {
      var ok = r.l1 && r.l2 && r.l3;
      if (ok) D.eReady++; else if (r.l1 || r.l2 || r.trigger) D.eGaps++;
      return ok ? 'Ready' : r.l1 || r.l2 || r.trigger ? 'Gaps' : '';
    });
    var hs = S.t.esc.map(function (r) { return r.hours; }).filter(W.isNum);
    D.eFast = hs.length ? Math.min.apply(null, hs) : null;
    return D;
  }
};
})();
