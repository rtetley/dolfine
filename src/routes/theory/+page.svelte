<script lang="ts">
	import { resolve } from '$app/paths';
	import GuideText from '#lib/components/GuideText.svelte';
	import LevelPicker from '#lib/components/LevelPicker.svelte';
	import ModuleIntro from '#lib/components/ModuleIntro.svelte';
	import ProgressNotice from '#lib/components/ProgressNotice.svelte';
	import ProgressPanel from '#lib/components/ProgressPanel.svelte';
	import { m } from '#lib/i18n.ts';
	import MidiStatus from '#lib/components/MidiStatus.svelte';
	import { THEORY_GUIDES } from '#lib/content/guides.ts';
	import type { Level } from '#lib/music/levels.ts';
	import { newSeed } from '#lib/music/random.ts';
	import { PARENT_NAMES, PARENT_SCALES } from '#lib/music/scales.ts';
	import ChordExercise from '#lib/modules/theory/ChordExercise.svelte';
	import ContextExercise from '#lib/modules/theory/ContextExercise.svelte';
	import ModeExercise from '#lib/modules/theory/ModeExercise.svelte';
	import {
		answerFormatFor,
		createQuestion,
		THEORY_DEFAULTS,
		THEORY_EXERCISE_LABELS,
		THEORY_EXERCISES,
		type TheoryPrefs,
		type TheoryQuestion
	} from '#lib/modules/theory/questions.ts';
	import SheetExercise from '#lib/modules/theory/SheetExercise.svelte';
	import {
		continueStore,
		loadModulePrefs,
		saveModulePrefs
	} from '#lib/state/modulePrefs.svelte.ts';
	import { onResume } from '#lib/state/resume.ts';
	import { allowedLevel, progress } from '#lib/state/progress.svelte.ts';
	import { settings } from '#lib/state/settings.svelte.ts';

	const stored = loadModulePrefs('theory', THEORY_DEFAULTS);
	let prefs = $state<TheoryPrefs>({
		...stored,
		level: allowedLevel(stored.level, progress.unlocked('theory'))
	});
	let question = $state<TheoryQuestion | null>(null);
	let questionKey = $state(0);

	const format = $derived(answerFormatFor(prefs));
	const unlocked = $derived(progress.unlocked('theory'));

	progress.clearEvents();

	const record = (correct: boolean): void => {
		progress.record('theory', prefs.level, correct);
	};

	function update(patch: Partial<TheoryPrefs>): void {
		prefs = { ...prefs, ...patch };
		saveModulePrefs('theory', prefs);
	}

	function next(): void {
		progress.clearEvents();
		question = createQuestion(prefs, newSeed());
		questionKey++;
		const parent =
			prefs.parent === 'level'
				? m.parent_from_level()
				: PARENT_NAMES[prefs.parent][settings.modeLanguage];
		continueStore.record({
			module: 'theory',
			summary: m.theory_summary({
				level: prefs.level,
				exercise: THEORY_EXERCISE_LABELS[prefs.exercise],
				parent
			})
		});
	}

	// Opened from Continue on the dashboard: go straight back to an exercise.
	onResume(() => next());
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
			onplace={(level: Level) => update({ level })}
		/>
		<section class="setup" aria-label={m.setup_label()}>
			<LevelPicker
				level={prefs.level}
				mapping="jazz"
				{unlocked}
				onchange={(level: Level) => update({ level })}
			/>
			<label class="field">
				<span class="label">{m.exercise_label()}</span>
				<select
					value={prefs.exercise}
					onchange={(e) => update({ exercise: e.currentTarget.value as TheoryPrefs['exercise'] })}
				>
					{#each THEORY_EXERCISES as exercise (exercise)}<option value={exercise}>
							{THEORY_EXERCISE_LABELS[exercise]}
						</option>{/each}
				</select>
			</label>
			<label class="field">
				<span class="label">{m.parent_scale_label()}</span>
				<select
					value={prefs.parent}
					onchange={(e) => update({ parent: e.currentTarget.value as TheoryPrefs['parent'] })}
				>
					<option value="level">{m.from_level()}</option>
					{#each PARENT_SCALES as scale (scale)}<option value={scale}>
							{PARENT_NAMES[scale][settings.modeLanguage]}
						</option>{/each}
				</select>
			</label>
			<label class="field">
				<span class="label">{m.answer_format_label()}</span>
				<select
					value={prefs.answerFormat}
					onchange={(e) =>
						update({ answerFormat: e.currentTarget.value as TheoryPrefs['answerFormat'] })}
				>
					<option value="level">
						{format === 'choice' ? m.answer_format_level_choice() : m.answer_format_level_naming()}
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
		<div class="actions">
			<button type="button" class="primary" onclick={next}>{m.action_start()}</button>
			<MidiStatus />
		</div>
		<ProgressPanel track="theory" level={prefs.level} />
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
			onlevel={(level: Level) => {
				update({ level });
				next();
			}}
		/>
		<div class="actions">
			<button type="button" onclick={() => (question = null)}>{m.action_back_to_setup()}</button>
		</div>
	{/if}
</div>

<style>
	.lessons-link {
		margin: 0 0 var(--space-4);
	}
</style>
