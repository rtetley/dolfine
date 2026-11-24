<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { ensureAudio, now, playArpeggio, playNotes } from '#lib/audio/engine.ts';
	import ChoiceGrid from '#lib/components/ChoiceGrid.svelte';
	import NoteInput from '#lib/components/NoteInput.svelte';
	import {
		samePitchClasses,
		type ChordEarQuestion,
		type IntervalQuestion,
		type VoicingEarQuestion
	} from './questions';

	interface Props {
		question: IntervalQuestion | ChordEarQuestion | VoicingEarQuestion;
		format: 'choice' | 'naming' | 'play';
		onnext: () => void;
	}

	let { question, format, onnext }: Props = $props();

	let chosen = $state<string | null>(null);
	let revealed = $state(false);
	const played = new SvelteSet<number>();

	const target = $derived(question.kind === 'intervals' ? question.notes : question.midis);
	const canPlayBack = $derived(question.kind !== 'voicings');
	const effectiveFormat = $derived(format === 'play' && !canPlayBack ? 'choice' : format);
	const correct = $derived(
		effectiveFormat === 'play' ? samePitchClasses([...played], target) : chosen === question.answer
	);
	const answerLabel = $derived(question.options.find((o) => o.id === question.answer)?.label ?? '');
	const prompt = $derived(
		question.kind === 'intervals'
			? 'Name the interval.'
			: question.kind === 'chords'
				? 'The root sounds first, then the chord. Name its quality.'
				: question.ask === 'type'
					? `The root sounds first, then ${question.chordLabel}. Which voicing type is it?`
					: `The root sounds first, then a ${question.chordLabel} chord. Which chord tone is on top?`
	);

	async function play(): Promise<void> {
		await ensureAudio();
		const start = now() + 0.05;
		if (question.kind === 'intervals') {
			if (question.harmonic) playNotes(question.notes, 1.6, start);
			else question.notes.forEach((note, i) => playNotes([note], 1.1, start + i * 0.8));
			return;
		}
		playNotes([question.root], 0.9, start);
		playNotes(question.midis, 2, start + 1.1);
	}

	async function arpeggiate(): Promise<void> {
		await ensureAudio();
		playArpeggio([...target].sort((a, b) => a - b));
	}

	async function compare(): Promise<void> {
		await ensureAudio();
		const start = now() + 0.05;
		if (played.size > 0) playNotes([...played], 1.5, start);
		playNotes(target, 1.5, start + (played.size > 0 ? 1.9 : 0));
	}

	onMount(() => void play());
</script>

<p class="prompt">{prompt}</p>
<div class="actions">
	<button type="button" onclick={() => void play()}>Replay</button>
	{#if question.kind !== 'intervals'}<button type="button" onclick={() => void arpeggiate()}>
			Arpeggiate
		</button>{/if}
</div>

{#if effectiveFormat === 'play'}
	<NoteInput selected={played} low={36} high={84} disabled={revealed} maxNotes={8} />
{:else if effectiveFormat === 'choice'}
	<ChoiceGrid
		choices={question.options}
		selected={chosen}
		correctId={question.answer}
		{revealed}
		onchoose={(id: string) => (chosen = id)}
	/>
{:else}
	<label class="field">
		<span class="label">Your answer</span>
		<select
			value={chosen ?? ''}
			disabled={revealed}
			onchange={(e) => (chosen = e.currentTarget.value)}
		>
			<option value="" disabled>Name it…</option>
			{#each [...question.options].sort( (a, b) => a.label.localeCompare(b.label) ) as option (option.id)}
				<option value={option.id}>{option.label}</option>
			{/each}
		</select>
	</label>
{/if}

<div class="actions">
	{#if !revealed}
		<button
			type="button"
			class="primary"
			disabled={effectiveFormat === 'play' ? played.size === 0 : chosen === null}
			onclick={() => (revealed = true)}
		>
			Check
		</button>
	{:else}
		<button type="button" class="primary" onclick={onnext}>Next</button>
		<button type="button" onclick={() => void compare()}>Yours, then the real one</button>
	{/if}
</div>

{#if revealed}
	<p class={correct ? 'good' : 'bad'}>
		{correct ? 'Right.' : 'Not this time.'} It was <strong>{answerLabel}</strong>.
	</p>
{/if}

<style>
	.prompt {
		font-size: 1.1rem;
	}
</style>
