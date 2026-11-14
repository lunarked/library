"""Builds the Production Planning Excel showcase: schedule, MRP and clear to build, all live formulas."""
import json
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import FormulaRule, CellIsRule
from openpyxl.chart import LineChart, BarChart, Reference
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.utils import get_column_letter as L

BOM = json.load(open('bom.json'))
F = 'Arial'
INK = '1F2937'
f_base = Font(name=F, size=10, color=INK)
f_bold = Font(name=F, size=10, bold=True, color=INK)
f_title = Font(name=F, size=16, bold=True, color='0F3D3E')
f_sub = Font(name=F, size=10, color='4B5563')
f_head = Font(name=F, size=10, bold=True, color='FFFFFF')
f_input = Font(name=F, size=10, color='0000FF')
f_link = Font(name=F, size=10, color='008000')
fill_head = PatternFill('solid', fgColor='0F766E')
fill_input = PatternFill('solid', fgColor='FFF7D6')
fill_band = PatternFill('solid', fgColor='E6F2F1')
fill_kpi = PatternFill('solid', fgColor='F3F4F6')
thin = Side(style='thin', color='D1D5DB')
box = Border(left=thin, right=thin, top=thin, bottom=thin)
GOOD, WARN, BAD = ('DCFCE7', '166534'), ('FEF3C7', '92400E'), ('FEE2E2', '991B1B')

wb = Workbook()

def sheet(title, first=False):
    ws = wb.active if first else wb.create_sheet()
    ws.title = title
    ws.sheet_view.showGridLines = False
    return ws

def cell(ws, ref, v, font=f_base, fill=None, fmt=None, align=None, border=False):
    c = ws[ref]
    c.value = v
    c.font = font
    if fill: c.fill = fill
    if fmt: c.number_format = fmt
    if align: c.alignment = align
    if border: c.border = box
    return c

def header(ws, row, col, labels, widths=None):
    for i, t in enumerate(labels):
        c = ws.cell(row=row, column=col + i, value=t)
        c.font = f_head; c.fill = fill_head; c.border = box
        c.alignment = Alignment(wrap_text=True, vertical='center', horizontal='center')
    ws.row_dimensions[row].height = 32

def status_rules(ws, rng, good, warn, bad):
    for words, (bg, fg) in ((good, GOOD), (warn, WARN), (bad, BAD)):
        for w in words:
            ws.conditional_formatting.add(rng, CellIsRule(operator='equal', formula=['"%s"' % w], fill=PatternFill('solid', fgColor=bg), font=Font(name=F, size=10, bold=True, color=fg)))

def name(n, ref):
    wb.defined_names[n] = DefinedName(n, attr_text=ref)

# ---------------- Read me ----------------
rm = sheet('Read me', first=True)
rm.column_dimensions['A'].width = 3
rm.column_dimensions['B'].width = 26
rm.column_dimensions['C'].width = 90
cell(rm, 'B2', 'Production Planning', f_title)
cell(rm, 'B3', 'Portable speaker S1, 30-part bill of materials. Sample data: type over it.', f_sub)
rows = [
    ('What it does', 'Turns a 12-week build plan into part requirements, tells you when each part must be ordered, and how many devices you can build today.'),
    ('Time', 'Week 1 is this week. Timing is shown as This week, In 1 week, In 2 weeks and so on, so the plan never needs calendar dates.'),
    ('Your inputs', 'Yellow cells with blue text. Everything else is a formula and recalculates when you change an input.'),
    ('1. Settings', 'Line capacity, finished stock, safety stock and the number of devices you want to build.'),
    ('2. Schedule', 'Forecast, firm orders and the planned build per week. Shows finished stock and line use week by week.'),
    ('3. MRP', 'One row per part. Projected stock each week, the week it runs short, when to order, order quantity and value.'),
    ('4. Clear to build', 'Devices you can build from stock today, the part that limits you, and every part short for your target.'),
    ('Status: Covered or OK', 'No action needed.'),
    ('Status: Order soon', 'The part must be ordered within the next 4 weeks.'),
    ('Status: Order now', 'Order this week or the part arrives after it runs out.'),
    ('Status: Late', 'Even an order today arrives after the part runs out. Expedite, split the shipment, or move the build.'),
    ('How MRP works', 'Projected stock = on hand + open order (from the week it arrives) - quantity per device x planned build to date. The part is short in the first week projected stock falls below its safety stock. Order by = short week - lead time.'),
    ('Order quantity', '12-week need + safety stock - on hand - on order, at least the MOQ.'),
]
r = 5
for k, v in rows:
    cell(rm, 'B%d' % r, k, f_bold, align=Alignment(vertical='top'))
    cell(rm, 'C%d' % r, v, align=Alignment(wrap_text=True, vertical='top'))
    rm.row_dimensions[r].height = 30 if len(v) > 95 else 16
    r += 1
cell(rm, 'B%d' % (r + 1), 'Example input', f_bold)
cell(rm, 'C%d' % (r + 1), 3000, f_input, fill_input, '#,##0', border=True)
cell(rm, 'B%d' % (r + 2), 'Example formula', f_bold)
cell(rm, 'C%d' % (r + 2), 'Black text, white cell', f_base, border=True)

# ---------------- Settings ----------------
st = sheet('Settings')
st.column_dimensions['A'].width = 3
st.column_dimensions['B'].width = 34
st.column_dimensions['C'].width = 14
st.column_dimensions['D'].width = 60
cell(st, 'B2', 'Settings', f_title)
cell(st, 'B3', 'Yellow cells are inputs. Names on the right are used by the formulas on the other tabs.', f_sub)
header(st, 5, 2, ['Setting', 'Value', 'Notes'])
settings = [
    ('Line capacity per week, devices', 3000, 'Cap', 'At the planned shifts'),
    ('Finished stock now, devices', 4200, 'FG0', 'Counted at the start of this week'),
    ('Finished safety stock, devices', 2500, 'FGSafe', 'Below this the schedule shows Below safety'),
    ('Devices you want to build', 9000, 'Target', 'Used on the Clear to build tab'),
    ('Order soon window, weeks', 4, 'SoonWeeks', 'Parts to order within this many weeks show Order soon'),
]
for i, (lab, val, nm, note) in enumerate(settings):
    rr = 6 + i
    cell(st, 'B%d' % rr, lab, border=True)
    cell(st, 'C%d' % rr, val, f_input, fill_input, '#,##0', border=True)
    cell(st, 'D%d' % rr, note, f_sub, border=True)
    name(nm, "Settings!$C$%d" % rr)

# ---------------- Schedule ----------------
sc = sheet('Schedule')
sc.column_dimensions['A'].width = 3
for col, w in zip('BCDEFGHIJKL', [9, 13, 12, 12, 13, 12, 13, 10, 15, 11, 11]):
    sc.column_dimensions[col].width = w
cell(sc, 'B2', 'Master production schedule', f_title)
cell(sc, 'B3', 'Twelve weeks from this week. Demand is the larger of forecast and firm orders.', f_sub)
header(sc, 5, 2, ['Week', 'Starts', 'Forecast', 'Firm orders', 'Planned build', 'Demand', 'Finished stock', 'Line use', 'Status', 'Safety stock', 'Capacity'])
fc = [2400, 2500, 2500, 2600, 2700, 2800, 3000, 3200, 3400, 3600, 3400, 3000]
od = [2650, 2300, 1800, 1200, 800, 400, 200, 0, 0, 0, 0, 0]
bd = [2600, 2700, 2700, 2800, 2800, 2900, 3000, 3000, 3200, 3200, 3000, 2900]
for i in range(12):
    rr = 6 + i
    cell(sc, 'B%d' % rr, i + 1, f_bold, border=True, align=Alignment(horizontal='center'))
    cell(sc, 'C%d' % rr, '=IF(B{0}=1,"This week","In "&(B{0}-1)&IF(B{0}=2," week"," weeks"))'.format(rr), border=True)
    cell(sc, 'D%d' % rr, fc[i], f_input, fill_input, '#,##0', border=True)
    cell(sc, 'E%d' % rr, od[i], f_input, fill_input, '#,##0', border=True)
    cell(sc, 'F%d' % rr, bd[i], f_input, fill_input, '#,##0', border=True)
    cell(sc, 'G%d' % rr, '=MAX(D{0},E{0})'.format(rr), fmt='#,##0', border=True)
    prev = 'FG0' if i == 0 else 'H%d' % (rr - 1)
    cell(sc, 'H%d' % rr, '={0}+F{1}-G{1}'.format(prev, rr), fmt='#,##0;[Red]-#,##0', border=True)
    cell(sc, 'I%d' % rr, '=IF(Cap>0,F{0}/Cap,0)'.format(rr), fmt='0.0%', border=True)
    cell(sc, 'J%d' % rr, '=IF(H{0}<0,"Stock out",IF(I{0}>1,"Over capacity",IF(H{0}<FGSafe,"Below safety","OK")))'.format(rr), border=True, align=Alignment(horizontal='center'))
    cell(sc, 'K%d' % rr, '=FGSafe', f_link, fmt='#,##0', border=True)
    cell(sc, 'L%d' % rr, '=Cap', f_link, fmt='#,##0', border=True)
cell(sc, 'B18', 'Total', f_bold, fill_band, border=True)
cell(sc, 'C18', '', fill=fill_band, border=True)
for col in 'DEFG':
    cell(sc, '%s18' % col, '=SUM({0}6:{0}17)'.format(col), f_bold, fill_band, '#,##0', border=True)
cell(sc, 'H18', '=H17', f_bold, fill_band, '#,##0', border=True)
cell(sc, 'I18', '=IF(Cap>0,AVERAGE(F6:F17)/Cap,0)', f_bold, fill_band, '0.0%', border=True)
cell(sc, 'J18', '=COUNTIF(J6:J17,"<>OK")&" weeks to fix"', f_bold, fill_band, border=True)
for col in 'KL':
    cell(sc, '%s18' % col, '', fill=fill_band, border=True)
status_rules(sc, 'J6:J17', ['OK'], ['Below safety', 'Over capacity'], ['Stock out'])
sc.freeze_panes = 'D6'

ch = LineChart()
ch.title = 'Finished stock against safety stock'
ch.y_axis.title = 'Devices'
ch.x_axis.title = 'Week'
ch.add_data(Reference(sc, min_col=8, min_row=5, max_row=17), titles_from_data=True)
ch.add_data(Reference(sc, min_col=11, min_row=5, max_row=17), titles_from_data=True)
ch.set_categories(Reference(sc, min_col=2, min_row=6, max_row=17))
ch.series[0].graphicalProperties.line.solidFill = '0F766E'; ch.series[0].graphicalProperties.line.width = 28000
ch.series[1].graphicalProperties.line.solidFill = 'B45309'; ch.series[1].graphicalProperties.line.dashStyle = 'dash'
ch.height, ch.width = 7.5, 16
sc.add_chart(ch, 'B21')
bc = BarChart()
bc.type = 'col'
bc.title = 'Planned build against line capacity'
bc.y_axis.title = 'Devices'
bc.x_axis.title = 'Week'
bc.add_data(Reference(sc, min_col=6, min_row=5, max_row=17), titles_from_data=True)
bc.set_categories(Reference(sc, min_col=2, min_row=6, max_row=17))
bc.series[0].graphicalProperties.solidFill = '0F766E'
cap = LineChart()
cap.add_data(Reference(sc, min_col=12, min_row=5, max_row=17), titles_from_data=True)
cap.series[0].graphicalProperties.line.solidFill = 'B91C1C'; cap.series[0].graphicalProperties.line.dashStyle = 'dash'
bc += cap
bc.height, bc.width = 7.5, 16
sc.add_chart(bc, 'B37')

# ---------------- MRP ----------------
mr = sheet('MRP')
mr.column_dimensions['A'].width = 3
widths = [11, 24, 7, 10, 10, 10, 8, 9, 9, 8, 11, 9, 9, 16, 12, 11, 12, 10, 11, 11]
for i, w in enumerate(widths):
    mr.column_dimensions[L(2 + i)].width = w
cell(mr, 'B2', 'MRP part requirements', f_title)
cell(mr, 'B3', 'Quantities per device and lead times from the BOM. Projected stock on the right, week by week.', f_sub)
heads = ['Part', 'Description', 'Qty per device', 'On hand', 'On order', 'Order arrives in week', 'Lead time, weeks', 'Safety stock', 'MOQ', 'Unit cost (EUR)',
         'Need, 12 weeks', 'Short in week', 'Order by week', 'When to order', 'Status', 'Order quantity', 'Order value (EUR)', 'Devices from stock', 'With open order', 'Short for target']
header(mr, 5, 2, heads)
G0 = 23  # column W is the first projected-stock week
cell(mr, '%s4' % L(G0), 'Projected stock at the end of each week', f_bold)
header(mr, 5, G0, [i + 1 for i in range(12)])
for i in range(12):
    mr.column_dimensions[L(G0 + i)].width = 8.5
cover = {'IC-BT': (9000, 30000, 3, 2000), 'BAT-PACK': (4200, 8000, 3, 1500), 'GRL-MESH': (24000, 0, None, 1000), 'DRV-WOOF': (26000, 0, None, 2000), 'GSK-SEAL': (5200, 14000, 2, 1500), 'PCB-MAIN': (16000, 20000, 6, 2000)}
first, last = 6, 6 + len(BOM) - 1
gfirst, glast = L(G0), L(G0 + 11)
for i, b in enumerate(BOM):
    rr = 6 + i
    c = cover.get(b[0]) or (round(b[2] * 40000 / 100) * 100, 0, None, round(b[2] * 2000))
    vals = [b[0], b[1], b[2], c[0], c[1], c[2], b[4], c[3], b[5], b[3]]
    fmts = [None, None, '0.00', '#,##0', '#,##0', '0', '0', '#,##0', '#,##0', '0.00']
    for j, v in enumerate(vals):
        cell(mr, '%s%d' % (L(2 + j), rr), v, f_input, fill_input, fmts[j], border=True)
    R = rr
    cell(mr, 'L%d' % R, '=D{0}*SUM(Schedule!$F$6:$F$17)'.format(R), fmt='#,##0', border=True)
    cell(mr, 'M%d' % R, '=IFERROR(MATCH(TRUE,INDEX({1}{0}:{2}{0}<I{0},0),0),"None")'.format(R, gfirst, glast), border=True, align=Alignment(horizontal='center'))
    cell(mr, 'N%d' % R, '=IF(M{0}="None","",M{0}-H{0})'.format(R), fmt='0', border=True, align=Alignment(horizontal='center'))
    cell(mr, 'O%d' % R, '=IF(N{0}="","No order needed",IF(N{0}<1,"Already late",IF(N{0}=1,"This week","In "&(N{0}-1)&IF(N{0}=2," week"," weeks"))))'.format(R), border=True)
    cell(mr, 'P%d' % R, '=IF(M{0}="None","Covered",IF(N{0}<1,"Late",IF(N{0}=1,"Order now",IF(N{0}<=1+SoonWeeks,"Order soon","Covered"))))'.format(R), border=True, align=Alignment(horizontal='center'))
    cell(mr, 'Q%d' % R, '=IF(P{0}="Covered",0,IF(L{0}+I{0}-E{0}-F{0}>0,MAX(CEILING(L{0}+I{0}-E{0}-F{0},1),J{0}),0))'.format(R), fmt='#,##0', border=True)
    cell(mr, 'R%d' % R, '=Q{0}*K{0}'.format(R), fmt='#,##0;-#,##0;-', border=True)
    cell(mr, 'S%d' % R, '=IF(D{0}>0,INT(E{0}/D{0}),"")'.format(R), fmt='#,##0', border=True)
    cell(mr, 'T%d' % R, '=IF(D{0}>0,INT((E{0}+F{0})/D{0}),"")'.format(R), fmt='#,##0', border=True)
    cell(mr, 'U%d' % R, '=MAX(0,CEILING(Target*D{0}-E{0},1))'.format(R), fmt='#,##0;-#,##0;-', border=True)
    for w in range(12):
        col = L(G0 + w)
        f = ('=$E{0}+IF(AND($F{0}>0,{1}$5>=MAX(1,$G{0})),$F{0},0)-$D{0}*SUM(Schedule!$F$6:INDEX(Schedule!$F$6:$F$17,{1}$5))').format(R, col)
        cell(mr, '%s%d' % (col, R), f, fmt='#,##0;[Red]-#,##0', border=True)
status_rules(mr, 'P%d:P%d' % (first, last), ['Covered'], ['Order soon'], ['Order now', 'Late'])
mr.conditional_formatting.add('%s%d:%s%d' % (gfirst, first, glast, last), FormulaRule(formula=['%s%d<$I%d' % (gfirst, first, first)], fill=PatternFill('solid', fgColor='FEE2E2'), font=Font(name=F, size=10, color='991B1B')))
mr.conditional_formatting.add('U%d:U%d' % (first, last), CellIsRule(operator='greaterThan', formula=['0'], font=Font(name=F, size=10, bold=True, color='991B1B')))
tr = last + 1
cell(mr, 'B%d' % tr, 'Total', f_bold, fill_band, border=True)
for col in 'CDEFGHIJKLMNOPQRSTU':
    cell(mr, '%s%d' % (col, tr), '', fill=fill_band, border=True)
mr['P%d' % tr].value = '=COUNTIF(P{0}:P{1},"<>Covered")&" to act on"'.format(first, last)
mr['P%d' % tr].font = f_bold
mr['R%d' % tr].value = '=SUM(R{0}:R{1})'.format(first, last)
mr['R%d' % tr].font = f_bold; mr['R%d' % tr].number_format = '#,##0'
mr.freeze_panes = 'D6'

# ---------------- Clear to build ----------------
cb = sheet('Clear to build')
cb.column_dimensions['A'].width = 3
cb.column_dimensions['B'].width = 38
cb.column_dimensions['C'].width = 18
cb.column_dimensions['D'].width = 50
cell(cb, 'B2', 'Clear to build', f_title)
cell(cb, 'B3', 'How many devices the parts on hand allow, and what stops your target.', f_sub)
header(cb, 5, 2, ['Measure', 'Value', 'How it is worked out'])
R0, R1 = 'MRP!$S$%d:$S$%d' % (first, last), 'MRP!$B$%d:$B$%d' % (first, last)
kpis = [
    ('Devices clear to build now', '=MIN(%s)' % R0, '#,##0', 'Smallest number any single part allows from stock'),
    ('Limiting part', '=INDEX(%s,MATCH(C6,%s,0))' % (R1, R0), None, 'The part to expedite'),
    ('Limiting part, description', '=INDEX(MRP!$C$%d:$C$%d,MATCH(C6,%s,0))' % (first, last, R0), None, ''),
    ('Weeks of planned build covered', '=IFERROR(C6/AVERAGE(Schedule!$F$6:$F$17),0)', '0.0', 'Devices clear to build over average weekly build'),
    ('Devices clear to build with open orders', '=MIN(MRP!$T$%d:$T$%d)' % (first, last), '#,##0', 'On hand plus everything on order'),
    ('Devices you want to build', '=Target', '#,##0', 'From Settings'),
    ('Parts short for the target', '=COUNTIF(MRP!$U$%d:$U$%d,">0")' % (first, last), '0', 'Parts with less on hand than the target needs'),
    ('Parts late', '=COUNTIF(MRP!$P$%d:$P$%d,"Late")' % (first, last), '0', 'Run out before an order can arrive'),
    ('Parts to order this week', '=COUNTIF(MRP!$P$%d:$P$%d,"Order now")' % (first, last), '0', ''),
    ('Parts to order soon', '=COUNTIF(MRP!$P$%d:$P$%d,"Order soon")' % (first, last), '0', 'Within the order soon window'),
    ('Order value, late and this week (EUR)', '=SUMIFS(MRP!$R$%d:$R$%d,MRP!$P$%d:$P$%d,"Late")+SUMIFS(MRP!$R$%d:$R$%d,MRP!$P$%d:$P$%d,"Order now")' % (first, last, first, last, first, last, first, last), '#,##0', ''),
]
for i, (lab, f, fmt, note) in enumerate(kpis):
    rr = 6 + i
    cell(cb, 'B%d' % rr, lab, f_bold if i in (0, 1) else f_base, fill_kpi if i in (0, 1) else None, border=True)
    cell(cb, 'C%d' % rr, f, f_bold if i in (0, 1) else (f_link if i == 5 else f_base), fill_kpi if i in (0, 1) else None, fmt, border=True, align=Alignment(horizontal='right'))
    cell(cb, 'D%d' % rr, note, f_sub, border=True)
cb.conditional_formatting.add('C12:C13', CellIsRule(operator='greaterThan', formula=['0'], font=Font(name=F, size=10, bold=True, color='991B1B')))

# chart data: devices each part allows, sorted lowest first at build time is not possible with live data, so chart all parts
cell(cb, 'F5', 'Part', f_head, fill_head, border=True)
cell(cb, 'G5', 'Devices from stock', f_head, fill_head, border=True)
cb.column_dimensions['F'].width = 12
cb.column_dimensions['G'].width = 12
for i in range(len(BOM)):
    rr = 6 + i
    cell(cb, 'F%d' % rr, '=MRP!B%d' % (first + i), f_link, border=True)
    cell(cb, 'G%d' % rr, '=MRP!S%d' % (first + i), f_link, fmt='#,##0', border=True)
cb.conditional_formatting.add('G6:G%d' % (5 + len(BOM)), FormulaRule(formula=['G6<Target'], fill=PatternFill('solid', fgColor='FEE2E2'), font=Font(name=F, size=10, bold=True, color='991B1B')))
bb = BarChart()
bb.type = 'bar'
bb.title = 'Devices each part allows from stock'
bb.add_data(Reference(cb, min_col=7, min_row=5, max_row=5 + len(BOM)), titles_from_data=True)
bb.set_categories(Reference(cb, min_col=6, min_row=6, max_row=5 + len(BOM)))
bb.series[0].graphicalProperties.solidFill = '0F766E'
bb.legend = None
bb.height, bb.width = 13, 16
bb.y_axis.title = 'Devices'
bb.x_axis.scaling.orientation = 'maxMin'
cb.add_chart(bb, 'B19')

for c in (ch, bc, bb):
    c.roundedCorners = False
    c.x_axis.delete = False
    c.y_axis.delete = False
    if c.legend is not None:
        c.legend.position = 'b'
        c.legend.overlay = False
    if c.title is not None:
        c.title.overlay = False
for c in (ch, bc):
    if c.x_axis.title is not None: c.x_axis.title.overlay = False
    if c.y_axis.title is not None: c.y_axis.title.overlay = False

for ws in wb.worksheets:
    ws.sheet_properties.tabColor = '0F766E' if ws.title != 'Read me' else '4B5563'
for ws in wb.worksheets:
    ws.page_setup.orientation = 'landscape'
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
wb.active = 0
wb.save('production-planning.xlsx')
print('saved')
