import { describe, expect, it } from 'vitest';
import { collectionFromQuery } from './collectionQuery';

describe('collection mode from the address', () => {
	it('turns on with ?collect, off with ?collect=off, and otherwise keeps the stored choice', () => {
		expect(collectionFromQuery('?collect', false)).toBe(true);
		expect(collectionFromQuery('?collect=on', false)).toBe(true);
		expect(collectionFromQuery('?collect=off', true)).toBe(false);
		expect(collectionFromQuery('?collect=0', true)).toBe(false);
		expect(collectionFromQuery('?debug', false)).toBe(true);
		expect(collectionFromQuery('', true)).toBe(true);
		expect(collectionFromQuery('?level=3', false)).toBe(false);
	});
});
