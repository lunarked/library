(function () {
var U;
var TYPES = ['Rider fall', 'Collision with a person', 'Collision with a vehicle', 'Battery fire or smoke', 'Vehicle defect', 'Vandalism or tampering', 'Other'];
function rel(W, n) { var d = new Date(); return W.isoOf(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + n * W.DAY); }
window.SPEC = {
  app: 'esc-safety-compliance',
  title: 'Safety and Compliance',
  desc: 'Log incidents with root cause and authority reporting, run recalls and safety campaigns to the deadline, and keep type approvals, insurance and certificates valid.',
  notice: 'Every tab is filled with sample data for an operator in Germany and Austria. Type over it, or start blank.',
  headCap: 'Incidents per million rides',
  tones: {good: ['Complete'], warn: ['Report to city'], bad: ['Behind plan']},
  notes: [
    'Incident rate is incidents over rides in the same period, per million rides. Every Serious or Critical incident, and every battery fire, is reported to the city within the time the permit sets. A vehicle defect as root cause also goes to the OEM and to the Fault Code Pareto.',
    'Recall plan: vehicles left over working days left gives the vehicles a day the workshop must finish. Hours a day use the minutes per vehicle. Pull the affected vehicles from the street first if the defect can hurt a rider.',
    'In Germany, e-scooters need a general type approval (ABE) under the eKFV and an insurance plate. The insurance year runs from 1 March to the end of February, so plates for the whole fleet expire on the same day.',
    'Other usual certificates: EN 17128 for light electric vehicles, UN 38.3 test summary for lithium batteries in transport, and the CE declaration for the vehicle and its radio module.'
  ],
  tabs: [
    {id: 'incidents', title: 'Incident log', badge: function (D) { return D.iOpen ? D.iOpen + ' open' : ''; }, sections: [
      {type: 'form', title: 'Rides in the period', fields: [
        {k: 'rides', label: 'Rides in the period logged', kind: 'int'},
        {k: 'limit', label: 'Rate limit per million rides', kind: 'num', def: 10}
      ]},
      {type: 'tiles', items: [
        {label: 'Incidents', sub: 'All rows', v: function (D, S) { return S.t.inc.length ? U.fInt(S.t.inc.length) : ''; }},
        {label: 'Per million rides', sub: 'All incidents', v: function (D) { return U.fDec1(D.iRate); }, bad: function (D, S) { return D.iRate != null && D.iRate > U.n0(S.f.limit); }},
        {label: 'Serious or critical', sub: 'All rows', v: function (D, S) { return S.t.inc.length ? String(D.iSerious) : ''; }},
        {label: 'Not yet reported to city', sub: 'Serious, critical or battery fire', v: function (D, S) { return S.t.inc.length ? String(D.iUnreported) : ''; }, bad: function (D) { return D.iUnreported > 0; }}
      ]},
      {type: 'table', k: 'inc', title: 'Incidents', help: 'One row per incident. Keep personal data out of this log; use the case number to find it in the claims system.', add: 'Add an incident', cols: [
        {k: 'date', label: 'Date', kind: 'date', w: 128},
        {k: 'city', label: 'City', kind: 'text', w: 86},
        {k: 'type', label: 'Type', kind: 'sel', options: TYPES, w: 170},
        {k: 'sev', label: 'Severity', kind: 'sel', options: ['Minor', 'Serious', 'Critical'], w: 90},
        {k: 'veh', label: 'Vehicle', kind: 'text', w: 86},
        {k: 'cause', label: 'Root cause', kind: 'sel', options: ['Open', 'Rider', 'Vehicle defect', 'Road or weather', 'Third party'], w: 120},
        {k: 'rep', label: 'Reported to city', kind: 'sel', options: ['No', 'Yes', 'Not needed'], w: 96},
        {k: 'closed', label: 'Closed', kind: 'date', w: 128},
        {label: 'Days open', w: 56, v: function (D, i) { return U.fInt(D.inc[i].days); }},
        {label: 'Status', w: 104, status: function (D, i) { return D.inc[i].status; }}
      ]},
      {type: 'charts', title: 'Pattern', charts: [
        {kind: 'bars', title: 'Incidents by type', sub: 'All rows, with share', data: function (D) { return {items: D.iByType, fmt: 'int', share: true}; }}
      ]}
    ]},
    {id: 'recalls', title: 'Recall and safety campaign tracker', badge: function (D) { return D.rBehind ? D.rBehind + ' behind plan' : ''; }, sections: [
      {type: 'form', title: 'Workshop days', fields: [
        {k: 'wdays', label: 'Working days per week', kind: 'int', def: 6}
      ]},
      {type: 'tiles', items: [
        {label: 'Vehicles left to fix', sub: 'All open campaigns', v: function (D, S) { return S.t.camp.length ? U.fInt(D.rLeft) : ''; }},
        {label: 'Workshop hours left', sub: 'All open campaigns', v: function (D, S) { return S.t.camp.length ? U.fInt(D.rHours) : ''; }},
        {label: 'Hours a day needed', sub: 'To meet every deadline', v: function (D) { return U.fDec1(D.rDay); }},
        {label: 'Behind plan', sub: 'Done share below time used', v: function (D, S) { return S.t.camp.length ? String(D.rBehind) : ''; }, bad: function (D) { return D.rBehind > 0; }}
      ]},
      {type: 'table', k: 'camp', title: 'Campaigns', help: 'One row per recall, OEM service bulletin or own safety campaign.', add: 'Add a campaign', cols: [
        {k: 'name', label: 'Campaign', kind: 'text', w: 210},
        {k: 'model', label: 'Model', kind: 'text', w: 64},
        {k: 'src', label: 'Source', kind: 'sel', options: ['OEM recall', 'Service bulletin', 'Own campaign', 'Authority order'], w: 130},
        {k: 'n', label: 'Vehicles affected', kind: 'int', w: 70},
        {k: 'done', label: 'Done', kind: 'int', w: 64},
        {k: 'start', label: 'Start', kind: 'date', w: 128},
        {k: 'due', label: 'Deadline', kind: 'date', w: 128},
        {k: 'min', label: 'Minutes per vehicle', kind: 'int', w: 70},
        {label: 'Done share', w: 64, v: function (D, i) { return U.fPct(D.camp[i].share); }},
        {label: 'Per day needed', w: 70, v: function (D, i) { return U.fInt(D.camp[i].perDay); }},
        {label: 'Status', w: 100, status: function (D, i) { return D.camp[i].status; }}
      ]}
    ]},
    {id: 'certificates', title: 'Type approval and certification register', badge: function (D) { return D.cAlert ? D.cAlert + ' to act on' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Valid', sub: 'More than 90 days left', v: function (D, S) { return S.t.cert.length ? String(D.cValid) : ''; }},
        {label: 'Expiring in 90 days', sub: 'Start renewal now', v: function (D, S) { return S.t.cert.length ? String(D.cSoon) : ''; }, bad: function (D) { return D.cSoon > 0; }},
        {label: 'Expired or missing', sub: 'Vehicles may not run', v: function (D, S) { return S.t.cert.length ? String(D.cBad) : ''; }, bad: function (D) { return D.cBad > 0; }},
        {label: 'Next expiry', sub: function (D) { return D.cNextItem || ''; }, v: function (D) { return D.cNext != null ? U.fDate(D.cNext) : ''; }}
      ]},
      {type: 'table', k: 'cert', title: 'Certificates and approvals', help: 'One row per document, model and country. Leave Expires empty for documents without an end date, and write None in Number when it is still missing.', add: 'Add a document', cols: [
        {k: 'item', label: 'Document', kind: 'text', w: 230},
        {k: 'model', label: 'Model', kind: 'text', w: 64},
        {k: 'country', label: 'Country', kind: 'text', w: 86},
        {k: 'num', label: 'Number', kind: 'text', w: 120},
        {k: 'exp', label: 'Expires', kind: 'date', w: 128},
        {k: 'owner', label: 'Owner', kind: 'text', w: 96},
        {k: 'lead', label: 'Renewal lead time, days', kind: 'int', w: 80},
        {label: 'Days left', w: 60, v: function (D, i) { return U.fInt(D.cert[i].left); }},
        {label: 'Start renewal by', w: 100, v: function (D, i) { return D.cert[i].startBy; }, num: false},
        {label: 'Status', w: 104, status: function (D, i) { return D.cert[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Incidents per million rides', v: function (D) { return U.fDec1(D.iRate) || 'No data'; }},
    {label: 'Not reported to city', v: function (D) { return {text: String(D.iUnreported), tone: D.iUnreported ? 'bad' : ''}; }},
    {label: 'Recall vehicles left', v: function (D) { return U.fInt(D.rLeft); }},
    {label: 'Campaigns behind plan', v: function (D) { return {text: String(D.rBehind), tone: D.rBehind ? 'warn' : ''}; }},
    {label: 'Documents to act on', v: function (D) { return {text: String(D.cAlert), tone: D.cAlert ? 'warn' : ''}; }}
  ],
  headline: function (D, S) {
    if (D.iRate == null) return {unit: 'Log incidents and the rides in the period'};
    return {num: U.fDec1(D.iRate), unit: 'incidents per million rides', status: D.iRate > U.n0(S.f.limit) ? 'Over limit' : 'OK', note: D.iSerious + ' serious or critical, ' + D.iUnreported + ' not yet reported'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleMobility'; S.biz.marketplace = 'Germany and Austria';
    S.f.rides = 2550000; S.f.limit = 10; S.f.wdays = 6;
    S.t.inc = W.rows(['date', 'city', 'type', 'sev', 'veh', 'cause', 'rep', 'closed'], [
      [rel(W, -26), 'Berlin', 'Rider fall', 'Minor', 'BER-1022', 'Road or weather', 'Not needed', rel(W, -20)],
      [rel(W, -21), 'Berlin', 'Collision with a person', 'Serious', 'BER-2310', 'Rider', 'Yes', rel(W, -6)],
      [rel(W, -17), 'Hamburg', 'Vehicle defect', 'Minor', 'HAM-0871', 'Vehicle defect', 'Not needed', rel(W, -12)],
      [rel(W, -12), 'Munich', 'Battery fire or smoke', 'Serious', 'MUC-0304', 'Open', 'Yes', ''],
      [rel(W, -9), 'Berlin', 'Rider fall', 'Minor', 'BER-3302', 'Rider', 'Not needed', rel(W, -8)],
      [rel(W, -6), 'Cologne', 'Vehicle defect', 'Serious', 'KOE-0230', 'Vehicle defect', 'No', ''],
      [rel(W, -3), 'Vienna', 'Collision with a vehicle', 'Minor', 'VIE-0712', 'Third party', 'Not needed', ''],
      [rel(W, -2), 'Berlin', 'Vandalism or tampering', 'Minor', 'BER-0099', 'Third party', 'Not needed', rel(W, -1)]
    ]);
    S.t.camp = W.rows(['name', 'model', 'src', 'n', 'done', 'start', 'due', 'min'], [
      ['Folding latch reinforcement', 'S2', 'OEM recall', 1500, 1180, rel(W, -40), rel(W, 20), 25],
      ['Brake lever bolt torque check', 'S2', 'Own campaign', 6800, 2100, rel(W, -20), rel(W, 25), 6],
      ['Controller firmware 2.4.1', 'S3', 'Service bulletin', 1100, 1100, rel(W, -30), rel(W, -5), 4],
      ['Rear fender clip', 'S3', 'Service bulletin', 1100, 260, rel(W, -10), rel(W, 50), 10]
    ]);
    S.t.cert = W.rows(['item', 'model', 'country', 'num', 'exp', 'owner', 'lead'], [
      ['General type approval (ABE), eKFV', 'S2', 'Germany', 'KBA ABE 1234', '', 'Compliance', 90],
      ['General type approval (ABE), eKFV', 'S3', 'Germany', 'KBA ABE 5678', '', 'Compliance', 90],
      ['Insurance plates, whole fleet', 'All', 'Germany', 'Policy 88-2026', W.isoOf(Date.UTC(new Date().getFullYear() + (new Date().getMonth() >= 2 ? 1 : 0), 2, 1) - W.DAY), 'Finance', 60],
      ['Third-party liability insurance', 'All', 'Austria', 'Policy AT-4411', rel(W, 240), 'Finance', 45],
      ['EN 17128 test report', 'S3', 'EU', 'TR-17128-S3', rel(W, 700), 'Engineering', 120],
      ['UN 38.3 test summary, battery pack', 'S3', 'Global', 'UN383-CP-22', rel(W, 70), 'Logistics', 60],
      ['City operator permit, Munich', 'All', 'Germany', 'MUC-2025-17', rel(W, 52), 'City ops', 90],
      ['CE declaration, radio module', 'S3', 'EU', 'None', '', 'Engineering', 30]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {}, tdy = W.isoOf(today);
    D.iOpen = 0; D.iSerious = 0; D.iUnreported = 0;
    var by = {};
    D.inc = S.t.inc.map(function (r) {
      if (!r.date) return {status: ''};
      var serious = r.sev === 'Serious' || r.sev === 'Critical' || r.type === 'Battery fire or smoke';
      if (r.sev !== 'Minor') D.iSerious++;
      var unrep = serious && r.rep !== 'Yes';
      if (unrep) D.iUnreported++;
      if (!r.closed) D.iOpen++;
      by[r.type] = n0(by[r.type]) + 1;
      return {days: W.days(r.date, r.closed || tdy), status: unrep ? 'Report to city' : r.closed ? 'Closed' : 'Open'};
    });
    D.iRate = S.t.inc.length && f.rides > 0 ? S.t.inc.length / f.rides * 1e6 : null;
    D.iByType = Object.keys(by).map(function (k) { return {label: k, v: by[k]}; }).sort(function (a, b) { return b.v - a.v; });

    var wd = f.wdays > 0 ? Math.min(7, f.wdays) : 6;
    D.rLeft = 0; D.rHours = 0; D.rBehind = 0; D.rDay = 0;
    D.camp = S.t.camp.map(function (c) {
      if (!(c.n > 0)) return {status: ''};
      var left = Math.max(0, c.n - n0(c.done)), share = n0(c.done) / c.n;
      if (!left) return {share: share, perDay: 0, status: 'Complete'};
      var daysLeft = c.due ? W.days(tdy, c.due) : null;
      var work = daysLeft != null ? Math.max(1, daysLeft * wd / 7) : null;
      var perDay = work != null ? left / work : null;
      var used = c.start && c.due ? W.days(c.start, tdy) / Math.max(1, W.days(c.start, c.due)) : null;
      D.rLeft += left; D.rHours += left * n0(c.min) / 60;
      if (perDay != null) D.rDay += perDay * n0(c.min) / 60;
      var status = daysLeft != null && daysLeft < 0 ? 'Overdue' : used != null && share < used - 0.05 ? 'Behind plan' : 'On track';
      if (status === 'Behind plan' || status === 'Overdue') D.rBehind++;
      return {share: share, perDay: perDay, status: status};
    });

    D.cValid = 0; D.cSoon = 0; D.cBad = 0; D.cNext = null; D.cNextItem = '';
    D.cert = S.t.cert.map(function (c) {
      if (!c.item) return {status: ''};
      var missing = !c.num || /^none$/i.test(String(c.num).trim());
      var left = c.exp ? W.days(tdy, c.exp) : null;
      var startBy = c.exp && W.isNum(c.lead) ? U.fDate(U.toUTC(c.exp) - c.lead * W.DAY) : '';
      var soon = left != null && (left <= 90 || (W.isNum(c.lead) && left <= c.lead));
      var status = missing ? 'Missing' : left != null && left < 0 ? 'Expired' : soon ? 'Expiring soon' : 'Valid';
      if (status === 'Valid') D.cValid++; else if (status === 'Expiring soon') D.cSoon++; else D.cBad++;
      if (c.exp && !missing && left >= 0) { var t = U.toUTC(c.exp); if (D.cNext == null || t < D.cNext) { D.cNext = t; D.cNextItem = c.item + (c.country ? ', ' + c.country : ''); } }
      return {left: left, startBy: startBy, status: status};
    });
    D.cAlert = D.cSoon + D.cBad;
    return D;
  }
};
})();
