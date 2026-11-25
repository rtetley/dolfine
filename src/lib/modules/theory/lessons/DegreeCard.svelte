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
	import { CHARACTERISTIC_NOTES, type DegreeStudy, rootCode, TYPICAL_CHORDS } from '../lessons';

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
	const chordScore = $derived<ScoreModel>({
		parts: [
			{
				clef: 'treble',
				measures: [[{ id: `c${study.degree}`, ticks: 48, rest: false, pitches: study.seventh }]]
			}
		]
	});
	const voicingsQuery = $derived(`?mode=${study.mode}&root=${rootCode(parentRoot)}`);

	async function hearScale(): Promise<void> {
		await ensureAudio();
		const midis = study.scale.map(toMidi);
		playArpeggio([...midis, (midis[0] ?? 60) + 12], 0.28, 0.6);
	}

	async function hearChord(): Promise<void> {
		await ensureAudio();
		playNotes(study.seventh.map(toMidi), 2);
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

	<div class="staves">
		<Score
			score={scaleScore(study.scale, `d${study.degree}-`)}
			label={m.lesson_scale_label({ name: modeName })}
		/>
		<Score score={chordScore} preferredPerLine={1} label={m.lesson_chord_label({ name: symbol })} />
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
		<button type="button" onclick={() => void hearChord()}>{m.lesson_hear_chord()}</button>
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

	.staves {
		display: grid;
		grid-template-columns: minmax(0, 3fr) minmax(8rem, 1fr);
		gap: var(--space-4);
		align-items: end;
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

	@media (max-width: 40rem) {
		.staves {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
