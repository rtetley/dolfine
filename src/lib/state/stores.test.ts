import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { memoryStorage } from './testStorage';

let storage: Storage;

const loadSettings = () => import('./settings.svelte');
const useLocale = async (locale: 'en' | 'fr') => {
	const { overwriteGetLocale } = await import('#lib/paraglide/runtime.js');
	overwriteGetLocale(() => locale);
};
const loadModulePrefs = () => import('./modulePrefs.svelte');

beforeEach(() => {
	vi.resetModules();
	storage = memoryStorage();
	vi.stubGlobal('localStorage', storage);
});

afterEach(() => vi.unstubAllGlobals());

describe('settings store', () => {
	it('starts from the defaults on a fresh browser', async () => {
		const { settings } = await loadSettings();
		expect(settings.value).toEqual({
			noteNames: 'auto',
			chordStyle: 'jazz',
			modeLanguage: 'auto',
			theme: 'auto',
			dropCapColor: 'red'
		});
	});

	it.each([
		['en', 'letters', 'en'],
		['fr', 'solfege', 'fr']
	] as const)('names notes and modes after the %s interface', async (locale, notes, modes) => {
		await useLocale(locale);
		const { settings } = await loadSettings();
		expect(settings.noteNames).toBe(notes);
		expect(settings.modeLanguage).toBe(modes);
	});

	it('lets an explicit naming choice override the language', async () => {
		await useLocale('fr');
		storage.setItem(
			'dolfine:settings',
			JSON.stringify({ noteNames: 'letters', modeLanguage: 'en' })
		);
		const { settings } = await loadSettings();
		expect(settings.noteNames).toBe('letters');
		expect(settings.modeLanguage).toBe('en');
	});

	it('restores valid stored values and ignores mistyped ones', async () => {
		storage.setItem('dolfine:settings', JSON.stringify({ noteNames: 'solfege', theme: 7 }));
		const { settings } = await loadSettings();
		expect(settings.value.noteNames).toBe('solfege');
		expect(settings.value.theme).toBe('auto');
	});

	it('persists every update', async () => {
		const { settings } = await loadSettings();
		settings.update({ chordStyle: 'classic' });
		expect(settings.value.chordStyle).toBe('classic');
		expect(JSON.parse(storage.getItem('dolfine:settings') ?? '{}')).toMatchObject({
			chordStyle: 'classic',
			noteNames: 'auto'
		});
	});

	it('sets and clears the theme on the document', async () => {
		const dataset: Record<string, string> = {};
		vi.stubGlobal('document', { documentElement: { dataset } });
		const { applyTheme } = await loadSettings();
		applyTheme('dark');
		expect(dataset.theme).toBe('dark');
		applyTheme('auto');
		expect(dataset.theme).toBeUndefined();
	});
});

describe('continue store', () => {
	it('restores a valid entry and records new ones', async () => {
		storage.setItem(
			'dolfine:continue',
			JSON.stringify({ module: 'theory', summary: 'Music theory · Level 2' })
		);
		const { continueStore } = await loadModulePrefs();
		expect(continueStore.entry).toEqual({ module: 'theory', summary: 'Music theory · Level 2' });

		continueStore.record({ module: 'ear', summary: 'Ear training · Level 1 · Chords' });
		expect(JSON.parse(storage.getItem('dolfine:continue') ?? 'null')).toEqual({
			module: 'ear',
			summary: 'Ear training · Level 1 · Chords'
		});
	});

	it('rejects entries pointing at an unknown module', async () => {
		storage.setItem('dolfine:continue', JSON.stringify({ module: 'piano', summary: 'x' }));
		const { continueStore } = await loadModulePrefs();
		expect(continueStore.entry).toBeNull();
	});
});

describe('module prefs', () => {
	it('merges stored prefs over the defaults per module', async () => {
		const { loadModulePrefs: load, saveModulePrefs } = await loadModulePrefs();
		saveModulePrefs('rhythm', { level: 6, tempo: 'fast' });
		expect(load('rhythm', { level: 1, tempo: 90 })).toEqual({ level: 6, tempo: 90 });
		expect(load('ear', { level: 1 })).toEqual({ level: 1 });
	});
});
