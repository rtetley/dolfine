<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import GuideText from '#lib/components/GuideText.svelte';
	import ModuleIntro from '#lib/components/ModuleIntro.svelte';
	import ProgressNotice from '#lib/components/ProgressNotice.svelte';
	import ProgressPanel from '#lib/components/ProgressPanel.svelte';
	import StageMap from '#lib/components/StageMap.svelte';
	import { m } from '#lib/i18n.ts';
	import MidiStatus from '#lib/components/MidiStatus.svelte';
	import { THEORY_GUIDES } from '#lib/content/guides.ts';
	import type { Level } from '#lib/music/levels.ts';
	import { newSeed } from '#lib/music/random.ts';
	import ChordExercise from '#lib/modules/theory/ChordExercise.svelte';
	import ContextExercise from '#lib/modules/theory/ContextExercise.svelte';
	import ModeExercise from '#lib/modules/theory/ModeExercise.svelte';
	import {
		answerFormatFor,
		createQuestion,
		THEORY_DEFAULTS,
		THEORY_EXERCISE_LABELS,
		type TheoryExercise,
		type TheoryPrefs,
		type TheoryQuestion
	} from '#lib/modules/theory/questions.ts';
	import SheetExercise from '#lib/modules/theory/SheetExercise.svelte';
	import { findDrill, openDrill, THEORY_CURRICULUM } from '#lib/progress/curriculum.ts';
	import { isLevel } from '#lib/progress/ladder.ts';
	import {
		continueStore,
		loadModulePrefs,
		saveModulePrefs
	} from '#lib/state/modulePrefs.svelte.ts';
	import { onResume } from '#lib/state/resume.ts';
	import { progress } from '#lib/state/progress.svelte.ts';

	const stored = loadModulePrefs('theory', THEORY_DEFAULTS);
	let prefs = $state<TheoryPrefs>({
		...stored,
		...openDrill(THEORY_CURRICULUM, stored, progress.unlocked('theory'))
	});
	let question = $state<TheoryQuestion | null>(null);
	let questionKey = $state(0);

	const difficulty = $derived(
		findDrill(THEORY_CURRICULUM, prefs.level, prefs.exercise)?.difficulty ?? prefs.level
	);
	const questionPrefs = $derived({ ...prefs, level: difficulty });
	const format = $derived(answerFormatFor(questionPrefs));

	progress.clearEvents();

	const record = (correct: boolean): void => {
		progress.record('theory', prefs.level, prefs.exercise, correct);
	};

	function update(patch: Partial<TheoryPrefs>): void {
		prefs = { ...prefs, ...patch };
		saveModulePrefs('theory', prefs);
	}

	function next(): void {
		progress.clearEvents();
		question = createQuestion(questionPrefs, newSeed());
		questionKey++;
		continueStore.record({
			module: 'theory',
			summary: m.theory_summary({
				level: prefs.level,
				exercise: THEORY_EXERCISE_LABELS[prefs.exercise]
			})
		});
	}

	function pick(level: Level, exercise: TheoryExercise): void {
		update({ level, exercise });
		next();
	}

	// Opened from Continue on the dashboard: go straight back to an exercise.
	onResume(() => next());

	// Opened from a lesson's exercises: start that one, if its level is open.
	onMount(() => {
		const level = Number(page.url.searchParams.get('level'));
		const exercise = page.url.searchParams.get('exercise');
		if (!isLevel(level) || level > progress.unlocked('theory') || !exercise) return;
		const drill = findDrill(THEORY_CURRICULUM, level, exercise);
		if (drill) pick(level, drill.exercise);
	});
</script>

<svelte:head>
	<title>{m.page_title({ page: m.nav_theory() })}</title>
</svelte:head>

<div class="page">
	<h1>{m.nav_theory()}</h1>
	<p class="lede">{m.theory_lede()}</p>
	<p class="lessons-link">
		<a href={resolve('/theory/lessons')}>{m.lessons_title()} →</a>
	</p>

	{#if !question}
		<ModuleIntro
			module="theory"
			tracks={['theory']}
			onplace={(level: Level) =>
				update({ ...openDrill(THEORY_CURRICULUM, { ...prefs, level }, level) })}
		/>
		<ProgressPanel track="theory" />
		<div class="actions">
			<MidiStatus />
		</div>
		<StageMap
			module="theory"
			curriculum={THEORY_CURRICULUM}
			labels={THEORY_EXERCISE_LABELS}
			onpick={pick}
		/>
		<details class="options">
			<summary>{m.options_label()}</summary>
			<section class="setup" aria-label={m.setup_label()}>
				<label class="field">
					<span class="label">{m.answer_format_label()}</span>
					<select
						value={prefs.answerFormat}
						onchange={(e) =>
							update({ answerFormat: e.currentTarget.value as TheoryPrefs['answerFormat'] })}
					>
						<option value="level">
							{format === 'choice'
								? m.answer_format_level_choice()
								: m.answer_format_level_naming()}
						</option>
						<option value="choice">{m.answer_format_choice()}</option>
						<option value="naming">{m.answer_format_naming()}</option>
					</select>
				</label>
				<label class="field">
					<span class="label">{m.voicing_type_label()}</span>
					<select
						value={prefs.voicingType}
						onchange={(e) =>
							update({ voicingType: e.currentTarget.value as TheoryPrefs['voicingType'] })}
					>
						<option value="alternate">{m.voicing_type_alternate()}</option>
						<option value="A">Type A · 1 7 / 3 5 9</option>
						<option value="B">Type B · 1 3 7 / 9 5</option>
					</select>
				</label>
				<label class="field inline">
					<input
						type="checkbox"
						checked={prefs.liveRules}
						onchange={(e) => update({ liveRules: e.currentTarget.checked })}
					/>
					<span>{m.live_rules_label()}</span>
				</label>
			</section>
		</details>
		<GuideText guide={THEORY_GUIDES.intro} open />
		<GuideText guide={THEORY_GUIDES.voicings} />
		<GuideText guide={THEORY_GUIDES.voiceLeading} />
	{:else}
		<p class="label">
			{m.level_heading({ level: prefs.level, detail: THEORY_EXERCISE_LABELS[prefs.exercise] })}
		</p>
		{#key questionKey}
			{#if question.kind === 'name-mode' || question.kind === 'write-mode'}
				<ModeExercise {question} {format} onnext={next} onresult={record} />
			{:else if question.kind === 'mode-in-context'}
				<ContextExercise {question} {format} onnext={next} onresult={record} />
			{:else if question.kind === 'voice-leading'}
				<SheetExercise {question} liveRules={prefs.liveRules} onnext={next} onresult={record} />
			{:else if question.kind === 'name-chord' || question.kind === 'build-chord' || question.kind === 'voice-chord'}
				<ChordExercise
					{question}
					{format}
					liveRules={prefs.liveRules}
					onnext={next}
					onresult={record}
				/>
			{/if}
		{/key}
		<ProgressNotice
			track="theory"
			level={prefs.level}
			exercise={prefs.exercise}
			label={THEORY_EXERCISE_LABELS[prefs.exercise]}
			onlevel={(level: Level) => pick(level, THEORY_CURRICULUM[level].drills[0].exercise)}
		/>
		<div class="actions">
			<button type="button" onclick={() => (question = null)}>{m.action_back_to_levels()}</button>
		</div>
	{/if}
</div>

<style>
	.lessons-link {
		margin: 0 0 var(--space-4);
	}

	.options {
		margin: var(--space-5) 0;
		max-width: var(--measure);
	}

	.options summary {
		cursor: pointer;
		font-variant: small-caps;
		letter-spacing: 0.06em;
	}
</style>
