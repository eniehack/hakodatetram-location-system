<script lang="ts">
	import { base } from '$app/paths';
	import * as v from 'valibot'
	import { onDestroy, onMount } from 'svelte';
	import type { Point, FeatureCollection } from 'geojson'
	import {
		MapLibre,
		RasterTileSource,
		RasterLayer,
		NavigationControl,
		ScaleControl,
		GeoJSONSource,
		LineLayer,

		CircleLayer

	} from 'svelte-maplibre-gl';
	import { vehicleUpdate } from '$lib/models/vehiclePosition';

	let rt = $state<EventSource>();
	let vehicles = $state<FeatureCollection<Point>>(undefined);

	onMount(() => {
		rt = new EventSource(`${base}/api/rt`)
		rt.onopen = () => console.debug('SSE connected');
		rt.onerror = (error) => console.debug('SSE error:', error);
		rt.addEventListener('vehicle-update', (event) => {
		  const json = v.parse(vehicleUpdate, JSON.parse(event.data))
		  vehicles = {
			"type": "FeatureCollection",
			"features": json.entities.map(entity => {
				return {
					type: "Feature",
					geometry: {
						"type": "Point",
						"coordinates": [entity.position.longitude, entity.position.latitude]
					},
					properties: {}
				}
			})
		  }
		});
	})
	onDestroy(() => {
		if (rt) rt.close();
	})
	$inspect(vehicles)
</script>

<div class="fixed top-14 bottom-0">
	<MapLibre class="h-full w-[100vw]" zoom={14} center={{ lon: 140.7431, lat: 41.77477 }}>
		<NavigationControl />
		<ScaleControl />
		<RasterTileSource
			tiles={['https://tile.openstreetmap.org/{z}/{x}/{y}.png']}
			tileSize={256}
			attribution={`<a href="https://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a>`}
		>
			<RasterLayer />
		</RasterTileSource>
		<GeoJSONSource attribution={'&copy; <a href="https://ckan.odpt.org/organization/hakodate_city">函館市企業局</a> <a href="https://gtfs-jp.org/GTFS-RUL(ODPT).pdf">（ODPT GTFS-RU）</a>'} data={`${base}/shapes.json`}>
			<LineLayer
				paint={{
					'line-color': ['coalesce', ['get', 'route_color'], 'white']
				}}
			/>
		</GeoJSONSource>
		{#if typeof vehicles !== 'undefined'}
			<GeoJSONSource data={vehicles}>
				<CircleLayer />
			</GeoJSONSource>
		{/if}
	</MapLibre>
</div>
