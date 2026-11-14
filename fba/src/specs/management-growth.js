(function () {
var U;
var MKTS = ['Germany', 'United Kingdom', 'France', 'Italy', 'Spain', 'Netherlands', 'Poland', 'Sweden', 'Canada', 'Mexico', 'Japan', 'Australia'];
window.SPEC = {
  app: 'management-growth',
  title: 'Management and Growth',
  desc: 'Run a weekly business review, decide which SKUs to scale, fix or cut, size new marketplaces, and estimate what the brand would sell for.',
  notice: 'Every tab is filled with sample data for a small electronics brand. Type over it, or start blank.',
  headCap: 'Last week',
  tones: {good: ['Scale', 'Keep', 'Go'], warn: ['Fix', 'Review'], bad: ['Cut', 'No go']},
  notes: [
    'Portfolio actions: Scale when margin and growth are both strong, Fix when margin, returns or rating fall below your floors, Cut when margin and growth are both negative, Keep otherwise.',
    'Marketplace profit uses the price net of VAT, since EU and UK prices include it. Setup cost covers compliance, registration and listing translation. Payback is setup cost over monthly profit.',
    'Amazon brands usually sell for a multiple of seller\'s discretionary earnings (SDE), often around 2.5x to 4.5x. Brand strength, history and how much depends on one SKU move the multiple. Treat the result as a range, not a price.'
  ],
  tabs: [
    {id: 'weekly-review', title: 'Weekly business review', badge: function (D) { return D.wLast ? U.signed(U.fPct(D.wWow), D.wWow) : ''; }, sections: [
      {type: 'form', title: 'Currency', fields: [{k: 'currency', label: 'Currency', kind: 'sel', options: ['$', '€', '£']}]},
      {type: 'tiles', items: [
        {label: 'Revenue last week', sub: function (D) { return D.wWow != null ? U.signed(U.fPct(D.wWow), D.wWow) + ' on the week before' : 'Latest row'; }, v: function (D) { return D.wLast ? U.fMoney(D.wLast.rev, 0) : ''; }},
        {label: 'Contribution margin', sub: 'Latest week', v: function (D) { return D.wLastD ? U.fPct(D.wLastD.margin) : ''; }},
        {label: 'TACoS', sub: 'Ad spend over revenue, latest week', v: function (D) { return D.wLastD ? U.fPct(D.wLastD.tacos) : ''; }},
        {label: 'Conversion', sub: 'Units over sessions, latest week', v: function (D) { return D.wLastD ? U.fPct(D.wLastD.conv) : ''; }},
        {label: 'In stock', sub: 'Latest week', v: function (D) { return D.wLast && U.isNum(D.wLast.instock) ? U.fPct(D.wLast.instock / 100) : ''; }, bad: function (D) { return D.wLast && D.wLast.instock < 90; }}
      ]},
      {type: 'charts', title: 'Trend', charts: [
        {kind: 'line', title: 'Revenue by week', sub: 'All SKUs', data: function (D, S) { return {pts: S.t.weeks.map(function (w, i) { return {label: w.week ? U.fDate(U.toUTC(w.week)).replace(/ \d{4}$/, '') : 'Week ' + (i + 1), y: w.rev}; }), fmt: 'money', area: true}; }}
      ]},
      {type: 'table', k: 'weeks', title: 'Weekly numbers', help: 'One row per week from Business Reports and the advertising console. Watch flags weeks with in-stock under 90%, a rating under 4.3 or TACoS over 15%.', add: 'Add a week', cols: [
        {k: 'week', label: 'Week starting', kind: 'date', w: 128},
        {k: 'rev', label: 'Revenue', kind: 'money', w: 84},
        {k: 'units', label: 'Units', kind: 'int', w: 64},
        {k: 'sessions', label: 'Sessions', kind: 'int', w: 74},
        {k: 'ads', label: 'Ad spend', kind: 'money', w: 74},
        {k: 'contrib', label: 'Contribution', kind: 'money', w: 84},
        {k: 'buybox', label: 'Buy Box %', kind: 'pct', w: 66},
        {k: 'instock', label: 'In stock %', kind: 'pct', w: 66},
        {k: 'rating', label: 'Rating', kind: 'num', w: 56},
        {label: 'Week on week', w: 70, v: function (D, i) { var c = D.weeks[i].wow; return c == null ? '' : U.signed(U.fPct(c), c); }},
        {label: 'Conv.', w: 56, v: function (D, i) { return U.fPct(D.weeks[i].conv); }},
        {label: 'TACoS', w: 56, v: function (D, i) { return U.fPct(D.weeks[i].tacos); }},
        {label: 'Margin', w: 56, v: function (D, i) { return U.fPct(D.weeks[i].margin); }},
        {label: 'Status', w: 86, status: function (D, i) { return D.weeks[i].status; }}
      ]}
    ]},
    {id: 'portfolio-scorecard', title: 'SKU portfolio scorecard', badge: function (D) { return D.pScale ? D.pScale + ' to scale' : ''; }, sections: [
      {type: 'form', title: 'Floors', fields: [
        {k: 'minMargin', label: 'Margin floor', kind: 'pct', def: 10},
        {k: 'scaleMargin', label: 'Margin to scale', kind: 'pct', def: 20},
        {k: 'scaleGrowth', label: 'Growth to scale', kind: 'pct', def: 10},
        {k: 'maxReturns', label: 'Return rate ceiling', kind: 'pct', def: 10},
        {k: 'minRating', label: 'Rating floor', kind: 'num', def: 4.2}
      ]},
      {type: 'tiles', items: [
        {label: 'Scale', sub: 'Strong margin and growth', v: function (D, S) { return S.t.skus.length ? String(D.pScale) : ''; }},
        {label: 'Fix', sub: 'Below a floor', v: function (D, S) { return S.t.skus.length ? String(D.pFix) : ''; }},
        {label: 'Cut', sub: 'Losing money and shrinking', v: function (D, S) { return S.t.skus.length ? String(D.pCut) : ''; }, bad: function (D) { return D.pCut > 0; }},
        {label: 'Revenue in Scale SKUs', sub: 'Share of 90-day revenue', v: function (D) { return U.fPct(D.pScaleShare); }}
      ]},
      {type: 'table', k: 'skus', title: 'SKUs', help: 'Use the last 90 days. Growth compares with the 90 days before.', add: 'Add a SKU', cols: [
        {k: 'sku', label: 'SKU', kind: 'text', w: 140},
        {k: 'rev', label: 'Revenue 90 days', kind: 'money', w: 90},
        {k: 'margin', label: 'Margin %', kind: 'pct', w: 66},
        {k: 'growth', label: 'Growth %', kind: 'pct', w: 66},
        {k: 'returns', label: 'Return rate %', kind: 'pct', w: 70},
        {k: 'rating', label: 'Rating', kind: 'num', w: 56},
        {k: 'cover', label: 'Days of cover', kind: 'int', w: 66},
        {label: 'Profit 90 days', w: 84, v: function (D, i) { return U.fMoney(D.skus[i].profit, 0); }, foot: function (D) { return U.fMoney(D.pProfit, 0); }},
        {label: 'Reason', w: 230, num: false, v: function (D, i) { return D.skus[i].why; }},
        {label: 'Action', w: 78, status: function (D, i) { return D.skus[i].action; }}
      ]},
      {type: 'charts', title: 'Where revenue sits', charts: [
        {kind: 'bars', title: 'Revenue by SKU, 90 days', sub: 'With share of the total', data: function (D, S) { return {items: S.t.skus.map(function (r, i) { return {label: (r.sku || 'SKU ' + (i + 1)) + (D.skus[i].action ? ' (' + D.skus[i].action + ')' : ''), v: r.rev}; }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); }), fmt: 'money', share: true}; }}
      ]}
    ]},
    {id: 'marketplace-expansion', title: 'Marketplace expansion', badge: function (D) { return D.xBest ? 'best: ' + D.xBest : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Best marketplace', sub: function (D) { return D.xBest ? U.fMoney(D.xBestProfit, 0) + ' profit per month' : 'Highest monthly profit'; }, v: function (D) { return D.xBest; }},
        {label: 'Ready to launch', sub: 'Payback within 6 months', v: function (D, S) { return S.t.mkts.length ? String(D.xGo) : ''; }},
        {label: 'Profit per month, all Go', sub: 'If you open every Go marketplace', v: function (D, S) { return S.t.mkts.length ? U.fMoney(D.xGoProfit, 0) : ''; }},
        {label: 'Setup cost, all Go', sub: 'Compliance, registration and translation', v: function (D, S) { return S.t.mkts.length ? U.fMoney(D.xGoSetup, 0) : ''; }}
      ]},
      {type: 'table', k: 'mkts', title: 'Marketplaces', help: 'Enter prices and costs in your own currency. Demand is the monthly units the top sellers move in that market; share is what you expect to win.', add: 'Add a marketplace', cols: [
        {k: 'mkt', label: 'Marketplace', kind: 'sel', options: MKTS, w: 124},
        {k: 'demand', label: 'Niche units / month', kind: 'int', w: 76},
        {k: 'share', label: 'Your share %', kind: 'pct', w: 62},
        {k: 'price', label: 'Price incl. VAT', kind: 'money', w: 70},
        {k: 'vat', label: 'VAT %', kind: 'pct', w: 54},
        {k: 'ref', label: 'Referral %', kind: 'pct', w: 60},
        {k: 'fba', label: 'FBA fee', kind: 'money', w: 60},
        {k: 'landed', label: 'Landed cost', kind: 'money', w: 66},
        {k: 'ads', label: 'Ads per unit', kind: 'money', w: 62},
        {k: 'setup', label: 'Setup cost', kind: 'money', w: 74},
        {label: 'Profit per unit', w: 70, v: function (D, i) { return U.fMoney(D.mkts[i].unit, 2); }, tone: function (D, i) { return D.mkts[i].unit < 0 ? 'bad' : ''; }},
        {label: 'Profit per month', w: 80, v: function (D, i) { return U.fMoney(D.mkts[i].monthly, 0); }},
        {label: 'Payback months', w: 70, v: function (D, i) { return U.fDec1(D.mkts[i].payback); }},
        {label: 'Result', w: 80, status: function (D, i) { return D.mkts[i].status; }}
      ]}
    ]},
    {id: 'exit-valuation', title: 'Exit valuation', badge: function (D) { return D.eMid ? U.fCompact(D.eMid) : ''; }, sections: [
      {type: 'form', title: 'Trailing twelve months', fields: [
        {k: 'eRev', label: 'Revenue', kind: 'money'},
        {k: 'eProfit', label: 'Net profit', kind: 'money'},
        {k: 'eAddbacks', label: 'Owner add-backs', kind: 'money', note: 'Your salary and one-off costs a buyer would not carry'},
        {k: 'eInv', label: 'Inventory at cost', kind: 'money', note: 'Usually paid on top of the multiple'},
        {k: 'eTop', label: 'Revenue from top SKU', kind: 'pct'},
        {k: 'eAge', label: 'Months of trading history', kind: 'int'},
        {k: 'eGrowth', label: 'Revenue growth, year on year', kind: 'pct'}
      ], stats: [
        {label: 'SDE', v: function (D) { return U.fMoney(D.eSde, 0); }},
        {label: 'SDE margin', v: function (D) { return U.fPct(D.eSdeMargin); }},
        {label: 'Suggested multiple change', v: function (D) { return D.eAdj == null ? '' : (D.eAdj > 0 ? '+' : '') + U.fDec1(D.eAdj) + 'x'; }}
      ]},
      {type: 'table', k: 'scen', title: 'Valuation range', help: 'Set a multiple for each case. The suggested change from history, concentration and growth is shown above, so you can move the multiples to match.', fixed: ['Low', 'Base', 'High'], cols: [
        {fixedLabel: true, label: 'Case', w: 140, num: false},
        {k: 'mult', label: 'Multiple of SDE', kind: 'num', w: 100},
        {label: 'Business value', w: 120, v: function (D, i) { return U.fMoney(D.scen[i].value, 0); }},
        {label: 'Plus inventory', w: 120, v: function (D, i) { return U.fMoney(D.scen[i].total, 0); }},
        {label: 'Multiple of revenue', w: 100, v: function (D, i) { return D.scen[i].revX == null ? '' : U.fDec2(D.scen[i].revX) + 'x'; }}
      ]},
      {type: 'table', k: 'drivers', title: 'What buyers check', help: 'Each Yes makes the brand easier to sell and supports a higher multiple.', fixed: ['Registered trademark and Brand Registry', 'Two or more years of sales history', 'No SKU above half of revenue', 'Profit stable or growing for 12 months', 'Second supplier qualified', 'Account health clean, no open policy issues', 'Processes written down so a new owner can run them', 'Sales on more than one marketplace or channel'], cols: [
        {fixedLabel: true, label: 'Check', w: 380, num: false},
        {k: 'ok', label: 'In place', kind: 'sel', options: ['No', 'Yes'], w: 100, tone: false},
        {k: 'note', label: 'Notes', kind: 'text', w: 260}
      ]}
    ]}
  ],
  figs: [
    {label: 'Revenue last week', v: function (D) { return D.wLast ? U.fMoney(D.wLast.rev, 0) : 'No data'; }},
    {label: 'SKUs to scale', v: function (D) { return String(D.pScale); }},
    {label: 'SKUs to cut', v: function (D) { return {text: String(D.pCut), tone: D.pCut ? 'warn' : ''}; }},
    {label: 'Best new marketplace', v: function (D) { return D.xBest || 'None yet'; }},
    {label: 'Base valuation', v: function (D) { return U.fMoney(D.eMid, 0) || 'No data'; }}
  ],
  headline: function (D) {
    if (!D.wLast) return {unit: 'Add a week to the review'};
    return {num: U.fMoney(D.wLast.rev, 0), unit: 'revenue' + (D.wWow != null ? ', ' + U.signed(U.fPct(D.wWow), D.wWow) + ' week on week' : ''), status: D.wLastD.status, note: D.drivers + ' of 8 buyer checks in place'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleBrand'; S.biz.marketplace = 'Amazon.com (US)';
    S.t.weeks = W.rows(['week', 'rev', 'units', 'sessions', 'ads', 'contrib', 'buybox', 'instock', 'rating'], [
      ['2026-09-28', 33800, 1010, 11200, 4100, 6900, 97, 99, 4.5],
      ['2026-10-05', 35100, 1050, 11900, 4250, 7300, 98, 99, 4.5],
      ['2026-10-12', 36900, 1110, 12400, 4400, 7700, 98, 96, 4.5],
      ['2026-10-19', 38200, 1150, 12600, 4800, 7600, 97, 92, 4.4],
      ['2026-10-26', 41500, 1240, 13800, 5200, 8300, 98, 88, 4.4],
      ['2026-11-02', 44300, 1320, 14700, 5600, 8900, 98, 95, 4.4]
    ]);
    S.t.skus = W.rows(['sku', 'rev', 'margin', 'growth', 'returns', 'rating', 'cover'], [
      ['EB-SPK-20-BLK', 168000, 23, 18, 5.6, 4.5, 99],
      ['EB-SPK-20-BLU', 31000, 14, -6, 4.3, 4.5, 178],
      ['EB-BUD-PRO-WHT', 176000, 9, 22, 12.4, 4.1, 18],
      ['EB-CHG-65W', 62000, 15, 4, 6.8, 4.3, 125],
      ['EB-CBL-USBC-2M', 73000, 21, 12, 2.0, 4.6, 39],
      ['EB-PWR-10K', 4800, -8, -40, 9.0, 3.9, 400]
    ]);
    S.t.mkts = W.rows(['mkt', 'demand', 'share', 'price', 'vat', 'ref', 'fba', 'landed', 'ads', 'setup'], [
      ['Germany', 9800, 4, 52.0, 19, 7, 5.9, 15.6, 5.5, 4800],
      ['United Kingdom', 7200, 4, 47.5, 20, 7, 5.6, 15.4, 5.0, 3600],
      ['France', 5100, 3, 51.0, 20, 7, 6.2, 15.6, 5.8, 3900],
      ['Canada', 3900, 5, 61.0, 0, 8, 7.4, 16.1, 6.0, 1800],
      ['Japan', 6100, 2, 49.0, 10, 8, 6.8, 16.4, 6.5, 6500]
    ]);
    var f = S.f;
    f.eRev = 1680000; f.eProfit = 246000; f.eAddbacks = 72000; f.eInv = 185000; f.eTop = 34; f.eAge = 30; f.eGrowth = 21;
    S.t.scen[0].mult = 2.5; S.t.scen[1].mult = 3.3; S.t.scen[2].mult = 4.2;
    ['Yes', 'Yes', 'Yes', 'Yes', 'No', 'Yes', 'No', 'No'].forEach(function (v, i) { S.t.drivers[i].ok = v; });
    S.t.drivers[4].note = 'Ningbo Acoustic sampled, not yet qualified';
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    var order = S.t.weeks.map(function (w, i) { return i; }).sort(function (a, b) { return (S.t.weeks[a].week || '') < (S.t.weeks[b].week || '') ? -1 : 1; });
    var prevRev = {};
    order.forEach(function (idx, j) { prevRev[idx] = j > 0 ? S.t.weeks[order[j - 1]].rev : null; });
    D.weeks = S.t.weeks.map(function (w, i) {
      var p = prevRev[i];
      var tacos = W.ratio(w.ads, w.rev);
      var watch = (W.isNum(w.instock) && w.instock < 90) || (W.isNum(w.rating) && w.rating < 4.3) || (tacos != null && tacos > 0.15);
      return {wow: W.isNum(w.rev) && p > 0 ? w.rev / p - 1 : null, conv: W.ratio(w.units, w.sessions), tacos: tacos, margin: W.ratio(w.contrib, w.rev), status: W.isNum(w.rev) ? (watch ? 'Watch' : 'On track') : ''};
    });
    var li = order.filter(function (i) { return W.isNum(S.t.weeks[i].rev); }).pop();
    D.wLast = li != null ? S.t.weeks[li] : null;
    D.wLastD = li != null ? D.weeks[li] : null;
    D.wWow = D.wLastD ? D.wLastD.wow : null;

    D.skus = S.t.skus.map(function (r) {
      if (!W.isNum(r.margin)) return {action: '', why: ''};
      var why = [], action;
      if (r.margin < 0 && n0(r.growth) < 0) { action = 'Cut'; why.push('losing money and shrinking'); }
      else {
        if (r.margin < n0(f.minMargin)) why.push('margin under floor');
        if (W.isNum(r.returns) && r.returns > n0(f.maxReturns)) why.push('returns over ceiling');
        if (W.isNum(r.rating) && r.rating < n0(f.minRating)) why.push('rating under floor');
        if (why.length) action = 'Fix';
        else if (r.margin >= n0(f.scaleMargin) && n0(r.growth) >= n0(f.scaleGrowth)) { action = 'Scale'; why.push('strong margin and growth'); }
        else { action = 'Keep'; why.push('steady, no floor broken'); }
      }
      if (W.isNum(r.cover) && r.cover < 28 && action !== 'Cut') why.push('low stock');
      return {action: action, why: why.join(', '), profit: W.isNum(r.rev) ? r.rev * r.margin / 100 : null};
    });
    var cnt = function (a) { return D.skus.filter(function (x) { return x.action === a; }).length; };
    D.pScale = cnt('Scale'); D.pFix = cnt('Fix'); D.pCut = cnt('Cut');
    var tot = W.sum(S.t.skus.map(function (r) { return r.rev; }));
    D.pScaleShare = tot > 0 ? W.sum(S.t.skus.map(function (r, i) { return D.skus[i].action === 'Scale' ? r.rev : 0; })) / tot : null;
    D.pProfit = W.sum(D.skus.map(function (x) { return x.profit; }));

    D.mkts = S.t.mkts.map(function (m) {
      if (!(m.price > 0)) return {status: ''};
      var net = m.price / (1 + n0(m.vat) / 100);
      var unit = net - m.price * n0(m.ref) / 100 - n0(m.fba) - n0(m.landed) - n0(m.ads);
      var monthly = unit * n0(m.demand) * n0(m.share) / 100;
      var payback = monthly > 0 ? n0(m.setup) / monthly : null;
      return {unit: unit, monthly: monthly, payback: payback, status: payback == null ? 'No go' : payback <= 6 ? 'Go' : payback <= 12 ? 'Review' : 'No go'};
    });
    var bx = -1;
    D.mkts.forEach(function (m, i) { if (m.monthly != null && (bx < 0 || m.monthly > D.mkts[bx].monthly)) bx = i; });
    D.xBest = bx >= 0 && D.mkts[bx].monthly > 0 ? S.t.mkts[bx].mkt : '';
    D.xBestProfit = bx >= 0 ? D.mkts[bx].monthly : null;
    D.xGo = D.mkts.filter(function (m) { return m.status === 'Go'; }).length;
    D.xGoProfit = W.sum(D.mkts.map(function (m) { return m.status === 'Go' ? m.monthly : 0; }));
    D.xGoSetup = W.sum(S.t.mkts.map(function (m, i) { return D.mkts[i].status === 'Go' ? m.setup : 0; }));

    D.eSde = W.isNum(f.eProfit) ? f.eProfit + n0(f.eAddbacks) : null;
    D.eSdeMargin = D.eSde != null && f.eRev > 0 ? D.eSde / f.eRev : null;
    var adj = 0, any = false;
    if (W.isNum(f.eAge)) { any = true; adj += f.eAge < 24 ? -0.5 : f.eAge >= 36 ? 0.3 : 0; }
    if (W.isNum(f.eTop)) { any = true; adj += f.eTop > 50 ? -0.5 : f.eTop < 30 ? 0.2 : 0; }
    if (W.isNum(f.eGrowth)) { any = true; adj += f.eGrowth >= 20 ? 0.4 : f.eGrowth < 0 ? -0.5 : 0; }
    D.eAdj = any ? W.roundTo(adj, 1) : null;
    D.scen = S.t.scen.map(function (s) {
      var value = D.eSde != null && W.isNum(s.mult) ? D.eSde * s.mult : null;
      return {value: value, total: value == null ? null : value + n0(f.eInv), revX: value != null && f.eRev > 0 ? value / f.eRev : null};
    });
    D.eMid = D.scen[1] ? D.scen[1].total : null;
    D.drivers = S.t.drivers.filter(function (d) { return d.ok === 'Yes'; }).length;
    return D;
  }
};
})();
