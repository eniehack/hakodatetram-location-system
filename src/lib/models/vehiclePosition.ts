import * as v from 'valibot';

export const vehiclePosition = v.object({
	trip: v.object({ tripId: v.string() }),
	position: v.object({
		latitude: v.number(),
		longitude: v.number()
	})
});

export type vehiclePosition = v.InferOutput<typeof vehiclePosition>;

export const vehicleUpdate = v.object({
	ts: v.string(),
	entities: v.array(vehiclePosition)
});

export type VehicleUpdate = v.InferOutput<typeof vehicleUpdate>;
