<script lang="ts">
	import { ensureAudio, playNotes, playSchedule, stopAll } from '#lib/audio/engine.ts';
	import { m } from '#lib/i18n.ts';
	import { chordSymbol } from '#lib/music/chords.ts';
	import { toMidi } from '#lib/music/pitch.ts';
	import { ROMAN } from '#lib/music/scales.ts';
	import type { Score as ScoreModel } from '#lib/notation/model.ts';
	import Score from '#lib/notation/Score.svelte';
	import { settings } from '#lib/state/settings.svelte.ts';
	import type { DegreeStudy } from '../lessons';

	interface Props {
		studies: readonly DegreeStudy[];
		/** "C major", for the staff's accessible name. */
		scaleName: string;
	}

	let { studies, scaleName }: Props = $props();

	const symbols = $derived(
		studies.map((study) => chordSymbol(study.chord, settings.value.chordStyle, settings.noteNames))
	);
	const score = $derived<ScoreModel>({
		parts: [
			{
				clef: 'treble',
				measures: studies.map((study, i) => [
					{
						id: `h${study.degree}`,
						ticks: 48,
						rest: false,
						pitches: study.seventh,
						above: symbols[i],
						below: ROMAN[study.degree - 1]
					}
				])
			}
		]
	});

	async function hearAll(): Promise<void> {
		await ensureAudio();
		stopAll();
		playSchedule(
			studies.map((study, i) => ({ midis: study.seventh.map(toMidi), at: i * 1.4, duration: 1.3 }))
		);
	}

	async function hearOne(study: DegreeStudy): Promise<void> {
		await ensureAudio();
		stopAll();
		playNotes(study.seventh.map(toMidi), 2);
	}
</script>

<Score {score} preferredPerLine={7} label={m.lesson_harmonization_label({ name: scaleName })} />
<div class="actions">
	<button type="button" class="primary" onclick={() => void hearAll()}>
		{m.lesson_hear_harmonization()}
	</button>
	{#each studies as study, i (study.degree)}
		<button
			type="button"
			class="chip"
			aria-label={m.lesson_hear_chord_named({ name: symbols[i] })}
			onclick={() => void hearOne(study)}
		>
			<span class="roman">{ROMAN[study.degree - 1]}</span>
			{symbols[i]}
		</button>
	{/each}
</div>

<style>
	.actions {
		flex-wrap: wrap;
	}

	.chip {
		min-height: 0;
		padding: var(--space-1) var(--space-3);
		font-size: var(--step--1);
	}

	.roman {
		color: var(--accent);
		margin-right: var(--space-1);
	}
</style>
