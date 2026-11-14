/* Shared sample data for the manufacturing workbooks: one portable speaker with a 30-line bill of materials. */
window.MFG = {
  /* part, description, qty per device, unit cost, lead time weeks, MOQ, supplier, single source, make or buy, commodity */
  BOM: [
    ['PCB-MAIN', 'Main board, assembled', 1, 6.80, 10, 1000, 'Board House', 'Yes', 'Buy', 'Electronics'],
    ['IC-BT', 'Bluetooth audio chip', 1, 2.10, 26, 3000, 'Chip Distributor', 'Yes', 'Buy', 'Semiconductors'],
    ['IC-AMP', 'Class D amplifier chip', 1, 0.85, 20, 3000, 'Chip Distributor', 'No', 'Buy', 'Semiconductors'],
    ['IC-CHG', 'Battery charger chip', 1, 0.45, 16, 3000, 'Chip Distributor', 'No', 'Buy', 'Semiconductors'],
    ['DRV-WOOF', 'Woofer driver 50 mm', 1, 3.20, 8, 2000, 'Acoustic Parts', 'Yes', 'Buy', 'Acoustics'],
    ['DRV-TWT', 'Tweeter 20 mm', 2, 0.90, 8, 2000, 'Acoustic Parts', 'No', 'Buy', 'Acoustics'],
    ['RAD-PASS', 'Passive radiator', 2, 0.70, 8, 2000, 'Acoustic Parts', 'No', 'Buy', 'Acoustics'],
    ['BAT-PACK', 'Battery pack 2600 mAh', 1, 5.40, 12, 1000, 'Cell Power', 'Yes', 'Buy', 'Battery'],
    ['ENC-TOP', 'Top housing', 1, 1.10, 6, 1000, 'In house molding', 'No', 'Make', 'Plastics'],
    ['ENC-BOT', 'Bottom housing', 1, 1.05, 6, 1000, 'In house molding', 'No', 'Make', 'Plastics'],
    ['GRL-MESH', 'Metal grille', 1, 0.95, 7, 2000, 'Metal Works', 'Yes', 'Buy', 'Metal'],
    ['BTN-PAD', 'Silicone keypad', 1, 0.20, 5, 5000, 'Rubber Parts', 'No', 'Buy', 'Plastics'],
    ['LED-BRD', 'LED board', 1, 0.60, 8, 2000, 'Board House', 'No', 'Buy', 'Electronics'],
    ['CBL-FFC', 'Flex cable', 2, 0.15, 6, 5000, 'Cable Co', 'No', 'Buy', 'Electronics'],
    ['CON-USBC', 'USB-C connector', 1, 0.22, 10, 5000, 'Chip Distributor', 'No', 'Buy', 'Electronics'],
    ['ANT-BT', 'Antenna', 1, 0.12, 8, 5000, 'Cable Co', 'No', 'Buy', 'Electronics'],
    ['GSK-SEAL', 'Waterproof seal', 1, 0.18, 6, 5000, 'Rubber Parts', 'No', 'Buy', 'Plastics'],
    ['SCR-M2', 'Screw M2 x 6', 12, 0.01, 4, 50000, 'Fastener Co', 'No', 'Buy', 'Hardware'],
    ['FOAM-AC', 'Acoustic foam', 2, 0.05, 4, 10000, 'Foam Co', 'No', 'Buy', 'Hardware'],
    ['LBL-RTG', 'Rating label', 1, 0.03, 3, 10000, 'Print Co', 'No', 'Buy', 'Packaging'],
    ['STRAP', 'Carry strap', 1, 0.40, 5, 3000, 'Textile Co', 'No', 'Buy', 'Accessories'],
    ['FEET', 'Rubber feet', 4, 0.02, 4, 20000, 'Rubber Parts', 'No', 'Buy', 'Hardware'],
    ['TAG-NFC', 'NFC pairing tag', 1, 0.10, 8, 5000, 'Chip Distributor', 'No', 'Buy', 'Electronics'],
    ['BOX-RET', 'Retail box', 1, 0.65, 4, 3000, 'Print Co', 'No', 'Buy', 'Packaging'],
    ['TRAY', 'Pulp tray', 1, 0.18, 4, 3000, 'Print Co', 'No', 'Buy', 'Packaging'],
    ['CBL-USB', 'USB-C cable 1 m', 1, 0.55, 6, 3000, 'Cable Co', 'No', 'Buy', 'Accessories'],
    ['QSG', 'Quick start guide', 1, 0.06, 3, 10000, 'Print Co', 'No', 'Buy', 'Packaging'],
    ['BAG-PE', 'Protective bag', 1, 0.02, 3, 20000, 'Print Co', 'No', 'Buy', 'Packaging'],
    ['CTN-6', 'Shipping carton, 6 devices', 0.17, 0.70, 3, 2000, 'Print Co', 'No', 'Buy', 'Packaging'],
    ['ADH-PAD', 'Adhesive pad', 3, 0.03, 4, 20000, 'Foam Co', 'No', 'Buy', 'Hardware']
  ],
  rel: function (W, n) { var d = new Date(); return W.isoOf(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + n * W.DAY); },
  monday: function (W, k) { var d = new Date(), t = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); return W.isoOf(t - ((d.getDay() + 6) % 7) * W.DAY + 7 * k * W.DAY); }
};
