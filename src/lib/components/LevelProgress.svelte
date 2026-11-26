<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import type { Level } from '#lib/music/levels.ts';
	import { countsRuns, ruleFor } from '#lib/progress/curriculum.ts';
	import {
		drillStanding,
		type GradedModule,
		moduleStanding,
		percent,
		trackOf
	} from '#lib/progress/ladder.ts';
	import { progress } from '#lib/state/progress.svelte.ts';

	interface Props {
		track: GradedModule;
		level: Level;
		/** Shows one exercise's grade instead of the whole level. */
		exercise?: { id: string; label: string };
	}

	let { track, level, exercise }: Props = $props();

	const standing = $derived(moduleStanding(progress.state, track, level));
	const drill = $derived(
		exercise
			? drillStanding(
					trackOf(progress.state, track),
					level,
					exercise.id,
					ruleFor(track, level, exercise.id)
				)
			: null
	);
	const value = $derived(percent(drill ? drill.ratio : standing.ratio));
	const detail = $derived.by(() => {
		if (level === 10 && standing.passed) return m.progress_top();
		if (drill && exercise) {
			const towards = {
				correct: drill.recentCorrect,
				required: drill.required,
				window: drill.window,
				exercise: exercise.label
			};
			return drill.passed
				? m.drill_progress_graded({ exercise: exercise.label })
				: countsRuns(track)
					? m.drill_progress_towards_runs(towards)
					: m.drill_progress_towards(towards);
		}
		return standing.passed
			? m.progress_passed({ level })
			: m.level_progress_towards({
					graded: standing.drills.filter((d) => d.passed).length,
					total: standing.drills.length,
					level
				});
	});
	const barLabel = $derived(
		exercise ? m.drill_bar_label({ exercise: exercise.label }) : m.progress_bar_label({ level })
	);
</script>

<div class="level-progress">
	<div
		class="bar"
		role="progressbar"
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={value}
		aria-label={barLabel}
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
