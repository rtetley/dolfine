<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import type { Level } from '#lib/music/levels.ts';
	import { type TrackId, trackOf } from '#lib/progress/ladder.ts';
	import { achievementDetail, achievementTitle } from '#lib/progress/labels.ts';
	import { progress } from '#lib/state/progress.svelte.ts';
	import LevelProgress from './LevelProgress.svelte';

	interface Props {
		track: TrackId;
		level: Level;
		/** Offered when the answer just opened a new level. */
		onlevel: (level: Level) => void;
	}

	let { track, level, onlevel }: Props = $props();

	const events = $derived(progress.lastEvents);
	const xp = $derived(events.reduce((sum, e) => sum + (e.kind === 'xp' ? e.amount : 0), 0));
	const unlocked = $derived(
		events.flatMap((e) => (e.kind === 'level-unlocked' && e.track === track ? [e.level] : []))
	);
	const achievements = $derived(events.flatMap((e) => (e.kind === 'achievement' ? [e.id] : [])));
</script>

<!-- Polite live region: the result of each checked answer is read out after the feedback. -->
<div class="progress-notice" aria-live="polite">
	{#if events.length > 0}
		<p class="xp">{m.progress_xp_gained({ xp })}</p>
		{#each unlocked as next (next)}
			<p class="unlocked">
				<strong>{m.progress_unlocked({ level: next })}</strong>
				{#if next > level}
					<button type="button" onclick={() => onlevel(next)}>
						{m.progress_move_up({ level: next })}
					</button>
				{/if}
			</p>
		{/each}
		{#each achievements as id (id)}
			<p class="achievement">
				<span class="label">{m.achievement_earned()}</span>
				<strong>{achievementTitle(id)}</strong> · {achievementDetail(id)}
			</p>
		{/each}
		<LevelProgress track={trackOf(progress.state, track)} {level} />
	{/if}
</div>

<style>
	.progress-notice {
		display: grid;
		gap: var(--space-2);
		max-width: var(--measure);
		margin-top: var(--space-3);
	}

	.progress-notice:empty {
		display: none;
	}

	p {
		margin: 0;
	}

	.xp {
		color: var(--ink-soft);
		font-size: var(--step--1);
		font-variant-numeric: lining-nums tabular-nums;
	}

	.unlocked {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
	}

	.achievement .label {
		margin-right: var(--space-2);
	}
</style>
