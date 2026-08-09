import { test, expect } from 'vitest';
import { generateTripJson } from './generateTripJson';

test('trips.txt を trip_id / trip_headsign のレコード配列に変換する', () => {
	const input = `route_id,service_id,trip_id,trip_headsign,block_id,trip_short_name,direction_id,shape_id,bikes_allowed
⑤_A,平日,平日_06時07分_系統5-1-9,湯の川,,,,5-1-9,0
`;
	expect(generateTripJson(input)).toEqual([
		{ trip_id: '平日_06時07分_系統5-1-9', trip_headsign: '湯の川' }
	]);
});

test('BOM付きCSVでもカラムを正しく取得できる', () => {
	const input = `﻿route_id,service_id,trip_id,trip_headsign,block_id,trip_short_name,direction_id,shape_id,bikes_allowed
⑤_A,平日,平日_06時07分_系統5-1-9,湯の川,,,,5-1-9,0
`;
	expect(generateTripJson(input)).toEqual([
		{ trip_id: '平日_06時07分_系統5-1-9', trip_headsign: '湯の川' }
	]);
});

test('trip_idが重複している場合は例外を投げる', () => {
	const input = `route_id,service_id,trip_id,trip_headsign,block_id,trip_short_name,direction_id,shape_id,bikes_allowed
⑤_A,平日,平日_06時07分_系統5-1-9,湯の川,,,,5-1-9,0
⑤_A,平日,平日_06時07分_系統5-1-9,函館駅前,,,,5-1-9,0
`;
	expect(() => generateTripJson(input)).toThrow();
});

test('必須カラムが欠けている場合は例外を投げる', () => {
	const input = `route_id,service_id,trip_id,block_id,trip_short_name,direction_id,shape_id,bikes_allowed
⑤_A,平日,平日_06時07分_系統5-1-9,,,,5-1-9,0
`;
	expect(() => generateTripJson(input)).toThrow();
});

test('trip_headsignが空文字の行は空文字のまま出力する', () => {
	const input = `route_id,service_id,trip_id,trip_headsign,block_id,trip_short_name,direction_id,shape_id,bikes_allowed
⑤_A,平日,平日_06時07分_系統5-1-9,,,,,5-1-9,0
`;
	expect(generateTripJson(input)).toEqual([
		{ trip_id: '平日_06時07分_系統5-1-9', trip_headsign: '' }
	]);
});
