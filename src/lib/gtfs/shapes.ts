import Papa from 'papaparse';
import { readFileSync } from 'fs';
import path, { join } from 'path';

interface ShapePoint {
	shape_id: string;
	shape_pt_lat: number;
	shape_pt_lon: number;
	shape_pt_sequence: number;
}

interface Trip {
	route_id: string;
	service_id: string;
	trip_id: string;
	trip_headsign?: string;
	shape_id: string;
}

interface Route {
	route_id: string;
	route_short_name: string;
	route_long_name: string;
	route_type: string;
	route_color?: string;
}

interface GeoJSONFeature {
	type: 'Feature';
	properties: {
		shape_id: string;
		route_id: string;
		route_name: string;
		route_color: string;
	};
	geometry: {
		type: 'LineString';
		coordinates: [number, number][];
	};
}

interface GeoJSONFeatureCollection {
	type: 'FeatureCollection';
	features: GeoJSONFeature[];
}

export function convertGTFSToGeoJSON(): GeoJSONFeatureCollection {
	const assetsDir = join(process.cwd(), 'src/assets/');
	// CSVファイル読み込み
	const shapesCSV = readFileSync(join(assetsDir, 'shapes.txt'), 'utf-8');
	const tripsCSV = readFileSync(join(assetsDir, 'trips.txt'), 'utf-8');
	const routesCSV = readFileSync(join(assetsDir, 'routes.txt'), 'utf-8');

	// CSVパース
	const shapes = Papa.parse<ShapePoint>(shapesCSV, {
		header: true,
		skipEmptyLines: true,
		transform: (value, field) => {
			if (['shape_pt_lat', 'shape_pt_lon'].includes(field as string)) {
				return parseFloat(value);
			}
			if (field === 'shape_pt_sequence') {
				return parseInt(value, 10);
			}
			return value;
		}
	}).data;

	const trips = Papa.parse<Trip>(tripsCSV, {
		header: true,
		skipEmptyLines: true
	}).data;

	const routes = Papa.parse<Route>(routesCSV, {
		header: true,
		skipEmptyLines: true
	}).data;

	// ルートマップ作成
	const routeMap = new Map<string, Route>();
	routes.forEach((route) => {
		routeMap.set(route.route_id, route);
	});

	// shape_idとroute_idの関連付け
	const shapeToRoute = new Map<string, string>();
	trips.forEach((trip) => {
		if (trip.shape_id && trip.route_id) {
			shapeToRoute.set(trip.shape_id, trip.route_id);
		}
	});

	// shape_idごとにポイントをグループ化
	const shapeGroups = new Map<string, ShapePoint[]>();
	shapes.forEach((point) => {
		if (!shapeGroups.has(point.shape_id)) {
			shapeGroups.set(point.shape_id, []);
		}
		shapeGroups.get(point.shape_id)!.push(point);
	});

	// GeoJSON生成
	const features: GeoJSONFeature[] = [];

	shapeGroups.forEach((points, shapeId) => {
		const routeId = shapeToRoute.get(shapeId);
		if (!routeId) return;

		const route = routeMap.get(routeId);
		if (!route) return;

		// sequenceでソート
		points.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);

		// 座標配列作成（GeoJSONは[longitude, latitude]の順）
		const coordinates: [number, number][] = points.map((point) => [
			point.shape_pt_lon,
			point.shape_pt_lat
		]);

		// デフォルト色設定
		const routeColor = route.route_color || '#0066CC';

		features.push({
			type: 'Feature',
			properties: {
				shape_id: shapeId,
				route_id: routeId,
				route_name: route.route_short_name || route.route_long_name,
				route_color: `#${routeColor}`
			},
			geometry: {
				type: 'LineString',
				coordinates
			}
		});
	});

	return {
		type: 'FeatureCollection',
		features
	};
}
