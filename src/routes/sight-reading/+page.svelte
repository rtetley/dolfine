<script lang="ts">
	import GuideText from '#lib/components/GuideText.svelte';
	import ModuleIntro from '#lib/components/ModuleIntro.svelte';
	import { m } from '#lib/i18n.ts';
	import { SIGHT_READING_GUIDES } from '#lib/content/guides.ts';
	import { midi } from '#lib/midi/midi.svelte.ts';
	import type { Level } from '#lib/music/levels.ts';
	import { newSeed } from '#lib/music/random.ts';
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
	import type { Performance } from '#lib/modules/sight-reading/spoken.ts';
	import {
		continueStore,
		loadModulePrefs,
		saveModulePrefs
	} from '#lib/state/modulePrefs.svelte.ts';
	import { onResume } from '#lib/state/resume.ts';
	import { settings } from '#lib/state/settings.svelte.ts';
	import { voiceProfile } from '#lib/state/voiceProfile.svelte.ts';

	type View = 'setup' | 'performance' | 'practice' | 'results' | 'stopped';
	type Run = 'performance' | 'practice';

	let prefs = $state<SightReadingPrefs>(loadModulePrefs('sight-reading', SIGHT_READING_DEFAULTS));
	let view = $state<View>('setup');
	let exercise = $state<SightReadingExercise | null>(null);
	const NOTHING_PLAYED: Performance = { input: 'midi', notes: [] };
	let performance = $state<Performance>(NOTHING_PLAYED);
	let runKey = $state(0);
	let skipPreview = $state(false);

	function updatePrefs(patch: Partial<SightReadingPrefs>): void {
		prefs = { ...prefs, ...patch };
		saveModulePrefs('sight-reading', prefs);
	}

	const spoken = $derived(prefs.mode === 'performance' && prefs.input === 'voice');

	function start(seed = newSeed()): void {
		if (spoken && !voiceProfile.for(settings.noteNames)) {
			view = 'setup';
			return;
		}
		exercise = createExercise(prefs, seed);
		continueStore.record({
			module: 'sight-reading',
			summary: exerciseSummary(exercise, prefs, settings.noteNames)
		});
		run(prefs.mode === 'performance' ? 'performance' : 'practice', false);
	}

	function run(next: Run, alreadyPreviewed = true): void {
		performance = NOTHING_PLAYED;
		skipPreview = alreadyPreviewed;
		runKey++;
		view = next;
	}

	function finish(result: Performance): void {
		performance = result;
		view = 'results';
	}

	function levelUp(): void {
		if (prefs.level < 10) updatePrefs({ level: (prefs.level + 1) as Level });
		start();
	}

	// Opened from Continue on the dashboard: go straight back to an exercise.
	onResume(() => start());
</script>

<svelte:head>
	<title>{m.page_title({ page: m.nav_sight_reading() })}</title>
</svelte:head>

<div class="page">
	<h1>{m.nav_sight_reading()}</h1>
	<p class="lede">{m.sight_reading_lede()}</p>

	{#if view === 'setup'}
		<ModuleIntro module="sight-reading" />
		<Setup {prefs} onchange={updatePrefs} onstart={() => start()} />
		<GuideText guide={SIGHT_READING_GUIDES.intro} open />
		<GuideText guide={SIGHT_READING_GUIDES.dandelot} open={prefs.level <= 3} />
		<GuideText guide={SIGHT_READING_GUIDES.technique} />
		<GuideText guide={SIGHT_READING_GUIDES.modes} />
	{:else if exercise}
		<p class="label summary">
			{exerciseSummary(
				exercise,
				prefs,
				settings.noteNames,
				view === 'practice' ? 'practice' : 'performance'
			)}
		</p>
		{#key runKey}
			{#if view === 'performance'}
				<PerformanceRun
					{exercise}
					{prefs}
					{skipPreview}
					onfinish={finish}
					onrestart={() => run('performance')}
					onstop={() => (view = 'stopped')}
				/>
			{:else if view === 'practice'}
				<PracticeRun
					{exercise}
					{prefs}
					onperform={() => run('performance')}
					onnext={() => start()}
					onsetup={() => (view = 'setup')}
				/>
			{:else if view === 'results' || view === 'stopped'}
				<Results
					{exercise}
					{performance}
					scored={performance.input === 'voice' || midi.status === 'ready'}
					stopped={view === 'stopped'}
					showReferences={prefs.referenceNotes}
					canLevelUp={prefs.level < 10}
					onrestart={() => run('performance')}
					onpractise={() => run('practice')}
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
		margin-bottom: var(--space-2);
	}
</style>
