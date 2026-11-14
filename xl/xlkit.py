"""Shared Excel generator for the workbook library.

Each workbook script describes sheets as settings blocks, KPI blocks, tables and charts.
Formulas are templates:
  {col}        the cell in column `col` of the current table row
  {col^}       the same column one row up
  {col@top}    the first data row of that column, row fixed: X$6
  {n}          1-based row number inside the table
  [tbl.col]    the whole data range of a column in any table: 'Sheet'!$X$6:$X$20
  [tbl.col#3]  one cell of that column, 0-based row index
  in_<key>     a settings value (defined name)
Time inputs are stored as numbers relative to today (days, weeks or months) and shown as
"In 5 days" or "3 days ago", so the workbook never needs calendar dates.
"""
import json, os, re, subprocess, datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import FormulaRule
from openpyxl.chart import LineChart, BarChart, Reference
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter as L

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RECALC = '/root/.claude/skills/synced/c539c3c7-21c0-4542-873d-654e8ca1c011_50a2d5fd-4870-438b-a525-bb20fe8f0cbb/xlsx/scripts/recalc.py'
FONT = 'Arial'
INK, TEAL, MUTED = '1F2937', '0F766E', '4B5563'
f_base = Font(name=FONT, size=10, color=INK)
f_bold = Font(name=FONT, size=10, bold=True, color=INK)
f_title = Font(name=FONT, size=16, bold=True, color='0F3D3E')
f_sec = Font(name=FONT, size=11, bold=True, color=TEAL)
f_sub = Font(name=FONT, size=10, color=MUTED)
f_head = Font(name=FONT, size=10, bold=True, color='FFFFFF')
f_input = Font(name=FONT, size=10, color='0000FF')
fill_head = PatternFill('solid', fgColor=TEAL)
fill_input = PatternFill('solid', fgColor='FFF7D6')
fill_band = PatternFill('solid', fgColor='E6F2F1')
fill_kpi = PatternFill('solid', fgColor='F3F4F6')
thin = Side(style='thin', color='D1D5DB')
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
TONE = {'good': ('DCFCE7', '166534'), 'warn': ('FEF3C7', '92400E'), 'bad': ('FEE2E2', '991B1B')}
TIME_KINDS = {'days': 1, 'weeks': 7, 'months': 30.44}


def load(folder, name):
    out = subprocess.check_output(['node', os.path.join(ROOT, 'xl', 'dump.js'), folder, name])
    return json.loads(out)


class Col:
    def __init__(self, k, label, kind='num', w=11, f=None, status=False, total=None, fmt=None, opts=None, fixed=False, src=None):
        self.k, self.label, self.kind, self.w, self.f = k, label, kind, w, f
        self.status, self.total, self.fmt, self.opts, self.fixed = status, total, fmt, opts, fixed
        self.src = src or k
        self.input = f is None and not fixed


def I(k, label, kind='num', w=11, **kw): return Col(k, label, kind, w, **kw)
def F(k, label, f, kind='num', w=11, **kw): return Col(k, label, kind, w, f=f, **kw)
def S(k, label, f, w=13, **kw): return Col(k, label, 'text', w, f=f, status=True, **kw)
def LBL(label, w=26): return Col('_label', label, 'text', w, fixed=True)


def when(ref, unit='days'):
    """Text such as 'In 5 days' or '3 days ago' for a relative time cell."""
    one, many = unit[:-1], unit
    zero = {'days': 'Today', 'weeks': 'This week', 'months': 'This month'}[unit]
    return ('IF({r}="","",IF({r}=0,"{z}",IF({r}>0,"In "&{r}&IF({r}=1," {o}"," {m}"),-{r}&IF({r}=-1," {o} ago"," {m} ago"))))'
            .format(r=ref, z=zero, o=one, m=many))


class Sheet:
    def __init__(self, book, name, title, sub, purpose):
        self.book, self.name, self.title, self.sub, self.purpose = book, name, title, sub, purpose
        self.items = []
        self.widths = {}

    def settings(self, items, title='Settings'):
        self.items.append(('settings', title, items)); return self

    def kpis(self, items, title='Key figures'):
        self.items.append(('kpis', title, items)); return self

    def table(self, key, cols, rows=None, fixed=None, title=None, help=None, total=True):
        if rows is None:
            rows = self.book.d['t'].get(key, [])
        if fixed is None:
            fixed = (self.book.d['tables'].get(key) or {}).get('fixed')
        self.items.append(('table', key, cols, rows, fixed, title, help, total)); return self

    def chart(self, kind, title, table, cat, series, ytitle=None, horizontal=False):
        self.items.append(('chart', kind, title, table, cat, series, ytitle, horizontal)); return self

    def note(self, text):
        self.items.append(('note', text)); return self


class Book:
    def __init__(self, folder, name, cur=None, data=None, tones=None):
        self.folder, self.name = folder, name
        self.d = data or load(folder, name)
        for t, words in (tones or {}).items():
            self.d['tones'][t] = self.d['tones'][t] + words
        c = cur or (self.d['f'].get('currency') if isinstance(self.d['f'].get('currency'), str) else None) or '$'
        self.cur = c
        self.today = datetime.date.fromisoformat(self.d['today'])
        self.sheets, self.tables, self.names = [], {}, {}
        self.uses_time = set()

    def sheet(self, name, title, sub='', purpose=''):
        s = Sheet(self, name, title, sub, purpose); self.sheets.append(s); return s

    # ---------- values ----------
    def conv(self, v, kind):
        if v is None or v == '':
            return None
        if kind in TIME_KINDS:
            if isinstance(v, str) and re.match(r'^\d{4}-\d{2}-\d{2}$', v):
                d = datetime.date.fromisoformat(v)
                if kind == 'weeks':
                    monday = self.today - datetime.timedelta(days=self.today.weekday())
                    return (d - monday).days // 7
                if kind == 'months':
                    return (d.year - self.today.year) * 12 + d.month - self.today.month
                return (d - self.today).days
            return v
        if kind in ('pct', 'spct') and isinstance(v, (int, float)):
            return v / 100.0
        return v

    def fmt(self, kind):
        c = self.cur
        return {
            'int': '#,##0', 'sint': '+#,##0;-#,##0;0', 'num': 'General', 'dec1': '0.0', 'dec2': '0.00', 'dec3': '0.000',
            'money': c + '#,##0;-' + c + '#,##0', 'money2': c + '#,##0.00;-' + c + '#,##0.00', 'smoney': '+' + c + '#,##0;-' + c + '#,##0;' + c + '0',
            'pct': '0.0%', 'spct': '+0.0%;-0.0%;0.0%', 'text': '@',
            'days': '"In "0" days";0" days ago";"Today"', 'weeks': '"In "0" weeks";0" weeks ago";"This week"',
            'months': '"In "0" months";0" months ago";"This month"', 'year': '0',
        }.get(kind, 'General')

    # ---------- formulas ----------
    def render(self, tpl, tbl=None, r=None, n=None):
        if not isinstance(tpl, str) or not tpl.startswith('='):
            return tpl

        def rng(m):
            key, col, idx = m.group(1), m.group(2), m.group(3)
            t = self.tables[key] if key else tbl
            x = t['cols'][col]
            sh = "'%s'!" % t['sheet']
            if idx is not None:
                return '%s$%s$%d' % (sh, x, t['first'] + int(idx))
            return '%s$%s$%d:$%s$%d' % (sh, x, t['first'], x, t['last'])
        out = re.sub(r'\[([a-zA-Z0-9_]*)\.([a-zA-Z0-9_]+)(?:#(\d+))?\]', rng, tpl)
        if tbl is not None and r is not None:
            def cellref(m):
                k, mod = m.group(1), m.group(2)
                if k == 'r': return str(r)
                if k == 'n': return str(n)
                x = tbl['cols'][k]
                if mod == '^': return '%s%d' % (x, r - 1)
                if mod == '@top': return '%s$%d' % (x, tbl['first'])
                if mod == '@bot': return '%s$%d' % (x, tbl['last'])
                return '%s%d' % (x, r)
            out = re.sub(r'\{([a-zA-Z0-9_]+)(\^|@top|@bot)?\}', cellref, out)
        return out

    # ---------- layout pass ----------
    def layout(self):
        for s in self.sheets:
            row = 5
            s.placed = []
            for it in s.items:
                kind = it[0]
                if kind == 'settings':
                    _, title, items = it
                    start = row + 1
                    for i, x in enumerate(items):
                        self.names['in_' + x[0]] = "'%s'!$C$%d" % (s.name, start + 1 + i)
                    s.placed.append((it, row)); row = start + 1 + len(items) + 1
                elif kind == 'kpis':
                    for i, x in enumerate(it[2]):
                        if len(x) > 4 and x[4]:
                            self.names['k_' + x[4]] = "'%s'!$C$%d" % (s.name, row + 2 + i)
                    s.placed.append((it, row)); row = row + 2 + len(it[2]) + 1
                elif kind == 'table':
                    _, key, cols, rows, fixed, title, help, total = it
                    nrows = len(fixed) if fixed else len(rows)
                    head = row + 1 + (1 if help else 0)
                    first = head + 1
                    last = first + max(nrows, 1) - 1
                    self.tables[key] = {'sheet': s.name, 'first': first, 'last': last, 'cols': {c.k: L(2 + j) for j, c in enumerate(cols)}}
                    has_total = total and any(c.total for c in cols)
                    s.placed.append((it, row)); row = last + (2 if has_total else 1) + 1
                elif kind == 'chart':
                    s.placed.append((it, row)); row += 20
                elif kind == 'note':
                    s.placed.append((it, row)); row += 2

    # ---------- write pass ----------
    def save(self):
        self.layout()
        wb = Workbook()
        rm = wb.active; rm.title = 'Read me'
        lists = wb.create_sheet('Lists')
        for j, t in enumerate(('good', 'warn', 'bad')):
            words = self.d['tones'][t]
            lists.cell(row=1, column=j + 1, value=t)
            for i, w in enumerate(words):
                lists.cell(row=2 + i, column=j + 1, value=w)
            wb.defined_names['tone_' + t] = DefinedName('tone_' + t, attr_text="Lists!$%s$2:$%s$%d" % (L(j + 1), L(j + 1), 1 + len(words)))
        lists.sheet_state = 'hidden'
        for k, v in self.names.items():
            wb.defined_names[k] = DefinedName(k, attr_text=v)
        made = {s.name: wb.create_sheet(s.name) for s in self.sheets}
        for s in self.sheets:
            ws = made[s.name]
            ws.sheet_view.showGridLines = False
            ws.column_dimensions['A'].width = 3
            ws['B2'] = s.title; ws['B2'].font = f_title
            if s.sub:
                ws['B3'] = s.sub; ws['B3'].font = f_sub
            widths = {}
            for it, row in s.placed:
                getattr(self, '_w_' + it[0])(ws, it, row, widths)
            for col, w in widths.items():
                ws.column_dimensions[col].width = w
            ws.freeze_panes = 'B5'
            ws.page_setup.orientation = 'landscape'
            ws.page_setup.fitToWidth = 1
            ws.page_setup.fitToHeight = 0
            ws.sheet_properties.pageSetUpPr.fitToPage = True
            ws.sheet_properties.tabColor = TEAL
        self._readme(rm)
        wb.move_sheet('Lists', offset=len(wb.sheetnames))
        wb.active = 0
        path = os.path.join(ROOT, self.folder, self.name + '.xlsx')
        wb.save(path)
        res = json.loads(subprocess.check_output(['python3', RECALC, path, '90']))
        return path, res

    def _cell(self, ws, row, col, v, font=f_base, fill=None, fmt=None, align=None):
        c = ws.cell(row=row, column=col, value=v)
        c.font = font; c.border = BOX
        if fill: c.fill = fill
        if fmt: c.number_format = fmt
        if align: c.alignment = align
        return c

    def _head(self, ws, row, labels, col=2):
        for i, t in enumerate(labels):
            self._cell(ws, row, col + i, t, f_head, fill_head, align=Alignment(wrap_text=True, vertical='center', horizontal='center'))
        ws.row_dimensions[row].height = 30

    def _status_cf(self, ws, rng, topleft):
        for t in ('good', 'warn', 'bad'):
            bg, fg = TONE[t]
            ws.conditional_formatting.add(rng, FormulaRule(formula=['COUNTIF(tone_%s,%s)>0' % (t, topleft)], fill=PatternFill('solid', fgColor=bg), font=Font(name=FONT, size=10, bold=True, color=fg)))

    def _w_settings(self, ws, it, row, widths):
        _, title, items = it
        ws.cell(row=row, column=2, value=title).font = f_sec
        self._head(ws, row + 1, ['Setting', 'Value'])
        ws.cell(row=row + 1, column=4, value='Notes').font = f_bold
        for i, x in enumerate(items):
            key, label, val, kind = x[0], x[1], x[2], x[3]
            note = x[4] if len(x) > 4 else ''
            opts = x[5] if len(x) > 5 else None
            r = row + 2 + i
            self._cell(ws, r, 2, label)
            v = self.conv(val, kind)
            c = self._cell(ws, r, 3, v, f_input, fill_input, self.fmt(kind), Alignment(horizontal='right'))
            if kind in TIME_KINDS: self.uses_time.add(kind)
            if opts:
                dv = DataValidation(type='list', formula1='"%s"' % ','.join(str(o) for o in opts), allow_blank=True)
                ws.add_data_validation(dv); dv.add(c)
            ws.cell(row=r, column=4, value=note).font = f_sub
        widths['B'] = max(widths.get('B', 0), 34); widths['C'] = max(widths.get('C', 0), 14)

    def _w_kpis(self, ws, it, row, widths):
        _, title, items = it
        ws.cell(row=row, column=2, value=title).font = f_sec
        self._head(ws, row + 1, ['Measure', 'Value'])
        ws.cell(row=row + 1, column=4, value='How it is worked out').font = f_bold
        for i, x in enumerate(items):
            label, f, kind = x[0], x[1], x[2]
            note = x[3] if len(x) > 3 else ''
            r = row + 2 + i
            self._cell(ws, r, 2, label, f_bold, fill_kpi)
            self._cell(ws, r, 3, self.render(f), f_bold, fill_kpi, self.fmt(kind), Alignment(horizontal='right'))
            if kind == 'status': self._status_cf(ws, 'C%d' % r, 'C%d' % r)
            ws.cell(row=r, column=4, value=note).font = f_sub
        widths['B'] = max(widths.get('B', 0), 34); widths['C'] = max(widths.get('C', 0), 14)

    def _w_table(self, ws, it, row, widths):
        _, key, cols, rows, fixed, title, help, total = it
        t = self.tables[key]
        if title:
            ws.cell(row=row, column=2, value=title).font = f_sec
        head = row + 1
        if help:
            ws.cell(row=head, column=2, value=help).font = f_sub
            head += 1
        self._head(ws, head, [c.label for c in cols])
        n = len(fixed) if fixed else len(rows)
        for j, c in enumerate(cols):
            x = L(2 + j)
            widths[x] = max(widths.get(x, 0), c.w)
            if c.kind in TIME_KINDS: self.uses_time.add(c.kind)
        for i in range(n):
            r = t['first'] + i
            data = rows[i] if i < len(rows) else {}
            for j, c in enumerate(cols):
                if c.fixed:
                    self._cell(ws, r, 2 + j, fixed[i], f_bold)
                elif c.input:
                    v = self.conv(data.get(c.src), c.kind)
                    cell = self._cell(ws, r, 2 + j, v, f_input, fill_input, self.fmt(c.fmt or c.kind))
                    if c.opts:
                        dv = DataValidation(type='list', formula1='"%s"' % ','.join(str(o) for o in c.opts), allow_blank=True)
                        ws.add_data_validation(dv); dv.add(cell)
                else:
                    if isinstance(c.f, list): f = c.f[i]
                    else: f = c.f[0] if isinstance(c.f, tuple) and i == 0 else (c.f[1] if isinstance(c.f, tuple) else c.f)
                    al = Alignment(horizontal='center') if c.status else None
                    self._cell(ws, r, 2 + j, self.render(f, t, r, i + 1), f_base, None, self.fmt(c.fmt or c.kind), al)
        for j, c in enumerate(cols):
            if c.status and n:
                x = L(2 + j)
                self._status_cf(ws, '%s%d:%s%d' % (x, t['first'], x, t['last']), '%s%d' % (x, t['first']))
        if total and any(c.total for c in cols):
            r = t['last'] + 1
            for j, c in enumerate(cols):
                x = L(2 + j)
                v = None
                if j == 0: v = 'Total'
                if c.total == 'sum': v = '=SUM(%s%d:%s%d)' % (x, t['first'], x, t['last'])
                elif c.total: v = self.render(c.total, t, r, None)
                self._cell(ws, r, 2 + j, v, f_bold, fill_band, self.fmt(c.fmt or c.kind) if c.total else None)

    def _w_chart(self, ws, it, row, widths):
        _, kind, title, tkey, cat, series, ytitle, horizontal = it
        t = self.tables[tkey]
        src = ws.parent[t['sheet']]
        from openpyxl.utils import column_index_from_string as CI
        if kind == 'bar':
            ch = BarChart(); ch.type = 'bar' if horizontal else 'col'
            if horizontal: ch.x_axis.scaling.orientation = 'maxMin'
        else:
            ch = LineChart()
        colors = [TEAL, 'B45309', '1D4ED8', 'B91C1C']
        for i, sk in enumerate(series):
            c = CI(t['cols'][sk])
            ch.add_data(Reference(src, min_col=c, min_row=t['first'] - 1, max_row=t['last']), titles_from_data=True)
            s = ch.series[-1]
            if kind == 'bar':
                s.graphicalProperties.solidFill = colors[i % 4]
            else:
                s.graphicalProperties.line.solidFill = colors[i % 4]; s.graphicalProperties.line.width = 22000
                if i: s.graphicalProperties.line.dashStyle = 'dash'
        cc = CI(t['cols'][cat])
        ch.set_categories(Reference(src, min_col=cc, min_row=t['first'], max_row=t['last']))
        ch.title = title
        if ytitle: ch.y_axis.title = ytitle
        ch.roundedCorners = False
        ch.x_axis.delete = False; ch.y_axis.delete = False
        ch.title.overlay = False
        if ch.y_axis.title is not None: ch.y_axis.title.overlay = False
        if len(series) > 1:
            ch.legend.position = 'b'; ch.legend.overlay = False
        else:
            ch.legend = None
        ch.height, ch.width = 9, 18
        ws.add_chart(ch, 'B%d' % (row + 1))

    def _w_note(self, ws, it, row, widths):
        ws.cell(row=row, column=2, value=it[1]).font = f_sub

    def _readme(self, rm):
        d = self.d
        rm.sheet_view.showGridLines = False
        rm.column_dimensions['A'].width = 3; rm.column_dimensions['B'].width = 26; rm.column_dimensions['C'].width = 100
        rm['B2'] = d['title']; rm['B2'].font = f_title
        rm['B3'] = d['desc']; rm['B3'].font = f_sub
        rows = [('Your inputs', 'Yellow cells with blue text. Everything else is a formula and recalculates when you change an input. The sample data is an example; type over it.'),
                ('Adding rows', 'Insert a row inside a table and copy the row above into it, so the formulas and totals include it.')]
        if self.uses_time:
            u = ', '.join(sorted(self.uses_time))
            rows.append(('Time', 'Time is counted from today in %s, never as calendar dates. Type 5 for in 5 %s, -3 for 3 %s ago, 0 for now. Cells show it as In 5 %s or 3 %s ago.' % (u, sorted(self.uses_time)[0], sorted(self.uses_time)[0], sorted(self.uses_time)[0], sorted(self.uses_time)[0])))
        rows.append(('Status colors', 'Green is fine, amber needs watching, red needs action.'))
        for s in self.sheets:
            rows.append((s.name, s.purpose or s.sub))
        for i, n in enumerate(d.get('notes') or []):
            rows.append(('How it works' if i == 0 else '', n))
        r = 5
        for k, v in rows:
            rm.cell(row=r, column=2, value=k).font = f_bold
            c = rm.cell(row=r, column=3, value=v); c.font = f_base; c.alignment = Alignment(wrap_text=True, vertical='top')
            rm.cell(row=r, column=2).alignment = Alignment(vertical='top')
            rm.row_dimensions[r].height = 15 * max(1, (len(v) // 110) + 1)
            r += 1
        r += 1
        rm.cell(row=r, column=2, value='Example input').font = f_bold
        c = rm.cell(row=r, column=3, value=1200); c.font = f_input; c.fill = fill_input; c.border = BOX; c.number_format = '#,##0'
        rm.cell(row=r + 1, column=2, value='Example formula').font = f_bold
        c = rm.cell(row=r + 1, column=3, value='Black text in a white cell'); c.font = f_base; c.border = BOX


def report(path, res):
    ok = res.get('status') == 'success' and not res.get('total_errors')
    print(os.path.basename(path), 'OK' if ok else 'ERRORS', res.get('total_formulas'), json.dumps(res.get('error_summary'))[:600] if not ok else '')
    return ok
