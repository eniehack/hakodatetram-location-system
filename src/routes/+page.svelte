<script lang="ts">
	import { resolve } from '$app/paths';
	import * as v from 'valibot';
	import { onDestroy, onMount } from 'svelte';
	import type { Point, FeatureCollection, Feature } from 'geojson';
	import {
		MapLibre,
		RasterTileSource,
		RasterLayer,
		NavigationControl,
		ScaleControl,
		GeoJSONSource,
		LineLayer,
		CircleLayer,
		Popup
	} from 'svelte-maplibre-gl';
	import { vehicleUpdate } from '$lib/models/vehiclePosition';
	import { makeClient } from './api/[...route]/apiClient';

	let rt = $state<EventSource>();
	let vehicleMap = $state<Map<string, { position: { lat: number; lng: number } }>>(new Map());
	let tripMap = $state<Map<string, any>>(new Map());
	let vehiclesGeoJson = $derived.by<FeatureCollection<Point>>(() => {
		const json = {
			type: 'FeatureCollection',
			features: [] as Feature<Point>[]
		};
		for (const [k, v] of vehicleMap) {
			const routeNumberPart = k.match(/(\d)-\d+-\d+$/);
			json.features.push({
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [v.position.lng, v.position.lat]
				},
				properties: {
					route: routeNumberPart ? routeNumberPart[1] : undefined,
					trip_id: k,
					delay: tripMap.has(k) ? tripMap.get(k).departure.delay : undefined
				}
			});
		}
		return json;
	});
	let map = $state<maplibregl.Map>();
	let apiClient = $state(makeClient(fetch));

	onMount(() => {
		rt = new EventSource(resolve(`/api/rt`));
		rt.onopen = () => console.debug('SSE connected');
		rt.onerror = (error) => console.debug('SSE error:', error);
		rt.addEventListener('trip-update', (event) => {
			console.debug('trip-update', event.data);
			const json = JSON.parse(event.data);
			const elem: [string, any][] = json.entities.map((e) => [e.trip.tripId, e.stopTimeUpdate[0]]);
			console.debug(elem);
			tripMap = new Map(elem);
		});
		rt.addEventListener('vehicle-update', (event) => {
			const json = v.parse(vehicleUpdate, JSON.parse(event.data));
			const elem: [string, { position: { lng: number; lat: number } }][] = json.entities.map(
				(e) => [
					e.trip.tripId,
					{ position: { lng: e.position.longitude, lat: e.position.latitude } }
				]
			);
			vehicleMap = new Map(elem);
		});
	});
	onDestroy(() => {
		if (rt) rt.close();
	});
	let popup = $state<{ coord: [number, number]; content: string } | undefined>();
</script>

<div class="fixed top-14 bottom-0">
	<MapLibre class="h-full w-[100vw]" zoom={14} center={{ lon: 140.7431, lat: 41.77477 }} bind:map>
		<NavigationControl />
		<ScaleControl />
		<RasterTileSource
			tiles={['https://tile.openstreetmap.org/{z}/{x}/{y}.png']}
			tileSize={256}
			attribution="<a href=&quot;https://www.openstreetmap.org/copyright&quot;>&copy; OpenStreetMap contributors</a>"
		>
			<RasterLayer />
		</RasterTileSource>
		<GeoJSONSource
			attribution="&copy; <a href=&quot;https://www.city.hakodate.hokkaido.jp/tram/&quot;>函館市企業局交通部</a> <a href=&quot;https://gtfs-jp.org/GTFS-RUL(ODPT).pdf&quot;>（ODPT GTFS-RU）</a>"
			data={resolve('/shapes.json')}
		>
			<LineLayer
				paint={{
					'line-color': ['coalesce', ['get', 'route_color'], 'white']
				}}
			/>
		</GeoJSONSource>
		{#if typeof vehiclesGeoJson !== 'undefined'}
			<GeoJSONSource data={vehiclesGeoJson}>
				<CircleLayer
					paint={{
						'circle-color': ['match', ['get', 'route'], '2', 'red', '5', 'blue', 'black'],
						'circle-radius': 7,
						'circle-stroke-color': 'white',
						'circle-stroke-width': 3
					}}
					onmouseenter={async (e) => {
						map!.getCanvas().style.cursor = 'pointer';
						const coordinates = e.features[0].geometry.coordinates.slice();
						const properties = e.features[0].properties;
						const resp = await apiClient.trip.$get({ query: { id: properties.trip_id } });
						if (!resp.ok) {
							popup = { coord: coordinates, content: 'err' };
							return;
						}
						const { headsign } = await resp.json();
						popup = { coord: coordinates, content: headsign };
					}}
					onmouseleave={() => {
						map!.getCanvas().style.cursor = '';
						popup = undefined;
					}}
				/>
			</GeoJSONSource>
		{/if}
		{#if typeof popup !== 'undefined'}
			<Popup lnglat={popup.coord} open={typeof popup !== 'undefined'}>
				{popup.content}
			</Popup>
		{/if}
	</MapLibre>
</div>
