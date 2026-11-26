import type { Instruments, Tone } from './instruments';

let context: AudioContext | null = null;
let loading: Promise<Instruments> | null = null;
let instruments: Instruments | null = null;

const loadTone = (): Promise<Tone> => import('tone');

// Building the instruments only happens once audio starts, so it loads with Tone, not the page.
const loadInstruments = async (audioContext: AudioContext): Promise<Instruments> =>
	(await import('./instruments')).loadInstruments(audioContext, await loadTone());

/** Downloads the audio library in the background, without starting any audio. */
export function preloadAudio(): void {
	const run = (): void => void loadTone();
	if ('requestIdleCallback' in globalThis) requestIdleCallback(run);
	else setTimeout(run, 1000);
}

export async function ensureAudio(): Promise<void> {
	// Browsers only let audio start during the click that asks for it, so the context is
	// created and resumed here, synchronously, before waiting for the library to download.
	context ??= new AudioContext();
	void context.resume();
	loading ??= loadInstruments(context);
	instruments = await loading;
}

export const now = (): number => instruments?.tone.now() ?? 0;

/** The context the metronome is scheduled on, once `ensureAudio` has run. */
export const audioContext = (): AudioContext | null => context;

/** Softer as a chord grows, as a pianist plays a dense voicing, so it stays clear of the limiter. */
export const chordVelocity = (count: number): number =>
	Math.min(0.85, 0.85 * Math.sqrt(3 / Math.max(count, 1)));

export function playNotes(
	midis: readonly number[],
	durationSeconds = 1.6,
	at = now() + 0.05
): void {
	if (!instruments || midis.length === 0) return;
	const { tone, piano } = instruments;
	const notes = midis.map((midi) => tone.Frequency(midi, 'midi').toNote());
	piano.triggerAttackRelease(notes, durationSeconds, at, chordVelocity(notes.length));
}

export function playArpeggio(
	midis: readonly number[],
	stepSeconds = 0.32,
	holdSeconds = 1.6
): number {
	const start = now() + 0.05;
	midis.forEach((midi, i) => playNotes([midi], holdSeconds, start + i * stepSeconds));
	return midis.length * stepSeconds + holdSeconds;
}

export interface ScheduledChord {
	midis: readonly number[];
	at: number;
	duration: number;
}

export function playSchedule(events: readonly ScheduledChord[], offset = now() + 0.1): void {
	events.forEach((event) => playNotes(event.midis, event.duration, offset + event.at));
}

export function click(accent: boolean, at: number, alternate = false): void {
	const synth = alternate ? instruments?.clickLow : instruments?.clickHigh;
	if (!synth) return;
	synth.triggerAttackRelease(accent ? 'G6' : alternate ? 'C6' : 'D6', 0.03, at, accent ? 1 : 0.6);
}

export function stopAll(): void {
	instruments?.piano.releaseAll();
}

export function scheduleUi(callback: () => void, at: number): void {
	instruments?.tone.getDraw().schedule(callback, at);
}

export function audioToPerformanceTime(audioTime: number): number {
	return performance.now() + (audioTime - now()) * 1000;
}
