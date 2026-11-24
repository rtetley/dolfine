<script lang="ts">
	import GuideText from '#lib/components/GuideText.svelte';
	import LevelPicker from '#lib/components/LevelPicker.svelte';
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

	let prefs = $state<TheoryPrefs>(loadModulePrefs('theory', THEORY_DEFAULTS));
	let question = $state<TheoryQuestion | null>(null);
	let questionKey = $state(0);

	const format = $derived(answerFormatFor(prefs));

	function update(patch: Partial<TheoryPrefs>): void {
		prefs = { ...prefs, ...patch };
		saveModulePrefs('theory', prefs);
	}

	function next(): void {
		question = createQuestion(prefs, newSeed());
		questionKey++;
		const parent = prefs.parent === 'level' ? 'parents from level' : PARENT_NAMES[prefs.parent].en;
		continueStore.record({
			module: 'theory',
			summary: `Music theory · Level ${prefs.level} · ${THEORY_EXERCISE_LABELS[prefs.exercise]} · ${parent}`
		});
	}
</script>

<svelte:head>
	<title>Music theory · D.O.lfine</title>
</svelte:head>

<div class="page">
	<h1>Music theory</h1>
	<p class="lede">
		Jazz harmony at the keyboard: the major, melodic minor and harmonic minor scales, their modes,
		voicings and voice leading.
	</p>

	{#if !question}
		<section class="setup" aria-label="Exercise setup">
			<LevelPicker
				level={prefs.level}
				mapping="jazz"
				onchange={(level: Level) => update({ level })}
			/>
			<label class="field">
				<span class="label">Exercise</span>
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
				<span class="label">Parent scale</span>
				<select
					value={prefs.parent}
					onchange={(e) => update({ parent: e.currentTarget.value as TheoryPrefs['parent'] })}
				>
					<option value="level">From level</option>
					{#each PARENT_SCALES as scale (scale)}<option value={scale}>
							{PARENT_NAMES[scale].en}
						</option>{/each}
				</select>
			</label>
			<label class="field">
				<span class="label">Answer format</span>
				<select
					value={prefs.answerFormat}
					onchange={(e) =>
						update({ answerFormat: e.currentTarget.value as TheoryPrefs['answerFormat'] })}
				>
					<option value="level">From level ({format === 'choice' ? 'choices' : 'naming'})</option>
					<option value="choice">Multiple choice</option>
					<option value="naming">Name it outright</option>
				</select>
			</label>
			<label class="field">
				<span class="label">Voicing type</span>
				<select
					value={prefs.voicingType}
					onchange={(e) =>
						update({ voicingType: e.currentTarget.value as TheoryPrefs['voicingType'] })}
				>
					<option value="alternate">A or B</option>
					<option value="A">Type A · 1 7 / 3 5 9</option>
					<option value="B">Type B · 1 3 7 / 9 5</option>
				</select>
			</label>
		</section>
		<div class="actions">
			<button type="button" class="primary" onclick={next}>Start</button>
			<MidiStatus />
		</div>
		<GuideText guide={THEORY_GUIDES.intro} open />
		<GuideText guide={THEORY_GUIDES.voicings} />
		<GuideText guide={THEORY_GUIDES.voiceLeading} />
	{:else}
		<p class="label">Level {prefs.level} · {THEORY_EXERCISE_LABELS[prefs.exercise]}</p>
		{#key questionKey}
			{#if question.kind === 'name-mode' || question.kind === 'write-mode'}
				<ModeExercise {question} {format} onnext={next} />
			{:else if question.kind === 'mode-in-context'}
				<ContextExercise {question} {format} onnext={next} />
			{:else if question.kind === 'voice-leading'}
				<SheetExercise {question} onnext={next} />
			{:else if question.kind === 'name-chord' || question.kind === 'build-chord' || question.kind === 'voice-chord'}
				<ChordExercise {question} {format} onnext={next} />
			{/if}
		{/key}
		<div class="actions">
			<button type="button" onclick={() => (question = null)}>Back to setup</button>
		</div>
	{/if}
</div>
