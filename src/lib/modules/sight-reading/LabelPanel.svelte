<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import type { ScoredNote } from '#lib/music/scoring.ts';
	import { LETTERS, type NoteNameSystem, noteName } from '#lib/music/pitch.ts';
	import { captureFileName, download, encodeLabels, heardAt, type Said } from './capture';
	import type { SightReadingExercise } from './exercise';
	import type { SpokenNote } from './spoken';

	interface Props {
		captureId: string;
		exercise: Pick<SightReadingExercise, 'expected'>;
		notes: readonly ScoredNote[];
		heard: readonly SpokenNote[];
		names: NoteNameSystem;
	}

	let { captureId, exercise, notes, heard, names }: Props = $props();

	const CHOICES: readonly Said[] = [...LETTERS, 'nothing', 'other'];

	// Starts as written: a reader mostly reads correctly, and only corrects the slips.
	let said = $state<Said[]>(exercise.expected.map((note) => note.letter));
	let savedAs = $state<string | null>(null);

	const choiceLabel = (choice: Said): string =>
		choice === 'nothing'
			? m.label_nothing()
			: choice === 'other'
				? m.label_other()
				: noteName({ letter: choice, accidental: 0 }, names);
	const appHeard = $derived(
		exercise.expected.map((note) => {
			const scored = notes.find((candidate) => candidate.id === note.id);
			return scored ? heardAt(scored, note.letter, heard) : 'nothing';
		})
	);
	const current = $derived(JSON.stringify(said));

	function save(): void {
		download(
			captureFileName(captureId, true),
			encodeLabels(
				captureId,
				exercise.expected.map((note, index) => ({
					noteId: note.id,
					expected: note.letter,
					said: said[index]
				}))
			)
		);
		savedAs = current;
	}
</script>

<section class="labels" aria-label={m.label_title()}>
	<h3>{m.label_title()}</h3>
	<p>{m.label_intro()}</p>
	<ol>
		{#each exercise.expected as note, index (note.id)}
			<li class:disagree={appHeard[index] !== said[index]}>
				<label>
					<span class="number">{index + 1}</span>
					<span class="written">{choiceLabel(note.letter)}</span>
					<select bind:value={said[index]} aria-label={m.label_note({ number: index + 1 })}>
						{#each CHOICES as choice (choice)}
							<option value={choice}>{choiceLabel(choice)}</option>
						{/each}
					</select>
				</label>
				{#if appHeard[index] !== said[index]}
					<span class="heard">{m.label_app_heard({ heard: choiceLabel(appHeard[index]) })}</span>
				{/if}
			</li>
		{/each}
	</ol>
	<div class="actions">
		<button type="button" class="primary" onclick={save}>{m.label_save()}</button>
		<span class="status" aria-live="polite">
			{#if savedAs === current}{m.label_saved({
					file: captureFileName(captureId, true)
				})}{:else if savedAs}{m.label_unsaved()}{/if}
		</span>
	</div>
</section>

<style>
	.labels {
		margin-top: var(--space-5);
		max-width: var(--measure);
	}

	ol {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		gap: var(--space-2) var(--space-4);
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	label {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}

	.number {
		min-width: 2ch;
		color: var(--ink-faint);
		font-variant-numeric: tabular-nums;
	}

	.written {
		min-width: 3ch;
	}

	.disagree .written {
		color: var(--bad);
		font-weight: 600;
	}

	.heard {
		font-size: var(--step--1);
		color: var(--bad);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-3);
	}

	.status {
		font-size: var(--step--1);
		font-style: italic;
	}
</style>
