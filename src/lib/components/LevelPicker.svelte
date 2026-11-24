<script lang="ts">
	import { CLASSICAL_MAPPING, JAZZ_MAPPING, type Level, LEVELS } from '#lib/music/levels.ts';

	interface Props {
		level: Level;
		mapping: 'classical' | 'jazz';
		onchange: (level: Level) => void;
	}

	let { level, mapping, onchange }: Props = $props();

	const table = $derived(mapping === 'jazz' ? JAZZ_MAPPING : CLASSICAL_MAPPING);
	const equivalent = $derived(table[level]);
</script>

<div class="level-picker">
	<label class="field">
		<span class="label">Level</span>
		<select
			value={level}
			onchange={(event) => onchange(Number(event.currentTarget.value) as Level)}
		>
			{#each LEVELS as option (option)}
				<option value={option}>Level {option}</option>
			{/each}
		</select>
	</label>
	<p class="equivalent">≈ {equivalent.abrsm} · {equivalent.french}</p>
</div>

<style>
	.level-picker {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 0.5rem 1rem;
	}

	.equivalent {
		margin: 0 0 0.35rem;
		color: var(--ink-soft);
		font-style: italic;
		font-size: 0.9rem;
	}
</style>
