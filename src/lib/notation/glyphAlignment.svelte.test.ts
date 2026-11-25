import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { parsePitch } from '#lib/music/pitch.ts';
import type { Score as ScoreModel, ScoreNote } from './model';
import type { ScoreLayout } from './render';
import Score from './Score.svelte';

const eighths = (m: number): ScoreNote[] =>
	['C5', 'E4', 'A4', 'F5', 'D4', 'G4', 'B4', 'E5'].map((name, i) => ({
		id: `${m}-${i}`,
		ticks: 6,
		rest: false,
		pitches: [parsePitch(name)]
	}));

const score: ScoreModel = {
	meter: { beats: 4, unit: 4 },
	parts: [{ clef: 'treble', measures: [eighths(0), eighths(1)] }]
};

/** VexFlow sizes each note (and places its stem) from the glyph width it measured. */
function measuredVersusDrawn(svg: SVGSVGElement): { measured: number; drawn: number }[] {
	return [...svg.querySelectorAll('.vf-stavenote')].flatMap((note) => {
		const glyph = note.querySelector<SVGTextElement>('.vf-notehead text');
		const box = note.querySelector(':scope > rect');
		if (!glyph || !box) return [];
		return [{ measured: Number(box.getAttribute('width')), drawn: glyph.getBBox().width }];
	});
}

describe('notation glyphs', () => {
	it('measures noteheads with the music font on the very first render', async () => {
		let layout: ScoreLayout | null = null;
		const screen = await render(Score, {
			props: {
				score,
				get layout() {
					return layout;
				},
				set layout(value) {
					layout = value;
				}
			}
		});
		await expect.poll(() => layout).not.toBeNull();
		const svg = screen.container.querySelector('svg');
		if (!svg) throw new Error('score did not render');

		const notes = measuredVersusDrawn(svg);
		expect(notes).toHaveLength(16);
		for (const { measured, drawn } of notes) expect(Math.abs(measured - drawn)).toBeLessThan(2);
	});
});
