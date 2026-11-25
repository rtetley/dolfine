<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n.ts';
	import { JAZZ_MAPPING, type Level } from '#lib/music/levels.ts';
	import { type TrackId, trackOf } from '#lib/progress/ladder.ts';
	import { trackLabel } from '#lib/progress/labels.ts';
	import { progress } from '#lib/state/progress.svelte.ts';
	import { settings } from '#lib/state/settings.svelte.ts';
	import LevelBadge from './LevelBadge.svelte';
	import LevelProgress from './LevelProgress.svelte';

	interface Props {
		track: TrackId;
		/** The level picked in setup; progress is shown for it. */
		level: Level;
	}

	let { track, level }: Props = $props();

	const state = $derived(trackOf(progress.state, track));
	const open = $derived(state.unlocked);
	const equivalent = $derived(JAZZ_MAPPING[open]);
</script>

<section class="progress-panel" aria-label={m.progress_panel_label()}>
	<LevelBadge level={open} size="large" />
	<div class="text">
		<p class="label">{trackLabel(track)}</p>
		<p class="standing">
			{open === 1 ? m.progress_first_level() : m.progress_open_level({ level: open })}
		</p>
		<p class="equivalent">≈ {equivalent.abrsm} · {equivalent.french}</p>
		<LevelProgress track={state} {level} />
		<p class="links">
			{#if settings.value.levelLadder === 'open'}
				<span class="note">{m.progress_ladder_open_note()}</span> ·
			{/if}
			<a href={resolve('/progress')}>{m.progress_see_ladder()} →</a>
		</p>
	</div>
</section>

<style>
	.progress-panel {
		display: flex;
		gap: var(--space-4);
		align-items: flex-start;
		padding: var(--space-4) 0;
		border-top: 1px solid var(--rule);
		border-bottom: 1px solid var(--rule);
		margin: var(--space-4) 0;
		max-width: var(--measure);
	}

	.text {
		display: grid;
		gap: var(--space-1);
		flex: 1;
	}

	p {
		margin: 0;
	}

	.standing {
		font-size: var(--step-1);
		line-height: var(--leading-tight);
	}

	.equivalent,
	.links {
		color: var(--ink-soft);
		font-size: var(--step--1);
	}

	.equivalent {
		font-style: italic;
		margin-bottom: var(--space-2);
	}

	.note {
		font-style: italic;
	}
</style>
