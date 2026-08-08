import type { PageLoad } from './$types';

interface TripHeadsignRecord {
	trip_id: string;
	trip_headsign: string;
}

export const load: PageLoad = async ({ fetch }) => {
	const tripRes = await fetch('/trips.json');
	const records: TripHeadsignRecord[] = await tripRes.json();
	return {
		tripHeadsigns: new Map(records.map((r) => [r.trip_id, r.trip_headsign]))
	};
};
