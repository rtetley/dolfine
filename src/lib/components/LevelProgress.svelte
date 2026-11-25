<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import {
		levelStanding,
		percent,
		REQUIRED_CORRECT,
		type TrackProgress,
		UNLOCK_WINDOW
	} from '#lib/progress/ladder.ts';
	import type { Level } from '#lib/music/levels.ts';

	interface Props {
		track: TrackProgress;
		level: Level;
	}

	let { track, level }: Props = $props();

	const standing = $derived(levelStanding(track, level));
	const value = $derived(percent(standing.ratio));
	const detail = $derived(
		level === 10 && standing.passed
			? m.progress_top()
			: standing.passed
				? m.progress_passed({ level })
				: m.progress_towards({
						correct: standing.recentCorrect,
						required: REQUIRED_CORRECT,
						window: UNLOCK_WINDOW,
						level
					})
	);
</script>

<div class="level-progress">
	<div
		class="bar"
		role="progressbar"
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={value}
		aria-label={m.progress_bar_label({ level })}
	>
		<span class="fill" style:width="{value}%"></span>
	</div>
	<p class="detail"><span class="value">{m.percent({ value })}</span> · {detail}</p>
</div>

<style>
	.level-progress {
		display: grid;
		gap: var(--space-1);
	}

	.bar {
		height: 0.5rem;
		border: 1px solid var(--rule-strong);
		border-radius: var(--radius);
		background: var(--paper-deep);
		overflow: hidden;
	}

	.fill {
		display: block;
		height: 100%;
		background: var(--ink-soft);
		transition: width var(--duration) ease;
	}

	.detail {
		margin: 0;
		font-size: var(--step--1);
		color: var(--ink-soft);
	}

	.value {
		font-variant-numeric: lining-nums tabular-nums;
		color: var(--ink);
	}
</style>
