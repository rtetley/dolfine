<script lang="ts">
	import GuideText from '#lib/components/GuideText.svelte';
	import LevelPicker from '#lib/components/LevelPicker.svelte';
	import MidiStatus from '#lib/components/MidiStatus.svelte';
	import { EAR_GUIDES } from '#lib/content/guides.ts';
	import type { Level } from '#lib/music/levels.ts';
	import { newSeed } from '#lib/music/random.ts';
	import ModeListening from '#lib/modules/ear/ModeListening.svelte';
	import ProgressionListening from '#lib/modules/ear/ProgressionListening.svelte';
	import {
		createEarQuestion,
		EAR_DEFAULTS,
		EAR_SUBMODULE_LABELS,
		EAR_SUBMODULES,
		type EarPrefs,
		type EarQuestion,
		earFormatFor
	} from '#lib/modules/ear/questions.ts';
	import SoundQuestion from '#lib/modules/ear/SoundQuestion.svelte';
	import {
		continueStore,
		loadModulePrefs,
		saveModulePrefs
	} from '#lib/state/modulePrefs.svelte.ts';

	let prefs = $state<EarPrefs>(loadModulePrefs('ear', EAR_DEFAULTS));
	let question = $state<EarQuestion | null>(null);
	let questionKey = $state(0);

	const format = $derived(earFormatFor(prefs));

	function update(patch: Partial<EarPrefs>): void {
		prefs = { ...prefs, ...patch };
		saveModulePrefs('ear', prefs);
	}

	function next(): void {
		question = createEarQuestion(prefs, newSeed());
		questionKey++;
		continueStore.record({
			module: 'ear',
			summary: `Ear training · Level ${prefs.level} · ${EAR_SUBMODULE_LABELS[prefs.submodule]}`
		});
	}
</script>

<svelte:head>
	<title>Ear training · D.O.lfine</title>
</svelte:head>

<div class="page">
	<h1>Ear training</h1>
	<p class="lede">
		Hear what the theory module teaches: intervals, chords, voicings, modes and progressions. Piano
		sound.
	</p>

	<div class="tabs" role="group" aria-label="Sub-module">
		{#each EAR_SUBMODULES as submodule (submodule)}
			<button
				type="button"
				aria-pressed={prefs.submodule === submodule}
				onclick={() => {
					update({ submodule });
					question = null;
				}}
			>
				{EAR_SUBMODULE_LABELS[submodule]}
			</button>
		{/each}
	</div>

	{#if !question}
		<section class="setup" aria-label="Exercise setup">
			<LevelPicker
				level={prefs.level}
				mapping="jazz"
				onchange={(level: Level) => update({ level })}
			/>
			<label class="field">
				<span class="label">Answer</span>
				<select
					value={prefs.answerFormat}
					onchange={(e) =>
						update({ answerFormat: e.currentTarget.value as EarPrefs['answerFormat'] })}
				>
					<option value="level">From level</option>
					<option value="choice">Choose from options</option>
					<option value="naming">Name it outright</option>
					<option value="play">Play it back (piano or MIDI)</option>
				</select>
			</label>
			{#if prefs.submodule === 'chords' || prefs.submodule === 'voicings'}
				<label class="field">
					<span class="label">Voicing</span>
					<select
						value={prefs.voicing}
						onchange={(e) => update({ voicing: e.currentTarget.value as EarPrefs['voicing'] })}
					>
						<option value="level">From level</option>
						<option value="shell-spread">Spread, root in the bass</option>
						<option value="rootless">Rootless</option>
						<option value="drop2">Drop 2</option>
						<option value="close">Close position</option>
					</select>
				</label>
			{/if}
		</section>
		<div class="actions">
			<button type="button" class="primary" onclick={next}>Start</button>
			{#if format === 'play'}<MidiStatus />{/if}
		</div>
		<GuideText guide={EAR_GUIDES.intro} open />
	{:else}
		<p class="label">Level {prefs.level} · {EAR_SUBMODULE_LABELS[prefs.submodule]}</p>
		{#key questionKey}
			{#if question.kind === 'modes'}
				<ModeListening {question} {format} onnext={next} />
			{:else if question.kind === 'progressions'}
				<ProgressionListening {question} onnext={next} />
			{:else if question.kind === 'intervals' || question.kind === 'chords' || question.kind === 'voicings'}
				<SoundQuestion {question} {format} onnext={next} />
			{/if}
		{/key}
		<div class="actions">
			<button type="button" onclick={() => (question = null)}>Back to setup</button>
		</div>
	{/if}
</div>
