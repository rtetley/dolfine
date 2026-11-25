<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import { onMount } from 'svelte';
	import { ensureAudio, playSchedule } from '#lib/audio/engine.ts';
	import { PROGRESSION_LABELS } from '#lib/music/progressions.ts';
	import type { ProgressionEarQuestion } from './questions';

	interface Props {
		question: ProgressionEarQuestion;
		onnext: () => void;
	}

	let { question, onnext }: Props = $props();

	let answers = $state<(string | null)[]>([]);
	let revealed = $state(false);

	const complete = $derived(question.answers.every((_, i) => answers[i]));
	const score = $derived(question.answers.filter((answer, i) => answers[i] === answer).length);

	async function play(): Promise<void> {
		await ensureAudio();
		playSchedule([
			{ midis: question.tonic, at: 0, duration: 1.4 },
			...question.voicings.map((midis, i) => ({ midis, at: 2.2 + i * 1.6, duration: 1.5 }))
		]);
	}

	onMount(() => void play());
</script>

<p class="prompt">
	{m.progression_prompt({ count: question.progression.chords.length })}
	{question.ask === 'degrees' ? m.progression_ask_degrees() : m.progression_ask_symbols()}
</p>
<div class="actions">
	<button type="button" onclick={() => void play()}>{m.action_replay()}</button>
</div>

<ol class="slots">
	{#each question.answers as answer, i (i)}
		<li>
			<span class="label">{m.progression_slot({ position: i + 1 })}</span>
			<select
				value={answers[i] ?? ''}
				disabled={revealed}
				onchange={(e) => (answers[i] = e.currentTarget.value)}
			>
				<option value="" disabled>…</option>
				{#each question.options as option (option)}<option value={option}>{option}</option>{/each}
			</select>
			{#if revealed}<span class={answers[i] === answer ? 'good' : 'bad'}>{answer}</span>{/if}
		</li>
	{/each}
</ol>

<div class="actions">
	{#if !revealed}
		<button type="button" class="primary" disabled={!complete} onclick={() => (revealed = true)}>
			{m.action_check()}
		</button>
	{:else}
		<button type="button" class="primary" onclick={onnext}>{m.action_next()}</button>
		<span>
			{m.progression_score({
				score,
				total: question.answers.length,
				progression: PROGRESSION_LABELS[question.progression.kind]
			})}
		</span>
	{/if}
</div>

<style>
	.prompt {
		font-size: 1.1rem;
	}

	.slots {
		list-style: none;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
		gap: 0.8rem;
	}

	.slots li {
		display: grid;
		gap: 0.3rem;
	}
</style>
