<script lang="ts">
	import { page } from '$app/state';
	import { ensureAudio, playNotes, playSchedule } from '#lib/audio/engine.ts';
	import { m } from '#lib/i18n.ts';
	import { chordSymbol } from '#lib/music/chords.ts';
	import { ALL_ROOTS, noteName, pitchClassOf, toMidi } from '#lib/music/pitch.ts';
	import {
		DEGREES,
		type Degree,
		degreeRoot,
		MODES,
		modeId,
		modeLabel,
		type ModeId,
		PARENT_NAMES,
		PARENT_SCALES,
		type ParentScale,
		ROMAN
	} from '#lib/music/scales.ts';
	import Score from '#lib/notation/Score.svelte';
	import { settings } from '#lib/state/settings.svelte.ts';
	import { grandStaff } from '../display';
	import { VOICING_TEXT } from '../lessonText';
	import { lessonVoicings, parseRootCode, voicingFormula } from '../lessons';

	const requested = MODES.find((mode) => mode.id === (page.url.searchParams.get('mode') as ModeId));
	const requestedRoot = parseRootCode(page.url.searchParams.get('root'));

	let parent = $state<ParentScale>(requested?.parent ?? 'major');
	let degree = $state<Degree>(requested?.degree ?? 2);
	let rootIndex = $state(
		Math.max(
			0,
			ALL_ROOTS.findIndex(
				(root) => requestedRoot && pitchClassOf(root) === pitchClassOf(requestedRoot)
			)
		)
	);

	const names = $derived(settings.noteNames);
	const style = $derived(settings.value.chordStyle);
	const parentRoot = $derived(ALL_ROOTS[rootIndex] ?? ALL_ROOTS[0]);
	const chordAt = (d: Degree) => ({
		root: degreeRoot(parent, d, parentRoot),
		mode: modeId(parent, d)
	});
	const chord = $derived(chordAt(degree));
	const symbol = $derived(chordSymbol(chord, style, names));
	const voicings = $derived(lessonVoicings(chord));
	const score = $derived(
		grandStaff(
			voicings.map((voicing, i) => ({
				id: `v${i}`,
				pitches: voicing.pitches,
				label: String(i + 1),
				lhCount: voicing.lhCount
			}))
		)
	);

	async function hear(index: number): Promise<void> {
		await ensureAudio();
		playNotes(voicings[index]?.pitches.map(toMidi) ?? [], 2);
	}

	async function hearAll(): Promise<void> {
		await ensureAudio();
		playSchedule(
			voicings.map((voicing, i) => ({
				midis: voicing.pitches.map(toMidi),
				at: i * 1.7,
				duration: 1.5
			}))
		);
	}
</script>

<section class="setup" aria-label={m.setup_label()}>
	<label class="field">
		<span class="label">{m.parent_scale_label()}</span>
		<select bind:value={parent}>
			{#each PARENT_SCALES as scale (scale)}
				<option value={scale}>{PARENT_NAMES[scale][settings.modeLanguage]}</option>
			{/each}
		</select>
	</label>
	<label class="field">
		<span class="label">{m.parent_root_label()}</span>
		<select bind:value={rootIndex}>
			{#each ALL_ROOTS as root, i (pitchClassOf(root))}
				<option value={i}>{noteName(root, names)}</option>
			{/each}
		</select>
	</label>
	<label class="field">
		<span class="label">{m.lesson_degree_label()}</span>
		<select bind:value={degree}>
			{#each DEGREES as d (d)}
				<option value={d}>
					{ROMAN[d - 1]} · {chordSymbol(chordAt(d), style, names)} · {modeLabel(
						modeId(parent, d),
						settings.modeLanguage
					)}
				</option>
			{/each}
		</select>
	</label>
</section>

<section aria-labelledby="voicings-of">
	<div class="heading-row">
		<h2 id="voicings-of">{symbol}</h2>
		<button type="button" class="primary" onclick={() => void hearAll()}>
			{m.lesson_hear_all()}
		</button>
	</div>
	<Score {score} preferredPerLine={4} label={m.lesson_voicings_staff({ chord: symbol })} />

	<ol class="voicings">
		{#each voicings as voicing, i (voicing.kind)}
			<li>
				<span class="number">{i + 1}</span>
				<div class="text">
					<p class="name">
						{VOICING_TEXT[voicing.kind].name()}
						<span class="formula">{voicingFormula(chord.mode, voicing)}</span>
						{#if voicing.alternative}<span class="badge">{m.voicing_alternative()}</span>{/if}
					</p>
					<p class="about">{VOICING_TEXT[voicing.kind].about()}</p>
				</div>
				<button
					type="button"
					aria-label="{m.lesson_hear_voicing()} · {VOICING_TEXT[voicing.kind].name()}"
					onclick={() => void hear(i)}
				>
					{m.lesson_hear_voicing()}
				</button>
			</li>
		{/each}
	</ol>
</section>

<style>
	.heading-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
	}

	.heading-row h2 {
		margin: var(--space-5) 0 var(--space-3);
		font-size: var(--step-2);
	}

	.voicings {
		list-style: none;
		margin: var(--space-4) 0 0;
		padding: 0;
		display: grid;
	}

	.voicings li {
		display: grid;
		grid-template-columns: 2.5ch minmax(0, 1fr) auto;
		gap: var(--space-4);
		align-items: center;
		padding: var(--space-3) 0;
		border-top: var(--border) solid var(--rule);
	}

	.number {
		color: var(--accent);
		font-size: var(--step-1);
		font-variant-numeric: lining-nums;
	}

	.text p {
		margin: 0;
	}

	.name {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-2) var(--space-3);
	}

	.formula {
		color: var(--ink-soft);
		font-variant-numeric: lining-nums;
	}

	.badge {
		font-size: var(--step--1);
		font-variant: small-caps;
		text-transform: lowercase;
		letter-spacing: 0.06em;
		color: var(--accent);
	}

	.about {
		color: var(--ink-soft);
		font-size: var(--step--1);
	}
</style>
