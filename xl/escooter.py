"""Excel versions of the e-scooter operations workbooks."""
from xlkit import Book, I, F, S, LBL, when

FOLDER = 'escooter'


def city_allocation():
    b = Book(FOLDER, 'city-allocation'); f = b.d['f']
    s = b.sheet('Allocation', 'City allocation model', 'Split the deployable fleet across cities by demand, contract minimums and permit caps.', 'Need per city from rides, then allocation with minimums first and the rest by net revenue per ride.')
    s.settings([('pool', 'Deployable vehicles to allocate', f['pool'], 'int', 'Live plus low battery, all cities'),
                ('rpvd', 'Target rides per vehicle per day', f['rpvd'], 'dec1'),
                ('reserve', 'Reserve kept back', f['reserve'], 'pct', 'Held for swaps and new launches')])
    s.kpis([('Vehicles to allocate', '=INT(in_pool*(1-in_reserve))', 'int', 'Pool less the reserve', 'net'),
            ('Total need', '=SUM([cities.need])', 'int', 'Sum of need per city', 'need'),
            ('Pool against need', '=IF(k_need>0,k_net/k_need,0)', 'pct', 'Below 100% means some cities are short'),
            ('Allocated', '=SUM([cities.alloc])', 'int', ''),
            ('Rides per vehicle per day, expected', '=IF(SUM([cities.alloc])>0,SUM([cities.rides])/SUM([cities.alloc]),0)', 'dec2', ''),
            ('Cities short', '=COUNTIF([cities.status],"Short")+COUNTIF([cities.status],"Below minimum")', 'int', 'Allocation below need')])
    s.table('cities', [
        I('city', 'City', 'text', 14), I('rides', 'Rides per day', 'int', 11), I('rev', 'Net revenue per ride', 'money2', 12),
        I('min', 'Contract minimum', 'int', 11), I('cap', 'Permit cap', 'int', 10), I('now', 'Deployed now', 'int', 11),
        F('need', 'Need', '=IF({rides}="",0,MAX(N({min}),IF({cap}="",CEILING({rides}/in_rpvd,1),MIN({cap},CEILING({rides}/in_rpvd,1)))))', 'int', 9),
        F('base', 'Minimum used', '=MIN(N({min}),{need})', 'int', 10),
        F('extra', 'Above minimum', '={need}-{base}', 'int', 10),
        F('alloc', 'Allocate', '=IF({rides}="","",IF(k_net>=k_need,{need},{base}+MIN({extra},MAX(0,k_net-SUM([cities.base])-SUMPRODUCT((([cities.rev]>{rev})+([cities.rev]={rev})*(ROW([cities.rev])<ROW()))*[cities.extra])))))', 'int', 10),
        F('chg', 'Change', '=IF({alloc}="","",{alloc}-{now})', 'sint', 9),
        F('rpvd', 'Rides per vehicle', '=IF(N({alloc})>0,{rides}/{alloc},"")', 'dec2', 10),
        F('rpv', 'Revenue per vehicle per day', '=IF({rpvd}="","",{rpvd}*{rev})', 'money2', 12),
        S('status', 'Status', '=IF({rides}="","",IF(AND({min}<>"",{alloc}<{min}),"Below minimum",IF({alloc}<{need},"Short",IF(AND({cap}<>"",{alloc}>={cap}),"Capped","Allocated"))))', 14),
    ], title='Cities', help='Rides per day forecast for the coming weeks. Minimum is the fleet the city contract requires; cap is the permit limit.')
    s.chart('bar', 'Vehicles allocated by city', 'cities', 'city', ['alloc', 'need'], 'Vehicles')

    s = b.sheet('Rebalancing', 'Zone rebalancing plan', 'Move vehicles from surplus to deficit zones overnight.', 'Target per zone from its ride share, moves, van trips and vans needed.')
    s.settings([('perTrip', 'Vehicles per van trip', f['perTrip'], 'int'), ('tripMin', 'Minutes per van trip', f['tripMin'], 'int', 'Load, drive, unload and place'), ('vanHours', 'Van hours per night', f['vanHours'], 'dec1')])
    s.kpis([('Vehicles to move', '=MIN(SUMIF([zones.gap],">0"),-SUMIF([zones.gap],"<0"))', 'int', 'From surplus to deficit zones', 'moves'),
            ('Van trips', '=IF(in_perTrip>0,CEILING(k_moves/in_perTrip,1),0)', 'int', '', 'trips'),
            ('Van hours', '=k_trips*in_tripMin/60', 'dec1', '', 'vh'),
            ('Vans needed', '=IF(in_vanHours>0,CEILING(k_vh/in_vanHours,1),0)', 'int', '')])
    s.table('zones', [
        I('city', 'City', 'text', 12), I('zone', 'Zone', 'text', 24), I('share', 'Ride share', 'pct', 10), I('now', 'Vehicles now', 'int', 10),
        F('fleet', 'City fleet', '=SUMIF([zones.city],{city},[zones.now])', 'int', 10),
        F('target', 'Target', '=ROUND({fleet}*{share},0)', 'int', 9),
        F('gap', 'Gap', '={now}-{target}', 'sint', 9),
        F('cshare', 'Shares in city', '=SUMIF([zones.city],{city},[zones.share])', 'pct', 10),
        S('status', 'Status', '=IF({zone}="","",IF(ABS({gap})<=MAX(5,{target}*0.05),"Balanced",IF({gap}>0,"Surplus","Deficit")))'),
    ], title='Zones', help='Ride share is the zone share of its city rides over the last 14 days. Shares in one city should add up to 100%.')

    s = b.sheet('Permits', 'Permit and cap register', 'Permits, caps, rules and reporting duties per city.', 'Cap use, time to expiry and reports due.')
    s.kpis([('Permits held', '=COUNTA([permits.city])', 'int', ''),
            ('Next permit ends', '=MIN([permits.end])', 'days', 'Earliest end'),
            ('Reports due within 14 days', '=COUNTIFS([permits.report],">=0",[permits.report],"<=14")', 'int', ''),
            ('Permit fees per year', '=SUMPRODUCT([permits.fee],[permits.cap])', 'money', 'Fee per vehicle times the cap'),
            ('Permits to act on', '=COUNTA([permits.city])-COUNTIF([permits.status],"Valid")', 'int', '')])
    s.table('permits', [
        I('city', 'City', 'text', 12), I('owner', 'Owner', 'text', 12), I('end', 'Permit ends', 'days', 14), I('cap', 'Fleet cap', 'int', 9),
        I('dep', 'Deployed', 'int', 9), I('fee', 'Fee per vehicle per year', 'money', 12), I('rules', 'Rules', 'text', 34), I('report', 'Next report due', 'days', 14),
        F('use', 'Cap used', '=IF(N({cap})>0,{dep}/{cap},"")', 'pct', 9),
        F('feeY', 'Fee per year', '={fee}*{cap}', 'money', 11),
        S('status', 'Status', '=IF({city}="","",IF({end}<0,"Expired",IF(N({use})>1,"Over limit",IF({end}<=90,"Expiring soon",IF({report}<0,"Overdue",IF({report}<=14,"Report due","Valid"))))))', 14),
    ], title='Permits', help='Ends and report dates are days from today: 90 means in 90 days.')

    s = b.sheet('Season', 'Season and weather plan', 'Plan the fleet by month against seasonal demand.', 'Fleet per month from the peak fleet and the share deployed, against demand.')
    s.settings([('peak', 'Fleet in the peak month', f['peak'], 'int', 'All cities, deployable')])
    s.kpis([('Lowest month fleet', '=MIN([months.fleet])', 'int', ''), ('Vehicles to store off season', '=MAX([months.fleet])-MIN([months.fleet])', 'int', ''),
            ('Months off plan', '=COUNTIF([months.status],"Short")+COUNTIF([months.status],"Excess")', 'int', 'Short: demand 10 points above fleet; Excess: fleet 15 points above demand')])
    s.table('months', [
        LBL('Month', 10), I('demand', 'Demand, % of peak', 'pct', 11), I('rain', 'Rain days', 'int', 9), I('frost', 'Frost days', 'int', 9), I('plan', 'Fleet, % of peak', 'pct', 11),
        F('fleet', 'Fleet', '=ROUND(in_peak*{plan},0)', 'int', 10),
        F('gap', 'Gap, points', '=({plan}-{demand})*100', 'sint', 10),
        I('note', 'Notes', 'text', 30),
        S('status', 'Status', '=IF({demand}="","",IF({gap}<-10,"Short",IF({gap}>15,"Excess","On track")))'),
    ], title='Months')
    s.chart('line', 'Demand and fleet plan, % of peak', 'months', '_label', ['demand', 'plan'], '% of peak')
    return b


def fleet_health():
    b = Book(FOLDER, 'fleet-health'); f = b.d['f']
    s = b.sheet('Fleet status', 'Fleet status dashboard', 'One shared status model for every team.', 'Vehicles by city and status, deployable rate against target, and the status definitions.')
    s.settings([('target', 'Deployable rate target', f['target'], 'pct'), ('asOf', 'Counted', f['asOf'], 'days', 'Days from today, -1 is yesterday')])
    s.kpis([('Active fleet', '=SUM([cities.active])', 'int', 'Every vehicle except Retired'),
            ('Deployable', '=SUM([cities.dep])', 'int', 'Live plus low battery'),
            ('Deployable rate', '=IF(SUM([cities.active])>0,SUM([cities.dep])/SUM([cities.active]),0)', 'pct', ''),
            ('In repair', '=SUM([cities.field])+SUM([cities.shop])', 'int', 'Field repair and workshop'),
            ('Awaiting parts', '=SUM([cities.parts])', 'int', ''),
            ('Missing', '=SUM([cities.missing])', 'int', 'Not found for 48 hours or more'),
            ('Cities below target', '=COUNTIF([cities.status],"Below target")', 'int', '')])
    s.table('cities', [
        I('city', 'City', 'text', 12), I('live', 'Live', 'int', 9, total='sum'), I('low', 'Low battery', 'int', 9, total='sum'), I('field', 'Field repair', 'int', 9, total='sum'),
        I('shop', 'In workshop', 'int', 10, total='sum'), I('parts', 'Awaiting parts', 'int', 10, total='sum'), I('missing', 'Missing', 'int', 9, total='sum'), I('retired', 'Retired this month', 'int', 10, total='sum'),
        F('active', 'Active fleet', '={live}+{low}+{field}+{shop}+{parts}+{missing}', 'int', 10, total='sum'),
        F('dep', 'Deployable', '={live}+{low}', 'int', 10, total='sum'),
        F('rate', 'Deployable rate', '=IF({active}>0,{dep}/{active},"")', 'pct', 10, total='=IF(SUM([.active])>0,SUM([.dep])/SUM([.active]),"")'),
        S('status', 'Status', '=IF({active}=0,"",IF({rate}>=in_target,"Above target","Below target"))'),
    ], title='Vehicles by city and status', help='Count every vehicle once, in its status at the cut-off time.')
    s.chart('bar', 'Deployable rate by city', 'cities', 'city', ['rate'], 'Deployable rate')
    s.table('defs', [LBL('Status', 16), I('def', 'Definition', 'text', 50), I('counts', 'Deployable', 'text', 11, opts=['Yes', 'No']), I('owner', 'Owner', 'text', 14), I('exit', 'Leaves this status when', 'text', 40)], title='Status definitions', help='Agree these once with every team and use the same words in every report.')

    s = b.sheet('Lifecycle', 'Vehicle lifecycle tracker', 'Age and wear by delivery batch.', 'Life used from distance and battery cycles, months left and replacement status.')
    s.kpis([('Vehicles tracked', '=SUM([batches.veh])', 'int', ''),
            ('Average age, months', '=IF(SUM([batches.veh])>0,SUMPRODUCT([batches.age],[batches.veh])/SUM([batches.veh]),0)', 'dec1', 'Weighted by vehicles'),
            ('Vehicles to plan replacement', '=SUMIF([batches.status],"Plan replacement",[batches.veh])', 'int', '75% to 90% of life used'),
            ('Vehicles to replace', '=SUMIF([batches.status],"Replace",[batches.veh])', 'int', 'Past 90% of life')])
    s.table('batches', [
        I('batch', 'Batch', 'text', 12), I('model', 'Model', 'text', 8), I('city', 'City', 'text', 10), I('veh', 'Vehicles', 'int', 9),
        I('since', 'In service since', 'days', 14), I('km', 'Average km', 'int', 10), I('cycles', 'Average battery cycles', 'int', 11),
        I('lifeKm', 'Design life km', 'int', 10), I('lifeCycles', 'Design life cycles', 'int', 10),
        F('age', 'Age, months', '=IF({since}="","",-{since}/30.44)', 'dec1', 9),
        F('used', 'Life used', '=MAX(IF(N({lifeKm})>0,{km}/{lifeKm},0),IF(N({lifeCycles})>0,{cycles}/{lifeCycles},0))', 'pct', 9),
        F('left', 'Months left', '=IF({used}>=1,0,IF(AND({used}>0,N({age})>0),{age}*(1-{used})/{used},""))', 'dec1', 9),
        S('status', 'Status', '=IF({batch}="","",IF({used}>=0.9,"Replace",IF({used}>=0.75,"Plan replacement","Healthy")))', 16),
    ], title='Batches', help='In service since is days from today, so -575 means 575 days ago.')
    s.chart('bar', 'Life used by batch', 'batches', 'batch', ['used'], 'Life used')

    s = b.sheet('Losses', 'Loss, theft and vandalism log', 'Net vehicles lost and the cost, by city and month.', 'Net loss, loss rate against the limit and cost of losses and vandalism.')
    s.settings([('vehValue', 'Book value of a lost vehicle', f['vehValue'], 'money'), ('vandalCost', 'Average vandalism repair', f['vandalCost'], 'money'), ('lossLimit', 'Loss rate limit per month', f['lossLimit'], 'pct')])
    s.kpis([('Net vehicles lost', '=SUM([loss.net])', 'int', ''), ('Loss rate', '=IF(SUM([loss.fleet])>0,SUM([loss.net])/SUM([loss.fleet]),0)', 'pct', 'Net lost over fleet, all rows'),
            ('Vandalism repairs', '=SUM([loss.vandal])', 'int', ''), ('Cost', '=SUM([loss.cost])', 'money', 'Lost vehicles plus vandalism repairs')])
    s.table('loss', [
        I('month', 'Month', 'months', 13), I('city', 'City', 'text', 11), I('fleet', 'Fleet', 'int', 9), I('missing', 'Reported missing', 'int', 10, total='sum'),
        I('found', 'Found again', 'int', 9, total='sum'), I('stolen', 'Stolen, confirmed', 'int', 10, total='sum'), I('water', 'Recovered from water', 'int', 10, total='sum'), I('vandal', 'Vandalism repairs', 'int', 10, total='sum'),
        F('net', 'Net lost', '={missing}-{found}', 'int', 9, total='sum'),
        F('rate', 'Loss rate', '=IF(N({fleet})>0,{net}/{fleet},"")', 'pct', 9),
        F('cost', 'Cost', '={net}*in_vehValue+{vandal}*in_vandalCost', 'money', 10, total='sum'),
        S('status', 'Status', '=IF({rate}="","",IF({rate}>in_lossLimit,"High loss","OK"))'),
    ], title='Monthly log', help='Month is counted from this month: -1 is last month.')
    return b


def repair_maintenance():
    b = Book(FOLDER, 'repair-maintenance'); f = b.d['f']
    s = b.sheet('Capacity', 'Repair capacity planner', 'Workshop capacity against incoming repairs and preventive maintenance.', 'Capacity, workload, load and mechanics needed.')
    s.settings([('mech', 'Mechanics per shift', f['mech'], 'int'), ('shifts', 'Shifts per day', f['shifts'], 'int'), ('hours', 'Hours per shift', f['hours'], 'dec1'),
                ('days', 'Days per week', f['days'], 'int'), ('prod', 'Productive share', f['prod'], 'pct', 'Time left after breaks, cleaning and waiting'),
                ('bays', 'Repair bays', f['bays'], 'int'), ('backlog', 'Vehicles in the queue now', f['backlog'], 'int')])
    s.kpis([('Capacity, hours per week', '=in_mech*in_shifts*in_hours*in_days*in_prod', 'int', '', 'cap'),
            ('Workload, hours per week', '=SUM([std.hours])+SUM([pm.hours])', 'int', 'Repairs plus preventive maintenance', 'work'),
            ('Load', '=IF(k_cap>0,k_work/k_cap,0)', 'pct', 'Above 85% the queue grows on busy days', 'load'),
            ('Status', '=IF(k_load>1,"Over capacity",IF(k_load>0.85,"Near capacity","Within capacity"))', 'status', ''),
            ('Bay hours per week', '=in_bays*in_shifts*in_hours*in_days', 'int', ''),
            ('Jobs per week', '=SUM([std.jobs])', 'int', 'From labor standards', 'jobs'),
            ('Mechanics needed per shift', '=IF(in_shifts*in_hours*in_days*in_prod>0,k_work/(in_shifts*in_hours*in_days*in_prod)/0.85,0)', 'dec1', 'To run at 85% load'),
            ('Weeks to clear the queue', '=IF(k_cap-k_work<=0,"Queue grows",IF(k_jobs>0,in_backlog*(SUM([std.hours])/k_jobs)/(k_cap-k_work),0))', 'dec1', 'Using the spare hours each week')])
    s.chart('bar', 'Repair workload by type, hours per week', 'std', 'type', ['hours'], 'Hours')

    s = b.sheet('Labor standards', 'Labor standards', 'Standard minutes, efficiency and cost per repair type.', 'One list of standard times; the capacity planner reads it.')
    s.settings([('rate', 'Labor cost per hour', f['rate'], 'money', 'Wage plus employer costs')])
    s.table('std', [
        I('type', 'Repair type', 'text', 28), I('std', 'Standard minutes', 'int', 10), I('act', 'Actual minutes', 'int', 10), I('jobs', 'Jobs per week', 'int', 10, total='sum'), I('parts', 'Parts cost per job', 'money2', 11),
        F('eff', 'Efficiency', '=IF(N({act})>0,{std}/{act},"")', 'pct', 10),
        F('hours', 'Hours per week', '={std}*{jobs}/60', 'dec1', 10, total='sum'),
        F('cost', 'Cost per job', '={std}/60*in_rate+{parts}', 'money2', 10),
        F('week', 'Cost per week', '={cost}*{jobs}', 'money', 11, total='sum'),
        S('status', 'Status', '=IF({eff}="","",IF({eff}>=0.95,"Within standard",IF({eff}>=0.85,"Slow","Very slow")))', 14),
    ], title='Repair types')

    s = b.sheet('Fault Pareto', 'Fault code Pareto', 'Which fault codes make up most of the work.', 'Share, cumulative share and A, B, C class per fault code.')
    s.kpis([('Faults logged, 30 days', '=SUM([faults.cnt])', 'int', ''), ('Class A codes', '=COUNTIF([faults.cls],"A")', 'int', 'First 80% of faults'),
            ('Top fault', '=INDEX([faults.code],MATCH(MAX([faults.cnt]),[faults.cnt],0))&" "&INDEX([faults.desc],MATCH(MAX([faults.cnt]),[faults.cnt],0))', 'text', ''),
            ('Top fault share', '=IF(SUM([faults.cnt])>0,MAX([faults.cnt])/SUM([faults.cnt]),0)', 'pct', ''), ('Repair hours', '=SUM([faults.hours])', 'int', '')])
    s.table('faults', [
        I('code', 'Code', 'text', 9), I('desc', 'Fault', 'text', 26), I('comp', 'Component', 'text', 12), I('cnt', 'Count', 'int', 9, total='sum', src='n'), I('min', 'Minutes per fix', 'int', 10),
        F('rank', 'Rank', '=RANK({cnt},[faults.cnt],0)', 'int', 7),
        F('share', 'Share', '=IF(SUM([faults.cnt])>0,{cnt}/SUM([faults.cnt]),0)', 'pct', 9),
        F('cum', 'Cumulative', '=IF(SUM([faults.cnt])>0,(SUMIF([faults.cnt],">"&{cnt})+{cnt})/SUM([faults.cnt]),0)', 'pct', 10),
        F('hours', 'Hours', '={cnt}*{min}/60', 'int', 8, total='sum'),
        S('cls', 'Class', '=IF({cnt}="","",IF(SUMIF([faults.cnt],">"&{cnt})/SUM([faults.cnt])<0.8,"A",IF(SUMIF([faults.cnt],">"&{cnt})/SUM([faults.cnt])<0.95,"B","C")))', 8),
    ], title='Fault codes', help='Counts are faults found in the last 30 days, using the shared fault code list.')
    s.chart('bar', 'Faults by code', 'faults', 'code', ['cnt'], 'Faults')

    s = b.sheet('Preventive', 'Preventive maintenance schedule', 'Services due on distance or time, whichever comes first.', 'Services and hours per week, added to the workshop load.')
    s.settings([('kmDay', 'Average km per vehicle per day', f['kmDay'], 'dec1')])
    s.kpis([('Services per week', '=SUM([pm.serv])', 'int', ''), ('Hours per week', '=SUM([pm.hours])', 'int', 'Added to the capacity planner'),
            ('Share of capacity', '=IF(k_cap>0,SUM([pm.hours])/k_cap,0)', 'pct', ''), ('Cost per week', '=SUM([pm.cost])', 'money', 'Labor and parts')])
    s.table('pm', [
        I('task', 'Task', 'text', 32), I('model', 'Model', 'text', 8), I('veh', 'Vehicles', 'int', 9), I('km', 'Every km', 'int', 9), I('days', 'Or every days', 'int', 10),
        I('min', 'Minutes', 'int', 8), I('parts', 'Parts cost', 'money2', 9),
        F('by', 'Due on', '=IF(IF(N({km})>0,in_kmDay/{km},0)>=IF(N({days})>0,1/{days},0),"Distance","Time")', 'text', 9),
        F('serv', 'Services per week', '={veh}*MAX(IF(N({km})>0,in_kmDay/{km},0),IF(N({days})>0,1/{days},0))*7', 'dec1', 10, total='sum'),
        F('hours', 'Hours per week', '={serv}*{min}/60', 'dec1', 10, total='sum'),
        F('cost', 'Cost per week', '={hours}*in_rate+{serv}*{parts}', 'money', 10, total='sum'),
    ], title='Tasks')

    s = b.sheet('Rework', 'Rework and repair quality log', 'Vehicles back for the same fault within 7 days.', 'Rework rate and audit pass rate by week.')
    s.settings([('reworkMax', 'Rework limit', f['reworkMax'], 'pct'), ('auditMin', 'Audit pass target', f['auditMin'], 'pct')])
    s.kpis([('Rework last week', '=INDEX([weeks.rate],MATCH(MAX([weeks.week]),[weeks.week],0))', 'pct', 'Latest week'),
            ('Audit pass last week', '=INDEX([weeks.audit],MATCH(MAX([weeks.week]),[weeks.week],0))', 'pct', ''),
            ('Repairs, all weeks', '=SUM([weeks.done])', 'int', ''), ('Rework, all weeks', '=IF(SUM([weeks.done])>0,SUM([weeks.back])/SUM([weeks.done]),0)', 'pct', '')])
    s.table('weeks', [
        I('week', 'Week', 'weeks', 13), I('done', 'Repairs done', 'int', 10, total='sum'), I('back', 'Came back', 'int', 10, total='sum'), I('audits', 'Audits', 'int', 8), I('passed', 'Audits passed', 'int', 10),
        I('cause', 'Top cause', 'text', 30),
        F('rate', 'Rework', '=IF(N({done})>0,{back}/{done},"")', 'pct', 9),
        F('audit', 'Audit pass', '=IF(N({audits})>0,{passed}/{audits},"")', 'pct', 9),
        S('status', 'Status', '=IF({rate}="","",IF(OR({rate}>in_reworkMax,AND({audit}<>"",{audit}<in_auditMin)),"Above limit","On track"))', 12),
    ], title='Weeks', help='Week is counted from this week: -1 is last week.')
    s.chart('line', 'Rework rate by week', 'weeks', 'week', ['rate'], 'Rework')
    return b


def parts_batteries():
    b = Book(FOLDER, 'parts-batteries'); f = b.d['f']
    s = b.sheet('Parts demand', 'Parts demand planner', 'Spare parts from failure rates and fleet size per model.', 'Weekly demand, cover, order point and order quantity per part.')
    s.settings([('fleetS2', 'Active fleet, model S2', f['fleetS2'], 'int'), ('fleetS3', 'Active fleet, model S3', f['fleetS3'], 'int'), ('review', 'Review period, weeks', f['review'], 'int', 'How often you place parts orders')])
    s.kpis([('Order now', '=COUNTIF([parts.status],"Order now")', 'int', 'Below the order point'), ('Order soon', '=COUNTIF([parts.status],"Order soon")', 'int', 'Within 2 weeks of the order point'),
            ('Order value', '=SUMIF([parts.status],"Order now",[parts.value])', 'money', 'All order now lines'), ('Stock value', '=SUMPRODUCT([parts.onhand],[parts.cost])', 'money', 'On hand at unit cost')])
    s.table('parts', [
        I('part', 'Part', 'text', 20), I('model', 'Model', 'text', 8, opts=['S2', 'S3', 'Both']), I('rate', 'Failures per 1,000 per week', 'dec1', 11), I('lead', 'Lead time, weeks', 'int', 9),
        I('safety', 'Safety weeks', 'int', 8), I('onhand', 'On hand', 'int', 9), I('onorder', 'On order', 'int', 9), I('cost', 'Unit cost', 'money2', 9),
        F('wk', 'Per week', '={rate}*IF({model}="S2",in_fleetS2,IF({model}="S3",in_fleetS3,in_fleetS2+in_fleetS3))/1000', 'dec1', 9),
        F('cover', 'Cover, weeks', '=IF({wk}>0,({onhand}+{onorder})/{wk},"")', 'dec1', 9),
        F('rop', 'Order point', '={wk}*({lead}+{safety})', 'int', 9),
        S('status', 'Status', '=IF({part}="","",IF({onhand}+{onorder}<{rop},"Order now",IF({onhand}+{onorder}<{rop}+2*{wk},"Order soon","OK")))'),
        F('qty', 'Order quantity', '=IF({status}="OK",0,MAX(0,CEILING({wk}*({lead}+{safety}+in_review)-({onhand}+{onorder}),1)))', 'int', 10),
        F('value', 'Order value', '={qty}*{cost}', 'money', 10, total='sum'),
    ], title='Parts', help='Model says which fleet uses the part. Lead time is order to shelf.')
    s.chart('bar', 'Weeks of cover by part', 'parts', 'part', ['cover'], 'Weeks', horizontal=True)

    s = b.sheet('Shortages', 'Critical shortage board', 'Parts blocking vehicles and the revenue lost while they wait.', 'Vehicles waiting, days to arrival and revenue lost.')
    s.settings([('revDay', 'Net revenue per vehicle per day', f['revDay'], 'money2', 'From the Unit Economics workbook')])
    s.kpis([('Vehicles waiting', '=SUM([short.veh])', 'int', ''), ('Revenue lost per day', '=SUM([short.veh])*in_revDay', 'money', ''),
            ('Revenue lost until arrival', '=SUM([short.lost])', 'money', 'Shortages with a date'), ('No arrival date', '=COUNTIF([short.status],"No date")', 'int', 'Chase these')])
    s.table('short', [
        I('part', 'Part', 'text', 18), I('model', 'Model', 'text', 8, opts=['S2', 'S3', 'Both']), I('veh', 'Vehicles waiting', 'int', 10, total='sum'),
        I('since', 'Short since', 'days', 13), I('eta', 'Expected arrival', 'days', 13), I('fix', 'Workaround', 'text', 32), I('owner', 'Owner', 'text', 12),
        F('wait', 'Days to arrival', '=IF({eta}="","",MAX(0,{eta}))', 'int', 10),
        F('lost', 'Revenue lost', '=IF({wait}="","",{veh}*in_revDay*{wait})', 'money', 11, total='sum'),
        S('status', 'Status', '=IF({part}="","",IF({eta}="","No date",IF({wait}<=7,"Arriving","Short")))'),
    ], title='Shortages', help='Leave Expected arrival empty when the supplier has given no date.')

    s = b.sheet('Batteries', 'Battery health and replacement', 'When each battery cohort reaches the replacement threshold.', 'Cycles left, weeks left, replacement timing and cost.')
    s.settings([('sohMin', 'Replace at state of health', f['sohMin'], 'pct'), ('packCost', 'Cost per new pack', f['packCost'], 'money'), ('horizon', 'Plan horizon, weeks', f['horizon'], 'int')])
    s.kpis([('Packs to replace now', '=SUMIF([bat.status],"Replace now",[bat.packs])', 'int', ''), ('Packs within horizon', '=SUMIF([bat.status],"Replace soon",[bat.packs])', 'int', ''),
            ('Budget, now plus horizon', '=SUM([bat.cost])', 'money', ''), ('Packs tracked', '=SUM([bat.packs])', 'int', '')])
    s.table('bat', [
        I('cohort', 'Cohort', 'text', 12), I('model', 'Model', 'text', 8), I('packs', 'Packs', 'int', 9, total='sum'), I('cycles', 'Average cycles', 'int', 9),
        I('soh', 'State of health', 'pct', 9), I('loss', 'Health points lost per 100 cycles', 'dec1', 12), I('perWeek', 'Cycles per week', 'dec1', 9),
        F('left', 'Cycles left', '=IF(N({loss})>0,MAX(0,({soh}-in_sohMin)*100/{loss}*100),"")', 'int', 9),
        F('weeks', 'Weeks left', '=IF(AND({left}<>"",N({perWeek})>0),{left}/{perWeek},"")', 'dec1', 9),
        F('when', 'Replace', '=IF({weeks}="","",ROUND({weeks},0))', 'weeks', 12),
        S('status', 'Status', '=IF({soh}="","",IF(OR({soh}<=in_sohMin,{weeks}=0),"Replace now",IF(AND({weeks}<>"",{weeks}<=in_horizon),"Replace soon","Healthy")))'),
        F('cost', 'Cost', '=IF({status}="Healthy",0,{packs}*in_packCost)', 'money', 10, total='sum'),
    ], title='Battery cohorts')

    s = b.sheet('Cannibalization', 'Cannibalization log', 'Parts taken from one vehicle to fix another.', 'Donors still down, vehicle days lost and the parts taken most.')
    s.kpis([('Donors still down', '=COUNTIF([cann.status],"Donor down")', 'int', ''), ('Vehicle days lost', '=SUM([cann.days])', 'int', ''),
            ('Average days down', '=IFERROR(AVERAGE([cann.days]),0)', 'dec1', ''), ('Most taken part', '=INDEX([cann.part],MATCH(MAX([cann.times]),[cann.times],0))', 'text', '')])
    s.table('cann', [
        I('date', 'Taken', 'days', 13), I('part', 'Part', 'text', 18), I('donor', 'Donor vehicle', 'text', 12), I('recv', 'Fixed vehicle', 'text', 12),
        I('reason', 'Reason', 'text', 18, opts=['Part out of stock', 'City SLA at risk', 'High-earning zone', 'Other']), I('by', 'Approved by', 'text', 14), I('back', 'Donor restored', 'days', 13),
        F('days', 'Days down', '=IF({date}="","",IF({back}="",-{date},{back}-{date}))', 'int', 9),
        F('times', 'Times part taken', '=COUNTIF([cann.part],{part})', 'int', 10),
        S('status', 'Status', '=IF({date}="","",IF({back}="","Donor down","Restored"))'),
    ], title='Parts taken')
    return b


def field_operations():
    b = Book(FOLDER, 'field-operations'); f = b.d['f']
    s = b.sheet('Swap routes', 'Battery swap and charging routes', 'Swaps per day and the swappers they need.', 'Swaps per day, hours and staff per route.')
    s.settings([('shiftH', 'Hours per shift', f['shiftH'], 'dec1'), ('prod', 'Productive share', f['prod'], 'pct', 'After breaks, loading and van time'), ('packsVan', 'Charged packs per van load', f['packsVan'], 'int')])
    s.kpis([('Swaps per day', '=SUM([routes.swaps])', 'int', '', 'swaps'), ('Swapper hours per day', '=SUM([routes.hours])', 'dec1', ''),
            ('Swappers needed per day', '=IF(in_shiftH*in_prod>0,SUM([routes.hours])/(in_shiftH*in_prod),0)', 'dec1', ''), ('Van loads per day', '=IF(in_packsVan>0,SUM([routes.swaps])/in_packsVan,0)', 'dec1', '')])
    s.table('routes', [
        I('route', 'Route or zone', 'text', 20), I('veh', 'Vehicles', 'int', 9, total='sum'), I('drain', 'Drain per day', 'pct', 9), I('level', 'Swap level', 'pct', 9),
        I('min', 'Minutes per swap', 'dec1', 10), I('hub', 'Charging hub', 'text', 16),
        F('swaps', 'Swaps per day', '=IF(AND(N({drain})>0,{level}<1),{veh}*{drain}/(1-{level}),0)', 'int', 10, total='sum'),
        F('every', 'Days between swaps', '=IF(N({drain})>0,(1-{level})/{drain},"")', 'dec1', 10),
        F('hours', 'Hours per day', '={swaps}*{min}/60', 'dec1', 9, total='sum'),
        F('staff', 'Swappers', '=IF(in_shiftH*in_prod>0,{hours}/(in_shiftH*in_prod),0)', 'dec1', 9),
    ], title='Routes', help='Drain is the share of battery used per vehicle per day.')

    s = b.sheet('Shift plan', 'Field shift plan', 'Hours, staff and vans by weekday.', 'Staff and vans needed against staff planned.')
    s.settings([('mSwap', 'Minutes per battery swap', f['mSwap'], 'dec1'), ('mCollect', 'Minutes to collect a vehicle', f['mCollect'], 'dec1'), ('mDeploy', 'Minutes to redeploy a vehicle', f['mDeploy'], 'dec1'),
                ('mFix', 'Minutes per street repair', f['mFix'], 'dec1'), ('vanStaff', 'Staff per van', f['vanStaff'], 'int')])
    s.kpis([('Hours needed per week', '=SUM([days.hours])', 'int', ''), ('Shifts planned per week', '=SUM([days.staff])', 'int', ''),
            ('Shifts needed per week', '=SUM([days.need])', 'dec1', ''), ('Days short', '=COUNTIF([days.status],"Understaffed")', 'int', 'Need above staff planned')])
    s.table('days', [
        LBL('Day', 12), I('swaps', 'Swaps (empty uses routes)', 'int', 12), I('collect', 'Collections', 'int', 10), I('deploy', 'Redeploys', 'int', 10), I('fix', 'Street repairs', 'int', 10),
        I('staff', 'Staff planned', 'int', 10), I('vans', 'Vans', 'int', 8),
        F('hours', 'Hours needed', '=(IF({swaps}="",k_swaps,{swaps})*in_mSwap+{collect}*in_mCollect+{deploy}*in_mDeploy+{fix}*in_mFix)/60', 'dec1', 10),
        F('need', 'Staff needed', '=IF(in_shiftH*in_prod>0,{hours}/(in_shiftH*in_prod),0)', 'dec1', 10),
        F('vneed', 'Vans needed', '=IF(in_shiftH*in_prod*in_vanStaff>0,({collect}*in_mCollect+{deploy}*in_mDeploy)/60/(in_shiftH*in_prod)/in_vanStaff,0)', 'dec1', 10),
        S('status', 'Status', '=IF({staff}="","",IF({need}>{staff},"Understaffed",IF({need}>{staff}*0.9,"Tight","Staffed")))', 13),
    ], title='Week')
    s.chart('bar', 'Staff needed and planned by weekday', 'days', '_label', ['need', 'staff'], 'Staff')

    s = b.sheet('Collect and redeploy', 'Collect and redeploy log', 'Vehicles moved by the van teams.', 'Vehicles moved per van hour, km per vehicle and the share sent to the workshop.')
    s.kpis([('Vehicles collected', '=SUM([moves.collect])', 'int', ''), ('Vehicles redeployed', '=SUM([moves.deploy])', 'int', ''),
            ('Sent to the workshop', '=SUM([moves.shop])', 'int', ''), ('Moved per van hour', '=IF(SUM([moves.vanH])>0,(SUM([moves.collect])+SUM([moves.deploy]))/SUM([moves.vanH]),0)', 'dec1', '')])
    s.table('moves', [
        I('date', 'Day', 'days', 12), I('city', 'City', 'text', 10), I('collect', 'Collected', 'int', 9, total='sum'), I('deploy', 'Redeployed', 'int', 10, total='sum'),
        I('shop', 'To workshop', 'int', 10, total='sum'), I('mis', 'Misparked fixed', 'int', 10, total='sum'), I('vanH', 'Van hours', 'dec1', 9, total='sum'), I('km', 'Van km', 'int', 9, total='sum'),
        F('perH', 'Moved per van hour', '=IF(N({vanH})>0,({collect}+{deploy})/{vanH},"")', 'dec1', 10),
        F('kmPer', 'Km per vehicle moved', '=IF({collect}+{deploy}>0,{km}/({collect}+{deploy}),"")', 'dec1', 10),
        F('shopShare', 'Workshop share', '=IF(N({collect})>0,{shop}/{collect},"")', 'pct', 10),
    ], title='Daily log')
    s.chart('line', 'Vehicles moved per van hour', 'moves', 'date', ['perH'], 'Per van hour')

    s = b.sheet('City SLA', 'City SLA tracker', 'Response times each city requires.', 'Compliance, breaches and penalties per rule.')
    s.kpis([('Compliance', '=IF(SUM([sla.cases])>0,(SUM([sla.cases])-SUM([sla.late]))/SUM([sla.cases]),0)', 'pct', 'Cases closed in time'),
            ('Breaches', '=SUM([sla.late])', 'int', ''), ('Penalties', '=SUM([sla.pen])', 'money', ''), ('Rules breached', '=COUNTIF([sla.status],"Breached")', 'int', '')])
    s.table('sla', [
        I('city', 'City', 'text', 10), I('rule', 'Requirement', 'text', 36), I('hours', 'Limit, hours', 'dec1', 9), I('target', 'Target rate', 'pct', 9),
        I('cases', 'Cases', 'int', 8, total='sum'), I('inTime', 'Closed in time', 'int', 10, total='sum'), I('fine', 'Penalty per breach', 'money', 10),
        F('rate', 'Compliance', '=IF(N({cases})>0,{inTime}/{cases},"")', 'pct', 10),
        F('late', 'Breaches', '={cases}-{inTime}', 'int', 9, total='sum'),
        F('pen', 'Penalties', '={late}*{fine}', 'money', 10, total='sum'),
        S('status', 'Status', '=IF({rate}="","",IF({rate}<{target},"Breached",IF(AND({rate}<{target}+0.01,{late}>0),"Near limit","Met")))'),
    ], title='City requirements')
    return b


def npi():
    b = Book(FOLDER, 'npi'); f = b.d['f']
    s = b.sheet('Stage gates', 'Stage-gate plan', 'A new vehicle model through its gates, with slip against plan.', 'Gate dates, slip and the next gate.')
    s.kpis([('Gates passed', '=COUNTIF([gates.state],"Passed")', 'int', ''),
            ('Next gate', '=IFERROR(INDEX([gates._label],MATCH(TRUE,INDEX([gates.state]<>"Passed",0),0)),"All passed")', 'text', 'First gate not yet passed'),
            ('Next gate forecast', '=IFERROR(INDEX([gates.fc],MATCH(TRUE,INDEX([gates.state]<>"Passed",0),0)),"")', 'days', ''),
            ('Slip on next gate, days', '=IFERROR(INDEX([gates.slip],MATCH(TRUE,INDEX([gates.state]<>"Passed",0),0)),"")', 'sint', 'Forecast less plan'),
            ('Gates blocked', '=COUNTIF([gates.state],"Blocked")', 'int', 'Need a decision')])
    s.table('gates', [
        LBL('Gate', 28), I('plan', 'Planned', 'days', 13), I('fc', 'Forecast or actual', 'days', 13), I('owner', 'Owner', 'text', 13),
        I('state', 'State', 'text', 12, opts=['Not started', 'In progress', 'Passed', 'Blocked']), I('criteria', 'Exit criteria', 'text', 42),
        F('slip', 'Slip, days', '=IF(OR({plan}="",{fc}=""),"",{fc}-{plan})', 'sint', 9),
        S('status', 'Status', '=IF({plan}="","",IF({state}="Passed","Passed",IF({state}="Blocked","Blocked",IF(N({slip})>14,"Late",IF(N({slip})>0,"Slipping","On track")))))'),
    ], title='Gates', help='Planned is the date agreed at the start, forecast is today\'s best date, both in days from today.')

    s = b.sheet('Readiness', 'NPI readiness checklist', 'Operations signs off before the pilot.', 'Readiness score, open must-haves and the pilot gate.')
    s.kpis([('Readiness', '=(COUNTIF([ready.done],"Yes")+0.5*COUNTIF([ready.done],"Partly"))/ROWS([ready.done])', 'pct', 'Yes counts 1, Partly 0.5'),
            ('Must-haves open', '=COUNTIFS([ready.must],"Yes",[ready.done],"<>Yes")', 'int', 'Block the pilot', 'open'),
            ('Lines done', '=COUNTIF([ready.done],"Yes")', 'int', ''),
            ('Pilot gate', '=IF(k_open=0,"Go","No go")', 'status', 'Operations sign-off')])
    s.table('ready', [
        LBL('Ready when', 46), I('area', 'Area', 'text', 13), I('owner', 'Owner', 'text', 14), I('must', 'Must have', 'text', 9, opts=['Yes', 'No']),
        I('done', 'Done', 'text', 9, opts=['No', 'Partly', 'Yes']), I('due', 'Due', 'days', 13), I('note', 'Notes', 'text', 30),
        S('status', 'Status', '=IF({done}="Yes","Done",IF({done}="Partly","Partly",IF({must}="Yes","Not ready","Open")))'),
    ], title='Checklist')

    s = b.sheet('Pilot', 'Pilot scorecard', 'New model against the current model in the pilot city.', 'Change, better or worse, and pass or fail per metric.')
    s.settings([('pCity', 'Pilot city', f['pCity'], 'text'), ('pVeh', 'New model vehicles in pilot', f['pVeh'], 'int'), ('pWeeks', 'Weeks of pilot data', f['pWeeks'], 'int')])
    s.kpis([('Metrics passed', '=COUNTIF([metrics.res],"Pass")', 'int', '', 'pass'), ('Worse than current', '=COUNTIF([metrics.vs],"Worse")', 'int', '', 'worse'),
            ('Failures per 1,000 rides, change', '=[metrics.chg#0]', 'spct', 'Against the current model'),
            ('Pilot result', '=IF(AND(k_pass=ROWS([metrics.res]),in_pWeeks>=8),"Go",IF(k_worse>0,"No go","Review"))', 'status', 'All pass and 8 weeks of data')])
    s.table('metrics', [
        LBL('Metric', 40), I('dir', 'Better is', 'text', 10, opts=['Lower', 'Higher']), I('cur', 'Current model', 'dec2', 11), I('new', 'New model', 'dec2', 11), I('target', 'Target', 'dec2', 9),
        F('chg', 'Change', '=IF(N({cur})=0,"",{new}/{cur}-1)', 'spct', 9),
        S('vs', 'Against current', '=IF(OR({cur}="",{new}=""),"",IF({new}={cur},"Same",IF(({dir}="Lower")=({new}<{cur}),"Better","Worse")))', 13),
        S('res', 'Result', '=IF({vs}="","",IF(AND({vs}<>"Worse",OR({target}="",IF({dir}="Lower",{new}<={target},{new}>={target}))),"Pass","Fail"))', 9),
    ], title='Metrics')

    s = b.sheet('Transition', 'Fleet transition plan', 'New model in, old model out, and old-model parts run-out.', 'Fleet mix by month and when old-model parts run out.')
    s.settings([('oldStart', 'Old model fleet at start', f['oldStart'], 'int'), ('newStart', 'New model fleet at start', f['newStart'], 'int'),
                ('partsStock', 'Old-model parts stock, value', f['partsStock'], 'money'), ('partsUse', 'Parts use per 100 old vehicles per month, value', f['partsUse'], 'money')])
    s.kpis([('Months of parts left today', '=IF(in_oldStart*in_partsUse>0,in_partsStock/(in_oldStart/100*in_partsUse),0)', 'dec1', ''),
            ('Old model gone in month', '=IFERROR(MATCH(0,[months.old],0),"Not in this plan")', 'int', '', 'gone'),
            ('Parts run out in month', '=IFERROR(MATCH(0,[months.parts],0),"Not in this plan")', 'int', '', 'pout'),
            ('Parts check', '=IF(AND(ISNUMBER(k_pout),OR(NOT(ISNUMBER(k_gone)),k_pout<k_gone)),"Parts run out first",IF(NOT(ISNUMBER(k_gone)),"Old fleet still running",IF(INDEX([months.parts],ROWS([months.parts]))>in_oldStart/100*in_partsUse,"Write-off risk","Run-out matched")))', 'status', '')])
    s.table('months', [
        I('month', 'Month', 'months', 13), I('city', 'Cities switching', 'text', 22), I('add', 'New delivered', 'int', 10, total='sum'), I('ret', 'Old retired', 'int', 10, total='sum'),
        F('old', 'Old fleet', ('=MAX(0,in_oldStart-{ret})', '=MAX(0,{old^}-{ret})'), 'int', 10),
        F('nw', 'New fleet', ('=in_newStart+{add}', '={nw^}+{add}'), 'int', 10),
        F('tot', 'Total fleet', '={old}+{nw}', 'int', 10),
        F('share', 'New share', '=IF({tot}>0,{nw}/{tot},0)', 'pct', 9),
        F('parts', 'Old parts left', ('=MAX(0,in_partsStock-{old}/100*in_partsUse)', '=MAX(0,{parts^}-{old}/100*in_partsUse)'), 'money', 12),
    ], title='Months', help='Month 1 is next month.')
    s.chart('line', 'New model share of the fleet', 'months', 'month', ['share'], 'Share')
    return b


def supply_suppliers():
    b = Book(FOLDER, 'supply-suppliers'); f = b.d['f']
    s = b.sheet('Vehicle orders', 'Vehicle order and delivery schedule', 'Orders and deliveries against the fleet plan.', 'Delay, time to arrival, open value and status per order.')
    s.kpis([('Due in 30 days', '=SUMIFS([orders.open],[orders.exp],"<=30")', 'int', 'Vehicles not yet received'), ('Open on order', '=SUM([orders.open])', 'int', ''),
            ('Late orders', '=COUNTIF([orders.status],"Late")', 'int', 'More than 14 days behind'), ('Open order value', '=SUM([orders.value])', 'money', '')])
    s.table('orders', [
        I('po', 'Order', 'text', 10), I('model', 'Model', 'text', 8), I('dest', 'City', 'text', 10), I('qty', 'Quantity', 'int', 9, total='sum'),
        I('conf', 'Confirmed', 'days', 13), I('exp', 'Expected', 'days', 13), I('recv', 'Received', 'int', 9, total='sum'), I('price', 'Unit price', 'money', 9),
        F('open', 'Open', '=MAX(0,{qty}-{recv})', 'int', 8, total='sum'),
        F('delay', 'Delay, days', '=IF(OR({conf}="",{exp}=""),"",{exp}-{conf})', 'sint', 9),
        F('value', 'Open value', '={open}*{price}', 'money', 11, total='sum'),
        S('status', 'Status', '=IF({qty}="","",IF({open}=0,"Delivered",IF(N({recv})>0,"Partial",IF(N({delay})>14,"Late",IF(N({delay})>0,"At risk","On time")))))'),
    ], title='Purchase orders')
    s.chart('bar', 'Open vehicles by order', 'orders', 'po', ['open'], 'Vehicles')

    s = b.sheet('Supplier scorecard', 'Supplier scorecard', 'Delivery, quality, lead time, price and responsiveness.', 'Weighted score from 0 to 100 and a rating per supplier.')
    s.settings([('wOt', 'Weight: on-time delivery', f['wOt'], 'pct'), ('wQ', 'Weight: quality', f['wQ'], 'pct'), ('wLt', 'Weight: lead time', f['wLt'], 'pct'),
                ('wP', 'Weight: price', f['wP'], 'pct'), ('wR', 'Weight: responsiveness', f['wR'], 'pct')])
    s.kpis([('Weights add up to', '=in_wOt+in_wQ+in_wLt+in_wP+in_wR', 'pct', 'Should be 100%'), ('Strong', '=COUNTIF([sup.status],"Strong")', 'int', '80 or more'),
            ('Fair', '=COUNTIF([sup.status],"Fair")', 'int', '60 to 80'), ('Weak', '=COUNTIF([sup.status],"Weak")', 'int', 'Below 60'),
            ('Spend with weak suppliers', '=IF(SUM([sup.spend])>0,SUMIF([sup.status],"Weak",[sup.spend])/SUM([sup.spend]),0)', 'pct', '')])
    s.table('sup', [
        I('name', 'Supplier', 'text', 16), I('cat', 'Supplies', 'text', 20), I('spend', 'Spend, 12 months', 'money', 12), I('ot', 'On time', 'pct', 8), I('ppm', 'Defects, ppm', 'int', 9),
        I('lt', 'Lead time, weeks', 'dec1', 9), I('pc', 'Price change', 'spct', 9), I('resp', 'Response 1 to 5', 'int', 9),
        F('q', 'Quality score', '=MAX(0,MIN(100,100-{ppm}/50))', 'int', 9),
        F('l', 'Lead score', '=MAX(0,MIN(100,100-({lt}-2)/14*100))', 'int', 8),
        F('p', 'Price score', '=MAX(0,MIN(100,100-({pc}*100+5)/15*100))', 'int', 8),
        F('score', 'Score', '=({ot}*100*in_wOt+{q}*in_wQ+{l}*in_wLt+{p}*in_wP+MAX(0,MIN(100,({resp}-1)*25))*in_wR)/(in_wOt+in_wQ+in_wLt+in_wP+in_wR)', 'int', 8),
        S('status', 'Rating', '=IF({name}="","",IF({score}>=80,"Strong",IF({score}>=60,"Fair","Weak")))', 10),
    ], title='Suppliers')
    s.chart('bar', 'Supplier score', 'sup', 'name', ['score'], 'Score')

    s = b.sheet('Warranty claims', 'OEM warranty claims', 'Money recovered from suppliers.', 'Claim age, recovery and status.')
    s.kpis([('Open claim value', '=SUMIFS([claims.value],[claims.state],"<>Paid",[claims.state],"<>Rejected")', 'money', 'Draft, submitted or approved'),
            ('Recovered', '=SUM([claims.paid])', 'money', ''),
            ('Recovery rate', '=IFERROR(SUMIF([claims.state],"Paid",[claims.paid])/(SUMIF([claims.state],"Paid",[claims.value])+SUMIF([claims.state],"Rejected",[claims.value])),0)', 'pct', 'Paid over claimed, closed claims'),
            ('Claims ageing', '=COUNTIF([claims.status],"Ageing")', 'int', 'Over 60 days, not paid')])
    s.table('claims', [
        I('id', 'Claim', 'text', 9), I('sup', 'Supplier', 'text', 14), I('part', 'Part or fault', 'text', 34), I('veh', 'Vehicles', 'int', 9, total='sum'), I('date', 'Filed', 'days', 13),
        I('value', 'Claimed', 'money', 10, total='sum'), I('state', 'State', 'text', 11, opts=['Draft', 'Submitted', 'Approved', 'Paid', 'Rejected']), I('paid', 'Paid', 'money', 10, total='sum'),
        F('age', 'Age, days', '=IF({date}="","",-{date})', 'int', 8),
        F('rate', 'Recovered', '=IF(OR({state}="Paid",{state}="Rejected"),N({paid})/{value},"")', 'pct', 9),
        S('status', 'Status', '=IF({id}="","",IF({state}="Paid","Recovered",IF({state}="Rejected","Write off",IF({age}>60,"Ageing",IF({state}="Draft","Draft","Open")))))'),
    ], title='Claims')
    return b


def unit_economics():
    b = Book(FOLDER, 'unit-economics'); f = b.d['f']
    s = b.sheet('Vehicle P&L', 'Vehicle P&L', 'Profit of one vehicle per day.', 'Net revenue per ride and per day, contribution, EBITDA and profit after depreciation.')
    s.settings([('rides', 'Rides per vehicle per day', f['rides'], 'dec1'), ('mins', 'Average ride minutes', f['mins'], 'dec1'), ('unlock', 'Unlock fee', f['unlock'], 'money2'),
                ('perMin', 'Price per minute', f['perMin'], 'money2'), ('passShare', 'Rides on passes', f['passShare'], 'pct'), ('passDisc', 'Pass discount on list price', f['passDisc'], 'pct'),
                ('vat', 'VAT', f['vat'], 'pct'), ('payFee', 'Payment fees', f['payFee'], 'pct'), ('swapCost', 'Cost per battery swap', f['swapCost'], 'money2'),
                ('swapsDay', 'Swaps per vehicle per day', f['swapsDay'], 'dec2'), ('fieldCost', 'Field moves per vehicle per day', f['fieldCost'], 'money2'),
                ('kmDay', 'Km per vehicle per day', f['kmDay'], 'dec1'), ('repairKm', 'Repair and parts per km', f['repairKm'], 'money2'),
                ('insYear', 'Insurance per vehicle per year', f['insYear'], 'money'), ('permitYear', 'Permit fee per vehicle per year', f['permitYear'], 'money'),
                ('cityDay', 'Warehouse and city staff per vehicle per day', f['cityDay'], 'money2'), ('vehCost', 'Vehicle cost', f['vehCost'], 'money'), ('lifeMonths', 'Life in the fleet, months', f['lifeMonths'], 'int')],
               title='Revenue and costs')
    s.kpis([('Price per ride, list', '=in_unlock+in_perMin*in_mins', 'money2', '', 'list'),
            ('Net revenue per ride', '=k_list*(1-in_passShare*in_passDisc)/(1+in_vat)*(1-in_payFee)', 'money2', 'After passes, VAT and payment fees', 'net'),
            ('Net revenue per vehicle per day', '=k_net*in_rides', 'money2', '', 'rev')])
    days = ['=k_rev', '=-in_swapCost*in_swapsDay', '=-in_fieldCost', '=-in_kmDay*in_repairKm', '=-in_insYear/365', '=SUM([pl.day#0]:[pl.day#4])',
            '=-in_permitYear/365', '=-in_cityDay', '=[pl.day#5]+[pl.day#6]+[pl.day#7]', '=IF(in_lifeMonths>0,-in_vehCost/(in_lifeMonths*30.44),0)', '=[pl.day#8]+[pl.day#9]']
    s.table('pl', [LBL('Line', 30), F('day', 'Per day', days, 'money2', 12),
                   F('ride', 'Per ride', '=IF(in_rides>0,{day}/in_rides,0)', 'money2', 12),
                   F('month', 'Per month', '={day}*30.44', 'money', 12),
                   F('share', 'Share of revenue', '=IF(k_rev<>0,{day}/k_rev,0)', 'spct', 12)], title='Profit per vehicle')

    s = b.sheet('City P&L', 'City P&L', 'Full monthly P&L by city.', 'Net revenue, EBITDA, margin and EBITDA per vehicle per day.')
    s.kpis([('Net revenue per month', '=SUM([cities.rev])', 'money', ''), ('City EBITDA per month', '=SUM([cities.ebitda])', 'money', ''),
            ('Margin', '=IF(SUM([cities.rev])>0,SUM([cities.ebitda])/SUM([cities.rev]),0)', 'pct', ''), ('Cities at a loss', '=COUNTIF([cities.status],"Loss")', 'int', '')])
    s.table('cities', [
        I('city', 'City', 'text', 11), I('veh', 'Average fleet', 'int', 9), I('rides', 'Rides', 'int', 10), I('net', 'Net revenue per ride', 'money2', 10),
        I('field', 'Swaps and field', 'money', 11), I('repair', 'Repair and parts', 'money', 11), I('fees', 'Permit and insurance', 'money', 11), I('site', 'Warehouse and staff', 'money', 11),
        F('rev', 'Net revenue', '={rides}*{net}', 'money', 11, total='sum'),
        F('ebitda', 'EBITDA', '={rev}-{field}-{repair}-{fees}-{site}', 'money', 11, total='sum'),
        F('margin', 'Margin', '=IF({rev}>0,{ebitda}/{rev},"")', 'pct', 8),
        F('pvd', 'Per vehicle per day', '=IF(N({veh})>0,{ebitda}/{veh}/30.44,"")', 'money2', 10),
        S('status', 'Status', '=IF({margin}="","",IF({margin}>=0.1,"Profitable",IF({margin}>=0,"Thin margin","Loss")))'),
    ], title='Cities, last month')
    s.chart('bar', 'EBITDA per vehicle per day', 'cities', 'city', ['pvd'], 'Per vehicle per day')

    s = b.sheet('Payback by model', 'Payback per vehicle by model', 'Which model earns back its cost fastest.', 'Profit per month, payback, lifetime profit and return on cost.')
    s.kpis([('Fastest payback', '=IFERROR(INDEX([models.model],MATCH(MIN([models.pb]),[models.pb],0)),"")', 'text', ''),
            ('Fastest payback, months', '=IFERROR(MIN([models.pb]),"")', 'dec1', ''),
            ('Highest lifetime profit', '=IFERROR(INDEX([models.model],MATCH(MAX([models.lifep]),[models.lifep],0)),"")', 'text', ''),
            ('Models that never pay back', '=COUNTIF([models.status],"Loss")', 'int', 'Within their life')])
    s.table('models', [
        I('model', 'Model', 'text', 16), I('cost', 'Purchase cost', 'money', 10), I('launch', 'Launch cost per vehicle', 'money', 11), I('rev', 'Net revenue per day', 'money2', 10),
        I('opex', 'Running cost per day', 'money2', 10), I('up', 'Uptime', 'pct', 8), I('life', 'Life, months', 'int', 8), I('resale', 'Resale at end', 'money', 9),
        F('month', 'Profit per month', '=({rev}-{opex})*{up}*30.44', 'money', 10),
        F('pb', 'Payback, months', '=IF({month}>0,({cost}+{launch})/{month},"")', 'dec1', 10),
        F('lifep', 'Lifetime profit', '={month}*{life}+{resale}-({cost}+{launch})', 'money', 11),
        F('roi', 'Return on cost', '=IF({cost}+{launch}>0,{lifep}/({cost}+{launch}),"")', 'pct', 9),
        S('status', 'Status', '=IF({model}="","",IF(OR({pb}="",N({pb})>{life}),"Loss",IF({pb}<=12,"Strong","Fair")))'),
    ], title='Models')
    return b


def safety_compliance():
    b = Book(FOLDER, 'safety-compliance'); f = b.d['f']
    s = b.sheet('Incidents', 'Incident log', 'Incidents with root cause and reporting to the city.', 'Incident rate, serious incidents and those not yet reported.')
    s.settings([('rides', 'Rides in the period logged', f['rides'], 'int'), ('limit', 'Rate limit per million rides', f['limit'], 'dec1')])
    s.kpis([('Incidents', '=COUNTA([inc.city])', 'int', ''), ('Per million rides', '=IF(in_rides>0,COUNTA([inc.city])/in_rides*1000000,0)', 'dec1', ''),
            ('Serious or critical', '=COUNTIF([inc.sev],"<>Minor")', 'int', ''), ('Not yet reported to city', '=COUNTIF([inc.status],"Report to city")', 'int', 'Serious, critical or battery fire')])
    s.table('inc', [
        I('date', 'Date', 'days', 12), I('city', 'City', 'text', 10), I('type', 'Type', 'text', 22, opts=['Rider fall', 'Collision with a person', 'Collision with a vehicle', 'Battery fire or smoke', 'Vehicle defect', 'Vandalism or tampering', 'Other']),
        I('sev', 'Severity', 'text', 10, opts=['Minor', 'Serious', 'Critical']), I('veh', 'Vehicle', 'text', 11), I('cause', 'Root cause', 'text', 14, opts=['Open', 'Rider', 'Vehicle defect', 'Road or weather', 'Third party']),
        I('rep', 'Reported to city', 'text', 11, opts=['No', 'Yes', 'Not needed']), I('closed', 'Closed', 'days', 12),
        F('days', 'Days open', '=IF({date}="","",IF({closed}="",-{date},{closed}-{date}))', 'int', 8),
        S('status', 'Status', '=IF({date}="","",IF(AND(OR({sev}<>"Minor",{type}="Battery fire or smoke"),{rep}<>"Yes"),"Report to city",IF({closed}="","Open","Closed")))', 14),
    ], title='Incidents', help='Keep personal data out of this log.')

    s = b.sheet('Recalls', 'Recall and safety campaign tracker', 'Campaigns run to the deadline.', 'Vehicles left, vehicles per day needed and whether each campaign is on plan.')
    s.settings([('wdays', 'Working days per week', f['wdays'], 'int')])
    s.kpis([('Vehicles left to fix', '=SUM([camp.left])', 'int', ''), ('Workshop hours left', '=SUMPRODUCT([camp.left],[camp.min])/60', 'int', ''),
            ('Hours a day needed', '=SUMPRODUCT([camp.perDay],[camp.min])/60', 'dec1', 'To meet every deadline'), ('Behind plan', '=COUNTIF([camp.status],"Behind plan")+COUNTIF([camp.status],"Overdue")', 'int', '')])
    s.table('camp', [
        I('name', 'Campaign', 'text', 30), I('model', 'Model', 'text', 8), I('src', 'Source', 'text', 15, opts=['OEM recall', 'Service bulletin', 'Own campaign', 'Authority order']),
        I('cnt', 'Vehicles affected', 'int', 10, src='n'), I('done', 'Done', 'int', 8), I('start', 'Start', 'days', 12), I('due', 'Deadline', 'days', 12), I('min', 'Minutes per vehicle', 'int', 10),
        F('share', 'Done share', '=IF(N({cnt})>0,{done}/{cnt},"")', 'pct', 9),
        F('left', 'Left', '=MAX(0,{cnt}-{done})', 'int', 8),
        F('perDay', 'Per day needed', '=IF({left}=0,0,{left}/MAX(1,N({due})*in_wdays/7))', 'int', 10),
        S('status', 'Status', '=IF({name}="","",IF({left}=0,"Complete",IF({due}<0,"Overdue",IF({share}<(-{start})/MAX(1,{due}-{start})-0.05,"Behind plan","On track"))))'),
    ], title='Campaigns')

    s = b.sheet('Certificates', 'Type approval and certification register', 'Approvals, insurance and certificates per model and country.', 'Days left, when to start renewal and status.')
    s.kpis([('Valid', '=COUNTIF([cert.status],"Valid")', 'int', ''), ('Expiring in 90 days', '=COUNTIF([cert.status],"Expiring soon")', 'int', 'Start renewal now'),
            ('Expired or missing', '=COUNTIF([cert.status],"Expired")+COUNTIF([cert.status],"Missing")', 'int', 'Vehicles may not run'),
            ('Next expiry', '=_xlfn.MINIFS([cert.exp],[cert.exp],">=0")', 'days', '')])
    s.table('cert', [
        I('item', 'Document', 'text', 36), I('model', 'Model', 'text', 7), I('country', 'Country', 'text', 10), I('num', 'Number', 'text', 16), I('exp', 'Expires', 'days', 13),
        I('owner', 'Owner', 'text', 12), I('lead', 'Renewal lead time, days', 'int', 11),
        F('startBy', 'Start renewal', '=IF(OR({exp}="",{lead}=""),"",{exp}-{lead})', 'days', 13),
        S('status', 'Status', '=IF({item}="","",IF(OR({num}="",{num}="None"),"Missing",IF({exp}="","Valid",IF({exp}<0,"Expired",IF(OR({exp}<=90,{exp}<=N({lead})),"Expiring soon","Valid")))))', 14),
    ], title='Certificates and approvals', help='Leave Expires empty for documents without an end date; write None in Number while a document is missing.')
    return b


def governance():
    b = Book(FOLDER, 'governance'); f = b.d['f']
    roles = [('rCity', 'City ops'), ('rField', 'Field ops'), ('rRepair', 'Repair'), ('rParts', 'Parts'), ('rNpi', 'NPI'), ('rFin', 'Finance'), ('rLead', 'Ops lead')]
    s = b.sheet('KPI dictionary', 'KPI dictionary', 'One definition, one owner per KPI.', 'Latest value against target per KPI.')
    s.kpis([('KPIs defined', '=COUNTA([kpis.name])', 'int', ''), ('On target', '=COUNTIF([kpis.status],"On target")', 'int', ''), ('Off target', '=COUNTIF([kpis.status],"Off target")', 'int', '')])
    s.table('kpis', [I('name', 'KPI', 'text', 26), I('formula', 'Formula', 'text', 40), I('owner', 'Owner', 'text', 12), I('source', 'Source', 'text', 14),
                     I('freq', 'Frequency', 'text', 10, opts=['Daily', 'Weekly', 'Monthly']), I('dir', 'Better is', 'text', 9, opts=['Higher', 'Lower']), I('target', 'Target', 'num', 8), I('value', 'Latest', 'num', 8),
                     S('status', 'Status', '=IF(OR({target}="",{value}=""),"",IF(IF({dir}="Lower",{value}<={target},{value}>={target}),"On target","Off target"))')], title='KPIs')

    s = b.sheet('RACI', 'RACI by process', 'Who is responsible and accountable for each process.', 'Exactly one A per process.')
    s.kpis([('Processes', '=COUNTA([raci.proc])', 'int', ''), ('Clear', '=COUNTIF([raci.status],"Clear")', 'int', 'Exactly one A'),
            ('Gaps', '=COUNTIF([raci.status],"No A")+COUNTIF([raci.status],"Two A")', 'int', ''),
            ('Busiest A', '=INDEX([roles._label],MATCH(MAX([roles.a]),[roles.a],0))', 'text', 'Team accountable for the most processes')])
    s.table('raci', [I('proc', 'Process', 'text', 32)] + [I(k, lab, 'text', 10, opts=['', 'R', 'A', 'C', 'I']) for k, lab in roles] + [
        F('a', 'A count', '=COUNTIF({rCity}:{rLead},"A")', 'int', 8),
        S('status', 'Status', '=IF({proc}="","",IF({a}=0,"No A",IF({a}>1,"Two A","Clear")))', 10)], title='Matrix', help='R does the work, A owns the result, C is asked before, I is told after.')
    s.table('roles', [LBL('Team', 14), F('a', 'Processes accountable', ['=COUNTIF([raci.%s],"A")' % k for k, _ in roles], 'int', 14), F('r', 'Processes responsible', ['=COUNTIF([raci.%s],"R")' % k for k, _ in roles], 'int', 14)],
            fixed=[lab for _, lab in roles], title='Load by team')

    s = b.sheet('Weekly review', 'Weekly ops review', 'All numbers cut off at the same time each week.', 'Deployable rate, rides per vehicle and queue against targets.')
    s.settings([('tDep', 'Deployable rate target', f['tDep'], 'pct'), ('tRpvd', 'Rides per vehicle per day target', f['tRpvd'], 'dec1'), ('tBacklog', 'Workshop queue limit', f['tBacklog'], 'int')])
    s.kpis([('Deployable rate, last week', '=INDEX([weeks.rate],MATCH(MAX([weeks.week]),[weeks.week],0))', 'pct', ''),
            ('Rides per vehicle per day, last week', '=INDEX([weeks.rpvd],MATCH(MAX([weeks.week]),[weeks.week],0))', 'dec2', ''),
            ('Workshop queue, last week', '=INDEX([weeks.queue],MATCH(MAX([weeks.week]),[weeks.week],0))', 'int', ''),
            ('Status, last week', '=INDEX([weeks.status],MATCH(MAX([weeks.week]),[weeks.week],0))', 'status', '')])
    s.table('weeks', [
        I('week', 'Week', 'weeks', 13), I('fleet', 'Active fleet', 'int', 9), I('dep', 'Deployable', 'int', 9), I('rides', 'Rides', 'int', 10), I('fixed', 'Repairs done', 'int', 9),
        I('queue', 'Workshop queue', 'int', 9), I('parts', 'Awaiting parts', 'int', 9), I('sla', 'SLA breaches', 'int', 8), I('inc', 'Serious incidents', 'int', 9),
        F('rate', 'Deployable rate', '=IF(N({fleet})>0,{dep}/{fleet},"")', 'pct', 10),
        F('rpvd', 'Rides per vehicle per day', '=IF(N({dep})>0,{rides}/{dep}/7,"")', 'dec2', 11),
        S('status', 'Status', '=IF({rate}="","",IF(OR({rate}<in_tDep,{rpvd}<in_tRpvd,{queue}>in_tBacklog),"Off target","On target"))'),
    ], title='Weeks')
    s.chart('line', 'Deployable rate by week', 'weeks', 'week', ['rate'], 'Deployable rate')

    s = b.sheet('Decisions', 'Decision log', 'Every decision that changes a rule, KPI, priority or budget.', 'Open decisions and reviews due.')
    s.kpis([('Decisions logged', '=COUNTA([dec.what])', 'int', ''), ('Open', '=COUNTIF([dec.state],"Open")', 'int', ''), ('Reviews due', '=COUNTIF([dec.status],"Review due")', 'int', '')])
    s.table('dec', [I('date', 'Date', 'days', 12), I('area', 'Area', 'text', 11, opts=['Allocation', 'Fleet', 'Repair', 'Parts', 'Field ops', 'NPI', 'Supply', 'Finance', 'Safety', 'Governance']),
                    I('what', 'Decision', 'text', 50), I('by', 'Decided by', 'text', 12), I('state', 'State', 'text', 10, opts=['Open', 'Decided', 'Reversed']), I('review', 'Review on', 'days', 12),
                    S('status', 'Status', '=IF({what}="","",IF({state}="Open","Open",IF({state}="Reversed","Closed",IF(AND({review}<>"",{review}<0),"Review due","Decided"))))')], title='Decisions')

    s = b.sheet('Escalation', 'Escalation matrix', 'Who acts, and when it goes up a level.', 'A named person at each level for each issue.')
    s.kpis([('Issues covered', '=COUNTIF([esc.status],"Ready")', 'int', 'All three levels named'), ('Gaps', '=COUNTIF([esc.status],"Gaps")', 'int', ''), ('Fastest first response, hours', '=MIN([esc.hours])', 'dec1', '')])
    s.table('esc', [LBL('Issue', 36), I('trigger', 'Trigger', 'text', 30), I('l1', 'Level 1', 'text', 14), I('l2', 'Level 2', 'text', 14), I('l3', 'Level 3', 'text', 14),
                    I('hours', 'Response, hours', 'dec1', 10), I('channel', 'Channel', 'text', 14),
                    S('status', 'Status', '=IF(AND({l1}<>"",{l2}<>"",{l3}<>""),"Ready",IF(OR({l1}<>"",{l2}<>"",{trigger}<>""),"Gaps",""))', 9)], title='Issues')
    return b


ALL = ['city_allocation', 'fleet_health', 'repair_maintenance', 'parts_batteries', 'field_operations', 'npi', 'supply_suppliers', 'unit_economics', 'safety_compliance', 'governance']
