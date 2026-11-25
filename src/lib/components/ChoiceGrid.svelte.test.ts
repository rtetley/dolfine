import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ChoiceGrid from './ChoiceGrid.svelte';

const choices = [
	{ id: 'dorian', label: 'Dorian' },
	{ id: 'lydian', label: 'Lydian' },
	{ id: 'locrian', label: 'Locrian' }
];

describe('ChoiceGrid', () => {
	it('reports the chosen id and marks the selection', async () => {
		const onchoose = vi.fn();
		const screen = await render(ChoiceGrid, { choices, selected: 'lydian', onchoose });
		await expect
			.element(screen.getByRole('button', { name: 'Lydian' }))
			.toHaveAttribute('aria-pressed', 'true');
		await screen.getByRole('button', { name: 'Dorian' }).click();
		expect(onchoose).toHaveBeenCalledWith('dorian');
	});

	it('locks and grades the answers once revealed', async () => {
		const screen = await render(ChoiceGrid, {
			choices,
			selected: 'lydian',
			correctId: 'dorian',
			revealed: true,
			onchoose: vi.fn()
		});
		const right = screen.getByRole('button', { name: 'Dorian' });
		const wrong = screen.getByRole('button', { name: 'Lydian' });
		await expect.element(right).toHaveClass('right');
		await expect.element(wrong).toHaveClass('wrong');
		await expect.element(screen.getByRole('button', { name: 'Locrian' })).not.toHaveClass('wrong');
		await expect.element(right).toBeDisabled();
	});
});
