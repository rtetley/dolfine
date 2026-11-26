import type * as ToneModule from 'tone';
import { asset } from '$app/paths';

export type Tone = typeof ToneModule;

export interface Instruments {
	tone: Tone;
	piano: ToneModule.Sampler;
	clickHigh: ToneModule.Synth;
	clickLow: ToneModule.Synth;
}

/**
 * Salamander Grand Piano V3 by Alexander Holm (CC BY 3.0), velocity layer 8 of 16, one sample every
 * minor third. Served with the app at 128 kbps, cut to 6 s with a fade (no note here lasts longer).
 */
// `asset` takes a file from static/, not a folder: the folder is that of a known sample.
const pianoSamples = (): string => asset('samples/piano/C4.mp3').replace(/C4\.mp3$/, '');
/** Each note peaks near -8 dBFS; a dense voicing would clip without headroom. */
const PIANO_VOLUME_DB = -6;

export function salamanderUrls(): Record<string, string> {
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

export async function loadInstruments(
	audioContext: AudioContext,
	tone: Tone
): Promise<Instruments> {
	tone.setContext(audioContext);
	await tone.start();
	// A small room and a limiter for the piano only: the metronome stays dry, so its clicks are exact.
	const limiter = new tone.Limiter(-1).toDestination();
	const reverb = new tone.Reverb({ decay: 2.2, preDelay: 0.01, wet: 0.16 }).connect(limiter);
	const piano = new tone.Sampler({
		urls: salamanderUrls(),
		baseUrl: pianoSamples(),
		release: 1.2,
		volume: PIANO_VOLUME_DB
	}).connect(reverb);
	await reverb.ready;
	const result = {
		tone,
		piano,
		clickHigh: makeClick(tone, 'triangle'),
		clickLow: makeClick(tone, 'square')
	};
	await tone.loaded();
	return result;
}
