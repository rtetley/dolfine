export interface Guide {
	title: string;
	paragraphs: string[];
}

export const SIGHT_READING_GUIDES: Record<'intro' | 'dandelot' | 'technique' | 'modes', Guide> = {
	intro: {
		title: 'About this module',
		paragraphs: [
			'Every exercise here is new: generated from the level you choose, so it can never be learnt by heart. Read it as you would at an exam or a first rehearsal: look it over, then play it through without stopping.',
			'Levels run from 1 to 10 and are roughly mapped to ABRSM grades and French conservatoire cycles. The mapping is a guide to place yourself, not a certification.'
		]
	},
	dandelot: {
		title: 'Reading from reference notes',
		paragraphs: [
			'In the spirit of Dandelot, reading starts from a few landmarks: the clef’s own note (G on the treble clef, F on the bass clef) and middle C. Every other note is read by its distance from the nearest landmark, not decoded line by line.',
			'At the easier levels these reference notes are highlighted in the score. Find them first during the preview; the rest of the line hangs from them.'
		]
	},
	technique: {
		title: 'How to use the preview',
		paragraphs: [
			'Scan the key and time signature first, then the shape of the line: where it climbs, where it leaps, where the rhythm gets busy. Mark the tricky bars in your head.',
			'When you play, keep going. A wrong note is one note; stopping costs the bar. Let your eyes stay a beat ahead of your hands.'
		]
	},
	modes: {
		title: 'Performance and Practice',
		paragraphs: [
			'Performance mode is the real thing: a preview, a count-in, then the music runs at tempo and nothing waits for you. With a MIDI keyboard every note is scored.',
			'Practice mode takes the clock away. The score stays put, the metronome is optional, and nothing is assessed: use it to work through a key or a rhythm until it feels easy.'
		]
	}
};

export const RHYTHM_GUIDES: Record<'swing' | 'syllables' | 'polyrhythm' | 'modulation', Guide> = {
	swing: {
		title: 'Feeling swing',
		paragraphs: [
			'Written eighths change meaning with the feel. Straight, they split the beat evenly; swung, the first is longer and the second leans into the next beat. The swing ratio says how far: 2:1 is the classic triplet swing.',
			'Let the metronome click on 2 and 4, like a drummer’s hi-hat, and feel the long-short pairs settle between the clicks.'
		]
	},
	syllables: {
		title: 'Speaking the rhythm',
		paragraphs: [
			'Say or sing the syllables under the notes before you clap. Long notes open, short notes stay light, off-beats push forward. When the line sounds right in your voice, it will sound right on your instrument.'
		]
	},
	polyrhythm: {
		title: 'Practising a polyrhythm',
		paragraphs: [
			'Start slowly with one hand at a time against the shared downbeat. Then learn the composite rhythm, the single pattern both hands make together, and only then split it back into two parts.',
			'The circle shows the cycle: both parts start together at the top and meet again there every cycle.'
		]
	},
	modulation: {
		title: 'Surviving a metric modulation',
		paragraphs: [
			'A metric modulation keeps one note value constant while the pulse changes around it. Before the switch, feel the new pulse inside the old one; after it, let the old one go.'
		]
	}
};

export const THEORY_GUIDES: Record<'intro' | 'voicings' | 'voiceLeading', Guide> = {
	intro: {
		title: 'Harmonizing a scale',
		paragraphs: [
			'Stack thirds on every degree of a parent scale and you get seven modes and seven seventh chords. The major, melodic minor and harmonic minor scales together give the 21 modes most jazz harmony is built from.',
			'Name a mode by its degree and its parent: the Altered scale is the seventh mode of melodic minor, so B Altered lives in C melodic minor.'
		]
	},
	voicings: {
		title: 'Two voicings',
		paragraphs: [
			'Type A puts root and seventh in the left hand, third, fifth and ninth in the right (1 7 / 3 5 9). Type B puts root, third and seventh in the left, ninth and fifth in the right (1 3 7 / 9 5). Alternated from chord to chord they keep the guide tones moving smoothly.',
			'Six modes need an alternative: Phrygian and Dorian ♭2 become 7sus4(♭9), Locrian takes the 11th instead of the ♭9, Altered uses ♭13 and ♯9, and Ultralocrian takes no tension at all.'
		]
	},
	voiceLeading: {
		title: 'Tight voice leading',
		paragraphs: [
			'Only the bass follows the roots. Every other voice holds its note when the next chord shares it, and otherwise moves by a second at most. Keep the right hand at or below A5 and respect the low interval limits so nothing turns to mud.'
		]
	}
};

export const EAR_GUIDES: Record<'intro', Guide> = {
	intro: {
		title: 'Hearing what you know',
		paragraphs: [
			'Every question starts with a reference: the root for chords and voicings, a drone for modes, the tonic chord for progressions. Name what you hear relative to it.',
			'Replay as often as you need, arpeggiate when a chord is dense, and after each answer listen to your guess and the real thing back to back.'
		]
	}
};
