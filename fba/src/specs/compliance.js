(function () {
var U;
var MKTS = ['US', 'Germany', 'UK', 'France', 'Italy', 'Spain', 'Netherlands', 'Poland', 'Sweden', 'Canada', 'Japan'];
var REQS = ['FCC ID or SDoC', 'Product safety test (UL or IEC 62368-1)', 'CE declaration', 'UKCA marking', 'RoHS', 'REACH', 'WEEE registration', 'Battery registration', 'Packaging EPR', 'GPSR responsible person', 'UN38.3 test summary', 'Safety data sheet', 'Prop 65 warning', 'Radio Equipment Directive'];
window.SPEC = {
  app: 'compliance',
  title: 'Compliance',
  desc: 'Track every requirement by SKU and marketplace, build the battery and dangerous goods file, stay current on EPR, and catch certificates before they expire.',
  notice: 'Every tab is filled with sample data for a battery-powered speaker sold in the US and EU. Type over it, or start blank.',
  headCap: 'Compliance status',
  tones: {good: ['Not regulated', 'Not needed'], warn: ['Hazmat review', 'Over 100 Wh']},
  notes: [
    'Lithium batteries ship as Class 9 dangerous goods: UN3481 when contained in or packed with equipment, UN3480 for batteries alone, UN3091 and UN3090 for lithium metal. Amazon asks for a safety data sheet or exemption sheet and the UN38.3 test summary before the ASIN can ship to FBA.',
    'In the EU and UK, one electronic product usually needs three producer registrations: WEEE, batteries and packaging, in every country you sell to. Germany runs them through Stiftung EAR and LUCID with no minimum volume.',
    'This workbook tracks your evidence. It is not legal advice, so confirm the requirements for each product with a test lab or compliance service.'
  ],
  tabs: [
    {id: 'compliance-matrix', title: 'Compliance matrix', badge: function (D) { return D.mN ? U.fPct(D.mDone) : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Requirements tracked', sub: 'Rows in the matrix', v: function (D) { return D.mN ? String(D.mN) : ''; }},
        {label: 'Done', sub: 'Share of requirements with evidence', v: function (D) { return D.mN ? U.fPct(D.mDone) : ''; }},
        {label: 'Missing', sub: 'No work started yet', v: function (D) { return D.mN ? String(D.mMissing) : ''; }, bad: function (D) { return D.mMissing > 0; }},
        {label: 'Overdue', sub: 'Past the due date and not done', v: function (D) { return D.mN ? String(D.mOverdue) : ''; }, bad: function (D) { return D.mOverdue > 0; }}
      ]},
      {type: 'table', k: 'matrix', title: 'Requirements by SKU and marketplace', help: 'One row per requirement per SKU per marketplace. Add the link to the certificate or report as evidence.', add: 'Add a requirement', cols: [
        {k: 'sku', label: 'SKU', kind: 'text', w: 120},
        {k: 'mkt', label: 'Marketplace', kind: 'sel', options: MKTS, w: 110},
        {k: 'req', label: 'Requirement', kind: 'sel', options: REQS, w: 230},
        {k: 'owner', label: 'Owner', kind: 'text', w: 100},
        {k: 'due', label: 'Due', kind: 'date', w: 128},
        {k: 'status', label: 'Stage', kind: 'sel', options: ['Missing', 'In progress', 'Done', 'Not needed'], w: 116, tone: true},
        {k: 'evidence', label: 'Evidence', kind: 'text', w: 170, ph: 'Link or file name'},
        {label: 'Status', w: 96, status: function (D, i) { return D.matrix[i]; }}
      ]},
      {type: 'charts', title: 'Open items', charts: [
        {kind: 'bars', title: 'Open requirements by marketplace', sub: 'Missing or in progress', data: function (D) { return {items: D.byMkt}; }}
      ]}
    ]},
    {id: 'battery-dossier', title: 'Battery and DG dossier', badge: function (D) { return D.bMissing ? D.bMissing + ' missing' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'SKUs with batteries', sub: 'Rows in the dossier', v: function (D, S) { return S.t.batt.length ? String(S.t.batt.length) : ''; }},
        {label: 'Documents missing', sub: 'UN38.3 summary or safety data sheet', v: function (D, S) { return S.t.batt.length ? String(D.bMissing) : ''; }, bad: function (D) { return D.bMissing > 0; }},
        {label: 'Over 100 Wh', sub: 'Fully regulated, stricter shipping rules', v: function (D, S) { return S.t.batt.length ? String(D.bOver) : ''; }}
      ]},
      {type: 'table', k: 'batt', title: 'Battery data per SKU', help: 'Enter the facts Amazon\'s dangerous goods review checks. Mismatches between the listing, the SDS and the test summary are the most common reason for a block.', add: 'Add a SKU', cols: [
        {k: 'sku', label: 'SKU', kind: 'text', w: 120},
        {k: 'type', label: 'Battery type', kind: 'sel', options: ['Li-ion', 'Li-polymer', 'LiFePO4', 'Lithium metal', 'NiMH', 'Alkaline'], w: 110},
        {k: 'pack', label: 'Packing', kind: 'sel', options: ['Contained in equipment', 'Packed with equipment', 'Battery alone'], w: 170},
        {k: 'cells', label: 'Cells', kind: 'int', w: 52},
        {k: 'wh', label: 'Wh per cell', kind: 'num', w: 62},
        {k: 'grams', label: 'Battery weight g', kind: 'num', w: 70},
        {k: 'un383', label: 'UN38.3 summary', kind: 'sel', options: ['No', 'Yes'], w: 72, tone: false},
        {k: 'sds', label: 'SDS or exemption', kind: 'sel', options: ['No', 'Yes'], w: 72},
        {label: 'Battery Wh', w: 62, v: function (D, i) { return U.fDec1(D.batt[i].total); }, tone: function (D, i) { return D.batt[i].total > 100 ? 'bad' : ''; }},
        {label: 'UN number', w: 70, num: false, v: function (D, i) { return D.batt[i].un; }},
        {label: 'Status', w: 110, status: function (D, i) { return D.batt[i].status; }}
      ]}
    ]},
    {id: 'epr-tracker', title: 'EPR registration and reporting', badge: function (D) { return D.eDue ? D.eDue + ' due' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Registrations', sub: 'Country and scheme rows', v: function (D, S) { return S.t.epr.length ? String(S.t.epr.length) : ''; }},
        {label: 'Not registered', sub: 'No registration number yet', v: function (D, S) { return S.t.epr.length ? String(D.eNot) : ''; }, bad: function (D) { return D.eNot > 0; }},
        {label: 'Reports due in 30 days', sub: 'Including overdue', v: function (D, S) { return S.t.epr.length ? String(D.eDue) : ''; }, bad: function (D) { return D.eOver > 0; }},
        {label: 'Fees this period', sub: 'Weight placed times fee rate', v: function (D, S) { return S.t.epr.length ? U.fMoney(D.eFees, 0) : ''; }}
      ]},
      {type: 'form', title: 'Currency', fields: [{k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']}]},
      {type: 'table', k: 'epr', title: 'Registrations', help: 'One row per country and scheme. Weight placed is what you put on that market in the reporting period.', add: 'Add a registration', cols: [
        {k: 'country', label: 'Country', kind: 'sel', options: ['Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Austria', 'Poland', 'Sweden', 'Belgium', 'UK'], w: 110},
        {k: 'scheme', label: 'Scheme', kind: 'sel', options: ['Packaging', 'WEEE', 'Batteries'], w: 100},
        {k: 'reg', label: 'Registration number', kind: 'text', w: 150},
        {k: 'provider', label: 'Provider', kind: 'text', w: 120},
        {k: 'freq', label: 'Reporting', kind: 'sel', options: ['Monthly', 'Quarterly', 'Yearly'], w: 100},
        {k: 'next', label: 'Next report', kind: 'date', w: 128},
        {k: 'kg', label: 'Weight placed kg', kind: 'num', w: 74},
        {k: 'rate', label: 'Fee per kg', kind: 'money', w: 64},
        {label: 'Fee', w: 70, v: function (D, i) { return U.fMoney(D.epr[i].fee, 0); }, foot: function (D) { return U.fMoney(D.eFees, 0); }},
        {label: 'Days left', w: 60, v: function (D, i) { return U.fInt(D.epr[i].left); }},
        {label: 'Status', w: 112, status: function (D, i) { return D.epr[i].status; }}
      ]}
    ]},
    {id: 'certificate-calendar', title: 'Certificate expiry calendar', badge: function (D) { return D.cSoon ? D.cSoon + ' soon' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Certificates', sub: 'Rows in the calendar', v: function (D, S) { return S.t.certs.length ? String(S.t.certs.length) : ''; }},
        {label: 'Expired', sub: 'Renew before you ship again', v: function (D, S) { return S.t.certs.length ? String(D.cExp) : ''; }, bad: function (D) { return D.cExp > 0; }},
        {label: 'Renew within 30 days', sub: 'Renewal start date close or passed', v: function (D, S) { return S.t.certs.length ? String(D.cSoon) : ''; }},
        {label: 'Next expiry', sub: function (D) { return D.cNextName || 'Earliest valid certificate'; }, v: function (D) { return U.fDate(D.cNext); }}
      ]},
      {type: 'table', k: 'certs', title: 'Certificates and reports', help: 'Lead days is how long renewal takes, from booking the lab to holding the new certificate.', add: 'Add a certificate', cols: [
        {k: 'name', label: 'Certificate', kind: 'text', w: 180},
        {k: 'sku', label: 'SKU', kind: 'text', w: 120},
        {k: 'issuer', label: 'Issued by', kind: 'text', w: 110},
        {k: 'issued', label: 'Issued', kind: 'date', w: 128},
        {k: 'expiry', label: 'Expires', kind: 'date', w: 128},
        {k: 'lead', label: 'Lead days', kind: 'int', w: 60, def: 60},
        {label: 'Start renewal by', w: 110, num: false, v: function (D, i) { return U.fDate(D.certs[i].renew); }},
        {label: 'Days left', w: 64, v: function (D, i) { return U.fInt(D.certs[i].left); }},
        {label: 'Status', w: 116, status: function (D, i) { return D.certs[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Requirements done', v: function (D) { return D.mN ? U.fPct(D.mDone) : 'No data'; }},
    {label: 'Overdue requirements', v: function (D) { return {text: String(D.mOverdue), tone: D.mOverdue ? 'bad' : ''}; }},
    {label: 'Battery documents missing', v: function (D) { return {text: String(D.bMissing), tone: D.bMissing ? 'bad' : ''}; }},
    {label: 'EPR not registered', v: function (D) { return {text: String(D.eNot), tone: D.eNot ? 'bad' : ''}; }},
    {label: 'Certificates expired', v: function (D) { return {text: String(D.cExp), tone: D.cExp ? 'bad' : ''}; }}
  ],
  headline: function (D) {
    var issues = D.mOverdue + D.bMissing + D.eNot + D.eOver + D.cExp;
    return {num: String(issues), unit: issues === 1 ? 'issue needs action' : 'issues need action', status: issues ? 'At risk' : 'OK', note: 'overdue, missing, unregistered or expired'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExampleBrand'; S.biz.marketplace = 'Amazon.com and Amazon.de';
    S.t.matrix = W.rows(['sku', 'mkt', 'req', 'owner', 'due', 'status', 'evidence'], [
      ['EB-SPK-20-BLK', 'US', 'FCC ID or SDoC', 'Jay', '2026-08-01', 'Done', 'FCC ID 2A4XY-SPK20'],
      ['EB-SPK-20-BLK', 'US', 'UN38.3 test summary', 'Supplier', '2026-08-15', 'Done', 'UN38.3_SPK20.pdf'],
      ['EB-SPK-20-BLK', 'US', 'Safety data sheet', 'Supplier', '2026-08-15', 'Done', 'SDS_SPK20.pdf'],
      ['EB-SPK-20-BLK', 'Germany', 'CE declaration', 'Jay', '2026-10-01', 'Done', 'DoC_SPK20_EN_DE.pdf'],
      ['EB-SPK-20-BLK', 'Germany', 'Radio Equipment Directive', 'Test lab', '2026-10-01', 'Done', 'RED report TUV-4471'],
      ['EB-SPK-20-BLK', 'Germany', 'WEEE registration', 'Compliance service', '2026-11-01', 'In progress', ''],
      ['EB-SPK-20-BLK', 'Germany', 'Battery registration', 'Compliance service', '2026-11-01', 'In progress', ''],
      ['EB-SPK-20-BLK', 'Germany', 'GPSR responsible person', 'Jay', '2026-11-30', 'Missing', ''],
      ['EB-SPK-20-BLK', 'France', 'Packaging EPR', 'Compliance service', '2026-12-15', 'Missing', '']
    ]);
    S.t.batt = W.rows(['sku', 'type', 'pack', 'cells', 'wh', 'grams', 'un383', 'sds'], [
      ['EB-SPK-20-BLK', 'Li-ion', 'Contained in equipment', 2, 9.25, 92, 'Yes', 'Yes'],
      ['EB-PWR-10K', 'Li-polymer', 'Contained in equipment', 1, 37, 185, 'Yes', 'No'],
      ['EB-PWR-30K', 'Li-ion', 'Contained in equipment', 3, 37, 540, 'No', 'No']
    ]);
    S.f.currency = '€';
    S.t.epr = W.rows(['country', 'scheme', 'reg', 'provider', 'freq', 'next', 'kg', 'rate'], [
      ['Germany', 'Packaging', 'DE4471234567890', 'LUCID and Interseroh', 'Yearly', '2027-05-15', 380, 0.42],
      ['Germany', 'WEEE', 'DE 12345678', 'Stiftung EAR', 'Monthly', '2026-11-30', 610, 0.35],
      ['Germany', 'Batteries', '', 'Stiftung EAR', 'Monthly', '2026-11-30', 46, 1.8],
      ['France', 'Packaging', 'FR123456_01ABCD', 'Citeo', 'Yearly', '2027-02-28', 120, 0.48]
    ]);
    S.t.certs = W.rows(['name', 'sku', 'issuer', 'issued', 'expiry', 'lead'], [
      ['UN38.3 test report', 'EB-SPK-20-BLK', 'SGS', '2024-12-01', '2026-12-01', 45],
      ['Supplier ISO 9001', 'All', 'TUV SUD', '2024-03-15', '2027-03-14', 60],
      ['Product liability insurance', 'All', 'Hiscox', '2025-11-01', '2026-11-01', 30],
      ['RED test report', 'EB-SPK-20-BLK', 'TUV Rheinland', '2026-09-20', '2029-09-19', 90]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var D = {}, n0 = W.n0;
    var m = S.t.matrix;
    D.matrix = m.map(function (r) {
      if (!r.sku && !r.req) return '';
      var due = W.toUTC(r.due);
      if (r.status === 'Done' || r.status === 'Not needed') return r.status === 'Done' ? 'Done' : 'Not needed';
      if (due != null && due < today) return 'Overdue';
      return r.status;
    });
    var rel = m.filter(function (r) { return r.status !== 'Not needed'; });
    D.mN = m.length;
    D.mDone = rel.length ? rel.filter(function (r) { return r.status === 'Done'; }).length / rel.length : null;
    D.mMissing = m.filter(function (r) { return r.status === 'Missing'; }).length;
    D.mOverdue = D.matrix.filter(function (x) { return x === 'Overdue'; }).length;
    var by = {};
    m.forEach(function (r) { if (r.status === 'Missing' || r.status === 'In progress') by[r.mkt] = (by[r.mkt] || 0) + 1; });
    D.byMkt = Object.keys(by).map(function (k) { return {label: k, v: by[k]}; }).sort(function (a, b) { return b.v - a.v; });

    D.batt = S.t.batt.map(function (b) {
      var lith = ['Li-ion', 'Li-polymer', 'LiFePO4', 'Lithium metal'].indexOf(b.type) >= 0;
      var total = W.isNum(b.cells) && W.isNum(b.wh) ? b.cells * b.wh : null;
      var un = !lith ? 'None' : b.type === 'Lithium metal' ? (b.pack === 'Battery alone' ? 'UN3090' : 'UN3091') : (b.pack === 'Battery alone' ? 'UN3480' : 'UN3481');
      var missing = lith && (b.un383 !== 'Yes' || b.sds !== 'Yes');
      var status = !b.sku ? '' : !lith ? 'Not regulated' : missing ? 'Missing' : total > 100 ? 'Over 100 Wh' : 'Ready';
      return {total: total, un: b.sku ? un : '', status: status, missing: missing, over: total > 100};
    });
    D.bMissing = D.batt.filter(function (b) { return b.missing; }).length;
    D.bOver = D.batt.filter(function (b) { return b.over; }).length;

    D.epr = S.t.epr.map(function (r) {
      var t = W.toUTC(r.next), left = t == null ? null : Math.round((t - today) / W.DAY);
      var status = !String(r.reg || '').trim() ? 'Not registered' : left == null ? 'Registered' : left < 0 ? 'Overdue' : left <= 30 ? 'Due soon' : 'Registered';
      return {fee: W.isNum(r.kg) && W.isNum(r.rate) ? r.kg * r.rate : null, left: left, status: status};
    });
    D.eNot = D.epr.filter(function (e) { return e.status === 'Not registered'; }).length;
    D.eOver = D.epr.filter(function (e) { return e.status === 'Overdue'; }).length;
    D.eDue = D.epr.filter(function (e) { return e.left != null && e.left <= 30; }).length;
    D.eFees = W.sum(D.epr.map(function (e) { return e.fee; }));

    D.certs = S.t.certs.map(function (c) {
      var ex = W.toUTC(c.expiry);
      if (ex == null) return {status: ''};
      var renew = ex - n0(c.lead) * W.DAY, left = Math.round((ex - today) / W.DAY);
      return {renew: renew, left: left, status: left < 0 ? 'Expired' : (renew - today) / W.DAY <= 30 ? 'Expiring soon' : 'Valid'};
    });
    D.cExp = D.certs.filter(function (c) { return c.status === 'Expired'; }).length;
    D.cSoon = D.certs.filter(function (c) { return c.status === 'Expiring soon'; }).length;
    var ni = -1;
    D.certs.forEach(function (c, i) { if (c.left != null && c.left >= 0 && (ni < 0 || c.left < D.certs[ni].left)) ni = i; });
    D.cNext = ni >= 0 ? W.toUTC(S.t.certs[ni].expiry) : null;
    D.cNextName = ni >= 0 ? S.t.certs[ni].name : '';
    return D;
  }
};
})();
