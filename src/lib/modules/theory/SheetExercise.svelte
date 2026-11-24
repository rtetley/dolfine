<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { ensureAudio, playSchedule } from '#lib/audio/engine.ts';
	import NoteInput from '#lib/components/NoteInput.svelte';
	import { chordSymbol } from '#lib/music/chords.ts';
	import { PROGRESSION_LABELS } from '#lib/music/progressions.ts';
	import { checkSheet, type Violation } from '#lib/music/voiceLeading.ts';
	import { voicingSpec } from '#lib/music/voicings.ts';
	import Score from '#lib/notation/Score.svelte';
	import { settings } from '#lib/state/settings.svelte.ts';
	import { grandStaff, type SheetColumn, spellChord } from './display';
	import type { SheetQuestion } from './questions';

	interface Props {
		question: SheetQuestion;
		onnext: () => void;
	}

	let { question, onnext }: Props = $props();

	let answers = $state<number[][]>([]);
	let checked = $state(false);
	let showModel = $state(false);
	const current = new SvelteSet<number>();

	const symbols = $derived(
		question.entries.map((entry) =>
			chordSymbol(entry.chord, settings.value.chordStyle, settings.value.noteNames)
		)
	);
	const position = $derived(answers.length);
	const done = $derived(position >= question.entries.length);
	const violations = $derived<Violation[]>(checked ? checkSheet(question.entries, answers) : []);
	const currentEntry = $derived(question.entries[position]);
	const currentSpec = $derived(
		currentEntry ? voicingSpec(currentEntry.chord.mode, currentEntry.type) : null
	);

	const columns = $derived<SheetColumn[]>(
		question.entries.map((entry, i) => {
			const answer = answers[i];
			const label = `${symbols[i] ?? ''} · ${entry.type}`;
			return answer
				? {
						id: `a${i}`,
						pitches: spellChord(entry.chord, answer),
						label,
						lhCount: voicingSpec(entry.chord.mode, entry.type).lh.length
					}
				: { id: `a${i}`, pitches: [], label };
		})
	);
	const modelColumns = $derived<SheetColumn[]>(
		question.model.map((voicing, i) => ({
			id: `m${i}`,
			pitches: voicing.notes,
			label: symbols[i] ?? '',
			lhCount: voicing.lh.length
		}))
	);

	function confirm(): void {
		answers = [...answers, [...current].sort((a, b) => a - b)];
		current.clear();
	}

	function undo(): void {
		answers = answers.slice(0, -1);
		checked = false;
	}

	async function play(sheet: readonly (readonly number[])[]): Promise<void> {
		await ensureAudio();
		playSchedule(sheet.map((midis, i) => ({ midis, at: i * 1.6, duration: 1.5 })));
	}
</script>

<p class="prompt">
	{PROGRESSION_LABELS[question.progression.kind]}. Voice each chord with the type shown, connecting
	them with tight voice leading: common tones held, every other upper voice moving by a second at
	most.
</p>

<Score score={grandStaff(columns)} preferredPerLine={4} label="Your voice-leading sheet" />

{#if !done && currentEntry && currentSpec}
	<p class="label">
		Chord {position + 1} of {question.entries.length}: {symbols[position]} · type {currentEntry.type}
		·
		{currentSpec.lh.join(' ')} / {currentSpec.rh.join(' ').replace('sharp9', '♯9')}
	</p>
	<NoteInput selected={current} low={40} high={84} maxNotes={5} />
	<div class="actions">
		<button type="button" class="primary" disabled={current.size !== 5} onclick={confirm}>
			Write this chord
		</button>
		{#if position > 0}<button type="button" onclick={undo}>Undo last chord</button>{/if}
	</div>
{:else}
	<div class="actions">
		{#if !checked}
			<button type="button" class="primary" onclick={() => (checked = true)}>
				Check the sheet
			</button>
			<button type="button" onclick={undo}>Undo last chord</button>
		{:else}
			<button type="button" class="primary" onclick={onnext}>Next sheet</button>
			<button type="button" onclick={() => (showModel = !showModel)}>
				{showModel ? 'Hide' : 'Show'} a model answer
			</button>
		{/if}
		<button type="button" onclick={() => void play(answers)}>Play yours</button>
		<button type="button" onclick={() => void play(question.model.map((v) => v.midis))}>
			Play the model
		</button>
	</div>
	{#if checked}
		{#if violations.length === 0}
			<p class="good">Every rule holds. Clean voice leading.</p>
		{:else}
			<ul class="violations">
				{#each violations as violation, i (i)}
					<li class="bad">
						Chord {violation.chordIndex + 1} ({symbols[violation.chordIndex]}): {violation.message}
					</li>
				{/each}
			</ul>
		{/if}
		{#if showModel}<Score score={grandStaff(modelColumns)} label="Model answer" />{/if}
	{/if}
{/if}

<style>
	.prompt {
		font-size: 1.05rem;
		max-width: var(--measure);
	}

	.violations {
		padding-left: 1.2rem;
	}
</style>
