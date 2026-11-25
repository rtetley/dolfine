import { describe, expect, it } from 'vitest';
import type { NoteLayout, ScoreLayout } from '#lib/notation/render.ts';
import { buildTrack, cursorAt, type TrackPoint } from './cursorTrack';
import { createExercise, msPerTick, noteId } from './exercise';
import { SIGHT_READING_DEFAULTS } from './prefs';

const exercise = createExercise({ ...SIGHT_READING_DEFAULTS, staff: 'grand', bars: 4 }, 21);

function layoutFor(perSystem: number): ScoreLayout {
	const notes: NoteLayout[] = [];
	exercise.parts.forEach((part, p) =>
		part.measures.forEach((measure, m) =>
			measure.forEach((_, n) => {
				const id = noteId(p, m, n);
				notes.push({
					id,
					sourceId: id,
					x: 40 + (m % perSystem) * 200 + n * 20,
					system: Math.floor(m / perSystem),
					part: p
				});
			})
		)
	);
	return {
		width: 900,
		height: 400,
		systems: [
			{ top: 0, bottom: 150 },
			{ top: 150, bottom: 300 }
		],
		notes
	};
}

describe('buildTrack', () => {
	it('places one point per top-staff note at its onset', () => {
		const track = buildTrack(exercise, layoutFor(4));
		const topNotes = exercise.parts[0].measures.flat();
		expect(track).toHaveLength(topNotes.length);
		expect(track[0]).toMatchObject({ time: 0, x: 40, system: 0 });
		const secondOnset = topNotes[0].ticks * msPerTick(exercise.tempo);
		expect(track[1].time).toBeCloseTo(secondOnset);
	});

	it('skips tied continuation notes the renderer adds', () => {
		const layout = layoutFor(4);
		layout.notes.push({ id: 'extra', sourceId: noteId(0, 0, 0), x: 999, system: 0, part: 0 });
		expect(buildTrack(exercise, layout).some((p) => p.x === 999)).toBe(false);
	});
});

describe('cursorAt', () => {
	const systems = [
		{ top: 0, bottom: 100 },
		{ top: 100, bottom: 200 }
	];
	const track: TrackPoint[] = [
		{ time: 0, x: 50, system: 0 },
		{ time: 1000, x: 150, system: 0 },
		{ time: 2000, x: 50, system: 1 }
	];

	it('returns nothing before the start or without a track', () => {
		expect(cursorAt(track, -1, 3000, systems, 600)).toBeNull();
		expect(cursorAt([], 0, 3000, systems, 600)).toBeNull();
	});

	it('interpolates between notes on the same line', () => {
		expect(cursorAt(track, 500, 3000, systems, 600)).toEqual({ time: 500, x: 100, system: 0 });
	});

	it('runs to the end of the line before wrapping', () => {
		const point = cursorAt(track, 1500, 3000, systems, 600);
		expect(point?.system).toBe(0);
		expect(point?.x).toBeCloseTo(150 + (584 - 150) / 2);
	});

	it('finishes the last line by the end time and then holds', () => {
		expect(cursorAt(track, 3000, 3000, systems, 600)?.x).toBe(584);
		expect(cursorAt(track, 9000, 3000, systems, 600)?.x).toBe(584);
	});
});
