import { describe, expect, it, vi } from 'vitest';
import { AsyncStart } from './asyncStart.svelte';

const deferred = () => {
	let resolve = (): void => {};
	const promise = new Promise<void>((done) => (resolve = done));
	return { promise, resolve };
};

describe('AsyncStart', () => {
	it('ignores a second start while the first is still waiting', async () => {
		const guard = new AsyncStart();
		const wait = deferred();
		const begin = vi.fn();
		const first = guard.run(() => wait.promise, begin);
		expect(guard.pending).toBe(true);
		const second = guard.run(() => Promise.resolve(), begin);
		wait.resolve();
		expect(await first).toBe(true);
		expect(await second).toBe(false);
		expect(begin).toHaveBeenCalledOnce();
		expect(guard.pending).toBe(false);
	});

	it('never begins a start cancelled while it waits, and can start again after', async () => {
		const guard = new AsyncStart();
		const wait = deferred();
		const begin = vi.fn();
		const started = guard.run(() => wait.promise, begin);
		guard.cancel();
		expect(guard.pending).toBe(false);
		wait.resolve();
		expect(await started).toBe(false);
		expect(begin).not.toHaveBeenCalled();
		expect(await guard.run(() => Promise.resolve(), begin)).toBe(true);
		expect(begin).toHaveBeenCalledOnce();
	});

	it('lets a start with several waits check it is still current', () => {
		const guard = new AsyncStart();
		const token = guard.token();
		expect(guard.isCurrent(token)).toBe(true);
		guard.cancel();
		expect(guard.isCurrent(token)).toBe(false);
	});

	it('is free again when preparing fails', async () => {
		const guard = new AsyncStart();
		await expect(guard.run(() => Promise.reject(new Error('no audio')), vi.fn())).rejects.toThrow();
		expect(guard.pending).toBe(false);
	});
});
