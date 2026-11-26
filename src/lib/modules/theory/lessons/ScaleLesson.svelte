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
	import HarmonizationStaff from './HarmonizationStaff.svelte';

	interface Props {
		parent: ParentScale;
		/** The headings of the lesson's two scale sections, from its plan. */
		titles: { harmonization: string; modes: string };
	}

	let { parent, titles }: Props = $props();

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

<section id="harmonization" aria-labelledby="harmonization-title">
	<div class="heading-row">
		<h2 id="harmonization-title">{titles.harmonization} · {scaleName}</h2>
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
	<p class="caption">{m.lesson_harmonization_caption()}</p>
	<HarmonizationStaff {studies} {scaleName} />
</section>

<section id="modes" aria-labelledby="modes-title">
	<h2 id="modes-title">{titles.modes}</h2>
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

	.caption {
		max-width: var(--measure);
		margin: var(--space-5) 0 var(--space-2);
		color: var(--ink-soft);
	}
</style>
