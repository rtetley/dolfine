import { createRng } from '#lib/music/random.ts';
import { click, now, scheduleUi } from './engine';

export type AccentPattern = 'downbeat' | 'two-and-four' | 'none';
export type MuteMode = 'off' | 'random';

export interface MetronomeOptions {
	bpm: number;
	beatsPerBar: number;
	subdivision: 1 | 2 | 3;
	accent: AccentPattern;
	audible: boolean;
	muteMode: MuteMode;
	muteProbability: number;
	countInBars: number;
	bars?: number;
	seed: number;
	onTick?: (tick: MetronomeTick) => void;
	onEnd?: () => void;
}

export interface MetronomeTick {
	bar: number;
	beat: number;
	sub: number;
	countIn: boolean;
	muted: boolean;
	audioTime: number;
}

export interface MetronomeHandle {
	stop(): void;
	startTime: number;
	readingStartTime: number;
}

const LOOKAHEAD_SECONDS = 0.15;
const TIMER_MS = 25;

export function isAccented(beat: number, accent: AccentPattern): boolean {
	if (accent === 'downbeat') return beat === 0;
	if (accent === 'two-and-four') return beat % 2 === 1;
	return false;
}

export function startMetronome(options: MetronomeOptions): MetronomeHandle {
	const rng = createRng(options.seed);
	const tickSeconds = 60 / options.bpm / options.subdivision;
	const ticksPerBar = options.beatsPerBar * options.subdivision;
	const startTime = now() + 0.2;
	const readingStartTime = startTime + options.countInBars * ticksPerBar * tickSeconds;
	const mutedBars = new Map<number, boolean>();
	let tickIndex = 0;
	let stopped = false;

	const barIsMuted = (bar: number): boolean => {
		if (bar < 1 || options.muteMode === 'off') return false;
		if (!mutedBars.has(bar)) mutedBars.set(bar, rng.chance(options.muteProbability));
		return mutedBars.get(bar) ?? false;
	};

	const totalTicks =
		options.bars === undefined ? Infinity : (options.countInBars + options.bars) * ticksPerBar;

	const pump = (): void => {
		if (stopped) return;
		while (
			tickIndex < totalTicks &&
			startTime + tickIndex * tickSeconds < now() + LOOKAHEAD_SECONDS
		) {
			const audioTime = startTime + tickIndex * tickSeconds;
			const absoluteBar = Math.floor(tickIndex / ticksPerBar);
			const within = tickIndex % ticksPerBar;
			const beat = Math.floor(within / options.subdivision);
			const sub = within % options.subdivision;
			const countIn = absoluteBar < options.countInBars;
			const bar = absoluteBar - options.countInBars;
			const muted = !countIn && barIsMuted(bar);
			if ((countIn || options.audible) && !muted) {
				click(sub === 0 && isAccented(beat, options.accent), audioTime, sub !== 0);
			}
			const tick: MetronomeTick = { bar, beat, sub, countIn, muted, audioTime };
			if (options.onTick) scheduleUi(() => options.onTick?.(tick), audioTime);
			tickIndex++;
		}
		if (tickIndex >= totalTicks) {
			const endAt = startTime + totalTicks * tickSeconds;
			scheduleUi(() => !stopped && options.onEnd?.(), endAt);
			return;
		}
		timer = setTimeout(pump, TIMER_MS);
	};

	let timer: ReturnType<typeof setTimeout> = setTimeout(pump, 0);

	return {
		startTime,
		readingStartTime,
		stop: () => {
			stopped = true;
			clearTimeout(timer);
		}
	};
}
