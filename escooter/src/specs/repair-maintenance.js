(function () {
var U;
function rel(W, n) { var d = new Date(); return W.isoOf(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + n * W.DAY); }
window.SPEC = {
  app: 'esc-repair-maintenance',
  title: 'Repair and Maintenance',
  desc: 'Size workshop capacity against incoming repairs, set labor standards, rank fault codes, schedule preventive maintenance and track rework.',
  notice: 'Every tab is filled with sample data for a workshop serving one city. Type over it, or start blank.',
  headCap: 'Workshop load',
  tones: {good: ['Within capacity', 'Within standard', 'A'], warn: ['Near capacity', 'Slow', 'B'], bad: ['Over capacity', 'Very slow', 'Above limit']},
  notes: [
    'Capacity is mechanics times shifts times hours times days, less the time lost to breaks, cleaning and waiting. Workload is the jobs each week times the standard minutes from the Labor standards tab. Above 85% load the queue starts to grow on busy days; above 100% it grows every week.',
    'Labor standards are the minutes a trained mechanic needs for a job, including test ride and paperwork. Efficiency is standard over actual: above 100% means faster than standard.',
    'Fault code classes: A is the codes that make up the first 80% of faults, B the next 15%, C the rest. Fix the causes of class A first.',
    'Preventive maintenance is due on distance or on time, whichever comes first. Services per week use the fleet\'s average daily distance.',
    'Rework is a vehicle back in the workshop for the same fault within 7 days of a repair.'
  ],
  tabs: [
    {id: 'capacity', title: 'Repair capacity planner', badge: function (D) { return D.cLoad != null ? U.fPct(D.cLoad) + ' load' : ''; }, sections: [
      {type: 'form', title: 'Workshop', fields: [
        {k: 'mech', label: 'Mechanics per shift', kind: 'int'},
        {k: 'shifts', label: 'Shifts per day', kind: 'int', def: 2},
        {k: 'hours', label: 'Hours per shift', kind: 'num', def: 8},
        {k: 'days', label: 'Days per week', kind: 'int', def: 5},
        {k: 'prod', label: 'Productive share', kind: 'pct', def: 80, note: 'Time left after breaks, cleaning and waiting'},
        {k: 'bays', label: 'Repair bays', kind: 'int'},
        {k: 'backlog', label: 'Vehicles in the queue now', kind: 'int'}
      ], stats: [
        {label: 'Capacity, hours per week', v: function (D) { return U.fInt(D.cCap); }},
        {label: 'Workload, hours per week', v: function (D) { return U.fInt(D.cWork); }},
        {label: 'Bay hours per week', v: function (D) { return U.fInt(D.cBay); }}
      ]},
      {type: 'tiles', items: [
        {label: 'Load', sub: 'Workload over capacity', v: function (D) { return U.fPct(D.cLoad); }, bad: function (D) { return D.cLoad > 1; }},
        {label: 'Jobs per week', sub: 'Incoming, from labor standards', v: function (D) { return D.cJobs ? U.fInt(D.cJobs) : ''; }},
        {label: 'Mechanics needed', sub: 'Per shift, to run at 85%', v: function (D) { return U.fDec1(D.cNeed); }},
        {label: 'Queue cleared in', sub: function (D) { return D.cSpare != null && D.cSpare <= 0 ? 'Queue grows: no spare hours' : 'Using the spare hours each week'; }, v: function (D) { return D.cClear != null ? U.fDec1(D.cClear) + ' weeks' : ''; }, bad: function (D) { return D.cSpare != null && D.cSpare <= 0; }}
      ]},
      {type: 'note', title: 'Capacity check', v: function (D) { return D.cLoad == null ? ['', 'Fill in the workshop and the labor standards to see the load.'] : [D.cStatus, D.cText]; }},
      {type: 'charts', title: 'Where the hours go', charts: [
        {kind: 'bars', title: 'Workload by repair type', sub: 'Hours per week, with share', data: function (D, S) { return {items: S.t.std.map(function (r, i) { return {label: r.type || 'Type ' + (i + 1), v: D.std[i].hours}; }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); }), fmt: 'dec1', share: true}; }}
      ]}
    ]},
    {id: 'standards', title: 'Labor standards', badge: function (D) { return D.sSlow ? D.sSlow + ' slow' : ''; }, sections: [
      {type: 'form', title: 'Labor cost', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']},
        {k: 'rate', label: 'Labor cost per hour', kind: 'money', note: 'Wage plus employer costs'}
      ]},
      {type: 'table', k: 'std', title: 'Repair types', help: 'Standard minutes come from timed jobs by trained mechanics. Actual minutes and jobs per week come from the workshop system, last 4 weeks.', add: 'Add a repair type', cols: [
        {k: 'type', label: 'Repair type', kind: 'text', w: 190},
        {k: 'std', label: 'Standard minutes', kind: 'int', w: 76},
        {k: 'act', label: 'Actual minutes', kind: 'int', w: 70},
        {k: 'jobs', label: 'Jobs per week', kind: 'int', w: 70, foot: 'sum'},
        {k: 'parts', label: 'Parts cost per job', kind: 'money', w: 76},
        {label: 'Efficiency', w: 70, v: function (D, i) { return U.fPct(D.std[i].eff); }},
        {label: 'Hours per week', w: 70, v: function (D, i) { return U.fDec1(D.std[i].hours); }, foot: function (D) { return U.fDec1(D.cWorkRaw); }},
        {label: 'Cost per job', w: 76, v: function (D, i) { return U.fMoney(D.std[i].cost, 2); }},
        {label: 'Cost per week', w: 80, v: function (D, i) { return U.fMoney(D.std[i].week, 0); }, foot: function (D) { return U.fMoney(D.sWeek, 0); }},
        {label: 'Status', w: 120, status: function (D, i) { return D.std[i].status; }}
      ]}
    ]},
    {id: 'pareto', title: 'Fault code Pareto', badge: function (D) { return D.fA ? D.fA + ' class A' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Faults logged', sub: 'Last 30 days', v: function (D, S) { return S.t.faults.length ? U.fInt(D.fTot) : ''; }},
        {label: 'Class A codes', sub: 'Make up 80% of faults', v: function (D, S) { return S.t.faults.length ? String(D.fA) : ''; }},
        {label: 'Top fault', sub: function (D) { return D.fTopShare != null ? U.fPct(D.fTopShare) + ' of all faults' : ''; }, v: function (D) { return D.fTop; }},
        {label: 'Repair hours', sub: 'All faults, last 30 days', v: function (D, S) { return S.t.faults.length ? U.fInt(D.fHours) : ''; }}
      ]},
      {type: 'table', k: 'faults', title: 'Fault codes', help: 'Use the shared fault code list so repair, parts and NPI count the same way. Counts are faults found in the last 30 days.', add: 'Add a fault code', cols: [
        {k: 'code', label: 'Code', kind: 'text', w: 76},
        {k: 'desc', label: 'Fault', kind: 'text', w: 210},
        {k: 'comp', label: 'Component', kind: 'text', w: 110},
        {k: 'n', label: 'Count', kind: 'int', w: 64, foot: 'sum'},
        {k: 'min', label: 'Minutes per fix', kind: 'int', w: 70},
        {label: 'Rank', w: 50, v: function (D, i) { return U.fInt(D.faults[i].rank); }},
        {label: 'Share', w: 60, v: function (D, i) { return U.fPct(D.faults[i].share); }},
        {label: 'Cumulative', w: 74, v: function (D, i) { return U.fPct(D.faults[i].cum); }},
        {label: 'Hours', w: 60, v: function (D, i) { return U.fInt(D.faults[i].hours); }},
        {label: 'Class', w: 64, status: function (D, i) { return D.faults[i].cls; }}
      ]},
      {type: 'charts', title: 'Pareto', charts: [
        {kind: 'bars', title: 'Faults by code', sub: 'Largest first, with share', data: function (D, S) { return {items: S.t.faults.map(function (r, i) { return {label: (r.code || '') + ' ' + (r.desc || ''), v: r.n}; }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); }), fmt: 'int', share: true}; }}
      ]}
    ]},
    {id: 'preventive', title: 'Preventive maintenance schedule', badge: function (D) { return D.pHours ? U.fInt(D.pHours) + ' h per week' : ''; }, sections: [
      {type: 'form', title: 'Fleet use', fields: [
        {k: 'kmDay', label: 'Average km per vehicle per day', kind: 'num', def: 9}
      ]},
      {type: 'tiles', items: [
        {label: 'Services per week', sub: 'All tasks', v: function (D, S) { return S.t.pm.length ? U.fInt(D.pServ) : ''; }},
        {label: 'Hours per week', sub: 'Add to the workshop load', v: function (D, S) { return S.t.pm.length ? U.fInt(D.pHours) : ''; }},
        {label: 'Share of capacity', sub: 'Against the capacity planner', v: function (D) { return U.fPct(D.pShare); }},
        {label: 'Cost per week', sub: 'Labor and parts', v: function (D, S) { return S.t.pm.length ? U.fMoney(D.pCost, 0) : ''; }}
      ]},
      {type: 'table', k: 'pm', title: 'Tasks', help: 'Set the interval from the maker\'s manual, then shorten it where your fault data says so.', add: 'Add a task', cols: [
        {k: 'task', label: 'Task', kind: 'text', w: 200},
        {k: 'model', label: 'Model', kind: 'text', w: 70},
        {k: 'veh', label: 'Vehicles', kind: 'int', w: 70},
        {k: 'km', label: 'Every km', kind: 'int', w: 70},
        {k: 'days', label: 'Or every days', kind: 'int', w: 70},
        {k: 'min', label: 'Minutes', kind: 'int', w: 60},
        {k: 'parts', label: 'Parts cost', kind: 'money', w: 70},
        {label: 'Due on', w: 64, v: function (D, i) { return D.pm[i].by; }, num: false},
        {label: 'Services per week', w: 76, v: function (D, i) { return U.fDec1(D.pm[i].serv); }},
        {label: 'Hours per week', w: 70, v: function (D, i) { return U.fDec1(D.pm[i].hours); }},
        {label: 'Cost per week', w: 80, v: function (D, i) { return U.fMoney(D.pm[i].cost, 0); }}
      ]}
    ]},
    {id: 'rework', title: 'Rework and repair quality log', badge: function (D) { return D.rLast ? U.fPct(D.rLast.rate) + ' rework' : ''; }, sections: [
      {type: 'form', title: 'Limits', fields: [
        {k: 'reworkMax', label: 'Rework limit', kind: 'pct', def: 4},
        {k: 'auditMin', label: 'Audit pass target', kind: 'pct', def: 95}
      ]},
      {type: 'tiles', items: [
        {label: 'Rework last week', sub: 'Back for the same fault within 7 days', v: function (D) { return D.rLast ? U.fPct(D.rLast.rate) : ''; }, bad: function (D, S) { return D.rLast && D.rLast.rate * 100 > U.n0(S.f.reworkMax); }},
        {label: 'Audit pass last week', sub: 'Random checks after repair', v: function (D) { return D.rLast ? U.fPct(D.rLast.audit) : ''; }},
        {label: 'Repairs, all weeks', sub: 'Completed', v: function (D, S) { return S.t.weeks.length ? U.fInt(D.rDone) : ''; }},
        {label: 'Rework, all weeks', sub: 'Average', v: function (D) { return U.fPct(D.rAvg); }}
      ]},
      {type: 'table', k: 'weeks', title: 'Weeks', help: 'Top cause is the fault code behind most rework that week.', add: 'Add a week', cols: [
        {k: 'week', label: 'Week starting', kind: 'date', w: 128},
        {k: 'done', label: 'Repairs done', kind: 'int', w: 70, foot: 'sum'},
        {k: 'back', label: 'Came back', kind: 'int', w: 70, foot: 'sum'},
        {k: 'audits', label: 'Audits', kind: 'int', w: 64},
        {k: 'passed', label: 'Audits passed', kind: 'int', w: 70},
        {k: 'cause', label: 'Top cause', kind: 'text', w: 200},
        {label: 'Rework', w: 64, v: function (D, i) { return U.fPct(D.weeks[i].rate); }},
        {label: 'Audit pass', w: 70, v: function (D, i) { return U.fPct(D.weeks[i].audit); }},
        {label: 'Status', w: 104, status: function (D, i) { return D.weeks[i].status; }}
      ]},
      {type: 'charts', title: 'Trend', charts: [
        {kind: 'line', title: 'Rework rate by week', sub: '% of repairs, with the limit', data: function (D, S) { return {pts: D.rOrder.map(function (i) { var w = S.t.weeks[i]; return {label: w.week ? U.fDate(U.toUTC(w.week)).replace(/ \d{4}$/, '') : 'Week', y: D.weeks[i].rate == null ? null : D.weeks[i].rate * 100}; }), refs: [{v: S.f.reworkMax, label: 'Limit'}], fmt: 'dec1', unit: '%'}; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Workshop load', v: function (D) { return D.cLoad == null ? 'No data' : {text: U.fPct(D.cLoad), tone: D.cLoad > 1 ? 'bad' : D.cLoad > 0.85 ? 'warn' : ''}; }},
    {label: 'Jobs per week', v: function (D) { return U.fInt(D.cJobs) || 'No data'; }},
    {label: 'Top fault', v: function (D) { return D.fTop || 'No data'; }},
    {label: 'Maintenance hours per week', v: function (D) { return U.fInt(D.pHours) || 'No data'; }},
    {label: 'Rework last week', v: function (D) { return D.rLast ? U.fPct(D.rLast.rate) : 'No data'; }}
  ],
  headline: function (D) {
    if (D.cLoad == null) return {unit: 'Fill in the workshop and labor standards'};
    return {num: U.fPct(D.cLoad), unit: 'of workshop capacity used', status: D.cStatus, note: U.fInt(D.cWork) + ' of ' + U.fInt(D.cCap) + ' hours a week'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleMobility'; S.biz.marketplace = 'Berlin workshop';
    var f = S.f; f.mech = 8; f.shifts = 2; f.hours = 8; f.days = 5; f.prod = 80; f.bays = 12; f.backlog = 260; f.rate = 34; f.kmDay = 9; f.reworkMax = 4; f.auditMin = 95;
    S.t.std = W.rows(['type', 'std', 'act', 'jobs', 'parts'], [
      ['Tire or inner tube change', 25, 28, 140, 9],
      ['Brake adjust or pads', 20, 21, 110, 6],
      ['Stem and folding joint', 35, 44, 60, 14],
      ['Controller swap', 30, 33, 38, 85],
      ['IoT module swap', 25, 26, 42, 60],
      ['Motor wheel swap', 45, 52, 26, 120],
      ['Lights and display', 20, 19, 70, 18],
      ['Diagnosis only, no fault found', 15, 18, 55, 0]
    ]);
    S.t.faults = W.rows(['code', 'desc', 'comp', 'n', 'min'], [
      ['F-101', 'Flat or worn tire', 'Wheel', 520, 25],
      ['F-205', 'Brake out of adjustment', 'Brake', 410, 20],
      ['F-310', 'Folding joint play', 'Stem', 230, 35],
      ['F-402', 'Light or display dead', 'Electrics', 260, 20],
      ['F-510', 'IoT no connection', 'IoT', 150, 25],
      ['F-520', 'Controller error', 'Controller', 140, 30],
      ['F-610', 'Motor noise or failure', 'Motor', 95, 45],
      ['F-701', 'Kickstand broken', 'Frame', 60, 15],
      ['F-801', 'QR code damaged', 'Labels', 45, 5]
    ]);
    S.t.pm = W.rows(['task', 'model', 'veh', 'km', 'days', 'min', 'parts'], [
      ['Safety check: brakes, tires, lights', 'S2', 2900, 500, 45, 12, 0],
      ['Folding joint and stem torque', 'S2', 2900, 1500, 90, 15, 2],
      ['Brake pads and cable', 'S2', 2900, 2500, 180, 20, 8],
      ['Safety check: brakes, tires, lights', 'S3', 600, 800, 45, 10, 0],
      ['Firmware and battery health read', 'S3', 600, 3000, 120, 8, 0]
    ]);
    var w = function (k) { return rel(W, -7 * k - ((new Date().getDay() + 6) % 7)); };
    S.t.weeks = W.rows(['week', 'done', 'back', 'audits', 'passed', 'cause'], [
      [w(5), 860, 30, 40, 38, 'F-310 Folding joint play'],
      [w(4), 880, 27, 40, 39, 'F-310 Folding joint play'],
      [w(3), 845, 36, 40, 37, 'F-205 Brake out of adjustment'],
      [w(2), 900, 41, 40, 36, 'F-205 Brake out of adjustment'],
      [w(1), 910, 33, 40, 39, 'F-101 Flat or worn tire']
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    D.std = S.t.std.map(function (r) {
      var mins = W.isNum(r.std) ? r.std : null;
      var hours = mins != null && W.isNum(r.jobs) ? mins * r.jobs / 60 : null;
      var eff = W.ratio(r.std, r.act);
      var cost = mins != null ? mins / 60 * n0(f.rate) + n0(r.parts) : null;
      return {eff: eff, hours: hours, cost: cost, week: cost != null && W.isNum(r.jobs) ? cost * r.jobs : null, status: eff == null ? '' : eff >= 0.95 ? 'Within standard' : eff >= 0.85 ? 'Slow' : 'Very slow'};
    });
    D.sSlow = D.std.filter(function (x) { return x.status === 'Slow' || x.status === 'Very slow'; }).length;
    D.sWeek = W.sum(D.std.map(function (x) { return x.week; }));
    D.cWorkRaw = W.sum(D.std.map(function (x) { return x.hours; }));
    D.cJobs = W.sum(S.t.std.map(function (r) { return r.jobs; }));

    var tdy = W.isoOf(today);
    D.pm = S.t.pm.map(function (r) {
      if (!W.isNum(r.veh) || !(r.km > 0 || r.days > 0)) return {};
      var perDayKm = r.km > 0 && f.kmDay > 0 ? f.kmDay / r.km : 0, perDayT = r.days > 0 ? 1 / r.days : 0;
      var serv = r.veh * Math.max(perDayKm, perDayT) * 7;
      var hours = serv * n0(r.min) / 60;
      return {serv: serv, hours: hours, cost: hours * n0(f.rate) + serv * n0(r.parts), by: perDayKm >= perDayT ? 'Distance' : 'Time'};
    });
    D.pServ = W.sum(D.pm.map(function (x) { return x.serv; }));
    D.pHours = W.sum(D.pm.map(function (x) { return x.hours; }));
    D.pCost = W.sum(D.pm.map(function (x) { return x.cost; }));

    D.cCap = W.isNum(f.mech) ? f.mech * n0(f.shifts) * n0(f.hours) * n0(f.days) * n0(f.prod) / 100 : null;
    D.cBay = W.isNum(f.bays) ? f.bays * n0(f.shifts) * n0(f.hours) * n0(f.days) : null;
    D.cWork = D.cWorkRaw + D.pHours;
    D.cLoad = D.cCap > 0 && D.cWork > 0 ? D.cWork / D.cCap : null;
    D.pShare = D.cCap > 0 && D.pHours > 0 ? D.pHours / D.cCap : null;
    var perMech = n0(f.shifts) * n0(f.hours) * n0(f.days) * n0(f.prod) / 100;
    D.cNeed = perMech > 0 && D.cWork > 0 ? D.cWork / perMech / 0.85 : null;
    D.cSpare = D.cCap != null ? D.cCap - D.cWork : null;
    var hoursPerJob = D.cJobs > 0 ? D.cWorkRaw / D.cJobs : null;
    D.cClear = D.cSpare > 0 && hoursPerJob && W.isNum(f.backlog) ? f.backlog * hoursPerJob / D.cSpare : null;
    D.cStatus = D.cLoad == null ? '' : D.cLoad > 1 ? 'Over capacity' : D.cLoad > 0.85 ? 'Near capacity' : 'Within capacity';
    if (D.cLoad != null) {
      var bayLoad = D.cBay > 0 ? D.cWork / D.cBay : null;
      D.cText = (D.cLoad > 1 ? 'The queue grows by about ' + U.fInt((D.cWork - D.cCap) / (hoursPerJob || 1)) + ' vehicles a week. Add mechanics or a shift before adding fleet.' : D.cLoad > 0.85 ? 'Little room for peaks. A busy week will build a queue.' : 'Room for peaks and for clearing the queue.') + (bayLoad != null && bayLoad > 0.9 ? ' Bays are the limit: ' + U.fPct(bayLoad) + ' of bay hours are used.' : '');
    }

    var tot = W.sum(S.t.faults.map(function (r) { return r.n; }));
    D.fTot = tot;
    var idx = S.t.faults.map(function (r, i) { return i; }).filter(function (i) { return W.isNum(S.t.faults[i].n); }).sort(function (a, b) { return S.t.faults[b].n - S.t.faults[a].n; });
    D.faults = S.t.faults.map(function (r) { return {hours: W.isNum(r.n) ? r.n * n0(r.min) / 60 : null}; });
    var cum = 0;
    idx.forEach(function (i, k) {
      var r = S.t.faults[i], prev = cum;
      cum += r.n;
      var x = D.faults[i]; x.rank = k + 1; x.share = tot ? r.n / tot : null; x.cum = tot ? cum / tot : null;
      x.cls = tot ? (prev / tot < 0.8 ? 'A' : prev / tot < 0.95 ? 'B' : 'C') : '';
    });
    D.fA = D.faults.filter(function (x) { return x.cls === 'A'; }).length;
    D.fTop = idx.length ? (S.t.faults[idx[0]].code || '') + ' ' + (S.t.faults[idx[0]].desc || '') : '';
    D.fTopShare = idx.length && tot ? S.t.faults[idx[0]].n / tot : null;
    D.fHours = W.sum(D.faults.map(function (x) { return x.hours; }));

    D.rOrder = S.t.weeks.map(function (w, i) { return i; }).sort(function (a, b) { return (S.t.weeks[a].week || '') < (S.t.weeks[b].week || '') ? -1 : 1; });
    D.weeks = S.t.weeks.map(function (w) {
      var rate = W.ratio(w.back, w.done), audit = W.ratio(w.passed, w.audits);
      var bad = (rate != null && rate * 100 > n0(f.reworkMax)) || (audit != null && audit * 100 < n0(f.auditMin));
      return {rate: rate, audit: audit, status: rate == null ? '' : bad ? 'Above limit' : 'On track'};
    });
    var li = D.rOrder.filter(function (i) { return D.weeks[i].rate != null; }).pop();
    D.rLast = li != null ? D.weeks[li] : null;
    D.rDone = W.sum(S.t.weeks.map(function (w) { return w.done; }));
    D.rAvg = D.rDone ? W.sum(S.t.weeks.map(function (w) { return w.back; })) / D.rDone : null;
    return D;
  }
};
})();
