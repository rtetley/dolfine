<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { ensureAudio, playArpeggio } from '#lib/audio/engine.ts';
	import NoteInput from '#lib/components/NoteInput.svelte';
	import { noteName, toMidi } from '#lib/music/pitch.ts';
	import { type ModeId, modeLabel, PARENT_NAMES } from '#lib/music/scales.ts';
	import Score from '#lib/notation/Score.svelte';
	import { settings } from '#lib/state/settings.svelte.ts';
	import { scaleScore } from './display';
	import ModeAnswer from './ModeAnswer.svelte';
	import ParentAnswer from './ParentAnswer.svelte';
	import {
		checkParentAnswer,
		checkWrittenScale,
		type ModeQuestion,
		type ParentChoice,
		parentOf
	} from './questions';

	interface Props {
		question: ModeQuestion;
		format: 'choice' | 'naming';
		onnext: () => void;
	}

	let { question, format, onnext }: Props = $props();

	let mode = $state<ModeId | null>(null);
	let parentAnswer = $state<ParentChoice>({
		root: null,
		parent: null
	});
	let revealed = $state(false);
	const written = new SvelteSet<number>();

	const names = $derived(settings.value.noteNames);
	const language = $derived(settings.value.modeLanguage);
	const expectedParent = $derived(parentOf(question.mode, question.modeRoot));
	const scaleCheck = $derived(
		question.kind === 'write-mode' ? checkWrittenScale(question, [...written]) : null
	);
	const parentOk = $derived(
		parentAnswer.root !== null &&
			parentAnswer.parent !== null &&
			checkParentAnswer(question, parentAnswer.parent, parentAnswer.root)
	);
	const marks = $derived(
		new Map(
			revealed && scaleCheck
				? scaleCheck.notes.map((n) => [n.midi, n.ok ? 'good' : 'bad'] as const)
				: []
		)
	);
	const ready = $derived(
		parentAnswer.root !== null &&
			parentAnswer.parent !== null &&
			(question.kind === 'write-mode' ? written.size > 0 : mode !== null)
	);

	const hear = async (): Promise<void> => {
		await ensureAudio();
		const midis = question.notes.map(toMidi);
		playArpeggio([...midis, (midis[0] ?? 60) + 12], 0.3, 0.6);
	};
</script>

{#if question.kind === 'name-mode'}
	<p class="prompt">Which mode is this, and what is its parent scale?</p>
	<Score score={scaleScore(question.notes)} label="Scale to name" />
	<div class="actions"><button type="button" onclick={() => void hear()}>Hear it</button></div>
	<ModeAnswer
		options={question.options}
		{format}
		value={mode}
		correct={question.mode}
		{revealed}
		onchange={(m: ModeId) => (mode = m)}
	/>
{:else}
	<p class="prompt">
		Write <strong>{noteName(question.modeRoot, names)} {modeLabel(question.mode, language)}</strong>
		ascending from
		{noteName(question.modeRoot, names)}, then name its parent scale.
	</p>
	<NoteInput
		selected={written}
		low={55}
		high={84}
		marked={marks}
		disabled={revealed}
		maxNotes={8}
	/>
{/if}

<ParentAnswer
	root={parentAnswer.root}
	parent={parentAnswer.parent}
	disabled={revealed}
	onchange={(value: ParentChoice) => (parentAnswer = value)}
/>

<div class="actions">
	{#if !revealed}
		<button type="button" class="primary" disabled={!ready} onclick={() => (revealed = true)}>
			Check
		</button>
	{:else}
		<button type="button" class="primary" onclick={onnext}>Next question</button>
		<button type="button" onclick={() => void hear()}>Hear the scale</button>
	{/if}
</div>

{#if revealed}
	<div class="feedback">
		{#if question.kind === 'write-mode'}
			<p class={scaleCheck?.ok ? 'good' : 'bad'}>
				{scaleCheck?.ok ? 'The scale is right.' : 'Not quite. The scale is:'}
			</p>
			{#if !scaleCheck?.ok}<Score score={scaleScore(question.notes)} label="Correct scale" />{/if}
		{/if}
		<p class={parentOk ? 'good' : 'bad'}>
			{parentOk ? 'Parent scale right: ' : 'Parent scale: '}
			{noteName(expectedParent.root, names)}
			{PARENT_NAMES[expectedParent.parent][language]} · degree {question.mode.split(':')[1]}
		</p>
	</div>
{/if}

<style>
	.prompt {
		font-size: 1.1rem;
	}

	.feedback {
		border-top: 1px solid var(--rule);
		padding-top: 0.5rem;
	}
</style>
