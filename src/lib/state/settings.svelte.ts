import { getLocale } from '#lib/i18n.ts';
import type { ChordSymbolStyle } from '#lib/music/chords.ts';
import type { NoteNameSystem } from '#lib/music/pitch.ts';
import type { ModeLanguage } from '#lib/music/scales.ts';
import { isRecord, mergeDefaults, readStored, writeStored } from './persisted';

export type Theme = 'auto' | 'light' | 'dark';
export type DropCapColor = 'red' | 'black';
export type NoteNameChoice = NoteNameSystem | 'auto';
export type ModeLanguageChoice = ModeLanguage | 'auto';

export interface AppSettings extends Record<string, unknown> {
	noteNames: NoteNameChoice;
	chordStyle: ChordSymbolStyle;
	modeLanguage: ModeLanguageChoice;
	theme: Theme;
	dropCapColor: DropCapColor;
}

const DEFAULTS: AppSettings = {
	noteNames: 'auto',
	chordStyle: 'jazz',
	modeLanguage: 'auto',
	theme: 'auto',
	dropCapColor: 'red'
};

const LOCALE_NOTE_NAMES: Record<ModeLanguage, NoteNameSystem> = { en: 'letters', fr: 'solfege' };

class SettingsStore {
	value = $state<AppSettings>(mergeDefaults(DEFAULTS, readStored('settings', {}, isRecord)));

	get noteNames(): NoteNameSystem {
		const choice = this.value.noteNames;
		return choice === 'auto' ? LOCALE_NOTE_NAMES[getLocale()] : choice;
	}

	get modeLanguage(): ModeLanguage {
		const choice = this.value.modeLanguage;
		return choice === 'auto' ? getLocale() : choice;
	}

	update(patch: Partial<AppSettings>): void {
		this.value = { ...this.value, ...patch };
		writeStored('settings', this.value);
		applyTheme(this.value.theme);
	}
}

export function applyTheme(theme: Theme): void {
	if (typeof document === 'undefined') return;
	if (theme === 'auto') delete document.documentElement.dataset.theme;
	else document.documentElement.dataset.theme = theme;
}

export const settings = new SettingsStore();
