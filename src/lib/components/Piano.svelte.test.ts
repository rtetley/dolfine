import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Piano from './Piano.svelte';

describe('Piano', () => {
	it('draws one key per semitone with named keys', async () => {
		const screen = await render(Piano, { low: 60, high: 72 });
		expect(screen.getByRole('button').all()).toHaveLength(13);
		await expect.element(screen.getByRole('button', { name: 'C♯4' })).toHaveClass('black');
		await expect.element(screen.getByRole('button', { name: 'C5' })).toHaveClass('white');
	});

	it('reports presses with the midi number', async () => {
		const ontoggle = vi.fn();
		const screen = await render(Piano, { low: 60, high: 72, ontoggle });
		await screen.getByRole('button', { name: 'E♭4' }).click();
		await screen.getByRole('button', { name: 'G4' }).click();
		expect(ontoggle.mock.calls).toEqual([[63], [67]]);
	});

	it('shows selection and feedback marks', async () => {
		const screen = await render(Piano, {
			low: 60,
			high: 72,
			selected: new Set([60]),
			marked: new Map([
				[64, 'good'],
				[65, 'bad']
			] as const)
		});
		await expect
			.element(screen.getByRole('button', { name: 'C4' }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect.element(screen.getByRole('button', { name: 'E4' })).toHaveClass('good');
		await expect.element(screen.getByRole('button', { name: 'F4' })).toHaveClass('bad');
	});

	it('ignores presses when disabled', async () => {
		const screen = await render(Piano, { low: 60, high: 64, disabled: true });
		for (const key of screen.getByRole('button').all()) await expect.element(key).toBeDisabled();
	});
});
