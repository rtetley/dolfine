<script lang="ts">
	import { m } from '#lib/i18n.ts';
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
		<span class="label">{m.level_label()}</span>
		<select
			value={level}
			onchange={(event) => onchange(Number(event.currentTarget.value) as Level)}
		>
			{#each LEVELS as option (option)}
				<option value={option}>{m.level_option({ level: option })}</option>
			{/each}
		</select>
	</label>
	<p class="equivalent">≈ {equivalent.abrsm} · {equivalent.french}</p>
</div>

<style>
	.level-picker {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.equivalent {
		margin: 0;
		color: var(--ink-soft);
		font-style: italic;
		font-size: var(--step--1);
	}
</style>
