import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { defineCommand, runMain } from 'citty';
import { generateTripJson } from './generateTripJson';

const stripBom = (text: AllowSharedBufferSource): string => {
	return new TextDecoder().decode(text);
};

const main = defineCommand({
	meta: {
		name: 'import-trip'
	},
	args: {
		input: {
			type: 'string',
			default: join(import.meta.dirname, '../tmp/trips.txt')
		},
		output: {
			type: 'string',
			default: join(import.meta.dirname, '../static/trips.json')
		},
		stdout: {
			type: 'boolean',
			default: false
		}
	},
	run({ args }) {
		try {
			console.log('📖 Reading trips.txt...');

			// GTFS trips.txt読み込み
			const tripsCSVFile = readFileSync(args.input);
			const tripsCSV = stripBom(tripsCSVFile);

			const tripJson = generateTripJson(tripsCSV);
			if (args.stdout) {
				console.log(JSON.stringify(tripJson));
			} else {
				writeFileSync(args.output, JSON.stringify(tripJson));
			}
		} catch (error) {
			console.error('❌ Import failed:', error);
		}
	}
});

runMain(main);
