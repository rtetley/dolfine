<script lang="ts">
	import { resolve } from '$app/paths';
	import Logo from '#lib/components/Logo.svelte';
	import { m } from '#lib/i18n.ts';
	import LessonIntro from '#lib/modules/theory/lessons/LessonIntro.svelte';
	import { isLessonOpen, LESSON_PLANS, lessonLevel } from '#lib/modules/theory/lessonPlan.ts';
	import { LESSON_TEXT, SECTION_TITLES } from '#lib/modules/theory/lessonText.ts';
	import { isScaleLesson, LESSON_PARENTS } from '#lib/modules/theory/lessons.ts';
	import { progress } from '#lib/state/progress.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const text = $derived(LESSON_TEXT[data.lesson]);
	const plan = $derived(LESSON_PLANS[data.lesson]);
	const level = $derived(lessonLevel(data.lesson));
	const open = $derived(isLessonOpen(data.lesson, progress.unlocked('theory')));
	// The intro needs no entry in the outline: it is where the page starts.
	const outline = $derived(plan.filter((section) => section !== 'intro'));
</script>

<svelte:head>
	<title>{m.page_title({ page: text.title() })}</title>
</svelte:head>

<!-- A lesson takes the whole page: the site's navigation gives way to a way back. -->
<header class="lesson-bar">
	<a class="home" href={resolve('/')} aria-label={m.nav_home()}><Logo size={28} /></a>
	<a href={resolve('/theory/lessons')}>← {m.lessons_all()}</a>
	<a class="exercises" href={resolve('/theory')}>{m.lessons_back_to_exercises()}</a>
</header>

<article class="page lesson" aria-labelledby="lesson-title">
	<p class="label">{m.lesson_kicker({ level })}</p>
	<h1 id="lesson-title">{text.title()}</h1>

	{#if !open}
		<div class="locked" role="status">
			<p><strong>{m.lesson_locked_title()}</strong></p>
			<p>{m.lesson_locked({ level: level - 1 })}</p>
			<a href={resolve('/theory')}>{m.lessons_back_to_exercises()} →</a>
		</div>
	{:else}
		<nav class="outline" aria-label={m.lesson_outline()}>
			<ol>
				{#each outline as section (section)}
					<li><a href="#{section}">{SECTION_TITLES[section]()}</a></li>
				{/each}
			</ol>
		</nav>

		{#key data.lesson}
			{#each plan as section (section)}
				{#if section === 'intro'}
					<section id="intro" aria-label={SECTION_TITLES.intro()}>
						<LessonIntro paragraphs={text.paragraphs()} />
					</section>
				{:else if section === 'harmonization' && isScaleLesson(data.lesson)}
					<!-- Each kind of lesson loads its own examples; both scale sections share one key. -->
					{#await import('#lib/modules/theory/lessons/ScaleLesson.svelte') then { default: ScaleLesson }}
						<ScaleLesson
							parent={LESSON_PARENTS[data.lesson]}
							titles={{
								harmonization: SECTION_TITLES.harmonization(),
								modes: SECTION_TITLES.modes()
							}}
						/>
					{/await}
				{:else if section === 'colours' && (data.lesson === 'chord-colours' || data.lesson === 'four-colours')}
					{@const lesson = data.lesson}
					{#await import('#lib/modules/theory/lessons/ColourLesson.svelte') then { default: ColourLesson }}
						<ColourLesson {lesson} title={SECTION_TITLES.colours()} />
					{/await}
				{:else if section === 'voicings'}
					<section id="voicings" aria-labelledby="voicings-title">
						<h2 id="voicings-title">{SECTION_TITLES.voicings()}</h2>
						{#await import('#lib/modules/theory/lessons/VoicingsLesson.svelte') then { default: VoicingsLesson }}
							<VoicingsLesson />
						{/await}
					</section>
				{:else if section === 'further'}
					<section id="further" class="further" aria-labelledby="further-title">
						<h2 id="further-title">{SECTION_TITLES.further()}</h2>
						<div class="prose">
							{#each text.further() as paragraph, i (i)}<p>{paragraph}</p>{/each}
						</div>
					</section>
				{:else if section === 'exercises'}
					<section id="exercises" aria-labelledby="exercises-title">
						<h2 id="exercises-title">{SECTION_TITLES.exercises()}</h2>
						<!-- At the end of the lesson: loaded with it, not before it. -->
						{#await import('#lib/modules/theory/lessons/LessonExercises.svelte') then { default: LessonExercises }}
							<LessonExercises lesson={data.lesson} />
						{/await}
					</section>
				{/if}
			{/each}
		{/key}
	{/if}
</article>

<style>
	.lesson-bar {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-2) var(--space-5);
		border-bottom: var(--border) solid var(--rule);
	}

	.lesson-bar .exercises {
		margin-left: auto;
	}

	.home {
		display: inline-flex;
	}

	.outline ol {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-5);
		margin: 0 0 var(--space-5);
		padding: 0;
		list-style: none;
		font-size: var(--step--1);
	}

	.lesson section {
		scroll-margin-top: var(--space-5);
		margin-top: var(--space-6);
	}

	.lesson section:first-of-type {
		margin-top: 0;
	}

	.further .prose {
		max-width: var(--measure);
	}

	.locked {
		max-width: var(--measure);
		padding: var(--space-4) var(--space-5);
		border-left: 2px solid var(--accent);
	}

	.locked p {
		margin: 0 0 var(--space-2);
	}
</style>
