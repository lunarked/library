(function () {
var U, M = window.MFG;
window.SPEC = {
  app: 'mfg-compliance',
  title: 'Product Compliance',
  desc: 'Hold a RoHS, REACH and conflict minerals declaration for every part, keep device certificates and test reports in date, and track packaging, electrical and battery registrations by country.',
  notice: 'Every tab is filled with sample data for a portable speaker sold in Europe and the UK. Type over it, or start blank.',
  headCap: 'Parts with full declarations',
  tones: {good: ['Complete', 'Valid', 'Registered', 'On file'], warn: ['Expiring soon', 'Due soon', 'Partial'], bad: ['Missing', 'Expired', 'Overdue', 'Not registered']},
  notes: [
    'Part file: every part needs a RoHS declaration, a REACH SVHC statement checked against the current candidate list, and for parts with tin, tantalum, tungsten or gold, a conflict minerals report. Ask suppliers to confirm REACH each time the candidate list is updated, usually twice a year.',
    'Device certificates: a radio device sold in the EU needs a declaration of conformity under the Radio Equipment Directive, backed by safety, EMC and radio test reports. The UK needs UKCA. Lithium batteries need a UN 38.3 test summary to ship.',
    'Registrations: producers of electrical equipment, batteries and packaging register in each country where they sell, report volumes and pay fees. In Germany these run through the national registers for electrical equipment, batteries and packaging.'
  ],
  tabs: [
    {id: 'parts', title: 'Part compliance file', badge: function (D) { return D.pMissing ? D.pMissing + ' parts missing' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Parts complete', sub: 'All declarations on file', v: function (D, S) { return S.t.parts.length ? D.pDone + ' of ' + D.pN : ''; }},
        {label: 'Missing a declaration', sub: 'Ask the supplier', v: function (D, S) { return S.t.parts.length ? String(D.pMissing) : ''; }, bad: function (D) { return D.pMissing > 0; }},
        {label: 'REACH older than the candidate list', sub: 'Statement dated before the last update', v: function (D, S) { return S.t.parts.length ? String(D.pOld) : ''; }}
      ]},
      {type: 'form', title: 'REACH', fields: [
        {k: 'svhcDate', label: 'Last candidate list update', kind: 'date'}
      ]},
      {type: 'table', k: 'parts', title: 'Parts', help: 'Mark Not needed where a declaration does not apply, for example conflict minerals for a paper guide.', add: 'Add a part', cols: [
        {k: 'part', label: 'Part', kind: 'text', w: 98},
        {k: 'supplier', label: 'Supplier', kind: 'text', w: 120},
        {k: 'rohs', label: 'RoHS', kind: 'sel', options: ['Missing', 'On file', 'Not needed'], w: 96, tone: true},
        {k: 'reach', label: 'REACH', kind: 'sel', options: ['Missing', 'On file', 'Not needed'], w: 96, tone: true},
        {k: 'reachDate', label: 'REACH dated', kind: 'date', w: 128},
        {k: 'cmrt', label: 'Conflict minerals', kind: 'sel', options: ['Missing', 'On file', 'Not needed'], w: 96, tone: true},
        {k: 'note', label: 'Notes', kind: 'text', w: 200},
        {label: 'Status', w: 90, status: function (D, i) { return D.parts[i].status; }}
      ]}
    ]},
    {id: 'certs', title: 'Device certificates', badge: function (D) { return D.cAlert ? D.cAlert + ' to act on' : ''; }, sections: [
      {type: 'tiles', items: [
        {label: 'Valid', sub: 'More than 90 days left or no end date', v: function (D, S) { return S.t.certs.length ? String(D.cValid) : ''; }},
        {label: 'Expiring in 90 days', sub: 'Start renewal', v: function (D, S) { return S.t.certs.length ? String(D.cSoon) : ''; }},
        {label: 'Missing or expired', sub: 'Cannot ship to that market', v: function (D, S) { return S.t.certs.length ? String(D.cBad) : ''; }, bad: function (D) { return D.cBad > 0; }}
      ]},
      {type: 'table', k: 'certs', title: 'Certificates and reports', help: 'Write None in Reference while a document is missing. Re-test after any change that touches the radio, power or battery.', add: 'Add a document', cols: [
        {k: 'doc', label: 'Document', kind: 'text', w: 250},
        {k: 'market', label: 'Market', kind: 'text', w: 90},
        {k: 'ref', label: 'Reference', kind: 'text', w: 120},
        {k: 'lab', label: 'Lab or body', kind: 'text', w: 120},
        {k: 'rev', label: 'BOM revision', kind: 'text', w: 70},
        {k: 'exp', label: 'Expires', kind: 'date', w: 128},
        {label: 'Days left', w: 64, v: function (D, i) { return U.fInt(D.certs[i].left); }},
        {label: 'Status', w: 100, status: function (D, i) { return D.certs[i].status; }}
      ]}
    ]},
    {id: 'epr', title: 'EPR registrations', badge: function (D) { return D.eDue ? D.eDue + ' reports due' : ''; }, sections: [
      {type: 'form', title: 'Currency', fields: [{k: 'currency', label: 'Currency', kind: 'sel', options: ['€', '$', '£']}]},
      {type: 'tiles', items: [
        {label: 'Registered', sub: 'Country and scheme', v: function (D, S) { return S.t.epr.length ? D.eReg + ' of ' + D.eN : ''; }},
        {label: 'Reports due in 30 days', sub: 'Or overdue', v: function (D, S) { return S.t.epr.length ? String(D.eDue) : ''; }, bad: function (D) { return D.eDue > 0; }},
        {label: 'Fees a year', sub: 'All schemes', v: function (D, S) { return S.t.epr.length ? U.fMoney(D.eFees, 0) : ''; }}
      ]},
      {type: 'table', k: 'epr', title: 'Registrations', help: 'One row per country and scheme. Weight is what you put on that market a year.', add: 'Add a registration', cols: [
        {k: 'country', label: 'Country', kind: 'text', w: 96},
        {k: 'scheme', label: 'Scheme', kind: 'sel', options: ['Electrical equipment', 'Batteries', 'Packaging'], w: 150},
        {k: 'regNo', label: 'Registration number', kind: 'text', w: 130},
        {k: 'kg', label: 'Kg a year', kind: 'int', w: 76},
        {k: 'fee', label: 'Fee per kg', kind: 'num', w: 66},
        {k: 'report', label: 'Next report due', kind: 'date', w: 128},
        {label: 'Fee a year', w: 80, v: function (D, i) { return U.fMoney(D.epr[i].fee, 0); }},
        {label: 'Days to report', w: 70, v: function (D, i) { return U.fInt(D.epr[i].left); }},
        {label: 'Status', w: 100, status: function (D, i) { return D.epr[i].status; }}
      ]}
    ]}
  ],
  figs: [
    {label: 'Parts complete', v: function (D) { return D.pN ? D.pDone + ' of ' + D.pN : 'No data'; }},
    {label: 'Parts missing a declaration', v: function (D) { return {text: String(D.pMissing), tone: D.pMissing ? 'warn' : ''}; }},
    {label: 'Certificates to act on', v: function (D) { return {text: String(D.cAlert), tone: D.cAlert ? 'warn' : ''}; }},
    {label: 'EPR reports due', v: function (D) { return {text: String(D.eDue), tone: D.eDue ? 'warn' : ''}; }},
    {label: 'EPR fees a year', v: function (D) { return U.fMoney(D.eFees, 0) || 'No data'; }}
  ],
  headline: function (D) {
    if (!D.pN) return {unit: 'Add parts to the compliance file'};
    return {num: D.pDone + ' of ' + D.pN, unit: 'parts with full declarations', status: D.pMissing ? 'Partial' : 'Complete', note: D.cBad + ' certificates missing or expired'};
  },
  sample: function (S, W) {
    S.biz.brand = 'ExamplePlant'; S.biz.marketplace = 'Portable speaker S1';
    var r = function (n) { return M.rel(W, n); };
    S.f.svhcDate = r(-150); S.f.currency = '€';
    var paper = {'LBL-RTG': 1, 'BOX-RET': 1, 'TRAY': 1, 'QSG': 1, 'CTN-6': 1};
    var miss = {'GRL-MESH': ['On file', 'Missing', 'Not needed', 'Asked 3 times'], 'STRAP': ['Missing', 'On file', 'Not needed', 'New supplier'], 'BAT-PACK': ['On file', 'On file', 'Missing', 'Cobalt report also requested']};
    S.t.parts = M.BOM.map(function (b, i) {
      var m = miss[b[0]], p = paper[b[0]], elec = /Electronics|Semiconductors|Battery|Acoustics/.test(b[9]);
      return {part: b[0], supplier: b[6], rohs: m ? m[0] : 'On file', reach: m ? m[1] : 'On file', reachDate: i % 4 === 0 ? r(-260) : r(-60), cmrt: m ? m[2] : (p || !elec ? 'Not needed' : 'On file'), note: m ? m[3] : ''};
    });
    S.t.certs = W.rows(['doc', 'market', 'ref', 'lab', 'rev', 'exp'], [
      ['EU declaration of conformity, radio equipment', 'EU', 'DoC-S1-C', 'Own', 'C', ''],
      ['Safety test report EN 62368-1', 'EU, UK', 'TR-62368-0912', 'Test lab A', 'C', ''],
      ['EMC test report', 'EU, UK', 'TR-EMC-0913', 'Test lab A', 'C', ''],
      ['Radio test report EN 300 328', 'EU, UK', 'TR-RF-0914', 'Test lab A', 'B', ''],
      ['UKCA declaration', 'UK', 'None', 'Own', '', ''],
      ['UN 38.3 test summary, battery pack', 'Global', 'UN383-CP-26', 'Cell Power', 'C', r(70)],
      ['Water resistance test IPX7', 'All', 'TR-IP-0920', 'Test lab B', 'C', r(400)]
    ]);
    S.t.epr = W.rows(['country', 'scheme', 'regNo', 'kg', 'fee', 'report'], [
      ['Germany', 'Electrical equipment', 'DE 12345678', 52000, 0.09, r(20)],
      ['Germany', 'Batteries', 'DE 87654321', 6200, 0.95, r(48)],
      ['Germany', 'Packaging', 'DE4561237890123', 21000, 0.42, r(-4)],
      ['France', 'Electrical equipment', 'FR 0213456', 18000, 0.11, r(110)],
      ['United Kingdom', 'Electrical equipment', '', 15000, 0.10, r(60)]
    ]);
  },
  derive: function (S, today, W) {
    U = W;
    var f = S.f, n0 = W.n0, D = {}, tdy = W.isoOf(today);
    D.pN = 0; D.pDone = 0; D.pMissing = 0; D.pOld = 0;
    D.parts = S.t.parts.map(function (p) {
      if (!p.part) return {status: ''};
      D.pN++;
      var vals = [p.rohs, p.reach, p.cmrt], miss = vals.indexOf('Missing') >= 0;
      var old = p.reach === 'On file' && f.svhcDate && p.reachDate && W.days(p.reachDate, f.svhcDate) > 0;
      if (old) D.pOld++;
      if (miss) { D.pMissing++; return {status: 'Missing'}; }
      if (old) return {status: 'Partial'};
      D.pDone++;
      return {status: 'Complete'};
    });

    D.cValid = 0; D.cSoon = 0; D.cBad = 0;
    D.certs = S.t.certs.map(function (c) {
      if (!c.doc) return {status: ''};
      var missing = !c.ref || /^none$/i.test(String(c.ref).trim()), left = c.exp ? W.days(tdy, c.exp) : null;
      var status = missing ? 'Missing' : left != null && left < 0 ? 'Expired' : left != null && left <= 90 ? 'Expiring soon' : 'Valid';
      if (status === 'Valid') D.cValid++; else if (status === 'Expiring soon') D.cSoon++; else D.cBad++;
      return {left: left, status: status};
    });
    D.cAlert = D.cSoon + D.cBad;

    D.eN = 0; D.eReg = 0; D.eDue = 0; D.eFees = 0;
    D.epr = S.t.epr.map(function (e) {
      if (!e.country) return {status: ''};
      D.eN++;
      var fee = W.isNum(e.kg) ? e.kg * n0(e.fee) : null, left = e.report ? W.days(tdy, e.report) : null;
      D.eFees += n0(fee);
      if (!e.regNo) return {fee: fee, left: left, status: 'Not registered'};
      D.eReg++;
      var status = left != null && left < 0 ? 'Overdue' : left != null && left <= 30 ? 'Due soon' : 'Registered';
      if (status !== 'Registered') D.eDue++;
      return {fee: fee, left: left, status: status};
    });
    return D;
  }
};
})();
