import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { parsePitch } from '#lib/music/pitch.ts';
import { scaleScore } from '#lib/modules/theory/display.ts';
import type { Score as ScoreModel } from './model';
import type { ScoreLayout } from './render';
import Score from './Score.svelte';

const host = (): HTMLElement => {
	const element = document.createElement('div');
	element.style.width = '800px';
	document.body.replaceChildren(element);
	return element;
};

async function renderLayout(
	score: ScoreModel
): Promise<{ layout: ScoreLayout; svg: SVGSVGElement }> {
	let layout: ScoreLayout | null = null;
	const screen = await render(Score, {
		target: host(),
		props: {
			score,
			label: 'Test score',
			get layout() {
				return layout;
			},
			set layout(value) {
				layout = value;
			}
		}
	});
	await expect.element(screen.getByRole('figure', { name: 'Test score' })).toBeVisible();
	await expect.poll(() => layout).not.toBeNull();
	const svg = screen.container.querySelector('svg');
	if (!svg || !layout) throw new Error('score did not render');
	return { layout, svg };
}

describe('Score', () => {
	it('renders a scale with VexFlow and reports where each note sits', async () => {
		const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'].map(parsePitch);
		const { layout, svg } = await renderLayout(scaleScore(notes));
		expect(svg.querySelectorAll('.vf-stavenote')).toHaveLength(8);
		expect(layout.notes.map((n) => n.id)).toEqual(notes.map((_, i) => `s${i}`));
		const xs = layout.notes.map((n) => n.x);
		expect(xs).toEqual([...xs].sort((a, b) => a - b));
	});

	it('wraps long scores onto several systems', async () => {
		const bar = (m: number) =>
			Array.from({ length: 4 }, (_, i) => ({
				id: `${m}-${i}`,
				ticks: 12,
				rest: false,
				pitches: [parsePitch('G4')]
			}));
		const score: ScoreModel = {
			meter: { beats: 4, unit: 4 },
			parts: [{ clef: 'treble', measures: Array.from({ length: 12 }, (_, m) => bar(m)) }]
		};
		const { layout } = await renderLayout(score);
		expect(layout.systems.length).toBeGreaterThan(1);
		expect(new Set(layout.notes.map((n) => n.system)).size).toBe(layout.systems.length);
	});
});
