<script lang="ts">
	import { m } from '#lib/i18n.ts';
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
	import { voicingRuleIssues, writtenChordColumn } from './liveStaff';
	import type { SheetQuestion } from './questions';

	interface Props {
		question: SheetQuestion;
		liveRules?: boolean;
		onnext: () => void;
	}

	let { question, liveRules = true, onnext }: Props = $props();

	let answers = $state<number[][]>([]);
	let checked = $state(false);
	let showModel = $state(false);
	const current = new SvelteSet<number>();

	const symbols = $derived(
		question.entries.map((entry) =>
			chordSymbol(entry.chord, settings.value.chordStyle, settings.noteNames)
		)
	);
	const position = $derived(answers.length);
	const done = $derived(position >= question.entries.length);
	const violations = $derived<Violation[]>(checked ? checkSheet(question.entries, answers) : []);
	const currentEntry = $derived(question.entries[position]);
	const currentSpec = $derived(
		currentEntry ? voicingSpec(currentEntry.chord.mode, currentEntry.type) : null
	);

	const currentLh = $derived(currentSpec?.lh.length ?? 0);
	const ruleIssues = $derived(
		liveRules && !done
			? voicingRuleIssues(current, currentLh)
			: { flagged: new Set<number>(), messages: [] }
	);

	const columns = $derived<SheetColumn[]>(
		question.entries.map((entry, i) => {
			const answer = answers[i];
			const label = `${symbols[i] ?? ''} · ${entry.type}`;
			if (i === position && !answer && current.size > 0) {
				return writtenChordColumn(`a${i}`, entry.chord, current, {
					label,
					lhCount: current.size > currentLh ? currentLh : undefined,
					flagged: ruleIssues.flagged
				});
			}
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
	{m.sheet_prompt({ progression: PROGRESSION_LABELS[question.progression.kind] })}
</p>

<Score score={grandStaff(columns)} preferredPerLine={4} label={m.sheet_score_label()} />

{#if !done && currentEntry && currentSpec}
	<p class="label">
		{m.sheet_position({
			position: position + 1,
			total: question.entries.length,
			symbol: symbols[position] ?? '',
			type: currentEntry.type
		})}
		{currentSpec.lh.join(' ')} / {currentSpec.rh.join(' ').replace('sharp9', '♯9')}
	</p>
	{#each ruleIssues.messages as message (message)}<p class="bad">{message}</p>{/each}
	<NoteInput selected={current} low={40} high={84} maxNotes={5} />
	<div class="actions">
		<button type="button" class="primary" disabled={current.size !== 5} onclick={confirm}>
			{m.sheet_write_chord()}
		</button>
		{#if position > 0}<button type="button" onclick={undo}>{m.sheet_undo()}</button>{/if}
	</div>
{:else}
	<div class="actions">
		{#if !checked}
			<button type="button" class="primary" onclick={() => (checked = true)}>
				{m.sheet_check()}
			</button>
			<button type="button" onclick={undo}>{m.sheet_undo()}</button>
		{:else}
			<button type="button" class="primary" onclick={onnext}>{m.sheet_next()}</button>
			<button type="button" onclick={() => (showModel = !showModel)}>
				{showModel ? m.sheet_hide_model() : m.sheet_show_model()}
			</button>
		{/if}
		<button type="button" onclick={() => void play(answers)}>{m.sheet_play_yours()}</button>
		<button type="button" onclick={() => void play(question.model.map((v) => v.midis))}>
			{m.sheet_play_model()}
		</button>
	</div>
	{#if checked}
		{#if violations.length === 0}
			<p class="good">{m.sheet_clean()}</p>
		{:else}
			<ul class="violations">
				{#each violations as violation, i (i)}
					<li class="bad">
						{m.sheet_violation({
							position: violation.chordIndex + 1,
							symbol: symbols[violation.chordIndex] ?? '',
							message: violation.message
						})}
					</li>
				{/each}
			</ul>
		{/if}
		{#if showModel}<Score score={grandStaff(modelColumns)} label={m.sheet_model_label()} />{/if}
	{/if}
{/if}

<style>
	.prompt {
		font-size: var(--step-1);
		max-width: var(--measure);
	}

	.violations {
		padding-left: var(--space-4);
	}
</style>
