<script lang="ts" generics="E extends string">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n.ts';
	import { JAZZ_MAPPING, type Level, LEVELS } from '#lib/music/levels.ts';
	import { LESSON_TEXT } from '#lib/modules/theory/lessonText.ts';
	import type { Curriculum } from '#lib/progress/curriculum.ts';
	import {
		drillStanding,
		type GradedModule,
		isLevel,
		percent,
		trackOf,
		UNLOCK_ACCURACY
	} from '#lib/progress/ladder.ts';
	import { stageTitle } from '#lib/progress/labels.ts';
	import { progress } from '#lib/state/progress.svelte.ts';
	import DrillButton from './DrillButton.svelte';
	import LevelBadge from './LevelBadge.svelte';

	interface Props {
		module: GradedModule;
		curriculum: Curriculum<E>;
		labels: Record<E, string>;
		onpick: (level: Level, exercise: E) => void;
	}

	let { module, curriculum, labels, onpick }: Props = $props();

	const unlocked = $derived(progress.unlocked(module));
	const track = $derived(trackOf(progress.state, module));

	const drillsAt = (level: Level) =>
		curriculum[level].drills.map(({ exercise }) => ({
			exercise,
			standing: drillStanding(track, level, exercise)
		}));

	const stages = $derived(
		LEVELS.map((level) => {
			const drills = drillsAt(level);
			return {
				stage: curriculum[level],
				drills,
				passed: drills.every((drill) => drill.standing.passed),
				locked: level > unlocked
			};
		})
	);

	function unlockSummary(level: Level): string {
		const prior = level - 1;
		if (!isLevel(prior)) return '';
		if (prior > unlocked) return m.stage_unlock_after({ level: prior });
		const missing = drillsAt(prior)
			.filter((drill) => !drill.standing.passed)
			.map((drill) => labels[drill.exercise]);
		return m.stage_unlock_needs({
			level: prior,
			percent: percent(UNLOCK_ACCURACY),
			exercises: missing.join(' · ')
		});
	}
</script>

<div class="stage-map">
	{#each stages as { stage, drills, passed, locked } (stage.level)}
		{@const titleId = `${module}-stage-${stage.level}`}
		<section class="stage" class:locked aria-labelledby={titleId}>
			<header>
				<LevelBadge level={stage.level} />
				<div class="heading">
					<h2 id={titleId}>
						<span class="label">{m.level_option({ level: stage.level })}</span>
						{stageTitle(module, stage.level)}
					</h2>
					<p class="meta">
						≈ {JAZZ_MAPPING[stage.level].abrsm} · {JAZZ_MAPPING[stage.level].french}
						{#if passed && !locked}· <span class="passed">{m.stage_passed()}</span>{/if}
					</p>
				</div>
			</header>
			<div class="body" inert={locked}>
				{#if stage.lesson}
					<p class="lesson">
						<span class="label">{m.stage_lesson()}</span>
						<a href={resolve('/theory/lessons/[lesson]', { lesson: stage.lesson })}>
							{LESSON_TEXT[stage.lesson].title()}
						</a>
					</p>
				{/if}
				<ul class="drills">
					{#each drills as { exercise, standing } (exercise)}
						<li>
							<DrillButton
								label={labels[exercise]}
								{standing}
								disabled={locked}
								onpick={() => onpick(stage.level, exercise)}
							/>
						</li>
					{/each}
				</ul>
			</div>
			{#if locked}
				<div class="lock">
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<rect x="5" y="11" width="14" height="10" rx="1.5" />
						<path d="M8 11V8a4 4 0 0 1 8 0v3" />
					</svg>
					<p><strong>{m.stage_locked()}</strong></p>
					<p class="needs">{unlockSummary(stage.level)}</p>
				</div>
			{/if}
		</section>
	{/each}
</div>

<style>
	.stage-map {
		display: grid;
		max-width: var(--wide);
	}

	.stage {
		position: relative;
		padding: var(--space-4) 0;
		border-top: 1px solid var(--rule);
	}

	.stage:last-child {
		border-bottom: 1px solid var(--rule);
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	h2 {
		margin: 0;
		font-size: var(--step-1);
		line-height: var(--leading-tight);
	}

	h2 .label {
		display: block;
	}

	.meta,
	.lesson {
		margin: 0;
		font-size: var(--step--1);
		color: var(--ink-soft);
	}

	.meta {
		font-style: italic;
	}

	.passed {
		color: var(--good);
		font-style: normal;
	}

	.lesson {
		margin-top: var(--space-3);
	}

	.lesson .label {
		margin-right: var(--space-2);
	}

	.drills {
		list-style: none;
		margin: var(--space-3) 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.locked .body {
		opacity: 0.35;
		filter: grayscale(1);
	}

	.lock {
		position: absolute;
		inset: var(--space-2) 0;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: var(--space-1);
		padding: var(--space-3);
		background: color-mix(in oklab, var(--paper-deep) 70%, transparent);
		border-radius: var(--radius);
		text-align: center;
	}

	.lock svg {
		width: 1.75rem;
		height: 1.75rem;
		fill: none;
		stroke: var(--ink);
		stroke-width: 1.75;
	}

	.lock p {
		margin: 0;
		max-width: 32rem;
	}

	.lock strong {
		font-variant: small-caps;
		letter-spacing: 0.06em;
	}

	.needs {
		font-size: var(--step--1);
	}
</style>
