<script lang="ts">
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

<section aria-label="Results">
	{#if summary}
		<div class="stats">
			<div class="stat">
				<strong>{summary.pitchAccuracy}%</strong><span class="label">pitch accuracy</span>
			</div>
			<div class="stat">
				<strong>{summary.rhythmAccuracy}%</strong><span class="label">rhythm accuracy</span>
			</div>
			<div class="stat">
				<strong>{exercise.tempo}</strong><span class="label">tempo played (♩)</span>
			</div>
		</div>
		<p class="result-line">{resultsCommentary(summary)}</p>
		<p class="legend">
			<span class="good">● correct {counts.correct ?? 0}</span>
			<span class="late">● early {counts.early ?? 0} · late {counts.late ?? 0}</span>
			<span class="bad">● wrong {counts.wrong ?? 0} · missed {counts.missed ?? 0}</span>
			{#if summary.extras.length > 0}<span>· extra notes {summary.extras.length}</span>{/if}
		</p>
		<Score {score} label="Exercise with results" />
	{:else}
		<p class="result-line">
			Done. Without a MIDI keyboard this run was not scored; take the next one while you're warm.
		</p>
	{/if}

	<div class="actions">
		<button type="button" class="primary" onclick={onnext}>New exercise at this level</button>
		<button type="button" onclick={onretry}>Retry the same exercise</button>
		{#if canLevelUp}<button type="button" onclick={onlevelup}>Level up</button>{/if}
		<button type="button" onclick={onsetup}>Back to setup</button>
	</div>
</section>

<style>
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.9rem;
	}

	.late {
		color: var(--late);
	}
</style>
