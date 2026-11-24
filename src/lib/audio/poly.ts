import { modulatedTempo, type MetricModulation, polyrhythm } from '#lib/music/polyrhythm.ts';
import { click, now, scheduleUi } from './engine';

export type PolySound = 'both' | 'a' | 'b' | 'downbeat';

export interface PolyHandle {
	stop(): void;
	startTime: number;
	cycleSeconds: number;
}

const LOOKAHEAD_SECONDS = 0.15;

export function startPolyrhythm(options: {
	a: number;
	b: number;
	tempo: number;
	sound: PolySound;
}): PolyHandle {
	const cycle = polyrhythm(options.a, options.b);
	const cycleSeconds = (options.b * 60) / options.tempo;
	const startTime = now() + 0.25;
	const unit = cycleSeconds / cycle.length;
	let cycleIndex = 0;
	let eventIndex = 0;
	let stopped = false;

	const pump = (): void => {
		if (stopped) return;
		for (;;) {
			const event = cycle.composite[eventIndex];
			if (!event) break;
			const at = startTime + cycleIndex * cycleSeconds + event.position * unit;
			if (at > now() + LOOKAHEAD_SECONDS) break;
			const downbeat = event.position === 0;
			const playA =
				event.parts.includes('a') && (options.sound === 'both' || options.sound === 'a');
			const playB =
				event.parts.includes('b') && (options.sound === 'both' || options.sound === 'b');
			if (options.sound === 'downbeat' && downbeat) click(true, at);
			if (playA) click(downbeat, at);
			if (playB) click(false, at, true);
			eventIndex++;
			if (eventIndex >= cycle.composite.length) {
				eventIndex = 0;
				cycleIndex++;
			}
		}
		timer = setTimeout(pump, 25);
	};
	let timer: ReturnType<typeof setTimeout> = setTimeout(pump, 0);

	return {
		startTime,
		cycleSeconds,
		stop: () => {
			stopped = true;
			clearTimeout(timer);
		}
	};
}

export interface ModulationPlan {
	before: number[];
	after: number[];
	newTempo: number;
	switchAt: number;
	end: number;
}

export function planModulation(
	bpm: number,
	modulation: MetricModulation,
	beatsPerBar: number,
	barsBefore: number,
	barsAfter: number
): ModulationPlan {
	const newTempo = modulatedTempo(bpm, modulation);
	const oldBeat = 60 / bpm;
	const newBeat = 60 / newTempo;
	const before = Array.from({ length: beatsPerBar * barsBefore }, (_, i) => i * oldBeat);
	const switchAt = before.length * oldBeat;
	const after = Array.from({ length: beatsPerBar * barsAfter }, (_, i) => switchAt + i * newBeat);
	return { before, after, newTempo, switchAt, end: switchAt + after.length * newBeat };
}

export function playModulation(
	plan: ModulationPlan,
	beatsPerBar: number,
	follow: boolean,
	onBeat?: (phase: 'before' | 'after', beat: number) => void
): () => void {
	const start = now() + 0.25;
	let cancelled = false;
	plan.before.forEach((time, i) => {
		click(i % beatsPerBar === 0, start + time);
		if (onBeat) scheduleUi(() => !cancelled && onBeat('before', i % beatsPerBar), start + time);
	});
	plan.after.forEach((time, i) => {
		if (follow) click(i % beatsPerBar === 0, start + time, true);
		if (onBeat) scheduleUi(() => !cancelled && onBeat('after', i % beatsPerBar), start + time);
	});
	if (!follow) {
		const last = plan.end;
		click(true, start + last);
	}
	return () => {
		cancelled = true;
	};
}
