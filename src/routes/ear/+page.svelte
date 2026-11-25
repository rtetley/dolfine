<script lang="ts">
	import GuideText from '#lib/components/GuideText.svelte';
	import LevelPicker from '#lib/components/LevelPicker.svelte';
	import ProgressNotice from '#lib/components/ProgressNotice.svelte';
	import ProgressPanel from '#lib/components/ProgressPanel.svelte';
	import { m } from '#lib/i18n.ts';
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
	import { earTrack } from '#lib/progress/ladder.ts';
	import { allowedLevel, progress } from '#lib/state/progress.svelte.ts';

	const stored = loadModulePrefs('ear', EAR_DEFAULTS);
	let prefs = $state<EarPrefs>({
		...stored,
		level: allowedLevel(stored.level, progress.unlocked(earTrack(stored.submodule)))
	});
	let question = $state<EarQuestion | null>(null);
	let questionKey = $state(0);

	const format = $derived(earFormatFor(prefs));
	const track = $derived(earTrack(prefs.submodule));
	const unlocked = $derived(progress.unlocked(track));

	progress.clearEvents();

	const record = (correct: boolean): void => {
		progress.record(track, prefs.level, correct);
	};

	function update(patch: Partial<EarPrefs>): void {
		prefs = { ...prefs, ...patch };
		saveModulePrefs('ear', prefs);
	}

	function next(): void {
		progress.clearEvents();
		question = createEarQuestion(prefs, newSeed());
		questionKey++;
		continueStore.record({
			module: 'ear',
			summary: m.ear_summary({
				level: prefs.level,
				submodule: EAR_SUBMODULE_LABELS[prefs.submodule]
			})
		});
	}
</script>

<svelte:head>
	<title>{m.page_title({ page: m.nav_ear() })}</title>
</svelte:head>

<div class="page">
	<h1>{m.nav_ear()}</h1>
	<p class="lede">{m.ear_lede()}</p>

	<div class="tabs" role="group" aria-label={m.submodule_label()}>
		{#each EAR_SUBMODULES as submodule (submodule)}
			<button
				type="button"
				aria-pressed={prefs.submodule === submodule}
				onclick={() => {
					// Each sub-module has its own ladder: open it on the level the student has reached.
					update({ submodule, level: progress.levelFor(earTrack(submodule), prefs.level) });
					progress.clearEvents();
					question = null;
				}}
			>
				{EAR_SUBMODULE_LABELS[submodule]}
			</button>
		{/each}
	</div>

	{#if !question}
		<section class="setup" aria-label={m.setup_label()}>
			<LevelPicker
				level={prefs.level}
				mapping="jazz"
				{unlocked}
				onchange={(level: Level) => update({ level })}
			/>
			<label class="field">
				<span class="label">{m.ear_answer_label()}</span>
				<select
					value={prefs.answerFormat}
					onchange={(e) =>
						update({ answerFormat: e.currentTarget.value as EarPrefs['answerFormat'] })}
				>
					<option value="level">{m.from_level()}</option>
					<option value="choice">{m.ear_answer_choice()}</option>
					<option value="naming">{m.answer_format_naming()}</option>
					<option value="play">{m.ear_answer_play()}</option>
				</select>
			</label>
			{#if prefs.submodule === 'chords' || prefs.submodule === 'voicings'}
				<label class="field">
					<span class="label">{m.ear_voicing_label()}</span>
					<select
						value={prefs.voicing}
						onchange={(e) => update({ voicing: e.currentTarget.value as EarPrefs['voicing'] })}
					>
						<option value="level">{m.from_level()}</option>
						<option value="shell-spread">{m.ear_voicing_spread()}</option>
						<option value="rootless">{m.ear_voicing_rootless()}</option>
						<option value="drop2">{m.ear_voicing_drop2()}</option>
						<option value="close">{m.ear_voicing_close()}</option>
					</select>
				</label>
			{/if}
		</section>
		<div class="actions">
			<button type="button" class="primary" onclick={next}>{m.action_start()}</button>
			{#if format === 'play'}<MidiStatus />{/if}
		</div>
		<ProgressPanel {track} level={prefs.level} />
		<GuideText guide={EAR_GUIDES.intro} open />
	{:else}
		<p class="label">
			{m.level_heading({ level: prefs.level, detail: EAR_SUBMODULE_LABELS[prefs.submodule] })}
		</p>
		{#key questionKey}
			{#if question.kind === 'modes'}
				<ModeListening {question} {format} onnext={next} onresult={record} />
			{:else if question.kind === 'progressions'}
				<ProgressionListening {question} onnext={next} onresult={record} />
			{:else if question.kind === 'intervals' || question.kind === 'chords' || question.kind === 'voicings'}
				<SoundQuestion {question} {format} onnext={next} onresult={record} />
			{/if}
		{/key}
		<ProgressNotice
			{track}
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
