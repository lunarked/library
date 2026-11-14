(function () {
var U;
var WKS = ['12 weeks before', '11 weeks before', '10 weeks before', '9 weeks before', '8 weeks before', '7 weeks before', '6 weeks before', '5 weeks before', '4 weeks before', '3 weeks before', '2 weeks before', '1 week before', 'Peak week'];
window.SPEC = {
  app: 'plan-labor',
  title: 'Labor Plan',
  desc: 'Work out the heads each site needs from volume and labor rates, plan the hiring ramp into peak with attrition and training time, and check whether the local labor market can supply it.',
  notice: 'Every tab is filled with sample data for five sites ahead of peak. Type over it, or start blank.',
  headCap: 'Heads short across sites',
  tones: {good: ['Staffed', 'Low risk'], warn: ['Medium risk', 'Behind'], bad: ['Understaffed', 'High risk']},
  notes: [
    'Labor hours are weekly units over units per labor hour. Heads needed divide those hours by the productive hours of one person a week, after absence and holidays.',
    'Peak ramp: each week the team loses the weekly attrition rate. New hires count only after their training weeks. The plan is Behind when available heads fall short of the target for that week.',
    'Labor market: a site that needs more than 5% of the local available workforce in a year is High risk, 2% to 5% Medium. A wage below the local market makes hiring slower and attrition higher.'
  ],
  tabs: [
    {id: 'sites', title: 'Heads by site', badge: function (D) { return D.sShort ? U.fInt(D.sShort) + ' short' : ''; }, sections: [
      {type: 'form', title: 'Working time', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']},
        {k: 'hours', label: 'Contract hours per week', kind: 'num', def: 38},
        {k: 'absence', label: 'Absence and holidays', kind: 'pct', def: 15},
        {k: 'indirect', label: 'Indirect labor on top', kind: 'pct', def: 12, note: 'Leads, quality, training, cleaning'}
      ], stats: [
        {label: 'Productive hours per head', v: function (D) { return U.fDec1(D.sProdH); }}
      ]},
      {type: 'tiles', items: [
        {label: 'Heads needed', sub: 'Direct plus indirect, all sites', v: function (D, S) { return S.t.sites.length ? U.fInt(D.sNeed) : ''; }},
        {label: 'Heads now', sub: 'All sites', v: function (D, S) { return S.t.sites.length ? U.fInt(D.sNow) : ''; }},
        {label: 'Short', sub: 'Sites below need', v: function (D, S) { return S.t.sites.length ? U.fInt(D.sShort) : ''; }, bad: function (D) { return D.sShort > 0; }},
        {label: 'Labor cost per unit', sub: 'All sites', v: function (D) { return U.fMoney(D.sCpu, 2); }}
      ]},
      {type: 'table', k: 'sites', title: 'Sites', help: 'Units per week is the plan week you staff for. Units per labor hour is the measured direct rate.', add: 'Add a site', cols: [
        {k: 'site', label: 'Site', kind: 'text', w: 96},
        {k: 'type', label: 'Type', kind: 'text', w: 110},
        {k: 'units', label: 'Units per week', kind: 'int', w: 86},
        {k: 'uplh', label: 'Units per labor hour', kind: 'num', w: 80},
        {k: 'now', label: 'Heads now', kind: 'int', w: 70, foot: 'sum'},
        {k: 'wage', label: 'Cost per hour', kind: 'money', w: 70},
        {label: 'Labor hours', w: 76, v: function (D, i) { return U.fInt(D.sites[i].hrs); }},
        {label: 'Heads needed', w: 76, v: function (D, i) { return U.fInt(D.sites[i].need); }, foot: function (D) { return U.fInt(D.sNeed); }},
        {label: 'Gap', w: 64, v: function (D, i) { var g = D.sites[i].gap; return g == null ? '' : U.signed(U.fInt(g), g); }},
        {label: 'Cost per unit', w: 74, v: function (D, i) { return U.fMoney(D.sites[i].cpu, 2); }},
        {label: 'Status', w: 104, status: function (D, i) { return D.sites[i].status; }}
      ]}
    ]},
    {id: 'peak', title: 'Peak hiring ramp', badge: function (D) { return D.pBehind ? D.pBehind + ' weeks behind' : ''; }, sections: [
      {type: 'form', title: 'Ramp settings', fields: [
        {k: 'start', label: 'Heads at the start', kind: 'int'},
        {k: 'attr', label: 'Attrition per week', kind: 'pct', def: 1.5},
        {k: 'train', label: 'Training weeks', kind: 'int', def: 2},
        {k: 'maxHire', label: 'Most hires a week', kind: 'int', note: 'What recruiting and onboarding can handle'}
      ], stats: [
        {label: 'Hires planned', v: function (D) { return U.fInt(D.pHires); }},
        {label: 'Lost to attrition', v: function (D) { return U.fInt(D.pLost); }},
        {label: 'Heads in peak week', v: function (D) { return D.pPeak ? {text: U.fInt(D.pPeak.avail) + ' of ' + U.fInt(D.pPeak.target), tone: D.pPeak.avail < D.pPeak.target ? 'bad' : ''} : ''; }}
      ]},
      {type: 'table', k: 'weeks', title: 'Weeks to peak', help: 'Target is the heads you need productive in that week. Hires start in the week entered and become productive after training.', fixed: WKS, cols: [
        {fixedLabel: true, label: 'Week', w: 140, num: false},
        {k: 'target', label: 'Target heads', kind: 'int', w: 90},
        {k: 'hires', label: 'Hires starting', kind: 'int', w: 90},
        {label: 'In training', w: 84, v: function (D, i) { return U.fInt(D.weeks[i].training); }},
        {label: 'Productive heads', w: 100, v: function (D, i) { return U.fInt(D.weeks[i].avail); }},
        {label: 'Gap', w: 70, v: function (D, i) { var g = D.weeks[i].gap; return g == null ? '' : U.signed(U.fInt(g), g); }},
        {label: 'Hiring limit', w: 84, v: function (D, i) { return D.weeks[i].over ? {text: 'Above limit', tone: 'warn'} : ''; }, num: false},
        {label: 'Status', w: 90, status: function (D, i) { return D.weeks[i].status; }}
      ]},
      {type: 'charts', title: 'Ramp', charts: [
        {kind: 'line', title: 'Productive heads by week', sub: 'Against the peak-week target', data: function (D, S) { return {pts: WKS.map(function (w, i) { return {label: i === 12 ? 'Peak' : 'W-' + (12 - i), y: D.weeks[i].avail}; }), refs: D.pPeak && D.pPeak.target ? [{v: D.pPeak.target, label: 'Peak target'}] : [], fmt: 'int', area: true}; }}
      ]}
    ]},
    {id: 'market', title: 'Local labor market', badge: function (D) { return D.mHigh ? D.mHigh + ' high risk' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'High risk sites', sub: 'Need over 5% of the local pool', v: function (D, S) { return S.t.market.length ? String(D.mHigh) : ''; }, bad: function (D) { return D.mHigh > 0; }},
        {label: 'Hires a year', sub: 'All sites, growth plus replacing attrition', v: function (D, S) { return S.t.market.length ? U.fInt(D.mHires) : ''; }},
        {label: 'Lowest wage position', sub: function (D) { return D.mLowSite || ''; }, v: function (D) { return D.mLowWage == null ? '' : U.signed(U.fPct(D.mLowWage), D.mLowWage) + ' to market'; }}
      ]},
      {type: 'table', k: 'market', title: 'Sites and local markets', help: 'Available pool is job seekers and people open to warehouse work within commuting distance, from the local labor office or a recruiting agency.', add: 'Add a site', cols: [
        {k: 'site', label: 'Site', kind: 'text', w: 96},
        {k: 'area', label: 'Commuting area', kind: 'text', w: 140},
        {k: 'pool', label: 'Available pool', kind: 'int', w: 80},
        {k: 'growth', label: 'Net new heads a year', kind: 'int', w: 80},
        {k: 'heads', label: 'Heads at full run', kind: 'int', w: 80},
        {k: 'attrY', label: 'Attrition a year %', kind: 'pct', w: 76},
        {k: 'wage', label: 'Our wage', kind: 'money', w: 70},
        {k: 'mkt', label: 'Market wage', kind: 'money', w: 70},
        {k: 'rivals', label: 'Other large employers hiring', kind: 'int', w: 90},
        {label: 'Hires a year', w: 70, v: function (D, i) { return U.fInt(D.market[i].hires); }},
        {label: 'Share of pool', w: 70, v: function (D, i) { return U.fPct(D.market[i].share); }},
        {label: 'Wage to market', w: 70, v: function (D, i) { var w = D.market[i].wage; return w == null ? '' : U.signed(U.fPct(w), w); }},
        {label: 'Risk', w: 100, status: function (D, i) { return D.market[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Heads needed', v: function (D) { return U.fInt(D.sNeed) || 'No data'; }},
    {label: 'Heads short', v: function (D) { return {text: U.fInt(D.sShort), tone: D.sShort ? 'warn' : ''}; }},
    {label: 'Peak weeks behind', v: function (D) { return {text: String(D.pBehind), tone: D.pBehind ? 'warn' : ''}; }},
    {label: 'High risk labor markets', v: function (D) { return {text: String(D.mHigh), tone: D.mHigh ? 'warn' : ''}; }},
    {label: 'Labor cost per unit', v: function (D) { return U.fMoney(D.sCpu, 2) || 'No data'; }}
  ],
  headline: function (D, S) {
    if (!S.t.sites.length) return {unit: 'Add sites with volume and rates'};
    return {num: U.fInt(D.sShort), unit: 'heads short across sites', status: D.sShort ? 'Understaffed' : 'Staffed', note: U.fInt(D.sNow) + ' now against ' + U.fInt(D.sNeed) + ' needed'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleNetwork'; S.biz.marketplace = '2027 to 2031';
    var f = S.f; f.hours = 38; f.absence = 15; f.indirect = 12; f.currency = '€'; f.start = 420; f.attr = 1.5; f.train = 2; f.maxHire = 60;
    S.t.sites = W.rows(['site', 'type', 'units', 'uplh', 'now', 'wage'], [
      ['FC-W1', 'Fulfillment center', 1200000, 95, 400, 24],
      ['SC-W1', 'Sort center', 2600000, 310, 270, 23],
      ['SC-C1', 'Sort center', 2100000, 290, 250, 25],
      ['DD-C1', 'Delivery depot', 520000, 140, 105, 22],
      ['SC-S2', 'Sort center (new)', 900000, 260, 0, 23]
    ]);
    var tgt = [405, 400, 415, 430, 450, 470, 500, 530, 560, 590, 620, 640, 670];
    var hires = [25, 30, 35, 35, 35, 35, 35, 35, 30, 25, 20, 10, 0];
    S.t.weeks.forEach(function (r, i) { r.target = tgt[i]; r.hires = hires[i]; });
    S.t.market = W.rows(['site', 'area', 'pool', 'growth', 'heads', 'attrY', 'wage', 'mkt', 'rivals'], [
      ['FC-W1', 'West, 45 minutes', 26000, 20, 420, 38, 15.2, 15.0, 4],
      ['SC-W1', 'West, 45 minutes', 26000, 15, 275, 35, 15.0, 15.0, 4],
      ['SC-C1', 'Capital, 60 minutes', 48000, 40, 260, 42, 15.5, 16.2, 9],
      ['DD-C1', 'Capital, 30 minutes', 21000, 25, 110, 45, 14.8, 16.2, 9],
      ['SC-S2', 'South, 45 minutes', 7000, 330, 330, 30, 15.8, 15.5, 2]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    D.sProdH = W.isNum(f.hours) ? f.hours * (1 - n0(f.absence) / 100) : null;
    D.sShort = 0;
    var cost = 0, units = 0;
    D.sites = S.t.sites.map(function (s) {
      if (!W.isNum(s.units) || !(s.uplh > 0)) return {status: ''};
      var hrs = s.units / s.uplh, need = D.sProdH > 0 ? Math.ceil(hrs / D.sProdH * (1 + n0(f.indirect) / 100)) : null;
      var gap = need != null && W.isNum(s.now) ? s.now - need : null;
      if (gap != null && gap < 0) D.sShort -= gap;
      var c = W.isNum(s.wage) ? hrs * (1 + n0(f.indirect) / 100) * s.wage : null;
      if (c != null) { cost += c; units += s.units; }
      return {hrs: hrs, need: need, gap: gap, cpu: c != null ? c / s.units : null, status: gap == null ? '' : gap >= 0 ? 'Staffed' : gap >= -0.05 * need ? 'Tight' : 'Understaffed'};
    });
    D.sNeed = W.sum(D.sites.map(function (x) { return x.need; }));
    D.sNow = W.sum(S.t.sites.map(function (s) { return s.now; }));
    D.sCpu = units ? cost / units : null;

    var tr = Math.max(0, Math.round(n0(f.train))), a = n0(f.attr) / 100;
    var prod = W.isNum(f.start) ? f.start : null, pipe = [];
    D.pHires = 0; D.pLost = 0; D.pBehind = 0;
    D.weeks = S.t.weeks.map(function (r) {
      var h = n0(r.hires);
      D.pHires += h;
      if (prod == null) return {status: ''};
      var lost = prod * a; D.pLost += lost; prod -= lost;
      pipe.push(h);
      if (pipe.length > tr) prod += pipe.shift();
      var training = W.sum(pipe);
      var gap = W.isNum(r.target) ? prod - r.target : null;
      var status = gap == null ? '' : gap >= -0.5 ? 'On track' : 'Behind';
      if (status === 'Behind') D.pBehind++;
      return {training: training, avail: prod, gap: gap, over: W.isNum(f.maxHire) && h > f.maxHire, status: status};
    });
    D.pPeak = D.weeks[12] && D.weeks[12].avail != null ? {avail: D.weeks[12].avail, target: S.t.weeks[12].target} : null;

    D.mHigh = 0; D.mHires = 0; D.mLowWage = null; D.mLowSite = '';
    D.market = S.t.market.map(function (m) {
      if (!(m.pool > 0)) return {status: ''};
      var hires = n0(m.growth) + n0(m.heads) * n0(m.attrY) / 100, share = hires / m.pool;
      var wage = m.mkt > 0 && W.isNum(m.wage) ? m.wage / m.mkt - 1 : null;
      D.mHires += hires;
      if (wage != null && (D.mLowWage == null || wage < D.mLowWage)) { D.mLowWage = wage; D.mLowSite = m.site; }
      var status = share > 0.05 ? 'High risk' : share > 0.02 || (wage != null && wage < -0.03) ? 'Medium risk' : 'Low risk';
      if (status === 'High risk') D.mHigh++;
      return {hires: hires, share: share, wage: wage, status: status};
    });
    return D;
  }
};
})();
