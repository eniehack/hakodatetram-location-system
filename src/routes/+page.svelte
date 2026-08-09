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
		Popup,
		SymbolLayer
	} from 'svelte-maplibre-gl';
	import { vehicleUpdate } from '$lib/models/vehiclePosition';
	import Modal from './Modal.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

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
	let isModalOpen = $state(true);

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

<Modal bind:isOpen={isModalOpen} />

<div class="fixed top-14 bottom-0">
	<MapLibre
		class="h-full w-[100vw]"
		style="https://tile.openstreetmap.jp/styles/openmaptiles/style.json"
		zoom={13}
		center={{ lon: 140.7431, lat: 41.77477 }}
		bind:map
	>
		<NavigationControl />
		<ScaleControl />
		<!-- <RasterTileSource
			tiles={['https://tile.openstreetmap.org/{z}/{x}/{y}.png']}
			tileSize={256}
			attribution="<a href=&quot;https://www.openstreetmap.org/copyright&quot;>&copy; OpenStreetMap contributors</a>"
		>
			<RasterLayer />
		</RasterTileSource> -->
		<GeoJSONSource
			attribution="&copy; <a target=&quot;_blank&quot; href=&quot;https://www.city.hakodate.hokkaido.jp/docs/2020052700015/&quot;>函館市企業局交通部</a>"
			data={resolve('/shapes.json')}
		>
			<LineLayer
				paint={{
					'line-color': ['coalesce', ['get', 'route_color'], 'white']
				}}
			/>
		</GeoJSONSource>
		<GeoJSONSource
			data="/stops.json"
			attribution="&copy; <a target=&quot;_blank&quot; href=&quot;https://www.city.hakodate.hokkaido.jp/docs/2020052700015/&quot;>函館市企業局交通部</a>"
		>
			<CircleLayer
				paint={{
					'circle-radius': 7,
					'circle-stroke-color': 'white',
					'circle-stroke-width': 3
				}}
			/>
			<SymbolLayer
				paint={{
					'text-halo-width': 2,
					'text-halo-color': 'white'
				}}
				layout={{
					'text-font': ['Noto Sans Bold'],
					'text-offset': [0, 1.5],
					'text-field': ['get', 'stop_name']
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
					onmouseenter={(e) => {
						map!.getCanvas().style.cursor = 'pointer';
						const coordinates = e.features[0].geometry.coordinates.slice();
						const properties = e.features[0].properties;
						const headsign = data.tripHeadsigns.get(properties.trip_id);
						popup = { coord: coordinates, content: headsign ?? 'err' };
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
