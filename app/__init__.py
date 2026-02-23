import os

from flask import Flask, Response
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
    with duckdb.connect("identifier.db") as conn:
        stops = conn.query("""with hbf_ids as (select stop_id
                 from stops
                 where stop_name in ('Mainz, Hauptbahnhof', 'Mainz, Hbf West/Taubertsbergb.')),
     time_to_hbf as (select stops.stop_id as stop_id,
                            stops.stop_name as stop_name,
                            gtfs_to_seconds(hbf_times.departure_time) - gtfs_to_seconds(stop_times.departure_time) as hbf_diff,
                            gtfs_to_seconds(hbf_times.departure_time) as departure_time,
                            stops.stop_lat,
                            stops.stop_lon,
                            routes.route_short_name
                     from trips
                              left join routes on routes.route_id = trips.route_id
                              left join stop_times on stop_times.trip_id = trips.trip_id
                              left join stops on stops.stop_id = stop_times.stop_id
                              join stop_times as hbf_times
                                   on hbf_times.trip_id = stop_times.trip_id
                                       and hbf_times.stop_id in (select * from hbf_ids)
                                       and hbf_times.stop_sequence > stop_times.stop_sequence),
    routes_with_duration as (select stop_name,
                                    min(hbf_diff) / 60 as minutes_to_hbf,
                                    min(departure_time),
                                    max(departure_time),
                                    min(stop_lat) as lat,
                                    min(stop_lon) as lon,
                                    route_short_name
                            from time_to_hbf
                            group by stop_name, route_short_name
                            order by stop_name)
select *
from routes_with_duration
order by stop_name, minutes_to_hbf;""").fetchall()

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
                 'route_short_name': stop[6]}
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
