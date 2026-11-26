import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANGUAGE_NAMES, locales, m } from './i18n';

type Catalogue = Record<string, unknown>;

const load = (locale: string): Catalogue => {
	const messages = JSON.parse(
		readFileSync(resolve(import.meta.dirname, `../../messages/${locale}.json`), 'utf8')
	) as Catalogue;
	return Object.fromEntries(Object.entries(messages).filter(([key]) => key !== '$schema'));
};

const catalogues = Object.fromEntries(locales.map((locale) => [locale, load(locale)]));

const texts = (message: unknown): string[] =>
	typeof message === 'string'
		? [message]
		: (message as { match: Record<string, string> }[]).flatMap((variant) =>
				Object.values(variant.match)
			);

const placeholders = (message: unknown): string[] =>
	[
		...new Set(texts(message).flatMap((text) => [...text.matchAll(/\{(\w+)\}/g)].map((x) => x[1])))
	].sort();

const IDENTICAL_ON_PURPOSE = new Set([
	'progress_xp',
	'dashboard_track_detail',
	'progress_xp_gained',
	'page_title',
	'modules_heading',
	'reading_mode_label',
	'reading_performance',
	'feel_swing',
	'score_swing',
	'exam_grade',
	'cycle_2',
	'progression_turnaround',
	'ear_submodule_voicings',
	'ear_submodule_modes',
	'ear_submodule_progressions',
	'ear_voicing_label',
	'ear_voicing_drop2',
	'mode_label',
	'interval_octave',
	'name_chord_prompt_end',
	'midi_ready_devices',
	'voicing_drop2',
	'voicing_shell_37',
	'voicing_shell_73',
	'voicing_type_a',
	'voicing_type_b'
]);

describe('message catalogues', () => {
	const [base, ...others] = locales;

	it.each(others)('%s has exactly the same keys as the base locale', (locale) => {
		expect(Object.keys(catalogues[locale]).sort()).toEqual(Object.keys(catalogues[base]).sort());
	});

	it.each(others)('%s uses the same placeholders in every message', (locale) => {
		const mismatched = Object.keys(catalogues[base]).filter(
			(key) =>
				placeholders(catalogues[base][key]).join() !== placeholders(catalogues[locale][key]).join()
		);
		expect(mismatched).toEqual([]);
	});

	it.each(locales)('%s has no empty messages', (locale) => {
		const empty = Object.entries(catalogues[locale]).filter(([, message]) =>
			texts(message).some((text) => text.trim() === '')
		);
		expect(empty).toEqual([]);
	});

	it.each(others)('%s translates every message that should differ', (locale) => {
		const untranslated = Object.keys(catalogues[base]).filter(
			(key) =>
				!IDENTICAL_ON_PURPOSE.has(key) &&
				JSON.stringify(catalogues[base][key]) === JSON.stringify(catalogues[locale][key])
		);
		expect(untranslated).toEqual([]);
	});

	it('names every locale in its own language', () => {
		expect(Object.keys(LANGUAGE_NAMES).sort()).toEqual([...locales].sort());
	});
});

describe('messages', () => {
	it('follow French typography', () => {
		expect(m.name_mode_prompt({}, { locale: 'fr' })).toBe(
			'Quel est ce mode, et quelle est sa gamme mère\u202f?'
		);
		expect(m.scale_wrong({}, { locale: 'fr' })).toBe('Pas tout à fait. La gamme est\u00a0:');
	});

	it.each([
		[0, '0 note sélectionnée'],
		[1, '1 note sélectionnée'],
		[3, '3 notes sélectionnées']
	])('pluralise %i notes the French way', (count, expected) => {
		expect(m.notes_selected({ count }, { locale: 'fr' })).toBe(expected);
	});

	it('pluralise in English', () => {
		expect(m.notes_selected({ count: 1 })).toBe('1 note selected');
		expect(m.notes_selected({ count: 0 })).toBe('0 notes selected');
	});
});
