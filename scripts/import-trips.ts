import Papa from 'papaparse';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Trip {
	trip_id: string;
	trip_headsign: string;
	route_id: string;
	service_id: string;
}

function escapeSQL(str: string): string {
	if (!str) return 'NULL';
	return `'${str.replace(/'/g, "''")}'`;
}

async function importTripsToD1() {
	try {
		console.log('📖 Reading trips.txt...');

		// GTFS trips.txt読み込み
		const tripsPath = join(process.cwd(), 'src/assets/trips.txt');
		const tripsCSV = readFileSync(tripsPath, 'utf-8');

		// CSVパース
		const parsed = Papa.parse<Trip>(tripsCSV, {
			header: true,
			skipEmptyLines: true
		});

		if (parsed.errors.length > 0) {
			console.error('❌ CSV Parse errors:', parsed.errors);
			return;
		}

		console.log(`📊 Found ${parsed.data.length} trips`);

		// SQL生成
		const sqlStatements: string[] = [];

		// テーブル作成
		sqlStatements.push(`
      DROP TABLE IF EXISTS trips;
      CREATE TABLE trips (
        trip_id TEXT PRIMARY KEY,
        trip_headsign TEXT,
        route_id TEXT,
        service_id TEXT
      );
    `);

		// データ挿入
		parsed.data.forEach((trip) => {
			if (trip.trip_id) {
				sqlStatements.push(
					`INSERT INTO trips (trip_id, trip_headsign, route_id, service_id) VALUES (${escapeSQL(trip.trip_id)}, ${escapeSQL(trip.trip_headsign)}, ${escapeSQL(trip.route_id)}, ${escapeSQL(trip.service_id)});`
				);
			}
		});

		// SQLファイル書き出し
		const sqlFile = join(process.cwd(), './tmp/trips.sql');
		writeFileSync(sqlFile, sqlStatements.join('\n'));
	} catch (error) {
		console.error('❌ Import failed:', error);
	}
}

// スクリプト実行
importTripsToD1();
