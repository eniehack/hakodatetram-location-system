import Papa from 'papaparse';

interface TripRow {
	trip_id: string;
	trip_headsign: string;
}

export interface TripJsonRecord {
	trip_id: string;
	trip_headsign: string;
}

export function generateTripJson(csv: string): TripJsonRecord[] {
	const parsed = Papa.parse<TripRow>(csv, {
		header: true,
		skipEmptyLines: true
	});

	if (parsed.errors.length > 0) {
		throw new Error(`trips.txt のパースに失敗しました: ${JSON.stringify(parsed.errors)}`);
	}

	const fields = parsed.meta.fields ?? [];
	for (const column of ['trip_id', 'trip_headsign']) {
		if (!fields.includes(column)) {
			throw new Error(`trips.txt に必須カラム "${column}" がありません`);
		}
	}

	const seen = new Set<string>();
	const records: TripJsonRecord[] = [];
	for (const row of parsed.data) {
		if (!row.trip_id) {
			throw new Error('trip_id が空の行があります');
		}
		if (seen.has(row.trip_id)) {
			throw new Error(`trip_id "${row.trip_id}" が重複しています`);
		}
		seen.add(row.trip_id);
		records.push({ trip_id: row.trip_id, trip_headsign: row.trip_headsign });
	}

	return records;
}
