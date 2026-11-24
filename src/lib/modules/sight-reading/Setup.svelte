<script lang="ts">
	import LevelPicker from '#lib/components/LevelPicker.svelte';
	import MidiStatus from '#lib/components/MidiStatus.svelte';
	import type { Level } from '#lib/music/levels.ts';
	import { SIGHT_READING_LEVELS } from '#lib/music/sightReadingLevels.ts';
	import {
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

	const level = $derived(SIGHT_READING_LEVELS[prefs.level]);
	const keyOptions = Array.from({ length: 15 }, (_, i) => i - 7);
	const fifthsLabel = (fifths: number): string =>
		fifths === 0
			? 'no sharps or flats'
			: `${Math.abs(fifths)} ${fifths > 0 ? 'sharp' : 'flat'}${Math.abs(fifths) > 1 ? 's' : ''}`;
</script>

<section class="setup" aria-label="Exercise setup">
	<LevelPicker
		level={prefs.level}
		mapping="classical"
		onchange={(value: Level) => onchange({ level: value })}
	/>
	<label class="field">
		<span class="label">Staff</span>
		<select
			value={prefs.staff}
			onchange={(e) => onchange({ staff: e.currentTarget.value as StaffChoice })}
		>
			<option value="treble">Treble clef</option>
			<option value="bass">Bass clef</option>
			<option value="grand">Grand staff (piano)</option>
		</select>
	</label>
	<label class="field">
		<span class="label">Mode</span>
		<select
			value={prefs.mode}
			onchange={(e) => onchange({ mode: e.currentTarget.value as ReadingMode })}
		>
			<option value="performance">Performance · timed</option>
			<option value="practice">Practice · untimed</option>
		</select>
	</label>
	<label class="field">
		<span class="label">Metronome</span>
		<select
			value={prefs.metronome}
			onchange={(e) => onchange({ metronome: e.currentTarget.value as MetronomeChoice })}
		>
			<option value="on">On</option>
			<option value="off">Off</option>
			<option value="random-mute">Random mute</option>
		</select>
	</label>
	{#if prefs.mode === 'performance'}
		<label class="field inline">
			<input
				type="checkbox"
				checked={prefs.cursor}
				onchange={(e) => onchange({ cursor: e.currentTarget.checked })}
			/>
			<span>Cursor</span>
		</label>
		<label class="field">
			<span class="label">Preview (seconds)</span>
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
		<span>Highlight reference notes</span>
	</label>
</section>

<details class="advanced">
	<summary>Advanced settings · override the level</summary>
	<div class="setup">
		<label class="field">
			<span class="label">Key</span>
			<select
				value={prefs.keyFifths}
				onchange={(e) => onchange({ keyFifths: e.currentTarget.value })}
			>
				<option value="level">From level (up to {level.maxFifths} accidentals)</option>
				{#each keyOptions as fifths (fifths)}
					<option value={String(fifths)}>{fifthsLabel(fifths)}</option>
				{/each}
			</select>
		</label>
		<label class="field">
			<span class="label">Mode of the key</span>
			<select
				value={prefs.keyMode}
				onchange={(e) => onchange({ keyMode: e.currentTarget.value as KeyModeChoice })}
			>
				<option value="major">Major</option>
				<option value="minor">Minor</option>
				<option value="either">Either</option>
			</select>
		</label>
		<label class="field">
			<span class="label">Time signature</span>
			<select value={prefs.meter} onchange={(e) => onchange({ meter: e.currentTarget.value })}>
				{#each METER_OPTIONS as option (option)}
					<option value={option}>{option === 'level' ? 'From level' : option}</option>
				{/each}
			</select>
		</label>
		<label class="field">
			<span class="label">Tempo (♩ = , 0 = level {level.tempo})</span>
			<input
				type="number"
				min="0"
				max="240"
				value={prefs.tempo}
				onchange={(e) => onchange({ tempo: Number(e.currentTarget.value) })}
			/>
		</label>
		<label class="field">
			<span class="label">Bars (0 = level {level.bars})</span>
			<select
				value={prefs.bars}
				onchange={(e) => onchange({ bars: Number(e.currentTarget.value) })}
			>
				{#each [0, 4, 8, 16] as bars (bars)}
					<option value={bars}>{bars === 0 ? 'From level' : bars}</option>
				{/each}
			</select>
		</label>
	</div>
</details>

<div class="actions">
	<button type="button" class="primary" onclick={onstart}>Start</button>
	{#if prefs.mode === 'performance'}<MidiStatus />{/if}
</div>

<style>
	.advanced {
		margin-top: 1rem;
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
