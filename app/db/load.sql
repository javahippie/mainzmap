create table stops as
    from read_csv('db/stops.txt') stops
    where stops.stop_lat between 49.8311 and 50.0547
    and stops.stop_lon between 7.94887 and 8.4226;

create table stop_times AS
    from read_csv('db/stop_times.txt') as times
    WHERE times.stop_id IN (select stop_id from stops);

create table trips AS
    from read_csv('db/trips.txt') as trips
    WHERE trips.trip_id in (SELECT trip_id from stop_times);

create table routes AS
    from read_csv('db/routes.txt') as routes
    WHERE routes.route_id in (SELECT route_id from trips);

create table calendar AS
    from read_csv('app/db/calendar.txt') as calendar
    WHERE calendar.service_id IN (select service_id from trips);

select * from calendar;