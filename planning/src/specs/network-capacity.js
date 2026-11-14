(function () {
var U;
var TYPES = ['Fulfillment center', 'Sort center', 'Cross dock', 'Delivery depot', 'Store or pickup hub'];
var YRS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
function key(s) { return String(s || '').trim().toLowerCase(); }
window.SPEC = {
  app: 'plan-network-capacity',
  title: 'Network Capacity and Gap',
  desc: 'Set the usable and peak capacity of every node, find the year each region runs out of room, and check that planned flows fit the nodes they land on.',
  notice: 'Every tab is filled with sample data for a network of fulfillment centers, sort centers and depots. Type over it, or start blank.',
  headCap: 'First year short',
  tones: {good: ['Room'], warn: ['Tight'], bad: ['Short']},
  notes: [
    'Capacity is in thousands of units a week. Design capacity is units per hour times hours per day times days per week. Usable capacity applies the utilization ceiling, the share you can run before flow breaks down, often 85% to 90%. Peak capacity adds extra shifts or days in peak weeks.',
    'The gap check compares each region\'s peak-week demand with the peak capacity of one node type, plus committed additions from the year they land. Tight is above 90% of capacity, Short is above 100%. Run it once per node type: the network is only as big as its smallest layer.',
    'Flows: inbound to a node is the sum of all lanes that end there. Compare it with that node\'s peak capacity to see which nodes the flow plan overloads.'
  ],
  tabs: [
    {id: 'nodes', title: 'Node capacity', badge: function (D) { return D.nCount ? D.nCount + ' nodes' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Nodes', sub: 'All types', v: function (D) { return D.nCount ? String(D.nCount) : ''; }},
        {label: 'Usable capacity', sub: 'Thousands of units a week, all nodes', v: function (D) { return D.nCount ? U.fInt(D.nUsable) : ''; }},
        {label: 'Peak capacity', sub: 'Thousands of units a week, all nodes', v: function (D) { return D.nCount ? U.fInt(D.nPeak) : ''; }},
        {label: 'Peak uplift', sub: 'Peak over usable, all nodes', v: function (D) { return D.nUsable ? U.fPct(D.nPeak / D.nUsable - 1) : ''; }}
      ]},
      {type: 'table', k: 'nodes', title: 'Nodes', help: 'One row per building. Units per hour is the rate the building sustains, not the best hour.', add: 'Add a node', cols: [
        {k: 'node', label: 'Node', kind: 'text', w: 96},
        {k: 'type', label: 'Type', kind: 'sel', options: TYPES, w: 150},
        {k: 'region', label: 'Region', kind: 'text', w: 104},
        {k: 'uph', label: 'Units per hour', kind: 'int', w: 74},
        {k: 'hours', label: 'Hours per day', kind: 'num', w: 64},
        {k: 'days', label: 'Days per week', kind: 'num', w: 64},
        {k: 'util', label: 'Utilization ceiling %', kind: 'pct', w: 76},
        {k: 'uplift', label: 'Peak uplift %', kind: 'pct', w: 66},
        {label: 'Design', w: 64, v: function (D, i) { return U.fInt(D.nodes[i].design); }},
        {label: 'Usable', w: 64, v: function (D, i) { return U.fInt(D.nodes[i].usable); }, foot: function (D) { return U.fInt(D.nUsable); }},
        {label: 'Peak', w: 64, v: function (D, i) { return U.fInt(D.nodes[i].peak); }, foot: function (D) { return U.fInt(D.nPeak); }},
        {label: 'Inbound flow', w: 70, v: function (D, i) { return U.fInt(D.nodes[i].inbound); }},
        {label: 'Status', w: 72, status: function (D, i) { return D.nodes[i].status; }}
      ]},
      {type: 'charts', title: 'Capacity by layer', charts: [
        {kind: 'bars', title: 'Peak capacity by node type', sub: 'Thousands of units a week, with share', data: function (D) { return {items: TYPES.map(function (t) { return {label: t, v: D.byType[t] || null}; }).filter(function (x) { return x.v; }), fmt: 'int', share: true}; }}
      ]}
    ]},
    {id: 'gap', title: 'Gap by region and year', badge: function (D) { return D.gFirst ? 'short in ' + D.gFirst : ''; }, sections: [
      {type: 'form', title: 'Layer to check', fields: [
        {k: 'layer', label: 'Node type', kind: 'sel', options: TYPES, def: 'Sort center'},
        {k: 'y0', label: 'Base year', kind: 'sel', options: ['2024', '2025', '2026', '2027', '2028', '2029', '2030'], def: '2026', note: 'Year 1 is the year after'}
      ], stats: [
        {label: 'Capacity of this layer now', v: function (D) { return D.gRows ? U.fInt(D.gCapNow) + 'k a week' : ''; }},
        {label: 'Regions short by year 5', v: function (D) { return D.gRows ? {text: String(D.gShort), tone: D.gShort ? 'bad' : ''} : ''; }},
        {label: 'Extra capacity needed by year 5', v: function (D) { return D.gRows ? U.fInt(D.gNeed) + 'k a week' : ''; }}
      ]},
      {type: 'table', k: 'gap', title: 'Peak-week demand by region', help: 'Enter peak-week demand in thousands of units, from the Long-Range Demand Forecast. Added is capacity from projects already approved for this layer, with the year it lands.', add: 'Add a region', cols: [
        {k: 'region', label: 'Region', kind: 'text', w: 104},
        {k: 'd1', label: 'Year 1', kind: 'int', w: 62},
        {k: 'd2', label: 'Year 2', kind: 'int', w: 62},
        {k: 'd3', label: 'Year 3', kind: 'int', w: 62},
        {k: 'd4', label: 'Year 4', kind: 'int', w: 62},
        {k: 'd5', label: 'Year 5', kind: 'int', w: 62},
        {k: 'add', label: 'Added', kind: 'int', w: 62},
        {k: 'addY', label: 'Lands in', kind: 'sel', options: ['None'].concat(YRS), w: 88},
        {label: 'Capacity now', w: 70, v: function (D, i) { return U.fInt(D.gap[i].cap); }},
        {label: 'Use, year 1', w: 66, v: function (D, i) { return U.fPct(D.gap[i].u[0]); }},
        {label: 'Use, year 5', w: 66, v: function (D, i) { return U.fPct(D.gap[i].u[4]); }},
        {label: 'Short from', w: 70, v: function (D, i) { return D.gap[i].first; }, num: false},
        {label: 'Gap, year 5', w: 66, v: function (D, i) { var g = D.gap[i].gap5; return g == null ? '' : U.signed(U.fInt(g), g); }},
        {label: 'Status', w: 72, status: function (D, i) { return D.gap[i].status; }}
      ]},
      {type: 'charts', title: 'Use of capacity', charts: [
        {kind: 'line', title: 'Network use of this layer', sub: '% of peak capacity, all regions', data: function (D, S) { return {pts: D.gNet.map(function (v, i) { return {label: U.isNum((+S.f.y0)) ? String((+S.f.y0) + i + 1) : YRS[i], y: v == null ? null : v * 100}; }), refs: [{v: 100, label: 'Full'}, {v: 90, label: 'Tight'}], fmt: 'int', unit: '%'}; }},
        {kind: 'bars', title: 'Year 5 use by region', sub: '% of peak capacity', data: function (D, S) { return {items: S.t.gap.map(function (r, i) { return {label: r.region || 'Region ' + (i + 1), v: D.gap[i].u[4] == null ? null : D.gap[i].u[4] * 100}; }), fmt: 'int'}; }}
      ]}
    ]},
    {id: 'flows', title: 'Flow assignment', badge: function (D) { return D.fOver ? D.fOver + ' nodes over' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Lanes', sub: 'Origin to destination', v: function (D, S) { return S.t.lanes.length ? String(S.t.lanes.length) : ''; }},
        {label: 'Flow planned', sub: 'Thousands of units in a peak week', v: function (D, S) { return S.t.lanes.length ? U.fInt(D.fTot) : ''; }},
        {label: 'Nodes over capacity', sub: 'Inbound above peak capacity', v: function (D, S) { return S.t.lanes.length ? String(D.fOver) : ''; }, bad: function (D) { return D.fOver > 0; }},
        {label: 'Destinations not in the node list', sub: 'Check the names', v: function (D, S) { return S.t.lanes.length ? String(D.fMissing) : ''; }, bad: function (D) { return D.fMissing > 0; }}
      ]},
      {type: 'table', k: 'lanes', title: 'Lanes', help: 'Use the node names from the Node capacity tab, so inbound flow can be matched to capacity.', add: 'Add a lane', cols: [
        {k: 'from', label: 'Origin', kind: 'text', w: 120},
        {k: 'to', label: 'Destination', kind: 'text', w: 120},
        {k: 'vol', label: 'Peak week, thousands', kind: 'int', w: 90, foot: 'sum'},
        {k: 'mode', label: 'Mode', kind: 'sel', options: ['Line-haul truck', 'Shuttle', 'Rail', 'Air', 'Van'], w: 120},
        {label: 'Share of origin outbound', w: 100, v: function (D, i) { return U.fPct(D.lanes[i].share); }},
        {label: 'Destination inbound', w: 100, v: function (D, i) { return U.fInt(D.lanes[i].inb); }},
        {label: 'Destination peak capacity', w: 110, v: function (D, i) { return U.fInt(D.lanes[i].cap); }},
        {label: 'Destination use', w: 90, v: function (D, i) { return U.fPct(D.lanes[i].use); }},
        {label: 'Status', w: 90, status: function (D, i) { return D.lanes[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Peak capacity, all nodes', v: function (D) { return D.nCount ? U.fInt(D.nPeak) + 'k a week' : 'No data'; }},
    {label: 'Layer checked', v: function (D, S) { return S.f.layer || 'None'; }},
    {label: 'First year short', v: function (D) { return D.gFirst ? {text: D.gFirst, tone: 'warn'} : 'None'; }},
    {label: 'Regions short by year 5', v: function (D) { return {text: String(D.gShort), tone: D.gShort ? 'warn' : ''}; }},
    {label: 'Nodes over in the flow plan', v: function (D) { return {text: String(D.fOver), tone: D.fOver ? 'warn' : ''}; }}
  ],
  headline: function (D, S) {
    if (!D.gRows) return {unit: 'Add nodes and peak-week demand by region'};
    return {num: D.gFirst || 'None', unit: D.gFirst ? 'first year a region runs out of ' + String(S.f.layer).toLowerCase() + ' capacity' : 'no region runs out within five years', status: D.gShort ? 'Short' : 'Room', note: D.gShort + ' of ' + D.gRows + ' regions short by year 5'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleNetwork'; S.biz.marketplace = '2027 to 2031';
    S.f.layer = 'Sort center'; S.f.y0 = '2026';
    S.t.nodes = W.rows(['node', 'type', 'region', 'uph', 'hours', 'days', 'util', 'uplift'], [
      ['FC-N1', 'Fulfillment center', 'North', 9000, 20, 6, 88, 15],
      ['FC-W1', 'Fulfillment center', 'West', 14000, 20, 6, 88, 15],
      ['FC-S1', 'Fulfillment center', 'South', 11000, 20, 6, 88, 15],
      ['SC-N1', 'Sort center', 'North', 21000, 20, 6, 85, 20],
      ['SC-C1', 'Sort center', 'Capital region', 29500, 20, 6, 85, 20],
      ['SC-W1', 'Sort center', 'West', 38500, 20, 6, 85, 20],
      ['SC-S1', 'Sort center', 'South', 23700, 20, 6, 85, 20],
      ['SC-E1', 'Sort center', 'East', 15500, 20, 6, 85, 20],
      ['DD-C1', 'Delivery depot', 'Capital region', 12000, 10, 6, 90, 15],
      ['DD-C2', 'Delivery depot', 'Capital region', 11000, 10, 6, 90, 15]
    ]);
    S.t.gap = W.rows(['region', 'd1', 'd2', 'd3', 'd4', 'd5', 'add', 'addY'], [
      ['North', 2200, 2330, 2470, 2620, 2780, 0, 'None'],
      ['Capital region', 3160, 3880, 4490, 4890, 5330, 600, 'Year 3'],
      ['West', 3720, 3910, 4100, 4310, 4520, 0, 'None'],
      ['South', 2590, 2770, 3240, 3730, 4250, 800, 'Year 2'],
      ['East', 1440, 1600, 1770, 1970, 2190, 0, 'None']
    ]);
    S.t.lanes = W.rows(['from', 'to', 'vol', 'mode'], [
      ['FC-W1', 'SC-W1', 1500, 'Shuttle'], ['FC-W1', 'SC-C1', 620, 'Line-haul truck'], ['FC-W1', 'SC-N1', 210, 'Line-haul truck'],
      ['FC-N1', 'SC-N1', 1100, 'Shuttle'], ['FC-N1', 'SC-C1', 390, 'Line-haul truck'], ['FC-N1', 'SC-E1', 120, 'Line-haul truck'],
      ['FC-S1', 'SC-S1', 1250, 'Shuttle'], ['FC-S1', 'SC-C1', 280, 'Rail'], ['FC-S1', 'SC-E1', 160, 'Line-haul truck'],
      ['SC-C1', 'DD-C1', 760, 'Van'], ['SC-C1', 'DD-C2', 640, 'Van'], ['SC-W1', 'SC-E1', 260, 'Line-haul truck']
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    D.byType = {}; var byName = {}, regCap = {};
    D.nodes = S.t.nodes.map(function (n) {
      if (!W.isNum(n.uph)) return {status: ''};
      var design = n.uph * n0(n.hours) * n0(n.days) / 1000, usable = design * n0(n.util) / 100, peak = usable * (1 + n0(n.uplift) / 100);
      D.byType[n.type] = n0(D.byType[n.type]) + peak;
      byName[key(n.node)] = peak;
      if (n.type === f.layer) regCap[key(n.region)] = n0(regCap[key(n.region)]) + peak;
      return {design: design, usable: usable, peak: peak};
    });
    D.nCount = D.nodes.filter(function (x) { return x.peak != null; }).length;
    D.nUsable = W.sum(D.nodes.map(function (x) { return x.usable; }));
    D.nPeak = W.sum(D.nodes.map(function (x) { return x.peak; }));

    var inb = {}, outb = {};
    S.t.lanes.forEach(function (l) { inb[key(l.to)] = n0(inb[key(l.to)]) + n0(l.vol); outb[key(l.from)] = n0(outb[key(l.from)]) + n0(l.vol); });
    D.fOver = 0; D.fMissing = 0;
    var counted = {};
    D.lanes = S.t.lanes.map(function (l) {
      if (!W.isNum(l.vol)) return {status: ''};
      var k = key(l.to), cap = byName[k], use = cap > 0 ? inb[k] / cap : null;
      var status = cap == null ? 'Missing' : use > 1 ? 'Over limit' : use > 0.9 ? 'Tight' : 'OK';
      if (!counted[k]) { counted[k] = 1; if (cap == null) D.fMissing++; else if (use > 1) D.fOver++; }
      return {share: outb[key(l.from)] ? l.vol / outb[key(l.from)] : null, inb: inb[k], cap: cap, use: use, status: status};
    });
    D.fTot = W.sum(S.t.lanes.map(function (l) { return l.vol; }));
    S.t.nodes.forEach(function (n, i) {
      var k = key(n.node), x = D.nodes[i];
      if (x.peak == null) return;
      x.inbound = inb[k] != null ? inb[k] : null;
      x.status = x.inbound == null ? '' : x.inbound > x.peak ? 'Short' : x.inbound > 0.9 * x.peak ? 'Tight' : 'Room';
    });

    D.gShort = 0; D.gRows = 0; D.gNeed = 0; D.gCapNow = 0;
    var firstIdx = null, netDem = [0, 0, 0, 0, 0], netCap = [0, 0, 0, 0, 0];
    D.gap = S.t.gap.map(function (r) {
      var dem = [r.d1, r.d2, r.d3, r.d4, r.d5];
      if (!dem.some(W.isNum)) return {u: [], status: ''};
      D.gRows++;
      var cap = n0(regCap[key(r.region)]), ai = YRS.indexOf(r.addY);
      D.gCapNow += cap;
      var u = dem.map(function (d, i) {
        var c = cap + (ai >= 0 && i >= ai ? n0(r.add) : 0);
        netDem[i] += n0(d); netCap[i] += c;
        return W.isNum(d) && c > 0 ? d / c : W.isNum(d) && d > 0 ? Infinity : null;
      });
      var fi = u.findIndex(function (x) { return x != null && x > 1; });
      if (fi >= 0 && (firstIdx == null || fi < firstIdx)) firstIdx = fi;
      var c5 = cap + (ai >= 0 ? n0(r.add) : 0), gap5 = W.isNum(r.d5) ? c5 - r.d5 : null;
      if (gap5 != null && gap5 < 0) { D.gShort++; D.gNeed += -gap5; }
      var u5 = u[4];
      var yname = function (i) { return W.isNum((+f.y0)) ? String((+f.y0) + i + 1) : YRS[i]; };
      return {cap: cap || null, u: u.map(function (x) { return x === Infinity ? null : x; }), first: fi >= 0 ? yname(fi) : 'Not in plan', gap5: gap5, status: u5 == null ? '' : u5 > 1 ? 'Short' : u5 > 0.9 ? 'Tight' : 'Room'};
    });
    D.gFirst = firstIdx == null ? '' : W.isNum((+f.y0)) ? String((+f.y0) + firstIdx + 1) : YRS[firstIdx];
    D.gNet = netDem.map(function (d, i) { return D.gRows && netCap[i] > 0 ? d / netCap[i] : null; });
    return D;
  }
};
})();
