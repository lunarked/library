(function () {
var U;
function fit(box, item) {
  var best = 0, o = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  o.forEach(function (p) {
    var n = Math.floor(box[0] / item[p[0]]) * Math.floor(box[1] / item[p[1]]) * Math.floor(box[2] / item[p[2]]);
    if (n > best) best = n;
  });
  return best;
}
window.SPEC = {
  app: 'inbound-logistics',
  title: 'Inbound Logistics',
  desc: 'Track shipments to FBA, compare freight quotes, fit units into cartons and pallets, work out duties, and chase receiving shortfalls.',
  notice: 'Every tab is filled with sample data for speaker shipments from China to Amazon US. Type over it, or start blank.',
  headCap: 'Units on the way',
  tones: {good: ['Best', 'Fits'], warn: ['At port', 'Receiving', 'Booked'], bad: ['Too heavy', 'Too big']},
  notes: [
    'Amazon US caps standard cartons at 50 lb and 25 inches on any side, and FBA pallets at 1,500 lb and 72 inches tall including the pallet. The configurator uses those limits in metric. Check the current inbound requirements before you book.',
    'Air freight is charged on the higher of actual weight and volume weight at 167 kg per cubic meter. The cost of stock sitting in transit is units times unit value times your carrying cost, spread over the transit days.',
    'Merchandise processing fee and harbor maintenance fee rates are editable. Use the figures your customs broker quotes for the current fiscal year.'
  ],
  tabs: [
    {id: 'shipment-tracker', title: 'Shipment plan and tracker', badge: function (D) { return D.sLate ? D.sLate + ' late' : D.sOpen + ' open'; }, sections: [
      {type: 'tiles', items: [
        {label: 'Units in transit', sub: 'Shipments not yet closed', v: function (D, S) { return S.t.ship.length ? U.fInt(D.sTransit) : ''; }},
        {label: 'Late shipments', sub: 'Past the expected FBA date and not received', v: function (D, S) { return S.t.ship.length ? String(D.sLate) : ''; }, bad: function (D) { return D.sLate > 0; }},
        {label: 'Received accuracy', sub: 'Units received over units sent, closed shipments', v: function (D) { return U.fPct(D.sAcc); }, bad: function (D) { return D.sAcc < 0.98; }},
        {label: 'Average transit days', sub: 'Ship date to expected FBA date', v: function (D) { return U.fDec1(D.sAvgDays); }}
      ]},
      {type: 'table', k: 'ship', title: 'Shipments', help: 'One row per shipment ID. Short means the shipment is closed with fewer units received than sent.', add: 'Add a shipment', cols: [
        {k: 'id', label: 'Shipment ID', kind: 'text', w: 120},
        {k: 'sku', label: 'SKU', kind: 'text', w: 120},
        {k: 'units', label: 'Units sent', kind: 'int', w: 66, foot: 'sum'},
        {k: 'mode', label: 'Mode', kind: 'sel', options: ['Sea', 'Air', 'Truck', 'Rail'], w: 76},
        {k: 'shipped', label: 'Shipped', kind: 'date', w: 128},
        {k: 'eta', label: 'Expected at FBA', kind: 'date', w: 128},
        {k: 'stage', label: 'Stage', kind: 'sel', options: ['Booked', 'In transit', 'At port', 'Delivered', 'Receiving', 'Closed'], w: 110, tone: true},
        {k: 'recv', label: 'Units received', kind: 'int', w: 66, foot: 'sum'},
        {label: 'Transit days', w: 60, v: function (D, i) { return U.fInt(D.ship[i].days); }},
        {label: 'Status', w: 92, status: function (D, i) { return D.ship[i].status; }}
      ]}
    ]},
    {id: 'freight-quotes', title: 'Freight quote comparison', badge: function (D) { return D.qBest ? 'best: ' + D.qBest : ''; }, sections: [
      {type: 'form', title: 'Cargo', fields: [
        {k: 'currency', label: 'Currency', kind: 'sel', options: ['$', '€', '£']},
        {k: 'qUnits', label: 'Units', kind: 'int'},
        {k: 'qCartons', label: 'Cartons', kind: 'int'},
        {k: 'qKg', label: 'Kg per carton', kind: 'num'},
        {k: 'qL', label: 'Carton length cm', kind: 'num'},
        {k: 'qW', label: 'Carton width cm', kind: 'num'},
        {k: 'qH', label: 'Carton height cm', kind: 'num'},
        {k: 'qValue', label: 'Unit value', kind: 'money', note: 'Landed cost, for the cost of stock in transit'},
        {k: 'qCarry', label: 'Carrying cost per year', kind: 'pct', def: 25}
      ], stats: [
        {label: 'Volume', v: function (D) { return D.cbm == null ? '' : U.fDec2(D.cbm) + ' cbm'; }},
        {label: 'Gross weight', v: function (D) { return D.kg ? U.fInt(D.kg) + ' kg' : ''; }},
        {label: 'Air chargeable weight', v: function (D) { return D.chg ? U.fInt(D.chg) + ' kg' : ''; }}
      ]},
      {type: 'table', k: 'quotes', title: 'Quotes', help: 'Rate basis says how the rate applies. Total adds fixed fees and the cost of stock sitting in transit, so a slower quote has to be cheaper to win.', add: 'Add a quote', cols: [
        {k: 'fwd', label: 'Forwarder', kind: 'text', w: 140},
        {k: 'mode', label: 'Mode', kind: 'sel', options: ['Sea LCL', 'Sea FCL', 'Air', 'Air express', 'Rail'], w: 104},
        {k: 'basis', label: 'Rate basis', kind: 'sel', options: ['Per cbm', 'Per kg', 'Per container', 'Flat'], w: 110},
        {k: 'rate', label: 'Rate', kind: 'money', w: 70},
        {k: 'qty', label: 'Containers', kind: 'int', w: 64, def: 1},
        {k: 'fees', label: 'Fixed fees', kind: 'money', w: 70},
        {k: 'days', label: 'Door to FBA days', kind: 'int', w: 70},
        {label: 'Freight', w: 76, v: function (D, i) { return U.fMoney(D.quotes[i].freight, 0); }},
        {label: 'Stock in transit', w: 76, v: function (D, i) { return U.fMoney(D.quotes[i].carry, 0); }},
        {label: 'Total', w: 76, v: function (D, i) { return U.fMoney(D.quotes[i].total, 0); }},
        {label: 'Per unit', w: 64, v: function (D, i) { return U.fMoney(D.quotes[i].perUnit, 2); }},
        {label: 'Result', w: 72, status: function (D, i) { return D.quotes[i].best ? 'Best' : ''; }}
      ]}
    ]},
    {id: 'carton-pallet', title: 'Carton and pallet configurator', badge: function (D) { return D.perPallet ? U.fInt(D.perPallet) + '/pallet' : ''; }, sections: [
      {type: 'form', title: 'Unit and carton', help: 'Unit size is the retail box. Carton size is the inside of the master carton.', fields: [
        {k: 'uL', label: 'Unit length cm', kind: 'num'}, {k: 'uW', label: 'Unit width cm', kind: 'num'}, {k: 'uH', label: 'Unit height cm', kind: 'num'},
        {k: 'uKg', label: 'Unit weight kg', kind: 'num'},
        {k: 'cL', label: 'Carton length cm', kind: 'num'}, {k: 'cW', label: 'Carton width cm', kind: 'num'}, {k: 'cH', label: 'Carton height cm', kind: 'num'},
        {k: 'cKg', label: 'Empty carton kg', kind: 'num', def: 0.8},
        {k: 'cMaxKg', label: 'Carton weight limit kg', kind: 'num', def: 22.7, note: '50 lb'},
        {k: 'cMaxSide', label: 'Carton side limit cm', kind: 'num', def: 63.5, note: '25 inches'}
      ]},
      {type: 'form', title: 'Pallet', fields: [
        {k: 'pL', label: 'Pallet length cm', kind: 'num', def: 121.9}, {k: 'pW', label: 'Pallet width cm', kind: 'num', def: 101.6},
        {k: 'pMaxH', label: 'Max height incl. pallet cm', kind: 'num', def: 182.9, note: '72 inches'},
        {k: 'pDeck', label: 'Pallet height cm', kind: 'num', def: 14.4},
        {k: 'pMaxKg', label: 'Pallet weight limit kg', kind: 'num', def: 680, note: '1,500 lb'},
        {k: 'pKg', label: 'Empty pallet kg', kind: 'num', def: 20}
      ]},
      {type: 'note', title: 'Carton check', v: function (D) { return [D.cStatus, D.cText]; }},
      {type: 'tiles', items: [
        {label: 'Units per carton', sub: 'Best of six orientations', v: function (D) { return D.perCarton ? U.fInt(D.perCarton) : ''; }},
        {label: 'Carton weight', sub: function (D) { return D.cartonKg ? U.fDec1(D.cartonKg * 2.20462) + ' lb' : 'Units plus empty carton'; }, v: function (D) { return D.cartonKg ? U.fDec1(D.cartonKg) + ' kg' : ''; }, bad: function (D) { return D.cHeavy; }},
        {label: 'Cartons per pallet', sub: function (D) { return D.layers ? D.perLayer + ' per layer, ' + D.layers + ' layers' : 'Within height and weight limits'; }, v: function (D) { return D.cartonsPallet ? U.fInt(D.cartonsPallet) : ''; }},
        {label: 'Units per pallet', sub: function (D) { return D.palletKg ? U.fInt(D.palletKg) + ' kg loaded' : 'Cartons times units'; }, v: function (D) { return D.perPallet ? U.fInt(D.perPallet) : ''; }}
      ]}
    ]},
    {id: 'customs-duty', title: 'Customs and duty', badge: function (D) { return D.dTotal ? U.fMoney(D.dTotal, 0) : ''; }, sections: [
      {type: 'form', title: 'Entry', fields: [
        {k: 'dMode', label: 'Mode', kind: 'sel', options: ['Sea', 'Air']},
        {k: 'mpf', label: 'MPF rate', kind: 'pct', def: 0.3464},
        {k: 'mpfMin', label: 'MPF minimum', kind: 'money', def: 33.58},
        {k: 'mpfMax', label: 'MPF maximum', kind: 'money', def: 651.5},
        {k: 'hmf', label: 'HMF rate (sea only)', kind: 'pct', def: 0.125}
      ]},
      {type: 'tiles', items: [
        {label: 'Customs value', sub: 'Units times unit value', v: function (D) { return D.dValue ? U.fMoney(D.dValue, 0) : ''; }},
        {label: 'Duty and tariffs', sub: 'All lines', v: function (D) { return D.dValue ? U.fMoney(D.dDuty, 0) : ''; }},
        {label: 'MPF and HMF', sub: 'Processing and harbor fees', v: function (D) { return D.dValue ? U.fMoney(D.dFees, 0) : ''; }},
        {label: 'Total payable', sub: function (D) { return D.dValue ? U.fPct(D.dTotal / D.dValue) + ' of customs value' : 'Duties plus fees'; }, v: function (D) { return D.dValue ? U.fMoney(D.dTotal, 0) : ''; }}
      ]},
      {type: 'table', k: 'lines', title: 'Entry lines', help: 'One row per HTS code. Additional tariff covers Section 301 and similar duties on top of the normal rate.', add: 'Add a line', cols: [
        {k: 'sku', label: 'SKU', kind: 'text', w: 120},
        {k: 'desc', label: 'Description', kind: 'text', w: 160},
        {k: 'hts', label: 'HTS code', kind: 'text', w: 104},
        {k: 'origin', label: 'Origin', kind: 'sel', options: ['China', 'Vietnam', 'Taiwan', 'Malaysia', 'India', 'Mexico', 'Other'], w: 96},
        {k: 'units', label: 'Units', kind: 'int', w: 64},
        {k: 'value', label: 'Unit value', kind: 'money', w: 66},
        {k: 'duty', label: 'Duty %', kind: 'pct', w: 56},
        {k: 'extra', label: 'Additional %', kind: 'pct', w: 66},
        {label: 'Customs value', w: 80, v: function (D, i) { return U.fMoney(D.lines[i].val, 0); }, foot: function (D) { return U.fMoney(D.dValue, 0); }},
        {label: 'Duty', w: 72, v: function (D, i) { return U.fMoney(D.lines[i].duty, 0); }, foot: function (D) { return U.fMoney(D.dDuty, 0); }},
        {label: 'Per unit', w: 64, v: function (D, i) { return U.fMoney(D.lines[i].per, 2); }}
      ]}
    ]},
    {id: 'receiving-claims', title: 'Receiving and claims', badge: function (D) { return D.rOver ? D.rOver + ' overdue' : D.rMissing ? U.fInt(D.rMissing) + ' missing' : ''; }, sections: [
      {type: 'form', title: 'Claims', fields: [{k: 'window', label: 'Claim window days', kind: 'int', def: 60, note: 'Days after a shipment closes to open a case'}]},
      {type: 'tiles', items: [
        {label: 'Units missing', sub: 'Sent minus received, before reimbursement', v: function (D, S) { return S.t.recon.length ? U.fInt(D.rMissing) : ''; }},
        {label: 'Value still at risk', sub: 'Missing units not yet reimbursed', v: function (D, S) { return S.t.recon.length ? U.fMoney(D.rRisk, 0) : ''; }, bad: function (D) { return D.rRisk > 0; }},
        {label: 'Recovered', sub: 'Reimbursed units at unit cost', v: function (D, S) { return S.t.recon.length ? U.fMoney(D.rBack, 0) : ''; }},
        {label: 'Claims past the window', sub: 'Not filed in time', v: function (D, S) { return S.t.recon.length ? String(D.rOver) : ''; }, bad: function (D) { return D.rOver > 0; }}
      ]},
      {type: 'table', k: 'recon', title: 'Reconciliation', help: 'Compare units sent with units received for each closed shipment, then track the case until it is reimbursed.', add: 'Add a shipment', cols: [
        {k: 'id', label: 'Shipment ID', kind: 'text', w: 120},
        {k: 'sku', label: 'SKU', kind: 'text', w: 120},
        {k: 'sent', label: 'Sent', kind: 'int', w: 62},
        {k: 'recv', label: 'Received', kind: 'int', w: 66},
        {k: 'closed', label: 'Closed', kind: 'date', w: 128},
        {k: 'claim', label: 'Case', kind: 'sel', options: ['Not filed', 'Open', 'Approved', 'Rejected'], w: 100},
        {k: 'reimb', label: 'Units reimbursed', kind: 'int', w: 76},
        {k: 'cost', label: 'Unit cost', kind: 'money', w: 64},
        {label: 'Missing', w: 60, v: function (D, i) { return U.fInt(D.recon[i].miss); }},
        {label: 'At risk', w: 72, v: function (D, i) { return U.fMoney(D.recon[i].risk, 0); }},
        {label: 'File by', w: 100, num: false, v: function (D, i) { return U.fDate(D.recon[i].by); }},
        {label: 'Status', w: 100, status: function (D, i) { return D.recon[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Units in transit', v: function (D) { return U.fInt(D.sTransit); }},
    {label: 'Late shipments', v: function (D) { return {text: String(D.sLate), tone: D.sLate ? 'bad' : ''}; }},
    {label: 'Cheapest freight', v: function (D) { return D.qBest || 'No quotes'; }},
    {label: 'Duties on entry', v: function (D) { return U.fMoney(D.dTotal, 0) || 'No data'; }},
    {label: 'Value at risk in claims', v: function (D) { return {text: U.fMoney(D.rRisk, 0), tone: D.rRisk > 0 ? 'warn' : ''}; }}
  ],
  headline: function (D) {
    return {num: U.fInt(D.sTransit), unit: 'units on the way to FBA', status: D.sLate ? 'Late' : D.sOpen ? 'On track' : '', note: D.sLate ? D.sLate + ' shipment' + (D.sLate === 1 ? '' : 's') + ' late' : ''};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleBrand'; S.biz.marketplace = 'Amazon.com (US)';
    S.t.ship = W.rows(['id', 'sku', 'units', 'mode', 'shipped', 'eta', 'stage', 'recv'], [
      ['FBA18XK2Q1', 'EB-SPK-20-BLK', 2000, 'Sea', '2026-09-22', '2026-10-30', 'Closed', 1976],
      ['FBA18YB7M4', 'EB-SPK-20-BLU', 1000, 'Sea', '2026-10-20', '2026-11-12', 'At port', null],
      ['FBA18Z3P9C', 'EB-BUD-PRO-WHT', 600, 'Air', '2026-11-08', '2026-11-18', 'In transit', null],
      ['FBA1902LQ8', 'EB-SPK-20-BLK', 1500, 'Sea', '2026-12-12', '2027-01-18', 'Booked', null]
    ]);
    var f = S.f;
    f.qUnits = 1500; f.qCartons = 75; f.qKg = 17.5; f.qL = 52; f.qW = 40; f.qH = 38; f.qValue = 14.5; f.qCarry = 25;
    S.t.quotes = W.rows(['fwd', 'mode', 'basis', 'rate', 'qty', 'fees', 'days'], [
      ['Flexport', 'Sea LCL', 'Per cbm', 165, 1, 420, 38],
      ['DHL Global Forwarding', 'Air', 'Per kg', 4.6, 1, 260, 9],
      ['Freightos marketplace', 'Sea FCL', 'Per container', 2650, 1, 380, 33],
      ['Matson express', 'Sea LCL', 'Per cbm', 235, 1, 420, 24]
    ]);
    f.uL = 23; f.uW = 15.5; f.uH = 11; f.uKg = 0.72; f.cL = 48; f.cW = 32; f.cH = 46;
    f.dMode = 'Sea';
    S.t.lines = W.rows(['sku', 'desc', 'hts', 'origin', 'units', 'value', 'duty', 'extra'], [
      ['EB-SPK-20-BLK', 'Portable Bluetooth speaker', '8518.22.0000', 'China', 1500, 10.6, 0, 25],
      ['EB-CBL-USBC-2M', 'USB-C charging cable', '8544.42.9090', 'China', 3000, 0.9, 2.6, 25],
      ['EB-BUD-PRO-WHT', 'Wireless earbuds', '8518.30.2000', 'Vietnam', 600, 7.8, 0, 0]
    ]);
    S.t.recon = W.rows(['id', 'sku', 'sent', 'recv', 'closed', 'claim', 'reimb', 'cost'], [
      ['FBA18XK2Q1', 'EB-SPK-20-BLK', 2000, 1976, '2026-11-04', 'Open', null, 14.5],
      ['FBA18QW3E5', 'EB-CHG-65W', 1200, 1188, '2026-08-20', 'Approved', 12, 7.2],
      ['FBA18PL0Z2', 'EB-CBL-USBC-2M', 3000, 2950, '2026-08-01', 'Not filed', null, 1.9],
      ['FBA18MN4R7', 'EB-SPK-20-BLU', 800, 800, '2026-07-15', 'Not filed', null, 14.5]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {};
    D.ship = S.t.ship.map(function (s) {
      var eta = W.toUTC(s.eta), sh = W.toUTC(s.shipped);
      var arrived = ['Delivered', 'Receiving', 'Closed'].indexOf(s.stage) >= 0;
      var status = !s.id && !s.units ? '' : s.stage === 'Closed' ? (W.isNum(s.recv) && W.isNum(s.units) && s.recv < s.units ? 'Short' : 'Received') : !arrived && eta != null && eta < today ? 'Late' : s.stage;
      return {days: eta != null && sh != null ? Math.round((eta - sh) / W.DAY) : null, status: status, open: s.stage !== 'Closed'};
    });
    D.sOpen = D.ship.filter(function (x) { return x.open; }).length;
    D.sTransit = W.sum(S.t.ship.map(function (s, i) { return D.ship[i].open ? s.units : 0; }));
    D.sLate = D.ship.filter(function (x) { return x.status === 'Late'; }).length;
    var closed = S.t.ship.filter(function (s) { return s.stage === 'Closed' && W.isNum(s.recv) && s.units > 0; });
    D.sAcc = closed.length ? W.sum(closed.map(function (s) { return s.recv; })) / W.sum(closed.map(function (s) { return s.units; })) : null;
    D.sAvgDays = W.mean(D.ship.map(function (x) { return x.days; }));

    D.cbm = [f.qCartons, f.qL, f.qW, f.qH].every(W.isNum) ? f.qCartons * f.qL * f.qW * f.qH / 1e6 : null;
    D.kg = n0(f.qCartons) * n0(f.qKg);
    D.chg = D.cbm != null ? Math.max(D.kg, D.cbm * 167) : D.kg;
    var carryDay = n0(f.qUnits) * n0(f.qValue) * n0(f.qCarry) / 100 / 365;
    D.quotes = S.t.quotes.map(function (q) {
      if (!W.isNum(q.rate)) return {};
      var basis = q.basis === 'Per cbm' ? n0(D.cbm) : q.basis === 'Per kg' ? n0(D.chg) : q.basis === 'Per container' ? (W.isNum(q.qty) ? q.qty : 1) : 1;
      var freight = q.rate * basis + n0(q.fees), carry = carryDay * n0(q.days);
      return {freight: freight, carry: carry, total: freight + carry, perUnit: f.qUnits > 0 ? (freight + carry) / f.qUnits : null};
    });
    var bq = -1;
    D.quotes.forEach(function (q, i) { if (q.total != null && (bq < 0 || q.total < D.quotes[bq].total)) bq = i; });
    if (bq >= 0) D.quotes[bq].best = true;
    D.qBest = bq >= 0 ? (S.t.quotes[bq].fwd || 'Quote ' + (bq + 1)) : '';

    var unit = [f.uL, f.uW, f.uH], box = [f.cL, f.cW, f.cH];
    if (unit.concat(box).every(function (v) { return v > 0; })) {
      D.perCarton = fit(box, unit);
      D.cartonKg = D.perCarton * n0(f.uKg) + n0(f.cKg);
      var outer = box.map(function (v) { return v + 1; });
      D.cHeavy = D.cartonKg > n0(f.cMaxKg);
      var big = Math.max.apply(null, outer) > n0(f.cMaxSide);
      D.cStatus = D.perCarton === 0 ? 'Too big' : D.cHeavy ? 'Too heavy' : big ? 'Too big' : 'Fits';
      D.cText = D.perCarton === 0 ? 'The unit does not fit in this carton in any orientation.' : D.cHeavy ? 'The full carton weighs ' + W.fDec1(D.cartonKg) + ' kg, over the ' + W.fDec1(f.cMaxKg) + ' kg limit. Use a smaller carton or fewer units.' : big ? 'A carton side is over the ' + W.fDec1(f.cMaxSide) + ' cm limit. Amazon treats it as oversize.' : W.fInt(D.perCarton) + ' units per carton at ' + W.fDec1(D.cartonKg) + ' kg, inside the weight and size limits.';
      var layerH = outer[2], usable = n0(f.pMaxH) - n0(f.pDeck);
      D.perLayer = Math.max(Math.floor(n0(f.pL) / outer[0]) * Math.floor(n0(f.pW) / outer[1]), Math.floor(n0(f.pL) / outer[1]) * Math.floor(n0(f.pW) / outer[0]));
      var byH = Math.floor(usable / layerH);
      var byKg = D.cartonKg > 0 ? Math.floor((n0(f.pMaxKg) - n0(f.pKg)) / D.cartonKg) : 0;
      D.cartonsPallet = Math.min(D.perLayer * byH, byKg);
      D.layers = D.perLayer ? Math.ceil(D.cartonsPallet / D.perLayer) : 0;
      D.perPallet = D.cartonsPallet * D.perCarton;
      D.palletKg = D.cartonsPallet * D.cartonKg + n0(f.pKg);
    } else { D.cStatus = ''; D.cText = 'Enter unit and carton sizes to check the fit.'; }

    D.lines = S.t.lines.map(function (l) {
      var val = W.isNum(l.units) && W.isNum(l.value) ? l.units * l.value : null;
      var duty = val == null ? null : val * (n0(l.duty) + n0(l.extra)) / 100;
      return {val: val, duty: duty, per: duty != null && l.units > 0 ? duty / l.units : null};
    });
    D.dValue = W.sum(D.lines.map(function (l) { return l.val; }));
    D.dDuty = W.sum(D.lines.map(function (l) { return l.duty; }));
    var mpf = D.dValue * n0(f.mpf) / 100;
    if (W.isNum(f.mpfMin)) mpf = Math.max(mpf, f.mpfMin);
    if (W.isNum(f.mpfMax)) mpf = Math.min(mpf, f.mpfMax);
    D.dFees = D.dValue > 0 ? mpf + (f.dMode === 'Sea' ? D.dValue * n0(f.hmf) / 100 : 0) : 0;
    D.dTotal = D.dDuty + D.dFees;

    var win = n0(f.window);
    D.recon = S.t.recon.map(function (r) {
      if (!W.isNum(r.sent) || !W.isNum(r.recv)) return {status: ''};
      var miss = Math.max(0, r.sent - r.recv), left = Math.max(0, miss - n0(r.reimb));
      var risk = r.claim === 'Rejected' ? 0 : left * n0(r.cost);
      var cl = W.toUTC(r.closed), by = cl == null ? null : cl + win * W.DAY;
      var status = miss === 0 ? 'Matched' : r.claim === 'Approved' && left === 0 ? 'Approved' : r.claim === 'Rejected' ? 'Rejected' : r.claim === 'Open' ? 'Claim open' : by != null && today > by ? 'Overdue' : 'Discrepancy';
      return {miss: miss, risk: risk, by: miss ? by : null, status: status, back: n0(r.reimb) * n0(r.cost)};
    });
    D.rMissing = W.sum(D.recon.map(function (r) { return r.miss; }));
    D.rRisk = W.sum(D.recon.map(function (r) { return r.status === 'Overdue' ? 0 : r.risk; }));
    D.rBack = W.sum(D.recon.map(function (r) { return r.back; }));
    D.rOver = D.recon.filter(function (r) { return r.status === 'Overdue'; }).length;
    return D;
  }
};
})();
