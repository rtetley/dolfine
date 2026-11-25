import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isRecord, mergeDefaults, readStored, writeStored } from './persisted';
import { memoryStorage } from './testStorage';

const isNumber = (value: unknown): value is number => typeof value === 'number';

describe('readStored / writeStored', () => {
	let storage: Storage;

	beforeEach(() => {
		storage = memoryStorage();
		vi.stubGlobal('localStorage', storage);
	});

	afterEach(() => vi.unstubAllGlobals());

	it('round-trips JSON under the dolfine prefix', () => {
		writeStored('tempo', 96);
		expect(storage.getItem('dolfine:tempo')).toBe('96');
		expect(readStored('tempo', 60, isNumber)).toBe(96);
	});

	it('falls back when the key is missing, corrupt or fails validation', () => {
		expect(readStored('missing', 60, isNumber)).toBe(60);
		storage.setItem('dolfine:corrupt', '{not json');
		expect(readStored('corrupt', 60, isNumber)).toBe(60);
		storage.setItem('dolfine:wrong', '"fast"');
		expect(readStored('wrong', 60, isNumber)).toBe(60);
	});

	it('survives storage that throws (private mode, quota)', () => {
		vi.stubGlobal('localStorage', {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('quota');
			}
		});
		expect(() => writeStored('tempo', 1)).not.toThrow();
		expect(readStored('tempo', 60, isNumber)).toBe(60);
	});

	it('works when there is no storage at all', () => {
		vi.stubGlobal('localStorage', undefined);
		expect(() => writeStored('tempo', 1)).not.toThrow();
		expect(readStored('tempo', 60, isNumber)).toBe(60);
	});
});

describe('isRecord', () => {
	it.each([
		[{}, true],
		[{ a: 1 }, true],
		[[], false],
		[null, false],
		['x', false],
		[3, false]
	])('%j → %s', (value, expected) => {
		expect(isRecord(value)).toBe(expected);
	});
});

describe('mergeDefaults', () => {
	const defaults = { level: 3, staff: 'treble', cursor: true };

	it('keeps stored values only when their type matches the default', () => {
		expect(mergeDefaults(defaults, { level: 7, staff: 42, cursor: false })).toEqual({
			level: 7,
			staff: 'treble',
			cursor: false
		});
	});

	it('drops unknown keys and fills missing ones', () => {
		expect(mergeDefaults(defaults, { level: 5, legacy: 'x' })).toEqual({ ...defaults, level: 5 });
	});

	it('returns the defaults for non-object input', () => {
		expect(mergeDefaults(defaults, null)).toBe(defaults);
		expect(mergeDefaults(defaults, ['level'])).toBe(defaults);
	});
});
