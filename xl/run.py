"""python3 xl/run.py <series> [function names...]"""
import sys, importlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from xlkit import report
mod = importlib.import_module(sys.argv[1])
names = sys.argv[2:] or mod.ALL
bad = 0
for n in names:
    b = getattr(mod, n)()
    path, res = b.save()
    if not report(path, res): bad += 1
sys.exit(1 if bad else 0)
