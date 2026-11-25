<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { ensureAudio, now, playArpeggio, playNotes } from '#lib/audio/engine.ts';
	import ChoiceGrid from '#lib/components/ChoiceGrid.svelte';
	import NoteInput from '#lib/components/NoteInput.svelte';
	import { answerSound, questionSound } from './answerSound';
	import { playSounds } from './playback';
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
	const chosenLabel = $derived(question.options.find((o) => o.id === chosen)?.label ?? '');
	const chosenSound = $derived(chosen === null ? null : answerSound(question, chosen));
	const prompt = $derived(
		question.kind === 'intervals'
			? m.ear_prompt_interval()
			: question.kind === 'chords'
				? m.ear_prompt_chord()
				: question.ask === 'type'
					? m.ear_prompt_voicing_type({ chord: question.chordLabel })
					: m.ear_prompt_top_note({ chord: question.chordLabel })
	);

	const play = (): Promise<void> => playSounds(questionSound(question));

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
	<button type="button" onclick={() => void play()}>{m.action_replay()}</button>
	{#if question.kind !== 'intervals'}<button type="button" onclick={() => void arpeggiate()}>
			{m.arpeggiate()}
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
		<span class="label">{m.your_answer_label()}</span>
		<select
			value={chosen ?? ''}
			disabled={revealed}
			onchange={(e) => (chosen = e.currentTarget.value)}
		>
			<option value="" disabled>{m.name_it_placeholder()}</option>
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
			{m.action_check()}
		</button>
	{:else}
		<button type="button" class="primary" onclick={onnext}>{m.action_next()}</button>
		{#if effectiveFormat === 'play'}
			<button type="button" onclick={() => void compare()}>{m.yours_then_real()}</button>
		{:else if !correct && chosenSound}
			<button type="button" onclick={() => void playSounds(chosenSound)}>
				{m.hear_your_answer({ answer: chosenLabel })}
			</button>
			<button type="button" onclick={() => void play()}>
				{m.hear_right_answer({ answer: answerLabel })}
			</button>
			<button type="button" onclick={() => void playSounds(chosenSound, questionSound(question))}>
				{m.yours_then_real()}
			</button>
		{/if}
	{/if}
</div>

{#if revealed}
	<p class={correct ? 'good' : 'bad'}>
		{`${correct ? m.feedback_right() : m.feedback_wrong()} ${m.feedback_it_was()}`}
		<strong>{answerLabel}</strong>.
	</p>
{/if}

<style>
	.prompt {
		font-size: var(--step-1);
	}
</style>
