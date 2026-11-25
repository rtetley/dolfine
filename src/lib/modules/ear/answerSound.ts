import { earChordById, voiceEarChord } from '#lib/music/earChords.ts';
import { type ModeId, modeSemitones } from '#lib/music/scales.ts';
import { defaultVoicing } from '#lib/music/voicings.ts';
import type { EarQuestion } from './questions';

export type AnswerSound =
	| { kind: 'interval'; notes: [number, number]; harmonic: boolean }
	| { kind: 'chord'; root: number; midis: number[] }
	| { kind: 'scale'; root: number; scale: number[] };

/** What a question sounds like. */
export function questionSound(question: EarQuestion): AnswerSound | null {
	switch (question.kind) {
		case 'intervals':
			return { kind: 'interval', notes: question.notes, harmonic: question.harmonic };
		case 'chords':
		case 'voicings':
			return { kind: 'chord', root: question.root, midis: question.midis };
		case 'modes':
			return { kind: 'scale', root: question.root, scale: question.scale };
		case 'progressions':
			return null;
	}
}

/**
 * What the question would have sounded like if the given answer were right: same first
 * note, root, voicing and register, so the only difference is the answer itself.
 */
export function answerSound(question: EarQuestion, answer: string): AnswerSound | null {
	switch (question.kind) {
		case 'intervals': {
			const semitones = Number(answer);
			if (!Number.isInteger(semitones)) return null;
			const [first, second] = question.notes;
			const direction = second < first ? -1 : 1;
			return {
				kind: 'interval',
				notes: [first, first + direction * semitones],
				harmonic: question.harmonic
			};
		}
		case 'chords': {
			const quality = earChordById(answer);
			return quality
				? {
						kind: 'chord',
						root: question.root,
						midis: voiceEarChord(question.root, quality, question.voicing)
					}
				: null;
		}
		case 'voicings': {
			if (question.ask !== 'type' || !question.chord || (answer !== 'A' && answer !== 'B'))
				return null;
			return {
				kind: 'chord',
				root: question.root,
				midis: defaultVoicing(question.chord, answer).midis
			};
		}
		case 'modes': {
			const semitones = modeSemitones(answer as ModeId);
			return {
				kind: 'scale',
				root: question.root,
				scale: [...semitones.map((s) => question.root + s), question.root + 12]
			};
		}
		case 'progressions':
			return null;
	}
}
