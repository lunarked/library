"""Excel versions of the manufacturing workbooks (production planning is built by its own script)."""
from xlkit import Book, I, F, S, LBL

FOLDER = 'manufacturing'
AQLS = ['0.65', '1.0', '1.5', '2.5', '4.0']
LOTS = [2, 9, 16, 26, 51, 91, 151, 281, 501, 1201, 3201, 10001, 35001, 150001]
NS = [2, 3, 5, 8, 13, 20, 32, 50, 80, 125, 200, 315, 500, 800]
AC = {'0.65': ['d', 'd', 'd', 'd', 'd', 0, 'u', 1, 1, 2, 3, 5, 7, 10], '1.0': ['d', 'd', 'd', 'd', 0, 'u', 1, 1, 2, 3, 5, 7, 10, 14],
      '1.5': ['d', 'd', 'd', 0, 'u', 1, 1, 2, 3, 5, 7, 10, 14, 21], '2.5': ['d', 'd', 0, 'u', 1, 1, 2, 3, 5, 7, 10, 14, 21, 21],
      '4.0': ['d', 0, 'u', 1, 1, 2, 3, 5, 7, 10, 14, 21, 21, 21]}


def aql_plan(k, aql):
    row = AC[aql]
    while row[k] == 'd': k += 1
    while row[k] == 'u': k -= 1
    return NS[k], row[k]


def bom_master():
    b = Book(FOLDER, 'bom-master'); f = b.d['f']
    s = b.sheet('BOM', 'BOM register', 'One bill of materials with cost, lead time, MOQ and sourcing per line.', 'Extended cost, share and supply risk flags per line.')
    s.settings([('rev', 'BOM revision', f['rev'], 'text'), ('longLead', 'Long lead from, weeks', f['longLead'], 'int')])
    s.kpis([('Material cost per device', '=SUM([bom.ext])', 'money2', ''), ('Top 5 lines, share of cost', '=IF(SUM([bom.ext])>0,SUMPRODUCT(LARGE([bom.ext],{1,2,3,4,5}))/SUM([bom.ext]),0)', 'pct', ''),
            ('Long lead lines', '=COUNTIF([bom.lead],">="&in_longLead)', 'int', ''), ('Longest lead time, weeks', '=MAX([bom.lead])', 'int', ''),
            ('Single source, long lead', '=COUNTIF([bom.flag],"Long lead, single source")', 'int', 'Biggest supply risk')])
    s.table('bom', [
        I('part', 'Part', 'text', 12), I('desc', 'Description', 'text', 26), I('qty', 'Qty', 'num', 7), I('cost', 'Unit cost', 'money2', 9), I('lead', 'Lead, weeks', 'int', 8), I('moq', 'MOQ', 'int', 9),
        I('supplier', 'Supplier', 'text', 16), I('single', 'Single source', 'text', 9, opts=['No', 'Yes']), I('make', 'Make or buy', 'text', 9, opts=['Buy', 'Make']),
        F('ext', 'Extended cost', '={qty}*{cost}', 'money2', 10, total='sum'),
        F('share', 'Share', '=IF(SUM([bom.ext])>0,{ext}/SUM([bom.ext]),0)', 'pct', 8),
        S('flag', 'Flag', '=IF(AND({lead}>=in_longLead,{single}="Yes"),"Long lead, single source",IF({lead}>=in_longLead,"Long lead",IF({single}="Yes","Single source","")))', 22),
    ], title='Bill of materials', help='Quantity is per finished device; use decimals for shared items such as a carton for six devices.')
    s.chart('bar', 'Extended cost by line', 'bom', 'part', ['ext'], 'Cost per device', horizontal=True)

    s = b.sheet('Where-used', 'Where-used', 'Parts shared by several products.', 'Products using each part and the yearly demand across them.')
    s.settings([('pA', 'Product A', f['pA'], 'text'), ('vA', 'Units a year, A', f['vA'], 'int'), ('pB', 'Product B', f['pB'], 'text'), ('vB', 'Units a year, B', f['vB'], 'int'),
                ('pC', 'Product C', f['pC'], 'text'), ('vC', 'Units a year, C', f['vC'], 'int')], title='Products and yearly volume')
    s.kpis([('Parts shared by two or more products', '=COUNTIF([wu.status],"Shared")', 'int', 'A change needs every product to sign off'),
            ('Highest yearly demand', '=INDEX([wu.part],MATCH(MAX([wu.dem]),[wu.dem],0))', 'text', '')])
    s.table('wu', [I('part', 'Part', 'text', 12), I('desc', 'Description', 'text', 26), I('qA', 'Qty in A', 'num', 9), I('qB', 'Qty in B', 'num', 9), I('qC', 'Qty in C', 'num', 9),
                   F('np', 'Products', '=(N({qA})>0)+(N({qB})>0)+(N({qC})>0)', 'int', 9),
                   F('dem', 'Demand a year', '=N({qA})*in_vA+N({qB})*in_vB+N({qC})*in_vC', 'int', 12),
                   S('status', 'Status', '=IF({np}=0,"",IF({np}>1,"Shared","One product"))')], title='Parts across products')

    s = b.sheet('Changes', 'Engineering change log', 'Every change with its revision, date and plan for old stock.', 'Open changes, scrap value and changes past their date.')
    s.kpis([('Open changes', '=COUNTIF([eco.state],"<>Implemented")', 'int', ''), ('Old stock to scrap, value', '=SUM([eco.scrap])', 'money', ''), ('Past effective date', '=COUNTIF([eco.status],"Overdue")', 'int', '')])
    s.table('eco', [I('id', 'Change', 'text', 9), I('part', 'Part', 'text', 12), I('what', 'What changes', 'text', 36), I('revTo', 'New revision', 'text', 9), I('eff', 'Effective', 'days', 13),
                    I('old', 'Old stock, units', 'int', 10), I('oldCost', 'Old unit cost', 'money2', 9), I('plan', 'Old stock', 'text', 9, opts=['Use up', 'Rework', 'Scrap']),
                    I('state', 'State', 'text', 12, opts=['Draft', 'In review', 'Released', 'Implemented']),
                    F('scrap', 'Scrap value', '=IF({plan}="Scrap",{old}*{oldCost},0)', 'money', 10, total='sum'),
                    S('status', 'Status', '=IF({id}="","",IF({state}="Implemented","Implemented",IF(AND({eff}<>"",{eff}<0),"Overdue","Open")))')], title='Changes')
    return b


def procurement():
    b = Book(FOLDER, 'procurement'); f = b.d['f']
    s = b.sheet('Purchase orders', 'Purchase order tracker', 'Orders against confirmed dates.', 'Delay, open value and status per order line.')
    s.kpis([('Open orders', '=COUNTIF([pos.open],">0")', 'int', ''), ('Open value', '=SUM([pos.value])', 'money', ''), ('Late orders', '=COUNTIF([pos.status],"Late")', 'int', 'More than 7 days behind'),
            ('On time, received', '=IFERROR(COUNTIFS([pos.status],"Received",[pos.delay],"<=2")/COUNTIF([pos.status],"Received"),0)', 'pct', 'Within 2 days of confirmed')])
    s.table('pos', [I('po', 'PO', 'text', 9), I('part', 'Part', 'text', 12), I('supplier', 'Supplier', 'text', 16), I('qty', 'Ordered', 'int', 9), I('price', 'Unit price', 'money2', 9),
                    I('conf', 'Confirmed', 'days', 13), I('exp', 'Expected', 'days', 13), I('recv', 'Received', 'int', 9),
                    F('open', 'Open', '=MAX(0,{qty}-{recv})', 'int', 8), F('delay', 'Delay, days', '=IF(OR({conf}="",{exp}=""),"",{exp}-{conf})', 'sint', 9),
                    F('value', 'Open value', '={open}*{price}', 'money', 10, total='sum'),
                    S('status', 'Status', '=IF({qty}="","",IF({open}=0,"Received",IF(N({recv})>0,"Partial",IF(N({delay})>7,"Late",IF(N({delay})>0,"At risk","On time")))))')], title='Orders')

    s = b.sheet('Shortages', 'Shortage board', 'Shortages ranked by devices blocked.', 'Devices blocked, days to recovery and output lost.')
    s.settings([('margin', 'Margin per device', f['margin'], 'money', 'Selling price less variable cost')])
    s.kpis([('Devices blocked', '=MAX([short.dev])', 'int', 'Largest single shortage'), ('Lost output', '=MAX([short.lost])', 'money', 'Largest shortage, at the margin per device'),
            ('No recovery date', '=COUNTIF([short.status],"No date")', 'int', '')])
    s.table('short', [I('part', 'Part', 'text', 12), I('qty', 'Qty per device', 'num', 9), I('short', 'Units short', 'int', 9), I('eta', 'Recovery', 'days', 13), I('action', 'Action', 'text', 40), I('owner', 'Owner', 'text', 16),
                      F('dev', 'Devices blocked', '=IF(N({qty})>0,CEILING({short}/{qty},1),0)', 'int', 10),
                      F('wait', 'Days to recover', '=IF({eta}="","",MAX(0,{eta}))', 'int', 9),
                      F('lost', 'Lost output', '={dev}*in_margin', 'money', 10),
                      S('status', 'Status', '=IF({part}="","",IF({eta}="","No date",IF({wait}<=7,"Arriving","Short")))')], title='Shortages')

    s = b.sheet('Suppliers', 'Supplier scorecard', 'Delivery, quality, lead time and responsiveness.', 'Weighted score and rating per supplier.')
    s.settings([('wOt', 'Weight: on-time delivery', f['wOt'], 'pct'), ('wQ', 'Weight: quality', f['wQ'], 'pct'), ('wLt', 'Weight: lead time', f['wLt'], 'pct'), ('wR', 'Weight: responsiveness', f['wR'], 'pct')])
    s.kpis([('Strong', '=COUNTIF([sup.status],"Strong")', 'int', '80 or more'), ('Fair', '=COUNTIF([sup.status],"Fair")', 'int', '60 to 80'), ('Weak', '=COUNTIF([sup.status],"Weak")', 'int', 'Below 60')])
    s.table('sup', [I('name', 'Supplier', 'text', 16), I('parts', 'Parts', 'text', 22), I('spend', 'Spend a year', 'money', 11), I('ot', 'On time', 'pct', 8), I('ppm', 'Defects, ppm', 'int', 9),
                    I('lt', 'Lead, weeks', 'int', 8), I('resp', 'Response 1 to 5', 'int', 9),
                    F('score', 'Score', '=(MIN(100,{ot}*100)*in_wOt+MAX(0,MIN(100,100-{ppm}/50))*in_wQ+MAX(0,MIN(100,100-({lt}-2)/24*100))*in_wLt+MAX(0,MIN(100,({resp}-1)*25))*in_wR)/(in_wOt+in_wQ+in_wLt+in_wR)', 'int', 8),
                    S('status', 'Rating', '=IF({name}="","",IF({score}>=80,"Strong",IF({score}>=60,"Fair","Weak")))', 10)], title='Suppliers')
    s.chart('bar', 'Supplier score', 'sup', 'name', ['score'], 'Score')

    s = b.sheet('Supply risk', 'Supply risk view', 'Single-source, long-lead and end-of-life parts.', 'Risk score per part and the value of last-time buys.')
    s.kpis([('High risk parts', '=COUNTIF([risk.status],"High")', 'int', 'Score 12 or more'), ('End-of-life notices', '=COUNTIF([risk.eol],">=4")', 'int', ''),
            ('Last-time buy value', '=SUMPRODUCT(([risk.eol]>=4)*[risk.ltbQty]*[risk.ltbCost])', 'money', '')])
    s.table('risk', [I('part', 'Part', 'text', 12), I('src', 'Single source 1 to 5', 'int', 10), I('lead', 'Lead time 1 to 5', 'int', 9), I('eol', 'End of life 1 to 5', 'int', 9), I('supp', 'Supplier 1 to 5', 'int', 9),
                     I('ltbQty', 'Last-time buy units', 'int', 10), I('ltbCost', 'Unit cost', 'money2', 9), I('mit', 'Mitigation', 'text', 44),
                     F('score', 'Score', '=SUM({src}:{supp})', 'int', 7),
                     S('status', 'Risk', '=IF({part}="","",IF({score}>=12,"High",IF({score}>=8,"Medium","Low")))', 9)], title='Parts')
    return b


def production():
    b = Book(FOLDER, 'production'); f = b.d['f']
    s = b.sheet('Work orders', 'Work order tracker', 'Work orders against plan.', 'Attainment, units left and status per work order.')
    s.kpis([('Planned', '=SUM([wo.qty])', 'int', ''), ('Built', '=SUM([wo.built])', 'int', ''), ('Attainment', '=IF(SUM([wo.toDate])>0,SUM([wo.built])/SUM([wo.toDate]),0)', 'pct', 'Built over due to date'),
            ('Behind plan', '=COUNTIF([wo.status],"Behind plan")', 'int', '')])
    s.table('wo', [I('wo', 'Work order', 'text', 10), I('product', 'Product', 'text', 18), I('start', 'Start', 'days', 12), I('due', 'Due', 'days', 12), I('qty', 'Quantity', 'int', 9, total='sum'),
                   I('toDate', 'Due to date', 'int', 9), I('built', 'Built', 'int', 9, total='sum'), I('wip', 'In process', 'int', 9, total='sum'),
                   F('att', 'Attainment', '=IF(N({toDate})>0,{built}/{toDate},"")', 'pct', 9), F('left', 'Left', '=MAX(0,{qty}-{built})', 'int', 8),
                   S('status', 'Status', '=IF({wo}="","",IF({left}=0,"Complete",IF(AND({att}<>"",{att}<0.95),"Behind plan",IF(N({toDate})>0,"On track","Open"))))')], title='Work orders')

    s = b.sheet('Yield', 'Yield by station', 'First-pass and rolled throughput yield.', 'First-pass yield per station and the yield rolled to that point.')
    s.settings([('fpyTarget', 'First-pass yield target', f['fpyTarget'], 'pct')])
    s.kpis([('Rolled throughput yield', '=PRODUCT([st.fpy])', 'pct', 'Devices passing every station first time'),
            ('Lowest station', '=INDEX([st._label],MATCH(MIN([st.fpy]),[st.fpy],0))', 'text', ''), ('Units failing first time', '=SUM([st.tested])-SUM([st.pass])', 'int', '')])
    s.table('st', [LBL('Station', 24), I('tested', 'Units tested', 'int', 10), I('pass', 'Passed first time', 'int', 10), I('top', 'Top failure', 'text', 30),
                   F('fpy', 'First-pass yield', '=IF(N({tested})>0,{pass}/{tested},1)', 'pct', 10),
                   F('rty', 'Rolled to here', '=PRODUCT({fpy@top}:{fpy})', 'pct', 10),
                   F('fail', 'Failures', '={tested}-{pass}', 'int', 9),
                   S('status', 'Status', '=IF({tested}="","",IF({fpy}>=in_fpyTarget,"Above target","Below target"))')], title='Stations')
    s.chart('bar', 'Failures by station', 'st', '_label', ['fail'], 'Units')

    s = b.sheet('OEE', 'OEE at the bottleneck', 'Availability, performance and quality per shift.', 'OEE per shift and in total.')
    s.settings([('oStation', 'Bottleneck station', f['oStation'], 'text'), ('ideal', 'Ideal cycle time, seconds', f['ideal'], 'dec1')])
    s.kpis([('Availability', '=IF(SUM([shifts.planned])>0,(SUM([shifts.planned])-SUM([shifts.down]))/SUM([shifts.planned]),0)', 'pct', 'Run time over planned', 'a'),
            ('Performance', '=IF(SUM([shifts.planned])-SUM([shifts.down])>0,in_ideal/60*SUM([shifts.made])/(SUM([shifts.planned])-SUM([shifts.down])),0)', 'pct', 'Ideal over actual speed', 'p'),
            ('Quality', '=IF(SUM([shifts.made])>0,SUM([shifts.good])/SUM([shifts.made]),0)', 'pct', 'Good over made', 'q'),
            ('OEE', '=k_a*k_p*k_q', 'pct', 'Around 85% is world class, 60% typical')])
    s.table('shifts', [I('date', 'Day', 'days', 12), I('shift', 'Shift', 'text', 8, opts=['Early', 'Late', 'Night']), I('planned', 'Planned minutes', 'int', 9), I('down', 'Downtime minutes', 'int', 9),
                       I('made', 'Units made', 'int', 9), I('good', 'Good units', 'int', 9), I('cause', 'Main stop', 'text', 24),
                       F('a', 'Availability', '=IF(N({planned})>0,({planned}-{down})/{planned},"")', 'pct', 9),
                       F('p', 'Performance', '=IF({planned}-{down}>0,in_ideal/60*{made}/({planned}-{down}),"")', 'pct', 10),
                       F('q', 'Quality', '=IF(N({made})>0,{good}/{made},"")', 'pct', 8),
                       F('oee', 'OEE', '=IF(OR({a}="",{p}="",{q}=""),"",{a}*{p}*{q})', 'pct', 8),
                       S('status', 'Status', '=IF({oee}="","",IF({oee}>=0.85,"World class",IF({oee}>=0.6,"Typical","Low")))', 11)], title='Shifts')

    s = b.sheet('Scrap and rework', 'Scrap and rework log', 'Scrap and rework by part and cause.', 'Cost of scrap and rework and the cause behind most of it.')
    causes = ['Supplier defect', 'Handling damage', 'Process fault', 'Test false fail', 'Design issue', 'Other']
    s.settings([('rate', 'Labor cost per hour', f['rate'], 'money')])
    s.kpis([('Scrap cost', '=SUM([scrap.s])', 'money', ''), ('Rework cost', '=SUM([scrap.rw])', 'money', ''),
            ('Top cause', '=INDEX([causes._label],MATCH(MAX([causes.cost]),[causes.cost],0))', 'text', '')])
    s.table('scrap', [I('date', 'Week', 'weeks', 12), I('part', 'Part or device', 'text', 13), I('cause', 'Cause', 'text', 16, opts=causes), I('scrapN', 'Scrapped', 'int', 9),
                      I('unit', 'Unit cost', 'money2', 9), I('rwN', 'Reworked', 'int', 9), I('rwMin', 'Rework minutes', 'int', 9), I('note', 'Notes', 'text', 30),
                      F('s', 'Scrap cost', '={scrapN}*{unit}', 'money', 10, total='sum'), F('rw', 'Rework cost', '={rwN}*{rwMin}/60*in_rate', 'money', 10, total='sum')], title='Log')
    s.table('causes', [LBL('Cause', 18), F('cost', 'Scrap and rework cost', ['=SUMIF([scrap.cause],"%s",[scrap.s])+SUMIF([scrap.cause],"%s",[scrap.rw])' % (c, c) for c in causes], 'money', 14)], fixed=causes, title='By cause')
    s.chart('bar', 'Scrap and rework cost by cause', 'causes', '_label', ['cost'], 'Cost')
    return b


def quality():
    b = Book(FOLDER, 'quality'); f = b.d['f']
    s = b.sheet('Incoming', 'Incoming inspection', 'Incoming lots with AQL sampling.', 'Sample size, accept number and result per lot.')
    s.kpis([('Lots inspected', '=COUNT([lots.found])', 'int', ''), ('Accepted', '=IF(COUNT([lots.found])>0,COUNTIF([lots.status],"Accept")/COUNT([lots.found]),0)', 'pct', ''),
            ('Rejected', '=COUNTIF([lots.status],"Reject")', 'int', 'Return, sort or concession'), ('Defect rate in samples, ppm', '=IF(SUMIF([lots.found],">=0",[lots.smp])>0,SUM([lots.found])/SUMIF([lots.found],">=0",[lots.smp])*1000000,0)', 'int', '')])
    s.table('lots', [I('date', 'Day', 'days', 12), I('part', 'Part', 'text', 12), I('supplier', 'Supplier', 'text', 16), I('lot', 'Lot', 'text', 10), I('size', 'Lot size', 'int', 9),
                     I('aql', 'AQL', 'text', 7, opts=AQLS), I('found', 'Defects found', 'int', 9),
                     F('band', 'Lot band', '=MATCH({size},[plans.from],1)', 'int', 7),
                     F('smp', 'Sample', '=MIN({size},INDEX([plans.n065],{band})*({aql}="0.65")+INDEX([plans.n10],{band})*({aql}="1.0")+INDEX([plans.n15],{band})*({aql}="1.5")+INDEX([plans.n25],{band})*({aql}="2.5")+INDEX([plans.n40],{band})*({aql}="4.0"))', 'int', 8),
                     F('ac', 'Accept up to', '=INDEX([plans.a065],{band})*({aql}="0.65")+INDEX([plans.a10],{band})*({aql}="1.0")+INDEX([plans.a15],{band})*({aql}="1.5")+INDEX([plans.a25],{band})*({aql}="2.5")+INDEX([plans.a40],{band})*({aql}="4.0")', 'int', 8),
                     I('defect', 'Defect seen', 'text', 22),
                     S('status', 'Result', '=IF({found}="","",IF({found}<={ac},"Accept","Reject"))', 9)], title='Lots')
    rows = []
    for k, lo in enumerate(LOTS):
        r = {'from': lo}
        for a, key in zip(AQLS, ['065', '10', '15', '25', '40']):
            n, ac = aql_plan(k, a)
            r['n' + key] = n; r['a' + key] = ac
        rows.append(r)
    s.table('plans', [I('from', 'Lot size from', 'int', 10)] + sum([[I('n' + k, 'Sample, AQL ' + a, 'int', 9), I('a' + k, 'Accept, AQL ' + a, 'int', 9)] for a, k in zip(AQLS, ['065', '10', '15', '25', '40'])], []),
            rows=rows, title='Sampling plans', help='General inspection level II, single sampling, normal inspection. Where the standard points to another plan with an arrow, that plan is used.')

    s = b.sheet('Defect Pareto', 'Defect Pareto', 'Defects by part and cause, line and field.', 'Share, cumulative share and class per defect.')
    s.kpis([('Defects, last 30 days', '=SUM([def.tot])', 'int', ''), ('Class A', '=COUNTIF([def.cls],"A")', 'int', 'First 80% of defects'),
            ('Top defect', '=INDEX([def.part],MATCH(MAX([def.tot]),[def.tot],0))&" "&INDEX([def.defect],MATCH(MAX([def.tot]),[def.tot],0))', 'text', ''),
            ('Field share', '=IF(SUM([def.tot])>0,SUM([def.field])/SUM([def.tot]),0)', 'pct', 'Found by customers')])
    s.table('def', [I('part', 'Part', 'text', 12), I('defect', 'Defect', 'text', 26), I('cause', 'Cause', 'text', 11, opts=['Supplier', 'Process', 'Design', 'Handling', 'Unknown']),
                    I('line', 'Found on line', 'int', 9, total='sum'), I('field', 'Found in field', 'int', 9, total='sum'),
                    F('tot', 'Total', '={line}+{field}', 'int', 8, total='sum'),
                    F('share', 'Share', '=IF(SUM([def.tot])>0,{tot}/SUM([def.tot]),0)', 'pct', 8),
                    F('cum', 'Cumulative', '=IF(SUM([def.tot])>0,(SUMIF([def.tot],">"&{tot})+{tot})/SUM([def.tot]),0)', 'pct', 9),
                    S('cls', 'Class', '=IF(SUM([def.tot])=0,"",IF(SUMIF([def.tot],">"&{tot})/SUM([def.tot])<0.8,"A",IF(SUMIF([def.tot],">"&{tot})/SUM([def.tot])<0.95,"B","C")))', 7)], title='Defects by part and cause')
    s.chart('bar', 'Defects by part', 'def', 'part', ['line', 'field'], 'Defects')

    s = b.sheet('NCR and 8D', 'NCR and 8D tracker', 'Nonconformances to closure.', 'Days open and status per report.')
    s.kpis([('Open', '=COUNTIF([ncr.step],"<>Closed")', 'int', ''), ('Over 30 days open', '=COUNTIF([ncr.status],"Overdue")', 'int', 'Escalate'),
            ('Average days to close', '=IFERROR(AVERAGEIF([ncr.status],"Closed",[ncr.days]),0)', 'dec1', '')])
    s.table('ncr', [I('id', 'NCR', 'text', 9), I('opened', 'Opened', 'days', 12), I('part', 'Part', 'text', 12), I('what', 'Problem', 'text', 36), I('owner', 'Owner', 'text', 16),
                    I('step', '8D step', 'text', 14, opts=['D3 containment', 'D4 root cause', 'D5 to D6 fix', 'D7 prevent', 'Closed']), I('closed', 'Closed on', 'days', 12),
                    F('days', 'Days open', '=IF({opened}="","",IF({closed}="",-{opened},{closed}-{opened}))', 'int', 8),
                    S('status', 'Status', '=IF({id}="","",IF({step}="Closed","Closed",IF({days}>30,"Overdue","Open")))')], title='Reports')

    s = b.sheet('Traceability', 'Lot traceability', 'Which serial numbers each part lot went into.', 'Devices per lot and serial range, with a lot search.')
    s.settings([('qLot', 'Find part lot', f['qLot'], 'text', 'Rows with this lot are marked Found')])
    s.kpis([('Devices with this lot', '=SUMIF([tr.lot],in_qLot,[tr.dev])', 'int', ''), ('Lots traced', '=SUMPRODUCT(1/COUNTIF([tr.lot],[tr.lot]))', 'int', '')])
    s.table('tr', [I('part', 'Part', 'text', 12), I('lot', 'Part lot', 'text', 11), I('supplier', 'Supplier', 'text', 16), I('wo', 'Work order', 'text', 10),
                   I('from', 'First serial', 'text', 11), I('to', 'Last serial', 'text', 11), I('date', 'Built', 'days', 12),
                   F('dev', 'Devices', '=IFERROR(VALUE({to})-VALUE({from})+1,"")', 'int', 9),
                   S('hit', 'Match', '=IF(AND(in_qLot<>"",{lot}=in_qLot),"Found","")', 9)], title='Lots to serials')
    return b


def inventory():
    b = Book(FOLDER, 'inventory'); f = b.d['f']
    s = b.sheet('Stock and cover', 'Stock and cover', 'Safety stock, reorder point and days of cover per part.', 'Use per day, safety stock, reorder point, cover, value and status.')
    s.settings([('perDay', 'Devices built per day', f['perDay'], 'int'), ('cv', 'Daily use variation', f['cv'], 'pct', 'Standard deviation over average'),
                ('svc', 'Service level', f['svc'], 'pct'), ('excessDays', 'Excess above, days of cover', f['excessDays'], 'int')], title='Policy')
    s.kpis([('Safety factor z', '=NORMSINV(MIN(0.9999,MAX(0.5,in_svc)))', 'dec2', 'From the service level', 'z'),
            ('Inventory value', '=SUM([stock.value])', 'money', ''), ('Days of cover', '=IF(SUM([stock.value])>0,SUMPRODUCT([stock.cover],[stock.value])/SUM([stock.value]),0)', 'dec1', 'Value weighted'),
            ('Below safety stock', '=COUNTIF([stock.status],"Below safety")', 'int', 'Expedite'), ('At reorder point', '=COUNTIF([stock.status],"Reorder")', 'int', 'Order now')])
    s.table('stock', [I('part', 'Part', 'text', 12), I('qty', 'Qty per device', 'num', 8), I('lead', 'Lead time, days', 'int', 9), I('onhand', 'On hand', 'int', 10), I('cost', 'Unit cost', 'money2', 9),
                      F('use', 'Use per day', '={qty}*in_perDay', 'int', 9),
                      F('ss', 'Safety stock', '=k_z*{use}*in_cv*SQRT({lead})', 'int', 9),
                      F('rop', 'Reorder point', '={use}*{lead}+{ss}', 'int', 9),
                      F('cover', 'Days of cover', '=IF({use}>0,{onhand}/{use},0)', 'dec1', 9),
                      F('value', 'Value', '={onhand}*{cost}', 'money', 10, total='sum'),
                      S('status', 'Status', '=IF({part}="","",IF({onhand}<{ss},"Below safety",IF({onhand}<={rop},"Reorder",IF({cover}>in_excessDays,"Excess","Healthy"))))')], title='Parts')
    s.chart('bar', 'Days of cover by part', 'stock', 'part', ['cover'], 'Days', horizontal=True)

    s = b.sheet('Cycle counts', 'Cycle count accuracy', 'Count differences and inventory accuracy.', 'Difference, value and status per count.')
    s.settings([('tol', 'Count tolerance', f['tol'], 'pct', 'Use 0% for high-value parts'), ('accTarget', 'Accuracy target', f['accTarget'], 'pct')])
    s.kpis([('Inventory accuracy', '=IF(COUNT([counts.counted])>0,COUNTIF([counts.status],"Accurate")/COUNT([counts.counted]),0)', 'pct', 'Counts within tolerance'),
            ('Counts', '=COUNT([counts.counted])', 'int', ''), ('Net adjustment', '=SUM([counts.val])', 'smoney', ''), ('Gross adjustment', '=SUMPRODUCT(ABS([counts.val]))', 'money', '')])
    s.table('counts', [I('date', 'Day', 'days', 12), I('part', 'Part', 'text', 12), I('loc', 'Location', 'text', 12), I('system', 'System qty', 'int', 10), I('counted', 'Counted', 'int', 10),
                       I('cost', 'Unit cost', 'money2', 9), I('reason', 'Reason found', 'text', 30),
                       F('diff', 'Difference', '={counted}-{system}', 'sint', 9), F('pct', 'Difference %', '=IF(N({system})>0,{diff}/{system},0)', 'spct', 9),
                       F('val', 'Value', '={diff}*{cost}', 'smoney', 9),
                       S('status', 'Status', '=IF({counted}="","",IF(ABS({pct})<=in_tol,"Accurate",IF(ABS({pct})<=2*in_tol,"Recount","Inaccurate")))')], title='Counts')

    s = b.sheet('Excess and obsolete', 'Excess and obsolete', 'Stock above the cover limit or with no use left.', 'Value at risk and the write-down provision.')
    s.settings([('provEx', 'Provision on excess', f['provEx'], 'pct'), ('provOb', 'Provision on obsolete', f['provOb'], 'pct')])
    s.kpis([('Excess value', '=SUMIF([eo.status],"Excess",[eo.risk])', 'money', ''), ('Obsolete value', '=SUMIF([eo.status],"Obsolete",[eo.risk])', 'money', ''),
            ('Provision', '=SUMIF([eo.status],"Excess",[eo.risk])*in_provEx+SUMIF([eo.status],"Obsolete",[eo.risk])*in_provOb', 'money', '')])
    s.table('eo', [I('part', 'Part', 'text', 13), I('desc', 'Description', 'text', 34), I('onhand', 'On hand', 'int', 9), I('cost', 'Unit cost', 'money2', 9), I('year', 'Use per year', 'int', 10),
                   I('action', 'Action', 'text', 18, opts=['Keep', 'Use in other product', 'Return to supplier', 'Sell', 'Scrap']),
                   F('cover', 'Days of cover', '=IF(N({year})>0,{onhand}/({year}/365),"")', 'int', 9),
                   F('ex', 'Excess units', '=IF(N({year})=0,{onhand},MAX(0,ROUND({onhand}-{year}/365*in_excessDays,0)))', 'int', 9),
                   F('risk', 'Value at risk', '={ex}*{cost}', 'money', 10, total='sum'),
                   S('status', 'Status', '=IF({part}="","",IF(N({year})=0,"Obsolete",IF({ex}>0,"Excess","Healthy")))')], title='Parts to review')
    return b


def product_cost():
    b = Book(FOLDER, 'product-cost'); f = b.d['f']
    s = b.sheet('Standard cost', 'Standard cost roll-up', 'Standard cost of a device from BOM, labor and overhead.', 'Cost per device by line, share and gross margin.')
    s.settings([('freight', 'Inbound freight and duty, % of material', f['freight'], 'pct'), ('scrapA', 'Scrap allowance, % of material', f['scrapA'], 'pct'),
                ('laborMin', 'Labor minutes per device', f['laborMin'], 'dec1'), ('laborRate', 'Labor cost per hour', f['laborRate'], 'money2'), ('oh', 'Line overhead, % of labor', f['oh'], 'pct'),
                ('pack', 'Packaging and outbound per device', f['pack'], 'money2'), ('warr', 'Warranty provision per device', f['warr'], 'money2'), ('price', 'Net selling price', f['price'], 'money2')], title='Rates')
    s.kpis([('Standard cost per device', '=SUM([roll.v])', 'money2', '', 'tot'), ('Gross margin', '=IF(in_price>0,1-k_tot/in_price,0)', 'pct', '')])
    s.table('roll', [LBL('Cost line', 30), F('v', 'Per device', ['=SUM([bom.ext])', '=[roll.v#0]*in_freight', '=[roll.v#0]*in_scrapA', '=in_laborMin/60*in_laborRate', '=[roll.v#3]*in_oh', '=in_pack', '=in_warr'], 'money2', 11, total='sum'),
                     F('share', 'Share', '=IF(SUM([roll.v])>0,{v}/SUM([roll.v]),0)', 'pct', 9), F('k', 'Per 1,000 devices', '={v}*1000', 'money', 12), I('note', 'Notes', 'text', 36)], title='Cost per device')
    s.table('bom', [I('part', 'Part', 'text', 12), I('desc', 'Description', 'text', 26), I('qty', 'Qty', 'num', 7), I('cost', 'Standard cost', 'money2', 9),
                    F('ext', 'Extended', '={qty}*{cost}', 'money2', 9, total='sum'), F('share', 'Share of material', '=IF(SUM([bom.ext])>0,{ext}/SUM([bom.ext]),0)', 'pct', 9)], title='BOM lines at standard cost')
    s.chart('bar', 'Cost per device by line', 'roll', '_label', ['v'], 'Cost per device')

    s = b.sheet('Price variance', 'Purchase price variance', 'Actual price against standard cost.', 'Price change, variance and status per receipt.')
    s.kpis([('Variance', '=SUM([ppv.v])', 'smoney', 'Positive is unfavorable'), ('Spend at actual', '=SUMPRODUCT([ppv.qty],[ppv.act])', 'money', ''),
            ('Variance rate', '=IF(SUMPRODUCT([ppv.qty],[ppv.std])>0,SUM([ppv.v])/SUMPRODUCT([ppv.qty],[ppv.std]),0)', 'spct', 'Of spend at standard')])
    s.table('ppv', [I('part', 'Part', 'text', 12), I('supplier', 'Supplier', 'text', 16), I('qty', 'Quantity', 'int', 9), I('std', 'Standard cost', 'money2', 9), I('act', 'Actual price', 'money2', 9),
                    I('why', 'Reason', 'text', 36), F('chg', 'Price change', '=IF(N({std})>0,{act}/{std}-1,"")', 'spct', 9), F('v', 'Variance', '=({act}-{std})*{qty}', 'smoney', 10, total='sum'),
                    S('status', 'Status', '=IF({part}="","",IF({v}>0,"Unfavorable",IF({v}<0,"Favorable","OK")))', 11)], title='Receipts')

    s = b.sheet('Cost-down', 'Cost-down tracker', 'Savings in production and in the pipeline against a target.', 'Saving per device and per year and payback per idea.')
    s.settings([('devYear', 'Devices a year', f['devYear'], 'int'), ('target', 'Saving target a year', f['target'], 'money')], title='Target')
    s.kpis([('Saving in production', '=SUMIF([cd.state],"Done",[cd.year])', 'money', '', 'done'), ('Saving in pipeline', '=SUMIFS([cd.year],[cd.state],"<>Done",[cd.state],"<>Dropped")', 'money', '', 'pipe'),
            ('Still to find', '=MAX(0,in_target-k_done-k_pipe)', 'money', '')])
    s.table('cd', [I('idea', 'Idea', 'text', 34), I('part', 'Part', 'text', 12), I('save', 'Saving per unit', 'money2', 9), I('qty', 'Qty per device', 'num', 8), I('oneoff', 'One-off cost', 'money', 10),
                   I('start', 'Start', 'days', 12), I('state', 'State', 'text', 10, opts=['Idea', 'Testing', 'Approved', 'Done', 'Dropped']),
                   F('dev', 'Per device', '={save}*{qty}', 'money2', 9), F('year', 'Saving a year', '={dev}*in_devYear', 'money', 10),
                   F('pb', 'Payback, months', '=IF({year}>0,{oneoff}/({year}/12),"")', 'dec1', 9)], title='Ideas')
    return b


def compliance():
    b = Book(FOLDER, 'compliance'); f = b.d['f']
    s = b.sheet('Part file', 'Part compliance file', 'RoHS, REACH and conflict minerals declarations per part.', 'Complete, partial or missing per part.')
    s.settings([('svhcDate', 'Last REACH candidate list update', f['svhcDate'], 'days')], title='REACH')
    decl = ['Missing', 'On file', 'Not needed']
    s.kpis([('Parts complete', '=COUNTIF([parts.status],"Complete")', 'int', ''), ('Missing a declaration', '=COUNTIF([parts.status],"Missing")', 'int', 'Ask the supplier'),
            ('REACH older than the candidate list', '=COUNTIFS([parts.reach],"On file",[parts.reachDate],"<"&in_svhcDate)', 'int', '')])
    s.table('parts', [I('part', 'Part', 'text', 12), I('supplier', 'Supplier', 'text', 16), I('rohs', 'RoHS', 'text', 10, opts=decl), I('reach', 'REACH', 'text', 10, opts=decl),
                      I('reachDate', 'REACH dated', 'days', 13), I('cmrt', 'Conflict minerals', 'text', 10, opts=decl), I('note', 'Notes', 'text', 26),
                      S('status', 'Status', '=IF({part}="","",IF(OR({rohs}="Missing",{reach}="Missing",{cmrt}="Missing"),"Missing",IF(AND({reach}="On file",{reachDate}<in_svhcDate),"Partial","Complete")))')], title='Parts')

    s = b.sheet('Certificates', 'Device certificates', 'Declarations, test reports and certificates per market.', 'Days left and status per document.')
    s.kpis([('Valid', '=COUNTIF([certs.status],"Valid")', 'int', ''), ('Expiring in 90 days', '=COUNTIF([certs.status],"Expiring soon")', 'int', ''),
            ('Missing or expired', '=COUNTIF([certs.status],"Missing")+COUNTIF([certs.status],"Expired")', 'int', 'Cannot ship to that market')])
    s.table('certs', [I('doc', 'Document', 'text', 40), I('market', 'Market', 'text', 10), I('ref', 'Reference', 'text', 16), I('lab', 'Lab or body', 'text', 14), I('rev', 'BOM revision', 'text', 9),
                      I('exp', 'Expires', 'days', 13),
                      S('status', 'Status', '=IF({doc}="","",IF(OR({ref}="",{ref}="None"),"Missing",IF({exp}="","Valid",IF({exp}<0,"Expired",IF({exp}<=90,"Expiring soon","Valid")))))', 14)],
            title='Certificates and reports', help='Write None in Reference while a document is missing.')

    s = b.sheet('EPR', 'EPR registrations', 'Electrical, battery and packaging registrations by country.', 'Fees a year, reports due and status.')
    s.kpis([('Registered', '=COUNTIF([epr.regNo],"?*")', 'int', 'Country and scheme'), ('Reports due in 30 days or overdue', '=COUNTIF([epr.status],"Due soon")+COUNTIF([epr.status],"Overdue")', 'int', ''),
            ('Fees a year', '=SUM([epr.fee])', 'money', '')])
    s.table('epr', [I('country', 'Country', 'text', 14), I('scheme', 'Scheme', 'text', 18, opts=['Electrical equipment', 'Batteries', 'Packaging']), I('regNo', 'Registration number', 'text', 18),
                    I('kg', 'Kg a year', 'int', 9), I('feeKg', 'Fee per kg', 'money2', 9, src='fee'), I('report', 'Next report due', 'days', 13),
                    F('fee', 'Fee a year', '={kg}*{feeKg}', 'money', 10, total='sum'),
                    S('status', 'Status', '=IF({country}="","",IF({regNo}="","Not registered",IF({report}<0,"Overdue",IF({report}<=30,"Due soon","Registered"))))', 14)], title='Registrations')
    return b


def governance():
    b = Book(FOLDER, 'governance'); f = b.d['f']
    s = b.sheet('KPI dictionary', 'KPI dictionary', 'One formula and one owner per plant KPI.', 'Latest value against target.')
    s.kpis([('KPIs', '=COUNTA([kpis.name])', 'int', ''), ('On target', '=COUNTIF([kpis.status],"On target")', 'int', ''), ('Off target', '=COUNTIF([kpis.status],"Off target")', 'int', '')])
    s.table('kpis', [I('name', 'KPI', 'text', 28), I('formula', 'Formula', 'text', 40), I('owner', 'Owner', 'text', 18), I('freq', 'Frequency', 'text', 10, opts=['Shift', 'Daily', 'Weekly', 'Monthly']),
                     I('dir', 'Better is', 'text', 9, opts=['Higher', 'Lower']), I('target', 'Target', 'num', 8), I('value', 'Latest', 'num', 8),
                     S('status', 'Status', '=IF(OR({target}="",{value}=""),"",IF(IF({dir}="Lower",{value}<={target},{value}>={target}),"On target","Off target"))')], title='KPIs')

    s = b.sheet('Weekly review', 'Weekly production review', 'The plant week in one table.', 'Plan attainment and status by week.')
    s.settings([('tAtt', 'Plan attainment target', f['tAtt'], 'pct'), ('tRty', 'Rolled yield target', f['tRty'], 'pct')])
    s.kpis([('Plan attainment, last week', '=INDEX([weeks.att],MATCH(MAX([weeks.week]),[weeks.week],0))', 'pct', ''),
            ('Good devices built, last week', '=INDEX([weeks.built],MATCH(MAX([weeks.week]),[weeks.week],0))', 'int', ''),
            ('Devices blocked, last week', '=INDEX([weeks.blocked],MATCH(MAX([weeks.week]),[weeks.week],0))', 'int', ''),
            ('Status, last week', '=INDEX([weeks.status],MATCH(MAX([weeks.week]),[weeks.week],0))', 'status', '')])
    s.table('weeks', [I('week', 'Week', 'weeks', 13), I('plan', 'Planned build', 'int', 9), I('built', 'Good built', 'int', 9), I('rty', 'Rolled yield', 'pct', 9), I('oee', 'OEE', 'pct', 8),
                      I('ctb', 'Clear to build', 'int', 9), I('blocked', 'Devices blocked', 'int', 9), I('ncr', 'Open NCRs', 'int', 8), I('note', 'Main issue', 'text', 34),
                      F('att', 'Attainment', '=IF(N({plan})>0,{built}/{plan},"")', 'pct', 9),
                      S('status', 'Status', '=IF({att}="","",IF(OR({att}<in_tAtt,AND({rty}<>"",{rty}<in_tRty)),"Off target","On target"))')], title='Weeks')
    s.chart('line', 'Plan attainment by week', 'weeks', 'week', ['att'], 'Attainment')

    s = b.sheet('Decisions', 'Decision log', 'S&OP and weekly review decisions.', 'Open decisions and reviews due.')
    s.kpis([('Decisions', '=COUNTA([dec.what])', 'int', ''), ('Waiting for a decision', '=COUNTIF([dec.state],"Open")', 'int', ''), ('Reviews due', '=COUNTIF([dec.status],"Review due")', 'int', '')])
    s.table('dec', [I('date', 'Date', 'days', 12), I('area', 'Area', 'text', 11, opts=['Planning', 'Supply', 'Production', 'Quality', 'Inventory', 'Cost', 'Compliance']), I('what', 'Decision', 'text', 54),
                    I('by', 'Decided by', 'text', 16), I('state', 'State', 'text', 10, opts=['Open', 'Decided', 'Reversed']), I('review', 'Review on', 'days', 12),
                    S('status', 'Status', '=IF({what}="","",IF({state}="Open","Open",IF({state}="Reversed","Closed",IF(AND({review}<>"",{review}<0),"Review due","Decided"))))')], title='Decisions')
    return b


ALL = ['bom_master', 'procurement', 'production', 'quality', 'inventory', 'product_cost', 'compliance', 'governance']
