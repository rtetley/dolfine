<script lang="ts">
	import { onMount } from 'svelte';
	import GuideText from '#lib/components/GuideText.svelte';
	import ModuleIntro from '#lib/components/ModuleIntro.svelte';
	import { m } from '#lib/i18n.ts';
	import { SIGHT_READING_GUIDES } from '#lib/content/guides.ts';
	import { midi } from '#lib/midi/midi.svelte.ts';
	import type { Level } from '#lib/music/levels.ts';
	import { readingContent, type SightReadingDrill } from '#lib/music/sightReadingLevels.ts';
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
	import { type Performance, runPasses, scoreRun } from '#lib/modules/sight-reading/spoken.ts';
	import { openDrill, SIGHT_READING_CURRICULUM } from '#lib/progress/curriculum.ts';
	import {
		continueStore,
		loadModulePrefs,
		saveModulePrefs
	} from '#lib/state/modulePrefs.svelte.ts';
	import { onResume } from '#lib/state/resume.ts';
	import { progress } from '#lib/state/progress.svelte.ts';
	import { collection } from '#lib/state/collection.svelte.ts';
	import { settings } from '#lib/state/settings.svelte.ts';
	import { voiceProfile } from '#lib/state/voiceProfile.svelte.ts';

	type View = 'setup' | 'performance' | 'practice' | 'results' | 'stopped';
	type Run = 'performance' | 'practice';

	const stored = loadModulePrefs('sight-reading', SIGHT_READING_DEFAULTS);
	let prefs = $state<SightReadingPrefs>({
		...stored,
		...openDrill(SIGHT_READING_CURRICULUM, stored, progress.unlocked('sight-reading'))
	});
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
		progress.clearEvents();
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

	/**
	 * A scored run (a MIDI keyboard, or a spoken reading) counts as one answer on the ladder,
	 * unless the options slowed it below the level's tempo.
	 */
	function finish(result: Performance): void {
		performance = result;
		view = 'results';
		const scored = result.input === 'voice' || midi.status === 'ready';
		if (!exercise || !scored || !countsForLadder) return;
		progress.record(
			'sight-reading',
			prefs.level,
			prefs.exercise,
			runPasses(scoreRun(exercise, result))
		);
	}

	const countsForLadder = $derived(
		prefs.tempo === 0 || prefs.tempo >= readingContent(prefs.level, prefs.exercise).tempo
	);

	const loadLadder = async () => {
		const [panel, map, text] = await Promise.all([
			import('#lib/components/ProgressPanel.svelte'),
			import('#lib/components/StageMap.svelte'),
			import('#lib/modules/sight-reading/ladderText.ts')
		]);
		return { ProgressPanel: panel.default, StageMap: map.default, ...text };
	};

	const loadNotice = async () => {
		const [notice, text] = await Promise.all([
			import('#lib/components/ProgressNotice.svelte'),
			import('#lib/modules/sight-reading/ladderText.ts')
		]);
		return { ProgressNotice: notice.default, ...text };
	};

	function pick(level: Level, drill: SightReadingDrill): void {
		updatePrefs({ level, exercise: drill });
		start();
	}

	function openLevel(level: Level): void {
		pick(level, SIGHT_READING_CURRICULUM[level].drills[0].exercise);
	}

	function levelUp(): void {
		if (prefs.level < 10) openLevel((prefs.level + 1) as Level);
	}

	// Opened from Continue on the dashboard: go straight back to an exercise.
	onResume(() => start());

	// `?collect` turns collection mode on for this browser, `?collect=off` turns it off.
	onMount(() => collection.syncWithQuery(window.location.search));
</script>

<svelte:head>
	<title>{m.page_title({ page: m.nav_sight_reading() })}</title>
</svelte:head>

<div class="page">
	<h1>{m.nav_sight_reading()}</h1>
	<p class="lede">{m.sight_reading_lede()}</p>

	{#if view === 'setup'}
		<ModuleIntro
			module="sight-reading"
			tracks={['sight-reading']}
			onplace={(level: Level) =>
				updatePrefs({ ...openDrill(SIGHT_READING_CURRICULUM, { ...prefs, level }, level) })}
		/>
		<!-- The ladder loads after the page: it is most of what the setup shows, not what it needs first. -->
		{#await loadLadder() then { ProgressPanel, StageMap, SIGHT_READING_DRILL_LABELS, stageAbout }}
			<ProgressPanel track="sight-reading" />
			<StageMap
				module="sight-reading"
				curriculum={SIGHT_READING_CURRICULUM}
				labels={SIGHT_READING_DRILL_LABELS}
				onpick={pick}
				equivalents={false}
				describe={stageAbout}
			/>
		{/await}
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
					canLevelUp={prefs.level < progress.unlocked('sight-reading')}
					onrestart={() => run('performance')}
					onpractise={() => run('practice')}
					onnext={() => start()}
					onlevelup={levelUp}
					onsetup={() => (view = 'setup')}
				/>
				{#if view === 'results'}
					{#if !countsForLadder}
						<p class="note">{m.sight_run_not_counted()}</p>
					{/if}
					{#await loadNotice() then { ProgressNotice, SIGHT_READING_DRILL_LABELS }}
						<ProgressNotice
							track="sight-reading"
							level={prefs.level}
							exercise={prefs.exercise}
							label={SIGHT_READING_DRILL_LABELS[prefs.exercise]}
							onlevel={openLevel}
						/>
					{/await}
				{/if}
			{/if}
		{/key}
	{/if}
</div>

<style>
	.summary {
		margin-bottom: var(--space-2);
	}

	.note {
		max-width: var(--measure);
		color: var(--ink-soft);
		font-style: italic;
	}
</style>
