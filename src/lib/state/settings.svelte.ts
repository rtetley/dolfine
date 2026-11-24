import type { ChordSymbolStyle } from '#lib/music/chords.ts';
import type { NoteNameSystem } from '#lib/music/pitch.ts';
import type { ModeLanguage } from '#lib/music/scales.ts';
import { isRecord, mergeDefaults, readStored, writeStored } from './persisted';

export type Theme = 'auto' | 'light' | 'dark';

export interface AppSettings extends Record<string, unknown> {
	noteNames: NoteNameSystem;
	chordStyle: ChordSymbolStyle;
	modeLanguage: ModeLanguage;
	theme: Theme;
}

const DEFAULTS: AppSettings = {
	noteNames: 'letters',
	chordStyle: 'jazz',
	modeLanguage: 'en',
	theme: 'auto'
};

class SettingsStore {
	value = $state<AppSettings>(mergeDefaults(DEFAULTS, readStored('settings', {}, isRecord)));

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
