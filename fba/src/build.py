"""Builds each fba/<name>.html from template.html, style.css, engine.js and specs/<name>.js."""
import io, os, re, glob
here = os.path.dirname(os.path.abspath(__file__))
read = lambda p: io.open(os.path.join(here, p), encoding='utf-8').read()
tpl, css, engine = read('template.html'), read('style.css'), read('engine.js')
for path in sorted(glob.glob(os.path.join(here, 'specs', '*.js'))):
    name = os.path.splitext(os.path.basename(path))[0]
    spec = io.open(path, encoding='utf-8').read()
    title = re.search(r"title: '([^']+)'", spec).group(1)
    desc = re.search(r"desc: '([^']+)'", spec).group(1)
    page = tpl.replace('__CSS__', css).replace('__SPEC__', spec).replace('__ENGINE__', engine)
    page = page.replace('__TITLE__', title + ' Workbook').replace('__H1__', title).replace('__DESC__', desc)
    assert not re.search('[–—]', page), name + ' has a dash'
    io.open(os.path.join(here, '..', name + '.html'), 'w', encoding='utf-8').write(page)
    print('built', name, len(page))
