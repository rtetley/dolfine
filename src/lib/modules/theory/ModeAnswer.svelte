<script lang="ts">
	import ChoiceGrid from '#lib/components/ChoiceGrid.svelte';
	import { MODES, type ModeId, modeLabel, PARENT_NAMES } from '#lib/music/scales.ts';
	import { settings } from '#lib/state/settings.svelte.ts';

	interface Props {
		options: readonly ModeId[];
		format: 'choice' | 'naming';
		value: ModeId | null;
		correct: ModeId;
		revealed: boolean;
		onchange: (mode: ModeId) => void;
	}

	let { options, format, value, correct, revealed, onchange }: Props = $props();

	const language = $derived(settings.value.modeLanguage);
	const choices = $derived(options.map((id) => ({ id, label: modeLabel(id, language) })));
</script>

{#if format === 'choice'}
	<ChoiceGrid
		{choices}
		selected={value}
		correctId={correct}
		{revealed}
		onchoose={(id) => onchange(id as ModeId)}
	/>
{:else}
	<label class="field">
		<span class="label">Mode</span>
		<select
			value={value ?? ''}
			disabled={revealed}
			onchange={(e) => onchange(e.currentTarget.value as ModeId)}
		>
			<option value="" disabled>Name the mode…</option>
			{#each Object.keys(PARENT_NAMES) as parent (parent)}
				<optgroup label={PARENT_NAMES[parent as keyof typeof PARENT_NAMES][language]}>
					{#each MODES.filter((m) => m.parent === parent) as mode (mode.id)}
						<option value={mode.id}>{modeLabel(mode.id, language)}</option>
					{/each}
				</optgroup>
			{/each}
		</select>
	</label>
	{#if revealed}
		<p class={value === correct ? 'good' : 'bad'}>
			{value === correct ? 'Right.' : `It is ${modeLabel(correct, language)}.`}
		</p>
	{/if}
{/if}
