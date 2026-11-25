<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import { LEVELS } from '#lib/music/levels.ts';
	import { levelStanding, percent, type TrackProgress } from '#lib/progress/ladder.ts';
	import { ROMAN_NUMERALS } from '#lib/progress/labels.ts';
	import LevelProgress from './LevelProgress.svelte';

	interface Props {
		track: TrackProgress;
		label: string;
	}

	let { track, label }: Props = $props();

	type Rung = 'passed' | 'current' | 'locked';
	const rungs = $derived(
		LEVELS.map((level) => {
			const standing = levelStanding(track, level);
			const state: Rung =
				level < track.unlocked || (level === 10 && standing.passed)
					? 'passed'
					: level === track.unlocked
						? 'current'
						: 'locked';
			const name =
				state === 'passed'
					? m.ladder_rung_passed({ level })
					: state === 'current'
						? m.ladder_rung_current({ level, percent: percent(standing.ratio) })
						: m.ladder_rung_locked({ level });
			return { level, state, name };
		})
	);
</script>

<div class="track-ladder">
	<ol class="rungs" aria-label={m.ladder_label({ track: label })}>
		{#each rungs as rung (rung.level)}
			<li class={rung.state} title={rung.name}>
				<span class="visually-hidden">{rung.name}</span>
				<span aria-hidden="true">{ROMAN_NUMERALS[rung.level - 1]}</span>
				<span class="mark" aria-hidden="true">
					{rung.state === 'passed' ? '✓' : rung.state === 'current' ? '•' : ''}
				</span>
			</li>
		{/each}
	</ol>
	<LevelProgress {track} level={track.unlocked} />
</div>

<style>
	.track-ladder {
		display: grid;
		gap: var(--space-2);
	}

	.rungs {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(10, minmax(0, 1fr));
		gap: var(--space-1);
	}

	.rungs li {
		display: grid;
		justify-items: center;
		gap: 0.1rem;
		padding: var(--space-2) 0;
		border: 1px solid var(--rule-strong);
		border-radius: var(--radius);
		font-variant: small-caps;
		font-variant-numeric: lining-nums;
		font-size: var(--step--1);
		line-height: 1.1;
	}

	.rungs li.passed {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--on-ink);
	}

	.rungs li.current {
		background: var(--accent-soft);
		border-color: var(--accent);
		color: var(--ink);
	}

	.rungs li.locked {
		border-style: dashed;
		color: var(--ink-soft);
	}

	.mark {
		min-height: 1em;
	}
</style>
