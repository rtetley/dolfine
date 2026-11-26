import type * as ToneModule from 'tone';

type Tone = typeof ToneModule;

interface Instruments {
	tone: Tone;
	piano: ToneModule.Sampler;
	clickHigh: ToneModule.Synth;
	clickLow: ToneModule.Synth;
}

const SALAMANDER_BASE = 'https://tonejs.github.io/audio/salamander/';

let context: AudioContext | null = null;
let loading: Promise<Instruments> | null = null;
let instruments: Instruments | null = null;

const loadTone = (): Promise<Tone> => import('tone');

function salamanderUrls(): Record<string, string> {
	const urls: Record<string, string> = { A0: 'A0.mp3', C8: 'C8.mp3' };
	for (let octave = 1; octave <= 7; octave++) {
		urls[`C${octave}`] = `C${octave}.mp3`;
		urls[`D#${octave}`] = `Ds${octave}.mp3`;
		urls[`F#${octave}`] = `Fs${octave}.mp3`;
		urls[`A${octave}`] = `A${octave}.mp3`;
	}
	return urls;
}

const makeClick = (tone: Tone, type: 'triangle' | 'square'): ToneModule.Synth =>
	new tone.Synth({
		oscillator: { type },
		envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 },
		volume: -10
	}).toDestination();

async function loadInstruments(audioContext: AudioContext): Promise<Instruments> {
	const tone = await loadTone();
	tone.setContext(audioContext);
	await tone.start();
	const piano = new tone.Sampler({
		urls: salamanderUrls(),
		baseUrl: SALAMANDER_BASE,
		release: 1.2
	}).toDestination();
	const result = {
		tone,
		piano,
		clickHigh: makeClick(tone, 'triangle'),
		clickLow: makeClick(tone, 'square')
	};
	await tone.loaded();
	return result;
}

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

export function playNotes(
	midis: readonly number[],
	durationSeconds = 1.6,
	at = now() + 0.05
): void {
	if (!instruments || midis.length === 0) return;
	const { tone, piano } = instruments;
	const notes = midis.map((midi) => tone.Frequency(midi, 'midi').toNote());
	piano.triggerAttackRelease(notes, durationSeconds, at);
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
