import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import gtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { EventEmitter } from 'events';
import type { D1Database } from '@cloudflare/workers-types';
import * as v from 'valibot';
import { vValidator } from '@hono/valibot-validator';

const emitter = new EventEmitter();

setInterval(async () => {
	const resp = await fetch(
		'https://api-public.odpt.org/api/v4/gtfs/realtime/odpt_HakodateCity_Alllines_vehicle'
	);
	if (!resp.ok) {
		throw new Error(`${resp.status}`);
	}
	const buffer = await resp.arrayBuffer();
	const feed = gtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
	console.debug(feed.toJSON());
	const data = {
		ts: new Date().toISOString(),
		entities: feed.entity.map((entity) => {
			console.debug(entity.vehicle);
			if (entity.vehicle) return entity.vehicle;
		})
	};
	emitter.emit('vehicle-update', data);
}, 1000 * 30);

setInterval(async () => {
	const resp = await fetch(
		'https://api-public.odpt.org/api/v4/gtfs/realtime/odpt_HakodateCity_Alllines_trip_update'
	);
	if (!resp.ok) {
		throw new Error(`${resp.status}`);
	}
	const buffer = await resp.arrayBuffer();
	const feed = gtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
	console.debug(feed.toJSON());
	const data = {
		ts: new Date().toISOString(),
		entities: feed.entity.map((entity) => {
			console.debug(entity.tripUpdate);
			if (entity.tripUpdate) return entity.tripUpdate;
		})
	};
	emitter.emit('trip-update', data);
}, 1000 * 30);

type Bindings = {
	DB: D1Database;
};

const tripParamsSchema = v.object({
	id: v.string()
});

export const router = new Hono<{ Bindings: Bindings }>()
	.get('/trip', vValidator('query', tripParamsSchema), async (c) => {
		console.debug('trip');
		const { id: encodedId } = c.req.valid('query');
		console.debug(encodedId);
		const id = decodeURIComponent(encodedId);
		const result = (await c.env.DB.prepare('SELECT trip_headsign FROM trips WHERE trip_id = ?')
			.bind(id)
			.first()) as null | { trip_headsign: string };
		if (!result) {
			return c.json({}, 404);
		}
		return c.json({ headsign: result.trip_headsign }, 200);
	})
	.get('/rt', async (c) => {
		return streamSSE(c, async (stream) => {
			const vehicleUpdate = (data) => {
				stream.writeSSE({
					event: 'vehicle-update',
					data: JSON.stringify(data)
				});
			};
			const tripUpdate = (data) => {
				stream.writeSSE({
					event: 'trip-update',
					data: JSON.stringify(data)
				});
			};
			emitter.on('vehicle-update', vehicleUpdate);
			emitter.on('trip-update', tripUpdate);
			while (true) {
				await new Promise((resolve) => setTimeout(resolve, 1000 * 30));
			}

			stream.onAbort(() => {
				emitter.off('data-update', vehicleUpdate);
			});
		});
	});

export type Router = typeof router;
export const app = new Hono().route('/api', router);
