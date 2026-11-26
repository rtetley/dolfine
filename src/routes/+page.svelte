<script lang="ts">
	import { resolve } from '$app/paths';
	import DropCap from '#lib/brand/DropCap.svelte';
	import LevelBadge from '#lib/components/LevelBadge.svelte';
	import { m } from '#lib/i18n.ts';
	import { ACHIEVEMENTS } from '#lib/progress/achievements.ts';
	import { type ModuleStatus, moduleStatuses } from '#lib/progress/dashboard.ts';
	import { dayStreak, localDay } from '#lib/progress/ladder.ts';
	import { trackShortLabel } from '#lib/progress/labels.ts';
	import {
		continueStore,
		MODULE_ROUTES,
		type ModuleId,
		readSavedPrefs
	} from '#lib/state/modulePrefs.svelte.ts';
	import { onboarding } from '#lib/state/onboarding.svelte.ts';
	import { progress } from '#lib/state/progress.svelte.ts';
	import { RESUME_QUERY } from '#lib/state/resume.ts';

	const modules = [
		{
			id: 'sight-reading',
			name: m.nav_sight_reading,
			description: m.module_sight_reading_description,
			sub: m.module_sight_reading_sub
		},
		{
			id: 'rhythm',
			name: m.nav_rhythm,
			description: m.module_rhythm_description,
			sub: m.module_rhythm_sub
		},
		{
			id: 'theory',
			name: m.nav_theory,
			description: m.module_theory_description,
			sub: m.module_theory_sub
		},
		{
			id: 'ear',
			name: m.nav_ear,
			description: m.module_ear_description,
			sub: m.module_ear_sub
		}
	] as const;

	const saved = Object.fromEntries(modules.map(({ id }) => [id, readSavedPrefs(id)])) as Record<
		ModuleId,
		Record<string, unknown>
	>;

	const entry = $derived(continueStore.entry);
	const state = $derived(progress.state);
	const statuses = $derived(moduleStatuses(state, saved));
	const streak = $derived(dayStreak(state.days, localDay()));
	const earned = $derived(ACHIEVEMENTS.filter((id) => id in state.achievements).length);
	const welcome = m.welcome();

	function progressLine(status: ModuleStatus): string {
		if (!status.graded) {
			return status.level === null
				? m.dashboard_ungraded()
				: m.dashboard_ungraded_level({ level: status.level });
		}
		const detail = status.atTop
			? m.dashboard_level_top()
			: !status.started
				? m.dashboard_start_here({ level: status.level })
				: m.dashboard_level_towards({
						level: status.level,
						percent: status.percent,
						next: status.level + 1
					});
		return status.track === 'theory'
			? detail
			: m.dashboard_track_detail({ track: trackShortLabel(status.track), detail });
	}
</script>

<svelte:head>
	<title>{m.page_title({ page: m.nav_dashboard() })}</title>
</svelte:head>

<div class="page">
	{#if !entry}
		<section class="prose welcome" style="display: flow-root">
			<p><DropCap letter={welcome.charAt(0)} />{welcome.slice(1)}</p>
		</section>
	{/if}

	<div class="top" class:single={!entry || state.answered === 0}>
		{#if entry}
			<section aria-labelledby="continue-heading">
				<h2 id="continue-heading" class="label">{m.continue_heading()}</h2>
				<!-- resolve() takes no query string; the path itself is resolved. -->
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="continue" href={`${resolve(MODULE_ROUTES[entry.module])}?${RESUME_QUERY}`}>
					<span class="continue-name">{m.continue_heading()}</span>
					<span class="continue-detail">{entry.summary}</span>
					<span class="continue-action">{m.continue_action()}</span>
				</a>
				<a class="setup-link" href={resolve(MODULE_ROUTES[entry.module])}>
					{m.continue_setup()}
				</a>
			</section>
		{/if}

		{#if state.answered > 0}
			<section aria-labelledby="progress-heading">
				<h2 id="progress-heading" class="label">{m.dashboard_progress_heading()}</h2>
				<dl class="totals">
					<div>
						<dt class="label">{m.progress_xp()}</dt>
						<dd>{state.xp}</dd>
					</div>
					<div>
						<dt class="label">{m.progress_day_streak()}</dt>
						<dd>{streak}</dd>
					</div>
					<div>
						<dt class="label">{m.dashboard_achievements()}</dt>
						<dd>{m.dashboard_of({ count: earned, total: ACHIEVEMENTS.length })}</dd>
					</div>
				</dl>
				<a href={resolve('/progress')}>{m.dashboard_see_progress()} →</a>
			</section>
		{/if}
	</div>

	<section aria-labelledby="modules-heading" data-tour="modules">
		<h2 id="modules-heading" class="label">{m.modules_heading()}</h2>
		<ul class="modules">
			{#each modules as module (module.id)}
				{@const status = statuses[module.id]}
				<li>
					<a href={resolve(MODULE_ROUTES[module.id])}>
						<span class="module-head">
							<span class="module-name">{module.name()}</span>
							{#if status.graded}
								<LevelBadge
									level={status.estimate}
									label={m.dashboard_badge_label({ level: status.estimate })}
								/>
							{/if}
						</span>
						<span>{module.description()}</span>
						<span class="quiet">{module.sub()}</span>
						<span class="module-progress">
							{#if status.graded}
								<span class="bar" aria-hidden="true">
									<span class="fill" style:width="{status.percent}%"></span>
								</span>
							{/if}
							<span class="quiet">{progressLine(status)}</span>
						</span>
						<span class="quiet open">{m.module_open()}</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	{#if onboarding.tourPending}
		<!-- Loaded only for the visit that shows it. -->
		{#await import('#lib/components/Tour.svelte') then { default: Tour }}
			<Tour onfinish={() => onboarding.finishTour()} />
		{/await}
	{/if}
</div>

<style>
	.top {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
		gap: var(--space-5);
		align-items: start;
	}

	.top.single {
		grid-template-columns: minmax(0, var(--measure));
	}

	.continue {
		display: grid;
		gap: var(--space-1);
		padding: var(--space-4) var(--space-5);
		border: 1px solid var(--accent);
		background: var(--accent-soft);
		border-radius: var(--radius);
		text-decoration: none;
	}

	.continue-name {
		font-size: var(--step-1);
	}

	.setup-link {
		display: inline-block;
		margin-top: var(--space-2);
		font-size: var(--step--1);
		color: var(--ink-soft);
	}

	.continue-action,
	.quiet {
		color: var(--ink-soft);
		font-size: var(--step--1);
	}

	.welcome {
		margin-bottom: var(--space-4);
	}

	.totals {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		margin: 0 0 var(--space-3);
	}

	.totals div {
		display: flex;
		flex-direction: column-reverse;
	}

	.totals dd {
		margin: 0;
		font-size: var(--step-2);
		font-variant-numeric: lining-nums;
		line-height: var(--leading-tight);
	}

	.modules {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
		gap: var(--space-4);
	}

	.modules a {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		height: 100%;
		padding: var(--space-4) var(--space-4);
		border: 1px solid var(--rule-strong);
		border-radius: var(--radius);
		text-decoration: none;
		transition: border-color var(--duration) ease;
	}

	.modules a:hover {
		border-color: var(--ink-soft);
	}

	.module-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-3);
	}

	.module-name {
		font-size: var(--step-1);
		font-weight: 600;
		line-height: var(--leading-tight);
	}

	.module-progress {
		display: grid;
		gap: var(--space-1);
		margin-top: auto;
		padding-top: var(--space-3);
	}

	.bar {
		display: block;
		height: 0.35rem;
		border: 1px solid var(--rule-strong);
		border-radius: var(--radius);
		background: var(--paper-deep);
		overflow: hidden;
	}

	.fill {
		display: block;
		height: 100%;
		background: var(--ink-soft);
	}

	.open {
		margin-top: var(--space-2);
	}
</style>
