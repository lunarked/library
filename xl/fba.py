"""Excel versions of the Amazon FBA workbooks built by the engine."""
from xlkit import Book, I, F, S, LBL

FOLDER = 'fba'
CATS = ['Consumer Electronics (8%)', 'Electronics Accessories (15% up to 100, 8% above)', 'Most categories (15%)']


def ref(p):
    """Referral fee for price expression p, using the category setting in_cat."""
    return ('MAX(0.3,IF(in_cat="{c0}",({p})*0.08,IF(in_cat="{c1}",MIN(({p}),100)*0.15+MAX(0,({p})-100)*0.08,({p})*0.15)))'.format(c0=CATS[0], c1=CATS[1], p=p))


def product_selection():
    b = Book(FOLDER, 'product-selection'); f = b.d['f']
    s = b.sheet('Scorecard', 'Opportunity scorecard', 'Score product ideas on demand, competition, margin, differentiation and risk.', 'Margin, weighted score from 0 to 100 and a rating per idea.')
    s.settings([('wDemand', 'Weight: demand', f['wDemand'], 'pct'), ('wComp', 'Weight: competition', f['wComp'], 'pct'), ('wMargin', 'Weight: margin', f['wMargin'], 'pct'),
                ('wDiff', 'Weight: differentiation', f['wDiff'], 'pct'), ('wRisk', 'Weight: risk', f['wRisk'], 'pct')], title='Weights')
    s.kpis([('Ideas scored', '=COUNT([ideas.score])', 'int', ''), ('Strong', '=COUNTIF([ideas.status],"Strong")', 'int', 'Score 70 or more'),
            ('Average margin', '=IFERROR(AVERAGE([ideas.margin]),0)', 'pct', ''), ('Best idea', '=IFERROR(INDEX([ideas.name],MATCH(MAX([ideas.score]),[ideas.score],0)),"")', 'text', '')])
    band = ('(IF({units}="",0,IF({units}>=3000,5,IF({units}>=1500,4,IF({units}>=700,3,IF({units}>=300,2,1)))))/5*in_wDemand'
            '+IF({reviews}="",0,IF({reviews}<=200,5,IF({reviews}<=500,4,IF({reviews}<=1000,3,IF({reviews}<=3000,2,1)))))/5*in_wComp'
            '+IF({margin}="",0,IF({margin}>=0.35,5,IF({margin}>=0.28,4,IF({margin}>=0.2,3,IF({margin}>=0.12,2,1)))))/5*in_wMargin'
            '+IF({diff}="",0,VALUE({diff}))/5*in_wDiff+IF({risk}="Low",5,IF({risk}="Medium",3,IF({risk}="High",1,0)))/5*in_wRisk)')
    s.table('ideas', [
        I('name', 'Idea', 'text', 26), I('price', 'Price', 'money2', 9), I('landed', 'Landed cost', 'money2', 9), I('fees', 'Amazon fees', 'money2', 9),
        I('units', 'Top 10 units a month', 'int', 10), I('reviews', 'Top 10 average reviews', 'int', 10), I('diff', 'Differentiation 1 to 5', 'text', 11, opts=['', '1', '2', '3', '4', '5']),
        I('risk', 'Risk', 'text', 9, opts=['', 'Low', 'Medium', 'High']),
        F('margin', 'Margin', '=IF(N({price})>0,({price}-{landed}-{fees})/{price},"")', 'pct', 9),
        F('score', 'Score', '=IF(OR({name}="",{margin}=""),"",ROUND(' + band + '/(in_wDemand+in_wComp+in_wMargin+in_wDiff+in_wRisk)*100,0))', 'int', 8),
        S('status', 'Rating', '=IF({score}="","",IF({score}>=70,"Strong",IF({score}>=55,"Fair","Weak")))', 9),
    ], title='Product ideas', help='Demand is the average monthly units of the top 10 sellers; competition is their average review count.')
    s.chart('bar', 'Score by idea', 'ideas', 'name', ['score'], 'Score', horizontal=True)

    s = b.sheet('Competitors', 'Competitor and niche tracker', 'Who holds the niche and how fast they grow.', 'Revenue, share and reviews per month per competitor.')
    s.settings([('niche', 'Main keyword', f['niche'], 'text'), ('yourPrice', 'Your planned price', f['yourPrice'], 'money2')], title='Niche')
    s.kpis([('Niche revenue a month', '=SUM([comps.rev])', 'money', ''), ('Average price, weighted by units', '=IF(SUM([comps.units])>0,SUMPRODUCT([comps.price],[comps.units])/SUM([comps.units]),0)', 'money2', '', 'avgp'),
            ('Average rating, weighted', '=IF(SUM([comps.units])>0,SUMPRODUCT([comps.rating],[comps.units])/SUM([comps.units]),0)', 'dec2', ''),
            ('Top 3 share of revenue', '=IF(SUM([comps.rev])>0,SUMPRODUCT(LARGE([comps.rev],{1,2,3}))/SUM([comps.rev]),0)', 'pct', 'Above 60% is hard to enter'),
            ('Your price against the average', '=IF(k_avgp>0,in_yourPrice/k_avgp-1,0)', 'spct', '')])
    s.table('comps', [
        I('brand', 'Brand', 'text', 14), I('asin', 'ASIN', 'text', 13), I('price', 'Price', 'money2', 9), I('rating', 'Rating', 'dec1', 7), I('reviews', 'Reviews', 'int', 9), I('units', 'Units a month', 'int', 9),
        I('launched', 'Launched', 'days', 13), I('notes', 'Weak spots in their reviews', 'text', 34),
        F('rev', 'Revenue a month', '={price}*{units}', 'money', 11, total='sum'),
        F('share', 'Share', '=IF(SUM([comps.rev])>0,{rev}/SUM([comps.rev]),0)', 'pct', 8),
        F('vel', 'Reviews a month', '=IF(N({launched})<0,{reviews}/(-{launched}/30.44),"")', 'int', 9),
    ], title='Competitors', help='Launched is days from today, so -400 means 400 days ago.')
    s.chart('bar', 'Revenue a month by brand', 'comps', 'brand', ['rev'], 'Revenue', horizontal=True)

    s = b.sheet('Go or no-go', 'Launch go or no-go', 'Check the numbers and the risks before the first order.', 'Unit profit, cash, payback and the launch checks.')
    s.settings([('gPrice', 'Selling price', f['gPrice'], 'money2'), ('gLanded', 'Landed cost per unit', f['gLanded'], 'money2'), ('gFees', 'Amazon fees per unit', f['gFees'], 'money2', 'Referral plus fulfillment'),
                ('gPpc', 'Ad cost per unit sold', f['gPpc'], 'money2'), ('gUnits', 'Monthly units', f['gUnits'], 'int', 'After the launch period'), ('gFirst', 'First order units', f['gFirst'], 'int'),
                ('gFixed', 'One-off launch costs', f['gFixed'], 'money', 'Samples, photos, certification, Vine'), ('gCash', 'Cash available', f['gCash'], 'money'),
                ('gMinMargin', 'Minimum margin after ads', f['gMinMargin'], 'pct'), ('gMaxPayback', 'Maximum payback, months', f['gMaxPayback'], 'dec1')], title='Unit economics and thresholds')
    s.kpis([('Profit per unit after ads', '=in_gPrice-in_gLanded-in_gFees-in_gPpc', 'money2', '', 'up'), ('Margin after ads', '=IF(in_gPrice>0,k_up/in_gPrice,0)', 'pct', '', 'mg'),
            ('Cash needed', '=in_gFirst*in_gLanded+in_gFixed', 'money', 'First order plus launch costs', 'cash'), ('Profit a month', '=k_up*in_gUnits', 'money', '', 'pm'),
            ('Payback, months', '=IF(k_pm>0,k_cash/k_pm,"")', 'dec1', '', 'pb'), ('Year one profit', '=k_pm*12-k_cash', 'money', ''),
            ('Decision', '=IF(COUNTIF([gates.status],"Fail")>0,"No go",IF(COUNTIF([gates.status],"Open")>0,"Review","Go"))', 'status', '')])
    gates = b.d['t']['gates']
    for i, g in enumerate(gates):
        if i < 3: g['result'] = 'Calculated'
    auto = ['=IF(k_mg>=in_gMinMargin,"Pass","Fail")', '=IF(AND(k_pb<>"",N(k_pb)<=in_gMaxPayback),"Pass","Fail")', '=IF(k_cash<=in_gCash,"Pass","Fail")']
    s.table('gates', [LBL('Check', 44), I('result', 'Your result', 'text', 12, opts=['Open', 'Pass', 'Fail']), I('notes', 'Notes', 'text', 36),
                      S('status', 'Status', auto + ['=IF({result}="","Open",{result})'] * (len(gates) - 3), 10)], rows=gates, title='Checks', help='The first three rows are calculated. Mark the others Pass or Fail as you confirm them.')
    return b


def unit_economics():
    b = Book(FOLDER, 'unit-economics', tones={'good': ['Best']}); f = b.d['f']
    s = b.sheet('Profit calculator', 'FBA profit calculator', 'Profit per unit after every Amazon fee.', 'Fees, profit, margin, break-even ACoS and break-even price.')
    s.settings([('price', 'Selling price', f['price'], 'money2'), ('landed', 'Landed cost per unit', f['landed'], 'money2'), ('cat', 'Referral category', f['cat'], 'text', '', CATS),
                ('fba', 'FBA fulfillment fee', f['fba'], 'money2', 'From the revenue calculator'), ('storage', 'Storage per unit per month', f['storage'], 'money2'), ('months', 'Months in storage', f['months'], 'dec1'),
                ('retRate', 'Return rate', f['retRate'], 'pct'), ('retCost', 'Cost per return', f['retCost'], 'money2'), ('ppc', 'Ad cost per unit sold', f['ppc'], 'money2'), ('other', 'Other per unit', f['other'], 'money2', 'Prep, labels, inbound placement')],
               title='Price and costs')
    s.kpis([('Referral fee', '=' + ref('in_price'), 'money2', '', 'ref'),
            ('Fixed costs per unit', '=in_fba+in_storage*in_months+in_retRate*in_retCost+in_other', 'money2', 'FBA, storage, returns, other', 'fixed'),
            ('Profit per unit', '=in_price-in_landed-k_ref-k_fixed-in_ppc', 'money2', '', 'profit'), ('Margin', '=IF(in_price>0,k_profit/in_price,0)', 'pct', ''),
            ('Return on landed cost', '=IF(in_landed>0,k_profit/in_landed,0)', 'pct', ''), ('Break-even ACoS', '=IF(in_price>0,(k_profit+in_ppc)/in_price,0)', 'pct', 'Ad spend share of price at zero profit'),
            ('Break-even price', '=IF(in_cat="%s",MAX(k_base+0.3,k_base/0.92),IF(in_cat="%s",IF(k_base/0.85<=100,MAX(k_base+0.3,k_base/0.85),(k_base+7)/0.92),MAX(k_base+0.3,k_base/0.85)))' % (CATS[0], CATS[1]), 'money2', 'Price where profit is zero'),
            ('Cost before referral', '=in_landed+k_fixed+in_ppc', 'money2', '', 'base')])
    split = ['=in_landed', '=k_ref', '=in_fba', '=in_storage*in_months', '=in_retRate*in_retCost', '=in_ppc', '=in_other', '=MAX(0,k_profit)']
    s.table('split', [LBL('Where the price goes', 22), F('v', 'Per unit', split, 'money2', 11, total='sum'), F('share', 'Share of price', '=IF(in_price>0,{v}/in_price,0)', 'pct', 11)],
            fixed=['Landed cost', 'Referral fee', 'FBA fulfillment', 'Storage', 'Returns', 'Advertising', 'Other', 'Profit'], title='Where the price goes')
    s.chart('bar', 'Where the price goes', 'split', '_label', ['v'], 'Per unit')

    s = b.sheet('Landed cost', 'Landed cost calculator', 'From factory price to a unit at Amazon.', 'Landed cost per unit and the build-up.')
    s.settings([('lUnits', 'Units in shipment', f['lUnits'], 'int'), ('lFob', 'Factory price per unit (FOB)', f['lFob'], 'money2'), ('lFreight', 'Freight total', f['lFreight'], 'money'),
                ('lIns', 'Insurance, % of goods', f['lIns'], 'pct'), ('lDuty', 'Duty rate', f['lDuty'], 'pct'), ('lTariff', 'Additional tariff', f['lTariff'], 'pct'),
                ('lBroker', 'Customs broker and fees', f['lBroker'], 'money'), ('lInland', 'Port to Amazon trucking', f['lInland'], 'money'), ('lPrep', 'Prep and labels per unit', f['lPrep'], 'money2'),
                ('lPlace', 'Inbound placement per unit', f['lPlace'], 'money2')], title='Shipment')
    parts = ['=in_lFob', '=IF(in_lUnits>0,in_lFreight/in_lUnits,0)', '=in_lFob*(in_lDuty+in_lTariff)', '=in_lFob*in_lIns', '=IF(in_lUnits>0,in_lBroker/in_lUnits,0)',
             '=IF(in_lUnits>0,in_lInland/in_lUnits,0)', '=in_lPrep', '=in_lPlace']
    s.kpis([('Landed cost per unit', '=SUM([lparts.v])', 'money2', '', 'lpu'), ('Shipment total', '=k_lpu*in_lUnits', 'money', ''), ('Uplift on factory price', '=IF(in_lFob>0,k_lpu/in_lFob-1,0)', 'pct', '')])
    s.table('lparts', [LBL('Cost', 22), F('v', 'Per unit', parts, 'money2', 11, total='sum'), F('share', 'Share', '=IF(SUM([lparts.v])>0,{v}/SUM([lparts.v]),0)', 'pct', 10)],
            fixed=['Factory price', 'Freight', 'Duty and tariff', 'Insurance', 'Broker and fees', 'Trucking to Amazon', 'Prep and labels', 'Inbound placement'], title='Cost build-up')
    s.chart('bar', 'Landed cost build-up', 'lparts', '_label', ['v'], 'Per unit')

    s = b.sheet('Promo planner', 'Price and promo planner', 'Test promotions against selling at full price.', 'Promo price, profit per unit and incremental profit per promotion.')
    s.settings([('baseDaily', 'Normal units per day', f['baseDaily'], 'dec1')], title='Normal sales')
    s.kpis([('Incremental profit, all promotions', '=SUM([promos.gain])', 'smoney', ''), ('Promotions that lose money', '=COUNTIF([promos.status],"Loss")', 'int', ''),
            ('Best promotion', '=IFERROR(INDEX([promos.name],MATCH(MAX([promos.gain]),[promos.gain],0)),"")', 'text', '')])
    s.table('promos', [
        I('name', 'Promotion', 'text', 22), I('type', 'Type', 'text', 20, opts=['Coupon', 'Lightning Deal', 'Best Deal', 'Prime Exclusive Discount', 'Price cut']), I('disc', 'Discount', 'pct', 9),
        I('days', 'Days', 'int', 7), I('fee', 'Fixed fee', 'money', 9), I('lift', 'Lift', 'pct', 8),
        F('price', 'Promo price', '=in_price*(1-{disc})', 'money2', 9),
        F('unit', 'Profit per unit', '={price}-in_landed-' + ref('{price}') + '-k_fixed-in_ppc', 'money2', 10),
        F('units', 'Units', '=in_baseDaily*{days}*(1+{lift})', 'int', 8),
        F('gain', 'Incremental profit', '={units}*{unit}-{fee}-in_baseDaily*{days}*k_profit', 'smoney', 11, total='sum'),
        S('status', 'Result', '=IF({name}="","",IF({gain}>=0,"Profitable","Loss"))', 10),
    ], title='Promotions', help='Price, landed cost, fees and ad cost come from the profit calculator.')

    s = b.sheet('Size tier', 'Size tier and packaging', 'Compare packaging options by size tier and cost.', 'Tier, dimensional weight, storage and total cost per unit per option.')
    s.settings([('storageRate', 'Storage fee per cu ft per month', f['storageRate'], 'money2'), ('unitsMonth', 'Units sold per month', f['unitsMonth'], 'int')], title='Rates')
    s.kpis([('Cheapest option', '=INDEX([packs.name],MATCH(MIN([packs.total]),[packs.total],0))', 'text', ''), ('Cost per unit, cheapest', '=MIN([packs.total])', 'money2', ''),
            ('Saving against the first option', '=[packs.total#0]-MIN([packs.total])', 'money2', 'Per unit', 'sv'), ('Saving a month', '=k_sv*in_unitsMonth', 'money', '')])
    s.table('packs', [
        I('name', 'Option', 'text', 24), I('l', 'Length in', 'dec2', 8), I('w', 'Width in', 'dec2', 8), I('h', 'Height in', 'dec2', 8), I('lb', 'Weight lb', 'dec2', 8),
        I('pack', 'Packaging cost', 'money2', 9), I('fee', 'FBA fee', 'money2', 9),
        F('tier', 'Tier', '=IF(AND(MAX({l},{w},{h})<=15,{l}+{w}+{h}-MAX({l},{w},{h})-MIN({l},{w},{h})<=12,MIN({l},{w},{h})<=0.75,{lb}*16<=16),"Small standard",IF(AND(MAX({l},{w},{h})<=18,{l}+{w}+{h}-MAX({l},{w},{h})-MIN({l},{w},{h})<=14,MIN({l},{w},{h})<=8,{lb}<=20),"Large standard","Large bulky"))', 'text', 15),
        F('dim', 'Dim weight lb', '={l}*{w}*{h}/139', 'dec2', 9), F('cuft', 'Cu ft', '={l}*{w}*{h}/1728', 'dec2', 8),
        F('stor', 'Storage per unit', '={cuft}*in_storageRate', 'money2', 9), F('total', 'Cost per unit', '={fee}+{pack}+{stor}', 'money2', 9),
        S('best', 'Best', '=IF({total}=MIN([packs.total]),"Best","")', 8),
    ], title='Packaging options', help='Packed dimensions and weight; the FBA fee is what Amazon quotes for that size.')
    return b


def sourcing_suppliers():
    b = Book(FOLDER, 'sourcing-suppliers', tones={'good': ['Best']}); f = b.d['f']
    stages = ['Draft', 'Deposit paid', 'In production', 'QC booked', 'Ready', 'Shipped', 'Closed']
    s = b.sheet('Supplier RFQ', 'Supplier RFQ scorecard', 'Score supplier quotes for the same product spec.', 'Weighted score from price, quality, lead time, MOQ, communication and certifications.')
    s.settings([('wPrice', 'Weight: price', f['wPrice'], 'pct'), ('wQual', 'Weight: sample quality', f['wQual'], 'pct'), ('wLead', 'Weight: lead time', f['wLead'], 'pct'),
                ('wMoq', 'Weight: MOQ', f['wMoq'], 'pct'), ('wComm', 'Weight: communication', f['wComm'], 'pct'), ('wCert', 'Weight: certifications', f['wCert'], 'pct')], title='Weights')
    s.kpis([('Best supplier', '=IFERROR(INDEX([sups.name],MATCH(MAX([sups.score]),[sups.score],0)),"")', 'text', ''), ('Strong quotes', '=COUNTIF([sups.status],"Strong")', 'int', '75 or more'),
            ('Lowest price', '=_xlfn.MINIFS([sups.price],[sups.price],">0")', 'money2', '')])
    r15 = ['', '1', '2', '3', '4', '5']
    s.table('sups', [
        I('name', 'Supplier', 'text', 18), I('city', 'City', 'text', 11), I('price', 'Unit price', 'money2', 9), I('moq', 'MOQ', 'int', 8), I('lead', 'Lead days', 'int', 8),
        I('qual', 'Sample quality 1 to 5', 'text', 10, opts=r15), I('comm', 'Communication 1 to 5', 'text', 10, opts=r15), I('cert', 'Certifications 1 to 5', 'text', 10, opts=r15), I('terms', 'Payment terms', 'text', 18),
        F('score', 'Score', '=IF(N({price})<=0,"",ROUND((5*_xlfn.MINIFS([sups.price],[sups.price],">0")/{price}/5*in_wPrice+IF({qual}="",0,VALUE({qual}))/5*in_wQual+IF(N({lead})>0,5*_xlfn.MINIFS([sups.lead],[sups.lead],">0")/{lead},0)/5*in_wLead+IF(N({moq})>0,5*_xlfn.MINIFS([sups.moq],[sups.moq],">0")/{moq},0)/5*in_wMoq+IF({comm}="",0,VALUE({comm}))/5*in_wComm+IF({cert}="",0,VALUE({cert}))/5*in_wCert)/(in_wPrice+in_wQual+in_wLead+in_wMoq+in_wComm+in_wCert)*100,0))', 'int', 8),
        S('status', 'Rating', '=IF({score}="","",IF({score}>=75,"Strong",IF({score}>=60,"Fair","Weak")))', 9),
    ], title='Supplier quotes', help='Price, lead time and MOQ score against the best quote; the other factors are your 1 to 5 rating.')
    s.chart('bar', 'Score by supplier', 'sups', 'name', ['score'], 'Score')

    s = b.sheet('PO tracker', 'PO and production tracker', 'Purchase orders from placing to shipping.', 'Value, balance due, days to ex-factory and a flag per PO.')
    s.kpis([('Open POs', '=COUNTIFS([pos.status],"<>Shipped",[pos.status],"<>Closed")', 'int', ''), ('Open value', '=SUMIFS([pos.value],[pos.status],"<>Shipped",[pos.status],"<>Closed")', 'money', ''),
            ('Balance still to pay', '=SUM([pos.bal])', 'money', 'Open POs less deposits paid'), ('Late', '=COUNTIF([pos.flag],"Late")', 'int', 'Ex-factory passed, goods not ready')])
    s.table('pos', [
        I('po', 'PO', 'text', 9), I('sup', 'Supplier', 'text', 16), I('sku', 'SKU', 'text', 15), I('units', 'Units', 'int', 8, total='sum'), I('cost', 'Unit cost', 'money2', 9), I('dep', 'Deposit', 'pct', 8),
        I('placed', 'Placed', 'days', 12), I('exf', 'Ex-factory', 'days', 12), I('status', 'Stage', 'text', 12, opts=stages),
        F('value', 'Value', '={units}*{cost}', 'money', 10, total='sum'),
        F('bal', 'Balance due', '=IF(OR({status}="Shipped",{status}="Closed"),0,{value}*(1-IF({status}="Draft",0,{dep})))', 'money', 10, total='sum'),
        S('flag', 'Flag', '=IF({po}="","",IF({status}="Closed","Closed",IF({status}="Shipped","Shipped",IF({exf}="","",IF(AND({exf}<0,{status}<>"Ready"),"Late",IF(AND({exf}<=14,{status}<>"Ready"),"Due soon","On track"))))))'),
    ], title='Purchase orders', help='Placed and ex-factory are days from today.')

    s = b.sheet('QC log', 'QC inspection log', 'Pre-shipment inspections against AQL limits.', 'Defect rate and pass or fail per inspection.')
    s.kpis([('Inspections', '=COUNT([qc.sample])', 'int', ''), ('Pass rate', '=IF(COUNT([qc.sample])>0,COUNTIF([qc.result],"Pass")/COUNT([qc.sample]),0)', 'pct', ''),
            ('Average defect rate', '=IFERROR(AVERAGE([qc.rate]),0)', 'pct', 'Major plus minor over sample'), ('Last result', '=INDEX([qc.result],MATCH(MAX([qc.date]),[qc.date],0))', 'status', '')])
    s.table('qc', [
        I('date', 'Day', 'days', 12), I('po', 'PO', 'text', 9), I('by', 'Inspector', 'text', 14), I('sample', 'Sample size', 'int', 8), I('crit', 'Critical', 'int', 8), I('maj', 'Major', 'int', 7),
        I('min', 'Minor', 'int', 7), I('amaj', 'Allowed major', 'int', 8), I('amin', 'Allowed minor', 'int', 8), I('notes', 'Main finding', 'text', 30),
        F('rate', 'Defect rate', '=IF(N({sample})>0,({maj}+{min})/{sample},"")', 'pct', 9),
        S('result', 'Result', '=IF(N({sample})<=0,"",IF(OR(N({crit})>0,AND({amaj}<>"",{maj}>{amaj}),AND({amin}<>"",{min}>{amin})),"Fail","Pass"))', 8),
    ], title='Inspections', help='Allowed major and minor come from your AQL table for the sample size.')

    s = b.sheet('MOQ and price breaks', 'MOQ and price breaks', 'The cheapest order size across price breaks.', 'Order size, ordering and holding cost and total cost a year per price break.')
    s.settings([('annual', 'Units per year', f['annual'], 'int'), ('orderCost', 'Cost per order', f['orderCost'], 'money', 'Inspection, freight booking, admin'),
                ('hold', 'Holding cost per year, % of unit price', f['hold'], 'pct')], title='Demand and costs')
    s.kpis([('Best order size', '=INDEX([breaks.q],MATCH(MIN([breaks.total]),[breaks.total],0))', 'int', '', 'bq'), ('Total cost a year at best', '=MIN([breaks.total])', 'money', ''),
            ('Saving against the first break', '=[breaks.total#0]-MIN([breaks.total])', 'money', ''), ('Orders a year', '=IF(k_bq>0,in_annual/k_bq,0)', 'dec1', '')])
    s.table('breaks', [
        I('min', 'From units', 'int', 10), I('price', 'Unit price', 'money2', 9),
        F('eoq', 'Economic order quantity', '=IF(AND(N({price})>0,in_hold>0),SQRT(2*in_annual*in_orderCost/(in_hold*{price})),"")', 'int', 11),
        F('nxt', 'Next break', '=_xlfn.MINIFS([breaks.min],[breaks.min],">"&{min})', 'int', 9),
        F('q', 'Order size', '=IF({eoq}="","",IF(IF(AND({nxt}>0,MAX({min},{eoq})>={nxt}),{nxt}-1,MAX({min},{eoq}))<{min},"",CEILING(IF(AND({nxt}>0,MAX({min},{eoq})>={nxt}),{nxt}-1,MAX({min},{eoq})),1)))', 'int', 9),
        F('goods', 'Goods a year', '=IF({q}="","",in_annual*{price})', 'money', 11),
        F('ord', 'Ordering a year', '=IF({q}="","",in_annual/{q}*in_orderCost)', 'money', 10),
        F('holdc', 'Holding a year', '=IF({q}="","",{q}/2*in_hold*{price})', 'money', 10),
        F('total', 'Total a year', '=IF({q}="","",{goods}+{ord}+{holdc})', 'money', 11),
        S('best', 'Best', '=IF({total}="","",IF({total}=MIN([breaks.total]),"Best",""))', 8),
    ], title='Price breaks', help='One row per break, lowest quantity first.')
    return b


def compliance():
    b = Book(FOLDER, 'compliance'); f = b.d['f']
    mk = ['US', 'Germany', 'UK', 'France', 'Italy', 'Spain', 'Netherlands', 'Poland', 'Sweden', 'Canada', 'Japan']
    s = b.sheet('Compliance matrix', 'Compliance matrix', 'Every requirement by SKU and marketplace.', 'Status per requirement and the share done.')
    s.kpis([('Done', '=IFERROR(COUNTIF([matrix.status],"Done")/(ROWS([matrix.status])-COUNTIF([matrix.status],"Not needed")),0)', 'pct', 'Of requirements that apply'),
            ('Missing', '=COUNTIF([matrix.status],"Missing")', 'int', ''), ('Overdue', '=COUNTIF([matrix.flag],"Overdue")', 'int', 'Due date passed, not done')])
    s.table('matrix', [I('sku', 'SKU', 'text', 15), I('mkt', 'Marketplace', 'text', 11, opts=mk), I('req', 'Requirement', 'text', 30), I('owner', 'Owner', 'text', 14), I('due', 'Due', 'days', 12),
                       I('status', 'Stage', 'text', 11, opts=['Missing', 'In progress', 'Done', 'Not needed']), I('evidence', 'Evidence', 'text', 26),
                       S('flag', 'Status', '=IF(AND({sku}="",{req}=""),"",IF(OR({status}="Done",{status}="Not needed"),{status},IF(AND({due}<>"",{due}<0),"Overdue",{status})))', 12)], title='Requirements by SKU and marketplace')
    s.table('bymkt', [LBL('Marketplace', 14), F('open', 'Open requirements', ['=COUNTIFS([matrix.mkt],"%s",[matrix.status],"Missing")+COUNTIFS([matrix.mkt],"%s",[matrix.status],"In progress")' % (m, m) for m in mk], 'int', 12)], fixed=mk, title='Open by marketplace')

    s = b.sheet('Battery dossier', 'Battery and DG dossier', 'The facts the dangerous goods review checks.', 'Total Wh, UN number and status per SKU.')
    s.kpis([('SKUs missing a document', '=COUNTIF([batt.status],"Missing")', 'int', 'UN38.3 summary or SDS'), ('Over 100 Wh', '=COUNTIF([batt.total],">100")', 'int', 'Stricter shipping rules')])
    lith = 'OR({type}="Li-ion",{type}="Li-polymer",{type}="LiFePO4",{type}="Lithium metal")'
    s.table('batt', [I('sku', 'SKU', 'text', 15), I('type', 'Battery type', 'text', 12, opts=['Li-ion', 'Li-polymer', 'LiFePO4', 'Lithium metal', 'NiMH', 'Alkaline']),
                     I('pack', 'Packing', 'text', 20, opts=['Contained in equipment', 'Packed with equipment', 'Battery alone']), I('cells', 'Cells', 'int', 7), I('wh', 'Wh per cell', 'dec2', 8),
                     I('grams', 'Battery weight g', 'dec1', 9), I('un383', 'UN38.3 summary', 'text', 9, opts=['No', 'Yes']), I('sds', 'SDS or exemption', 'text', 9, opts=['No', 'Yes']),
                     F('total', 'Total Wh', '=IF(AND(ISNUMBER({cells}),ISNUMBER({wh})),{cells}*{wh},"")', 'dec1', 8),
                     F('un', 'UN number', '=IF({sku}="","",IF(NOT(' + lith + '),"None",IF({type}="Lithium metal",IF({pack}="Battery alone","UN3090","UN3091"),IF({pack}="Battery alone","UN3480","UN3481"))))', 'text', 9),
                     S('status', 'Status', '=IF({sku}="","",IF(NOT(' + lith + '),"Not regulated",IF(OR({un383}<>"Yes",{sds}<>"Yes"),"Missing",IF(N({total})>100,"Over 100 Wh","Ready"))))', 12)], title='Battery data per SKU')

    s = b.sheet('EPR', 'EPR registration and reporting', 'Packaging, WEEE and battery registrations by country.', 'Fees, days to the next report and status.')
    s.kpis([('Not registered', '=COUNTIF([epr.status],"Not registered")', 'int', ''), ('Overdue', '=COUNTIF([epr.status],"Overdue")', 'int', ''),
            ('Reports due in 30 days', '=COUNTIF([epr.next],"<=30")', 'int', ''), ('Fees', '=SUM([epr.fee])', 'money', '')])
    s.table('epr', [I('country', 'Country', 'text', 12), I('scheme', 'Scheme', 'text', 11, opts=['Packaging', 'WEEE', 'Batteries']), I('reg', 'Registration number', 'text', 18), I('provider', 'Provider', 'text', 16),
                    I('freq', 'Reporting', 'text', 10, opts=['Monthly', 'Quarterly', 'Yearly']), I('next', 'Next report', 'days', 12), I('kg', 'Weight placed kg', 'dec1', 10), I('rate', 'Fee per kg', 'money2', 9),
                    F('fee', 'Fee', '=IF(AND(ISNUMBER({kg}),ISNUMBER({rate})),{kg}*{rate},"")', 'money', 9, total='sum'),
                    S('status', 'Status', '=IF(TRIM({reg})="","Not registered",IF({next}="","Registered",IF({next}<0,"Overdue",IF({next}<=30,"Due soon","Registered"))))', 13)], title='Registrations')

    s = b.sheet('Certificates', 'Certificate expiry calendar', 'Certificates and reports with renewal lead time.', 'Days left, when to start renewal and status.')
    s.kpis([('Expired', '=COUNTIF([certs.status],"Expired")', 'int', ''), ('Expiring soon', '=COUNTIF([certs.status],"Expiring soon")', 'int', 'Renewal must start within 30 days'),
            ('Next expiry', '=_xlfn.MINIFS([certs.expiry],[certs.expiry],">=0")', 'days', '')])
    s.table('certs', [I('name', 'Certificate', 'text', 30), I('sku', 'SKU', 'text', 15), I('issuer', 'Issued by', 'text', 14), I('issued', 'Issued', 'days', 12), I('expiry', 'Expires', 'days', 12),
                      I('lead', 'Lead days', 'int', 8), F('renew', 'Start renewal', '=IF({expiry}="","",{expiry}-N({lead}))', 'days', 12),
                      S('status', 'Status', '=IF({expiry}="","",IF({expiry}<0,"Expired",IF({renew}<=30,"Expiring soon","Valid")))', 12)], title='Certificates and reports')
    return b


def inbound_logistics():
    b = Book(FOLDER, 'inbound-logistics', tones={'good': ['Best', 'Fits'], 'bad': ['Too heavy', 'Too big']}); f = b.d['f']
    s = b.sheet('Shipments', 'Shipment plan and tracker', 'Shipments to FBA from booking to receiving.', 'Transit days and status per shipment.')
    s.kpis([('Open shipments', '=COUNTIF([ship.stage],"<>Closed")', 'int', ''), ('Units in transit', '=SUMIF([ship.stage],"<>Closed",[ship.units])', 'int', ''),
            ('Late', '=COUNTIF([ship.status],"Late")', 'int', 'Expected date passed, not arrived'),
            ('Receiving accuracy', '=IFERROR(SUMIFS([ship.recv],[ship.stage],"Closed")/SUMIFS([ship.units],[ship.stage],"Closed"),0)', 'pct', 'Closed shipments'),
            ('Average transit days', '=IFERROR(AVERAGE([ship.days]),0)', 'dec1', '')])
    s.table('ship', [I('id', 'Shipment ID', 'text', 13), I('sku', 'SKU', 'text', 15), I('units', 'Units sent', 'int', 9, total='sum'), I('mode', 'Mode', 'text', 8, opts=['Sea', 'Air', 'Truck', 'Rail']),
                     I('shipped', 'Shipped', 'days', 12), I('eta', 'Expected at FBA', 'days', 12),
                     I('stage', 'Stage', 'text', 11, opts=['Booked', 'In transit', 'At port', 'Delivered', 'Receiving', 'Closed']), I('recv', 'Units received', 'int', 9, total='sum'),
                     F('days', 'Transit days', '=IF(OR({eta}="",{shipped}=""),"",{eta}-{shipped})', 'int', 8),
                     S('status', 'Status', '=IF(AND({id}="",{units}=""),"",IF({stage}="Closed",IF(AND(ISNUMBER({recv}),{recv}<{units}),"Short","Received"),IF(AND(OR({stage}="Booked",{stage}="In transit",{stage}="At port"),{eta}<>"",{eta}<0),"Late",{stage})))', 11)],
            title='Shipments')

    s = b.sheet('Freight quotes', 'Freight quote comparison', 'Compare forwarders including the cost of stock in transit.', 'Freight, carrying cost, total and cost per unit per quote.')
    s.settings([('qUnits', 'Units', f['qUnits'], 'int'), ('qCartons', 'Cartons', f['qCartons'], 'int'), ('qKg', 'Kg per carton', f['qKg'], 'dec1'), ('qL', 'Carton length cm', f['qL'], 'dec1'),
                ('qW', 'Carton width cm', f['qW'], 'dec1'), ('qH', 'Carton height cm', f['qH'], 'dec1'), ('qValue', 'Unit value', f['qValue'], 'money2', 'Landed cost, for stock in transit'),
                ('qCarry', 'Carrying cost per year', f['qCarry'], 'pct')], title='Cargo')
    s.kpis([('Volume, cbm', '=in_qCartons*in_qL*in_qW*in_qH/1000000', 'dec2', '', 'cbm'), ('Weight, kg', '=in_qCartons*in_qKg', 'dec1', '', 'kg'),
            ('Chargeable weight, kg', '=MAX(k_kg,k_cbm*167)', 'dec1', 'Higher of actual and 167 kg per cbm', 'chg'),
            ('Carrying cost per day in transit', '=in_qUnits*in_qValue*in_qCarry/365', 'money2', '', 'carry'),
            ('Best quote', '=INDEX([quotes.fwd],MATCH(MIN([quotes.total]),[quotes.total],0))', 'text', '')])
    s.table('quotes', [I('fwd', 'Forwarder', 'text', 16), I('mode', 'Mode', 'text', 11, opts=['Sea LCL', 'Sea FCL', 'Air', 'Air express', 'Rail']), I('basis', 'Rate basis', 'text', 12, opts=['Per cbm', 'Per kg', 'Per container', 'Flat']),
                       I('rate', 'Rate', 'money2', 9), I('qty', 'Containers', 'int', 9), I('fees', 'Fixed fees', 'money', 9), I('days', 'Door to FBA days', 'int', 9),
                       F('freight', 'Freight', '={rate}*IF({basis}="Per cbm",k_cbm,IF({basis}="Per kg",k_chg,IF({basis}="Per container",IF(ISNUMBER({qty}),{qty},1),1)))+{fees}', 'money', 10),
                       F('carry', 'Stock in transit', '=k_carry*{days}', 'money', 10), F('total', 'Total', '={freight}+{carry}', 'money', 10),
                       F('pu', 'Per unit', '=IF(in_qUnits>0,{total}/in_qUnits,"")', 'money2', 9),
                       S('best', 'Best', '=IF({total}=MIN([quotes.total]),"Best","")', 8)], title='Quotes')
    s.chart('bar', 'Total cost by quote', 'quotes', 'fwd', ['freight', 'carry'], 'Cost')

    s = b.sheet('Carton and pallet', 'Carton and pallet configurator', 'How many units fit in a carton and cartons on a pallet.', 'Units per carton, carton weight, cartons and units per pallet.')
    s.settings([('uL', 'Unit length cm', f['uL'], 'dec1'), ('uW', 'Unit width cm', f['uW'], 'dec1'), ('uH', 'Unit height cm', f['uH'], 'dec1'), ('uKg', 'Unit weight kg', f['uKg'], 'dec2'),
                ('cL', 'Carton length cm', f['cL'], 'dec1'), ('cW', 'Carton width cm', f['cW'], 'dec1'), ('cH', 'Carton height cm', f['cH'], 'dec1'), ('cKg', 'Empty carton kg', f['cKg'], 'dec2'),
                ('cMaxKg', 'Carton weight limit kg', f['cMaxKg'], 'dec1', '50 lb'), ('cMaxSide', 'Carton side limit cm', f['cMaxSide'], 'dec1', '25 inches'),
                ('pL', 'Pallet length cm', f['pL'], 'dec1'), ('pW', 'Pallet width cm', f['pW'], 'dec1'), ('pMaxH', 'Max height incl. pallet cm', f['pMaxH'], 'dec1', '72 inches'),
                ('pDeck', 'Pallet height cm', f['pDeck'], 'dec1'), ('pMaxKg', 'Pallet weight limit kg', f['pMaxKg'], 'dec1', '1,500 lb'), ('pKg', 'Empty pallet kg', f['pKg'], 'dec1')], title='Unit, carton and pallet')
    perms = [('uL', 'uW', 'uH'), ('uL', 'uH', 'uW'), ('uW', 'uL', 'uH'), ('uW', 'uH', 'uL'), ('uH', 'uL', 'uW'), ('uH', 'uW', 'uL')]
    fit = 'MAX(' + ','.join('INT(in_cL/in_%s)*INT(in_cW/in_%s)*INT(in_cH/in_%s)' % p for p in perms) + ')'
    s.kpis([('Units per carton', '=' + fit, 'int', 'Best of six orientations', 'upc'), ('Carton weight, kg', '=k_upc*in_uKg+in_cKg', 'dec1', '', 'ckg'),
            ('Carton check', '=IF(k_upc=0,"Too big",IF(k_ckg>in_cMaxKg,"Too heavy",IF(MAX(in_cL,in_cW,in_cH)+1>in_cMaxSide,"Too big","Fits")))', 'status', ''),
            ('Cartons per layer', '=MAX(INT(in_pL/(in_cL+1))*INT(in_pW/(in_cW+1)),INT(in_pL/(in_cW+1))*INT(in_pW/(in_cL+1)))', 'int', '', 'pl'),
            ('Cartons per pallet', '=MIN(k_pl*INT((in_pMaxH-in_pDeck)/(in_cH+1)),IF(k_ckg>0,INT((in_pMaxKg-in_pKg)/k_ckg),0))', 'int', 'Height and weight limits', 'cpp'),
            ('Layers', '=IF(k_pl>0,CEILING(k_cpp/k_pl,1),0)', 'int', ''), ('Units per pallet', '=k_cpp*k_upc', 'int', ''), ('Pallet weight, kg', '=k_cpp*k_ckg+in_pKg', 'dec1', '')])

    s = b.sheet('Customs and duty', 'Customs and duty', 'Duty, tariffs and entry fees per shipment.', 'Duty per line and the fees on the entry.')
    s.settings([('dMode', 'Mode', f['dMode'], 'text', '', ['Sea', 'Air']), ('mpf', 'MPF rate', f['mpf'], 'pct'), ('mpfMin', 'MPF minimum', f['mpfMin'], 'money2'),
                ('mpfMax', 'MPF maximum', f['mpfMax'], 'money2'), ('hmf', 'HMF rate, sea only', f['hmf'], 'pct')], title='Entry')
    s.kpis([('Entered value', '=SUM([lines.val])', 'money', '', 'val'), ('Duty and tariffs', '=SUM([lines.dutyv])', 'money', '', 'duty'),
            ('Entry fees', '=IF(k_val>0,MIN(in_mpfMax,MAX(in_mpfMin,k_val*in_mpf))+IF(in_dMode="Sea",k_val*in_hmf,0),0)', 'money2', 'MPF plus HMF', 'fees'),
            ('Total duty and fees', '=k_duty+k_fees', 'money', '')])
    s.table('lines', [I('sku', 'SKU', 'text', 15), I('desc', 'Description', 'text', 24), I('hts', 'HTS code', 'text', 13), I('origin', 'Origin', 'text', 10, opts=['China', 'Vietnam', 'Taiwan', 'Malaysia', 'India', 'Mexico', 'Other']),
                      I('units', 'Units', 'int', 8), I('value', 'Unit value', 'money2', 9), I('duty', 'Duty', 'pct', 7), I('extra', 'Additional', 'pct', 8),
                      F('val', 'Value', '={units}*{value}', 'money', 10, total='sum'), F('dutyv', 'Duty', '={val}*({duty}+{extra})', 'money', 9, total='sum'),
                      F('per', 'Duty per unit', '=IF(N({units})>0,{dutyv}/{units},"")', 'money2', 9)], title='Entry lines')

    s = b.sheet('Receiving and claims', 'Receiving and claims', 'Units missing at receiving and the reimbursement cases.', 'Missing units, value at risk, claim deadline and status.')
    s.settings([('window', 'Claim window days', f['window'], 'int', 'Days after a shipment closes to open a case')])
    s.kpis([('Units missing', '=SUM([recon.miss])', 'int', ''), ('Value still at risk', '=SUMIF([recon.status],"<>Overdue",[recon.risk])', 'money', ''),
            ('Reimbursed', '=SUMPRODUCT([recon.reimb],[recon.cost])', 'money', ''), ('Claim window missed', '=COUNTIF([recon.status],"Overdue")', 'int', '')])
    s.table('recon', [I('id', 'Shipment ID', 'text', 13), I('sku', 'SKU', 'text', 15), I('sent', 'Sent', 'int', 8), I('recv', 'Received', 'int', 8), I('closed', 'Closed', 'days', 12),
                      I('claim', 'Case', 'text', 10, opts=['Not filed', 'Open', 'Approved', 'Rejected']), I('reimb', 'Units reimbursed', 'int', 9), I('cost', 'Unit cost', 'money2', 9),
                      F('miss', 'Missing', '=MAX(0,{sent}-{recv})', 'int', 8, total='sum'),
                      F('risk', 'At risk', '=IF({claim}="Rejected",0,MAX(0,{miss}-N({reimb}))*{cost})', 'money', 9),
                      F('by', 'Claim by', '=IF(OR({miss}=0,{closed}=""),"",{closed}+in_window)', 'days', 12),
                      S('status', 'Status', '=IF(OR({sent}="",{recv}=""),"",IF({miss}=0,"Matched",IF(AND({claim}="Approved",{miss}-N({reimb})<=0),"Approved",IF({claim}="Rejected","Rejected",IF({claim}="Open","Claim open",IF(AND({by}<>"",{by}<0),"Overdue","Discrepancy"))))))', 12)],
            title='Reconciliation')
    return b


def advertising():
    b = Book(FOLDER, 'advertising', tones={'good': ['Promote to exact', 'Raise'], 'warn': ['Lower bid', 'Keep collecting', 'Lower'], 'bad': ['Negate']}); f = b.d['f']
    s = b.sheet('Campaigns', 'Campaign structure', 'Campaigns, goals and budget split.', 'Daily budget and share of active budget per campaign.')
    s.kpis([('Live campaigns', '=COUNTIF([camps.status],"Live")', 'int', ''), ('Daily budget, not paused', '=SUMIF([camps.status],"<>Paused",[camps.budget])', 'money', '', 'tot')])
    s.table('camps', [I('name', 'Campaign', 'text', 26), I('type', 'Ad type', 'text', 18, opts=['Sponsored Products', 'Sponsored Brands', 'Sponsored Display']),
                      I('target', 'Targeting', 'text', 15, opts=['Auto', 'Exact', 'Phrase', 'Broad', 'Product targeting', 'Category']), I('goal', 'Goal', 'text', 12, opts=['Launch', 'Rank', 'Profit', 'Defend brand', 'Research']),
                      I('budget', 'Daily budget', 'money2', 9, total='sum'), I('bid', 'Default bid', 'money2', 9), I('kws', 'Targets', 'int', 8),
                      I('status', 'Status', 'text', 9, opts=['Planned', 'Live', 'Paused']),
                      F('share', 'Share of budget', '=IF(AND({status}<>"Paused",k_tot>0),{budget}/k_tot,"")', 'pct', 9)], title='Campaigns')

    s = b.sheet('PPC performance', 'PPC performance', 'Weekly ACoS and TACoS against target and break-even.', 'ACoS, TACoS, CTR, conversion, CPC and ROAS by week.')
    s.settings([('price', 'Selling price', f['price'], 'money2'), ('profitBefore', 'Profit per unit before ads', f['profitBefore'], 'money2'), ('target', 'Target ACoS', f['target'], 'pct')], title='Targets')
    s.kpis([('Break-even ACoS', '=IF(in_price>0,in_profitBefore/in_price,0)', 'pct', 'Above this, ads lose money', 'be'),
            ('ACoS, last week', '=INDEX([weeks.acos],MATCH(MAX([weeks.week]),[weeks.week],0))', 'pct', ''), ('TACoS, last week', '=INDEX([weeks.tacos],MATCH(MAX([weeks.week]),[weeks.week],0))', 'pct', ''),
            ('Spend, last 4 weeks', '=SUMIF([weeks.week],">="&(MAX([weeks.week])-3),[weeks.spend])', 'money', '')])
    s.table('weeks', [I('week', 'Week', 'weeks', 13), I('spend', 'Spend', 'money', 9, total='sum'), I('sales', 'Ad sales', 'money', 10, total='sum'), I('orders', 'Ad orders', 'int', 9, total='sum'),
                      I('clicks', 'Clicks', 'int', 9, total='sum'), I('impr', 'Impressions', 'int', 11, total='sum'), I('total', 'Total sales', 'money', 10, total='sum'),
                      F('acos', 'ACoS', '=IF(N({sales})>0,{spend}/{sales},"")', 'pct', 8), F('tacos', 'TACoS', '=IF(N({total})>0,{spend}/{total},"")', 'pct', 8),
                      F('ctr', 'CTR', '=IF(N({impr})>0,{clicks}/{impr},"")', 'pct', 7), F('cvr', 'Conversion', '=IF(N({clicks})>0,{orders}/{clicks},"")', 'pct', 9),
                      F('cpc', 'CPC', '=IF(N({clicks})>0,{spend}/{clicks},"")', 'money2', 8), F('roas', 'ROAS', '=IF(N({spend})>0,{sales}/{spend},"")', 'dec2', 8),
                      S('status', 'Status', '=IF({acos}="","",IF({acos}<=in_target,"On track",IF({acos}<=k_be,"Watch","Loss")))', 9)], title='Weekly results', help='Week is counted from this week: -1 is last week.')
    s.chart('line', 'ACoS and TACoS by week', 'weeks', 'week', ['acos', 'tacos'], 'Share of sales')

    s = b.sheet('Search terms', 'Search term harvest', 'Sort search terms into promote, negate and lower bid.', 'ACoS, conversion and an action per search term.')
    s.settings([('minOrders', 'Orders to promote', f['minOrders'], 'int'), ('minClicks', 'Clicks with no order to negate', f['minClicks'], 'int')], title='Rules')
    s.kpis([('Promote to exact', '=COUNTIF([terms.action],"Promote to exact")', 'int', ''), ('Negate', '=COUNTIF([terms.action],"Negate")', 'int', ''),
            ('Wasted spend on negates', '=SUMIF([terms.action],"Negate",[terms.spend])', 'money', '')])
    s.table('terms', [I('term', 'Search term', 'text', 30), I('camp', 'Campaign', 'text', 20), I('clicks', 'Clicks', 'int', 8), I('spend', 'Spend', 'money2', 9), I('orders', 'Orders', 'int', 8), I('sales', 'Sales', 'money2', 9),
                      F('acos', 'ACoS', '=IF(N({sales})>0,{spend}/{sales},"")', 'pct', 8), F('cvr', 'Conversion', '=IF(N({clicks})>0,{orders}/{clicks},"")', 'pct', 9),
                      S('action', 'Action', '=IF({term}="","",IF(AND(N({orders})>=MAX(1,in_minOrders),{acos}<>"",{acos}<=in_target),"Promote to exact",IF(AND(N({orders})=0,N({clicks})>=MAX(1,in_minClicks)),"Negate",IF(AND(N({orders})>0,{acos}<>"",{acos}>in_target),"Lower bid","Keep collecting"))))', 16)],
            title='Search terms')

    s = b.sheet('Bids and budget', 'Bid and budget calculator', 'Bids from margin, target ACoS and conversion.', 'Target bid, change against the current bid and spend per day.')
    s.settings([('cvr', 'Default conversion rate', f['cvr'], 'pct', 'Used when a keyword has no rate of its own')], title='Inputs')
    s.kpis([('Highest bid at target ACoS', '=in_price*in_target*in_cvr', 'money2', 'Price times target ACoS times conversion'), ('Budget per day at target bids', '=SUM([bids.spend])', 'money', ''),
            ('Bids to raise', '=COUNTIF([bids.action],"Raise")', 'int', ''), ('Bids to lower', '=COUNTIF([bids.action],"Lower")', 'int', '')])
    s.table('bids', [I('kw', 'Keyword', 'text', 28), I('match', 'Match', 'text', 8, opts=['Exact', 'Phrase', 'Broad']), I('bid', 'Current bid', 'money2', 9), I('clicks', 'Clicks per day', 'dec1', 9),
                     I('cvr', 'Conversion', 'pct', 9),
                     F('tbid', 'Target bid', '=in_price*in_target*IF(ISNUMBER({cvr}),{cvr},in_cvr)', 'money2', 9),
                     F('chg', 'Change', '=IF(N({bid})>0,{tbid}/{bid}-1,"")', 'spct', 8),
                     F('spend', 'Spend per day', '=IF(ISNUMBER({clicks}),{clicks}*{tbid},"")', 'money2', 9, total='sum'),
                     S('action', 'Action', '=IF({chg}="","",IF({chg}>0.05,"Raise",IF({chg}<-0.05,"Lower","Keep")))', 9)], title='Keyword bids')
    return b


def returns_quality():
    b = Book(FOLDER, 'returns-quality', tones={'good': ['Best']}); f = b.d['f']
    reasons = ['Defective', 'Not as described', 'No longer needed', 'Ordered wrong item', 'Better price elsewhere', 'Arrived damaged', 'Missing parts', 'Incompatible']
    s = b.sheet('Returns', 'Returns analysis', 'Return rate by SKU against the category threshold.', 'Return rate, units above the threshold, processing fees and status per SKU.')
    s.settings([('thr', 'Category return threshold', f['thr'], 'pct'), ('fee', 'Returns processing fee per unit', f['fee'], 'money2')], title='Threshold')
    s.kpis([('Return rate', '=IF(SUM([ret.sold])>0,SUM([ret.returned])/SUM([ret.sold]),0)', 'pct', 'All SKUs'), ('Units returned', '=SUM([ret.returned])', 'int', ''),
            ('SKUs over the threshold', '=COUNTIF([ret.status],"Over limit")', 'int', ''), ('Processing fees', '=SUM([ret.fees])', 'money', 'On units above the threshold')])
    s.table('ret', [I('sku', 'SKU', 'text', 16), I('sold', 'Units sold', 'int', 9, total='sum'), I('returned', 'Units returned', 'int', 9, total='sum'), I('reason', 'Top reason', 'text', 20, opts=reasons),
                    I('share', 'Top reason share', 'pct', 9),
                    F('rate', 'Return rate', '=IF(N({sold})>0,{returned}/{sold},"")', 'pct', 9),
                    F('above', 'Units above threshold', '=IF({rate}="","",MAX(0,ROUND({returned}-in_thr*{sold},0)))', 'int', 10),
                    F('fees', 'Fees', '=IF({above}="","",{above}*in_fee)', 'money', 9, total='sum'),
                    S('status', 'Status', '=IF({rate}="","",IF({rate}>in_thr,"Over limit",IF({rate}>in_thr*0.8,"Watch","OK")))', 10)], title='Returns by SKU, last 30 days')
    s.table('reasons', [LBL('Reason', 22), F('units', 'Units returned', ['=ROUND(SUMPRODUCT(([ret.reason]="%s")*[ret.returned]*IF(ISNUMBER([ret.share]),[ret.share],1)),0)' % r for r in reasons], 'int', 12)],
            fixed=reasons, title='Returns by reason')
    s.chart('bar', 'Returns by reason', 'reasons', '_label', ['units'], 'Units')

    s = b.sheet('Defects', 'Defect and feedback tracker', 'Defect patterns from reviews, returns and QC.', 'Open defects, critical ones and reports by type.')
    types = sorted(set([d.get('type') for d in b.d['t']['def'] if d.get('type')]))
    s.kpis([('Open defects', '=COUNTIF([def.status],"<>Fixed")', 'int', ''), ('Critical and open', '=COUNTIFS([def.sev],"Critical",[def.status],"<>Fixed")', 'int', ''),
            ('Most reported type', '=INDEX([def.type],MATCH(MAX([def.bytype]),[def.bytype],0))', 'text', '')])
    s.table('def', [I('date', 'First seen', 'days', 12), I('sku', 'SKU', 'text', 15), I('source', 'Source', 'text', 15, opts=['Review', 'Return comment', 'Customer message', 'Seller feedback', 'A-to-z claim', 'QC inspection']),
                    I('type', 'Defect', 'text', 20), I('sev', 'Severity', 'text', 9, opts=['Low', 'Medium', 'High', 'Critical']), I('count', 'Reports', 'int', 8),
                    I('cause', 'Root cause and fix', 'text', 36), I('status', 'Status', 'text', 10, opts=['Open', 'In progress', 'Fixed']),
                    F('bytype', 'Reports of this type', '=SUMIF([def.type],{type},[def.count])', 'int', 10)], title='Defect log')

    s = b.sheet('Warranty and RMA', 'Warranty and RMA log', 'Customer cases against the service level.', 'Days open and status per case.')
    s.settings([('sla', 'Days to resolve', f['sla'], 'int')], title='Service level')
    s.kpis([('Open cases', '=COUNTIF([rma.status],"Open")+COUNTIF([rma.status],"Overdue")', 'int', ''), ('Overdue', '=COUNTIF([rma.status],"Overdue")', 'int', ''),
            ('Average days to close', '=IFERROR(AVERAGEIF([rma.status],"Closed",[rma.days]),0)', 'dec1', ''), ('Cost', '=SUM([rma.cost])', 'money', '')])
    s.table('rma', [I('id', 'Case', 'text', 9), I('opened', 'Opened', 'days', 12), I('sku', 'SKU', 'text', 15), I('order', 'Order ID', 'text', 20), I('issue', 'Issue', 'text', 28),
                    I('res', 'Resolution', 'text', 10, opts=['Pending', 'Replace', 'Refund', 'Repair', 'Rejected']), I('cost', 'Cost', 'money2', 9, total='sum'), I('closed', 'Closed', 'days', 12),
                    F('days', 'Days', '=IF({opened}="","",IF({closed}="",-{opened},{closed}-{opened}))', 'int', 7),
                    S('status', 'Status', '=IF({opened}="","",IF({closed}<>"","Closed",IF({days}>in_sla,"Overdue","Open")))', 9)], title='Cases')

    s = b.sheet('Recovery decision', 'Recovery decision', 'What to do with returned stock.', 'Net per unit and in total for resell, refurbish, liquidate and dispose.')
    s.settings([('qUnits', 'Units to decide on', f['qUnits'], 'int'), ('qCost', 'Unit cost', f['qCost'], 'money2'), ('qPrice', 'New selling price', f['qPrice'], 'money2'), ('qFees', 'Amazon fees at new price', f['qFees'], 'money2'),
                ('gradeShare', 'Units sellable as used', f['gradeShare'], 'pct'), ('usedPrice', 'Used price, share of new', f['usedPrice'], 'pct'), ('refurbCost', 'Refurbish cost per unit', f['refurbCost'], 'money2'),
                ('refurbYield', 'Refurbish success rate', f['refurbYield'], 'pct'), ('removal', 'Removal fee per unit', f['removal'], 'money2'), ('liq', 'Liquidation recovery, share of cost', f['liq'], 'pct'),
                ('disposal', 'Disposal fee per unit', f['disposal'], 'money2')], title='Returned stock and assumptions')
    s.kpis([('Used net per unit', '=in_qPrice*in_usedPrice-in_qFees*in_usedPrice', 'money2', 'Used price less fees at that price', 'used'),
            ('Best option', '=INDEX([opts._label],MATCH(MAX([opts.net]),[opts.net],0))', 'text', '')])
    nets = ['=in_gradeShare*k_used-(1-in_gradeShare)*in_disposal', '=in_refurbYield*k_used-in_refurbCost-in_removal-(1-in_refurbYield)*in_disposal', '=in_qCost*in_liq', '=-in_disposal']
    s.table('opts', [LBL('Option', 26), F('net', 'Net per unit', nets, 'money2', 11), F('total', 'Total', '={net}*in_qUnits', 'smoney', 11),
                     S('best', 'Best', '=IF({net}=MAX([opts.net]),"Best","")', 8)], title='Options compared')

    s = b.sheet('Account health', 'Account health', 'Order defect rate and warnings by week.', 'Order defect rate and status per week.')
    s.kpis([('Order defect rate, last week', '=INDEX([health.odr],MATCH(MAX([health.week]),[health.week],0))', 'pct', 'Keep under 1%'),
            ('Policy warnings, last 4 weeks', '=SUMIF([health.week],">="&(MAX([health.week])-3),[health.warn])', 'int', ''),
            ('Status, last week', '=INDEX([health.status],MATCH(MAX([health.week]),[health.week],0))', 'status', '')])
    s.table('health', [I('week', 'Week', 'weeks', 13), I('orders', 'Orders', 'int', 9), I('neg', 'Negative feedback', 'int', 9), I('atoz', 'A-to-z claims', 'int', 9), I('cb', 'Chargebacks', 'int', 9),
                       I('warn', 'Policy warnings', 'int', 9), I('supp', 'Suppressed listings', 'int', 9),
                       F('odr', 'Order defect rate', '=IF(N({orders})>0,({neg}+{atoz}+{cb})/{orders},"")', 'pct', 10),
                       S('status', 'Status', '=IF({odr}="","",IF({odr}>=0.01,"Critical",IF({odr}>=0.005,"Watch","Healthy")))', 10)], title='Weekly metrics')
    s.chart('line', 'Order defect rate by week', 'health', 'week', ['odr'], 'Order defect rate')
    return b


def finance_tax():
    b = Book(FOLDER, 'finance-tax'); f = b.d['f']
    s = b.sheet('SKU P&L', 'SKU profit and loss', 'Contribution and margin per SKU for the period.', 'Contribution, margin and status per SKU.')
    s.settings([('period', 'Period', f['period'], 'text')], title='Period')
    s.kpis([('Revenue', '=SUM([pnl.rev])', 'money', ''), ('Contribution', '=SUM([pnl.contrib])', 'money', ''), ('Margin', '=IF(SUM([pnl.rev])>0,SUM([pnl.contrib])/SUM([pnl.rev]),0)', 'pct', ''),
            ('TACoS', '=IF(SUM([pnl.rev])>0,SUM([pnl.ads])/SUM([pnl.rev]),0)', 'pct', ''), ('Amazon fees, share of revenue', '=IF(SUM([pnl.rev])>0,(SUM([pnl.referral])+SUM([pnl.fba])+SUM([pnl.storage]))/SUM([pnl.rev]),0)', 'pct', '')])
    s.table('pnl', [I('sku', 'SKU', 'text', 16), I('units', 'Units', 'int', 8, total='sum'), I('rev', 'Revenue', 'money', 10, total='sum'), I('cogs', 'Cost per unit', 'money2', 9),
                    I('referral', 'Referral fees', 'money', 9, total='sum'), I('fba', 'FBA fees', 'money', 9, total='sum'), I('storage', 'Storage', 'money', 9, total='sum'), I('ads', 'Advertising', 'money', 9, total='sum'),
                    I('returns', 'Refunds and returns', 'money', 9, total='sum'), I('other', 'Other', 'money', 8, total='sum'),
                    F('contrib', 'Contribution', '={rev}-{units}*{cogs}-{referral}-{fba}-{storage}-{ads}-{returns}-{other}', 'money', 10, total='sum'),
                    F('margin', 'Margin', '=IF(N({rev})>0,{contrib}/{rev},"")', 'pct', 8),
                    S('status', 'Status', '=IF({margin}="","",IF({margin}>=0.1,"Profitable",IF({margin}>=0,"Thin margin","Loss")))', 11)], title='Profit and loss by SKU')
    s.chart('bar', 'Contribution by SKU', 'pnl', 'sku', ['contrib'], 'Contribution')

    s = b.sheet('Settlements', 'Settlement reconciliation', 'Your sales record against what Amazon settled and paid.', 'Expected payout, difference and status per settlement.')
    s.settings([('tol', 'Allowed difference', f['tol'], 'money2')], title='Tolerance')
    s.kpis([('Settlements checked', '=COUNT([settle.deposit])', 'int', ''), ('To check', '=COUNTIF([settle.status],"Discrepancy")', 'int', ''),
            ('Net difference', '=SUM([settle.diff])', 'smoney', 'Deposit less expected'), ('Reserve held, latest', '=INDEX([settle.reserve],MATCH(MAX([settle.end]),[settle.end],0))', 'money', '')])
    s.table('settle', [I('start', 'From', 'days', 12), I('end', 'To', 'days', 12), I('mine', 'Your sales record', 'money', 11), I('sales', 'Settled sales', 'money', 11), I('fees', 'Fees', 'money', 9),
                       I('refunds', 'Refunds', 'money', 9), I('reimb', 'Reimbursements', 'money', 10), I('reserve', 'Reserve held', 'money', 9), I('deposit', 'Deposit', 'money', 10),
                       F('exp', 'Expected payout', '={sales}-{fees}-{refunds}+{reimb}-{reserve}', 'money', 11),
                       F('diff', 'Difference', '=IF(ISNUMBER({deposit}),{deposit}-{exp},"")', 'smoney', 10),
                       F('gap', 'Sales gap', '=IF(ISNUMBER({mine}),{sales}-{mine},"")', 'smoney', 9),
                       S('status', 'Status', '=IF({sales}="","",IF({diff}="","Pending",IF(OR(ABS({diff})>in_tol,AND({gap}<>"",ABS(N({gap}))>in_tol)),"Discrepancy","Matched")))', 11)], title='Settlements')

    s = b.sheet('Cash flow', 'Cash flow forecast', 'Twelve months of cash in and out.', 'Net cash and closing cash per month against the minimum.')
    s.settings([('cStart', 'First month', f['cStart'], 'months'), ('cOpen', 'Opening cash', f['cOpen'], 'money'), ('cMin', 'Minimum cash to keep', f['cMin'], 'money')], title='Starting point')
    s.kpis([('Lowest cash', '=MIN([cash.close])', 'money', ''), ('Lowest cash in month', '=INDEX([cash._label],MATCH(MIN([cash.close]),[cash.close],0))', 'text', ''),
            ('Months below the minimum', '=COUNTIF([cash.close],"<"&in_cMin)', 'int', ''), ('Cash at the end', '=INDEX([cash.close],ROWS([cash.close]))', 'money', ''),
            ('Paid to suppliers', '=SUM([cash.dep])+SUM([cash.bal])', 'money', 'Deposits and balances')])
    s.table('cash', [LBL('Month', 9), F('when', 'Month', '=in_cStart+{n}-1', 'months', 13),
                     I('payout', 'Amazon payouts', 'money', 10, total='sum'), I('otherIn', 'Other income', 'money', 9, total='sum'), I('dep', 'PO deposits', 'money', 9, total='sum'), I('bal', 'PO balances', 'money', 9, total='sum'),
                     I('freight', 'Freight and duty', 'money', 9, total='sum'), I('opex', 'Running costs', 'money', 9, total='sum'), I('tax', 'Tax payments', 'money', 9, total='sum'),
                     F('net', 'Net cash', '={payout}+{otherIn}-{dep}-{bal}-{freight}-{opex}-{tax}', 'smoney', 10, total='sum'),
                     F('close', 'Closing cash', ('=in_cOpen+{net}', '={close^}+{net}'), 'money', 11),
                     S('status', 'Status', '=IF({close}<in_cMin,"Short","OK")', 8)], fixed=['Month %d' % (i + 1) for i in range(12)], title='Monthly cash')
    s.chart('line', 'Closing cash by month', 'cash', '_label', ['close'], 'Cash')

    s = b.sheet('VAT and sales tax', 'VAT and sales tax', 'Filings by jurisdiction and period.', 'Tax due, days to the deadline and status per filing.')
    s.kpis([('Tax still to pay', '=SUMIF([vat.filed],"<>Yes",[vat.tax])', 'money', ''), ('Due within 30 days', '=COUNTIFS([vat.filed],"<>Yes",[vat.due],"<=30")', 'int', ''),
            ('Overdue', '=COUNTIF([vat.status],"Overdue")', 'int', '')])
    s.table('vat', [I('where', 'Jurisdiction', 'text', 14), I('type', 'Tax', 'text', 9, opts=['VAT', 'Sales tax', 'GST']), I('reg', 'Registration', 'text', 16), I('freq', 'Frequency', 'text', 10, opts=['Monthly', 'Quarterly', 'Yearly']),
                    I('end', 'Period end', 'days', 12), I('due', 'Due', 'days', 12), I('sales', 'Taxable sales', 'money', 10), I('rate', 'Rate', 'pct', 7),
                    I('mp', 'Marketplace collects', 'text', 10, opts=['No', 'Yes']), I('filed', 'Filed', 'text', 7, opts=['No', 'Yes']),
                    F('tax', 'Tax due', '=IF({mp}="Yes",0,IF(AND(ISNUMBER({sales}),ISNUMBER({rate})),{sales}*{rate},""))', 'money', 9),
                    S('status', 'Status', '=IF({where}="","",IF({filed}="Yes","Filed",IF({due}="","Open",IF({due}<0,"Overdue",IF({due}<=14,"Due soon","Open")))))', 9)], title='Filings')

    s = b.sheet('Inventory and COGS', 'Inventory valuation and COGS', 'Weighted average cost, COGS and closing stock value.', 'Average cost, COGS and closing units and value per SKU.')
    s.kpis([('Cost of goods sold', '=SUM([inv.cogs])', 'money', ''), ('Closing stock value', '=SUM([inv.value])', 'money', ''), ('Closing units', '=SUM([inv.units])', 'int', ''),
            ('SKUs with negative stock', '=COUNTIF([inv.units],"<0")', 'int', 'Check the counts')])
    s.table('inv', [I('sku', 'SKU', 'text', 16), I('oUnits', 'Opening units', 'int', 9), I('oValue', 'Opening value', 'money', 10), I('pUnits', 'Units purchased', 'int', 9), I('pValue', 'Purchase value', 'money', 10),
                    I('sold', 'Units sold', 'int', 9),
                    F('avg', 'Average cost', '=IF({oUnits}+{pUnits}>0,({oValue}+{pValue})/({oUnits}+{pUnits}),"")', 'money2', 9),
                    F('cogs', 'COGS', '=IF({avg}="","",{sold}*{avg})', 'money', 10, total='sum'),
                    F('units', 'Closing units', '={oUnits}+{pUnits}-{sold}', 'int', 9, total='sum'),
                    F('value', 'Closing value', '=IF({avg}="","",MAX(0,{units})*{avg})', 'money', 10, total='sum')], title='Inventory by SKU')
    return b


def management_growth():
    b = Book(FOLDER, 'management-growth', tones={'good': ['Yes'], 'warn': ['No']}); f = b.d['f']
    mk = ['Germany', 'United Kingdom', 'France', 'Italy', 'Spain', 'Netherlands', 'Poland', 'Sweden', 'Canada', 'Mexico', 'Japan', 'Australia']
    s = b.sheet('Weekly review', 'Weekly business review', 'Revenue, margin, ads, conversion and stock by week.', 'Week on week change, conversion, TACoS, margin and status by week.')
    s.kpis([('Revenue, last week', '=INDEX([weeks.rev],MATCH(MAX([weeks.week]),[weeks.week],0))', 'money', ''),
            ('Week on week', '=INDEX([weeks.wow],MATCH(MAX([weeks.week]),[weeks.week],0))', 'spct', ''),
            ('Contribution margin, last week', '=INDEX([weeks.margin],MATCH(MAX([weeks.week]),[weeks.week],0))', 'pct', ''),
            ('TACoS, last week', '=INDEX([weeks.tacos],MATCH(MAX([weeks.week]),[weeks.week],0))', 'pct', ''),
            ('Status, last week', '=INDEX([weeks.status],MATCH(MAX([weeks.week]),[weeks.week],0))', 'status', 'Watch: in stock under 90%, rating under 4.3 or TACoS over 15%')])
    s.table('weeks', [I('week', 'Week', 'weeks', 13), I('rev', 'Revenue', 'money', 10), I('units', 'Units', 'int', 8), I('sessions', 'Sessions', 'int', 9), I('ads', 'Ad spend', 'money', 9),
                      I('contrib', 'Contribution', 'money', 10), I('buybox', 'Buy Box', 'pct', 8), I('instock', 'In stock', 'pct', 8), I('rating', 'Rating', 'dec1', 7),
                      F('wow', 'Week on week', ('=""', '=IF(N({rev^})>0,{rev}/{rev^}-1,"")'), 'spct', 9),
                      F('conv', 'Conversion', '=IF(N({sessions})>0,{units}/{sessions},"")', 'pct', 9), F('tacos', 'TACoS', '=IF(N({rev})>0,{ads}/{rev},"")', 'pct', 8),
                      F('margin', 'Margin', '=IF(N({rev})>0,{contrib}/{rev},"")', 'pct', 8),
                      S('status', 'Status', '=IF({rev}="","",IF(OR(AND(ISNUMBER({instock}),{instock}<0.9),AND(ISNUMBER({rating}),{rating}<4.3),AND({tacos}<>"",{tacos}>0.15)),"Watch","On track"))', 10)],
            title='Weekly numbers', help='Oldest week first, so week on week compares each row with the row above.')
    s.chart('line', 'Revenue by week', 'weeks', 'week', ['rev'], 'Revenue')

    s = b.sheet('Portfolio', 'SKU portfolio scorecard', 'Which SKUs to scale, fix, keep or cut.', 'Profit, reason and action per SKU.')
    s.settings([('minMargin', 'Margin floor', f['minMargin'], 'pct'), ('scaleMargin', 'Margin to scale', f['scaleMargin'], 'pct'), ('scaleGrowth', 'Growth to scale', f['scaleGrowth'], 'pct'),
                ('maxReturns', 'Return rate ceiling', f['maxReturns'], 'pct'), ('minRating', 'Rating floor', f['minRating'], 'dec1')], title='Floors')
    s.kpis([('Scale', '=COUNTIF([skus.action],"Scale")', 'int', ''), ('Fix', '=COUNTIF([skus.action],"Fix")', 'int', ''), ('Cut', '=COUNTIF([skus.action],"Cut")', 'int', ''),
            ('Revenue in Scale SKUs', '=IF(SUM([skus.rev])>0,SUMIF([skus.action],"Scale",[skus.rev])/SUM([skus.rev]),0)', 'pct', ''), ('Profit, 90 days', '=SUM([skus.profit])', 'money', '')])
    s.table('skus', [I('sku', 'SKU', 'text', 18), I('rev', 'Revenue, 90 days', 'money', 11), I('margin', 'Margin', 'pct', 8), I('growth', 'Growth', 'spct', 8), I('returns', 'Return rate', 'pct', 8),
                     I('rating', 'Rating', 'dec1', 7), I('cover', 'Days of cover', 'int', 8),
                     F('profit', 'Profit, 90 days', '={rev}*{margin}', 'money', 10, total='sum'),
                     S('action', 'Action', '=IF({margin}="","",IF(AND({margin}<0,N({growth})<0),"Cut",IF(OR({margin}<in_minMargin,AND(ISNUMBER({returns}),{returns}>in_maxReturns),AND(ISNUMBER({rating}),{rating}<in_minRating)),"Fix",IF(AND({margin}>=in_scaleMargin,N({growth})>=in_scaleGrowth),"Scale","Keep"))))', 8),
                     F('why', 'Reason', '=IF({action}="","",_xlfn.TEXTJOIN(", ",TRUE,IF({action}="Cut","losing money and shrinking",""),IF(AND({action}<>"Cut",{margin}<in_minMargin),"margin under floor",""),IF(AND({action}<>"Cut",ISNUMBER({returns}),{returns}>in_maxReturns),"returns over ceiling",""),IF(AND({action}<>"Cut",ISNUMBER({rating}),{rating}<in_minRating),"rating under floor",""),IF({action}="Scale","strong margin and growth",""),IF({action}="Keep","steady, no floor broken",""),IF(AND(ISNUMBER({cover}),{cover}<28,{action}<>"Cut"),"low stock","")))', 'text', 34)],
            title='SKUs', help='Use the last 90 days; growth compares with the 90 days before.')
    s.chart('bar', 'Revenue by SKU, 90 days', 'skus', 'sku', ['rev'], 'Revenue', horizontal=True)

    s = b.sheet('Marketplaces', 'Marketplace expansion', 'Size new marketplaces before opening them.', 'Profit per unit and per month and payback per marketplace.')
    s.kpis([('Best marketplace', '=INDEX([mkts.mkt],MATCH(MAX([mkts.monthly]),[mkts.monthly],0))', 'text', 'Highest monthly profit'), ('Ready to launch', '=COUNTIF([mkts.status],"Go")', 'int', 'Payback within 6 months'),
            ('Profit a month, all Go', '=SUMIF([mkts.status],"Go",[mkts.monthly])', 'money', ''), ('Setup cost, all Go', '=SUMIF([mkts.status],"Go",[mkts.setup])', 'money', '')])
    s.table('mkts', [I('mkt', 'Marketplace', 'text', 15, opts=mk), I('demand', 'Niche units a month', 'int', 10), I('share', 'Your share', 'pct', 8), I('price', 'Price incl. VAT', 'money2', 9),
                     I('vat', 'VAT', 'pct', 7), I('ref', 'Referral', 'pct', 8), I('fba', 'FBA fee', 'money2', 8), I('landed', 'Landed cost', 'money2', 8), I('ads', 'Ads per unit', 'money2', 8), I('setup', 'Setup cost', 'money', 9),
                     F('unit', 'Profit per unit', '=IF(N({price})>0,{price}/(1+{vat})-{price}*{ref}-{fba}-{landed}-{ads},"")', 'money2', 9),
                     F('monthly', 'Profit a month', '=IF({unit}="","",{unit}*{demand}*{share})', 'money', 10),
                     F('payback', 'Payback, months', '=IF(N({monthly})>0,{setup}/{monthly},"")', 'dec1', 9),
                     S('status', 'Result', '=IF({unit}="","",IF({payback}="","No go",IF({payback}<=6,"Go",IF({payback}<=12,"Review","No go"))))', 8)], title='Marketplaces')

    s = b.sheet('Exit valuation', 'Exit valuation', 'What the brand could sell for.', 'SDE, a suggested multiple change and the value range.')
    s.settings([('eRev', 'Revenue, trailing 12 months', f['eRev'], 'money'), ('eProfit', 'Net profit', f['eProfit'], 'money'), ('eAddbacks', 'Owner add-backs', f['eAddbacks'], 'money', 'Owner salary and one-off costs'),
                ('eInv', 'Inventory at cost', f['eInv'], 'money', 'Usually paid on top'), ('eTop', 'Revenue from top SKU', f['eTop'], 'pct'), ('eAge', 'Months of trading history', f['eAge'], 'int'),
                ('eGrowth', 'Revenue growth, year on year', f['eGrowth'], 'pct')], title='Trailing twelve months')
    s.kpis([('SDE', '=in_eProfit+in_eAddbacks', 'money', 'Seller\'s discretionary earnings', 'sde'), ('SDE margin', '=IF(in_eRev>0,k_sde/in_eRev,0)', 'pct', ''),
            ('Suggested multiple change', '=ROUND(IF(in_eAge<24,-0.5,IF(in_eAge>=36,0.3,0))+IF(in_eTop>0.5,-0.5,IF(in_eTop<0.3,0.2,0))+IF(in_eGrowth>=0.2,0.4,IF(in_eGrowth<0,-0.5,0)),1)', 'dec1', 'From history, concentration and growth'),
            ('Base value with inventory', '=[scen.total#1]', 'money', ''), ('Buyer checks in place', '=COUNTIF([drivers.ok],"Yes")', 'int', 'Of 8')])
    s.table('scen', [LBL('Case', 10), I('mult', 'Multiple of SDE', 'dec1', 11), F('value', 'Business value', '=k_sde*{mult}', 'money', 12), F('total', 'Plus inventory', '={value}+in_eInv', 'money', 12),
                     F('revx', 'Multiple of revenue', '=IF(in_eRev>0,{value}/in_eRev,"")', 'dec2', 11)], title='Valuation range')
    s.table('drivers', [LBL('Check', 44), I('ok', 'In place', 'text', 9, opts=['No', 'Yes']), I('note', 'Notes', 'text', 36)], title='What buyers check')
    return b


ALL = ['product_selection', 'unit_economics', 'sourcing_suppliers', 'compliance', 'inbound_logistics', 'advertising', 'returns_quality', 'finance_tax', 'management_growth']
