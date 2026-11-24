<script lang="ts">
	import { type DropCapColor, settings, type Theme } from '#lib/state/settings.svelte.ts';
	import type { ChordSymbolStyle } from '#lib/music/chords.ts';
	import type { NoteNameSystem } from '#lib/music/pitch.ts';
	import type { ModeLanguage } from '#lib/music/scales.ts';
</script>

<svelte:head>
	<title>Settings · D.O.lfine</title>
</svelte:head>

<div class="page">
	<h1>Settings</h1>
	<p class="lede">Shared by every module. Saved in this browser only.</p>

	<div class="setup">
		<label class="field">
			<span class="label">Note names</span>
			<select
				value={settings.value.noteNames}
				onchange={(e) => settings.update({ noteNames: e.currentTarget.value as NoteNameSystem })}
			>
				<option value="letters">C D E</option>
				<option value="solfege">Do Ré Mi</option>
			</select>
		</label>
		<label class="field">
			<span class="label">Chord symbols</span>
			<select
				value={settings.value.chordStyle}
				onchange={(e) => settings.update({ chordStyle: e.currentTarget.value as ChordSymbolStyle })}
			>
				<option value="jazz">CΔ7 · D-7 · Bø7</option>
				<option value="classic">Cmaj7 · Dm7 · Bm7♭5</option>
			</select>
		</label>
		<label class="field">
			<span class="label">Mode names</span>
			<select
				value={settings.value.modeLanguage}
				onchange={(e) => settings.update({ modeLanguage: e.currentTarget.value as ModeLanguage })}
			>
				<option value="en">English (Dorian, Lydian…)</option>
				<option value="fr">Français (dorien, lydien…)</option>
			</select>
		</label>
		<label class="field">
			<span class="label">Theme</span>
			<select
				value={settings.value.theme}
				onchange={(e) => settings.update({ theme: e.currentTarget.value as Theme })}
			>
				<option value="auto">Follow the system</option>
				<option value="light">Paper</option>
				<option value="dark">Evening</option>
			</select>
		</label>
		<label class="field">
			<span class="label">Drop caps</span>
			<select
				value={settings.value.dropCapColor}
				onchange={(e) => settings.update({ dropCapColor: e.currentTarget.value as DropCapColor })}
			>
				<option value="red">Red</option>
				<option value="black">Black</option>
			</select>
		</label>
	</div>
</div>
