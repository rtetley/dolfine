<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { ensureAudio, playNotes } from '#lib/audio/engine.ts';
	import ChoiceGrid from '#lib/components/ChoiceGrid.svelte';
	import NoteInput from '#lib/components/NoteInput.svelte';
	import { chordSymbol, formatSuffix } from '#lib/music/chords.ts';
	import { noteName, toMidi } from '#lib/music/pitch.ts';
	import { MODES, modeInfo, PARENT_NAMES, ROMAN } from '#lib/music/scales.ts';
	import { checkVoicing } from '#lib/music/voiceLeading.ts';
	import { defaultVoicing, voicingSpec } from '#lib/music/voicings.ts';
	import Score from '#lib/notation/Score.svelte';
	import { settings } from '#lib/state/settings.svelte.ts';
	import { closeChord, grandStaff, spellChord } from './display';
	import { checkBuiltChord, type ChordQuestion } from './questions';

	interface Props {
		question: ChordQuestion;
		format: 'choice' | 'naming';
		onnext: () => void;
	}

	let { question, format, onnext }: Props = $props();

	let chosen = $state<string | null>(null);
	let namedSuffix = $state<string | null>(null);
	let revealed = $state(false);
	const entered = new SvelteSet<number>();

	const style = $derived(settings.value.chordStyle);
	const names = $derived(settings.value.noteNames);
	const correctSymbol = $derived(chordSymbol(question.chord));
	const displaySymbol = $derived(chordSymbol(question.chord, style, names));
	const model = $derived(defaultVoicing(question.chord, question.type));
	const spec = $derived(voicingSpec(question.chord.mode, question.type));
	const suffixes = [...new Set(MODES.map((m) => m.chordSuffix))];
	const degree = $derived(Number(question.chord.mode.split(':')[1]));

	const buildCheck = $derived(
		question.kind === 'build-chord' ? checkBuiltChord(question.chord, [...entered]) : null
	);
	const voicingIssues = $derived(
		question.kind === 'voice-chord'
			? checkVoicing({ chord: question.chord, type: question.type }, [...entered])
			: []
	);
	const nameOk = $derived(
		format === 'choice'
			? chosen === correctSymbol
			: namedSuffix === MODES.find((m) => m.id === question.chord.mode)?.chordSuffix
	);
	const correct = $derived(
		question.kind === 'name-chord'
			? nameOk
			: question.kind === 'build-chord'
				? (buildCheck?.ok ?? false)
				: voicingIssues.length === 0
	);
	const ready = $derived(
		question.kind === 'name-chord'
			? format === 'choice'
				? chosen !== null
				: namedSuffix !== null
			: entered.size > 0
	);
	const marks = $derived(
		new Map(
			revealed && buildCheck
				? buildCheck.notes.map((n) => [n.midi, n.ok ? 'good' : 'bad'] as const)
				: []
		)
	);
	const close = $derived(closeChord(question.chord));
	const answerMidis = $derived(question.kind === 'voice-chord' ? model.midis : close.map(toMidi));
	const parent = $derived(modeInfo(question.chord.mode).parent);

	const play = async (midis: readonly number[]): Promise<void> => {
		await ensureAudio();
		playNotes(midis);
	};
</script>

{#if question.kind === 'name-chord'}
	<p class="prompt">
		What is the seventh chord on <strong>{ROMAN[degree - 1]}</strong> of
		<strong>
			{noteName(question.parentRoot, names)}
			{PARENT_NAMES[parent][settings.value.modeLanguage]}
		</strong>?
	</p>
	{#if format === 'choice'}
		<ChoiceGrid
			choices={question.options.map((id) => ({ id, label: id }))}
			selected={chosen}
			correctId={correctSymbol}
			{revealed}
			onchoose={(id: string) => (chosen = id)}
		/>
	{:else}
		<label class="field">
			<span class="label">Chord on {noteName(question.chord.root, names)}</span>
			<select
				value={namedSuffix ?? ''}
				disabled={revealed}
				onchange={(e) => (namedSuffix = e.currentTarget.value)}
			>
				<option value="" disabled>Quality…</option>
				{#each suffixes as suffix (suffix)}
					<option value={suffix}>
						{noteName(question.chord.root, names)}{formatSuffix(suffix, style)}
					</option>
				{/each}
			</select>
		</label>
	{/if}
{:else if question.kind === 'build-chord'}
	<p class="prompt">
		Build <strong>{displaySymbol}</strong>: play or click its four chord tones, in any octave.
	</p>
	<NoteInput
		selected={entered}
		low={48}
		high={84}
		marked={marks}
		disabled={revealed}
		maxNotes={8}
	/>
{:else}
	<p class="prompt">
		Voice <strong>{displaySymbol}</strong> as type <strong>{question.type}</strong>:
		{spec.lh.join(' ')} / {spec.rh.join(' ').replace('sharp9', '♯9')}{spec.alternative
			? ' (alternative voicing for this mode)'
			: ''}.
	</p>
	<NoteInput selected={entered} low={40} high={84} disabled={revealed} maxNotes={5} />
{/if}

<div class="actions">
	{#if !revealed}
		<button type="button" class="primary" disabled={!ready} onclick={() => (revealed = true)}>
			Check
		</button>
	{:else}
		<button type="button" class="primary" onclick={onnext}>Next question</button>
		<button type="button" onclick={() => void play(answerMidis)}>Hear the answer</button>
		{#if entered.size > 0}<button type="button" onclick={() => void play([...entered])}>
				Hear yours
			</button>{/if}
	{/if}
</div>

{#if revealed}
	<div class="feedback">
		<p class={correct ? 'good' : 'bad'}>{correct ? 'Right.' : `The answer is ${displaySymbol}.`}</p>
		{#each voicingIssues as issue, i (i)}<p class="bad">{issue.message}</p>{/each}
		{#if question.kind !== 'name-chord'}
			<Score
				score={grandStaff([
					...(entered.size > 0
						? [{ id: 'yours', pitches: spellChord(question.chord, [...entered]), label: 'yours' }]
						: []),
					question.kind === 'voice-chord'
						? { id: 'model', pitches: model.notes, label: 'model', lhCount: model.lh.length }
						: { id: 'model', pitches: close, label: 'answer' }
				])}
				label="Your chord and the model"
			/>
		{/if}
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
