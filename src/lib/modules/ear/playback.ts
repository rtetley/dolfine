import { ensureAudio, now, playNotes } from '#lib/audio/engine.ts';
import type { AnswerSound } from './answerSound';

const GAP = 0.6;

/** Schedules a sound from `start` (audio time) and returns how long it lasts, in seconds. */
function schedule(sound: AnswerSound, start: number): number {
	switch (sound.kind) {
		case 'interval': {
			if (sound.harmonic) {
				playNotes(sound.notes, 1.6, start);
				return 1.6;
			}
			sound.notes.forEach((note, i) => playNotes([note], 1.1, start + i * 0.8));
			return 1.9;
		}
		case 'chord':
			playNotes([sound.root], 0.9, start);
			playNotes(sound.midis, 2, start + 1.1);
			return 3.1;
		case 'scale': {
			const length = (sound.scale.length + 2) * 0.45;
			playNotes([sound.root - 12], length, start);
			sound.scale.forEach((note, i) => playNotes([note], 0.6, start + 0.9 + i * 0.42));
			return 0.9 + sound.scale.length * 0.42 + 0.6;
		}
	}
}

/** Plays the sounds one after another, with a short gap between them. */
export async function playSounds(...sounds: (AnswerSound | null)[]): Promise<void> {
	await ensureAudio();
	let at = now() + 0.05;
	for (const sound of sounds) {
		if (sound) at += schedule(sound, at) + GAP;
	}
}
