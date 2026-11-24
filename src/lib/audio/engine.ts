import * as Tone from 'tone';

const SALAMANDER_BASE = 'https://tonejs.github.io/audio/salamander/';

let piano: Tone.Sampler | null = null;
let clickHigh: Tone.Synth | null = null;
let clickLow: Tone.Synth | null = null;
let loading: Promise<void> | null = null;

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

const makeClick = (type: 'triangle' | 'square'): Tone.Synth =>
	new Tone.Synth({
		oscillator: { type },
		envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 },
		volume: -10
	}).toDestination();

export async function ensureAudio(): Promise<void> {
	await Tone.start();
	if (!loading) {
		piano = new Tone.Sampler({
			urls: salamanderUrls(),
			baseUrl: SALAMANDER_BASE,
			release: 1.2
		}).toDestination();
		clickHigh = makeClick('triangle');
		clickLow = makeClick('square');
		loading = Tone.loaded();
	}
	await loading;
}

export const now = (): number => Tone.now();

const toNote = (midi: number): string => Tone.Frequency(midi, 'midi').toNote();

export function playNotes(
	midis: readonly number[],
	durationSeconds = 1.6,
	at = Tone.now() + 0.05
): void {
	if (!piano || midis.length === 0) return;
	piano.triggerAttackRelease(midis.map(toNote), durationSeconds, at);
}

export function playArpeggio(
	midis: readonly number[],
	stepSeconds = 0.32,
	holdSeconds = 1.6
): number {
	const start = Tone.now() + 0.05;
	midis.forEach((midi, i) => playNotes([midi], holdSeconds, start + i * stepSeconds));
	return midis.length * stepSeconds + holdSeconds;
}

export interface ScheduledChord {
	midis: readonly number[];
	at: number;
	duration: number;
}

export function playSchedule(events: readonly ScheduledChord[], offset = Tone.now() + 0.1): void {
	events.forEach((event) => playNotes(event.midis, event.duration, offset + event.at));
}

export function click(accent: boolean, at: number, alternate = false): void {
	const synth = alternate ? clickLow : clickHigh;
	if (!synth) return;
	synth.triggerAttackRelease(accent ? 'G6' : alternate ? 'C6' : 'D6', 0.03, at, accent ? 1 : 0.6);
}

export function stopAll(): void {
	piano?.releaseAll();
}

export function scheduleUi(callback: () => void, at: number): void {
	Tone.getDraw().schedule(callback, at);
}

export function audioToPerformanceTime(audioTime: number): number {
	return performance.now() + (audioTime - Tone.now()) * 1000;
}
