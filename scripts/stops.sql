create table stops as select stop_id, stop_code, stop_name, st_point(stop_lon, stop_lat) as geom from read_csv('stops.txt');
copy (select 'Feature' as type, json_object('stop_code', stop_code, 'stop_name', any_value(stop_name)) as 'properties', st_asgeojson(st_centroid(st_collect(list(geom)))) as geometry from stops GROUP BY stop_code) to 'stops.json' (FORMAT 'json', ARRAY true);
