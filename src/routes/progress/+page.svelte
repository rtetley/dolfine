<script lang="ts">
	import { resolve } from '$app/paths';
	import LevelBadge from '#lib/components/LevelBadge.svelte';
	import TrackLadder from '#lib/components/TrackLadder.svelte';
	import { getLocale, m } from '#lib/i18n.ts';
	import { JAZZ_MAPPING } from '#lib/music/levels.ts';
	import { ACHIEVEMENTS } from '#lib/progress/achievements.ts';
	import {
		dayStreak,
		localDay,
		percent,
		REQUIRED_CORRECT,
		trackOf,
		UNLOCK_WINDOW
	} from '#lib/progress/ladder.ts';
	import { achievementDetail, achievementTitle } from '#lib/progress/labels.ts';
	import { progress } from '#lib/state/progress.svelte.ts';

	const state = $derived(progress.state);
	const accuracy = $derived(state.answered > 0 ? percent(state.correct / state.answered) : 0);
	const streak = $derived(dayStreak(state.days, localDay()));
	const earned = $derived(ACHIEVEMENTS.filter((id) => id in state.achievements).length);
	const theoryLevel = $derived(trackOf(state, 'theory').unlocked);
	const earLevel = $derived(trackOf(state, 'ear').unlocked);

	const formatDay = (day: string): string =>
		new Date(`${day}T12:00:00`).toLocaleDateString(getLocale(), {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
</script>

<svelte:head>
	<title>{m.page_title({ page: m.nav_progress() })}</title>
</svelte:head>

<div class="page">
	<h1>{m.nav_progress()}</h1>
	<p class="lede">
		{m.progress_lede({ required: REQUIRED_CORRECT, window: UNLOCK_WINDOW })}
	</p>

	<div class="stats" aria-label={m.progress_totals_label()} role="group">
		<div class="stat">
			<strong>{state.xp}</strong><span class="label">{m.progress_xp()}</span>
		</div>
		<div class="stat">
			<strong>{state.correct}</strong>
			<span class="label">{m.progress_right_answers({ accuracy })}</span>
		</div>
		<div class="stat">
			<strong>{state.bestRun}</strong><span class="label">{m.progress_best_run()}</span>
		</div>
		<div class="stat">
			<strong>{streak}</strong><span class="label">{m.progress_day_streak()}</span>
		</div>
	</div>

	<section aria-labelledby="theory-ladder">
		<div class="module-head">
			<LevelBadge level={theoryLevel} size="large" />
			<div>
				<h2 id="theory-ladder">{m.nav_theory()}</h2>
				<p class="equivalent">
					≈ {JAZZ_MAPPING[theoryLevel].abrsm} · {JAZZ_MAPPING[theoryLevel].french}
				</p>
			</div>
		</div>
		<TrackLadder module="theory" label={m.nav_theory()} />
		<p class="go">
			<a href={resolve('/theory')}>{m.progress_practise({ module: m.nav_theory() })} →</a>
		</p>
	</section>

	<section aria-labelledby="ear-ladder">
		<div class="module-head">
			<LevelBadge level={earLevel} size="large" />
			<div>
				<h2 id="ear-ladder">{m.nav_ear()}</h2>
				<p class="equivalent">
					≈ {JAZZ_MAPPING[earLevel].abrsm} · {JAZZ_MAPPING[earLevel].french}
				</p>
			</div>
		</div>
		<TrackLadder module="ear" label={m.nav_ear()} />
		<p class="go"><a href={resolve('/ear')}>{m.progress_practise({ module: m.nav_ear() })} →</a></p>
	</section>

	<section aria-labelledby="ungraded">
		<h2 id="ungraded">{m.progress_ungraded_heading()}</h2>
		<p class="note">{m.progress_ungraded()}</p>
	</section>

	<section aria-labelledby="achievements">
		<h2 id="achievements">
			{m.progress_achievements({ earned, total: ACHIEVEMENTS.length })}
		</h2>
		<ul class="achievements">
			{#each ACHIEVEMENTS as id (id)}
				{@const day = state.achievements[id]}
				<li class:earned={day !== undefined}>
					<span class="title">{achievementTitle(id)}</span>
					<span class="detail">{achievementDetail(id)}</span>
					<span class="when">
						{day ? m.achievement_earned_on({ date: formatDay(day) }) : m.achievement_not_yet()}
					</span>
				</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	section {
		margin-top: var(--space-6);
		max-width: var(--measure);
	}

	.module-head {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.module-head h2 {
		margin: 0;
	}

	.equivalent,
	.note {
		margin: 0;
		color: var(--ink-soft);
		font-style: italic;
	}

	.equivalent {
		font-size: var(--step--1);
	}

	.go {
		margin: var(--space-3) 0 0;
	}

	.achievements {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
		gap: var(--space-3);
	}

	.achievements li {
		display: grid;
		gap: var(--space-1);
		align-content: start;
		padding: var(--space-3) var(--space-4);
		border: 1px dashed var(--rule-strong);
		border-radius: var(--radius);
		color: var(--ink-soft);
	}

	.achievements li.earned {
		border: 3px double var(--ink);
		color: var(--ink);
	}

	.title {
		font-variant: small-caps;
		letter-spacing: 0.04em;
		font-size: var(--step-0);
	}

	.detail,
	.when {
		font-size: var(--step--1);
	}

	.when {
		font-style: italic;
		color: var(--ink-soft);
	}
</style>
