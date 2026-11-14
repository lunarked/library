"""Excel versions of the network planning workbooks."""
from xlkit import Book, I, F, S, LBL

FOLDER = 'planning'
YRS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']
TYPES = ['Fulfillment center', 'Sort center', 'Cross dock', 'Delivery depot', 'Store or pickup hub']


def demand_forecast():
    b = Book(FOLDER, 'demand-forecast'); f = b.d['f']
    s = b.sheet('Regions', 'Volume forecast by region', 'Five years of volume with organic growth and new programs.', 'Volume by region and year in millions of units.')
    s.settings([('y0', 'Base year', int(f['y0']), 'year', 'Last full year of actuals')])
    yearcols = []
    for k in range(1, 6):
        yearcols.append(F('y%d' % k, 'Year %d' % k, '={base}*(1+{g})^%d+IF(AND({st}>0,%d>={st}),{prog}*MIN(1,(%d-{st}+1)/MAX(1,N({ramp}))),0)' % (k, k, k), 'dec1', 9, total='sum'))
    s.table('regions', [
        I('region', 'Region', 'text', 16), I('base', 'Base, millions', 'dec1', 10, total='sum'), I('g', 'Organic growth', 'pct', 9), I('prog', 'Program, millions', 'dec1', 10),
        I('start', 'Program start', 'text', 11, opts=['None'] + YRS), I('ramp', 'Ramp years', 'int', 8),
        F('st', 'Start year number', '=IF(OR({start}="",{start}="None"),0,VALUE(RIGHT({start},1)))', 'int', 9)] + yearcols + [
        F('cagr', 'Growth per year', '=IF(N({base})>0,({y5}/{base})^(1/5)-1,"")', 'pct', 9, total='=IF(SUM([.base])>0,(SUM([.y5])/SUM([.base]))^(1/5)-1,"")'),
        F('share', 'Share, year 5', '=IF(SUM([regions.y5])>0,{y5}/SUM([regions.y5]),"")', 'pct', 9),
    ], title='Regions', help='Volume in millions of units a year. A program adds its full-run volume from its start year, built up over its ramp years.')
    s.chart('bar', 'Year 5 volume by region', 'regions', 'region', ['base', 'y5'], 'Millions of units')

    s = b.sheet('Scenarios', 'Scenarios and peak', 'Base, high and low cases and the peak week to plan capacity for.', 'Low, base and high per year, peak week and change against the last plan.')
    s.settings([('high', 'High case above base', f['high'], 'pct'), ('low', 'Low case below base', f['low'], 'pct'), ('peak', 'Peak week over average week', f['peak'], 'dec2', 'From last year\'s busiest week')])
    s.kpis([('Final year, base, millions', '=[years.base#4]', 'dec1', ''), ('Peak week to plan for, millions', '=[years.peakH#4]', 'dec2', 'High case, final year'),
            ('Change to last plan, final year', '=[years.chg#4]', 'spct', '')])
    s.table('years', [
        LBL('Year', 9), F('cal', 'Calendar year', '=in_y0+{n}', 'year', 9),
        F('base', 'Base', ['=SUM([regions.y%d])' % k for k in range(1, 6)], 'dec1', 10),
        F('lo', 'Low', '={base}*(1-in_low)', 'dec1', 10), F('hi', 'High', '={base}*(1+in_high)', 'dec1', 10),
        F('wk', 'Average week, base', '={base}/52', 'dec2', 11), F('peakB', 'Peak week, base', '={wk}*in_peak', 'dec2', 11), F('peakH', 'Peak week, high', '={hi}/52*in_peak', 'dec2', 11),
        I('last', 'Last plan, base', 'dec1', 11), F('chg', 'Change', '=IF(N({last})>0,{base}/{last}-1,"")', 'spct', 9),
    ], title='Plan years', help='Volume in millions of units. Enter the last plan for each year to see the change.')
    s.chart('line', 'Low, base and high case', 'years', 'cal', ['base', 'lo', 'hi'], 'Millions of units')

    s = b.sheet('Bridge', 'Plan-to-plan bridge', 'Explain the change from the last plan, driver by driver.', 'Running total from the last plan to this plan and anything not explained.')
    s.settings([('bYear', 'Plan year to bridge', f['bYear'], 'text', '', YRS), ('bLast', 'Last plan volume, millions', f['bLast'], 'dec1')])
    s.kpis([('This plan, millions', '=INDEX([years.base],VALUE(RIGHT(in_bYear,1)))', 'dec2', '', 'this'),
            ('Change', '=k_this-in_bLast', 'dec2', '', 'chg'),
            ('Not explained', '=k_chg-SUM([drivers.delta])', 'dec2', 'Find a driver for this before the plan goes out', 'left'),
            ('Bridge', '=IF(ABS(k_left)<=0.01*in_bLast,"Explained","Not explained")', 'status', 'Within 1% of the last plan')])
    s.table('drivers', [LBL('Driver', 28), I('delta', 'Change, millions', 'dec2', 12), I('why', 'Reason', 'text', 60),
                        F('run', 'Running total', '=in_bLast+SUM({delta@top}:{delta})', 'dec2', 12),
                        F('share', 'Share of change', '=IF(k_chg<>0,{delta}/k_chg,"")', 'spct', 11)], title='Drivers')
    s.chart('bar', 'Change by driver', 'drivers', '_label', ['delta'], 'Millions of units')
    return b


def network_capacity():
    b = Book(FOLDER, 'network-capacity'); f = b.d['f']
    s = b.sheet('Nodes', 'Node capacity', 'Usable and peak capacity of every building.', 'Design, usable and peak capacity per node, and inbound flow against it.')
    s.kpis([('Nodes', '=COUNTA([nodes.node])', 'int', ''), ('Usable capacity, thousands a week', '=SUM([nodes.usable])', 'int', ''),
            ('Peak capacity, thousands a week', '=SUM([nodes.peak])', 'int', ''), ('Peak uplift', '=IF(SUM([nodes.usable])>0,SUM([nodes.peak])/SUM([nodes.usable])-1,0)', 'pct', '')])
    s.table('nodes', [
        I('node', 'Node', 'text', 10), I('type', 'Type', 'text', 18, opts=TYPES), I('region', 'Region', 'text', 14), I('uph', 'Units per hour', 'int', 10),
        I('hours', 'Hours per day', 'dec1', 8), I('days', 'Days per week', 'dec1', 8), I('util', 'Utilization ceiling', 'pct', 10), I('uplift', 'Peak uplift', 'pct', 9),
        F('design', 'Design', '={uph}*{hours}*{days}/1000', 'int', 9), F('usable', 'Usable', '={design}*{util}', 'int', 9, total='sum'),
        F('peak', 'Peak', '={usable}*(1+{uplift})', 'int', 9, total='sum'),
        F('inb', 'Inbound flow', '=IF(COUNTIF([lanes.to],{node})=0,"",SUMIF([lanes.to],{node},[lanes.vol]))', 'int', 10),
        S('status', 'Status', '=IF({inb}="","",IF({inb}>{peak},"Short",IF({inb}>0.9*{peak},"Tight","Room")))', 9),
    ], title='Nodes', help='Capacity in thousands of units a week. Units per hour is the rate the building sustains.')

    s = b.sheet('Gap', 'Gap by region and year', 'The year each region runs out of room in one layer of the network.', 'Peak-week demand against peak capacity of the chosen node type.')
    s.settings([('layer', 'Node type to check', f['layer'], 'text', 'Run once per layer', TYPES), ('y0', 'Base year', int(f['y0']), 'year', 'Year 1 is the year after')])
    s.kpis([('Capacity of this layer now, thousands a week', '=SUM([gap.cap])', 'int', ''), ('First year short', '=IF(COUNT([gap.first])=0,"None",MIN([gap.first]))', 'year', ''),
            ('Regions short by year 5', '=COUNTIF([gap.status],"Short")', 'int', ''), ('Extra capacity needed by year 5', '=-SUMIF([gap.gap5],"<0")', 'int', 'Thousands a week')])
    ucols = []
    for k in range(1, 6):
        ucols.append(F('u%d' % k, 'Use, year %d' % k, '=IF({cap}+IF(AND({ai}>0,%d>={ai}),{add},0)>0,{d%d}/({cap}+IF(AND({ai}>0,%d>={ai}),{add},0)),"")' % (k, k, k), 'pct', 9))
    s.table('gap', [
        I('region', 'Region', 'text', 14)] + [I('d%d' % k, 'Demand, year %d' % k, 'int', 9) for k in range(1, 6)] + [
        I('add', 'Added', 'int', 8), I('addY', 'Lands in', 'text', 9, opts=['None'] + YRS),
        F('ai', 'Lands in year', '=IF(OR({addY}="",{addY}="None"),0,VALUE(RIGHT({addY},1)))', 'int', 8),
        F('cap', 'Capacity now', '=SUMIFS([nodes.peak],[nodes.region],{region},[nodes.type],in_layer)', 'int', 9)] + ucols + [
        F('first', 'Short from', '=IFERROR(in_y0+MATCH(TRUE,INDEX({u1}:{u5}>1,0),0),"Not in plan")', 'year', 10),
        F('gap5', 'Gap, year 5', '={cap}+IF({ai}>0,{add},0)-{d5}', 'sint', 9),
        S('status', 'Status', '=IF({u5}="","",IF({u5}>1,"Short",IF({u5}>0.9,"Tight","Room")))', 9),
    ], title='Peak-week demand by region', help='Thousands of units in the peak week, from the demand forecast. Added is approved capacity for this layer and the year it lands.')
    s.chart('bar', 'Year 5 use of capacity by region', 'gap', 'region', ['u5'], 'Use')

    s = b.sheet('Flows', 'Flow assignment', 'Planned lanes against the capacity of the node they land on.', 'Inbound per destination against its peak capacity.')
    s.kpis([('Lanes', '=COUNTA([lanes.from])', 'int', ''), ('Flow planned, thousands', '=SUM([lanes.vol])', 'int', 'Peak week'),
            ('Nodes over capacity', '=SUMPRODUCT(([lanes.status]="Over limit")/COUNTIF([lanes.to],[lanes.to]))', 'int', 'Each destination counted once'),
            ('Destinations not in the node list', '=SUMPRODUCT(([lanes.status]="Missing")/COUNTIF([lanes.to],[lanes.to]))', 'int', 'Check the names')])
    s.table('lanes', [
        I('from', 'Origin', 'text', 12), I('to', 'Destination', 'text', 12), I('vol', 'Peak week, thousands', 'int', 11, total='sum'), I('mode', 'Mode', 'text', 14, opts=['Line-haul truck', 'Shuttle', 'Rail', 'Air', 'Van']),
        F('share', 'Share of origin outbound', '=IF(SUMIF([lanes.from],{from},[lanes.vol])>0,{vol}/SUMIF([lanes.from],{from},[lanes.vol]),"")', 'pct', 11),
        F('inb', 'Destination inbound', '=SUMIF([lanes.to],{to},[lanes.vol])', 'int', 11),
        F('cap', 'Destination peak capacity', '=IFERROR(INDEX([nodes.peak],MATCH({to},[nodes.node],0)),"")', 'int', 12),
        F('use', 'Destination use', '=IF(N({cap})>0,{inb}/{cap},"")', 'pct', 10),
        S('status', 'Status', '=IF({to}="","",IF({cap}="","Missing",IF({use}>1,"Over limit",IF({use}>0.9,"Tight","OK"))))', 10),
    ], title='Lanes', help='Use the node names from the Nodes tab.')
    return b


def site_pipeline():
    b = Book(FOLDER, 'site-pipeline'); f = b.d['f']
    s = b.sheet('Projects', 'Project pipeline', 'New builds, expansions, conversions and closures.', 'Capacity, launch timing against need, capex and status per project.')
    open_ = '[proj.stage],"<>Launched",[proj.stage],"<>At full rate"'
    s.kpis([('Open projects', '=COUNTIFS(%s)' % open_, 'int', 'Not yet launched'), ('Capacity added, thousands a week', '=SUMIFS([proj.cap],%s)' % open_, 'int', 'Net of closures'),
            ('Capex committed', '=SUMIFS([proj.capex],%s)' % open_, 'money', ''), ('Late against need', '=COUNTIF([proj.status],"Late")', 'int', 'Launch after the gap opens')])
    s.table('proj', [
        I('name', 'Project', 'text', 26), I('type', 'Type', 'text', 11, opts=['New build', 'Expansion', 'Conversion', 'Closure']), I('region', 'Region', 'text', 13),
        I('cap', 'Capacity change', 'int', 9), I('stage', 'Current stage', 'text', 13, opts=['Selection', 'Lease signed', 'Permits', 'Fit-out', 'Equipment', 'Hiring', 'Launched', 'At full rate']),
        I('launch', 'Launch forecast', 'days', 13), I('need', 'Needed by', 'days', 13), I('capex', 'Capex', 'money', 12, total='sum'),
        F('months', 'Months to launch', '=IF(OR({stage}="Launched",{stage}="At full rate"),"",{launch}/30.44)', 'dec1', 9),
        F('late', 'Days late', '=IF(OR({stage}="Launched",{stage}="At full rate",{need}=""),"",IF({launch}>{need},{launch}-{need},""))', 'int', 8),
        F('cpu', 'Capex per unit a week', '=IF(N({cap})>0,{capex}/({cap}*1000),"")', 'money', 10),
        S('status', 'Status', '=IF({name}="","",IF(OR({stage}="Launched",{stage}="At full rate"),{stage},IF(AND({need}<>"",{launch}>{need}),"Late",IF({launch}<0,"Overdue","On track"))))'),
    ], title='Projects', help='Capacity change in thousands of units a week, negative for a closure. Launch and need are days from today.')
    s.chart('bar', 'Capacity change by project', 'proj', 'name', ['cap'], 'Thousands a week', horizontal=True)

    s = b.sheet('Stage gates', 'Stage gates and lead times', 'Work back from the target launch through every stage.', 'Months per stage with buffer and the latest start for each.')
    s.settings([('target', 'Target launch', f['target'], 'days'), ('buffer', 'Buffer on every stage', f['buffer'], 'pct', 'For delays')])
    s.kpis([('Total lead time, months', '=SUM([gates.mb])', 'dec1', ''), ('Start the search by', '=[gates.start#0]', 'days', ''),
            ('Status', '=IF([gates.start#0]<0,"Too late",IF([gates.start#0]<60,"Start now","On track"))', 'status', '')])
    s.table('gates', [LBL('Stage', 28), I('months', 'Months', 'dec1', 8), I('owner', 'Owner', 'text', 16), I('exit', 'Gate passed when', 'text', 40),
                      F('mb', 'With buffer', '={months}*(1+in_buffer)', 'dec1', 10),
                      F('start', 'Latest start', '=in_target-ROUND(SUM({mb}:{mb@bot})*30.44,0)', 'days', 14),
                      S('status', 'Status', '=IF({start}<0,"Too late",IF({start}<60,"Start now","On track"))')], title='Stages')

    s = b.sheet('Ramp', 'Ramp curve', 'A new site rarely runs at full rate in week one.', 'Capacity by week after launch and the capacity lost while ramping.')
    s.settings([('full', 'Full weekly capacity, thousands', f['full'], 'int'), ('rLaunch', 'Launch', f['rLaunch'], 'days')])
    wn = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20]
    s.kpis([('Weeks to full rate', '=IFERROR(INDEX([ramp.wk],MATCH(TRUE,INDEX([ramp.pct]>=1,0),0)),"Not within 20 weeks")', 'int', ''),
            ('Capacity lost in ramp, thousands', '=SUM([ramp.lost])', 'int', 'Plan this volume on other nodes')])
    s.table('ramp', [LBL('Week', 10), F('wk', 'Week number', ['=%d' % w for w in wn], 'int', 8), I('pct', 'Share of full rate', 'pct', 10),
                     F('starts', 'Week starts', '=in_rLaunch+({wk}-1)*7', 'days', 14),
                     F('cap', 'Capacity, thousands', '=in_full*{pct}', 'int', 11),
                     F('lost', 'Lost against full', ['=(in_full-{cap})*%d' % (wn[i] - (wn[i - 1] if i else 0)) for i in range(10)], 'int', 11),
                     I('note', 'Notes', 'text', 34)], title='Ramp')
    s.chart('line', 'Capacity by week after launch', 'ramp', '_label', ['cap'], 'Thousands a week')
    return b


def transport_plan():
    b = Book(FOLDER, 'transport-plan'); f = b.d['f']
    s = b.sheet('Lanes', 'Lane plan', 'Lane volumes into trucks and cost per unit.', 'Trucks, cost per truck, cost per week and per unit by lane.')
    s.settings([('perTruck', 'Units per full truck', f['perTruck'], 'int'), ('fill', 'Planned fill rate', f['fill'], 'pct'), ('spotPrem', 'Spot premium over contract', f['spotPrem'], 'pct')])
    s.kpis([('Units per truck at plan fill', '=in_perTruck*in_fill', 'int', '', 'per'), ('Trucks per week', '=SUM([lanes.trucks])', 'int', '', 'trucks'),
            ('Cost per week', '=SUM([lanes.cost])', 'money', ''), ('Cost per unit', '=IF(SUM([lanes.vol])>0,SUM([lanes.cost])/SUM([lanes.vol]),0)', 'money2', ''),
            ('Spot heavy lanes', '=COUNTIF([lanes.status],"Spot heavy")', 'int', 'Over 30% of loads on spot')])
    s.table('lanes', [
        I('from', 'Origin', 'text', 10), I('to', 'Destination', 'text', 11), I('vol', 'Units per week', 'int', 11, total='sum'), I('km', 'Km', 'int', 7), I('rate', 'Rate per km', 'money2', 9),
        I('contract', 'Contracted share', 'pct', 10), I('hours', 'Transit hours', 'dec1', 8),
        F('trucks', 'Trucks per week', '=IF(k_per>0,CEILING({vol}/k_per,1),0)', 'int', 9, total='sum'),
        F('pt', 'Cost per truck', '={km}*{rate}*(IF({contract}="",1,{contract})+(1-IF({contract}="",1,{contract}))*(1+in_spotPrem))', 'money', 10),
        F('cost', 'Cost per week', '={trucks}*{pt}', 'money', 11, total='sum'),
        F('cpu', 'Cost per unit', '=IF(N({vol})>0,{cost}/{vol},"")', 'money2', 9),
        S('status', 'Status', '=IF({from}="","",IF(AND({contract}<>"",{contract}<0.7),"Spot heavy","OK"))', 11),
    ], title='Lanes', help='Volume is units in an average week; rate is the contracted cost per truck km.')
    s.chart('bar', 'Cost per week by lane', 'lanes', 'to', ['cost'], 'Cost per week')

    s = b.sheet('Carriers', 'Carrier mix', 'Contracted, spot and own-fleet capacity against the loads needed.', 'Cover, peak loads and cost at each carrier\'s share.')
    s.kpis([('Loads needed per week', '=k_trucks', 'int', 'From the lane plan'), ('Loads offered per week', '=SUM([carriers.loads])', 'int', '', 'offer'),
            ('Cover', '=IF(k_trucks>0,k_offer/k_trucks,0)', 'pct', 'Offered over needed', 'cover'),
            ('Status', '=IF(k_cover>=1.05,"Covered",IF(k_cover>=1,"Tight","Not covered"))', 'status', ''),
            ('Average on-time', '=IF(k_offer>0,SUMPRODUCT([carriers.ot],[carriers.loads])/k_offer,0)', 'pct', 'Weighted by loads offered')])
    s.table('carriers', [
        I('name', 'Carrier', 'text', 18), I('kind', 'Type', 'text', 14, opts=['Contracted', 'Spot', 'Own fleet', 'Partner carrier']), I('loads', 'Loads per week offered', 'int', 11, total='sum'),
        I('cost', 'Cost per load', 'money', 10), I('ot', 'On time', 'pct', 8), I('peak', 'Extra loads in peak', 'pct', 10),
        F('share', 'Share of offer', '=IF(k_offer>0,{loads}/k_offer,0)', 'pct', 9),
        F('pk', 'Peak loads offered', '={loads}*(1+{peak})', 'int', 10, total='sum'),
        F('week', 'Cost per week at share', '={share}*k_trucks*{cost}', 'money', 11, total='sum'),
    ], title='Carriers')

    s = b.sheet('Designs', 'Network design scenarios', 'Compare network designs on cost, transit time and emissions.', 'Cost per unit against the first row, transit hours and tonnes of CO2e.')
    s.settings([('units', 'Units per week', f['units'], 'int'), ('co2', 'Kg CO2e per truck km', f['co2'], 'dec2')])
    s.kpis([('Lowest cost design', '=INDEX([designs.name],MATCH(MIN([designs.cpu]),[designs.cpu],0))', 'text', ''),
            ('Fastest design', '=INDEX([designs.name],MATCH(MIN([designs.hours]),[designs.hours],0))', 'text', ''),
            ('Lowest emissions', '=INDEX([designs.name],MATCH(MIN([designs.t]),[designs.t],0))', 'text', '')])
    s.table('designs', [
        I('name', 'Design', 'text', 40), I('trans', 'Transport per week', 'money', 12), I('handle', 'Handling per week', 'money', 12), I('km', 'Truck km per week', 'int', 11), I('hours', 'Average transit hours', 'dec1', 10),
        F('cpu', 'Cost per unit', '=IF(in_units>0,({trans}+{handle})/in_units,"")', 'money2', 9),
        F('vs', 'Against the first row', '=({trans}+{handle})/([designs.trans#0]+[designs.handle#0])-1', 'spct', 10),
        F('t', 'Tonnes CO2e a week', '={km}*in_co2/1000', 'dec1', 10),
        S('status', 'Result', '=IF({cpu}=MIN([designs.cpu]),"Best",IF({n}=1,"Baseline",""))', 9),
    ], title='Designs', help='The first row is today\'s network, the baseline.')
    s.chart('bar', 'Cost per unit by design', 'designs', 'name', ['cpu'], 'Cost per unit', horizontal=True)
    return b


def labor_plan():
    b = Book(FOLDER, 'labor-plan'); f = b.d['f']
    s = b.sheet('Sites', 'Heads by site', 'Heads each site needs from volume and labor rates.', 'Labor hours, heads needed, gap and labor cost per unit.')
    s.settings([('hours', 'Contract hours per week', f['hours'], 'dec1'), ('absence', 'Absence and holidays', f['absence'], 'pct'), ('indirect', 'Indirect labor on top', f['indirect'], 'pct', 'Leads, quality, training, cleaning')])
    s.kpis([('Productive hours per head', '=in_hours*(1-in_absence)', 'dec1', '', 'ph'), ('Heads needed', '=SUM([sites.need])', 'int', ''), ('Heads now', '=SUM([sites.now])', 'int', ''),
            ('Heads short', '=-SUMIF([sites.gap],"<0")', 'int', 'Sites below need'), ('Labor cost per unit', '=IF(SUM([sites.units])>0,SUM([sites.cost])/SUM([sites.units]),0)', 'money2', '')])
    s.table('sites', [
        I('site', 'Site', 'text', 10), I('type', 'Type', 'text', 18), I('units', 'Units per week', 'int', 11, total='sum'), I('uplh', 'Units per labor hour', 'dec1', 10),
        I('now', 'Heads now', 'int', 9, total='sum'), I('wage', 'Cost per hour', 'money2', 9),
        F('hrs', 'Labor hours', '=IF(N({uplh})>0,{units}/{uplh},0)', 'int', 10),
        F('need', 'Heads needed', '=IF(k_ph>0,CEILING({hrs}/k_ph*(1+in_indirect),1),0)', 'int', 9, total='sum'),
        F('gap', 'Gap', '={now}-{need}', 'sint', 8),
        F('cost', 'Labor cost per week', '={hrs}*(1+in_indirect)*{wage}', 'money', 11, total='sum'),
        F('cpu', 'Cost per unit', '=IF(N({units})>0,{cost}/{units},"")', 'money2', 9),
        S('status', 'Status', '=IF({site}="","",IF({gap}>=0,"Staffed",IF({gap}>=-0.05*{need},"Tight","Understaffed")))'),
    ], title='Sites')

    s = b.sheet('Peak ramp', 'Peak hiring ramp', 'Hiring into peak with attrition and training time.', 'Productive heads week by week against the target.')
    s.settings([('start', 'Heads at the start', f['start'], 'int'), ('attr', 'Attrition per week', f['attr'], 'pct'), ('train', 'Training weeks', f['train'], 'int'), ('maxHire', 'Most hires a week', f['maxHire'], 'int', 'What recruiting can handle')])
    s.kpis([('Hires planned', '=SUM([weeks.hires])', 'int', ''), ('Lost to attrition', '=SUM([weeks.lost])', 'int', ''),
            ('Heads in peak week', '=[weeks.prod#12]', 'int', ''), ('Target in peak week', '=[weeks.target#12]', 'int', ''), ('Weeks behind', '=COUNTIF([weeks.status],"Behind")', 'int', '')])
    s.table('weeks', [
        LBL('Week', 16), I('target', 'Target heads', 'int', 10), I('hires', 'Hires starting', 'int', 10, total='sum'),
        F('lost', 'Lost to attrition', ('=in_start*in_attr', '={prod^}*in_attr'), 'dec1', 10, total='sum'),
        F('prod', 'Productive heads', ('=in_start-{lost}+IF({n}-in_train>=1,INDEX([weeks.hires],{n}-in_train),0)', '={prod^}-{lost}+IF({n}-in_train>=1,INDEX([weeks.hires],{n}-in_train),0)'), 'int', 11),
        F('train', 'In training', '=IF(in_train<=0,0,SUM(INDEX([weeks.hires],MAX(1,{n}-in_train+1)):{hires}))', 'int', 10),
        F('gap', 'Gap', '={prod}-{target}', 'sint', 8),
        F('lim', 'Hiring limit', '=IF({hires}>in_maxHire,"Above limit","")', 'text', 11),
        S('status', 'Status', '=IF({target}="","",IF({gap}>=-0.5,"On track","Behind"))', 10),
    ], title='Weeks to peak')
    s.chart('line', 'Productive heads against target', 'weeks', '_label', ['prod', 'target'], 'Heads')

    s = b.sheet('Labor market', 'Local labor market', 'Whether each local market can supply the hires.', 'Hires a year as a share of the local pool and the wage against market.')
    s.kpis([('High risk sites', '=COUNTIF([market.status],"High risk")', 'int', 'Need over 5% of the pool'), ('Hires a year', '=SUM([market.hires])', 'int', 'Growth plus replacing attrition'),
            ('Lowest wage against market', '=MIN([market.wpos])', 'spct', '')])
    s.table('market', [
        I('site', 'Site', 'text', 10), I('area', 'Commuting area', 'text', 20), I('pool', 'Available pool', 'int', 10), I('growth', 'Net new heads a year', 'int', 10),
        I('heads', 'Heads at full run', 'int', 10), I('attrY', 'Attrition a year', 'pct', 9), I('wage', 'Our wage', 'money2', 9), I('mkt', 'Market wage', 'money2', 9), I('rivals', 'Large employers hiring', 'int', 10),
        F('hires', 'Hires a year', '={growth}+{heads}*{attrY}', 'int', 9),
        F('share', 'Share of pool', '=IF(N({pool})>0,{hires}/{pool},"")', 'pct', 9),
        F('wpos', 'Wage to market', '=IF(N({mkt})>0,{wage}/{mkt}-1,"")', 'spct', 9),
        S('status', 'Risk', '=IF({share}="","",IF({share}>0.05,"High risk",IF(OR({share}>0.02,AND({wpos}<>"",{wpos}<-0.03)),"Medium risk","Low risk")))'),
    ], title='Sites and local markets')
    return b


def cost_capex():
    b = Book(FOLDER, 'cost-capex'); f = b.d['f']
    s = b.sheet('Cost per layer', 'Cost per unit by layer', 'Where cost per unit sits across the network.', 'Weekly cost, cost per unit and weighted cost per unit by layer.')
    s.kpis([('Network cost per unit', '=SUM([layers.w])', 'money2', 'Weighted by the share of units passing through'), ('Cost per week', '=SUM([layers.week])', 'money', ''),
            ('Largest layer', '=INDEX([layers._label],MATCH(MAX([layers.w]),[layers.w],0))', 'text', ''), ('Labor share', '=IF(SUM([layers.week])>0,SUM([layers.labor])/SUM([layers.week]),0)', 'pct', '')])
    s.table('layers', [LBL('Layer', 22), I('units', 'Units per week', 'int', 11), I('share', 'Share of units', 'pct', 9), I('labor', 'Labor', 'money', 11, total='sum'), I('site', 'Building and equipment', 'money', 12, total='sum'),
                       I('trans', 'Transport', 'money', 11, total='sum'), I('other', 'Other', 'money', 10, total='sum'),
                       F('week', 'Cost per week', '={labor}+{site}+{trans}+{other}', 'money', 11, total='sum'),
                       F('cpu', 'Cost per unit', '=IF(N({units})>0,{week}/{units},"")', 'money2', 9),
                       F('w', 'Weighted', '=IF({cpu}="",0,{cpu}*{share})', 'money2', 9, total='sum')], title='Layers')
    s.chart('bar', 'Weighted cost per unit by layer', 'layers', '_label', ['w'], 'Cost per unit')

    s = b.sheet('Capex projects', 'Capex projects', 'Rank capital projects by payback, NPV and IRR.', 'Cash flow by year, payback, NPV at the hurdle rate, IRR and a result.')
    s.settings([('hurdle', 'Hurdle rate', f['hurdle'], 'pct'), ('pbMax', 'Payback limit, years', f['pbMax'], 'dec1')])
    s.kpis([('Approve', '=COUNTIF([proj.status],"Approve")', 'int', 'Positive NPV and within the payback limit'), ('Capex to approve', '=SUMIF([proj.status],"Approve",[proj.capex])', 'money', ''),
            ('NPV of approved', '=SUMIF([proj.status],"Approve",[proj.npv])', 'money', ''), ('Reject', '=COUNTIF([proj.status],"Reject")', 'int', '')])
    cf = [F('cf0', 'Year 0', '=-{capex}', 'money', 11)] + [F('cf%d' % k, 'Year %d' % k, '=IF(%d<=ROUND({life},0),{benefit}*MIN(1,%d/MAX(1,N({ramp})))-{opex},0)' % (k, k), 'money', 11) for k in range(1, 21)]
    cum = [F('c0', 'Cumulative 0', '={cf0}', 'money', 11)] + [F('c%d' % k, 'Cumulative %d' % k, '={c%d}+{cf%d}' % (k - 1, k), 'money', 11) for k in range(1, 21)]
    s.table('proj', [
        I('name', 'Project', 'text', 28), I('capex', 'Capex', 'money', 12), I('benefit', 'Benefit a year', 'money', 12), I('opex', 'Added cost a year', 'money', 12), I('ramp', 'Ramp years', 'int', 8), I('life', 'Life, years', 'int', 8),
        F('pb', 'Payback, years', '=IFERROR(MATCH(TRUE,INDEX({c1}:{c20}>=0,0),0)-1+(-INDEX({c0}:{c20},MATCH(TRUE,INDEX({c1}:{c20}>=0,0),0)))/INDEX({cf1}:{cf20},MATCH(TRUE,INDEX({c1}:{c20}>=0,0),0)),"")', 'dec1', 9),
        F('npv', 'NPV', '={cf0}+NPV(in_hurdle,{cf1}:{cf20})', 'money', 12),
        F('irr', 'IRR', '=IFERROR(IRR({cf0}:{cf20}),"")', 'pct', 8),
        F('pi', 'NPV per capex', '=IF(N({capex})>0,{npv}/{capex},"")', 'dec2', 9),
        S('status', 'Result', '=IF({name}="","",IF(AND({npv}>0,{pb}<>"",N({pb})<=in_pbMax),"Approve",IF(OR({npv}>0,AND({pb}<>"",N({pb})<=in_pbMax)),"Review","Reject")))', 10),
    ] + cf + cum, title='Projects', help='Cash flow by year and the running total sit to the right of the results.')
    s.chart('bar', 'NPV by project', 'proj', 'name', ['npv'], 'NPV', horizontal=True)

    s = b.sheet('Tie-out', 'Operations and finance tie-out', 'Operations and finance plan on the same volume and cost.', 'Volume and cost gaps by year against a tolerance.')
    s.settings([('tol', 'Allowed difference', f['tol'], 'pct'), ('y0', 'Base year', int(f['y0']), 'year')])
    s.kpis([('Years matched', '=COUNTIF([tie.status],"Matched")', 'int', ''), ('Largest volume gap', '=IF(MAX([tie.vg])>=-MIN([tie.vg]),MAX([tie.vg]),MIN([tie.vg]))', 'spct', ''),
            ('Largest cost gap', '=IF(MAX([tie.cg])>=-MIN([tie.cg]),MAX([tie.cg]),MIN([tie.cg]))', 'spct', '')])
    s.table('tie', [LBL('Year', 9), F('cal', 'Calendar year', '=in_y0+{n}', 'year', 9), I('oVol', 'Operations volume', 'dec1', 11), I('fVol', 'Finance volume', 'dec1', 11),
                    I('oCost', 'Operations cost', 'dec1', 11), I('fCost', 'Finance budget', 'dec1', 11),
                    F('vg', 'Volume gap', '=IF(N({fVol})>0,{oVol}/{fVol}-1,"")', 'spct', 9), F('cg', 'Cost gap', '=IF(N({fCost})>0,{oCost}/{fCost}-1,"")', 'spct', 9),
                    F('cpu', 'Cost per unit, operations', '=IF(N({oVol})>0,{oCost}/{oVol},"")', 'money2', 11), I('note', 'Reason for the gap', 'text', 36),
                    S('status', 'Status', '=IF(AND({vg}="",{cg}=""),"",IF(AND(ABS(N({vg}))<=in_tol,ABS(N({cg}))<=in_tol),"Matched","Gap"))', 10)],
            title='Plan years', help='Volume in millions of units, cost in millions.')
    return b


def scenarios_risk():
    b = Book(FOLDER, 'scenarios-risk'); f = b.d['f']
    s = b.sheet('Scenarios', 'Scenario switchboard', 'Test the plan against what-ifs on demand, capacity and cost.', 'Peak use and cost change per scenario.')
    s.settings([('dem', 'Peak-week demand, thousands', f['dem'], 'int'), ('cap', 'Peak-week capacity, thousands', f['cap'], 'int'), ('cpu', 'Cost per unit', f['cpu'], 'money2'), ('yearUnits', 'Units a year, millions', f['yearUnits'], 'dec1')],
               title='Base plan, peak week')
    s.kpis([('Base use', '=IF(in_cap>0,in_dem/in_cap,0)', 'pct', ''), ('Scenarios that break the plan', '=COUNTIF([scen.status],"Breaks")', 'int', 'Peak use above 100%'),
            ('Worst use', '=MAX([scen.use])', 'pct', ''), ('Worst scenario', '=INDEX([scen.name],MATCH(MAX([scen.use]),[scen.use],0))', 'text', ''),
            ('Expected cost change a year', '=SUMPRODUCT([scen.dc],[scen.prob])', 'smoney', 'Weighted by probability'),
            ('Peak capacity to add, thousands', '=MAX(0,MAX([scen.short]))', 'int', 'For every scenario to hold')])
    s.table('scen', [
        I('name', 'Scenario', 'text', 34), I('dDem', 'Demand change', 'spct', 9), I('dCap', 'Capacity change', 'spct', 9), I('dCost', 'Cost per unit change', 'spct', 10), I('prob', 'Probability', 'pct', 9),
        F('dem', 'Peak demand', '=in_dem*(1+{dDem})', 'int', 9), F('cap', 'Peak capacity', '=in_cap*(1+{dCap})', 'int', 9),
        F('use', 'Use', '=IF({cap}>0,{dem}/{cap},"")', 'pct', 8), F('short', 'Capacity short', '={dem}-{cap}', 'sint', 9),
        F('dc', 'Cost change a year', '=in_cpu*{dCost}*in_yearUnits*1000000*(1+{dDem})', 'smoney', 12),
        S('status', 'Result', '=IF({use}="","",IF({use}>1,"Breaks",IF({use}>0.9,"Strained","Holds")))', 10),
    ], title='Scenarios', help='Changes are plus or minus percent on the base plan.')
    s.chart('bar', 'Peak use by scenario', 'scen', 'name', ['use'], 'Use', horizontal=True)

    s = b.sheet('Risks', 'Risk register', 'Scored risks with owners and mitigations.', 'Score, rating and overdue mitigations.')
    s.kpis([('Open risks', '=COUNTIF([risks.closed],"No")', 'int', ''), ('High', '=COUNTIFS([risks.closed],"No",[risks.score],">=15")', 'int', 'Score 15 or more'),
            ('Mitigations overdue', '=COUNTIF([risks.rating],"Overdue")', 'int', ''), ('High risks without mitigation', '=COUNTIFS([risks.closed],"No",[risks.score],">=15",[risks.mit],"=")', 'int', 'Need an action and a date')])
    areas = ['Demand', 'Capacity', 'Sites', 'Transport', 'Labor', 'Cost', 'Regulation', 'Technology']
    s.table('risks', [
        I('risk', 'Risk', 'text', 40), I('area', 'Area', 'text', 11, opts=areas), I('owner', 'Owner', 'text', 14), I('p', 'Probability 1 to 5', 'int', 9), I('i', 'Impact 1 to 5', 'int', 8),
        I('mit', 'Mitigation', 'text', 36), I('due', 'Due', 'days', 12), I('closed', 'Closed', 'text', 8, opts=['No', 'Yes']),
        F('score', 'Score', '={p}*{i}', 'int', 7),
        S('rating', 'Rating', '=IF({risk}="","",IF({closed}="Yes","Closed",IF(AND({due}<>"",{due}<0),"Overdue",IF({score}>=15,"High",IF({score}>=8,"Medium","Low")))))', 10),
    ], title='Risks', help='Write each risk as cause and effect.')
    s.table('areas', [LBL('Area', 14), F('score', 'Open risk score', ['=SUMIFS([risks.score],[risks.area],"%s",[risks.closed],"No")' % a for a in areas], 'int', 12)], fixed=areas, title='Exposure by area')
    s.chart('bar', 'Open risk score by area', 'areas', '_label', ['score'], 'Score')

    s = b.sheet('Triggers', 'Trigger points', 'The numbers that start a plan change.', 'Distance to each trigger and whether it has fired.')
    s.kpis([('Triggered', '=COUNTIF([trig.status],"Triggered")', 'int', 'Act now'), ('Watch', '=COUNTIF([trig.status],"Watch")', 'int', 'Within 10%'), ('Not triggered', '=COUNTIF([trig.status],"Not triggered")', 'int', '')])
    s.table('trig', [
        I('metric', 'Metric', 'text', 32), I('cur', 'Current', 'num', 9), I('trig', 'Trigger', 'num', 9), I('dir', 'Fires when', 'text', 10, opts=['Above', 'Below']),
        I('action', 'Action when it fires', 'text', 44), I('owner', 'Owner', 'text', 14),
        F('dist', 'Distance', '=IF(OR({cur}="",N({trig})=0),"",IF({dir}="Below",{cur}-{trig},{trig}-{cur})/ABS({trig}))', 'pct', 9),
        S('status', 'Status', '=IF({dist}="","",IF({dist}<=0,"Triggered",IF({dist}<=0.1,"Watch","Not triggered")))', 12),
    ], title='Triggers')
    return b


def planning_governance():
    b = Book(FOLDER, 'planning-governance'); f = b.d['f']
    s = b.sheet('Calendar', 'Planning calendar', 'The planning year, from the annual plan to peak readiness.', 'Milestones, days left and status.')
    s.kpis([('Next milestone', '=IFERROR(INDEX([cal.what],MATCH(_xlfn.MINIFS([cal.date],[cal.done],"No",[cal.date],">=0"),[cal.date],0)),"None")', 'text', ''),
            ('Next milestone in', '=_xlfn.MINIFS([cal.date],[cal.done],"No",[cal.date],">=0")', 'days', ''),
            ('Due in 30 days', '=COUNTIFS([cal.done],"No",[cal.date],">=0",[cal.date],"<=30")', 'int', ''), ('Overdue', '=COUNTIF([cal.status],"Overdue")', 'int', ''),
            ('Done', '=COUNTIF([cal.done],"Yes")', 'int', '')])
    s.table('cal', [I('date', 'Date', 'days', 13), I('cycle', 'Cycle', 'text', 16, opts=['Annual plan', 'Mid-year refresh', 'Quarterly refresh', 'Peak readiness', 'Five-year plan']),
                    I('what', 'Milestone', 'text', 46), I('owner', 'Owner', 'text', 16), I('audience', 'Reviewed by', 'text', 20), I('done', 'Done', 'text', 7, opts=['No', 'Yes']),
                    S('status', 'Status', '=IF({date}="","",IF({done}="Yes","Done",IF({date}<0,"Overdue",IF({date}<=14,"Due soon","On track"))))')], title='Milestones')

    s = b.sheet('KPI dictionary', 'Planning KPI dictionary', 'Few, stable planning KPIs.', 'Latest value against target per KPI.')
    s.kpis([('KPIs', '=COUNTA([kpis.name])', 'int', ''), ('On target', '=COUNTIF([kpis.status],"On target")', 'int', ''), ('Off target', '=COUNTIF([kpis.status],"Off target")', 'int', '')])
    s.table('kpis', [I('name', 'KPI', 'text', 32), I('formula', 'Formula', 'text', 40), I('owner', 'Owner', 'text', 16), I('freq', 'Frequency', 'text', 10, opts=['Weekly', 'Monthly', 'Quarterly', 'Yearly']),
                     I('dir', 'Better is', 'text', 9, opts=['Higher', 'Lower']), I('target', 'Target', 'num', 8), I('value', 'Latest', 'num', 8),
                     S('status', 'Status', '=IF(OR({target}="",{value}=""),"",IF(IF({dir}="Lower",{value}<={target},{value}>={target}),"On target","Off target"))')], title='KPIs')

    s = b.sheet('Decisions', 'Decision log', 'Decisions that change volume, capacity, sites, budget or a KPI.', 'Decide-by dates and review dates.')
    s.kpis([('Decisions', '=COUNTA([dec.what])', 'int', ''), ('Waiting for a decision', '=COUNTIF([dec.state],"Open")', 'int', ''),
            ('Decide-by date passed', '=COUNTIFS([dec.state],"Open",[dec.deadline],"<0")', 'int', ''), ('Reviews due', '=COUNTIF([dec.status],"Review due")', 'int', '')])
    s.table('dec', [I('what', 'Decision', 'text', 50), I('area', 'Area', 'text', 11, opts=['Demand', 'Capacity', 'Sites', 'Transport', 'Labor', 'Cost', 'Governance']), I('by', 'Decided by', 'text', 18),
                    I('state', 'State', 'text', 10, opts=['Open', 'Decided', 'Reversed']), I('deadline', 'Decide by', 'days', 13), I('review', 'Review on', 'days', 13),
                    S('status', 'Status', '=IF({what}="","",IF({state}="Open",IF(AND({deadline}<>"",{deadline}<0),"Overdue",IF(AND({deadline}<>"",{deadline}<=14),"Due soon","Open")),IF({state}="Reversed","Closed",IF(AND({review}<>"",{review}<0),"Review due","Decided"))))')],
            title='Decisions')

    s = b.sheet('Plan document', 'Plan document checklist', 'Check the written plan before it goes out.', 'Readiness of each line of the plan document.')
    s.kpis([('Ready', '=(COUNTIF([doc.done],"Yes")+0.5*COUNTIF([doc.done],"Partly"))/ROWS([doc.done])', 'pct', 'Yes counts 1, Partly 0.5'),
            ('Lines not done', '=ROWS([doc.done])-COUNTIF([doc.done],"Yes")', 'int', '', 'open'), ('Document state', '=IF(k_open=0,"Complete","Draft")', 'status', 'All lines Yes to send')])
    s.table('doc', [LBL('The document', 60), I('done', 'Done', 'text', 9, opts=['No', 'Partly', 'Yes']), I('sec', 'Section', 'text', 10), I('owner', 'Owner', 'text', 16), I('note', 'Notes', 'text', 30),
                    S('status', 'Status', '=IF({done}="Yes","Done",IF({done}="Partly","Partly","Not done"))')], title='The plan document')
    return b


ALL = ['demand_forecast', 'network_capacity', 'site_pipeline', 'transport_plan', 'labor_plan', 'cost_capex', 'scenarios_risk', 'planning_governance']
