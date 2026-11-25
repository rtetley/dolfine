<script lang="ts">
	import GuideText from '#lib/components/GuideText.svelte';
	import { m } from '#lib/i18n.ts';
	import { SIGHT_READING_GUIDES } from '#lib/content/guides.ts';
	import { midi } from '#lib/midi/midi.svelte.ts';
	import type { Level } from '#lib/music/levels.ts';
	import { newSeed } from '#lib/music/random.ts';
	import type { PlayedNote } from '#lib/music/scoring.ts';
	import {
		createExercise,
		exerciseSummary,
		type SightReadingExercise
	} from '#lib/modules/sight-reading/exercise.ts';
	import PerformanceRun from '#lib/modules/sight-reading/PerformanceRun.svelte';
	import PracticeRun from '#lib/modules/sight-reading/PracticeRun.svelte';
	import {
		SIGHT_READING_DEFAULTS,
		type SightReadingPrefs
	} from '#lib/modules/sight-reading/prefs.ts';
	import Results from '#lib/modules/sight-reading/Results.svelte';
	import Setup from '#lib/modules/sight-reading/Setup.svelte';
	import {
		continueStore,
		loadModulePrefs,
		saveModulePrefs
	} from '#lib/state/modulePrefs.svelte.ts';
	import { settings } from '#lib/state/settings.svelte.ts';

	type View = 'setup' | 'performance' | 'practice' | 'results';

	let prefs = $state<SightReadingPrefs>(loadModulePrefs('sight-reading', SIGHT_READING_DEFAULTS));
	let view = $state<View>('setup');
	let exercise = $state<SightReadingExercise | null>(null);
	let played = $state<PlayedNote[]>([]);
	let runKey = $state(0);

	function updatePrefs(patch: Partial<SightReadingPrefs>): void {
		prefs = { ...prefs, ...patch };
		saveModulePrefs('sight-reading', prefs);
	}

	function start(seed = newSeed()): void {
		exercise = createExercise(prefs, seed);
		continueStore.record({
			module: 'sight-reading',
			summary: exerciseSummary(exercise, prefs, settings.noteNames)
		});
		runKey++;
		view = prefs.mode === 'performance' ? 'performance' : 'practice';
	}

	function finish(notes: PlayedNote[]): void {
		played = notes;
		view = 'results';
	}

	function levelUp(): void {
		if (prefs.level < 10) updatePrefs({ level: (prefs.level + 1) as Level });
		start();
	}
</script>

<svelte:head>
	<title>{m.page_title({ page: m.nav_sight_reading() })}</title>
</svelte:head>

<div class="page">
	<h1>{m.nav_sight_reading()}</h1>
	<p class="lede">{m.sight_reading_lede()}</p>

	{#if view === 'setup'}
		<Setup {prefs} onchange={updatePrefs} onstart={() => start()} />
		<GuideText guide={SIGHT_READING_GUIDES.intro} open />
		<GuideText guide={SIGHT_READING_GUIDES.dandelot} open={prefs.level <= 3} />
		<GuideText guide={SIGHT_READING_GUIDES.technique} />
		<GuideText guide={SIGHT_READING_GUIDES.modes} />
	{:else if exercise}
		<p class="label summary">{exerciseSummary(exercise, prefs, settings.noteNames)}</p>
		{#key runKey}
			{#if view === 'performance'}
				<PerformanceRun {exercise} {prefs} onfinish={finish} oncancel={() => (view = 'setup')} />
			{:else if view === 'practice'}
				<PracticeRun {exercise} {prefs} onnext={() => start()} onsetup={() => (view = 'setup')} />
			{:else if view === 'results'}
				<Results
					{exercise}
					{played}
					scored={midi.status === 'ready'}
					canLevelUp={prefs.level < 10}
					onretry={() => start(exercise?.seed)}
					onnext={() => start()}
					onlevelup={levelUp}
					onsetup={() => (view = 'setup')}
				/>
			{/if}
		{/key}
	{/if}
</div>

<style>
	.summary {
		margin-bottom: 0.5rem;
	}
</style>
