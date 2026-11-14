(function () {
var U;
var LAYERS = ['Fulfillment center', 'Sort center', 'Cross dock', 'Middle-mile transport', 'Delivery depot', 'Last-mile delivery'];
var YRS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
function npv(rate, cfs) { return cfs.reduce(function (s, c, t) { return s + c / Math.pow(1 + rate, t); }, 0); }
function irr(cfs) {
  var lo = -0.99, hi = 1, flo = npv(lo, cfs), fhi = npv(hi, cfs);
  if (!(flo * fhi < 0)) return null;
  for (var i = 0; i < 80; i++) { var mid = (lo + hi) / 2, fm = npv(mid, cfs); if (fm * flo > 0) { lo = mid; flo = fm; } else { hi = mid; } }
  return (lo + hi) / 2;
}
window.SPEC = {
  app: 'plan-cost-capex',
  title: 'Cost and Capex Model',
  desc: 'Break cost per unit down by network layer, rank capital projects by payback, NPV and IRR, and tie the operations plan to the finance plan year by year.',
  notice: 'Every tab is filled with sample data for a parcel network. Type over it, or start blank.',
  headCap: 'Network cost per unit',
  tones: {good: ['Approve', 'Matched'], warn: ['Review'], bad: ['Reject', 'Gap']},
  notes: [
    'Cost per unit is weekly cost over weekly units for each layer. A unit passes through several layers, so the network cost per unit is the sum of the layers, each weighted by the share of units that pass through it.',
    'Projects: cash flow in year 0 is minus the capex; each later year is the yearly benefit less added running cost. NPV discounts them at the hurdle rate. Approve when NPV is positive and payback is within the payback limit; Review when only one holds.',
    'Tie-out: operations and finance should plan on the same volume. A difference above the tolerance is a Gap to close before the plan is signed.'
  ],
  tabs: [
    {id: 'layers', title: 'Cost per unit by layer', badge: function (D) { return D.lCpu != null ? U.fMoney(D.lCpu, 2) + ' a unit' : ''; }, sections: [
      {type: 'form', title: 'Currency', fields: [{k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']}]},
      {type: 'tiles', items: [
        {label: 'Network cost per unit', sub: 'All layers, weighted by units passing through', v: function (D) { return U.fMoney(D.lCpu, 2); }},
        {label: 'Cost per week', sub: 'All layers', v: function (D, S) { return S.t.layers.some(function (r) { return U.isNum(r.units); }) ? U.fMoney(D.lWeek, 0) : ''; }},
        {label: 'Largest layer', sub: function (D) { return D.lTopShare != null ? U.fPct(D.lTopShare) + ' of cost per unit' : ''; }, v: function (D) { return D.lTop; }},
        {label: 'Labor share', sub: 'Of all cost', v: function (D) { return U.fPct(D.lLabor); }}
      ]},
      {type: 'table', k: 'layers', title: 'Layers', help: 'Weekly cost in an average week. Share of units is the share of all units that pass through the layer.', fixed: LAYERS, cols: [
        {fixedLabel: true, label: 'Layer', w: 170, num: false},
        {k: 'units', label: 'Units per week', kind: 'int', w: 90},
        {k: 'share', label: 'Share of units %', kind: 'pct', w: 76},
        {k: 'labor', label: 'Labor', kind: 'money', w: 86},
        {k: 'site', label: 'Building and equipment', kind: 'money', w: 90},
        {k: 'trans', label: 'Transport', kind: 'money', w: 86},
        {k: 'other', label: 'Other', kind: 'money', w: 80},
        {label: 'Cost per week', w: 90, v: function (D, i) { return U.fMoney(D.layers[i].week, 0); }, foot: function (D) { return U.fMoney(D.lWeek, 0); }},
        {label: 'Cost per unit', w: 76, v: function (D, i) { return U.fMoney(D.layers[i].cpu, 2); }},
        {label: 'Weighted', w: 76, v: function (D, i) { return U.fMoney(D.layers[i].w, 2); }, foot: function (D) { return U.fMoney(D.lCpu, 2); }}
      ]},
      {type: 'charts', title: 'Where the cost sits', charts: [
        {kind: 'bars', title: 'Weighted cost per unit by layer', sub: 'With share of the network cost per unit', data: function (D) { return {items: LAYERS.map(function (l, i) { return {label: l, v: D.layers[i].w}; }), fmt: 'money2', share: true}; }}
      ]}
    ]},
    {id: 'projects', title: 'Capex projects', badge: function (D) { return D.pApprove ? D.pApprove + ' to approve' : ''; }, sections: [
      {type: 'form', title: 'Rules', fields: [
        {k: 'hurdle', label: 'Hurdle rate', kind: 'pct', def: 9},
        {k: 'pbMax', label: 'Payback limit, years', kind: 'num', def: 4}
      ]},
      {type: 'tiles', items: [
        {label: 'Approve', sub: 'Positive NPV and within the payback limit', v: function (D, S) { return S.t.proj.length ? String(D.pApprove) : ''; }},
        {label: 'Capex to approve', sub: 'Projects marked Approve', v: function (D, S) { return S.t.proj.length ? U.fMoney(D.pCapex, 0) : ''; }},
        {label: 'NPV of approved', sub: 'At the hurdle rate', v: function (D, S) { return S.t.proj.length ? U.fMoney(D.pNpv, 0) : ''; }},
        {label: 'Reject', sub: 'Negative NPV and slow payback', v: function (D, S) { return S.t.proj.length ? String(D.pReject) : ''; }}
      ]},
      {type: 'table', k: 'proj', title: 'Projects', help: 'Benefit is the yearly saving or extra contribution at full run; Ramp years spread it in evenly. Added cost is yearly running cost the project brings.', add: 'Add a project', cols: [
        {k: 'name', label: 'Project', kind: 'text', w: 170},
        {k: 'capex', label: 'Capex', kind: 'money', w: 90},
        {k: 'benefit', label: 'Benefit a year', kind: 'money', w: 90},
        {k: 'opex', label: 'Added cost a year', kind: 'money', w: 90},
        {k: 'ramp', label: 'Ramp years', kind: 'int', w: 60},
        {k: 'life', label: 'Life, years', kind: 'int', w: 60},
        {label: 'Payback, years', w: 70, v: function (D, i) { return U.fDec1(D.proj[i].pb); }},
        {label: 'NPV', w: 90, v: function (D, i) { return U.fMoney(D.proj[i].npv, 0); }, tone: function (D, i) { return D.proj[i].npv < 0 ? 'bad' : ''; }},
        {label: 'IRR', w: 60, v: function (D, i) { return U.fPct(D.proj[i].irr); }},
        {label: 'NPV per capex', w: 70, v: function (D, i) { return U.fDec2(D.proj[i].pi); }},
        {label: 'Result', w: 80, status: function (D, i) { return D.proj[i].status; }}
      ]},
      {type: 'charts', title: 'Ranking', charts: [
        {kind: 'bars', title: 'NPV by project', sub: 'Projects with a positive NPV, at the hurdle rate', data: function (D, S) { return {items: S.t.proj.map(function (p, i) { return {label: p.name || 'Project ' + (i + 1), v: D.proj[i].npv > 0 ? D.proj[i].npv : null}; }).filter(function (x) { return x.v != null; }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); }), fmt: 'money'}; }}
      ]}
    ]},
    {id: 'tieout', title: 'Operations and finance tie-out', badge: function (D) { return D.tGaps ? D.tGaps + ' gaps' : ''; }, sections: [
      {type: 'form', title: 'Tolerance', fields: [
        {k: 'tol', label: 'Allowed difference', kind: 'pct', def: 2},
        {k: 'y0', label: 'Base year', kind: 'sel', options: ['2024', '2025', '2026', '2027', '2028', '2029', '2030'], def: '2026'}
      ]},
      {type: 'tiles', items: [
        {label: 'Years matched', sub: 'Volume and cost within tolerance', v: function (D) { return D.tRows ? D.tMatched + ' of ' + D.tRows : ''; }},
        {label: 'Largest volume gap', sub: function (D) { return D.tVolYear || ''; }, v: function (D) { return D.tVolMax == null ? '' : U.signed(U.fPct(D.tVolMax), D.tVolMax); }, bad: function (D, S) { return D.tVolMax != null && Math.abs(D.tVolMax) * 100 > U.n0(S.f.tol); }},
        {label: 'Largest cost gap', sub: function (D) { return D.tCostYear || ''; }, v: function (D) { return D.tCostMax == null ? '' : U.signed(U.fPct(D.tCostMax), D.tCostMax); }, bad: function (D, S) { return D.tCostMax != null && Math.abs(D.tCostMax) * 100 > U.n0(S.f.tol); }}
      ]},
      {type: 'table', k: 'tie', title: 'Plan years', help: 'Volume in millions of units, cost in millions. Operations numbers come from the network plan; finance numbers from the budget.', fixed: YRS, cols: [
        {fixedLabel: true, label: 'Year', w: 80, num: false},
        {label: 'Calendar year', w: 76, v: function (D, i, S) { return U.isNum((+S.f.y0)) ? String((+S.f.y0) + i + 1) : ''; }, num: false},
        {k: 'oVol', label: 'Operations volume', kind: 'num', w: 90},
        {k: 'fVol', label: 'Finance volume', kind: 'num', w: 90},
        {k: 'oCost', label: 'Operations cost', kind: 'num', w: 90},
        {k: 'fCost', label: 'Finance budget', kind: 'num', w: 90},
        {label: 'Volume gap', w: 80, v: function (D, i) { var g = D.tie[i].vg; return g == null ? '' : U.signed(U.fPct(g), g); }},
        {label: 'Cost gap', w: 80, v: function (D, i) { var g = D.tie[i].cg; return g == null ? '' : U.signed(U.fPct(g), g); }},
        {label: 'Cost per unit, ops', w: 90, v: function (D, i) { return U.fMoney(D.tie[i].cpu, 2); }},
        {k: 'note', label: 'Reason for the gap', kind: 'text', w: 220},
        {label: 'Status', w: 80, status: function (D, i) { return D.tie[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Network cost per unit', v: function (D) { return U.fMoney(D.lCpu, 2) || 'No data'; }},
    {label: 'Largest cost layer', v: function (D) { return D.lTop || 'No data'; }},
    {label: 'Projects to approve', v: function (D) { return String(D.pApprove); }},
    {label: 'NPV of approved projects', v: function (D) { return U.fMoney(D.pNpv, 0) || 'No data'; }},
    {label: 'Ops and finance gaps', v: function (D) { return {text: String(D.tGaps), tone: D.tGaps ? 'warn' : ''}; }}
  ],
  headline: function (D) {
    if (D.lCpu == null) return {unit: 'Fill in cost by layer'};
    return {num: U.fMoney(D.lCpu, 2), unit: 'network cost per unit', status: D.tGaps ? 'Gap' : D.tRows ? 'Matched' : '', note: D.pApprove + ' projects to approve, ' + D.tGaps + ' tie-out gaps'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleNetwork'; S.biz.marketplace = '2027 to 2031';
    S.f.currency = '€'; S.f.hurdle = 9; S.f.pbMax = 4; S.f.tol = 2; S.f.y0 = '2026';
    var L = [[2600000, 40, 690000, 380000, 0, 90000], [7000000, 100, 780000, 460000, 0, 110000], [1100000, 15, 70000, 45000, 0, 15000], [6500000, 92, 0, 0, 1180000, 40000], [6800000, 97, 520000, 210000, 0, 60000], [6800000, 97, 3900000, 0, 1150000, 210000]];
    S.t.layers.forEach(function (r, i) { r.units = L[i][0]; r.share = L[i][1]; r.labor = L[i][2]; r.site = L[i][3]; r.trans = L[i][4]; r.other = L[i][5]; });
    S.t.proj = W.rows(['name', 'capex', 'benefit', 'opex', 'ramp', 'life'], [
      ['Sorter upgrade SC-W1', 14000000, 5200000, 900000, 1, 10],
      ['New sort center SC-S2', 62000000, 16500000, 6800000, 2, 20],
      ['Depot automation DD-C1', 4800000, 1500000, 250000, 1, 8],
      ['Electric vans, Capital region', 9000000, 2100000, 700000, 1, 7],
      ['Cross dock in the East', 7500000, 1200000, 650000, 2, 15]
    ]);
    var t = [[348, 350, 152, 150], [372, 365, 160, 158], [395, 384, 168, 164], [414, 404, 176, 173], [432, 425, 183, 181]];
    S.t.tie.forEach(function (r, i) { r.oVol = t[i][0]; r.fVol = t[i][1]; r.oCost = t[i][2]; r.fCost = t[i][3]; });
    S.t.tie[2].note = 'Finance has not yet taken in the grocery program';
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    var laborAll = 0, all = 0;
    D.layers = S.t.layers.map(function (r) {
      var week = n0(r.labor) + n0(r.site) + n0(r.trans) + n0(r.other);
      if (!(r.units > 0)) return {};
      laborAll += n0(r.labor); all += week;
      var cpu = week / r.units;
      return {week: week, cpu: cpu, w: cpu * n0(r.share) / 100};
    });
    D.lWeek = all;
    var ws = D.layers.map(function (x) { return x.w; });
    D.lCpu = ws.some(W.isNum) ? W.sum(ws) : null;
    D.lLabor = all ? laborAll / all : null;
    var ti = -1; ws.forEach(function (v, i) { if (W.isNum(v) && (ti < 0 || v > ws[ti])) ti = i; });
    D.lTop = ti >= 0 ? LAYERS[ti] : ''; D.lTopShare = ti >= 0 && D.lCpu ? ws[ti] / D.lCpu : null;

    var h = n0(f.hurdle) / 100;
    D.pApprove = 0; D.pReject = 0; D.pCapex = 0; D.pNpv = 0;
    D.proj = S.t.proj.map(function (p) {
      if (!(p.capex > 0) || !W.isNum(p.benefit)) return {status: ''};
      var life = p.life > 0 ? Math.round(p.life) : 10, ramp = p.ramp > 0 ? p.ramp : 1, cfs = [-p.capex], cum = -p.capex, pb = null;
      for (var y = 1; y <= life; y++) {
        var cf = p.benefit * Math.min(1, y / ramp) - n0(p.opex);
        if (pb == null && cum + cf >= 0) pb = y - 1 + (cf > 0 ? -cum / cf : 0);
        cum += cf; cfs.push(cf);
      }
      var v = npv(h, cfs), r = irr(cfs);
      var okN = v > 0, okP = pb != null && pb <= n0(f.pbMax);
      var status = okN && okP ? 'Approve' : okN || okP ? 'Review' : 'Reject';
      if (status === 'Approve') { D.pApprove++; D.pCapex += p.capex; D.pNpv += v; }
      if (status === 'Reject') D.pReject++;
      return {pb: pb, npv: v, irr: r, pi: v / p.capex, status: status};
    });

    var tol = n0(f.tol) / 100;
    D.tRows = 0; D.tMatched = 0; D.tGaps = 0; D.tVolMax = null; D.tCostMax = null; D.tVolYear = ''; D.tCostYear = '';
    D.tie = S.t.tie.map(function (r, i) {
      var vg = r.fVol > 0 && W.isNum(r.oVol) ? r.oVol / r.fVol - 1 : null, cg = r.fCost > 0 && W.isNum(r.oCost) ? r.oCost / r.fCost - 1 : null;
      if (vg == null && cg == null) return {status: ''};
      D.tRows++;
      var yn = W.isNum((+f.y0)) ? String((+f.y0) + i + 1) : YRS[i];
      if (vg != null && (D.tVolMax == null || Math.abs(vg) > Math.abs(D.tVolMax))) { D.tVolMax = vg; D.tVolYear = yn; }
      if (cg != null && (D.tCostMax == null || Math.abs(cg) > Math.abs(D.tCostMax))) { D.tCostMax = cg; D.tCostYear = yn; }
      var ok = (vg == null || Math.abs(vg) <= tol) && (cg == null || Math.abs(cg) <= tol);
      if (ok) D.tMatched++; else D.tGaps++;
      return {vg: vg, cg: cg, cpu: r.oVol > 0 && W.isNum(r.oCost) ? r.oCost / r.oVol : null, status: ok ? 'Matched' : 'Gap'};
    });
    return D;
  }
};
})();
