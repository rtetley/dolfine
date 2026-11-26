import {
	Accidental,
	Annotation,
	Beam,
	Dot,
	Formatter,
	type RenderContext,
	Renderer,
	Stave,
	StaveConnector,
	StaveNote,
	StaveTie,
	Tuplet,
	Voice
} from 'vexflow/bravura';
import { vexAccidental, vexKey } from '#lib/music/pitch.ts';
import {
	displayAccidentals,
	expandMeasure,
	measuresPerLine,
	type NoteStyle,
	type RenderableNote,
	type Score,
	type StaffClef,
	timeSignatureText
} from './model';

export interface NoteLayout {
	id: string;
	sourceId: string;
	x: number;
	system: number;
	part: number;
}

export interface SystemLayout {
	top: number;
	bottom: number;
}

export interface ScoreLayout {
	width: number;
	height: number;
	systems: SystemLayout[];
	notes: NoteLayout[];
}

export interface RenderOptions {
	width: number;
	preferredPerLine?: number;
	textAbove?: boolean;
}

// The vexflow/bravura entry registers its fonts without waiting for them; measuring
// glyphs before they load sizes every notehead with a fallback font.
const NOTATION_FONTS = ['30pt Bravura', '12pt Academico', '13pt "Dolfine Accidentals"'];

export const notationFontsReady: Promise<void> = Promise.all(
	NOTATION_FONTS.map((font) => document.fonts.load(font, '♭♯♮'))
).then(() => undefined);

const PART_HEIGHT = 96;
const SYSTEM_GAP = 36;
const TOP_PADDING = 34;
const CURSOR_OVERHANG = 10;
const SIDE_PADDING = 10;
const REST_KEYS: Record<StaffClef, string> = { treble: 'b/4', bass: 'd/3', percussion: 'b/4' };

function cssValue(element: HTMLElement, name: string, fallback: string): string {
	return getComputedStyle(element).getPropertyValue(name).trim() || fallback;
}

function styleColors(element: HTMLElement): Record<NoteStyle | 'ink', string> {
	const ink = cssValue(element, '--ink', '#222');
	return {
		ink,
		correct: cssValue(element, '--good', '#3e6b4a'),
		wrong: cssValue(element, '--bad', '#a23b3b'),
		missed: cssValue(element, '--bad', '#a23b3b'),
		early: cssValue(element, '--early', '#3f5f86'),
		late: cssValue(element, '--late', '#a8752a'),
		reference: cssValue(element, '--accent', '#8a3b2e'),
		current: cssValue(element, '--accent', '#8a3b2e')
	};
}

function buildNote(
	note: RenderableNote,
	clef: StaffClef,
	accidentals: (number | null)[] | undefined,
	textFont: string,
	heardColor: string
): StaveNote {
	const keys =
		note.rest || note.pitches.length === 0 ? [REST_KEYS[clef]] : note.pitches.map(vexKey);
	const staveNote = new StaveNote({
		keys,
		duration: note.duration.code,
		dots: note.duration.dots,
		type: note.rest ? 'r' : undefined,
		clef,
		autoStem: true
	});
	if (note.duration.dots > 0) Dot.buildAndAttach([staveNote], { all: true });
	accidentals?.forEach((accidental, index) => {
		if (accidental !== null && !note.rest)
			staveNote.addModifier(new Accidental(vexAccidental(accidental)), index);
	});
	if (note.above) {
		staveNote.addModifier(
			new Annotation(note.above).setFont(textFont, 13).setVerticalJustification('top'),
			0
		);
	}
	if (note.below) {
		staveNote.addModifier(
			new Annotation(note.below)
				.setFont(textFont, 12, 'normal', 'italic')
				.setVerticalJustification('bottom'),
			0
		);
	}
	if (note.heard) {
		const heard = new Annotation(note.heard)
			.setFont(textFont, 13, 'bold')
			.setVerticalJustification('bottom');
		heard.setStyle({ fillStyle: heardColor, strokeStyle: heardColor });
		staveNote.addModifier(heard, 0);
	}
	return staveNote;
}

interface PartState {
	pendingTie: StaveNote | null;
}

export function renderScore(
	container: HTMLElement,
	score: Score,
	options: RenderOptions
): ScoreLayout {
	container.replaceChildren();
	const colors = styleColors(container);
	const textFont = cssValue(container, '--serif', 'serif');
	const measureCount = Math.max(0, ...score.parts.map((part) => part.measures.length));
	const perLine = measuresPerLine(
		options.width - SIDE_PADDING * 2,
		Math.max(measureCount, 1),
		options.preferredPerLine
	);
	const lineCount = Math.max(1, Math.ceil(measureCount / perLine));
	const systemHeight = score.parts.length * PART_HEIGHT + SYSTEM_GAP;
	const height = TOP_PADDING + lineCount * systemHeight;

	const renderer = new Renderer(container as HTMLDivElement, Renderer.Backends.SVG);
	renderer.resize(options.width, height);
	const context: RenderContext = renderer.getContext();
	context.setFillStyle(colors.ink);
	context.setStrokeStyle(colors.ink);

	const layout: ScoreLayout = { width: options.width, height, systems: [], notes: [] };
	const partStates: PartState[] = score.parts.map(() => ({ pendingTie: null }));
	const keyWidth = (score.keyAccidentals?.size ?? 0) * 11;
	const timeGroups = score.meter
		? Beam.getDefaultBeamGroups(timeSignatureText(score.meter))
		: undefined;

	for (let line = 0; line < lineCount; line++) {
		const top = TOP_PADDING + line * systemHeight;
		const first = line * perLine;
		const last = Math.min(measureCount, first + perLine);
		const usable = options.width - SIDE_PADDING * 2;
		const headerWidth = 44 + keyWidth + (line === 0 && score.meter ? 30 : 0);
		const bodyWidth = (usable - headerWidth) / (last - first);
		let x = SIDE_PADDING;

		for (let m = first; m < last; m++) {
			const isFirst = m === first;
			const width = bodyWidth + (isFirst ? headerWidth : 0);
			const staves = score.parts.map((part, p) => {
				const stave = new Stave(x, top + p * PART_HEIGHT, width);
				if (isFirst) {
					stave.addClef(part.clef);
					if (score.keySignature && part.clef !== 'percussion')
						stave.addKeySignature(score.keySignature);
					if (line === 0 && score.meter) stave.addTimeSignature(timeSignatureText(score.meter));
				}
				return stave;
			});
			if (isFirst) {
				const [upper, lower] = [staves[0], staves.at(-1)];
				if (upper && lower) {
					layout.systems.push({
						top: upper.getTopLineTopY() - CURSOR_OVERHANG,
						bottom: lower.getBottomLineBottomY() + CURSOR_OVERHANG
					});
				}
			}
			const noteStart = Math.max(...staves.map((stave) => stave.getNoteStartX()));
			staves.forEach((stave) => stave.setNoteStartX(noteStart).setContext(context).draw());
			if (isFirst && staves.length > 1) {
				const [upper, lower] = staves as [Stave, Stave];
				new StaveConnector(upper, lower).setType('brace').setContext(context).draw();
				new StaveConnector(upper, lower).setType('singleLeft').setContext(context).draw();
			}
			if (staves.length > 1) {
				const [upper, lower] = staves as [Stave, Stave];
				new StaveConnector(upper, lower).setType('singleRight').setContext(context).draw();
			}

			const drawn = score.parts.map((part, p) => {
				const source = part.measures[m] ?? [];
				const accidentals = displayAccidentals(source, score.keyAccidentals);
				const expanded = expandMeasure(source);
				const notes = expanded.map((note) =>
					buildNote(
						note,
						part.clef,
						note.id === note.sourceId ? accidentals.get(note.id) : undefined,
						textFont,
						colors.wrong
					)
				);
				notes.forEach((staveNote, i) => {
					const style = expanded[i]?.style;
					const color = style ? colors[style] : colors.ink;
					const paint = { fillStyle: color, strokeStyle: color };
					staveNote.setStyle(paint);
					staveNote.setStemStyle(paint);
					staveNote.setFlagStyle(paint);
					staveNote.setLedgerLineStyle(paint);
					expanded[i]?.keyStyles?.forEach((key, k) => {
						if (key) staveNote.setKeyStyle(k, { fillStyle: colors[key], strokeStyle: colors[key] });
					});
				});
				const tuplets = tripletGroups(expanded).map((group) => group.map((i) => notes[i]));
				tuplets.forEach(
					(group) => new Tuplet(group, { numNotes: 3, notesOccupied: 2, ratioed: false })
				);
				const voice = new Voice(
					score.meter ? { numBeats: score.meter.beats, beatValue: score.meter.unit } : undefined
				);
				voice.setMode(Voice.Mode.SOFT);
				voice.addTickables(notes);
				const tripletNotes = new Set(tuplets.flat());
				const beams = Beam.generateBeams(
					notes.filter((n) => !tripletNotes.has(n)),
					timeGroups ? { groups: timeGroups } : undefined
				);
				const tupletBeams = tuplets
					.filter((group) => group.every((n) => !n.isRest()))
					.map((group) => new Beam(group));
				return {
					voice,
					notes,
					expanded,
					beams: [...beams, ...tupletBeams],
					stave: staves[p],
					part: p
				};
			});

			const formatter = new Formatter();
			drawn.forEach(({ voice }) => formatter.joinVoices([voice]));
			formatter.format(
				drawn.map(({ voice }) => voice),
				Math.max(40, x + width - noteStart - 14)
			);

			drawn.forEach(({ voice, stave, beams, notes, expanded, part }) => {
				voice.draw(context, stave);
				beams.forEach((beam) => beam.setContext(context).draw());
				notes.forEach((staveNote, i) => {
					const note = expanded[i];
					layout.notes.push({
						id: note.id,
						sourceId: note.sourceId,
						x: staveNote.getAbsoluteX(),
						system: line,
						part
					});
					drawTie(context, partStates[part], staveNote, note, isFirst && i === 0);
				});
			});
			x += width;
		}
	}
	return layout;
}

function drawTie(
	context: RenderContext,
	state: PartState,
	staveNote: StaveNote,
	note: RenderableNote,
	lineStart: boolean
): void {
	const indexes = staveNote.getKeys().map((_, i) => i);
	if (state.pendingTie && !note.rest) {
		const firstNote = lineStart ? null : state.pendingTie;
		if (lineStart) {
			new StaveTie({
				firstNote: state.pendingTie,
				lastNote: null,
				firstIndexes: indexes,
				lastIndexes: indexes
			})
				.setContext(context)
				.draw();
		}
		new StaveTie({ firstNote, lastNote: staveNote, firstIndexes: indexes, lastIndexes: indexes })
			.setContext(context)
			.draw();
	}
	state.pendingTie = note.tie && !note.rest ? staveNote : null;
}

function tripletGroups(notes: readonly RenderableNote[]): number[][] {
	const groups: number[][] = [];
	let current: number[] = [];
	notes.forEach((note, i) => {
		if (note.triplet && note.ticks === 4) {
			current.push(i);
			if (current.length === 3) {
				groups.push(current);
				current = [];
			}
		} else {
			current = [];
		}
	});
	return groups;
}
