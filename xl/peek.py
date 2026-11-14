"""python3 xl/peek.py <folder/name.xlsx> : prints every KPI block and status column values."""
import sys
from openpyxl import load_workbook
wb = load_workbook(sys.argv[1], data_only=True)
for ws in wb.worksheets:
    if ws.title in ('Read me', 'Lists'): continue
    out = []
    for row in ws.iter_rows(min_row=5, max_row=ws.max_row):
        vals = [c.value for c in row[1:] if c.value is not None]
        if vals: out.append(' | '.join(str(round(v, 2)) if isinstance(v, float) else str(v) for v in vals)[:170])
    print('##', ws.title); print('\n'.join(out[:int(sys.argv[2]) if len(sys.argv) > 2 else 60]))
