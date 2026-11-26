import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { IntervalQuestion } from './questions';
import SoundQuestion from './SoundQuestion.svelte';

vi.mock('#lib/audio/engine.ts', () => ({
	ensureAudio: vi.fn(() => Promise.resolve()),
	now: () => 0,
	playNotes: vi.fn(),
	playArpeggio: vi.fn(() => 0),
	stopAll: vi.fn()
}));

const { playNotes } = await import('#lib/audio/engine.ts');

const question: IntervalQuestion = {
	kind: 'intervals',
	notes: [60, 67],
	harmonic: false,
	answer: '7',
	options: [
		{ id: '7', label: 'Perfect fifth' },
		{ id: '5', label: 'Perfect fourth' },
		{ id: '4', label: 'Major third' }
	]
};

beforeEach(() => vi.mocked(playNotes).mockClear());

describe('SoundQuestion', () => {
	it('plays the interval on arrival, one note after the other', async () => {
		await render(SoundQuestion, { question, format: 'choice', onnext: vi.fn() });
		await vi.waitFor(() => expect(playNotes).toHaveBeenCalledTimes(2));
		expect(vi.mocked(playNotes).mock.calls.map(([notes]) => notes)).toEqual([[60], [67]]);
	});

	it('checks a multiple-choice answer and moves on', async () => {
		const onnext = vi.fn();
		const screen = await render(SoundQuestion, { question, format: 'choice', onnext });
		const check = screen.getByRole('button', { name: 'Check' });
		await expect.element(check).toBeDisabled();
		await screen.getByRole('button', { name: 'Perfect fourth' }).click();
		await check.click();
		await expect.element(screen.getByText(/Not this time\. It was/)).toBeVisible();
		await expect.element(screen.getByText('Perfect fifth', { exact: true }).last()).toBeVisible();
		await screen.getByRole('button', { name: 'Next' }).click();
		expect(onnext).toHaveBeenCalledOnce();
	});

	it('accepts a named answer from the list', async () => {
		const screen = await render(SoundQuestion, { question, format: 'naming', onnext: vi.fn() });
		await screen.getByRole('combobox', { name: 'Your answer' }).selectOptions('Perfect fifth');
		await screen.getByRole('button', { name: 'Check' }).click();
		await expect.element(screen.getByText(/Right\. It was/)).toBeVisible();
	});

	it('grades a played-back answer by pitch class', async () => {
		const screen = await render(SoundQuestion, { question, format: 'play', onnext: vi.fn() });
		await screen.getByRole('button', { name: 'C5' }).click();
		await screen.getByRole('button', { name: 'G5' }).click();
		await screen.getByRole('button', { name: 'Check' }).click();
		await expect.element(screen.getByText(/Right\. It was/)).toBeVisible();
	});

	it('lets the student hear a wrong answer next to the right one', async () => {
		const screen = await render(SoundQuestion, { question, format: 'choice', onnext: vi.fn() });
		await vi.waitFor(() => expect(playNotes).toHaveBeenCalledTimes(2));
		vi.mocked(playNotes).mockClear();

		await screen.getByRole('button', { name: 'Perfect fourth' }).click();
		await screen.getByRole('button', { name: 'Check' }).click();

		await screen.getByRole('button', { name: 'Hear your answer · Perfect fourth' }).click();
		await vi.waitFor(() => expect(playNotes).toHaveBeenCalledTimes(2));
		expect(vi.mocked(playNotes).mock.calls.map(([notes]) => notes)).toEqual([[60], [65]]);

		vi.mocked(playNotes).mockClear();
		await screen.getByRole('button', { name: 'Yours, then the right one' }).click();
		await vi.waitFor(() => expect(playNotes).toHaveBeenCalledTimes(4));
		const calls = vi.mocked(playNotes).mock.calls;
		expect(calls.map(([notes]) => notes)).toEqual([[60], [65], [60], [67]]);
		expect(calls[2][2]).toBeGreaterThan(calls[1][2] ?? 0);
		await expect
			.element(screen.getByRole('button', { name: 'Hear the right answer · Perfect fifth' }))
			.toBeVisible();
	});

	it('offers no comparison after a right answer', async () => {
		const screen = await render(SoundQuestion, { question, format: 'choice', onnext: vi.fn() });
		await screen.getByRole('button', { name: 'Perfect fifth' }).click();
		await screen.getByRole('button', { name: 'Check' }).click();
		await expect.element(screen.getByText(/Right\. It was/)).toBeVisible();
		await expect
			.element(screen.getByRole('button', { name: /Hear your answer/ }))
			.not.toBeInTheDocument();
	});
});
