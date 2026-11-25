import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { CLASSICAL_MAPPING, JAZZ_MAPPING } from '#lib/music/levels.ts';
import LevelPicker from './LevelPicker.svelte';

describe('LevelPicker', () => {
	it('offers all ten levels and reports the choice as a number', async () => {
		const onchange = vi.fn();
		const screen = await render(LevelPicker, { level: 3, mapping: 'classical', onchange });
		const select = screen.getByRole('combobox', { name: 'Level' });
		await expect.element(select).toHaveValue('3');
		expect(screen.getByRole('option').all()).toHaveLength(10);
		await select.selectOptions('Level 7');
		expect(onchange).toHaveBeenCalledWith(7);
	});

	it('shows the exam equivalent for the chosen mapping', async () => {
		const jazz = JAZZ_MAPPING[5];
		const screen = await render(LevelPicker, { level: 5, mapping: 'jazz', onchange: vi.fn() });
		await expect.element(screen.getByText(`≈ ${jazz.abrsm} · ${jazz.french}`)).toBeVisible();

		const classical = CLASSICAL_MAPPING[5];
		await screen.rerender({ mapping: 'classical' });
		await expect
			.element(screen.getByText(`≈ ${classical.abrsm} · ${classical.french}`))
			.toBeVisible();
	});

	it('locks the levels above the one the student has reached', async () => {
		const screen = await render(LevelPicker, {
			level: 2,
			mapping: 'jazz',
			unlocked: 3,
			onchange: vi.fn()
		});
		const options = screen.getByRole('option').all();
		expect(options).toHaveLength(10);
		await expect
			.element(screen.getByRole('option', { name: 'Level 3', exact: true }))
			.toBeEnabled();
		await expect.element(screen.getByRole('option', { name: 'Level 4 · locked' })).toBeDisabled();
	});
});
