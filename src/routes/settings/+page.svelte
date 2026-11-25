<script lang="ts">
	import { getLocale, LANGUAGE_NAMES, type Locale, locales, m, setLocale } from '#lib/i18n.ts';
	import type { ChordSymbolStyle } from '#lib/music/chords.ts';
	import {
		type DropCapColor,
		type ModeLanguageChoice,
		type NoteNameChoice,
		settings,
		type Theme
	} from '#lib/state/settings.svelte.ts';
</script>

<svelte:head>
	<title>{m.page_title({ page: m.nav_settings() })}</title>
</svelte:head>

<div class="page">
	<h1>{m.nav_settings()}</h1>
	<p class="lede">{m.settings_lede()}</p>

	<div class="setup">
		<label class="field">
			<span class="label">{m.settings_language()}</span>
			<select value={getLocale()} onchange={(e) => setLocale(e.currentTarget.value as Locale)}>
				{#each locales as locale (locale)}
					<option value={locale} lang={locale}>{LANGUAGE_NAMES[locale]}</option>
				{/each}
			</select>
		</label>

		<label class="field">
			<span class="label">{m.settings_note_names()}</span>
			<select
				value={settings.value.noteNames}
				onchange={(e) => settings.update({ noteNames: e.currentTarget.value as NoteNameChoice })}
			>
				<option value="auto">{m.settings_follow_language()}</option>
				<option value="letters">C D E</option>
				<option value="solfege">Do Ré Mi</option>
			</select>
		</label>

		<label class="field">
			<span class="label">{m.settings_chord_symbols()}</span>
			<select
				value={settings.value.chordStyle}
				onchange={(e) => settings.update({ chordStyle: e.currentTarget.value as ChordSymbolStyle })}
			>
				<option value="jazz">CΔ7 · D-7 · Bø7</option>
				<option value="classic">Cmaj7 · Dm7 · Bm7♭5</option>
			</select>
		</label>

		<label class="field">
			<span class="label">{m.settings_mode_names()}</span>
			<select
				value={settings.value.modeLanguage}
				onchange={(e) =>
					settings.update({ modeLanguage: e.currentTarget.value as ModeLanguageChoice })}
			>
				<option value="auto">{m.settings_follow_language()}</option>
				<option value="en">{m.settings_mode_names_en()}</option>
				<option value="fr">{m.settings_mode_names_fr()}</option>
			</select>
		</label>

		<label class="field">
			<span class="label">{m.settings_theme()}</span>
			<select
				value={settings.value.theme}
				onchange={(e) => settings.update({ theme: e.currentTarget.value as Theme })}
			>
				<option value="auto">{m.settings_theme_auto()}</option>
				<option value="light">{m.settings_theme_light()}</option>
				<option value="dark">{m.settings_theme_dark()}</option>
			</select>
		</label>

		<label class="field">
			<span class="label">{m.settings_drop_caps()}</span>
			<select
				value={settings.value.dropCapColor}
				onchange={(e) => settings.update({ dropCapColor: e.currentTarget.value as DropCapColor })}
			>
				<option value="red">{m.settings_drop_caps_red()}</option>
				<option value="black">{m.settings_drop_caps_black()}</option>
			</select>
		</label>
	</div>
</div>
