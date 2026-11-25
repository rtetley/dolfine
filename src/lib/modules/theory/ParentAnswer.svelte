<script lang="ts">
	import { ALL_ROOTS, noteName, pitchClassOf } from '#lib/music/pitch.ts';
	import { PARENT_NAMES, PARENT_SCALES, type ParentScale } from '#lib/music/scales.ts';
	import { settings } from '#lib/state/settings.svelte.ts';
	import type { ParentChoice } from './questions';

	interface Props {
		root: number | null;
		parent: ParentScale | null;
		disabled: boolean;
		onchange: (value: ParentChoice) => void;
	}

	let { root, parent, disabled, onchange }: Props = $props();
</script>

<fieldset class="parent">
	<legend class="label">Parent scale</legend>
	<select
		aria-label="Root"
		value={root ?? ''}
		{disabled}
		onchange={(e) => onchange({ root: Number(e.currentTarget.value), parent })}
	>
		<option value="" disabled>Root…</option>
		{#each ALL_ROOTS as name (pitchClassOf(name))}
			<option value={pitchClassOf(name)}>{noteName(name, settings.value.noteNames)}</option>
		{/each}
	</select>
	<select
		aria-label="Scale"
		value={parent ?? ''}
		{disabled}
		onchange={(e) => onchange({ root, parent: e.currentTarget.value as ParentScale })}
	>
		<option value="" disabled>Scale…</option>
		{#each PARENT_SCALES as scale (scale)}
			<option value={scale}>{PARENT_NAMES[scale][settings.value.modeLanguage]}</option>
		{/each}
	</select>
</fieldset>

<style>
	.parent {
		border: none;
		padding: 0;
		margin: 1rem 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	legend {
		margin-bottom: 0.3rem;
	}
</style>
