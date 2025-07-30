import { json, type RequestHandler } from '@sveltejs/kit';
import { convertGTFSToGeoJSON } from '$lib/gtfs/shapes';

export const prerender = true;

export const GET: RequestHandler = async () => {
	try {
		const geoJSON = convertGTFSToGeoJSON();

		return new Response(JSON.stringify(geoJSON, null, 2), {
			headers: {
				'Content-Type': 'application/geo+json',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch (error) {
		console.error('GTFS conversion error:', error);
		return json({ error: 'Failed to convert GTFS data' }, { status: 500 });
	}
};
