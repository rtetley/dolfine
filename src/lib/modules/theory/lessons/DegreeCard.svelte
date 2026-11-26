<script lang="ts">
	import { resolve } from '$app/paths';
	import { ensureAudio, playArpeggio, playNotes } from '#lib/audio/engine.ts';
	import { m } from '#lib/i18n.ts';
	import { chordSymbol, formatSuffix } from '#lib/music/chords.ts';
	import { noteName, type PitchClassName, toMidi } from '#lib/music/pitch.ts';
	import { modeLabel, PARENT_NAMES, type ParentScale, ROMAN } from '#lib/music/scales.ts';
	import type { Score as ScoreModel } from '#lib/notation/model.ts';
	import Score from '#lib/notation/Score.svelte';
	import { settings } from '#lib/state/settings.svelte.ts';
	import { scaleScore } from '../display';
	import { VOICING_TEXT } from '../lessonText';
	import {
		CHARACTERISTIC_NOTES,
		type DegreeStudy,
		type LessonVoicing,
		lessonVoicings,
		rootCode,
		TYPICAL_CHORDS,
		voicingFormula
	} from '../lessons';

	interface Props {
		study: DegreeStudy;
		parent: ParentScale;
		parentRoot: PitchClassName;
	}

	let { study, parent, parentRoot }: Props = $props();

	const names = $derived(settings.noteNames);
	const language = $derived(settings.modeLanguage);
	const roman = $derived(ROMAN[study.degree - 1] ?? '');
	const modeName = $derived(
		`${noteName(study.chord.root, names)} ${modeLabel(study.mode, language)}`
	);
	const symbol = $derived(chordSymbol(study.chord, settings.value.chordStyle, names));
	/** The basic voicings of the mode's chord: close position, and drop 2. */
	const voicings = $derived(
		lessonVoicings(study.chord).filter((v) => v.kind === 'close' || v.kind === 'drop2')
	);
	const voicingScore = (voicing: LessonVoicing): ScoreModel => ({
		parts: [
			{
				clef: 'treble',
				measures: [
					[
						{
							id: `v${study.degree}${voicing.kind}`,
							ticks: 48,
							rest: false,
							pitches: voicing.pitches
						}
					]
				]
			}
		]
	});
	const voicingsQuery = $derived(`?mode=${study.mode}&root=${rootCode(parentRoot)}`);

	async function hearScale(): Promise<void> {
		await ensureAudio();
		const midis = study.scale.map(toMidi);
		playArpeggio([...midis, (midis[0] ?? 60) + 12], 0.28, 0.6);
	}

	async function hearVoicing(voicing: LessonVoicing): Promise<void> {
		await ensureAudio();
		playNotes(voicing.pitches.map(toMidi), 2);
	}
</script>

<article class="degree" aria-labelledby="degree-{study.degree}">
	<header>
		<span class="roman">{roman}</span>
		<div>
			<h3 id="degree-{study.degree}">{modeName}</h3>
			<p class="label">
				{m.lesson_degree_of({
					degree: roman,
					parent: `${noteName(parentRoot, names)} ${PARENT_NAMES[parent][language]}`
				})}
			</p>
		</div>
	</header>

	<Score
		score={scaleScore(study.scale, `d${study.degree}-`)}
		label={m.lesson_scale_label({ name: modeName })}
	/>

	<div class="voicings">
		{#each voicings as voicing (voicing.kind)}
			<figure class="voicing">
				<Score
					score={voicingScore(voicing)}
					preferredPerLine={1}
					label={m.lesson_voicing_label({
						name: symbol,
						voicing: VOICING_TEXT[voicing.kind].name()
					})}
				/>
				<figcaption>
					<strong>{VOICING_TEXT[voicing.kind].name()}</strong>
					<span class="formula">{voicingFormula(study.mode, voicing)}</span>
					<button type="button" onclick={() => void hearVoicing(voicing)}>
						{m.lesson_hear_voicing_named({ voicing: VOICING_TEXT[voicing.kind].name() })}
					</button>
				</figcaption>
			</figure>
		{/each}
	</div>

	<dl class="facts">
		<div>
			<dt class="label">{m.lesson_typical_chords()}</dt>
			<dd class="chords">
				{#each TYPICAL_CHORDS[study.mode] as suffix (suffix)}
					<span>
						{noteName(study.chord.root, names)}{formatSuffix(suffix, settings.value.chordStyle)}
					</span>
				{/each}
			</dd>
		</div>
		<div>
			<dt class="label">{m.lesson_characteristic()}</dt>
			<dd>{CHARACTERISTIC_NOTES[study.mode].join(' · ')}</dd>
		</div>
	</dl>

	<div class="actions">
		<button type="button" onclick={() => void hearScale()}>{m.hear_the_scale()}</button>
		<!-- The path is resolved; resolve() cannot express the query string. -->
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={resolve('/theory/lessons/[lesson]', { lesson: 'voicings' }) + voicingsQuery}>
			{m.lesson_see_voicings()}
		</a>
	</div>
</article>

<style>
	.degree {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-5) 0;
		border-top: var(--border) solid var(--rule);
	}

	header {
		display: flex;
		align-items: baseline;
		gap: var(--space-4);
	}

	.roman {
		min-width: 2.5ch;
		font-size: var(--step-2);
		color: var(--accent);
		font-variant-numeric: lining-nums;
	}

	h3 {
		margin: 0;
		font-size: var(--step-1);
	}

	header .label {
		margin: 0;
	}

	.voicings {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: var(--space-4);
	}

	.voicing {
		margin: 0;
	}

	figcaption {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-2) var(--space-3);
	}

	.formula {
		color: var(--ink-soft);
		font-variant-numeric: lining-nums;
	}

	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3) var(--space-6);
		margin: 0;
	}

	dd {
		margin: var(--space-1) 0 0;
		font-size: var(--step-1);
	}

	.chords {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-4);
	}

	.actions {
		margin: 0;
	}
</style>
