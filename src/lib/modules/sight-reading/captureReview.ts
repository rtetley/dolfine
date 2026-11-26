import { type Letter, LETTERS } from '#lib/music/pitch.ts';
import { fromBase64Pcm, heardAt, type NoteLabel, type ReadingCapture, type Said } from './capture';
import { hearReading } from './hear';
import { scoreRun, type SpokenNote } from './spoken';

/** Replays saved readings with the current recognition and compares them with their labels. */

export const replayCapture = (capture: ReadingCapture): SpokenNote[] =>
	hearReading(
		{
			samples: fromBase64Pcm(capture.samples),
			sampleRate: capture.sampleRate,
			startTime: capture.recordingStartMs / 1000
		},
		0,
		capture,
		capture.profile
	);

export interface Tally {
	/** Names said and heard as that name. */
	namesRight: number;
	/** Names said and heard as another name. */
	namesWrong: number;
	/** Names said and not heard at all. */
	namesMissed: number;
	/** Silence or nonsense at a note (`notNames`), and how often the app took it for a name. */
	notNames: number;
	falseNames: number;
	/** How often it took it for the very name written there: a right note for nothing. */
	falseAsScore: number;
	confusions: Partial<Record<Letter, Partial<Record<Said, number>>>>;
}

export const emptyTally = (): Tally => ({
	namesRight: 0,
	namesWrong: 0,
	namesMissed: 0,
	falseNames: 0,
	falseAsScore: 0,
	notNames: 0,
	confusions: {}
});

const isLetter = (said: Said): said is Letter => (LETTERS as readonly string[]).includes(said);

/** Adds one reading to `tally`: what was said (labels) against what the app heard (replay). */
export function tallyReading(
	tally: Tally,
	capture: ReadingCapture,
	labels: readonly NoteLabel[],
	heard: readonly SpokenNote[] = replayCapture(capture)
): Tally {
	const summary = scoreRun(capture, { input: 'voice', notes: [...heard] });
	const byId = new Map(summary.notes.map((note) => [note.id, note]));
	for (const label of labels) {
		const note = byId.get(label.noteId);
		if (!note) continue;
		const app = heardAt(note, label.expected, heard);
		if (isLetter(label.said)) {
			if (app === label.said) tally.namesRight++;
			else if (app === 'nothing') tally.namesMissed++;
			else tally.namesWrong++;
			const row = (tally.confusions[label.said] ??= {});
			row[app] = (row[app] ?? 0) + 1;
		} else {
			tally.notNames++;
			if (app !== 'nothing') tally.falseNames++;
			if (app === label.expected) tally.falseAsScore++;
		}
	}
	return tally;
}

/** Labels for a reading that was not labelled: everything said as written. */
export const asWritten = (capture: ReadingCapture): NoteLabel[] =>
	capture.expected.map((note) => ({ noteId: note.id, expected: note.letter, said: note.letter }));
