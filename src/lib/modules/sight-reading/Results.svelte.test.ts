import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createExercise } from './exercise';
import { SIGHT_READING_DEFAULTS } from './prefs';
import Results from './Results.svelte';
import type { Performance } from './spoken';

const exercise = createExercise({ ...SIGHT_READING_DEFAULTS, bars: 2 }, 5);
const perfect = {
	input: 'midi',
	notes: exercise.expected.map(({ midi, time }) => ({ midi, time }))
} as const satisfies Performance;
const spokenPerfect = {
	input: 'voice',
	notes: exercise.expected.map(({ letter, time }) => ({ letter, time }))
} as const satisfies Performance;
const nothing = { input: 'midi', notes: [] } as const satisfies Performance;

const handlers = () => ({
	onrestart: vi.fn(),
	onpractise: vi.fn(),
	onnext: vi.fn(),
	onlevelup: vi.fn(),
	onsetup: vi.fn()
});

const notation = (container: HTMLElement) => container.querySelector('figure.score');

describe('Results', () => {
	it('scores a clean run and suggests moving on', async () => {
		const screen = await render(Results, {
			exercise,
			performance: perfect,
			scored: true,
			canLevelUp: true,
			...handlers()
		});
		await expect.element(screen.getByText('100%').first()).toBeVisible();
		await expect.element(screen.getByText(/Clean and steady/)).toBeVisible();
		await expect.element(screen.getByText(`● correct ${perfect.notes.length}`)).toBeVisible();
		await expect
			.element(screen.getByRole('figure', { name: 'Exercise with results' }))
			.toBeVisible();
	});

	it('grades a spoken reading on the note names', async () => {
		const screen = await render(Results, {
			exercise,
			performance: spokenPerfect,
			scored: true,
			canLevelUp: true,
			...handlers()
		});
		await expect.element(screen.getByText('right notes')).toBeVisible();
		await expect.element(screen.getByText('pitch accuracy')).not.toBeInTheDocument();
		await expect.element(screen.getByText(/Clean and steady/)).toBeVisible();
	});

	it('tells rushed from late notes, and writes what was heard under a wrong one', async () => {
		const [first, second, third, ...rest] = spokenPerfect.notes;
		const shift = exercise.toleranceMs * 1.5;
		const heard = first.letter === 'G' ? 'C' : 'G';
		const screen = await render(Results, {
			exercise,
			performance: {
				input: 'voice',
				notes: [
					{ ...first, letter: heard },
					{ ...second, time: second.time - shift },
					{ ...third, time: third.time + shift },
					...rest
				]
			},
			scored: true,
			canLevelUp: false,
			...handlers()
		});
		await expect.element(screen.getByText('● rushed 1')).toBeVisible();
		await expect.element(screen.getByText('● late 1')).toBeVisible();
		await expect.element(screen.getByText(/Under a wrong note, in red/)).toBeVisible();
		await expect.poll(() => notation(screen.container)?.textContent).toContain(heard);
	});

	it('keeps the staff on screen after an unscored run', async () => {
		const screen = await render(Results, {
			exercise,
			performance: nothing,
			scored: false,
			canLevelUp: false,
			...handlers()
		});
		await expect.element(screen.getByText(/this run was not scored/)).toBeVisible();
		await expect
			.element(screen.getByRole('figure', { name: 'Exercise with results' }))
			.toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Level up' })).not.toBeInTheDocument();
		expect(notation(screen.container)).not.toBeNull();
	});

	it('does not score a stopped run, even with MIDI', async () => {
		const screen = await render(Results, {
			exercise,
			performance: perfect,
			scored: true,
			stopped: true,
			canLevelUp: true,
			...handlers()
		});
		await expect.element(screen.getByText(/^Stopped\./)).toBeVisible();
		await expect.element(screen.getByText('pitch accuracy')).not.toBeInTheDocument();
		await expect
			.element(screen.getByRole('figure', { name: 'Exercise with results' }))
			.toBeVisible();
	});

	it('restarts or switches to practice on the same exercise', async () => {
		const actions = handlers();
		const screen = await render(Results, {
			exercise,
			performance: nothing,
			scored: false,
			canLevelUp: true,
			...actions
		});
		await screen.getByRole('button', { name: 'Restart from the beginning' }).click();
		await screen.getByRole('button', { name: 'Practise this exercise' }).click();
		expect(actions.onrestart).toHaveBeenCalledOnce();
		expect(actions.onpractise).toHaveBeenCalledOnce();
		expect(actions.onnext).not.toHaveBeenCalled();
	});
});
