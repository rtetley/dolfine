import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LabelPanel from './LabelPanel.svelte';

const expected = [
	{ id: 'n0', midi: 60, time: 0, letter: 'C' },
	{ id: 'n1', midi: 62, time: 500, letter: 'D' },
	{ id: 'n2', midi: 64, time: 1000, letter: 'E' }
] as const;

describe('LabelPanel', () => {
	it('starts as written, flags what the app heard differently, and saves the labels', async () => {
		const blobs: Blob[] = [];
		vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
			if (blob instanceof Blob) blobs.push(blob);
			return 'blob:labels';
		});
		const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
		const screen = await render(LabelPanel, {
			captureId: 'reading-test',
			exercise: { expected: [...expected] },
			notes: [
				{ id: 'n0', outcome: 'correct', deltaMs: 0 },
				{ id: 'n1', outcome: 'wrong', heard: 1 },
				{ id: 'n2', outcome: 'missed' }
			],
			heard: [
				{ letter: 'C', time: 0 },
				{ letter: 'F', time: 500 }
			],
			names: 'letters'
		});
		await expect.element(screen.getByText('app heard: F')).toBeVisible();
		await expect.element(screen.getByText('app heard: nothing')).toBeVisible();
		await screen
			.getByRole('combobox', { name: 'What was said at note 3' })
			.selectOptions('nothing');
		await screen.getByRole('button', { name: 'Save labels' }).click();
		await expect
			.element(screen.getByText('Saved as dolfine-reading-test.labels.json.'))
			.toBeVisible();
		expect(click).toHaveBeenCalledOnce();
		const saved: unknown = JSON.parse(await blobs[0].text());
		expect(saved).toMatchObject({
			captureId: 'reading-test',
			labels: [
				{ noteId: 'n0', said: 'C' },
				{ noteId: 'n1', said: 'D' },
				{ noteId: 'n2', said: 'nothing' }
			]
		});
		vi.restoreAllMocks();
	});
});
