<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import MidiStatus from '#lib/components/MidiStatus.svelte';
	import { readingContent } from '#lib/music/sightReadingLevels.ts';
	import { settings } from '#lib/state/settings.svelte.ts';
	import { voiceProfile } from '#lib/state/voiceProfile.svelte.ts';
	import {
		type AnswerInput,
		type KeyModeChoice,
		METER_OPTIONS,
		type MetronomeChoice,
		type ReadingMode,
		type SightReadingPrefs,
		type StaffChoice
	} from './prefs';

	interface Props {
		prefs: SightReadingPrefs;
		onchange: (patch: Partial<SightReadingPrefs>) => void;
		onstart: () => void;
	}

	let { prefs, onchange, onstart }: Props = $props();

	const level = $derived(readingContent(prefs.level, prefs.exercise));
	const timed = $derived(prefs.mode === 'performance');
	const spoken = $derived(prefs.input === 'voice');
	const canStart = $derived(!timed || !spoken || voiceProfile.for(settings.noteNames) !== null);
	const keyOptions = Array.from({ length: 15 }, (_, i) => i - 7);
	const fifthsLabel = (fifths: number): string =>
		fifths === 0
			? m.key_no_accidentals()
			: fifths > 0
				? m.key_sharps({ count: fifths })
				: m.key_flats({ count: -fifths });
</script>

<section class="setup" aria-label={m.setup_label()}>
	<label class="field">
		<span class="label">{m.staff_label()}</span>
		<select
			value={prefs.staff}
			onchange={(e) => onchange({ staff: e.currentTarget.value as StaffChoice })}
		>
			<option value="treble">{m.staff_treble()}</option>
			<option value="bass">{m.staff_bass()}</option>
			{#if !spoken}<option value="grand">{m.staff_grand()}</option>{/if}
		</select>
	</label>
	<label class="field">
		<span class="label">{m.reading_mode_label()}</span>
		<select
			value={prefs.mode}
			onchange={(e) => onchange({ mode: e.currentTarget.value as ReadingMode })}
		>
			<option value="performance">{m.reading_mode_performance()}</option>
			<option value="practice">{m.reading_mode_practice()}</option>
		</select>
	</label>
	<label class="field">
		<span class="label">{m.metronome_label()}</span>
		<select
			value={prefs.metronome}
			onchange={(e) => onchange({ metronome: e.currentTarget.value as MetronomeChoice })}
		>
			<option value="on">{m.metronome_on()}</option>
			<option value="off">{m.metronome_off()}</option>
			<option value="random-mute">{m.metronome_random_mute()}</option>
		</select>
	</label>
	<label class="field">
		<span class="label">{m.answer_label()}</span>
		<select
			value={prefs.input}
			onchange={(e) => {
				const input = e.currentTarget.value as AnswerInput;
				onchange(
					input === 'voice' && prefs.staff === 'grand' ? { input, staff: 'treble' } : { input }
				);
			}}
		>
			<option value="midi">{m.answer_midi()}</option>
			<option value="voice">{m.answer_voice()}</option>
		</select>
	</label>
	{#if timed}
		<label class="field inline">
			<input
				type="checkbox"
				checked={prefs.cursor}
				onchange={(e) => onchange({ cursor: e.currentTarget.checked })}
			/>
			<span>{m.cursor_label()}</span>
		</label>
		<label class="field">
			<span class="label">{m.preview_seconds_label()}</span>
			<input
				type="number"
				min="0"
				max="120"
				value={prefs.previewSeconds}
				onchange={(e) => onchange({ previewSeconds: Number(e.currentTarget.value) })}
			/>
		</label>
	{/if}
	<label class="field inline">
		<input
			type="checkbox"
			checked={prefs.referenceNotes}
			onchange={(e) => onchange({ referenceNotes: e.currentTarget.checked })}
		/>
		<span>{m.reference_notes_label()}</span>
	</label>
</section>

<details class="advanced">
	<summary>{m.advanced_settings()}</summary>
	<div class="setup">
		<label class="field">
			<span class="label">{m.key_label()}</span>
			<select
				value={prefs.keyFifths}
				onchange={(e) => onchange({ keyFifths: e.currentTarget.value })}
			>
				<option value="level">{m.key_from_level({ count: level.maxFifths })}</option>
				{#each keyOptions as fifths (fifths)}
					<option value={String(fifths)}>{fifthsLabel(fifths)}</option>
				{/each}
			</select>
		</label>
		<label class="field">
			<span class="label">{m.key_mode_label()}</span>
			<select
				value={prefs.keyMode}
				onchange={(e) => onchange({ keyMode: e.currentTarget.value as KeyModeChoice })}
			>
				<option value="major">{m.key_mode_major()}</option>
				<option value="minor">{m.key_mode_minor()}</option>
				<option value="either">{m.key_mode_either()}</option>
			</select>
		</label>
		<label class="field">
			<span class="label">{m.time_signature_label()}</span>
			<select value={prefs.meter} onchange={(e) => onchange({ meter: e.currentTarget.value })}>
				{#each METER_OPTIONS as option (option)}
					<option value={option}>{option === 'level' ? m.from_level() : option}</option>
				{/each}
			</select>
		</label>
		<label class="field">
			<span class="label">{m.tempo_from_level({ tempo: level.tempo })}</span>
			<input
				type="number"
				min="0"
				max="240"
				value={prefs.tempo}
				onchange={(e) => onchange({ tempo: Number(e.currentTarget.value) })}
			/>
		</label>
		<label class="field">
			<span class="label">{m.bars_from_level({ bars: level.bars })}</span>
			<select
				value={prefs.bars}
				onchange={(e) => onchange({ bars: Number(e.currentTarget.value) })}
			>
				{#each [0, 4, 8, 16] as bars (bars)}
					<option value={bars}>{bars === 0 ? m.from_level() : bars}</option>
				{/each}
			</select>
		</label>
	</div>
</details>

{#if spoken}
	{#await import('./VoiceCalibration.svelte') then { default: VoiceCalibration }}
		<VoiceCalibration />
	{/await}
{/if}

<div class="actions">
	<button type="button" class="primary" disabled={!canStart} onclick={onstart}>
		{m.action_start()}
	</button>
	{#if timed && !spoken}<MidiStatus />{/if}
</div>

<style>
	.advanced {
		margin-top: var(--space-4);
	}

	.advanced summary {
		cursor: pointer;
		color: var(--ink-soft);
		font-style: italic;
	}

	.advanced .setup {
		border-top: none;
	}
</style>
