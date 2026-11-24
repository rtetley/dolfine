<script lang="ts">
	import { chordSymbol } from '#lib/music/chords.ts';
	import { PROGRESSION_LABELS } from '#lib/music/progressions.ts';
	import type { ModeId } from '#lib/music/scales.ts';
	import { settings } from '#lib/state/settings.svelte.ts';
	import ModeAnswer from './ModeAnswer.svelte';
	import type { ContextQuestion } from './questions';

	interface Props {
		question: ContextQuestion;
		format: 'choice' | 'naming';
		onnext: () => void;
	}

	let { question, format, onnext }: Props = $props();

	let mode = $state<ModeId | null>(null);
	let revealed = $state(false);

	const target = $derived(question.progression.chords[question.index]);
</script>

<p class="prompt">
	{PROGRESSION_LABELS[question.progression.kind]}. Which mode fits the highlighted chord here?
</p>

<ol class="grid" aria-label="Chord grid">
	{#each question.progression.chords as chord, i (i)}
		<li class:target={i === question.index}>
			<span class="symbol">
				{chordSymbol(chord, settings.value.chordStyle, settings.value.noteNames)}
			</span>
			{#if revealed}<span class="roman">{chord.roman}</span>{/if}
		</li>
	{/each}
</ol>

{#if target}
	<ModeAnswer
		options={question.options}
		{format}
		value={mode}
		correct={target.mode}
		{revealed}
		onchange={(m: ModeId) => (mode = m)}
	/>
{/if}

<div class="actions">
	{#if !revealed}
		<button
			type="button"
			class="primary"
			disabled={mode === null}
			onclick={() => (revealed = true)}
		>
			Check
		</button>
	{:else}
		<button type="button" class="primary" onclick={onnext}>Next question</button>
	{/if}
</div>

<style>
	.prompt {
		font-size: 1.1rem;
	}

	.grid {
		list-style: none;
		padding: 0;
		margin: 1rem 0 1.5rem;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
		border-left: 1px solid var(--ink-soft);
	}

	.grid li {
		display: grid;
		gap: 0.2rem;
		padding: 0.8rem 0.9rem;
		border-right: 1px solid var(--ink-soft);
		border-top: 1px solid var(--rule);
		border-bottom: 1px solid var(--rule);
	}

	.grid li.target {
		background: var(--accent-soft);
	}

	.symbol {
		font-size: 1.15rem;
	}

	.roman {
		font-size: 0.8rem;
		color: var(--ink-soft);
	}
</style>
