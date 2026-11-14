(function () {
var U;
window.SPEC = {
  app: 'advertising',
  title: 'Advertising',
  desc: 'Plan campaign structure and budget, track weekly ACoS and TACoS against break-even, harvest search terms, and set bids from your margin.',
  notice: 'Every tab is filled with sample data for a speaker\'s Sponsored Products ads. Type over it, or start blank.',
  headCap: 'Last week',
  tones: {good: ['Live', 'Promote to exact', 'Raise'], warn: ['Paused', 'Planned', 'Lower bid', 'Lower'], bad: ['Negate']},
  notes: [
    'Break-even ACoS is your profit per unit before ads divided by the price. Below it an ad sale still makes money, above it every ad sale loses money. Target ACoS is the level you choose to run at.',
    'TACoS is ad spend over total sales, ads and organic together. Falling TACoS while ad spend holds means organic sales are growing.',
    'Target bid = price x target ACoS x conversion rate. A keyword that converts better can carry a higher bid at the same ACoS.'
  ],
  tabs: [
    {id: 'campaign-structure', title: 'Campaign structure', badge: function (D) { return D.cLive ? D.cLive + ' live' : ''; }, sections: [
      {type: 'form', title: 'Currency', fields: [{k: 'currency', label: 'Currency', kind: 'sel', options: ['$', '€', '£']}]},
      {type: 'tiles', items: [
        {label: 'Campaigns', sub: 'Rows in the plan', v: function (D, S) { return S.t.camps.length ? String(S.t.camps.length) : ''; }},
        {label: 'Daily budget', sub: 'Live and planned campaigns', v: function (D, S) { return S.t.camps.length ? U.fMoney(D.cDaily, 0) : ''; }},
        {label: 'Monthly budget', sub: 'Daily budget times 30.4', v: function (D, S) { return S.t.camps.length ? U.fMoney(D.cDaily * 30.4, 0) : ''; }},
        {label: 'Live campaigns', sub: 'Currently running', v: function (D, S) { return S.t.camps.length ? String(D.cLive) : ''; }}
      ]},
      {type: 'table', k: 'camps', title: 'Campaigns', help: 'One row per campaign. Keep one targeting type per campaign so you can read its results cleanly.', add: 'Add a campaign', cols: [
        {k: 'name', label: 'Campaign', kind: 'text', w: 190},
        {k: 'type', label: 'Ad type', kind: 'sel', options: ['Sponsored Products', 'Sponsored Brands', 'Sponsored Display'], w: 150},
        {k: 'target', label: 'Targeting', kind: 'sel', options: ['Auto', 'Exact', 'Phrase', 'Broad', 'Product targeting', 'Category'], w: 126},
        {k: 'goal', label: 'Goal', kind: 'sel', options: ['Launch', 'Rank', 'Profit', 'Defend brand', 'Research'], w: 110},
        {k: 'budget', label: 'Daily budget', kind: 'money', w: 70, foot: 'sum'},
        {k: 'bid', label: 'Default bid', kind: 'money', w: 66},
        {k: 'kws', label: 'Targets', kind: 'int', w: 60},
        {k: 'status', label: 'Status', kind: 'sel', options: ['Planned', 'Live', 'Paused'], w: 92, tone: true},
        {label: 'Share of budget', w: 70, v: function (D, i) { return U.fPct(D.camps[i]); }}
      ]},
      {type: 'charts', title: 'Budget split', charts: [
        {kind: 'bars', title: 'Daily budget by campaign', sub: 'With share of the total', data: function (D, S) { return {items: S.t.camps.filter(function (c) { return c.status !== 'Paused'; }).map(function (c) { return {label: c.name || c.target, v: c.budget}; }), fmt: 'money', share: true}; }}
      ]}
    ]},
    {id: 'ppc-performance', title: 'PPC performance', badge: function (D) { return D.last ? U.fPct(D.last.acos) : ''; }, sections: [
      {type: 'form', title: 'Targets', fields: [
        {k: 'price', label: 'Selling price', kind: 'money'},
        {k: 'profitBefore', label: 'Profit per unit before ads', kind: 'money'},
        {k: 'target', label: 'Target ACoS', kind: 'pct'}
      ], stats: [
        {label: 'Break-even ACoS', v: function (D) { return U.fPct(D.beAcos); }}
      ]},
      {type: 'tiles', items: [
        {label: 'ACoS last week', sub: function (D) { return D.prev ? 'Week before: ' + U.fPct(D.prev.acos) : 'Ad spend over ad sales'; }, v: function (D) { return D.last ? U.fPct(D.last.acos) : ''; }, bad: function (D) { return D.last && D.beAcos != null && D.last.acos > D.beAcos; }},
        {label: 'TACoS last week', sub: 'Ad spend over total sales', v: function (D) { return D.last ? U.fPct(D.last.tacos) : ''; }},
        {label: 'Spend, last 4 weeks', sub: 'Sum of the latest four rows', v: function (D, S) { return S.t.weeks.length ? U.fMoney(D.spend4, 0) : ''; }},
        {label: 'ROAS last week', sub: 'Ad sales per unit of spend', v: function (D) { return D.last && D.last.roas != null ? U.fDec2(D.last.roas) : ''; }}
      ]},
      {type: 'charts', title: 'Trend', charts: [
        {kind: 'line', title: 'ACoS by week', sub: 'Against target and break-even', data: function (D, S) {
          return {pts: S.t.weeks.map(function (w, i) { return {label: w.week ? U.fDate(U.toUTC(w.week)).replace(/ \d{4}$/, '') : 'Week ' + (i + 1), y: D.weeks[i].acos}; }), refs: [{v: S.f.target != null ? S.f.target / 100 : null, label: 'Target'}, {v: D.beAcos, label: 'Break-even'}], fmt: 'pct'};
        }}
      ]},
      {type: 'table', k: 'weeks', title: 'Weekly results', help: 'One row per week from the advertising console. Total sales include organic orders, for TACoS.', add: 'Add a week', cols: [
        {k: 'week', label: 'Week starting', kind: 'date', w: 128},
        {k: 'spend', label: 'Spend', kind: 'money', w: 70},
        {k: 'sales', label: 'Ad sales', kind: 'money', w: 76},
        {k: 'orders', label: 'Ad orders', kind: 'int', w: 62},
        {k: 'clicks', label: 'Clicks', kind: 'int', w: 62},
        {k: 'impr', label: 'Impressions', kind: 'int', w: 84},
        {k: 'total', label: 'Total sales', kind: 'money', w: 80},
        {label: 'ACoS', w: 60, v: function (D, i) { return U.fPct(D.weeks[i].acos); }},
        {label: 'TACoS', w: 60, v: function (D, i) { return U.fPct(D.weeks[i].tacos); }},
        {label: 'CTR', w: 56, v: function (D, i) { return U.fPct(D.weeks[i].ctr); }},
        {label: 'Conv.', w: 56, v: function (D, i) { return U.fPct(D.weeks[i].cvr); }},
        {label: 'CPC', w: 56, v: function (D, i) { return U.fMoney(D.weeks[i].cpc, 2); }},
        {label: 'Status', w: 92, status: function (D, i) { return D.weeks[i].status; }}
      ]}
    ]},
    {id: 'search-terms', title: 'Search term harvest', badge: function (D) { return D.promote + D.negate ? D.promote + ' / ' + D.negate : ''; }, sections: [
      {type: 'form', title: 'Rules', help: 'Uses the target ACoS from the PPC performance tab.', fields: [
        {k: 'minOrders', label: 'Orders to promote', kind: 'int', def: 2},
        {k: 'minClicks', label: 'Clicks with no order to negate', kind: 'int', def: 15}
      ]},
      {type: 'tiles', items: [
        {label: 'Promote to exact', sub: 'Converting under target ACoS', v: function (D, S) { return S.t.terms.length ? String(D.promote) : ''; }},
        {label: 'Negate', sub: 'Enough clicks, no orders', v: function (D, S) { return S.t.terms.length ? String(D.negate) : ''; }},
        {label: 'Spend on terms to negate', sub: 'Money that bought no sales', v: function (D, S) { return S.t.terms.length ? U.fMoney(D.wasted, 0) : ''; }, bad: function (D) { return D.wasted > 0; }}
      ]},
      {type: 'table', k: 'terms', title: 'Search terms', help: 'Paste search terms from the search term report, usually from auto and broad campaigns.', add: 'Add a search term', cols: [
        {k: 'term', label: 'Search term', kind: 'text', w: 210},
        {k: 'camp', label: 'Campaign', kind: 'text', w: 140},
        {k: 'clicks', label: 'Clicks', kind: 'int', w: 62},
        {k: 'spend', label: 'Spend', kind: 'money', w: 68},
        {k: 'orders', label: 'Orders', kind: 'int', w: 60},
        {k: 'sales', label: 'Sales', kind: 'money', w: 72},
        {label: 'ACoS', w: 60, v: function (D, i) { return U.fPct(D.terms[i].acos); }},
        {label: 'Conv.', w: 56, v: function (D, i) { return U.fPct(D.terms[i].cvr); }},
        {label: 'Action', w: 136, status: function (D, i) { return D.terms[i].action; }}
      ]}
    ]},
    {id: 'bid-budget', title: 'Bid and budget calculator', badge: function (D) { return D.bBudget ? U.fMoney(D.bBudget, 0) + '/day' : ''; }, sections: [
      {type: 'form', title: 'Inputs', help: 'Uses the price and target ACoS from the PPC performance tab.', fields: [
        {k: 'cvr', label: 'Default conversion rate', kind: 'pct', note: 'Used when a keyword has no rate of its own'}
      ], stats: [
        {label: 'Max bid at default conversion', v: function (D) { return U.fMoney(D.maxBid, 2); }}
      ]},
      {type: 'tiles', items: [
        {label: 'Suggested daily budget', sub: 'Clicks per day times target bid, all keywords', v: function (D, S) { return S.t.bids.length ? U.fMoney(D.bBudget, 0) : ''; }},
        {label: 'Keywords to raise', sub: 'Current bid below target', v: function (D, S) { return S.t.bids.length ? String(D.raise) : ''; }},
        {label: 'Keywords to lower', sub: 'Current bid above target', v: function (D, S) { return S.t.bids.length ? String(D.lower) : ''; }}
      ]},
      {type: 'table', k: 'bids', title: 'Keyword bids', add: 'Add a keyword', cols: [
        {k: 'kw', label: 'Keyword', kind: 'text', w: 220},
        {k: 'match', label: 'Match', kind: 'sel', options: ['Exact', 'Phrase', 'Broad'], w: 86},
        {k: 'bid', label: 'Current bid', kind: 'money', w: 70},
        {k: 'clicks', label: 'Clicks per day', kind: 'num', w: 70},
        {k: 'cvr', label: 'Conv. %', kind: 'pct', w: 62},
        {label: 'Target bid', w: 70, v: function (D, i) { return U.fMoney(D.bids[i].tbid, 2); }},
        {label: 'Change', w: 66, v: function (D, i) { var c = D.bids[i].chg; return c == null ? '' : U.signed(U.fPct(c), c); }},
        {label: 'Daily spend at target', w: 80, v: function (D, i) { return U.fMoney(D.bids[i].spend, 2); }, foot: function (D) { return U.fMoney(D.bBudget, 0); }},
        {label: 'Action', w: 86, status: function (D, i) { return D.bids[i].action; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Daily budget', v: function (D) { return U.fMoney(D.cDaily, 0); }},
    {label: 'Break-even ACoS', v: function (D) { return U.fPct(D.beAcos) || 'No data'; }},
    {label: 'TACoS last week', v: function (D) { return D.last ? U.fPct(D.last.tacos) : 'No data'; }},
    {label: 'Terms to negate', v: function (D) { return {text: String(D.negate), tone: D.negate ? 'warn' : ''}; }},
    {label: 'Suggested daily budget', v: function (D) { return U.fMoney(D.bBudget, 0) || 'No data'; }}
  ],
  headline: function (D) {
    if (!D.last) return {unit: 'Add a week of results'};
    return {num: U.fPct(D.last.acos), unit: 'ACoS, ' + U.fPct(D.last.tacos) + ' TACoS', status: D.last.status, note: D.beAcos != null ? 'break-even ' + U.fPct(D.beAcos) : ''};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleBrand'; S.biz.marketplace = 'Amazon.com (US)';
    S.t.camps = W.rows(['name', 'type', 'target', 'goal', 'budget', 'bid', 'kws', 'status'], [
      ['SPK20 | SP | Auto', 'Sponsored Products', 'Auto', 'Research', 25, 0.9, null, 'Live'],
      ['SPK20 | SP | Exact | Core', 'Sponsored Products', 'Exact', 'Rank', 45, 1.45, 8, 'Live'],
      ['SPK20 | SP | Phrase', 'Sponsored Products', 'Phrase', 'Research', 15, 1.1, 12, 'Live'],
      ['SPK20 | SP | Competitor ASINs', 'Sponsored Products', 'Product targeting', 'Profit', 15, 0.95, 20, 'Live'],
      ['Brand | SB | Video', 'Sponsored Brands', 'Exact', 'Defend brand', 10, 0.8, 3, 'Planned'],
      ['SPK20 | SD | Retargeting', 'Sponsored Display', 'Category', 'Profit', 8, 0.6, null, 'Paused']
    ]);
    S.f.price = 49.99; S.f.profitBefore = 18.2; S.f.target = 25;
    S.t.weeks = W.rows(['week', 'spend', 'sales', 'orders', 'clicks', 'impr', 'total'], [
      ['2026-09-28', 980, 2150, 43, 760, 98000, 5200],
      ['2026-10-05', 910, 2480, 50, 720, 102000, 5900],
      ['2026-10-12', 880, 2690, 54, 690, 99500, 6400],
      ['2026-10-19', 940, 3050, 61, 705, 108000, 7100],
      ['2026-10-26', 1020, 3600, 72, 760, 121000, 8300],
      ['2026-11-02', 1150, 3880, 78, 840, 134000, 9100]
    ]);
    S.t.terms = W.rows(['term', 'camp', 'clicks', 'spend', 'orders', 'sales'], [
      ['waterproof speaker for shower', 'SPK20 | SP | Auto', 42, 37.8, 6, 299.9],
      ['bluetooth speaker with 24 hour battery', 'SPK20 | SP | Phrase', 18, 19.8, 3, 149.9],
      ['jbl flip 6', 'SPK20 | SP | Auto', 31, 29.5, 0, 0],
      ['speaker for kids', 'SPK20 | SP | Phrase', 22, 21.1, 0, 0],
      ['portable speaker loud', 'SPK20 | SP | Auto', 26, 31.2, 2, 99.9],
      ['outdoor bluetooth speaker', 'SPK20 | SP | Auto', 9, 8.9, 1, 49.9]
    ]);
    S.f.cvr = 9;
    S.t.bids = W.rows(['kw', 'match', 'bid', 'clicks', 'cvr'], [
      ['bluetooth speaker', 'Exact', 1.85, 40, 6],
      ['portable bluetooth speaker', 'Exact', 1.4, 28, 8],
      ['waterproof speaker', 'Exact', 0.95, 22, 11],
      ['shower speaker', 'Exact', 0.7, 15, 14],
      ['speaker 24 hour battery', 'Phrase', 0.8, 10, null]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {}, tgt = W.isNum(f.target) ? f.target / 100 : null;
    var tot = W.sum(S.t.camps.filter(function (c) { return c.status !== 'Paused'; }).map(function (c) { return c.budget; }));
    D.cDaily = tot;
    D.camps = S.t.camps.map(function (c) { return c.status !== 'Paused' && tot > 0 && W.isNum(c.budget) ? c.budget / tot : null; });
    D.cLive = S.t.camps.filter(function (c) { return c.status === 'Live'; }).length;

    D.beAcos = f.price > 0 && W.isNum(f.profitBefore) ? f.profitBefore / f.price : null;
    D.weeks = S.t.weeks.map(function (w) {
      var acos = W.ratio(w.spend, w.sales);
      var status = acos == null ? '' : tgt != null && acos <= tgt ? 'On track' : D.beAcos != null && acos <= D.beAcos ? 'Watch' : D.beAcos != null ? 'Loss' : '';
      return {acos: acos, tacos: W.ratio(w.spend, w.total), ctr: W.ratio(w.clicks, w.impr), cvr: W.ratio(w.orders, w.clicks), cpc: W.ratio(w.spend, w.clicks), roas: W.ratio(w.sales, w.spend), status: status};
    });
    var withData = D.weeks.map(function (w, i) { return {w: w, r: S.t.weeks[i]}; }).filter(function (o) { return o.w.acos != null; });
    withData.sort(function (a, b) { return (a.r.week || '') < (b.r.week || '') ? -1 : 1; });
    D.last = withData.length ? withData[withData.length - 1].w : null;
    D.prev = withData.length > 1 ? withData[withData.length - 2].w : null;
    D.spend4 = W.sum(withData.slice(-4).map(function (o) { return o.r.spend; }));

    var mo = n0(f.minOrders) || 1, mc = n0(f.minClicks) || 1;
    D.terms = S.t.terms.map(function (t) {
      var acos = W.ratio(t.spend, t.sales), cvr = W.ratio(t.orders, t.clicks);
      var action = !t.term ? '' : n0(t.orders) >= mo && acos != null && (tgt == null || acos <= tgt) ? 'Promote to exact' : n0(t.orders) === 0 && n0(t.clicks) >= mc ? 'Negate' : n0(t.orders) > 0 && tgt != null && acos > tgt ? 'Lower bid' : 'Keep collecting';
      return {acos: acos, cvr: cvr, action: action};
    });
    D.promote = D.terms.filter(function (t) { return t.action === 'Promote to exact'; }).length;
    D.negate = D.terms.filter(function (t) { return t.action === 'Negate'; }).length;
    D.wasted = W.sum(S.t.terms.map(function (t, i) { return D.terms[i].action === 'Negate' ? t.spend : 0; }));

    D.maxBid = f.price > 0 && tgt != null && W.isNum(f.cvr) ? f.price * tgt * f.cvr / 100 : null;
    D.bids = S.t.bids.map(function (b) {
      var cvr = W.isNum(b.cvr) ? b.cvr : f.cvr;
      if (!(f.price > 0) || tgt == null || !W.isNum(cvr)) return {action: ''};
      var tbid = f.price * tgt * cvr / 100;
      var chg = b.bid > 0 ? tbid / b.bid - 1 : null;
      return {tbid: tbid, chg: chg, spend: W.isNum(b.clicks) ? b.clicks * tbid : null, action: chg == null ? '' : chg > 0.05 ? 'Raise' : chg < -0.05 ? 'Lower' : 'Keep'};
    });
    D.bBudget = W.sum(D.bids.map(function (b) { return b.spend; }));
    D.raise = D.bids.filter(function (b) { return b.action === 'Raise'; }).length;
    D.lower = D.bids.filter(function (b) { return b.action === 'Lower'; }).length;
    return D;
  }
};
})();
