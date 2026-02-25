import os

from flask import Flask, request
import duckdb
from jinja2 import Environment, FileSystemLoader, select_autoescape

app = Flask(__name__)

def create_app():
    return app

env = Environment(
    loader=FileSystemLoader('%s/templates/' % os.path.dirname(__file__)),
    autoescape=select_autoescape()
)

@app.route('/stops')
def retrieve_stops():
    timeOfDay = request.args.get('timeOfDay')
    startTime = 0
    endTime = 180000
    if timeOfDay == 'day':
        startTime = 6 * 60 * 60 # 06:00
        endTime = 21 * 60 * 60 # 21:00
    if timeOfDay == 'night':
        startTime = 21 * 60 * 60 # 21:00
        endTime = 30 * 60 * 60 # 06:00
    with duckdb.connect("identifier.db") as conn:
        stops = conn.execute("""with hbf_ids as (select stop_id
                 from stops
                 where stop_name in ('Mainz, Hauptbahnhof', 'Mainz, Hbf West/Taubertsbergb.')),
     time_to_hbf as (select stops.stop_id as stop_id,
                            stops.stop_name as stop_name,
                            gtfs_to_seconds(hbf_times.departure_time) - gtfs_to_seconds(stop_times.departure_time) as hbf_diff,
                            gtfs_to_seconds(hbf_times.departure_time) as departure_time,
                            stops.stop_lat,
                            stops.stop_lon,
                            routes.route_short_name,
                            trips.trip_headsign,
                            calendar.monday,
                            calendar.tuesday,
                            calendar.wednesday,
                            calendar.thursday,
                            calendar.friday,
                            calendar.saturday,
                            calendar.sunday
                     from trips
                              left join routes on routes.route_id = trips.route_id
                              left join stop_times on stop_times.trip_id = trips.trip_id
                              left join stops on stops.stop_id = stop_times.stop_id
                                join calendar on trips.service_id = calendar.service_id
                                and CAST(strftime(current_date, '%Y%m%d') AS BIGINT)
                                    between calendar.start_date and calendar.end_date
                              join stop_times as hbf_times
                                   on hbf_times.trip_id = stop_times.trip_id
                                       and hbf_times.stop_id in (select * from hbf_ids)
                                       and hbf_times.stop_sequence > stop_times.stop_sequence
                              where monday + tuesday + wednesday + thursday + friday + saturday + sunday > 1),
    routes_with_duration as (select stop_name,
                                    min(hbf_diff) / 60 as minutes_to_hbf,
                                    min(departure_time),
                                    max(departure_time),
                                    min(stop_lat) as lat,
                                    min(stop_lon) as lon,
                                    route_short_name,
                                    max(monday), 
                                    max(tuesday), 
                                    max(wednesday), 
                                    max(thursday), 
                                    max(friday), 
                                    max(saturday), 
                                    max(sunday)
                            from time_to_hbf
                            where departure_time between ? and ? 
                            group by stop_name, route_short_name
                            order by stop_name)
select *
from routes_with_duration
order by routes_with_duration.stop_name, routes_with_duration.minutes_to_hbf;""", [startTime, endTime]).fetchall()

    last_stop_name = ''
    current_stop = {}
    current_fastest = 990
    stops_with_routes = []

    for stop in stops:
        if last_stop_name != stop[0]:
            current_stop['fastest_connection'] = current_fastest
            stops_with_routes.append(current_stop)
            stops_with_routes.append(current_stop)
            current_fastest = 99
            last_stop_name = stop[0]
            current_stop = {'stop_name': stop[0],
                            'stop_lat': stop[4],
                            'stop_lon': stop[5],
                            'routes': []}
        route = {'stop_name': stop[0],
                 'minutes_to_hbf': stop[1],
                 'first_trip': stop[2],
                 'last_trip': stop[3],
                 'route_short_name': stop[6],
                 'monday': stop[7],
                 'tuesday': stop[8],
                 'wednesday': stop[9],
                 'thursday': stop[10],
                 'friday': stop[11],
                 'saturday': stop[12],
                 'sunday': stop[13]}
        if current_fastest > route['minutes_to_hbf']:
            current_fastest = route['minutes_to_hbf']
        current_stop['routes'].append(route)

    if current_stop is not None:
        current_stop['fastest_connection'] = current_fastest
        stops_with_routes.append(current_stop)

    return stops_with_routes

@app.route('/')
def route_with_ts():
    return env.get_template("home.html").render()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)
