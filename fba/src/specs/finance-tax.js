(function () {
var U;
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function monthLabel(start, i) {
  var t = U.toUTC(start);
  if (t == null) return 'Month ' + (i + 1);
  var d = new Date(t);
  var m = d.getUTCMonth() + i, y = d.getUTCFullYear() + Math.floor(m / 12);
  return MON[((m % 12) + 12) % 12] + ' ' + y;
}
window.SPEC = {
  app: 'finance-tax',
  title: 'Finance and Tax',
  desc: 'See profit by SKU, reconcile Amazon payouts, forecast cash with PO payments, track VAT and sales tax filings, and value inventory at weighted average cost.',
  notice: 'Every tab is filled with sample data for a small electronics brand. Type over it, or start blank.',
  headCap: 'Contribution',
  tones: {good: ['Profitable'], warn: ['Thin margin']},
  notes: [
    'Contribution is revenue minus product cost, Amazon fees, storage, advertising, returns and other variable costs. It is what each SKU adds before overheads and tax.',
    'Where a marketplace collects the tax for you, such as US sales tax under marketplace facilitator laws, the row shows nothing due. EU and UK VAT on your own sales still has to be filed by you.',
    'Inventory is valued at weighted average cost: opening value plus purchases, divided by opening units plus purchased units. Cost of goods sold is units sold at that average. This is a planning view; your accountant\'s figures rule.'
  ],
  tabs: [
    {id: 'sku-pnl', title: 'SKU profit and loss', badge: function (D) { return D.pRev ? U.fPct(D.pMargin) : ''; }, sections: [
      {type: 'form', title: 'Period', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['$', '€', '£']},
        {k: 'period', label: 'Period', kind: 'text', def: ''}
      ]},
      {type: 'tiles', items: [
        {label: 'Revenue', sub: 'All SKUs', v: function (D) { return D.pRev ? U.fMoney(D.pRev, 0) : ''; }},
        {label: 'Contribution', sub: 'Before overheads and tax', v: function (D) { return D.pRev ? U.fMoney(D.pContrib, 0) : ''; }, bad: function (D) { return D.pContrib < 0; }},
        {label: 'Contribution margin', sub: 'Contribution over revenue', v: function (D) { return D.pRev ? U.fPct(D.pMargin) : ''; }},
        {label: 'TACoS', sub: 'Advertising over revenue', v: function (D) { return D.pRev ? U.fPct(D.pTacos) : ''; }},
        {label: 'Amazon fee share', sub: 'Referral, FBA and storage over revenue', v: function (D) { return D.pRev ? U.fPct(D.pFeeShare) : ''; }}
      ]},
      {type: 'table', k: 'pnl', title: 'Profit and loss by SKU', help: 'Take revenue and fees from the payments date range report for the period.', add: 'Add a SKU', cols: [
        {k: 'sku', label: 'SKU', kind: 'text', w: 136},
        {k: 'units', label: 'Units', kind: 'int', w: 62, foot: 'sum'},
        {k: 'rev', label: 'Revenue', kind: 'money', w: 80, foot: 'sum'},
        {k: 'cogs', label: 'Cost per unit', kind: 'money', w: 66},
        {k: 'referral', label: 'Referral fees', kind: 'money', w: 74, foot: 'sum'},
        {k: 'fba', label: 'FBA fees', kind: 'money', w: 74, foot: 'sum'},
        {k: 'storage', label: 'Storage', kind: 'money', w: 66, foot: 'sum'},
        {k: 'ads', label: 'Advertising', kind: 'money', w: 74, foot: 'sum'},
        {k: 'returns', label: 'Refunds and returns', kind: 'money', w: 78, foot: 'sum'},
        {k: 'other', label: 'Other', kind: 'money', w: 62, foot: 'sum'},
        {label: 'Contribution', w: 84, v: function (D, i) { return U.fMoney(D.pnl[i].contrib, 0); }, tone: function (D, i) { return D.pnl[i].contrib < 0 ? 'bad' : ''; }, foot: function (D) { return U.fMoney(D.pContrib, 0); }},
        {label: 'Margin', w: 60, v: function (D, i) { return U.fPct(D.pnl[i].margin); }},
        {label: 'Status', w: 100, status: function (D, i) { return D.pnl[i].status; }}
      ]},
      {type: 'charts', title: 'Where profit comes from', charts: [
        {kind: 'bars', title: 'Contribution by SKU', sub: 'SKUs with a positive contribution', data: function (D, S) { return {items: S.t.pnl.map(function (r, i) { return {label: r.sku || 'SKU ' + (i + 1), v: D.pnl[i].contrib}; }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); }), fmt: 'money', share: true}; }}
      ]}
    ]},
    {id: 'settlements', title: 'Settlement reconciliation', badge: function (D) { return D.sBad ? D.sBad + ' to check' : ''; }, sections: [
      {type: 'form', title: 'Tolerance', fields: [{k: 'tol', label: 'Allowed difference', kind: 'money', def: 5}]},
      {type: 'tiles', items: [
        {label: 'Settlements checked', sub: 'Rows with a deposit', v: function (D, S) { return S.t.settle.length ? String(D.sN) : ''; }},
        {label: 'Discrepancies', sub: 'Outside your tolerance', v: function (D, S) { return S.t.settle.length ? String(D.sBad) : ''; }, bad: function (D) { return D.sBad > 0; }},
        {label: 'Net difference', sub: 'Deposits minus expected payouts', v: function (D, S) { return S.t.settle.length ? U.signed(U.fMoney(D.sDiff, 2), D.sDiff) : ''; }},
        {label: 'Reserve still held', sub: 'Latest settlement', v: function (D) { return U.fMoney(D.sReserve, 0); }}
      ]},
      {type: 'table', k: 'settle', title: 'Settlements', help: 'Your own sales record against what Amazon settled and paid. Expected payout is settled sales minus fees and refunds, plus reimbursements, minus the reserve held back.', add: 'Add a settlement', cols: [
        {k: 'start', label: 'From', kind: 'date', w: 128},
        {k: 'end', label: 'To', kind: 'date', w: 128},
        {k: 'mine', label: 'Your sales record', kind: 'money', w: 76},
        {k: 'sales', label: 'Settled sales', kind: 'money', w: 76},
        {k: 'fees', label: 'Fees', kind: 'money', w: 76},
        {k: 'refunds', label: 'Refunds', kind: 'money', w: 72},
        {k: 'reimb', label: 'Reimburse\u00ADments', kind: 'money', w: 80},
        {k: 'reserve', label: 'Reserve held', kind: 'money', w: 72},
        {k: 'deposit', label: 'Deposit', kind: 'money', w: 76},
        {label: 'Sales gap', w: 76, v: function (D, i) { var g = D.settle[i].gap; return g == null ? '' : U.signed(U.fMoney(g, 2), g); }},
        {label: 'Expected payout', w: 84, v: function (D, i) { return U.fMoney(D.settle[i].exp, 2); }},
        {label: 'Difference', w: 76, v: function (D, i) { var d = D.settle[i].diff; return d == null ? '' : U.signed(U.fMoney(d, 2), d); }},
        {label: 'Status', w: 104, status: function (D, i) { return D.settle[i].status; }}
      ]}
    ]},
    {id: 'cash-flow', title: 'Cash flow forecast', badge: function (D) { return D.cShort ? D.cShort + ' short' : ''; }, sections: [
      {type: 'form', title: 'Starting point', fields: [
        {k: 'cStart', label: 'First month', kind: 'date', note: 'Any day in the month'},
        {k: 'cOpen', label: 'Opening cash', kind: 'money'},
        {k: 'cMin', label: 'Minimum cash to keep', kind: 'money'}
      ]},
      {type: 'tiles', items: [
        {label: 'Lowest balance', sub: function (D) { return D.cLowMonth ? 'In ' + D.cLowMonth : 'Lowest closing balance'; }, v: function (D) { return U.fMoney(D.cLow, 0); }, bad: function (D, S) { return D.cLow < U.n0(S.f.cMin); }},
        {label: 'Months below minimum', sub: 'Closing balance under your floor', v: function (D) { return String(D.cShort); }, bad: function (D) { return D.cShort > 0; }},
        {label: 'Closing balance', sub: 'End of the 12 months', v: function (D) { return U.fMoney(D.cEnd, 0); }},
        {label: 'PO payments', sub: 'Deposits and balances, 12 months', v: function (D) { return U.fMoney(D.cPo, 0); }}
      ]},
      {type: 'charts', title: 'Balance', charts: [
        {kind: 'line', title: 'Closing cash by month', sub: 'Against your minimum', data: function (D, S) { return {pts: D.cash.map(function (c, i) { return {label: monthLabel(S.f.cStart, i), y: c.close}; }), refs: [{v: S.f.cMin, label: 'Minimum'}], fmt: 'money', area: true}; }}
      ]},
      {type: 'table', k: 'cash', title: 'Monthly cash', help: 'Amazon payouts are net of fees and ads billed against your balance. Put PO deposits and balances in the month you pay them.', fixed: ['', '', '', '', '', '', '', '', '', '', '', ''], cols: [
        {label: 'Month', w: 86, num: false, v: function (D, i, S) { return monthLabel(S.f.cStart, i); }},
        {k: 'payout', label: 'Amazon payouts', kind: 'money', w: 86},
        {k: 'otherIn', label: 'Other income', kind: 'money', w: 74},
        {k: 'dep', label: 'PO deposits', kind: 'money', w: 80},
        {k: 'bal', label: 'PO balances', kind: 'money', w: 80},
        {k: 'freight', label: 'Freight and duty', kind: 'money', w: 80},
        {k: 'opex', label: 'Running costs', kind: 'money', w: 80},
        {k: 'tax', label: 'Tax payments', kind: 'money', w: 74},
        {label: 'Net', w: 80, v: function (D, i) { var n = D.cash[i].net; return U.signed(U.fMoney(n, 0), n); }},
        {label: 'Closing cash', w: 90, v: function (D, i) { return U.fMoney(D.cash[i].close, 0); }, tone: function (D, i, S) { return D.cash[i].close < U.n0(S.f.cMin) ? 'bad' : ''; }}
      ]}
    ]},
    {id: 'vat-sales-tax', title: 'VAT and sales tax', badge: function (D) { return D.vOver ? D.vOver + ' overdue' : D.vSoon ? D.vSoon + ' due' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Tax to pay', sub: 'Open filings where you collect the tax', v: function (D, S) { return S.t.vat.length ? U.fMoney(D.vDue, 0) : ''; }},
        {label: 'Filings due in 30 days', sub: 'Not yet filed', v: function (D, S) { return S.t.vat.length ? String(D.vSoon) : ''; }},
        {label: 'Overdue', sub: 'Past the due date and not filed', v: function (D, S) { return S.t.vat.length ? String(D.vOver) : ''; }, bad: function (D) { return D.vOver > 0; }}
      ]},
      {type: 'table', k: 'vat', title: 'Filings', help: 'One row per filing period per jurisdiction. Mark Marketplace collects as Yes where Amazon collects and remits the tax.', add: 'Add a filing', cols: [
        {k: 'where', label: 'Jurisdiction', kind: 'text', w: 104},
        {k: 'type', label: 'Tax', kind: 'sel', options: ['VAT', 'Sales tax', 'GST'], w: 90},
        {k: 'reg', label: 'Registration', kind: 'text', w: 106},
        {k: 'freq', label: 'Frequency', kind: 'sel', options: ['Monthly', 'Quarterly', 'Yearly'], w: 100},
        {k: 'end', label: 'Period end', kind: 'date', w: 128},
        {k: 'due', label: 'Due', kind: 'date', w: 128},
        {k: 'sales', label: 'Taxable sales', kind: 'money', w: 84},
        {k: 'rate', label: 'Rate %', kind: 'pct', w: 56},
        {k: 'mp', label: 'Marketplace collects', kind: 'sel', options: ['No', 'Yes'], w: 84},
        {k: 'filed', label: 'Filed', kind: 'sel', options: ['No', 'Yes'], w: 70},
        {label: 'Tax due', w: 76, v: function (D, i) { return U.fMoney(D.vat[i].tax, 0); }},
        {label: 'Status', w: 96, status: function (D, i) { return D.vat[i].status; }}
      ]}
    ]},
    {id: 'inventory-valuation', title: 'Inventory valuation and COGS', badge: function (D) { return D.iValue ? U.fCompact(D.iValue) : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Cost of goods sold', sub: 'Units sold at weighted average cost', v: function (D, S) { return S.t.inv.length ? U.fMoney(D.iCogs, 0) : ''; }},
        {label: 'Ending inventory value', sub: 'Units left at weighted average cost', v: function (D, S) { return S.t.inv.length ? U.fMoney(D.iValue, 0) : ''; }},
        {label: 'Units on hand', sub: 'Opening plus purchases minus sold', v: function (D, S) { return S.t.inv.length ? U.fInt(D.iUnits) : ''; }},
        {label: 'Sold more than held', sub: 'Rows where units sold exceed units available', v: function (D, S) { return S.t.inv.length ? String(D.iNeg) : ''; }, bad: function (D) { return D.iNeg > 0; }}
      ]},
      {type: 'table', k: 'inv', title: 'Inventory by SKU', help: 'Opening is the start of the period. Purchases are goods received in the period at landed cost.', add: 'Add a SKU', cols: [
        {k: 'sku', label: 'SKU', kind: 'text', w: 140},
        {k: 'oUnits', label: 'Opening units', kind: 'int', w: 76},
        {k: 'oValue', label: 'Opening value', kind: 'money', w: 84},
        {k: 'pUnits', label: 'Units purchased', kind: 'int', w: 80},
        {k: 'pValue', label: 'Purchase value', kind: 'money', w: 84},
        {k: 'sold', label: 'Units sold', kind: 'int', w: 70},
        {label: 'Average cost', w: 76, v: function (D, i) { return U.fMoney(D.inv[i].avg, 2); }},
        {label: 'COGS', w: 84, v: function (D, i) { return U.fMoney(D.inv[i].cogs, 0); }, foot: function (D) { return U.fMoney(D.iCogs, 0); }},
        {label: 'Ending units', w: 70, v: function (D, i) { return U.fInt(D.inv[i].units); }, tone: function (D, i) { return D.inv[i].units < 0 ? 'bad' : ''; }, foot: function (D) { return U.fInt(D.iUnits); }},
        {label: 'Ending value', w: 90, v: function (D, i) { return U.fMoney(D.inv[i].value, 0); }, foot: function (D) { return U.fMoney(D.iValue, 0); }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Revenue', v: function (D) { return U.fMoney(D.pRev, 0) || 'No data'; }},
    {label: 'Contribution margin', v: function (D) { return D.pRev ? U.fPct(D.pMargin) : 'No data'; }},
    {label: 'Lowest cash balance', v: function (D, S) { return {text: U.fMoney(D.cLow, 0), tone: D.cLow < U.n0(S.f.cMin) ? 'bad' : ''}; }},
    {label: 'Tax to pay', v: function (D) { return U.fMoney(D.vDue, 0); }},
    {label: 'Inventory value', v: function (D) { return U.fMoney(D.iValue, 0); }}
  ],
  headline: function (D, S) {
    if (!D.pRev) return {unit: 'Add revenue to see contribution'};
    return {num: U.fMoney(D.pContrib, 0), unit: U.fPct(D.pMargin) + ' of revenue' + (S.f.period ? ', ' + S.f.period : ''), status: D.cShort ? 'Short' : 'OK', note: D.cShort ? 'cash dips below minimum' : 'cash stays above minimum'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleBrand'; S.biz.marketplace = 'Amazon.com and Amazon.de';
    S.f.period = 'October 2026';
    S.t.pnl = W.rows(['sku', 'units', 'rev', 'cogs', 'referral', 'fba', 'storage', 'ads', 'returns', 'other'], [
      ['EB-SPK-20-BLK', 1150, 57489, 14.5, 4599, 7878, 310, 9800, 2750, 690],
      ['EB-SPK-20-BLU', 210, 10498, 14.5, 840, 1439, 290, 2100, 420, 130],
      ['EB-BUD-PRO-WHT', 1500, 59985, 9.8, 8998, 9675, 120, 11200, 7400, 900],
      ['EB-CHG-65W', 600, 20994, 7.2, 3149, 3762, 210, 3300, 1650, 360],
      ['EB-CBL-USBC-2M', 1900, 24681, 1.9, 3702, 7999, 95, 2900, 610, 570]
    ]);
    S.t.settle = W.rows(['start', 'end', 'mine', 'sales', 'fees', 'refunds', 'reimb', 'reserve', 'deposit'], [
      ['2026-09-17', '2026-10-01', 41250, 41250, 13480, 2110, 145, 3900, 21905],
      ['2026-10-01', '2026-10-15', 43890, 43760, 14320, 2380, 0, 4100, 22960],
      ['2026-10-15', '2026-10-29', 46210, 46210, 15140, 2520, 61, 4300, 24311]
    ]);
    S.f.cStart = '2026-11-01'; S.f.cOpen = 68000; S.f.cMin = 40000;
    var cash = [
      [92000, 0, 15900, 21600, 6800, 14500, 0], [72000, 0, 0, 0, 3400, 14500, 0], [61000, 0, 48000, 72000, 4100, 14500, 9800],
      [52000, 0, 0, 64000, 5200, 14500, 0], [55000, 0, 9600, 0, 2800, 14500, 0], [58000, 0, 16200, 22400, 6100, 15000, 11200],
      [60000, 0, 0, 37800, 3300, 15000, 0], [86000, 0, 21000, 0, 4200, 15000, 0], [64000, 0, 0, 49000, 7400, 15000, 10600],
      [66000, 0, 18000, 0, 3900, 15000, 0], [80000, 0, 22500, 42000, 6200, 15500, 0], [104000, 0, 0, 52500, 8800, 15500, 12400]
    ];
    S.t.cash = W.rows(['payout', 'otherIn', 'dep', 'bal', 'freight', 'opex', 'tax'], cash);
    S.t.vat = W.rows(['where', 'type', 'reg', 'freq', 'end', 'due', 'sales', 'rate', 'mp', 'filed'], [
      ['Germany', 'VAT', 'DE345678901', 'Monthly', '2026-10-31', '2026-12-10', 28400, 19, 'No', 'No'],
      ['France', 'VAT', 'FR12345678901', 'Monthly', '2026-10-31', '2026-11-19', 9600, 20, 'No', 'No'],
      ['United Kingdom', 'VAT', 'GB123456789', 'Quarterly', '2026-09-30', '2026-11-07', 21300, 20, 'No', 'No'],
      ['Texas', 'Sales tax', '32012345678', 'Quarterly', '2026-09-30', '2026-10-20', 18200, 6.25, 'Yes', 'Yes'],
      ['Washington', 'Sales tax', '604-123-456', 'Quarterly', '2026-09-30', '2026-10-31', 6400, 6.5, 'Yes', 'No']
    ]);
    S.t.inv = W.rows(['sku', 'oUnits', 'oValue', 'pUnits', 'pValue', 'sold'], [
      ['EB-SPK-20-BLK', 900, 13230, 2000, 29000, 1150],
      ['EB-SPK-20-BLU', 1300, 18850, 0, 0, 210],
      ['EB-BUD-PRO-WHT', 1600, 15360, 800, 7920, 1500],
      ['EB-CHG-65W', 2200, 15840, 900, 6390, 600],
      ['EB-CBL-USBC-2M', 2400, 4440, 2000, 3800, 1900]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    D.pnl = S.t.pnl.map(function (r) {
      if (!W.isNum(r.rev)) return {status: ''};
      var c = r.rev - n0(r.units) * n0(r.cogs) - n0(r.referral) - n0(r.fba) - n0(r.storage) - n0(r.ads) - n0(r.returns) - n0(r.other);
      var m = r.rev > 0 ? c / r.rev : null;
      return {contrib: c, margin: m, status: m == null ? '' : m >= 0.1 ? 'Profitable' : m >= 0 ? 'Thin margin' : 'Loss'};
    });
    D.pRev = W.sum(S.t.pnl.map(function (r) { return r.rev; }));
    D.pContrib = W.sum(D.pnl.map(function (p) { return p.contrib; }));
    D.pMargin = D.pRev > 0 ? D.pContrib / D.pRev : null;
    D.pTacos = D.pRev > 0 ? W.sum(S.t.pnl.map(function (r) { return r.ads; })) / D.pRev : null;
    D.pFeeShare = D.pRev > 0 ? W.sum(S.t.pnl.map(function (r) { return n0(r.referral) + n0(r.fba) + n0(r.storage); })) / D.pRev : null;

    var tol = n0(f.tol);
    D.settle = S.t.settle.map(function (r) {
      if (!W.isNum(r.sales)) return {status: ''};
      var exp = r.sales - n0(r.fees) - n0(r.refunds) + n0(r.reimb) - n0(r.reserve);
      var diff = W.isNum(r.deposit) ? r.deposit - exp : null;
      var gap = W.isNum(r.mine) ? r.sales - r.mine : null;
      var bad = (diff != null && Math.abs(diff) > tol) || (gap != null && Math.abs(gap) > tol);
      return {exp: exp, diff: diff, gap: gap, status: diff == null ? 'Pending' : bad ? 'Discrepancy' : 'Matched'};
    });
    D.sN = D.settle.filter(function (s) { return s.diff != null; }).length;
    D.sBad = D.settle.filter(function (s) { return s.status === 'Discrepancy'; }).length;
    D.sDiff = W.sum(D.settle.map(function (s) { return s.diff; }));
    var lastS = S.t.settle.slice().sort(function (a, b) { return (a.end || '') < (b.end || '') ? -1 : 1; }).pop();
    D.sReserve = lastS ? lastS.reserve : null;

    var bal = n0(f.cOpen), low = null, lowI = -1;
    D.cash = S.t.cash.map(function (r, i) {
      var net = n0(r.payout) + n0(r.otherIn) - n0(r.dep) - n0(r.bal) - n0(r.freight) - n0(r.opex) - n0(r.tax);
      bal += net;
      if (low == null || bal < low) { low = bal; lowI = i; }
      return {net: net, close: bal};
    });
    D.cLow = low; D.cLowMonth = lowI >= 0 ? monthLabel(f.cStart, lowI) : '';
    D.cShort = W.isNum(f.cMin) ? D.cash.filter(function (c) { return c.close < f.cMin; }).length : 0;
    D.cEnd = bal;
    D.cPo = W.sum(S.t.cash.map(function (r) { return n0(r.dep) + n0(r.bal); }));

    D.vat = S.t.vat.map(function (r) {
      var tax = r.mp === 'Yes' ? 0 : W.isNum(r.sales) && W.isNum(r.rate) ? r.sales * r.rate / 100 : null;
      var due = W.toUTC(r.due), left = due == null ? null : Math.round((due - today) / W.DAY);
      var status = !r.where ? '' : r.filed === 'Yes' ? 'Filed' : left == null ? 'Open' : left < 0 ? 'Overdue' : left <= 14 ? 'Due soon' : 'Open';
      return {tax: tax, left: left, status: status};
    });
    D.vDue = W.sum(D.vat.map(function (v) { return v.status !== 'Filed' ? v.tax : 0; }));
    D.vSoon = D.vat.filter(function (v) { return v.status !== 'Filed' && v.left != null && v.left <= 30; }).length;
    D.vOver = D.vat.filter(function (v) { return v.status === 'Overdue'; }).length;

    D.inv = S.t.inv.map(function (r) {
      var u = n0(r.oUnits) + n0(r.pUnits), v = n0(r.oValue) + n0(r.pValue);
      var avg = u > 0 ? v / u : null, units = u - n0(r.sold);
      return {avg: avg, cogs: avg == null ? null : n0(r.sold) * avg, units: u || r.sold ? units : null, value: avg == null ? null : Math.max(0, units) * avg};
    });
    D.iCogs = W.sum(D.inv.map(function (x) { return x.cogs; }));
    D.iValue = W.sum(D.inv.map(function (x) { return x.value; }));
    D.iUnits = W.sum(D.inv.map(function (x) { return x.units; }));
    D.iNeg = D.inv.filter(function (x) { return x.units < 0; }).length;
    return D;
  }
};
})();
