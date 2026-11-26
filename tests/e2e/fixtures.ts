import { test as base, expect, type Page } from '@playwright/test';

function silentWav(seconds = 0.05, sampleRate = 8000): Buffer {
	const samples = Math.round(seconds * sampleRate);
	const buffer = Buffer.alloc(44 + samples * 2);
	buffer.write('RIFF', 0);
	buffer.writeUInt32LE(36 + samples * 2, 4);
	buffer.write('WAVEfmt ', 8);
	buffer.writeUInt32LE(16, 16);
	buffer.writeUInt16LE(1, 20);
	buffer.writeUInt16LE(1, 22);
	buffer.writeUInt32LE(sampleRate, 24);
	buffer.writeUInt32LE(sampleRate * 2, 28);
	buffer.writeUInt16LE(2, 32);
	buffer.writeUInt16LE(16, 34);
	buffer.write('data', 36);
	buffer.writeUInt32LE(samples * 2, 40);
	return buffer;
}

const SILENCE = silentWav();

interface Options {
	/**
	 * Starts each test as a student who has finished onboarding (tour taken, module
	 * introductions put away), so flows can be tested on their own. Onboarding tests set it false.
	 */
	onboarded: boolean;
}

interface Fixtures {
	/** Piano sample requests, answered with silence so tests never hit the network. */
	samples: string[];
	/** Console errors and uncaught exceptions; every test fails if any remain. */
	errors: string[];
}

export const test = base.extend<Options & Fixtures>({
	onboarded: [true, { option: true }],
	page: async ({ page, onboarded }, use) => {
		if (onboarded) {
			await page.addInitScript(() => {
				if (localStorage.getItem('dolfine:onboarding') !== null) return;
				localStorage.setItem(
					'dolfine:onboarding',
					JSON.stringify({ tour: 'done', seen: ['sight-reading', 'rhythm', 'theory', 'ear'] })
				);
			});
		}
		await use(page);
	},
	samples: [
		async ({ page }, use) => {
			const requested: string[] = [];
			await page.route('**/samples/piano/**', (route) => {
				requested.push(new URL(route.request().url()).pathname.split('/').pop() ?? '');
				return route.fulfill({ body: SILENCE, contentType: 'audio/wav' });
			});
			await use(requested);
		},
		{ auto: true }
	],
	errors: [
		async ({ page }, use) => {
			const errors: string[] = [];
			page.on('console', (message) => {
				if (message.type() === 'error') errors.push(message.text());
			});
			page.on('pageerror', (error) => errors.push(error.message));
			await use(errors);
			expect(errors, 'console errors').toEqual([]);
		},
		{ auto: true }
	]
});

export { expect };

export async function seedStorage(page: Page, entries: Record<string, unknown>): Promise<void> {
	await page.addInitScript((values) => {
		if (sessionStorage.getItem('e2e-seeded')) return;
		sessionStorage.setItem('e2e-seeded', '1');
		for (const [key, value] of Object.entries(values)) {
			localStorage.setItem(`dolfine:${key}`, JSON.stringify(value));
		}
	}, entries);
}

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The section of a level on the music theory or ear training level map. */
export const levelSection = (page: Page, level: number, word = 'Level') =>
	page.getByRole('region', { name: new RegExp(`^${word} ${level} `) });

/** An exercise button on the level map, found by its name. */
export const drillButton = (page: Page, level: number, exercise: string, word = 'Level') =>
	levelSection(page, level, word).getByRole('button', {
		name: new RegExp(`^${escapeRegExp(exercise)} · `)
	});

/** Starts an exercise from the level map. */
export async function startDrill(
	page: Page,
	level: number,
	exercise: string,
	word = 'Level'
): Promise<void> {
	await drillButton(page, level, exercise, word).click();
}

/** Opens the folded options under the level map. */
export async function openOptions(page: Page, label = 'Options'): Promise<void> {
	await page.locator('summary', { hasText: label }).click();
}

/** Installs a fake Web MIDI keyboard; press keys with `pressKeys`. */
export async function installFakeMidi(page: Page, deviceName = 'E2E Keyboard'): Promise<void> {
	await page.addInitScript((name) => {
		const input = { name, onmidimessage: null as ((event: unknown) => void) | null };
		const access = { inputs: new Map([[name, input]]), onstatechange: null };
		Object.defineProperty(navigator, 'requestMIDIAccess', {
			value: () => Promise.resolve(access)
		});
		Object.assign(window, {
			__midiSend: (data: number[]) =>
				input.onmidimessage?.({ data: new Uint8Array(data), timeStamp: performance.now() })
		});
	}, deviceName);
}

export async function pressKeys(page: Page, midis: number[]): Promise<void> {
	await page.evaluate((notes) => {
		const send = (window as unknown as { __midiSend: (data: number[]) => void }).__midiSend;
		for (const note of notes) {
			send([0x90, note, 90]);
			send([0x80, note, 0]);
		}
	}, midis);
}
