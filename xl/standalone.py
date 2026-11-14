"""Excel versions of the two standalone FBA pages: Listing and Launch, Demand and Inventory."""
import datetime
from xlkit import Book, I, F, S, LBL, load

FOLDER = 'fba'
TODAY = datetime.date.today().isoformat()


def base(title, desc, notes, f, t, tables, extra_good=(), extra_warn=(), extra_bad=()):
    tones = load('fba', 'advertising')['tones']
    tones = {'good': tones['good'] + list(extra_good), 'warn': tones['warn'] + list(extra_warn), 'bad': tones['bad'] + list(extra_bad)}
    return {'today': TODAY, 'title': title, 'desc': desc, 'notes': notes, 'f': f, 't': t, 'biz': {}, 'tables': tables, 'tones': tones}


def listing_and_launch():
    copy = [('Title', 75, 'ExampleBrand Portable Bluetooth Speaker, 20 W, IPX7 Waterproof, Black'),
            ('Item highlights', 125, '24 hour battery, USB-C fast charging, pairs with two phones, passive bass radiator, carabiner clip, for travel and shower'),
            ('Bullet 1', 500, '24 HOUR BATTERY: One charge covers a full weekend away. USB-C fast charging brings it back to full in about 3 hours.'),
            ('Bullet 2', 500, 'IPX7 WATERPROOF: Rated for 30 minutes under 1 m of water, so rain, the shower and the pool are all fine.'),
            ('Bullet 3', 500, '20 W STEREO SOUND: Two drivers and a passive bass radiator fill a room without distortion at full volume.'),
            ('Bullet 4', 500, 'POCKET SIZE: 540 g and shorter than a soda can. Clips to a backpack with the included carabiner.'),
            ('Bullet 5', 500, ''),
            ('Description', 2000, 'A small speaker built for trips. It plays for 24 hours on one charge, survives a drop in the pool and pairs with two phones at once. In the box: speaker, USB-C cable, carabiner, quick start guide.'),
            ('Backend search terms', 249, 'wireless speaker bocina portatil altavoz shower beach camping hiking gift small loud bass')]
    assets = [('Main image', 'Product only on a pure white background, filling most of the frame', 'Done'), ('Image 2: key features', 'Three or four callouts on the product, readable on a phone', 'Done'),
              ('Image 3: in use', 'Lifestyle shot that shows who uses it and where', 'In progress'), ('Image 4: size and scale', 'Dimensions plus a hand or everyday object for scale', 'In progress'),
              ('Image 5: in the box', 'Every included item laid out and labeled', 'Not started'), ('Image 6: compatibility', 'Ports, devices and standards it works with', 'Not started'),
              ('Image 7: comparison', 'Your own range side by side, never a named competitor', 'Not started'), ('Product video', '30 to 60 seconds, with the product working in the first 5 seconds', 'Not started'),
              ('A+ content', 'Brand header, feature modules, comparison table', 'Not started'), ('Brand Story', 'Brand module with links to the rest of the range', 'Not started')]
    comp = [('Battery details', 'Type, cell count, weight, watt-hours, lithium content', 'Done'), ('Dangerous goods documents', 'SDS or exemption sheet uploaded for the ASIN', 'In progress'),
            ('UN38.3 test summary', 'On file from the cell or pack supplier', 'In progress'), ('Radio compliance', 'FCC information for anything with Bluetooth or Wi-Fi (US)', 'Not started'),
            ('Country of origin', 'Matches the marking on product and carton', 'Done'), ('Warranty and manual', 'Warranty text entered, manual PDF uploaded', 'Not started'),
            ('EU responsible person', 'Name and address on listing and packaging (EU only)', 'Not started'), ('EU EPR numbers', 'WEEE, battery and packaging registrations entered (EU only)', 'Not started')]
    kw = [['bluetooth speaker', 450000, 5, 5, 'Title', 'Yes', 48, 20, 'Head term, expensive clicks'], ['portable bluetooth speaker', 135000, 5, 5, 'Title', 'Yes', 35, 15, ''],
          ['waterproof speaker', 74000, 4, 4, 'Title', 'Yes', 22, 10, ''], ['shower speaker', 49500, 3, 3, 'Not used', 'No', None, None, 'Add to bullet 2'],
          ['outdoor speaker bluetooth', 33100, 4, 3, 'Bullets', 'Yes', 30, 15, ''], ['small speaker for travel', 8100, 5, 2, 'Backend', 'Yes', 12, 8, ''],
          ['speaker with 24 hour battery', 2900, 5, 1, 'Item highlights', 'Yes', 6, 5, 'Converts well'], ['usb c speaker', 6600, 3, 2, 'Backend', 'No', 40, 20, '']]
    budget = [('PPC advertising', 3000), ('Coupons and deal fees', 600), ('Vine enrollment fee', 200), ('Vine units at landed cost', None), ('Photography and video', 1200), ('A+ content and copy', 400), ('Samples and testing', 350)]
    tasks = [['Finalize listing copy and keywords', 'Pre-launch', -30, 'Done'], ['Images, video and A+ approved', 'Pre-launch', -21, 'In progress'], ['Dangerous goods review cleared', 'Pre-launch', -21, 'In progress'],
             ['First shipment checked in at FBA', 'Pre-launch', -10, 'Not started'], ['Enroll in Vine', 'Launch', 0, 'Not started'], ['Start auto and exact PPC campaigns', 'Launch', 0, 'Not started'],
             ['Switch on launch coupon', 'Launch', 1, 'Not started'], ['First search term harvest', 'Ramp', 14, 'Not started'], ['First price and bid review', 'Ramp', 21, 'Not started'],
             ['Reorder decision', 'Ramp', 30, 'Not started'], ['End coupon, review TACoS', 'Steady', 45, 'Not started'], ['Launch review against targets', 'Steady', 60, 'Not started']]
    reviews = [[1, 60, 4, 4.8, 0, '', ''], [2, 95, 11, 4.6, 1, 'Bluetooth pairing drops', 'Added pairing steps to image 2'], [3, 130, 19, 4.5, 1, 'Bluetooth pairing drops', 'Raised with supplier, firmware check'],
               [4, 150, 30, 4.4, 2, 'Cable missing from box', 'Pack-out check added to QC log'], [5, 170, 41, 4.4, 1, 'Cable missing from box', 'Confirmed fixed in new batch'],
               [6, 185, 55, 4.5, 1, 'Quieter than expected', 'Reworded sound claim in bullet 3']]
    launch_in = (datetime.date(2027, 2, 1) - datetime.date.today()).days
    f = {'tierA': 40000, 'tierB': 10000, 'launch': launch_in, 'price': 49.99, 'landed': 14.5, 'fees': 11.2, 'units': 1000, 'window': 60, 'vine': 30, 'targetRating': 4.4, 'targetCount': 100}
    t = {'copy': [{'text': c[2], 'limit': c[1]} for c in copy], 'assets': [{'spec': a[1], 'status': a[2]} for a in assets], 'comp': [{'spec': a[1], 'status': a[2]} for a in comp],
         'kw': [dict(zip(['kw', 'searches', 'rel', 'comp', 'place', 'ppc', 'rank', 'target', 'notes'], r)) for r in kw],
         'budget': [{'planned': b[1]} for b in budget], 'tasks': [dict(zip(['task', 'phase', 'offset', 'status'], r)) for r in tasks],
         'rev': [dict(zip(['week', 'units', 'total', 'rating', 'neg', 'theme', 'action'], r)) for r in reviews]}
    tables = {'copy': {'fixed': [c[0] for c in copy]}, 'assets': {'fixed': [a[0] for a in assets]}, 'comp': {'fixed': [a[0] for a in comp]}, 'budget': {'fixed': [b[0] for b in budget]}}
    notes = ['Amazon limits: title 75 characters on most categories, item highlights 125 characters, bullets 500 each, backend search terms 249 bytes. Check the style guide for your category.',
             'Keyword score is monthly searches times relevance over competition. Tier A from the tier A score, tier B from the tier B score; place every tier A keyword in the title, highlights or bullets.',
             'Launch budget: Vine units cost the landed cost of each unit given away. Units to recover is the launch budget over the margin per unit before ads.']
    d = base('Listing and Launch', 'Write the listing against Amazon\'s limits, rank keywords, plan the launch budget and timeline, and track reviews week by week.', notes, f, t, tables,
             extra_good=['OK'], extra_warn=['Not started', 'Empty'], extra_bad=['Below target'])
    b = Book(FOLDER, 'listing-and-launch', cur='$', data=d)
    stat3 = ['Not started', 'In progress', 'Done']

    s = b.sheet('Listing build', 'Listing build', 'Copy against the character limits, images and compliance.', 'Characters used and left per copy field, and the asset and compliance checklists.')
    s.kpis([('Copy fields OK', '=COUNTIF([copy.status],"OK")&" of "&ROWS([copy.status])', 'text', ''), ('Assets done', '=COUNTIF([assets.status],"Done")&" of "&ROWS([assets.status])', 'text', ''),
            ('Compliance done', '=COUNTIF([comp.status],"Done")&" of "&ROWS([comp.status])', 'text', '')], title='Readiness')
    s.table('copy', [LBL('Field', 20), I('limit', 'Limit', 'int', 7), I('text', 'Text', 'text', 90), F('used', 'Used', '=LEN({text})', 'int', 7),
                     F('left', 'Left', '={limit}-{used}', 'sint', 7), S('status', 'Status', '=IF({used}=0,"Empty",IF({used}>{limit},"Over limit","OK"))', 10)],
            title='Listing copy', help='Characters are counted with spaces. Backend search terms count bytes; plain letters are one byte each.')
    s.table('assets', [LBL('Asset', 24), I('spec', 'What good looks like', 'text', 56), I('owner', 'Owner', 'text', 12), I('due', 'Due', 'days', 12), I('status', 'Status', 'text', 12, opts=stat3),
                       S('flag', 'Check', '=IF({status}="Done","Done",IF(AND({due}<>"",{due}<0),"Overdue",{status}))', 11)], title='Images and content')
    s.table('comp', [LBL('Item', 24), I('spec', 'What is needed', 'text', 56), I('owner', 'Owner', 'text', 12), I('due', 'Due', 'days', 12), I('status', 'Status', 'text', 12, opts=stat3),
                     S('flag', 'Check', '=IF({status}="Done","Done",IF(AND({due}<>"",{due}<0),"Overdue",{status}))', 11)], title='Compliance')

    s = b.sheet('Keywords', 'Keyword master', 'Rank keywords and check where each one is placed.', 'Score, tier and rank gap per keyword.')
    s.settings([('tierA', 'Tier A from score', f['tierA'], 'int'), ('tierB', 'Tier B from score', f['tierB'], 'int')], title='Tiers')
    s.kpis([('Keywords tracked', '=COUNTA([kw.kw])', 'int', ''), ('Tier A', '=COUNTIF([kw.tier],"A")', 'int', ''),
            ('Tier A placed in the listing', '=COUNTIFS([kw.tier],"A",[kw.place],"<>Not used",[kw.place],"<>")', 'int', 'Every tier A keyword should be placed')])
    s.table('kw', [I('kw', 'Keyword', 'text', 30), I('searches', 'Monthly searches', 'int', 11), I('rel', 'Relevance 1 to 5', 'int', 9), I('comp', 'Competition 1 to 5', 'int', 10),
                   I('place', 'Placed in', 'text', 14, opts=['Title', 'Item highlights', 'Bullets', 'Description', 'Backend', 'A+', 'Not used']), I('ppc', 'In PPC', 'text', 7, opts=['Yes', 'No']),
                   I('rank', 'Organic rank', 'int', 8), I('target', 'Target rank', 'int', 8), I('notes', 'Notes', 'text', 26),
                   F('score', 'Score', '=IF(N({comp})>0,ROUND({searches}*{rel}/{comp},0),"")', 'int', 10),
                   S('tier', 'Tier', '=IF({score}="","",IF({score}>=in_tierA,"A",IF({score}>=in_tierB,"B","C")))', 7),
                   F('gap', 'Rank gap', '=IF(AND(ISNUMBER({rank}),ISNUMBER({target})),{rank}-{target},"")', 'sint', 8)], title='Keywords')

    s = b.sheet('Launch plan', 'Launch plan', 'Budget, units to recover it, and the launch timeline.', 'Budget by line, break-even ACoS, units to recover and task due dates.')
    s.settings([('launch', 'Launch', f['launch'], 'days'), ('price', 'Selling price', f['price'], 'money2'), ('landed', 'Landed cost per unit', f['landed'], 'money2'), ('fees', 'Amazon fees per unit', f['fees'], 'money2'),
                ('units', 'Units in first shipment', f['units'], 'int'), ('window', 'Days to recover the budget', f['window'], 'int'), ('vine', 'Vine units', f['vine'], 'int')], title='Launch')
    s.kpis([('Launch budget', '=SUM([budget.plan])', 'money', '', 'tot'), ('Margin per unit before ads', '=in_price-in_landed-in_fees', 'money2', '', 'mg'),
            ('Break-even ACoS', '=IF(in_price>0,k_mg/in_price,0)', 'pct', ''), ('Launch cost per unit shipped', '=IF(in_units>0,k_tot/in_units,0)', 'money2', ''),
            ('Units to recover the budget', '=IF(k_mg>0,CEILING(k_tot/k_mg,1),"")', 'int', '', 'rec'), ('Units a day to recover in time', '=IF(AND(k_rec<>"",in_window>0),k_rec/in_window,"")', 'dec1', ''),
            ('Tasks overdue', '=COUNTIF([tasks.flag],"Overdue")', 'int', '')])
    s.table('budget', [LBL('Line', 26), I('planned', 'Planned', 'money', 10), F('plan', 'Plan used', ['={planned}'] * 3 + ['=in_vine*in_landed'] + ['={planned}'] * 3, 'money', 10, total='sum'),
                       I('actual', 'Actual', 'money', 10, total='sum'), F('var', 'Variance', '=IF(ISNUMBER({actual}),{actual}-{plan},"")', 'smoney', 10),
                       F('share', 'Share', '=IF(SUM([budget.plan])>0,{plan}/SUM([budget.plan]),0)', 'pct', 8), I('notes', 'Notes', 'text', 26)], title='Budget', help='Vine units are worked out from the Vine units and landed cost.')
    s.table('tasks', [I('task', 'Task', 'text', 36), I('phase', 'Phase', 'text', 10, opts=['Pre-launch', 'Launch', 'Ramp', 'Steady']), I('offset', 'Days from launch', 'sint', 9), I('owner', 'Owner', 'text', 12),
                      I('status', 'Status', 'text', 11, opts=['Not started', 'In progress', 'Done', 'Blocked']), F('due', 'Due', '=in_launch+{offset}', 'days', 13),
                      S('flag', 'Check', '=IF({status}="Done","Done",IF({due}<0,"Overdue",{status}))', 11)], title='Timeline')
    s.chart('bar', 'Launch budget by line', 'budget', '_label', ['plan'], 'Budget')

    s = b.sheet('Reviews', 'Review tracker', 'Reviews and rating week by week after launch.', 'New reviews, review rate and negative share per week against the targets.')
    s.settings([('targetRating', 'Target rating', f['targetRating'], 'dec1'), ('targetCount', 'Target review count', f['targetCount'], 'int')], title='Targets')
    s.kpis([('Rating now', '=INDEX([rev.rating],MATCH(MAX([rev.week]),[rev.week],0))', 'dec1', ''), ('Reviews now', '=MAX([rev.total])', 'int', ''),
            ('Reviews still needed', '=MAX(0,in_targetCount-MAX([rev.total]))', 'int', ''),
            ('Status', '=IF(INDEX([rev.rating],MATCH(MAX([rev.week]),[rev.week],0))>=in_targetRating,"On target","Below target")', 'status', '')])
    s.table('rev', [I('week', 'Week after launch', 'int', 9), I('units', 'Units sold', 'int', 9), I('total', 'Total reviews', 'int', 9), I('rating', 'Rating', 'dec1', 7), I('neg', 'Negative reviews', 'int', 9),
                    I('theme', 'Main complaint', 'text', 26), I('action', 'Action taken', 'text', 32),
                    F('nw', 'New reviews', ('={total}', '={total}-{total^}'), 'int', 9), F('rate', 'Review rate', '=IF(N({units})>0,{nw}/{units},"")', 'pct', 9),
                    F('negs', 'Negative share', '=IF({nw}>0,{neg}/{nw},"")', 'pct', 9), S('status', 'Status', '=IF({rating}="","",IF({rating}<in_targetRating,"Below target","On target"))', 11)], title='Weeks')
    s.chart('line', 'Rating by week', 'rev', 'week', ['rating'], 'Rating')
    return b


def demand_and_inventory():
    hist = [1450, 1900, 820, 760, 800, 850, 900, 1000, 1350, 950, 920, 1100]
    idx = [0.85, 0.8, 0.85, 0.9, 0.95, 1, 1.35, 0.95, 0.95, 1.1, 1.4, 1.9]
    today = datetime.date.today()
    last = (2026 - today.year) * 12 + 10 - today.month
    f = {'last': last, 'baseN': 3, 'growth': 1, 'fba': 1400, 'inbound': 600, 'upstream': 800, 'prod': 30, 'transit': 35, 'receiving': 10, 'ltSd': 7, 'review': 30, 'service': 95,
         'demandMode': 'Forecast', 'manualDaily': None, 'sdMode': 'History', 'manualSd': None, 'carton': 40, 'moq': 1000, 'cost': 14.5, 'targetDays': 60, 'agedFlag': 20, 'rate': 0.78}
    rel = lambda iso: (datetime.date.fromisoformat(iso) - today).days
    t = {'hist': [{'units': u, 'stock': 27 if i == 4 else None} for i, u in enumerate(hist)], 'idx': [{'idx': v} for v in idx], 'fc': [{} for _ in range(12)],
         'pos': [{'po': 'PO-2611-01', 'qty': 1500, 'eta': rel('2026-12-20'), 'notes': 'Sea freight, booked'}],
         'health': [dict(zip(['sku', 'a0', 'a1', 'a2', 'a3', 'a4', 'sold30', 'cost', 'cube'], r)) for r in [
             ['EB-SPK-20-BLK', 1100, 300, 0, 0, 0, 1150, 14.5, 0.12], ['EB-SPK-20-BLU', 300, 450, 380, 120, 0, 210, 14.5, 0.12], ['EB-BUD-PRO-WHT', 900, 0, 0, 0, 0, 1500, 9.8, 0.03],
             ['EB-CHG-65W', 1600, 900, 0, 0, 0, 600, 7.2, 0.04], ['EB-CBL-USBC-2M', 2000, 500, 0, 0, 0, 1900, 1.9, 0.02], ['EB-PWR-10K', 0, 0, 150, 200, 260, 0, 8.4, 0.05]]],
         'peak': [{'name': a[0], 'start': rel(a[1]), 'end': rel(a[2]), 'uplift': a[3], 'cutoff': rel(a[4]), 'covered': a[5]} for a in [
             ['BFCM 2026', '2026-11-27', '2026-11-30', 3, '2026-11-01', 'Yes'], ['Holiday 2026', '2026-12-01', '2026-12-22', 1.8, '2026-11-20', 'No'], ['Prime Day 2027', '2027-07-13', '2027-07-14', 4, '2027-06-15', 'No'],
             ['Big Deal Days 2027', '2027-10-12', '2027-10-13', 2.5, '2027-09-14', 'No'], ['BFCM 2027', '2027-11-26', '2027-11-29', 3, '2027-11-01', 'No']]]}
    mons = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    tables = {'hist': {'fixed': ['Month %d' % (i + 1) for i in range(12)]}, 'idx': {'fixed': mons}, 'fc': {'fixed': ['Month +%d' % (i + 1) for i in range(12)]}}
    notes = ['Months are counted from this month: -1 is last month. History is the 12 months up to the last full month; the forecast is the 12 months after it.',
             'Stockout-adjusted units scale a month up to a full month of sales when the SKU was in stock for fewer days. Deseasonalized units divide by the seasonal index; the baseline is their average over the last months you choose.',
             'Safety stock = z x square root of (lead time x daily demand variation squared + daily demand squared x lead time variation squared). Reorder point = daily demand x lead time + safety stock.',
             'Peak events: the PO deadline works back from the FBA arrival cutoff through transit, receiving and production days.']
    d = base('Demand and Inventory', 'Forecast monthly demand with seasonality, set safety stock and the reorder point, check stock age and excess by SKU, and find the last day to order for each peak event.', notes, f, t, tables,
             extra_good=['Fine'], extra_warn=['Order soon', 'Aged', 'No sales'], extra_bad=['Out of stock', 'Cutoff missed', 'Late, expedite'])
    b = Book(FOLDER, 'demand-and-inventory', cur='$', data=d)

    s = b.sheet('Forecast', 'Demand forecast', 'Twelve months of history into a seasonal forecast.', 'Stockout-adjusted history, seasonal index, baseline, forecast and accuracy.')
    s.settings([('last', 'Last full month', f['last'], 'months', '-1 is last month'), ('baseN', 'Months in the baseline', f['baseN'], 'int', 'Most recent months, 1 to 12'), ('growth', 'Growth per month', f['growth'], 'pct')], title='Forecast settings')
    s.kpis([('Baseline, units a month', '=IFERROR(AVERAGEIFS([hist.des],[hist.k],">"&(12-in_baseN)),0)', 'int', 'Deseasonalized, recent months', 'base'),
            ('Variation per month', '=IF(COUNT([hist.des])>=3,STDEV([hist.des]),0)', 'int', 'Standard deviation, deseasonalized', 'sdm'),
            ('Next 3 months', '=SUM([fc.fc#0]:[fc.fc#2])', 'int', ''), ('Next 12 months', '=SUM([fc.fc])', 'int', ''),
            ('Peak month', '=INDEX([fc.when],MATCH(MAX([fc.fc]),[fc.fc],0))', 'months', ''), ('Forecast error, MAPE', '=IFERROR(AVERAGE([fc.ape]),"")', 'pct', 'Months with actuals')])
    s.table('hist', [LBL('History', 10), F('k', 'Row', ['=%d' % (i + 1) for i in range(12)], 'int', 6), F('when', 'Month', '=in_last-12+{k}', 'months', 13),
                     F('days', 'Days', '=DAY(EOMONTH(TODAY(),{when}))', 'int', 6), F('cal', 'Calendar month', '=MONTH(EOMONTH(TODAY(),{when}))', 'int', 8),
                     I('units', 'Units sold', 'int', 9), I('stock', 'Days in stock', 'int', 9),
                     F('adj', 'Stockout adjusted', '=IF(ISNUMBER({units}),{units}*{days}/IF(N({stock})>0,MIN({stock},{days}),{days}),"")', 'int', 10),
                     F('ix', 'Index', '=INDEX([idx.idx],{cal})', 'dec2', 7), F('des', 'Deseasonalized', '=IF({adj}="","",{adj}/{ix})', 'int', 11)], title='History', help='Leave Days in stock empty when the SKU was in stock all month.')
    s.table('idx', [LBL('Month', 8), I('idx', 'Seasonal index', 'dec2', 10),
                    F('sug', 'Suggested from history', '=IFERROR(AVERAGEIF([hist.cal],{n},[hist.adj])/AVERAGE([hist.adj]),"")', 'dec2', 12)], title='Seasonal index', help='1.00 is an average month. The suggestion comes from last year\'s sales.')
    s.table('fc', [LBL('Forecast', 10), F('when', 'Month', '=in_last+{n}', 'months', 13), F('days', 'Days', '=DAY(EOMONTH(TODAY(),{when}))', 'int', 6),
                   F('ix', 'Index', '=INDEX([idx.idx],MONTH(EOMONTH(TODAY(),{when})))', 'dec2', 7),
                   F('fc', 'Forecast', '=ROUND(k_base*{ix}*(1+in_growth)^{n},0)', 'int', 9), F('daily', 'Per day', '={fc}/{days}', 'dec1', 8),
                   F('in90', 'Days in the next 90', '=MAX(0,MIN(EOMONTH(TODAY(),{when}),TODAY()+89)-MAX(EOMONTH(TODAY(),{when}-1)+1,TODAY())+1)', 'int', 10),
                   I('actual', 'Actual', 'int', 9), F('err', 'Error', '=IF(ISNUMBER({actual}),{actual}-{fc},"")', 'sint', 8),
                   F('ape', 'Error %', '=IF(AND(ISNUMBER({actual}),N({actual})>0),ABS({err})/{actual},"")', 'pct', 8)], title='Forecast')
    s.chart('line', 'Forecast by month', 'fc', 'when', ['fc'], 'Units')

    s = b.sheet('Reorder', 'Reorder and safety stock', 'When to reorder and how much.', 'Safety stock, reorder point, order quantity and days until you must reorder.')
    s.settings([('fba', 'Units at FBA', f['fba'], 'int'), ('inbound', 'Units inbound to FBA', f['inbound'], 'int'), ('upstream', 'Units in your warehouse', f['upstream'], 'int'),
                ('prod', 'Production days', f['prod'], 'int'), ('transit', 'Transit days', f['transit'], 'int'), ('receiving', 'FBA receiving days', f['receiving'], 'int'),
                ('ltSd', 'Lead time variation, days', f['ltSd'], 'dec1'), ('review', 'Days between orders', f['review'], 'int'), ('service', 'Service level', f['service'], 'pct'),
                ('demandMode', 'Daily demand from', f['demandMode'], 'text', 'Forecast or Manual', ['Forecast', 'Manual']), ('manualDaily', 'Manual daily demand', f['manualDaily'], 'dec1'),
                ('sdMode', 'Demand variation from', f['sdMode'], 'text', 'History or Manual', ['History', 'Manual']), ('manualSd', 'Manual daily variation', f['manualSd'], 'dec1'),
                ('carton', 'Units per carton', f['carton'], 'int'), ('moq', 'MOQ', f['moq'], 'int'), ('cost', 'Unit cost', f['cost'], 'money2')], title='Stock, lead time and policy')
    s.kpis([('Lead time, days', '=in_prod+in_transit+in_receiving', 'int', '', 'lt'),
            ('Daily demand', '=IF(in_demandMode="Manual",N(in_manualDaily),SUM([k90.k90])/90)', 'dec1', 'Next 90 days from the forecast', 'd'),
            ('Daily variation', '=IF(in_sdMode="Manual",N(in_manualSd),k_sdm/SQRT(365.25/12))', 'dec1', '', 'sd'),
            ('Safety factor z', '=NORMSINV(MIN(0.999,MAX(0.5,in_service)))', 'dec2', '', 'z'),
            ('Safety stock', '=IF(k_d>0,MAX(0,CEILING(k_z*SQRT(k_lt*k_sd^2+k_d^2*in_ltSd^2),1)),0)', 'int', '', 'ss'),
            ('Reorder point', '=IF(k_d>0,CEILING(k_d*k_lt+k_ss,1),0)', 'int', '', 'rop'),
            ('Order up to', '=IF(k_d>0,CEILING(k_d*(k_lt+in_review)+k_ss,1),0)', 'int', '', 'tgt'),
            ('Stock position', '=in_fba+in_inbound+in_upstream+SUM([pos.qty])', 'int', 'All stock plus open POs', 'pos'),
            ('Order quantity', '=IF(AND(k_d>0,k_tgt-k_pos>0),CEILING(MAX(k_tgt-k_pos,in_moq)/MAX(1,in_carton),1)*MAX(1,in_carton),0)', 'int', 'Rounded up to full cartons', 'qty'),
            ('Order value', '=k_qty*in_cost', 'money', ''),
            ('Reorder in', '=IF(k_d>0,MAX(0,INT((k_pos-k_rop)/k_d)),"")', 'days', ''),
            ('Days of cover at FBA', '=IF(k_d>0,in_fba/k_d,0)', 'dec1', 'Under 28 days adds the low-inventory fee'),
            ('Status', '=IF(k_d<=0,"No demand",IF(k_pos<=k_rop,"Order now",IF((k_pos-k_rop)/k_d<=14,"Order soon","Healthy")))', 'status', '')], title='Reorder')
    s.table('pos', [I('po', 'PO', 'text', 12), I('qty', 'Units', 'int', 9), I('eta', 'Arrives', 'days', 12), I('notes', 'Notes', 'text', 30)], title='Open purchase orders')
    s.table('k90', [LBL('Forecast month', 14), F('k90', 'Units in the next 90 days', ['=[fc.daily#%d]*[fc.in90#%d]' % (i, i) for i in range(12)], 'int', 14)], fixed=['Month +%d' % (i + 1) for i in range(12)], title='Demand in the next 90 days')

    s = b.sheet('Inventory health', 'Inventory health and aging', 'Stock age, cover and excess by SKU.', 'Cover, excess, aged share, value, storage and status per SKU.')
    s.settings([('targetDays', 'Target days of cover', f['targetDays'], 'int'), ('agedFlag', 'Aged share flag', f['agedFlag'], 'pct', 'Share over 180 days'), ('rate', 'Storage per cu ft a month', f['rate'], 'money2')], title='Policy')
    s.kpis([('Units on hand', '=SUM([health.on])', 'int', ''), ('Days of cover', '=IF(SUM([health.daily])>0,SUM([health.on])/SUM([health.daily]),0)', 'dec1', ''),
            ('Stock value', '=SUM([health.value])', 'money', ''), ('Storage a month', '=SUM([health.stor])', 'money', ''), ('Excess value', '=SUM([health.exv])', 'money', ''),
            ('SKUs needing attention', '=COUNTIFS([health.status],"<>Healthy",[health.status],"<>")', 'int', '')])
    s.table('health', [I('sku', 'SKU', 'text', 16), I('a0', '0 to 90 days', 'int', 9), I('a1', '91 to 180', 'int', 8), I('a2', '181 to 270', 'int', 8), I('a3', '271 to 365', 'int', 8), I('a4', 'Over 365', 'int', 8),
                       I('sold30', 'Sold, 30 days', 'int', 9), I('cost', 'Unit cost', 'money2', 9), I('cube', 'Cu ft per unit', 'dec2', 8),
                       F('on', 'On hand', '=SUM({a0}:{a4})', 'int', 8, total='sum'), F('daily', 'Per day', '=N({sold30})/30', 'dec1', 7),
                       F('cover', 'Days of cover', '=IF({daily}>0,{on}/{daily},"")', 'int', 8),
                       F('excess', 'Excess units', '=IF({daily}>0,MAX(0,ROUND({on}-in_targetDays*{daily},0)),{on})', 'int', 9),
                       F('exv', 'Excess value', '={excess}*N({cost})', 'money', 9, total='sum'),
                       F('aged', 'Aged share', '=IF({on}>0,({a2}+{a3}+{a4})/{on},"")', 'pct', 8),
                       F('value', 'Value', '={on}*N({cost})', 'money', 9, total='sum'), F('stor', 'Storage a month', '={on}*N({cube})*in_rate', 'money2', 9, total='sum'),
                       S('status', 'Status', '=IF(AND({sku}="",{on}=0),"",IF({on}=0,"Out of stock",IF({daily}=0,"No sales",IF({cover}<28,"Low stock",IF({aged}>in_agedFlag,"Aged",IF({excess}>0,"Excess","Healthy"))))))', 11)],
            title='Stock by SKU and age')

    s = b.sheet('Peak season', 'Peak season planner', 'How much extra stock each event needs and the last day to order it.', 'Expected units, extra units, PO deadline and status per event.')
    s.kpis([('Baseline per day', '=k_base/(365.25/12)', 'dec1', 'From the forecast', 'bd'), ('Next PO deadline', '=_xlfn.MINIFS([peak.poBy],[peak.open],1)', 'days', 'Earliest open event'),
            ('Extra units for events ahead', '=SUMIFS([peak.extra],[peak.status],"<>Past")', 'int', ''),
            ('Events needing action', '=COUNTIF([peak.status],"Order soon")+COUNTIF([peak.status],"Late, expedite")+COUNTIF([peak.status],"Cutoff missed")', 'int', '')])
    s.table('peak', [I('name', 'Event', 'text', 20), I('start', 'Starts', 'days', 12), I('end', 'Ends', 'days', 12), I('uplift', 'Sales multiple', 'dec1', 9), I('cutoff', 'FBA arrival cutoff', 'days', 13),
                     I('covered', 'Stock covered', 'text', 9, opts=['No', 'Yes']),
                     F('days', 'Event days', '={end}-{start}+1', 'int', 8), F('normal', 'Normal units', '=ROUND(k_bd*{days},0)', 'int', 9),
                     F('exp', 'Expected units', '=ROUND(k_bd*{days}*{uplift},0)', 'int', 9), F('extra', 'Extra units', '={exp}-{normal}', 'int', 9),
                     F('poBy', 'Order PO by', '=IF({cutoff}="",{start},{cutoff})-in_transit-in_receiving-in_prod', 'days', 13),
                     S('status', 'Status', '=IF({start}="","",IF({covered}="Yes","Covered",IF({end}<0,"Past",IF(IF({cutoff}="",{start},{cutoff})<0,"Cutoff missed",IF({poBy}<0,"Late, expedite",IF({poBy}<=21,"Order soon","On track"))))))', 13),
                     F('open', 'Open', '=IF(OR({status}="Order soon",{status}="On track",{status}="Late, expedite"),1,0)', 'int', 6)], title='Events')
    s.chart('bar', 'Extra units by event', 'peak', 'name', ['extra'], 'Units')
    return b


ALL = ['listing_and_launch', 'demand_and_inventory']
