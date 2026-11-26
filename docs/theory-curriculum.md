# Theory curriculum: the major scale, and a proposal for the minor scales

_Issue #41. The major-scale part is implemented; the melodic and harmonic minor parts are a proposal on the same plan, to review before building._

## The plan, for every parent scale

1. **Harmonize the scale.** A seventh chord on every degree, on one staff with names above and degrees below; each mode with its scale, characteristic degrees, and its chord in close position and drop 2 (lesson sections `harmonization` and `modes`).
2. **Associate chords and modes as colours.** Each mode gets the chord that says it best, voiced over two hands in type A (1 7 / 3 5 9) and type B (1 3 7 / 9 5), with a sentence on its sound and where it is heard (section `colours`, data in `src/lib/music/colours.ts`).
3. **Hear each colour beside its nearest neighbour.** Ear training brings the colours in one or two at a time; a colour that arrives alone is first heard against the one it is easiest to mistake it for (`COLOUR_SETS`).
4. **Complete the modes.** The colours the first lesson leaves out arrive in a short lesson of their own, each beside its neighbour.
5. **Name and write every mode in all twelve keys** by the end of the scale's levels (theory exercises `name-mode`, `write-mode`).

Where a mode's ninth is not usable (a ♭9 against the root), the voicing doubles the third or the seventh in its place; richer tensions wait for upper structures.

## The major scale (implemented)

| Theory level | Lesson                           | Colours                                                               |
| ------------ | -------------------------------- | --------------------------------------------------------------------- |
| 1            | Harmonising the major scale      | —                                                                     |
| 2            | Chords and modes: twelve colours | Δ9, 6/9 · -Δ9, -6/9 · -9 · ø7 · °7 · 9, 9sus4 · 9(♯5) · 7(♭9) · 7(♯9) |
| 3            | Four more colours                | -11 · 7sus4(♭9) · Δ9(♯11) · -7(♭13)                                   |

-Δ9 and -6/9 borrow the first mode of melodic minor, 7(♭9) the fifth mode of harmonic minor, °7 the whole step–half step scale, 9(♯5) the whole-tone scale and 7(♯9) the blues scale: each is introduced by its chord now and gets a full lesson later.

Ear training, chord colours drill, one step per level: Δ9/6/9 → -Δ9/-6/9 → all four → -9/ø7 → ø7/°7/-9 → 9/9sus4/9(♯5) → 7(♭9)/7(♯9)/9 → the twelve → the four new ones beside their neighbours → all sixteen.

## Proposal: melodic minor

Harmonization lesson as today (Level 4), then one colour per mode:

| Degree | Mode             | Colour          | First heard beside |
| ------ | ---------------- | --------------- | ------------------ |
| I      | Ionian ♭3        | -Δ9, -6/9       | (already known)    |
| II     | Dorian ♭2        | 13sus4(♭9)      | 7sus4(♭9)          |
| III    | Lydian augmented | Δ9(♯5)          | Δ9(♯11)            |
| IV     | Lydian dominant  | 9(♯11), 13(♯11) | 9                  |
| V      | Mixolydian ♭6    | 9(♭13)          | 9(♯5)              |
| VI     | Locrian ♮2       | ø9              | ø7                 |
| VII    | Altered          | 7alt            | 7(♯9)              |

- Lesson "The melodic minor's colours" (Level 5) with these seven, each with type A/B voicings and a usage note (Lydian dominant as the tritone substitute's colour; the altered dominant resolving a half step down to a minor or major tonic).
- Ear sets: 9(♯11)/9 → 9(♭13)/9(♯5) → ø9/ø7 → 7alt/7(♯9) → Δ9(♯5)/Δ9(♯11) → 13sus4(♭9)/7sus4(♭9) → all seven → with the sixteen.
- Exercises: name and write the seven modes in every key by Level 6, as for the major scale.

## Proposal: harmonic minor

Harmonization lesson as today (Level 8), then:

| Degree | Mode               | Colour    | First heard beside                             |
| ------ | ------------------ | --------- | ---------------------------------------------- |
| I      | Minor-major        | -Δ9       | -Δ9 of melodic minor (identical: point it out) |
| II     | Locrian ♮6         | ø7(13)    | ø7                                             |
| III    | Ionian ♯5          | Δ9(♯5)    | Δ9(♯5) of melodic minor                        |
| IV     | Dorian ♯4          | -9(♯11)   | -9                                             |
| V      | Phrygian dominant  | 7(♭9 ♭13) | 7(♭9)                                          |
| VI     | Lydian ♯2          | Δ7(♯9)    | Δ9(♯11)                                        |
| VII    | Altered diminished | °7        | (already known)                                |

- Its II and V have a ♭9: their voicings double the third or the seventh, as Locrian's ø7 does now.
- A short lesson on the diminished chord and its whole step–half step scale belongs here: four keys share one chord, and the scale's symmetry explains why.
- Ear sets: ø7(13)/ø7 → -9(♯11)/-9 → 7(♭9 ♭13)/7(♭9) → Δ7(♯9)/Δ9(♯11) → all → with every colour so far.

## Open questions

- Should the voicings lesson (types A and B and the others, now at Level 5) move before the colours, since the colour lessons already use types A and B?
- Are 7sus4(♭9) and 13sus4(♭9) different enough to be separate colours, or one colour with two voicings?
- Are the ear sets' sizes right for students at Levels 1–3 (two or three colours at a time), or should the first ones be repeated with a second voicing before moving on?
