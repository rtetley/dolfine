<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import { coloursIn } from '#lib/music/colours.ts';
	import { ALL_ROOTS, noteName, pitchClassOf } from '#lib/music/pitch.ts';
	import { settings } from '#lib/state/settings.svelte.ts';
	import type { ColourLessonId } from '../lessons';
	import ColourCard from './ColourCard.svelte';

	interface Props {
		lesson: ColourLessonId;
		title: string;
	}

	let { lesson, title }: Props = $props();

	let rootIndex = $state(0);
	const root = $derived(ALL_ROOTS[rootIndex] ?? ALL_ROOTS[0]);
	const colours = $derived(coloursIn(lesson === 'chord-colours' ? 'twelve' : 'four'));
</script>

<section id="colours" aria-labelledby="colours-title">
	<div class="heading-row">
		<h2 id="colours-title">{title}</h2>
		<label class="field">
			<span class="label">{m.lesson_colour_key()}</span>
			<select bind:value={rootIndex}>
				{#each ALL_ROOTS as option, i (pitchClassOf(option))}
					<option value={i}>{noteName(option, settings.noteNames)}</option>
				{/each}
			</select>
		</label>
	</div>
	{#each colours as colour (colour)}
		<ColourCard {colour} {root} />
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
</style>
