import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { METRIC_MODULATIONS } from '#lib/music/polyrhythm.ts';
import { planModulation, playModulation, type PolySound, startPolyrhythm } from './poly';

const clock = vi.hoisted(() => ({ audio: 0 }));

vi.mock('./engine', () => ({
	now: () => clock.audio,
	click: vi.fn(),
	scheduleUi: (callback: () => void) => callback()
}));

const { click } = await import('./engine');

beforeEach(() => {
	vi.useFakeTimers();
	clock.audio = 0;
	vi.mocked(click).mockClear();
});

afterEach(() => vi.useRealTimers());

const quarterToDottedQuarter = METRIC_MODULATIONS[1];

describe('planModulation', () => {
	it('keeps the old tempo, then switches at the bar line', () => {
		const plan = planModulation(120, quarterToDottedQuarter, 4, 2, 1);
		expect(plan.newTempo).toBe(180);
		expect(plan.before).toHaveLength(8);
		expect(plan.before[1]).toBeCloseTo(0.5);
		expect(plan.switchAt).toBeCloseTo(4);
		expect(plan.after[0]).toBeCloseTo(4);
		expect(plan.after[1] - plan.after[0]).toBeCloseTo(1 / 3);
		expect(plan.end).toBeCloseTo(4 + 4 / 3);
	});
});

describe('playModulation', () => {
	it('clicks the new tempo when following', () => {
		const plan = planModulation(120, quarterToDottedQuarter, 4, 1, 1);
		playModulation(plan, 4, true);
		expect(click).toHaveBeenCalledTimes(8);
	});

	it('leaves the new tempo silent with a final downbeat otherwise', () => {
		const plan = planModulation(120, quarterToDottedQuarter, 4, 1, 1);
		const beats: string[] = [];
		const cancel = playModulation(plan, 4, false, (phase, beat) => beats.push(`${phase}${beat}`));
		expect(click).toHaveBeenCalledTimes(5);
		expect(beats).toEqual([
			'before0',
			'before1',
			'before2',
			'before3',
			'after0',
			'after1',
			'after2',
			'after3'
		]);
		expect(typeof cancel).toBe('function');
	});
});

describe('startPolyrhythm', () => {
	const clicksInFirstCycle = (sound: PolySound): number => {
		const handle = startPolyrhythm({ a: 3, b: 2, tempo: 60, sound });
		for (let i = 0; i < 120; i++) {
			clock.audio += 0.025;
			vi.advanceTimersByTime(25);
		}
		handle.stop();
		const cycleEnd = handle.startTime + handle.cycleSeconds;
		return vi.mocked(click).mock.calls.filter(([, at]) => at < cycleEnd - 1e-9).length;
	};

	it.each([
		['both', 5],
		['a', 3],
		['b', 2],
		['downbeat', 1]
	] as const)('plays %s with %i clicks per 3:2 cycle', (sound, expected) => {
		expect(clicksInFirstCycle(sound)).toBe(expected);
	});

	it('sizes the cycle on the b side at the tempo', () => {
		const handle = startPolyrhythm({ a: 3, b: 2, tempo: 120, sound: 'both' });
		handle.stop();
		expect(handle.cycleSeconds).toBeCloseTo(1);
	});
});
