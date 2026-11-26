<script lang="ts">
	import GuideText from '#lib/components/GuideText.svelte';
	import ModuleIntro from '#lib/components/ModuleIntro.svelte';
	import RelatedLessons from '#lib/components/RelatedLessons.svelte';
	import { EAR_LESSONS } from '#lib/content/relatedLessons.ts';
	import ProgressNotice from '#lib/components/ProgressNotice.svelte';
	import ProgressPanel from '#lib/components/ProgressPanel.svelte';
	import StageMap from '#lib/components/StageMap.svelte';
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
		type EarPrefs,
		type EarQuestion,
		type EarSubmodule,
		earFormatFor
	} from '#lib/modules/ear/questions.ts';
	import SoundQuestion from '#lib/modules/ear/SoundQuestion.svelte';
	import { EAR_CURRICULUM, findDrill, openDrill } from '#lib/progress/curriculum.ts';
	import { isLevel } from '#lib/progress/ladder.ts';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import {
		continueStore,
		loadModulePrefs,
		saveModulePrefs
	} from '#lib/state/modulePrefs.svelte.ts';
	import { onResume } from '#lib/state/resume.ts';
	import { progress } from '#lib/state/progress.svelte.ts';

	const stored = loadModulePrefs('ear', EAR_DEFAULTS);
	const opened = openDrill(
		EAR_CURRICULUM,
		{ level: stored.level, exercise: stored.submodule },
		progress.unlocked('ear')
	);
	let prefs = $state<EarPrefs>({ ...stored, level: opened.level, submodule: opened.exercise });
	let question = $state<EarQuestion | null>(null);
	let questionKey = $state(0);

	const difficulty = $derived(
		findDrill(EAR_CURRICULUM, prefs.level, prefs.submodule)?.difficulty ?? prefs.level
	);
	const questionPrefs = $derived({ ...prefs, level: difficulty });
	const format = $derived(earFormatFor(questionPrefs));

	progress.clearEvents();

	const record = (correct: boolean): void => {
		progress.record('ear', prefs.level, prefs.submodule, correct);
	};

	function update(patch: Partial<EarPrefs>): void {
		prefs = { ...prefs, ...patch };
		saveModulePrefs('ear', prefs);
	}

	function next(): void {
		progress.clearEvents();
		question = createEarQuestion(questionPrefs, newSeed());
		questionKey++;
		continueStore.record({
			module: 'ear',
			summary: m.ear_summary({
				level: prefs.level,
				submodule: EAR_SUBMODULE_LABELS[prefs.submodule]
			})
		});
	}

	function pick(level: Level, submodule: EarSubmodule): void {
		update({ level, submodule });
		next();
	}

	function place(level: Level): void {
		const drill = openDrill(EAR_CURRICULUM, { level, exercise: prefs.submodule }, level);
		update({ level: drill.level, submodule: drill.exercise });
	}

	// Opened from Continue on the dashboard: go straight back to an exercise.
	onResume(() => next());

	// Opened from a lesson: start that exercise, if its level is open.
	onMount(() => {
		const level = Number(page.url.searchParams.get('level'));
		const exercise = page.url.searchParams.get('exercise');
		if (!isLevel(level) || level > progress.unlocked('ear') || !exercise) return;
		const drill = findDrill(EAR_CURRICULUM, level, exercise);
		if (drill) pick(level, drill.exercise);
	});
</script>

<svelte:head>
	<title>{m.page_title({ page: m.nav_ear() })}</title>
</svelte:head>

<div class="page">
	<h1>{m.nav_ear()}</h1>
	<p class="lede">{m.ear_lede()}</p>

	{#if !question}
		<ModuleIntro module="ear" tracks={['ear']} onplace={place} />
		<ProgressPanel track="ear" />
		{#if format === 'play'}<div class="actions"><MidiStatus /></div>{/if}
		<StageMap
			module="ear"
			curriculum={EAR_CURRICULUM}
			labels={EAR_SUBMODULE_LABELS}
			onpick={pick}
		/>
		<details class="options">
			<summary>{m.options_label()}</summary>
			<section class="setup" aria-label={m.setup_label()}>
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
			</section>
		</details>
		<GuideText guide={EAR_GUIDES.intro} open />
	{:else}
		<p class="label">
			{m.level_heading({ level: prefs.level, detail: EAR_SUBMODULE_LABELS[prefs.submodule] })}
		</p>
		<RelatedLessons lessons={EAR_LESSONS[prefs.submodule]} />
		{#key questionKey}
			{#if question.kind === 'modes'}
				<ModeListening {question} {format} onnext={next} onresult={record} />
			{:else if question.kind === 'progressions'}
				<ProgressionListening {question} onnext={next} onresult={record} />
			{:else}
				<SoundQuestion {question} {format} onnext={next} onresult={record} />
			{/if}
		{/key}
		<ProgressNotice
			track="ear"
			level={prefs.level}
			exercise={prefs.submodule}
			label={EAR_SUBMODULE_LABELS[prefs.submodule]}
			onlevel={(level: Level) => pick(level, EAR_CURRICULUM[level].drills[0].exercise)}
		/>
		<div class="actions">
			<button type="button" onclick={() => (question = null)}>{m.action_back_to_levels()}</button>
		</div>
	{/if}
</div>

<style>
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
