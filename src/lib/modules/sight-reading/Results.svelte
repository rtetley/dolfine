<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import { resultsCommentary, scorePerformance, type PlayedNote } from '#lib/music/scoring.ts';
	import Score from '#lib/notation/Score.svelte';
	import { exerciseScore, type SightReadingExercise } from './exercise';

	interface Props {
		exercise: SightReadingExercise;
		played: PlayedNote[];
		scored: boolean;
		canLevelUp: boolean;
		onretry: () => void;
		onnext: () => void;
		onlevelup: () => void;
		onsetup: () => void;
	}

	let { exercise, played, scored, canLevelUp, onretry, onnext, onlevelup, onsetup }: Props =
		$props();

	const summary = $derived(
		scored ? scorePerformance(exercise.expected, played, exercise.toleranceMs) : null
	);
	const score = $derived(
		exerciseScore(exercise, { showReferences: false, outcomes: summary?.notes })
	);
	const counts = $derived(
		summary?.notes.reduce<Record<string, number>>((acc, note) => {
			acc[note.outcome] = (acc[note.outcome] ?? 0) + 1;
			return acc;
		}, {}) ?? {}
	);
</script>

<section aria-label={m.results_label()}>
	{#if summary}
		<div class="stats">
			<div class="stat">
				<strong>{summary.pitchAccuracy}%</strong><span class="label">
					{m.results_pitch_accuracy()}
				</span>
			</div>
			<div class="stat">
				<strong>{summary.rhythmAccuracy}%</strong><span class="label">
					{m.results_rhythm_accuracy()}
				</span>
			</div>
			<div class="stat">
				<strong>{exercise.tempo}</strong><span class="label">{m.results_tempo_played()}</span>
			</div>
		</div>
		<p class="result-line">{resultsCommentary(summary)}</p>
		<p class="legend">
			<span class="good">{m.results_correct({ count: counts.correct ?? 0 })}</span>
			<span class="late">
				{m.results_early_late({ early: counts.early ?? 0, late: counts.late ?? 0 })}
			</span>
			<span class="bad">
				{m.results_wrong_missed({ wrong: counts.wrong ?? 0, missed: counts.missed ?? 0 })}
			</span>
			{#if summary.extras.length > 0}<span>
					{m.results_extra_notes({ count: summary.extras.length })}
				</span>{/if}
		</p>
		<Score {score} label={m.results_score_label()} />
	{:else}
		<p class="result-line">{m.results_unscored()}</p>
	{/if}

	<div class="actions">
		<button type="button" class="primary" onclick={onnext}>{m.results_new_at_level()}</button>
		<button type="button" onclick={onretry}>{m.results_retry()}</button>
		{#if canLevelUp}<button type="button" onclick={onlevelup}>{m.action_level_up()}</button>{/if}
		<button type="button" onclick={onsetup}>{m.action_back_to_setup()}</button>
	</div>
</section>

<style>
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		font-size: var(--step--1);
	}

	.late {
		color: var(--late);
	}
</style>
