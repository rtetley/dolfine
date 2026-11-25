import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createExercise } from './exercise';
import { SIGHT_READING_DEFAULTS } from './prefs';
import Results from './Results.svelte';

const exercise = createExercise({ ...SIGHT_READING_DEFAULTS, bars: 2 }, 5);
const perfect = exercise.expected.map(({ midi, time }) => ({ midi, time }));

const handlers = () => ({
	onretry: vi.fn(),
	onnext: vi.fn(),
	onlevelup: vi.fn(),
	onsetup: vi.fn()
});

describe('Results', () => {
	it('scores a clean run and suggests moving on', async () => {
		const screen = await render(Results, {
			exercise,
			played: perfect,
			scored: true,
			canLevelUp: true,
			...handlers()
		});
		await expect.element(screen.getByText('100%').first()).toBeVisible();
		await expect.element(screen.getByText(/Clean and steady/)).toBeVisible();
		await expect.element(screen.getByText(`● correct ${perfect.length}`)).toBeVisible();
	});

	it('explains an unscored run and hides level up at the top', async () => {
		const actions = handlers();
		const screen = await render(Results, {
			exercise,
			played: [],
			scored: false,
			canLevelUp: false,
			...actions
		});
		await expect.element(screen.getByText(/this run was not scored/)).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Level up' })).not.toBeInTheDocument();
		await screen.getByRole('button', { name: 'Retry the same exercise' }).click();
		expect(actions.onretry).toHaveBeenCalledOnce();
	});
});
