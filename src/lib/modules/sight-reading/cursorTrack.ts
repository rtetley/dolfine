import { measureTicks } from '#lib/music/rhythm.ts';
import type { ScoreLayout, SystemLayout } from '#lib/notation/render.ts';
import { msPerTick, noteId, type SightReadingExercise } from './exercise';

export interface TrackPoint {
	time: number;
	x: number;
	system: number;
}

export function buildTrack(exercise: SightReadingExercise, layout: ScoreLayout): TrackPoint[] {
	const tick = msPerTick(exercise.tempo);
	const perMeasure = measureTicks(exercise.meter);
	const xById = new Map(
		layout.notes
			.filter((note) => note.part === 0 && note.id === note.sourceId)
			.map((note) => [note.id, note])
	);
	const points: TrackPoint[] = [];
	exercise.parts[0]?.measures.forEach((measure, m) => {
		let position = m * perMeasure;
		measure.forEach((note, n) => {
			const placed = xById.get(noteId(0, m, n));
			if (placed) points.push({ time: position * tick, x: placed.x, system: placed.system });
			position += note.ticks;
		});
	});
	return points;
}

export function cursorAt(
	track: readonly TrackPoint[],
	elapsedMs: number,
	endMs: number,
	systems: readonly SystemLayout[],
	width: number
): TrackPoint | null {
	if (track.length === 0 || elapsedMs < 0) return null;
	let index = track.findIndex((point) => point.time > elapsedMs) - 1;
	if (index === -2) index = track.length - 1;
	const current = track[Math.max(0, index)];
	const next = track[index + 1];
	if (next && next.system === current.system) {
		const ratio = (elapsedMs - current.time) / (next.time - current.time);
		return { time: elapsedMs, x: current.x + (next.x - current.x) * ratio, system: current.system };
	}
	const lineEnd = systems[current.system] ? width - 16 : current.x;
	const spanEnd = next ? next.time : endMs;
	const ratio = Math.min(1, (elapsedMs - current.time) / Math.max(1, spanEnd - current.time));
	return { time: elapsedMs, x: current.x + (lineEnd - current.x) * ratio, system: current.system };
}
