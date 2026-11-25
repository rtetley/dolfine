import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isAccented, type MetronomeOptions, type MetronomeTick, startMetronome } from './metronome';

const clock = vi.hoisted(() => ({ audio: 0 }));

vi.mock('./engine', () => ({
	now: () => clock.audio,
	click: vi.fn(),
	scheduleUi: (callback: () => void) => callback()
}));

const { click } = await import('./engine');

const BASE: MetronomeOptions = {
	bpm: 120,
	beatsPerBar: 4,
	subdivision: 1,
	accent: 'downbeat',
	audible: true,
	muteMode: 'off',
	muteProbability: 0.5,
	countInBars: 1,
	bars: 2,
	seed: 1
};

function runFor(seconds: number): void {
	for (let elapsed = 0; elapsed < seconds; elapsed += 0.025) {
		clock.audio += 0.025;
		vi.advanceTimersByTime(25);
	}
}

function collect(options: Partial<MetronomeOptions>, seconds = 10) {
	const ticks: MetronomeTick[] = [];
	const onEnd = vi.fn();
	const handle = startMetronome({ ...BASE, ...options, onTick: (t) => ticks.push(t), onEnd });
	runFor(seconds);
	return { ticks, onEnd, handle };
}

beforeEach(() => {
	vi.useFakeTimers();
	clock.audio = 0;
	vi.mocked(click).mockClear();
});

afterEach(() => vi.useRealTimers());

describe('isAccented', () => {
	it.each([
		[0, 'downbeat', true],
		[1, 'downbeat', false],
		[1, 'two-and-four', true],
		[3, 'two-and-four', true],
		[2, 'two-and-four', false],
		[0, 'none', false]
	] as const)('beat %i with %s → %s', (beat, accent, expected) => {
		expect(isAccented(beat, accent)).toBe(expected);
	});
});

describe('startMetronome', () => {
	it('ticks the count-in then the bars, and ends once', () => {
		const { ticks, onEnd } = collect({});
		expect(ticks).toHaveLength(12);
		expect(ticks.filter((t) => t.countIn)).toHaveLength(4);
		expect(ticks.at(4)).toMatchObject({ bar: 0, beat: 0, countIn: false });
		expect(ticks.at(-1)).toMatchObject({ bar: 1, beat: 3 });
		expect(onEnd).toHaveBeenCalledOnce();
	});

	it('spaces ticks by the tempo and starts reading after the count-in', () => {
		const { ticks, handle } = collect({ bpm: 60 }, 14);
		expect(ticks[1].audioTime - ticks[0].audioTime).toBeCloseTo(1);
		expect(handle.readingStartTime - handle.startTime).toBeCloseTo(4);
		expect(ticks[4].audioTime).toBeCloseTo(handle.readingStartTime);
	});

	it('subdivides each beat and only accents the beat itself', () => {
		const { ticks } = collect({ subdivision: 3, countInBars: 0, bars: 1 });
		expect(ticks.map((t) => t.sub)).toEqual([0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2]);
		const accents = vi.mocked(click).mock.calls.filter(([accent]) => accent);
		expect(accents).toHaveLength(1);
	});

	it('plays the count-in even when silent, then nothing', () => {
		collect({ audible: false });
		expect(click).toHaveBeenCalledTimes(4);
	});

	it('mutes whole bars reproducibly and never the count-in or first bar', () => {
		const options = { muteMode: 'random', muteProbability: 0.5, bars: 16 } as const;
		const first = collect(options, 40).ticks;
		clock.audio = 0;
		const second = collect(options, 40).ticks;
		expect(first.map((t) => t.muted)).toEqual(second.map((t) => t.muted));
		expect(first.some((t) => t.muted)).toBe(true);
		expect(first.filter((t) => t.countIn || t.bar === 0).every((t) => !t.muted)).toBe(true);
		for (let bar = 0; bar < 16; bar++) {
			const states = new Set(first.filter((t) => t.bar === bar).map((t) => t.muted));
			expect(states.size).toBe(1);
		}
	});

	it('stops scheduling when stopped', () => {
		const ticks: MetronomeTick[] = [];
		const handle = startMetronome({ ...BASE, bars: undefined, onTick: (t) => ticks.push(t) });
		runFor(2);
		handle.stop();
		const count = ticks.length;
		runFor(5);
		expect(ticks.length).toBe(count);
	});
});
