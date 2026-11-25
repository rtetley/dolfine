<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import { onMount } from 'svelte';
	import { fromMidi, noteName, pitchClassOf } from '#lib/music/pitch.ts';
	import {
		type ModeId,
		modeInfo,
		modeLabel,
		PARENT_NAMES,
		parentRootOf
	} from '#lib/music/scales.ts';
	import ModeAnswer from '#lib/modules/theory/ModeAnswer.svelte';
	import ParentAnswer from '#lib/modules/theory/ParentAnswer.svelte';
	import { settings } from '#lib/state/settings.svelte.ts';
	import type { ParentChoice } from '#lib/modules/theory/questions.ts';
	import { answerSound, questionSound } from './answerSound';
	import { playSounds } from './playback';
	import type { ModeEarQuestion } from './questions';

	interface Props {
		question: ModeEarQuestion;
		format: 'choice' | 'naming' | 'play';
		onnext: () => void;
	}

	let { question, format, onnext }: Props = $props();

	let mode = $state<ModeId | null>(null);
	let parent = $state<ParentChoice>({ root: null, parent: null });
	let revealed = $state(false);

	const rootName = $derived(fromMidi(question.root, true));
	const expectedParent = $derived(parentRootOf(question.mode, rootName));
	const parentOk = $derived(
		parent.parent === modeInfo(question.mode).parent && parent.root === pitchClassOf(expectedParent)
	);

	const play = (): Promise<void> => playSounds(questionSound(question));
	const chosenSound = $derived(mode === null ? null : answerSound(question, mode));
	const wrongMode = $derived(mode !== null && mode !== question.mode);

	onMount(() => void play());
</script>

<p class="prompt">{m.mode_listening_prompt()}</p>
<div class="actions">
	<button type="button" onclick={() => void play()}>{m.action_replay()}</button>
</div>

<ModeAnswer
	options={question.options}
	format={format === 'naming' ? 'naming' : 'choice'}
	value={mode}
	correct={question.mode}
	{revealed}
	onchange={(m: ModeId) => (mode = m)}
/>
<ParentAnswer
	root={parent.root}
	parent={parent.parent}
	disabled={revealed}
	onchange={(value: ParentChoice) => (parent = value)}
/>

<div class="actions">
	{#if !revealed}
		<button
			type="button"
			class="primary"
			disabled={mode === null}
			onclick={() => (revealed = true)}
		>
			{m.action_check()}
		</button>
	{:else}
		<button type="button" class="primary" onclick={onnext}>{m.action_next()}</button>
		{#if wrongMode && mode && chosenSound}
			<button type="button" onclick={() => void playSounds(chosenSound)}>
				{m.hear_your_answer({ answer: modeLabel(mode, settings.modeLanguage) })}
			</button>
			<button type="button" onclick={() => void play()}>
				{m.hear_right_answer({ answer: modeLabel(question.mode, settings.modeLanguage) })}
			</button>
			<button type="button" onclick={() => void playSounds(chosenSound, questionSound(question))}>
				{m.yours_then_real()}
			</button>
		{/if}
	{/if}
</div>

{#if revealed}
	<p class={parentOk ? 'good' : 'bad'}>
		{m.parent_scale_reveal({
			name: `${noteName(expectedParent, settings.noteNames)} ${PARENT_NAMES[modeInfo(question.mode).parent][settings.modeLanguage]}`
		})}
	</p>
{/if}

<style>
	.prompt {
		font-size: var(--step-1);
	}
</style>
