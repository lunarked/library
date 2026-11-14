"""Builds every workbook page from template.html, style.css, engine.js and a spec file.
Series: fba/src/specs/<name>.js -> fba/<name>.html and escooter/src/specs/<name>.js -> escooter/<name>.html."""
import io, os, re, glob
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.normpath(os.path.join(here, '..', '..'))
read = lambda p: io.open(os.path.join(here, p), encoding='utf-8').read()
tpl, css, engine = read('template.html'), read('style.css'), read('engine.js')
SERIES = [
    ('fba', {'KIND': 'FBA workbook', 'B1': 'Brand or business', 'B1PH': 'Brand name', 'B2': 'Marketplace', 'B2PH': 'Amazon.com (US)'}),
    ('escooter', {'KIND': 'E-scooter ops workbook', 'B1': 'Operator', 'B1PH': 'Operator name', 'B2': 'Cities or region', 'B2PH': 'Berlin, Munich, Hamburg'}),
]
for folder, labels in SERIES:
    for path in sorted(glob.glob(os.path.join(root, folder, 'src', 'specs', '*.js'))):
        name = os.path.splitext(os.path.basename(path))[0]
        spec = io.open(path, encoding='utf-8').read()
        title = re.search(r"title: '([^']+)'", spec).group(1)
        desc = re.search(r"desc: '([^']+)'", spec).group(1)
        page = tpl.replace('__CSS__', css).replace('__SPEC__', spec).replace('__ENGINE__', engine)
        page = page.replace('__TITLE__', title + ' Workbook').replace('__H1__', title).replace('__DESC__', desc)
        for k, v in labels.items():
            page = page.replace('__' + k + '__', v)
        assert '__' not in re.sub(r'<script.*?</script>', '', page, flags=re.S), name + ' has a placeholder left'
        assert not re.search('[–—]', page), name + ' has a dash'
        io.open(os.path.join(root, folder, name + '.html'), 'w', encoding='utf-8').write(page)
        print('built', folder + '/' + name, len(page))
