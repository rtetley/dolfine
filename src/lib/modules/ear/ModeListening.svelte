<script lang="ts">
	import { onMount } from 'svelte';
	import { ensureAudio, now, playNotes } from '#lib/audio/engine.ts';
	import { fromMidi, noteName, pitchClassOf } from '#lib/music/pitch.ts';
	import { type ModeId, modeInfo, PARENT_NAMES, parentRootOf } from '#lib/music/scales.ts';
	import ModeAnswer from '#lib/modules/theory/ModeAnswer.svelte';
	import ParentAnswer from '#lib/modules/theory/ParentAnswer.svelte';
	import { settings } from '#lib/state/settings.svelte.ts';
	import type { ParentChoice } from '#lib/modules/theory/questions.ts';
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

	async function play(): Promise<void> {
		await ensureAudio();
		const start = now() + 0.05;
		playNotes([question.root - 12], (question.scale.length + 2) * 0.45, start);
		question.scale.forEach((note, i) => playNotes([note], 0.6, start + 0.9 + i * 0.42));
	}

	onMount(() => void play());
</script>

<p class="prompt">
	A drone on the root, then the scale. Which mode is it, and what is its parent scale?
</p>
<div class="actions"><button type="button" onclick={() => void play()}>Replay</button></div>

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
			Check
		</button>
	{:else}
		<button type="button" class="primary" onclick={onnext}>Next</button>
	{/if}
</div>

{#if revealed}
	<p class={parentOk ? 'good' : 'bad'}>
		Parent scale: {noteName(expectedParent, settings.value.noteNames)}
		{PARENT_NAMES[modeInfo(question.mode).parent][settings.value.modeLanguage]}
	</p>
{/if}

<style>
	.prompt {
		font-size: 1.1rem;
	}
</style>
