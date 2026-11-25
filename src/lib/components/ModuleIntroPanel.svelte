<script lang="ts">
	import { resolve } from '$app/paths';
	import DropCap from '#lib/brand/DropCap.svelte';
	import { MODULE_INTROS } from '#lib/content/onboarding.ts';
	import { m } from '#lib/i18n.ts';
	import { JAZZ_MAPPING, type Level, LEVELS } from '#lib/music/levels.ts';
	import { LESSON_TEXT } from '#lib/modules/theory/lessonText.ts';
	import { type TrackId, trackOf } from '#lib/progress/ladder.ts';
	import { MODULE_ROUTES, type ModuleId } from '#lib/state/modulePrefs.svelte.ts';
	import { onboarding } from '#lib/state/onboarding.svelte.ts';
	import { progress } from '#lib/state/progress.svelte.ts';

	interface Props {
		module: ModuleId;
		/** Graded modules: the ladders a self-declared level applies to. */
		tracks?: readonly TrackId[];
		/** Called after the student places themself, with the level to switch to. */
		onplace?: (level: Level) => void;
	}

	let { module, tracks = [], onplace }: Props = $props();

	const intro = $derived(MODULE_INTROS[module]);
	const welcome = $derived(intro.welcome());
	const MODULE_NAMES: Record<ModuleId, () => string> = {
		'sight-reading': m.nav_sight_reading,
		rhythm: m.nav_rhythm,
		theory: m.nav_theory,
		ear: m.nav_ear
	};

	const lowest = $derived(
		tracks.length === 0
			? 1
			: Math.min(...tracks.map((track) => trackOf(progress.state, track).unlocked))
	);
	let placement = $state<Level>(2);
	let placed = $state<Level | null>(null);

	function place(): void {
		progress.place(tracks, placement);
		placed = placement;
		onplace?.(placement);
	}
</script>

<section class="intro" aria-labelledby="intro-{module}">
	<h2 id="intro-{module}">{intro.title()}</h2>
	<div class="prose">
		<p><DropCap letter={welcome.charAt(0)} />{welcome.slice(1)}</p>
	</div>

	<h3 class="label">{m.intro_steps_heading()}</h3>
	<ol class="steps">
		{#each intro.steps as step, i (i)}<li>{step()}</li>{/each}
	</ol>

	<h3 class="label">{m.intro_first_heading()}</h3>
	<p>{intro.studyFirst()}</p>
	{#if intro.lessons.length > 0}
		<ol class="lessons" aria-label={m.lessons_title()}>
			{#each intro.lessons as lesson (lesson)}
				<li>
					<a href={resolve('/theory/lessons/[lesson]', { lesson })}>
						{LESSON_TEXT[lesson].title()} →
					</a>
				</li>
			{/each}
		</ol>
	{/if}

	<h3 class="label">{m.intro_next_heading()}</h3>
	<p>{intro.nextLevel()}</p>

	{#if intro.graded && tracks.length > 0 && lowest < 10}
		<div class="placement">
			<label class="field">
				<span class="label">{m.intro_place_label()}</span>
				<select
					value={placement}
					onchange={(e) => (placement = Number(e.currentTarget.value) as Level)}
				>
					{#each LEVELS.filter((level) => level > 1) as level (level)}
						<option value={level}>
							{m.level_option({ level })} · ≈ {JAZZ_MAPPING[level].abrsm} · {JAZZ_MAPPING[level]
								.french}
						</option>
					{/each}
				</select>
			</label>
			<button type="button" onclick={place}>{m.intro_place_action()}</button>
			<p class="hint">
				{#if placed}
					<span role="status">{m.intro_placed({ level: placed })}</span>
				{:else}
					{m.intro_place_hint()}
				{/if}
			</p>
		</div>
	{/if}

	{#if intro.related}
		<p class="related">
			{intro.related.text()}
			<a href={resolve(MODULE_ROUTES[intro.related.module])}>
				{MODULE_NAMES[intro.related.module]()} →
			</a>
		</p>
	{/if}

	<div class="actions">
		<button type="button" onclick={() => onboarding.markSeen(module)}>
			{m.intro_dismiss()}
		</button>
	</div>
</section>

<style>
	.intro {
		max-width: var(--measure);
		margin: var(--space-4) 0 var(--space-5);
		padding: var(--space-4) var(--space-5);
		border: 1px solid var(--rule-strong);
		border-left: 3px double var(--ink);
		border-radius: var(--radius);
	}

	h2 {
		margin-top: 0;
	}

	h3 {
		margin: var(--space-4) 0 var(--space-1);
		font-size: var(--step--1);
		font-weight: normal;
	}

	.prose {
		display: flow-root;
	}

	p {
		margin: 0;
	}

	.steps,
	.lessons {
		margin: 0;
		padding-left: var(--space-5);
	}

	.lessons {
		margin-top: var(--space-2);
	}

	.placement {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: var(--space-3);
		margin-top: var(--space-4);
	}

	.placement .field {
		flex: 1 1 16rem;
	}

	.placement .hint {
		flex-basis: 100%;
		color: var(--ink-soft);
		font-size: var(--step--1);
	}

	.related {
		margin-top: var(--space-4);
		font-style: italic;
	}
</style>
