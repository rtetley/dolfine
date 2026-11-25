<script lang="ts">
	import { ensureAudio, playArpeggio } from '#lib/audio/engine.ts';
	import { m } from '#lib/i18n.ts';
	import { ALL_ROOTS, noteName, pitchClassOf, toMidi } from '#lib/music/pitch.ts';
	import { PARENT_NAMES, type ParentScale } from '#lib/music/scales.ts';
	import Score from '#lib/notation/Score.svelte';
	import { settings } from '#lib/state/settings.svelte.ts';
	import { scaleScore } from '../display';
	import { harmonise } from '../lessons';
	import DegreeCard from './DegreeCard.svelte';
	import LessonIntro from './LessonIntro.svelte';

	interface Props {
		parent: ParentScale;
		paragraphs: string[];
	}

	let { parent, paragraphs }: Props = $props();

	let rootIndex = $state(0);
	const parentRoot = $derived(ALL_ROOTS[rootIndex] ?? ALL_ROOTS[0]);
	const studies = $derived(harmonise(parent, parentRoot));
	const scale = $derived(studies[0]?.scale ?? []);
	const scaleName = $derived(
		`${noteName(parentRoot, settings.noteNames)} ${PARENT_NAMES[parent][settings.modeLanguage]}`
	);

	async function hearScale(): Promise<void> {
		await ensureAudio();
		const midis = scale.map(toMidi);
		playArpeggio([...midis, (midis[0] ?? 60) + 12], 0.28, 0.6);
	}
</script>

<LessonIntro {paragraphs} />

<section aria-labelledby="the-scale">
	<div class="heading-row">
		<h2 id="the-scale">{m.lesson_the_scale()} · {scaleName}</h2>
		<label class="field">
			<span class="label">{m.parent_root_label()}</span>
			<select bind:value={rootIndex}>
				{#each ALL_ROOTS as root, i (pitchClassOf(root))}
					<option value={i}>{noteName(root, settings.noteNames)}</option>
				{/each}
			</select>
		</label>
	</div>
	<Score score={scaleScore(scale, 'parent-')} label={m.lesson_scale_label({ name: scaleName })} />
	<div class="actions">
		<button type="button" onclick={() => void hearScale()}>{m.hear_the_scale()}</button>
	</div>
</section>

<section aria-labelledby="the-modes">
	<h2 id="the-modes">{m.lesson_its_modes()}</h2>
	{#each studies as study (study.mode)}
		<DegreeCard {study} {parent} {parentRoot} />
	{/each}
</section>

<style>
	.heading-row {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: var(--space-4);
	}

	.heading-row h2 {
		margin-bottom: 0;
	}

	.heading-row select {
		min-width: 6rem;
	}
</style>
