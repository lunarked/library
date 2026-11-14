(function () {
var U, M = window.MFG;
var STATIONS = ['SMT and reflow', 'Board test (ICT)', 'Final assembly', 'Acoustic test', 'Bluetooth and RF test', 'Water test', 'Pack out'];
window.SPEC = {
  app: 'mfg-production',
  title: 'Production Execution',
  desc: 'Track work orders and output per shift, measure first-pass and rolled yield by station, calculate OEE at the bottleneck, and log scrap and rework by cause.',
  notice: 'Every tab is filled with sample data for a portable speaker line. Type over it, or start blank.',
  headCap: 'Rolled throughput yield',
  tones: {good: ['Complete', 'World class', 'Above target'], warn: ['Behind plan', 'Typical', 'Below target'], bad: ['Low']},
  notes: [
    'First-pass yield is units passing a station the first time over units tested. Rolled throughput yield multiplies first-pass yield across all stations: the share of devices that go through the whole line without any rework.',
    'OEE is availability times performance times quality. Availability is run time over planned time; performance is ideal cycle time times units made over run time; quality is good units over units made. Around 85% is often called world class; 60% is typical.',
    'Scrap cost is units times unit cost. Rework cost is units times rework minutes times the labor rate.'
  ],
  tabs: [
    {id: 'orders', title: 'Work order tracker', badge: function (D) { return D.wBehind ? D.wBehind + ' behind' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Planned', sub: 'Open work orders', v: function (D, S) { return S.t.wo.length ? U.fInt(D.wPlan) : ''; }},
        {label: 'Built', sub: 'Good units', v: function (D, S) { return S.t.wo.length ? U.fInt(D.wBuilt) : ''; }},
        {label: 'Attainment', sub: 'Built over due to date', v: function (D) { return U.fPct(D.wAtt); }, bad: function (D) { return D.wAtt != null && D.wAtt < 0.95; }},
        {label: 'Behind plan', sub: 'Work orders', v: function (D, S) { return S.t.wo.length ? String(D.wBehind) : ''; }, bad: function (D) { return D.wBehind > 0; }}
      ]},
      {type: 'table', k: 'wo', title: 'Work orders', help: 'Due to date is the units the plan expected by now.', add: 'Add a work order', cols: [
        {k: 'wo', label: 'Work order', kind: 'text', w: 86},
        {k: 'product', label: 'Product', kind: 'text', w: 120},
        {k: 'start', label: 'Start', kind: 'date', w: 128},
        {k: 'due', label: 'Due', kind: 'date', w: 128},
        {k: 'qty', label: 'Quantity', kind: 'int', w: 70, foot: 'sum'},
        {k: 'toDate', label: 'Due to date', kind: 'int', w: 70},
        {k: 'built', label: 'Built', kind: 'int', w: 70, foot: 'sum'},
        {k: 'wip', label: 'In process', kind: 'int', w: 70, foot: 'sum'},
        {label: 'Attainment', w: 76, v: function (D, i) { return U.fPct(D.wo[i].att); }},
        {label: 'Left', w: 64, v: function (D, i) { return U.fInt(D.wo[i].left); }},
        {label: 'Status', w: 96, status: function (D, i) { return D.wo[i].status; }}
      ]}
    ]},
    {id: 'yield', title: 'Yield by station', badge: function (D) { return D.yRty != null ? U.fPct(D.yRty) + ' RTY' : ''; }, sections: [
      {type: 'form', title: 'Target', fields: [{k: 'fpyTarget', label: 'First-pass yield target', kind: 'pct', def: 98}]},
      {type: 'tiles', items: [
        {label: 'Rolled throughput yield', sub: 'All stations', v: function (D) { return U.fPct(D.yRty); }, bad: function (D) { return D.yRty != null && D.yRty < 0.9; }},
        {label: 'Lowest station', sub: function (D) { return D.yLowFpy != null ? U.fPct(D.yLowFpy) + ' first pass' : ''; }, v: function (D) { return D.yLow; }},
        {label: 'Units failing', sub: 'All stations, first pass', v: function (D) { return D.yRows ? U.fInt(D.yFail) : ''; }}
      ]},
      {type: 'table', k: 'st', title: 'Stations', help: 'Count the last week. Top failure uses the fault code list.', fixed: STATIONS, cols: [
        {fixedLabel: true, label: 'Station', w: 190, num: false},
        {k: 'tested', label: 'Units tested', kind: 'int', w: 90},
        {k: 'pass', label: 'Passed first time', kind: 'int', w: 90},
        {k: 'top', label: 'Top failure', kind: 'text', w: 230},
        {label: 'First-pass yield', w: 90, v: function (D, i) { return U.fPct(D.st[i].fpy); }},
        {label: 'Rolled to here', w: 90, v: function (D, i) { return U.fPct(D.st[i].rty); }},
        {label: 'Status', w: 100, status: function (D, i) { return D.st[i].status; }}
      ]},
      {type: 'charts', title: 'Yield', charts: [
        {kind: 'bars', title: 'Failures by station', sub: 'Units failing the first test, with share', data: function (D, S) { return {items: STATIONS.map(function (s, i) { var r = S.t.st[i]; return {label: s, v: U.isNum(r.tested) && U.isNum(r.pass) ? r.tested - r.pass : null}; }).filter(function (x) { return x.v; }), fmt: 'int', share: true}; }}
      ]}
    ]},
    {id: 'oee', title: 'OEE at the bottleneck', badge: function (D) { return D.oOee != null ? U.fPct(D.oOee) + ' OEE' : ''; }, sections: [
      {type: 'form', title: 'Station', fields: [
        {k: 'oStation', label: 'Bottleneck station', kind: 'text'},
        {k: 'ideal', label: 'Ideal cycle time, seconds', kind: 'num'}
      ]},
      {type: 'tiles', items: [
        {label: 'OEE', sub: 'All shifts', v: function (D) { return U.fPct(D.oOee); }},
        {label: 'Availability', sub: 'Run time over planned', v: function (D) { return U.fPct(D.oA); }},
        {label: 'Performance', sub: 'Ideal over actual speed', v: function (D) { return U.fPct(D.oP); }},
        {label: 'Quality', sub: 'Good over made', v: function (D) { return U.fPct(D.oQ); }}
      ]},
      {type: 'table', k: 'shifts', title: 'Shifts', help: 'Planned minutes exclude planned breaks. Downtime is every unplanned stop.', add: 'Add a shift', cols: [
        {k: 'date', label: 'Date', kind: 'date', w: 128},
        {k: 'shift', label: 'Shift', kind: 'sel', options: ['Early', 'Late', 'Night'], w: 80},
        {k: 'planned', label: 'Planned minutes', kind: 'int', w: 80},
        {k: 'down', label: 'Downtime minutes', kind: 'int', w: 80},
        {k: 'made', label: 'Units made', kind: 'int', w: 76},
        {k: 'good', label: 'Good units', kind: 'int', w: 76},
        {k: 'cause', label: 'Main stop', kind: 'text', w: 180},
        {label: 'Availability', w: 76, v: function (D, i) { return U.fPct(D.shifts[i].a); }},
        {label: 'Performance', w: 80, v: function (D, i) { return U.fPct(D.shifts[i].p); }},
        {label: 'Quality', w: 66, v: function (D, i) { return U.fPct(D.shifts[i].q); }},
        {label: 'OEE', w: 60, v: function (D, i) { return U.fPct(D.shifts[i].oee); }},
        {label: 'Status', w: 90, status: function (D, i) { return D.shifts[i].status; }}
      ]}
    ]},
    {id: 'scrap', title: 'Scrap and rework log', badge: function (D) { return D.xCost ? U.fMoney(D.xCost, 0) : ''; }, sections: [
      {type: 'form', title: 'Costs', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']},
        {k: 'rate', label: 'Labor cost per hour', kind: 'money'}
      ]},
      {type: 'tiles', items: [
        {label: 'Scrap cost', sub: 'All rows', v: function (D, S) { return S.t.scrap.length ? U.fMoney(D.xScrap, 0) : ''; }},
        {label: 'Rework cost', sub: 'All rows', v: function (D, S) { return S.t.scrap.length ? U.fMoney(D.xRework, 0) : ''; }},
        {label: 'Top cause', sub: function (D) { return D.xTopCost != null ? U.fMoney(D.xTopCost, 0) : ''; }, v: function (D) { return D.xTop; }}
      ]},
      {type: 'table', k: 'scrap', title: 'Log', help: 'One row per part and cause each week.', add: 'Add a row', cols: [
        {k: 'date', label: 'Week of', kind: 'date', w: 128},
        {k: 'part', label: 'Part or device', kind: 'text', w: 104},
        {k: 'cause', label: 'Cause', kind: 'sel', options: ['Supplier defect', 'Handling damage', 'Process fault', 'Test false fail', 'Design issue', 'Other'], w: 130},
        {k: 'scrapN', label: 'Scrapped', kind: 'int', w: 70},
        {k: 'unit', label: 'Unit cost', kind: 'num', w: 64},
        {k: 'rwN', label: 'Reworked', kind: 'int', w: 70},
        {k: 'rwMin', label: 'Rework minutes', kind: 'int', w: 70},
        {k: 'note', label: 'Notes', kind: 'text', w: 200},
        {label: 'Scrap cost', w: 76, v: function (D, i) { return U.fMoney(D.scrap[i].s, 0); }},
        {label: 'Rework cost', w: 76, v: function (D, i) { return U.fMoney(D.scrap[i].r, 0); }}
      ]},
      {type: 'charts', title: 'Causes', charts: [
        {kind: 'bars', title: 'Scrap and rework cost by cause', sub: 'With share', data: function (D) { return {items: D.xBy, fmt: 'money', share: true}; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Work order attainment', v: function (D) { return U.fPct(D.wAtt) || 'No data'; }},
    {label: 'Rolled throughput yield', v: function (D) { return U.fPct(D.yRty) || 'No data'; }},
    {label: 'Lowest yield station', v: function (D) { return D.yLow || 'No data'; }},
    {label: 'OEE at the bottleneck', v: function (D) { return U.fPct(D.oOee) || 'No data'; }},
    {label: 'Scrap and rework cost', v: function (D) { return U.fMoney(D.xCost, 0) || 'No data'; }}
  ],
  headline: function (D) {
    if (D.yRty == null) return {unit: 'Enter units tested and passed by station'};
    return {num: U.fPct(D.yRty), unit: 'of devices pass every station first time', status: D.yRty >= 0.9 ? 'Above target' : 'Below target', note: 'Lowest: ' + D.yLow + ', OEE ' + (U.fPct(D.oOee) || 'not set')};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExamplePlant'; S.biz.marketplace = 'Portable speaker S1';
    var r = function (n) { return M.rel(W, n); };
    S.t.wo = W.rows(['wo', 'product', 'start', 'due', 'qty', 'toDate', 'built', 'wip'], [
      ['WO-5501', 'Speaker S1 black', r(-12), r(-2), 2600, 2600, 2600, 0],
      ['WO-5502', 'Speaker S1 blue', r(-6), r(3), 2700, 1800, 1640, 180],
      ['WO-5503', 'Speaker S1 Mini', r(-3), r(5), 1400, 600, 610, 120],
      ['WO-5504', 'Speaker S1 black', r(1), r(9), 2800, 0, 0, 0]
    ]);
    S.f.fpyTarget = 98;
    var y = [[2700, 2668, 'Solder bridge on USB-C'], [2668, 2610, 'Charger chip open circuit'], [2640, 2596, 'Grille dent'], [2596, 2510, 'Woofer rub and buzz'], [2510, 2493, 'Pairing timeout'], [2493, 2440, 'Leak at USB-C seal'], [2440, 2436, 'Label missing']];
    S.t.st.forEach(function (row, i) { row.tested = y[i][0]; row.pass = y[i][1]; row.top = y[i][2]; });
    S.f.oStation = 'Acoustic test'; S.f.ideal = 25;
    S.t.shifts = W.rows(['date', 'shift', 'planned', 'down', 'made', 'good', 'cause'], [
      [r(-2), 'Early', 450, 35, 880, 852, 'Fixture change'], [r(-2), 'Late', 450, 60, 810, 778, 'Test PC restart'],
      [r(-1), 'Early', 450, 20, 930, 905, 'Material wait'], [r(-1), 'Late', 450, 45, 860, 829, 'Microphone calibration']
    ]);
    S.f.currency = '€'; S.f.rate = 32;
    S.t.scrap = W.rows(['date', 'part', 'cause', 'scrapN', 'unit', 'rwN', 'rwMin', 'note'], [
      [M.monday(W, -1), 'DRV-WOOF', 'Supplier defect', 46, 3.20, 40, 12, 'Rub and buzz, lot AP-2231'],
      [M.monday(W, -1), 'GRL-MESH', 'Handling damage', 38, 0.95, 0, 0, 'Dents from stacking trays'],
      [M.monday(W, -1), 'PCB-MAIN', 'Process fault', 12, 6.80, 46, 18, 'USB-C solder bridges'],
      [M.monday(W, -1), 'Speaker S1', 'Test false fail', 0, 0, 55, 6, 'Retest after fixture check'],
      [M.monday(W, -1), 'GSK-SEAL', 'Design issue', 0, 0.18, 53, 9, 'Seal seats badly, change EC-041']
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    var due = 0;
    D.wBehind = 0; D.wPlan = 0; D.wBuilt = 0;
    D.wo = S.t.wo.map(function (w) {
      if (!W.isNum(w.qty)) return {status: ''};
      D.wPlan += w.qty; D.wBuilt += n0(w.built); due += n0(w.toDate);
      var att = w.toDate > 0 ? n0(w.built) / w.toDate : null, left = Math.max(0, w.qty - n0(w.built));
      var status = !left ? 'Complete' : att != null && att < 0.95 ? 'Behind plan' : w.toDate > 0 ? 'On track' : 'Open';
      if (status === 'Behind plan') D.wBehind++;
      return {att: att, left: left, status: status};
    });
    D.wAtt = due > 0 ? D.wBuilt / due : null;

    var roll = 1, any = false, t = n0(f.fpyTarget) / 100;
    D.yLow = ''; D.yLowFpy = null; D.yFail = 0; D.yRows = 0;
    D.st = S.t.st.map(function (r, i) {
      var fpy = W.ratio(r.pass, r.tested);
      if (fpy == null) return {status: ''};
      any = true; D.yRows++; roll *= fpy; D.yFail += r.tested - r.pass;
      if (D.yLowFpy == null || fpy < D.yLowFpy) { D.yLowFpy = fpy; D.yLow = STATIONS[i]; }
      return {fpy: fpy, rty: roll, status: fpy >= t ? 'Above target' : 'Below target'};
    });
    D.yRty = any ? roll : null;

    var ideal = n0(f.ideal) / 60, P = 0, R = 0, MD = 0, G = 0;
    D.shifts = S.t.shifts.map(function (s) {
      if (!(s.planned > 0) || !W.isNum(s.made)) return {status: ''};
      var run = s.planned - n0(s.down), a = run / s.planned, p = run > 0 && ideal ? ideal * s.made / run : null, q = s.made ? n0(s.good) / s.made : null;
      P += s.planned; R += run; MD += s.made; G += n0(s.good);
      var oee = p != null && q != null ? a * p * q : null;
      return {a: a, p: p, q: q, oee: oee, status: oee == null ? '' : oee >= 0.85 ? 'World class' : oee >= 0.6 ? 'Typical' : 'Low'};
    });
    D.oA = P ? R / P : null; D.oP = R && ideal ? ideal * MD / R : null; D.oQ = MD ? G / MD : null;
    D.oOee = D.oA != null && D.oP != null && D.oQ != null ? D.oA * D.oP * D.oQ : null;

    var by = {};
    D.xScrap = 0; D.xRework = 0;
    D.scrap = S.t.scrap.map(function (x) {
      var s = W.isNum(x.scrapN) ? x.scrapN * n0(x.unit) : null, r = W.isNum(x.rwN) ? x.rwN * n0(x.rwMin) / 60 * n0(f.rate) : null;
      if (s == null && r == null) return {};
      D.xScrap += n0(s); D.xRework += n0(r);
      by[x.cause] = n0(by[x.cause]) + n0(s) + n0(r);
      return {s: s, r: r};
    });
    D.xCost = D.xScrap + D.xRework;
    D.xBy = Object.keys(by).map(function (k) { return {label: k, v: by[k]}; }).sort(function (a, b) { return b.v - a.v; });
    D.xTop = D.xBy.length ? D.xBy[0].label : ''; D.xTopCost = D.xBy.length ? D.xBy[0].v : null;
    return D;
  }
};
})();
