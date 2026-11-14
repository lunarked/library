window.SPEC = {
  app: 'product-selection',
  title: 'Product Selection',
  desc: 'Score product ideas, map a niche and its competitors, and run a go or no-go check before you commit cash.',
  notice: 'Every tab is filled with sample data for consumer electronics ideas. Type over it, or start blank.',
  notes: [
    'Each idea is scored 1 to 5 on demand, competition, margin, differentiation and risk, then weighted into a score out of 100. 70 and above is Strong, 55 to 69 Fair, below 55 Weak.',
    'Demand scores from estimated monthly units of the top sellers, competition from their average review count, margin from price minus landed cost and Amazon fees. Change the weights to match how you decide.',
    'Monthly units in the competitor tab are estimates from your research tool. Treat revenue and share as a sizing guide, not exact sales.'
  ],
  tabs: [
    {id: 'opportunity-scorecard', title: 'Opportunity scorecard', badge: function (D) { return D.ideas.length ? D.strong + ' strong' : ''; }, sections: [
      {type: 'form', title: 'Weights', help: 'How much each factor counts. They are rescaled to 100, so only the proportions matter.', fields: [
        {k: 'wDemand', label: 'Demand', kind: 'pct', def: 25},
        {k: 'wComp', label: 'Competition', kind: 'pct', def: 20},
        {k: 'wMargin', label: 'Margin', kind: 'pct', def: 30},
        {k: 'wDiff', label: 'Differentiation', kind: 'pct', def: 15},
        {k: 'wRisk', label: 'Risk', kind: 'pct', def: 10},
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['$', '€', '£']}
      ]},
      {type: 'tiles', items: [
        {label: 'Ideas scored', sub: 'Rows with a name and a price', v: function (D, U) { return D.ideas.length ? String(D.scored) : ''; }},
        {label: 'Best idea', sub: function (D) { return D.best ? D.bestName : 'Highest weighted score'; }, v: function (D) { return D.best ? WBU.fInt(D.best.score) + ' / 100' : ''; }},
        {label: 'Strong ideas', sub: 'Score of 70 or more', v: function (D) { return D.ideas.length ? String(D.strong) : ''; }},
        {label: 'Average margin', sub: 'Before advertising, across scored ideas', v: function (D) { return WBU.fPct(D.avgMargin); }}
      ]},
      {type: 'table', k: 'ideas', title: 'Product ideas', help: 'Demand is the average monthly units of the top 10 sellers. Competition is their average review count. Differentiation is your own 1 to 5 view of how clearly you can be better.', add: 'Add an idea', cols: [
        {k: 'name', label: 'Idea', kind: 'text', w: 170, ph: 'Product idea'},
        {k: 'price', label: 'Price', kind: 'money', w: 70},
        {k: 'landed', label: 'Landed cost', kind: 'money', w: 70},
        {k: 'fees', label: 'Amazon fees', kind: 'money', w: 70},
        {k: 'units', label: 'Top 10 units / month', kind: 'int', w: 78},
        {k: 'reviews', label: 'Top 10 avg reviews', kind: 'int', w: 74},
        {k: 'diff', label: 'Differ\u00ADentiation', kind: 'sel', options: ['', '1', '2', '3', '4', '5'], w: 64},
        {k: 'risk', label: 'Risk', kind: 'sel', options: ['', 'Low', 'Medium', 'High'], w: 84},
        {label: 'Margin', w: 62, v: function (D, i) { return WBU.fPct(D.ideas[i].margin); }, tone: function (D, i) { var m = D.ideas[i].margin; return m != null && m < 0.15 ? 'bad' : ''; }},
        {label: 'Score', w: 56, v: function (D, i) { return WBU.fInt(D.ideas[i].score); }},
        {label: 'Rating', w: 92, status: function (D, i) { return D.ideas[i].status; }}
      ]},
      {type: 'charts', title: 'Scores', charts: [
        {kind: 'bars', title: 'Weighted score by idea', sub: 'Out of 100', data: function (D, S) { return {items: S.t.ideas.map(function (r, i) { return {label: r.name || 'Idea ' + (i + 1), v: D.ideas[i].score}; }), fmt: 'int'}; }}
      ]}
    ]},
    {id: 'competitor-tracker', title: 'Competitor and niche tracker', badge: function (D) { return D.comps.length ? WBU.fCompact(D.nicheRev) : ''; }, sections: [
      {type: 'form', title: 'Niche', fields: [
        {k: 'niche', label: 'Main keyword', kind: 'text', def: ''},
        {k: 'yourPrice', label: 'Your planned price', kind: 'money'}
      ], stats: [
        {label: 'Your price vs niche average', v: function (D, S) { return D.avgPrice && WBU.isNum(S.f.yourPrice) ? WBU.signed(WBU.fPct(S.f.yourPrice / D.avgPrice - 1), S.f.yourPrice - D.avgPrice) : ''; }}
      ]},
      {type: 'tiles', items: [
        {label: 'Niche revenue per month', sub: 'Price times estimated units, all listed competitors', v: function (D) { return D.comps.length ? WBU.fMoney(D.nicheRev, 0) : ''; }},
        {label: 'Average price', sub: 'Weighted by units sold', v: function (D) { return WBU.fMoney(D.avgPrice, 2); }},
        {label: 'Average rating', sub: 'Weighted by units sold', v: function (D) { return WBU.fDec1(D.avgRating); }},
        {label: 'Top 3 share', sub: 'Revenue share of the three largest sellers', v: function (D) { return WBU.fPct(D.top3); }, bad: function (D) { return D.top3 > 0.6; }}
      ]},
      {type: 'table', k: 'comps', title: 'Competitors', help: 'One row per competing listing. Reviews per month shows how fast each one is still growing.', add: 'Add a competitor', cols: [
        {k: 'brand', label: 'Brand', kind: 'text', w: 120},
        {k: 'asin', label: 'ASIN', kind: 'text', w: 104},
        {k: 'price', label: 'Price', kind: 'money', w: 70},
        {k: 'rating', label: 'Rating', kind: 'num', w: 56},
        {k: 'reviews', label: 'Reviews', kind: 'int', w: 70},
        {k: 'units', label: 'Units / month', kind: 'int', w: 70},
        {k: 'launched', label: 'Launched', kind: 'date', w: 128},
        {k: 'notes', label: 'Weak spots in their reviews', kind: 'text', w: 190},
        {label: 'Revenue / month', w: 84, v: function (D, i) { return WBU.fMoney(D.comps[i].rev, 0); }, foot: function (D) { return WBU.fMoney(D.nicheRev, 0); }},
        {label: 'Share', w: 56, v: function (D, i) { return WBU.fPct(D.comps[i].share); }},
        {label: 'Reviews / month', w: 66, v: function (D, i) { return WBU.fInt(D.comps[i].velocity); }}
      ]},
      {type: 'charts', title: 'Who holds the niche', charts: [
        {kind: 'bars', title: 'Revenue per month by competitor', sub: 'With share of niche revenue', data: function (D, S) { return {items: S.t.comps.map(function (r, i) { return {label: r.brand || 'Competitor ' + (i + 1), v: D.comps[i].rev}; }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); }), fmt: 'money', share: true}; }}
      ]}
    ]},
    {id: 'go-no-go', title: 'Launch go or no-go', badge: function (D) { return D.decision.toLowerCase(); }, sections: [
      {type: 'note', title: 'Decision', v: function (D) { return [D.decision, D.reason]; }},
      {type: 'form', title: 'Unit economics', fields: [
        {k: 'gPrice', label: 'Selling price', kind: 'money'},
        {k: 'gLanded', label: 'Landed cost per unit', kind: 'money'},
        {k: 'gFees', label: 'Amazon fees per unit', kind: 'money', note: 'Referral plus fulfillment'},
        {k: 'gPpc', label: 'Ad cost per unit sold', kind: 'money', note: 'Expected average in year one'},
        {k: 'gUnits', label: 'Monthly units', kind: 'int', note: 'After the launch period'}
      ]},
      {type: 'form', title: 'Cash and thresholds', fields: [
        {k: 'gFirst', label: 'First order units', kind: 'int'},
        {k: 'gFixed', label: 'One-off launch costs', kind: 'money', note: 'Samples, photos, certification, Vine'},
        {k: 'gCash', label: 'Cash available', kind: 'money'},
        {k: 'gMinMargin', label: 'Minimum margin after ads', kind: 'pct', def: 15},
        {k: 'gMaxPayback', label: 'Maximum payback', kind: 'num', def: 6, note: 'Months'}
      ]},
      {type: 'tiles', items: [
        {label: 'Profit per unit', sub: 'After landed cost, fees and ads', v: function (D) { return WBU.fMoney(D.unitProfit, 2); }, bad: function (D) { return D.unitProfit <= 0; }},
        {label: 'Margin after ads', sub: 'Profit per unit over price', v: function (D) { return WBU.fPct(D.marginAds); }, bad: function (D) { return D.checks[0] === 'Fail'; }},
        {label: 'Cash needed', sub: 'First order plus one-off costs', v: function (D) { return WBU.fMoney(D.cashNeed, 0); }, bad: function (D) { return D.checks[2] === 'Fail'; }},
        {label: 'Payback', sub: 'Months of profit to earn the cash back', v: function (D) { return D.payback == null ? '' : WBU.fDec1(D.payback) + ' months'; }, bad: function (D) { return D.checks[1] === 'Fail'; }},
        {label: 'Profit in year one', sub: 'Twelve months of profit minus cash needed', v: function (D) { return WBU.fMoney(D.year1, 0); }, bad: function (D) { return D.year1 < 0; }}
      ]},
      {type: 'table', k: 'gates', title: 'Checks', help: 'The first three rows are calculated. Mark each of the others Pass or Fail as you confirm it.', fixed: ['Margin after ads meets the minimum', 'Payback within the maximum', 'Cash needed within cash available', 'No patent or trademark conflict', 'Certifications achievable (FCC, CE, UN38.3)', 'Supplier sample approved', 'Category not restricted or gated', 'Ships as standard size'], cols: [
        {fixedLabel: true, label: 'Check', w: 320, num: false},
        {k: 'result', label: 'Your result', kind: 'sel', options: ['Open', 'Pass', 'Fail'], tone: true, w: 110, auto: function (i) { return i < 3; }},
        {k: 'notes', label: 'Notes', kind: 'text', w: 260},
        {label: 'Status', w: 96, status: function (D, i) { return D.checks[i]; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Ideas scored', v: function (D) { return String(D.scored); }},
    {label: 'Best idea', v: function (D) { return D.best ? D.bestName : 'None yet'; }},
    {label: 'Niche revenue per month', v: function (D) { return D.comps.length ? WBU.fMoney(D.nicheRev, 0) : 'No data'; }},
    {label: 'Profit per unit', v: function (D) { return WBU.fMoney(D.unitProfit, 2) || 'No data'; }},
    {label: 'Payback', v: function (D) { return D.payback == null ? 'No data' : WBU.fDec1(D.payback) + ' months'; }}
  ],
  headCap: 'Best opportunity',
  headline: function (D) {
    return {num: D.best ? WBU.fInt(D.best.score) : null, unit: D.best ? 'best score, ' + D.bestName : 'Score an idea to see the best one', status: D.decision, note: 'launch decision'};
  },
  sample: function (S, U) {
    S.biz.brand = 'ExampleBrand'; S.biz.marketplace = 'Amazon.com (US)';
    S.t.ideas = U.rows(['name', 'price', 'landed', 'fees', 'units', 'reviews', 'diff', 'risk'], [
      ['Magnetic power bank 10,000 mAh', 34.99, 9.8, 9.6, 2400, 1800, '3', 'High'],
      ['Bluetooth sleep headband', 29.99, 7.2, 8.9, 1600, 650, '4', 'Medium'],
      ['USB-C hub 7-in-1', 39.99, 13.5, 10.4, 3100, 4200, '2', 'Low'],
      ['Clip-on wireless lavalier mic', 45.99, 11.9, 11.6, 1200, 380, '4', 'Medium'],
      ['Smart plug 4-pack', 24.99, 9.1, 8.2, 5200, 9800, '1', 'Medium']
    ]);
    S.f.niche = 'bluetooth sleep headband'; S.f.yourPrice = 29.99;
    S.t.comps = U.rows(['brand', 'asin', 'price', 'rating', 'reviews', 'units', 'launched', 'notes'], [
      ['Perytong', 'B07SHBQY7Z', 19.99, 4.3, 24500, 6200, '2019-06-01', 'Speaker shifts at night'],
      ['MUSICOZY', 'B08K3S3VP1', 22.99, 4.2, 11800, 3900, '2020-09-15', 'Battery fades after months'],
      ['LC-dolida', 'B07RHDTT8P', 26.99, 4.4, 9200, 2100, '2019-04-20', 'Too warm for summer'],
      ['TOPOINT', 'B0B4D2KQ1R', 29.99, 4.1, 1600, 900, '2022-07-01', 'Pairing drops'],
      ['Generic newcomer', 'B0CXW1LMN2', 24.99, 4.0, 240, 450, '2025-11-01', 'Thin fabric']
    ]);
    S.f.gPrice = 29.99; S.f.gLanded = 7.2; S.f.gFees = 8.9; S.f.gPpc = 4.5; S.f.gUnits = 450;
    S.f.gFirst = 1500; S.f.gFixed = 3500; S.f.gCash = 25000;
    S.t.gates[3].result = 'Pass'; S.t.gates[4].result = 'Pass'; S.t.gates[5].result = 'Open'; S.t.gates[6].result = 'Pass'; S.t.gates[7].result = 'Pass';
    S.t.gates[5].notes = 'Second sample due next week';
  },
  derive: function (S, today, U) {
    var n0 = U.n0, D = {}, f = S.f;
    var w = [f.wDemand, f.wComp, f.wMargin, f.wDiff, f.wRisk].map(n0), wsum = U.sum(w) || 1;
    var band = function (v, cuts, up) { if (!U.isNum(v)) return null; for (var i = 0; i < cuts.length; i++) if (up ? v >= cuts[i] : v <= cuts[i]) return 5 - i; return 1; };
    D.ideas = S.t.ideas.map(function (r) {
      var margin = U.isNum(r.price) && r.price > 0 ? (r.price - n0(r.landed) - n0(r.fees)) / r.price : null;
      var parts = [band(r.units, [3000, 1500, 700, 300], true), band(r.reviews, [200, 500, 1000, 3000], false), band(margin, [0.35, 0.28, 0.2, 0.12], true), r.diff ? Number(r.diff) : null, r.risk === 'Low' ? 5 : r.risk === 'Medium' ? 3 : r.risk === 'High' ? 1 : null];
      var ok = margin != null && String(r.name || '').trim() !== '';
      var score = ok ? U.roundTo(parts.reduce(function (a, p, j) { return a + n0(p) / 5 * w[j]; }, 0) / wsum * 100, 0) : null;
      return {margin: margin, score: score, status: score == null ? '' : score >= 70 ? 'Strong' : score >= 55 ? 'Fair' : 'Weak'};
    });
    var scored = D.ideas.filter(function (x) { return x.score != null; });
    D.scored = scored.length;
    D.strong = scored.filter(function (x) { return x.score >= 70; }).length;
    D.avgMargin = U.mean(scored.map(function (x) { return x.margin; }));
    var bi = -1;
    D.ideas.forEach(function (x, i) { if (x.score != null && (bi < 0 || x.score > D.ideas[bi].score)) bi = i; });
    D.best = bi >= 0 ? D.ideas[bi] : null;
    D.bestName = bi >= 0 ? S.t.ideas[bi].name : '';

    var revs = S.t.comps.map(function (r) { return U.isNum(r.price) && U.isNum(r.units) ? r.price * r.units : null; });
    D.nicheRev = U.sum(revs);
    var units = U.sum(S.t.comps.map(function (r) { return r.units; }));
    D.comps = S.t.comps.map(function (r, i) {
      var age = r.launched ? (today - U.toUTC(r.launched)) / U.DAY / 30.44 : null;
      return {rev: revs[i], share: D.nicheRev > 0 && revs[i] != null ? revs[i] / D.nicheRev : null, velocity: age && age > 0 && U.isNum(r.reviews) ? r.reviews / age : null};
    });
    var wavg = function (k) { return units > 0 ? U.sum(S.t.comps.map(function (r) { return U.isNum(r[k]) && U.isNum(r.units) ? r[k] * r.units : 0; })) / units : null; };
    D.avgPrice = wavg('price'); D.avgRating = wavg('rating');
    var sorted = revs.filter(U.isNum).sort(function (a, b) { return b - a; });
    D.top3 = D.nicheRev > 0 ? U.sum(sorted.slice(0, 3)) / D.nicheRev : null;

    var has = U.isNum(f.gPrice) && f.gPrice > 0;
    D.unitProfit = has ? f.gPrice - n0(f.gLanded) - n0(f.gFees) - n0(f.gPpc) : null;
    D.marginAds = has ? D.unitProfit / f.gPrice : null;
    D.cashNeed = n0(f.gFirst) * n0(f.gLanded) + n0(f.gFixed);
    D.monthly = D.unitProfit != null && U.isNum(f.gUnits) ? D.unitProfit * f.gUnits : null;
    D.payback = D.monthly > 0 ? D.cashNeed / D.monthly : null;
    D.year1 = D.monthly != null ? D.monthly * 12 - D.cashNeed : null;
    var auto = [
      D.marginAds == null ? 'Open' : D.marginAds * 100 >= n0(f.gMinMargin) ? 'Pass' : 'Fail',
      D.monthly == null ? 'Open' : D.payback != null && D.payback <= n0(f.gMaxPayback) ? 'Pass' : 'Fail',
      !U.isNum(f.gCash) || !has ? 'Open' : D.cashNeed <= f.gCash ? 'Pass' : 'Fail'
    ];
    D.checks = S.t.gates.map(function (g, i) { return i < 3 ? auto[i] : g.result || 'Open'; });
    var fails = D.checks.filter(function (c) { return c === 'Fail'; }).length, open = D.checks.filter(function (c) { return c === 'Open'; }).length;
    D.decision = fails ? 'No go' : open ? 'Review' : 'Go';
    D.reason = fails ? fails + (fails === 1 ? ' check fails. ' : ' checks fail. ') + 'Fix the red rows below or drop the product.' : open ? open + (open === 1 ? ' check is' : ' checks are') + ' still open. Confirm ' + (open === 1 ? 'it' : 'them') + ' before you place the first order.' : 'Every check passes. The numbers support placing the first order.';
    return D;
  }
};
