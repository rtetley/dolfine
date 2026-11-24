# D.O.lfine — Product Requirements Document

_Version: v1 (MVP) · Last updated: 2026-11-24_

---

## Table of contents

1. [Overview](#1-overview)
2. [Audience and personas](#2-audience-and-personas)
3. [Goals, non-goals and success metrics](#3-goals-non-goals-and-success-metrics)
4. [Platform](#4-platform)
5. [Module: Sight Reading](#5-module-sight-reading)
6. [Module: Inner Rhythm](#6-module-inner-rhythm)
7. [Module: Music Theory](#7-module-music-theory)
8. [Module: Ear Training](#8-module-ear-training)
9. [Experience and visual direction](#9-experience-and-visual-direction)
10. [Scope phasing](#10-scope-phasing)
11. [Open questions](#11-open-questions)

---

## 1. Overview

**D.O.lfine** is a web platform for training the core skills of serious musicians. It has four modules: **sight reading**, **inner rhythm**, **music theory** and **ear training**.

All four modules ship in v1. v1 is an MVP to test the concept: every setting is selectable, and nothing adapts to the user yet. Progress tracking, accounts, level placement and suggestions come in the next scope.

All modules share one platform shell: a dashboard for choosing what to practise, a shared exercise engine, a shared 1–10 level scale, and one visual identity. Each module plugs into that shell.

| Module        | What it trains                                                                                            | v1 mode                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Sight reading | Reading notation at tempo, Dandelot-style                                                                 | Performance (timed, MIDI-scored) and Practice (untimed, unassessed) |
| Inner rhythm  | Jazz rhythm reading and polyrhythm, after Freddy Roux's _Rhythm'n Jazz_                                   | Practice only (metronome, no scoring)                               |
| Music theory  | Jazz harmony: the major, melodic minor and harmonic minor scales, their modes, voicings and voice leading | Auto-checked exercises                                              |
| Ear training  | Hearing what music theory teaches: intervals, chords, voicings, modes, progressions                       | Auto-checked exercises                                              |

---

## 2. Audience and personas

The core audience is conservatory students. The product adapts from hobbyists up to advanced students. Complete beginners who cannot read notation yet are out of scope.

| Persona                 | Who they are                                             | What they need                                                                                           |
| ----------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Conservatory student    | Studies an instrument at a conservatory or music college | Daily fluency at a high level, varied material that can't be memorised, harder keys, rhythms and harmony |
| Exam / audition prepper | Preparing for a graded exam or a conservatory audition   | Exam-like conditions: preview time, then one continuous run at tempo                                     |
| Hobbyist / returner     | Reads already, but slowly or rustily                     | A gentle way back to fluency                                                                             |

Instruments for sight reading at launch: treble-clef melodic instruments, bass-clef melodic instruments, and piano on the grand staff. Music theory and ear training are keyboard-centred (on-screen piano or MIDI).

---

## 3. Goals, non-goals and success metrics

### Goals

- Make daily practice frictionless: open the app, pick a module and a level, start within seconds.
- Recreate real sight-reading pressure: a brief preview, then continuous reading at tempo with no stopping.
- Give the user explicit control of every setting, the level included.
- Lay a platform foundation (settings storage, dashboard, design system, shared engine) that every module reuses.

### Non-goals for v1

- Teaching notation from zero.
- Accounts, progress tracking, practice logs, level placement and suggestions (next scope).
- Teacher accounts, classes or assignments.
- Audio or microphone input of any kind.
- Curated repertoire and user-imported scores.
- Paid plans: v1 is free; a subscription comes later.

### Success metrics

| Metric                                       | What it shows                       | When                |
| -------------------------------------------- | ----------------------------------- | ------------------- |
| Weekly active users and sessions per week    | Practice is becoming a habit        | v1                  |
| Sessions per module and mode                 | Which modules and modes people use  | v1                  |
| Accuracy at a fixed level, over 4 weeks      | Reading is getting more accurate    | Once tracking ships |
| Tempo reached at a fixed level, over 4 weeks | Reading is getting faster           | Once tracking ships |
| Level-ups per active user per month          | Users are moving to harder material | Once tracking ships |

In v1, metrics come from anonymous product analytics, since user-facing tracking comes later. Targets are set after beta.

---

## 4. Platform

### 4.1 Dashboard

The dashboard is the platform's home page. In v1 it does two things: it lists the modules, and it offers a **Continue** button that resumes the last exercise.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ D.O.lfine        Dashboard · Sight reading · Inner rhythm · Music theory · Ear training │
└──────────────────────────────────────────────────────────────────────────┘

CONTINUE
┌──────────────────────────────────────────────────────────────────────────┐
│ Continue                                                                 │
│ Sight reading · Level 5 · bass clef · F major · 80 bpm · Performance     │
│ Resume with your last settings                                           │
└──────────────────────────────────────────────────────────────────────────┘

MODULES
┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Sight reading  │ │ Inner rhythm   │ │ Ear training   │ │ Music theory   │
│ Dandelot-style │ │ Jazz rhythm    │ │ Hear jazz      │ │ Jazz harmony   │
│ reading        │ │ reading        │ │ harmony        │ │                │
│ Performance ·  │ │ Reading ·      │ │ Chords · Modes │ │ Three parent   │
│ Practice       │ │ Polyrhythm     │ │ · more         │ │ scales         │
│ Open setup     │ │ Open setup     │ │ Open setup     │ │ Open setup     │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
```

_Wireframe, desktop. All values are placeholders._

**Continue**

- One button that reopens the last module with all of its settings.
- The last settings are stored in the browser; there are no accounts in v1.
- Hidden on a first visit, when there is nothing to continue.

**Modules**

- One entry per module: sight reading, inner rhythm, music theory and ear training.
- Each entry shows the module's name, a one-line description and its sub-modules or modes, and opens the module's setup. All settings, the level included, are chosen there.
- Modules added in later versions appear quietly as "coming later" until they ship.

**Behaviour**

- First visit: a short welcome text with a drop cap, then the module entries.
- Same editorial look as the rest of the platform: calm typography, thin rules, no badges or cartoon gamification.

**Next scope: tracking.** These join the dashboard in the next scope, together with accounts that sync across devices:

- **Progress:** current level per module and sub-module with its exam equivalent, accuracy and tempo trends from scored sessions, level history.
- **Practice log:** a calendar of practice days, streaks, sessions and minutes per week, and a list of recent sessions that reopen results or replay an exercise by seed.
- **Suggested next:** one suggestion drawn from history, with a line saying why.
- **Level placement:** a way for a new user to find their starting level.

### 4.2 Accounts and storage

- No accounts in v1. Everyone uses the app as a guest, with no sign-up.
- Settings, presets and the Continue state are saved in the browser.
- Accounts with cross-device sync come with tracking in the next scope.

### 4.3 Shared engine

| Shared component                                                                      | Used by                                   |
| ------------------------------------------------------------------------------------- | ----------------------------------------- |
| Score engraving and rendering (staff, grand staff, percussion staff)                  | Sight reading, inner rhythm, music theory |
| Exercise generator core: seeds, parameters, level bundles                             | All modules                               |
| Metronome: count-in, subdivisions, accents, random mute                               | Sight reading, inner rhythm               |
| Harmony engine: chords, modes, voicings, progression generator                        | Music theory, ear training                |
| Input: Web MIDI and on-screen piano                                                   | Sight reading, music theory, ear training |
| Naming settings: note names (C D E / Do Ré Mi), chord symbol style, French mode names | All modules                               |
| Explanatory texts with drop caps                                                      | All modules                               |

Every exercise has a seed, so it can be replayed or shared.

### 4.4 Levels

All modules use a **1–10 level scale**. A level is a named bundle of explicit settings; every setting in it can be overridden in the module's setup, and users can save their own presets. The app never changes settings on its own in v1.

Two mappings are used, so students can place themselves. Both are drafts, to be reviewed by conservatory teachers (future scope).

**Classical mapping** (sight reading, inner rhythm):

| Level | ABRSM (approx.) | French system (approx.)                             |
| ----- | --------------- | --------------------------------------------------- |
| 1     | Grade 3         | Start of cycle 2                                    |
| 2     | Grade 4         | Cycle 2                                             |
| 3     | Grade 5         | End of cycle 2 (BEM)                                |
| 4     | Grade 6         | Start of cycle 3                                    |
| 5     | Grade 7         | Cycle 3                                             |
| 6     | Grade 8         | End of cycle 3 (CEM)                                |
| 7     | ARSM            | DEM / CPES                                          |
| 8     | DipABRSM        | Entrance to higher education (CNSM, Pôle supérieur) |
| 9     | LRSM            | Higher education (DNSPM)                            |
| 10    | FRSM            | Professional / concert level                        |

**Jazz mapping** (music theory, ear training):

| Level | ABRSM jazz (approx.)   | French jazz departments (approx.)               |
| ----- | ---------------------- | ----------------------------------------------- |
| 1–2   | Jazz Grades 1–2        | Cycle 1                                         |
| 3–4   | Jazz Grades 3–4        | Cycle 2                                         |
| 5     | Jazz Grade 5           | End of cycle 2                                  |
| 6–7   | Beyond the jazz grades | Cycle 3 (CEM)                                   |
| 8     | Beyond the jazz grades | DEM jazz                                        |
| 9–10  | Beyond the jazz grades | Higher education in jazz (CNSM, Pôle supérieur) |

ABRSM jazz grades stop at Grade 5, so the upper jazz levels map only to the French system.

### 4.5 Platform and browser support

- Web, desktop first. A laptop sits beside or on the instrument; a MIDI keyboard connects over USB.
- MIDI uses the Web MIDI API: Chrome, Edge and Firefox. Safari has no Web MIDI, so Safari users see a warning that MIDI features need another browser; everything else still works.

---

## 5. Module: Sight Reading

The sight-reading module gives conservatory-level students an unlimited supply of fresh, graded exercises, following the Dandelot approach.

### 5.1 Exercise generation

The generator builds a new, musically plausible exercise each time from a set of parameters:

| Parameter           | Examples                                                                 |
| ------------------- | ------------------------------------------------------------------------ |
| Instrument / clef   | Treble, bass, grand staff                                                |
| Key signature       | C major up to 7 sharps or flats, major and minor                         |
| Time signature      | 2/4, 3/4, 4/4, 6/8, then irregular meters at higher levels               |
| Length              | 4, 8 or 16 bars                                                          |
| Range               | Staff only, then ledger lines, then the full instrument range            |
| Rhythmic vocabulary | Whole notes down to sixteenths, dots, ties, triplets, syncopation, rests |
| Melodic motion      | Steps only, then leaps up to a set interval                              |
| Accidentals         | None, then occasional, then chromatic                                    |
| Piano texture       | Hands separately, hands together, then chords and two voices             |
| Markings            | Dynamics, articulation, tempo changes at higher levels                   |

- Output reads like music, with phrases, cadences and idiomatic shapes, not random notes.
- Notation is engraved to a high standard: correct beaming, spacing and accidental spelling.

### 5.2 Dandelot approach

The module follows the approach of Georges Dandelot's _Manuel pratique_, the French conservatoire standard for reading, especially at the easier levels (1–3).

- **Reference notes:** reading is anchored on a few landmark notes, such as each clef's own note (G for treble, F for bass) and middle C. Other notes are read by their distance from the nearest landmark.
- **Gradual range:** each early level adds notes outward from the reference notes before ledger lines come in.
- **Note-reading drills:** at the easier levels, sequences of notes in even values against the metronome, read by name (Do Ré Mi or C D E) before rhythm is added. Self-read in v1; voice note-naming comes later.
- **Explanatory texts** introduce the reference notes. An optional overlay highlights reference notes in the score at early levels and fades out as the user moves up.

### 5.3 Difficulty

- Levels 1–10 on the classical mapping (§4.4). Level 1 starts above complete beginner.
- Each level is a named bundle of generator parameters and sets the timing tolerance, which tightens as the level rises.
- An advanced panel overrides any single parameter, such as "level 6, but in F# major".
- Users can save custom settings as a personal preset.

### 5.4 Modes and session flow

**Performance mode** recreates real sight reading under time pressure.

1. **Setup.** Pick a clef or instrument and a level or preset, set the tempo, and choose the reading aids.
2. **Preview.** The full exercise is shown with a short countdown before playing starts, as in an exam. The user can skip ahead.
3. **Count-in.** One bar of metronome clicks.
4. **Read.** The music runs at tempo and the score scrolls or turns pages on its own. Nothing stops or waits.
5. **Results.** Scored with MIDI. Without MIDI, the run still happens but ends on a simple "done, next exercise" screen.

**Practice mode** is the self-read mode. The score stays on screen with no cursor, no countdown and no time limit. The user works through it at their own pace, with an optional metronome. Nothing is assessed.

**Reading aids** in Performance mode, set per session, with defaults that thin out at higher levels:

- **Metronome:** on, off, or random mute. In random mute, clicks drop out for random bars and the user keeps the pulse alone. This leads into the inner rhythm module.
- **Cursor:** on or off. With the cursor off, the user tracks their own place, as in a real exam.

### 5.5 Input

- **MIDI keyboard** via Web MIDI. Every note is captured with pitch and timing.
- **No device.** Performance mode runs unscored; Practice mode works as normal.

### 5.6 Feedback after a MIDI run

- A note-by-note overlay marks each note correct, wrong pitch, missed or extra.
- Timing per note: early, on time or late, judged against a tolerance window that tightens as the level rises.
- Summary scores: pitch accuracy %, rhythm accuracy %, tempo played.
- One-tap actions: retry the same exercise, a new one at this level, or level up.
- Results are shown after the run and not kept in v1.

### 5.7 Explanatory text

Short, well-written texts sit beside the exercises, set as editorial prose opening with a drop cap. They assume the user already reads music.

- **Level introductions:** what the level trains, its rough ABRSM and French equivalents, the new elements it brings in.
- **Reading technique:** what to scan in the preview (key, meter, patterns, tricky bars), keeping going after a mistake, reading ahead.
- **Concept notes:** one per new element (a new meter, hemiola, extended ledger lines), linked from the exercise where it first appears.
- **Results commentary:** one or two plain sentences turning the scores into advice.
- **Mode guides:** what Performance and Practice mode each train, and when to use which.

---

## 6. Module: Inner Rhythm

The inner rhythm module trains a steady inner pulse and fluent rhythm reading. It is **jazz-only** in v1 and runs in **Practice mode only**: the app presents the rhythm and keeps time, and the user performs it. Nothing is captured or scored.

### 6.1 Sub-modules

- **Rhythm reading:** reading and performing notated rhythms, straight or swung, following the pedagogy and progression of Freddy Roux's _Rhythm'n Jazz_ (Billaudot, 4 volumes). The app generates its own exercises and does not reproduce the book's content.
- **Polyrhythm:** holding two pulses at once, and moving between pulses through metric modulation.

Both sub-modules have their own level ladders on the shared 1–10 scale with the classical mapping.

### 6.2 Rhythm reading

**What an exercise contains**

- A single-line rhythm on a percussion staff, 4 to 16 bars long.
- Optional rhythm syllables from Freddy Roux's system, printed under the notes, to be spoken or sung.
- A feel setting, straight or swung, shown above the first bar as jazz charts do.

**Generator parameters**

| Parameter        | Examples                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| Meter            | 4/4, 3/4, 2/2, then 6/8, 12/8 and odd meters at higher levels          |
| Note values      | Quarters and eighths, then sixteenths, dotted values and triplets      |
| Rests and ties   | Simple rests, then ties across the beat and the bar line               |
| Syncopation      | On-beat only, then off-beat eighths, anticipations and pushes          |
| Feel             | Straight or swing, with a swing ratio from light to hard (triplet 2:1) |
| Syllables        | Off, on, or fading out over the exercise                               |
| Length and tempo | 4, 8 or 16 bars; tempo range set by level                              |

**Swing vs straight**

- The same notation can be read straight or swung, so the user learns that written eighths change meaning with the feel.
- The metronome can click on 2 and 4 in swing, like a jazz drummer's hi-hat.
- Levels bring swing in gradually: straight first, then swing at medium tempi, then fast and slow swing.

### 6.3 Polyrhythm

**Ratios**

- Two parts on a two-line rhythm staff, one line per hand, with an optional **circular view**: each part's beats are points on one circle, and a hand sweeps round in time.
- Ratio ladder: 3:2 and 2:3, then 4:3 and 3:4, then 5:4, 5:3, 5:2 and beyond at the top levels.
- An optional composite line shows how the parts interlock, and fades away at higher levels.
- The metronome can sound either part, both parts with two sounds, or just the shared downbeat.

**Metric modulation**

- The pulse changes mid-exercise through an equation marking, e.g. "triplet eighth = new eighth" or "dotted quarter = new quarter".
- The user holds the new tempo; the metronome follows the change or drops out at the switch.
- Levels move from simple related changes to chains of changes and changes into odd meters.

### 6.4 Session flow (Practice mode)

1. **Setup.** Choose every setting explicitly: sub-module, level or preset, feel, tempo, length and metronome.
2. **Read.** The exercise stays on screen with no time limit. The user speaks or sings the syllables, claps or taps, or plays hands-separately on a lap or desk. If they need help, a **Listen** button plays the rhythm with the chosen feel.
3. **Repeat or move on.** New exercise at this level, same exercise again, or level up.

**Metronome**, the core tool of the module:

- On, off, or random mute.
- Subdivision clicks (beats, eighths, triplets) and accent patterns, including 2 and 4 for swing.
- Separate sounds for each part in polyrhythm.
- A one-bar count-in before each start.

**Input:** none in v1.

### 6.5 Explanatory text and visuals

- **Guides:** how to feel swing, how to use syllables, how to practise a polyrhythm (slowly, one hand at a time, then the composite), how to survive a metric modulation.
- **Concept notes:** swing ratio, anticipation, hemiola, composite rhythm, metric modulation.
- **Level introductions** for each sub-module.
- **Notation:** clean percussion-staff engraving; syllables in the text serif, italic, under the notes; polyrhythm parts told apart by staff position and stem direction, not colour.
- **Metronome display:** a calm visual pulse in the page margin, in the accent colour. Muted bars show as an empty pulse.

---

## 7. Module: Music Theory

The music theory module teaches jazz harmony at the keyboard. Exercises are generated, auto-checked, and answered on an on-screen piano, a MIDI keyboard, or by naming. Nothing is stored between sessions in v1.

### 7.1 Sub-modules

Three sub-modules, one per parent scale. Each harmonizes its scale: seven modes, and a seventh chord on each degree.

| Degree | Major             | Melodic minor               | Harmonic minor                 |
| ------ | ----------------- | --------------------------- | ------------------------------ |
| I      | Ionian · CΔ7      | Melodic minor · C-Δ7        | Harmonic minor · C-Δ7          |
| II     | Dorian · D-7      | Dorian ♭2 · D7sus4(♭9)      | Locrian ♮6 · Dø7               |
| III    | Phrygian · E-7    | Lydian augmented · E♭Δ7(♯5) | Ionian ♯5 · E♭Δ7(♯5)           |
| IV     | Lydian · FΔ7(♯11) | Lydian dominant · F7(♯11)   | Dorian ♯4 · F-7(♯11)           |
| V      | Mixolydian · G7   | Mixolydian ♭6 · G7(♭13)     | Phrygian dominant · G7(♭9 ♭13) |
| VI     | Aeolian · A-7     | Locrian ♮2 · Aø7            | Lydian ♯2 · A♭Δ7(♯9)           |
| VII    | Locrian · Bø7     | Altered · B7alt             | Ultralocrian · B°7             |

Shown with C as the parent; exercises use every key the level allows.

### 7.2 Voicings

Two typical jazz piano voicings, built on the chord of each degree:

| Voicing            | Left hand (lower staff) | Right hand (upper staff) |
| ------------------ | ----------------------- | ------------------------ |
| Type A · 1 7 3 5 9 | Root, 7th               | 3rd, 5th, 9th            |
| Type B · 1 3 7 9 5 | Root, 3rd, 7th          | 9th, 5th                 |

- Used together, usually alternating from chord to chord, they let the guide tones (3rd and 7th) move smoothly through a progression.
- The 5th and 9th take the form the mode provides (e.g. ♭5 on a half-diminished chord).
- Everything is written on a grand staff in arranger's-score fashion: left hand on the lower staff, right hand on the upper staff, chord symbols above. Voices, stems, ledger lines and accidental spelling follow standard engraving conventions.

**Alternative voicings for affected modes.** Six of the 21 modes need an alternative; the other 15 use types A and B as they are. Notes run low to high in each hand; examples use C as the parent.

| Modes                                               | Problem                                                   | Rule                                                     | Type A′ (LH / RH) | Type B′ (LH / RH) | Example (A′ · B′)              |
| --------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------- | ----------------- | ----------------- | ------------------------------ |
| Phrygian (III major), Dorian ♭2 (II melodic minor)  | ♭9 a semitone above the root, clashing with the minor 3rd | Sus: the 4th replaces the 3rd; the chord reads 7sus4(♭9) | 1 ♭7 / 4 5 ♭9     | 1 4 ♭7 / ♭9 5     | E: E D / A B F · E A D / F B   |
| Locrian (VII major), Locrian ♮6 (II harmonic minor) | ♭9 a semitone above the root                              | The 11th replaces the 9th                                | 1 ♭7 / ♭3 ♭5 11   | 1 ♭3 ♭7 / ♭5 11   | B: B A / D F E · B D A / F E   |
| Altered (VII melodic minor)                         | No natural 5th or 9th                                     | ♭13 replaces the 5th, ♯9 replaces the 9th                | 1 ♭7 / 3 ♭13 ♯9   | 1 3 ♭7 / ♯9 ♭13   | B: B A / D♯ G D · B D♯ A / D G |
| Ultralocrian (VII harmonic minor)                   | Every available tension is a semitone above a chord tone  | No tension: the root, an octave up, replaces the 9th     | 1 𝄫7 / ♭3 ♭5 1    | 1 ♭3 𝄫7 / 1 ♭5    | B: B A♭ / D F B · B D A♭ / B F |

- In the Locrian B′ voicing, the right hand plays ♭5 below the 11th, so they sit a major 7th apart rather than a semitone.
- Kept on purpose: Phrygian dominant keeps its ♭9 (a tension on a dominant chord, not an avoid note), and Lydian ♯2 keeps its ♯9 as the mode's colour note.

### 7.3 Ranges

**Low interval limits.** No interval may sit lower than the standard arranging limits (middle C = C4). The checker applies them between every pair of adjacent notes in a voicing.

| Interval    | Lowest position |
| ----------- | --------------- |
| Minor 2nd   | E3–F3           |
| Major 2nd   | E♭3–F3          |
| Minor 3rd   | C3–E♭3          |
| Major 3rd   | B♭2–D3          |
| Perfect 4th | B♭2–E♭3         |
| Tritone     | B2–F3           |
| Perfect 5th | B♭1–F2          |
| Minor 6th   | F2–D♭3          |
| Major 6th   | F2–D3           |
| Minor 7th   | F2–E♭3          |
| Major 7th   | F2–E3           |
| Minor 9th   | E2–F3           |
| Major 9th   | E♭2–F3          |

In practice, a type A root can go down to F2 (1–♭7 is a 7th), while a type B root stays at B♭2 or above (1–3 is a 3rd).

**Hand limits.**

- **Right hand:** top note no higher than A5 (first ledger line above the treble staff); bottom note no lower than G3.
- **Left hand:** lowest root E2; in practice the low interval limits keep it higher.
- The hands never cross: the right hand's lowest note stays above the left hand's highest.

### 7.4 Exercises

Every exercise type exists in all three sub-modules; levels decide how hard each one gets.

| Exercise            | The user is given                                   | The user answers                                            | Answer input                                            |
| ------------------- | --------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| Name the mode       | A scale of notes                                    | The mode name, its degree, and its parent scale             | Multiple choice at easy levels, then naming it outright |
| Write the mode      | A mode name and a starting note                     | The scale's notes, then its parent scale                    | On-screen piano or MIDI, then naming                    |
| Mode in context     | A chord inside a progression                        | The mode that fits that chord in that context               | Multiple choice, then naming                            |
| Name the chord      | A degree of a parent scale, or a chord on the staff | The chord symbol                                            | Multiple choice, then naming                            |
| Build the chord     | A chord symbol or a degree                          | The chord's notes                                           | On-screen piano or MIDI                                 |
| Voice the chord     | A chord symbol and a voicing type (A or B)          | The voicing across both hands                               | On-screen piano or MIDI                                 |
| Voice-leading sheet | A chord grid                                        | A voicing for every chord, connected by tight voice leading | On-screen piano or MIDI, chord by chord                 |

In "Mode in context", the same chord symbol can call for different modes: a G7 resolving to C major suggests Mixolydian, while one resolving to C minor suggests Phrygian dominant or Altered.

**Chord grids for voice-leading sheets**

- **Generated progressions** from the chosen scale's harmonization: II–V–I in major and minor, turnarounds, modal vamps.
- **Standard-like forms** with typical changes: blues, rhythm changes, 32-bar AABA.
- The sheet is written onto the grand staff as the user goes, one chord at a time, like a real arranger's sketch.

### 7.5 Checking, feedback and audio

Every answer is checked as soon as it is submitted. The app shows what was right and wrong, then the correct answer.

**Voice-leading sheets are checked by rules**, not against one model answer. Any sheet that follows the rules is accepted:

1. Each chord uses the requested voicing type, or its conventional alternative where there is an avoid note, with the right chord tones and tensions for its mode.
2. Common tones between chords are held.
3. Every other voice moves by step, a second at most. Only the bass follows the root motion of the grid.
4. Voices stay within the conventional ranges, including the low interval limits.

The rules are equally strict at every level; leaps in the upper voices are never accepted. When a rule is broken, the app marks the chord and voice on the score and names the rule in one sentence.

**Audio**

- **Hear the answer:** after checking, play the user's version and the correct one.
- **Play the progression:** play the full voice-leading sheet at a chosen tempo, optionally with a bass line.

### 7.6 Levels

Jazz mapping (§4.4). A level bundles: sub-module, keys allowed, which modes appear, answer format (multiple choice or naming), voicing types, grid type and length, playback tempo.

### 7.7 Naming conventions and explanatory text

- **Note names:** C D E or Do Ré Mi, switchable.
- **Chord symbols:** jazz symbols with a style setting (CΔ7 or Cmaj7, D-7 or Dm7).
- **Modes:** by degree and name, e.g. "VII of melodic minor · Altered (Super Locrian)".
- **French terminology:** option to show French mode names (dorien, lydien, altéré…). Full internationalization comes later.

Explanatory texts (with drop caps): how a scale is harmonized, a short portrait of each mode and its chord, a guide to the two voicings and their alternatives, and the voice-leading rules with examples.

---

## 8. Module: Ear Training

The ear training module trains the user to hear what the music theory module teaches. It feeds from music theory and shares its engine:

- The same chord, mode and voicing definitions, including types A/B and their alternatives.
- The same progression generator: II–V–I, turnarounds, modal vamps, blues, rhythm changes, AABA.
- The same naming settings.
- After a wrong answer, a link to the matching concept note in the theory module.

### 8.1 Sub-modules

Organised by exercise type, each with its own level ladder on the jazz mapping.

| Sub-module   | The app plays                                   | The user identifies                                               |
| ------------ | ----------------------------------------------- | ----------------------------------------------------------------- |
| Intervals    | Two notes, melodic (up or down) or harmonic     | The interval                                                      |
| Chords       | A reference root, then a chord                  | The chord quality and extensions                                  |
| Voicings     | A reference root, then a voiced chord           | The top note, the bass note, or the voicing type                  |
| Modes        | A drone on the root, then a scale or modal vamp | The mode and its parent scale                                     |
| Progressions | The tonic chord, then a progression             | The degrees at lower levels, the full chord grid at higher levels |

Intervals are a warm-up at low levels; the other four carry the module's core.

### 8.2 Chord and voicing ladder

| Levels | Chords heard                                                               | Voicings used                         |
| ------ | -------------------------------------------------------------------------- | ------------------------------------- |
| 1–2    | Δ7, -7, 7, ø7, then °7                                                     | Types A and B                         |
| 3–4    | + -Δ7, 7sus4, Δ7(♯5); 9th chords                                           | + rootless A/B (Bill Evans style)     |
| 5–6    | + 11ths and 13ths: Δ7(♯11), -11, 13, 7(♯11), 7(♭9), 7(♭13)                 | + drop 2 and drop 2-4                 |
| 7–8    | + every chord of the 21 modes: 7alt, 7(♭9 ♭13), 7sus4(♭9), Δ7(♯9), -7(♯11) | + quartal and So What voicings        |
| 9–10   | + upper-structure chords, slash chords, polychords                         | + upper-structure triads and clusters |

Draft ladder, to be reviewed with the level mapping. In v1, every chord set and voicing set can be selected freely in setup. Once tracking ships, the voicing set will follow the user's current music theory level.

### 8.3 Reference, answers and checking

- **Reference:** always given before the question: the root for chords and voicings, a drone for modes, the tonic chord for progressions.
- **Answers:**
  - **Choose from options:** multiple choice at easy levels.
  - **Name it outright:** type or pick the chord symbol, mode or degrees at higher levels.
  - **Play it back:** reproduce the chord on the on-screen piano or MIDI. Pitch classes are checked, in any voicing unless the exercise asks for a specific one.
- **Checking:** immediate. The app shows the correct answer and plays the user's answer and the real chord back to back. Nothing is stored after the session.

### 8.4 Sound and playback

- Block chords by default, as heard in comping.
- Arpeggiate on demand, bottom up.
- Unlimited replays.
- **Piano sound only in v1.**
- Progressions play at a tempo chosen in setup.

---

## 9. Experience and visual direction

The score is the hero. Everything else stays quiet. The overall feel is a finely engraved conservatory edition: classical and classy, never fussy. Reference: [gwern.net/about](https://gwern.net/about).

- **Page:** soft paper tones, generous margins, the score centred at a size readable from playing distance.
- **Type:** a refined serif for headings and text.
- **Chrome:** minimal: thin rules, small caps for labels, no heavy cards or gradients. Controls sit in a slim bar and fade back while the user reads.
- **Colour:** near-monochrome ink-on-paper. One restrained accent (cursor, metronome pulse), muted colours for correct / wrong / late notes.
- **Motion:** the cursor moves smoothly and pages turn calmly. Nothing flashes or bounces.
- **Dark mode:** a warm "evening" variant: dark paper, light ink.
- **Tone:** encouraging and precise, like a good teacher. No cartoon gamification.

### 9.1 Drop caps

Drop caps are the platform's signature ornament, after [gwern.net/dropcap](https://gwern.net/dropcap).

- **Where:** the first letter of the first paragraph of each explanatory text (level introductions, guides, concept notes, onboarding). One per text, never on UI labels or numbers.
- **Style:** engraved, monochrome initials suited to a conservatory edition; they invert cleanly for dark mode. An illustrated set needs separate light and dark versions.
- **Weight:** one small file per letter (subset font, or an image of roughly 32 KB), loaded only when used.
- **Small screens:** simplified or turned off at phone widths.

### 9.2 Name and logo

v1 ships as **D.O.lfine**, with a **dolphin** as its logo. The logo is drawn in the same engraved, monochrome style as the drop caps, so it inverts cleanly for dark mode. After v1, the dolphin becomes the motif of an illustrated drop-cap set (curled around, leaping through or carved into each letter). In v1, a classical ornamental initial set stands in.

---

## 10. Scope phasing

### Platform

| Item                                                                         | v1  | Future             |
| ---------------------------------------------------------------------------- | --- | ------------------ |
| Dashboard: modules and Continue                                              | Yes |                    |
| D.O.lfine name and dolphin logo                                              | Yes |                    |
| Guest mode, settings saved in the browser                                    | Yes |                    |
| Shared 1–10 levels, every setting explicit, presets                          | Yes |                    |
| Explanatory texts with drop caps                                             | Yes |                    |
| Free to use                                                                  | Yes | Subscription model |
| Accounts and progress tracking: sync, history, trends, practice log, streaks |     | Next scope         |
| Level placement and suggested next exercise                                  |     | Next scope         |
| Level ladders reviewed by conservatory instructors                           |     | Yes                |
| Dolphin-illustrated drop-cap set                                             |     | After v1           |
| Teacher assignments and student tracking                                     |     | Yes                |
| Full internationalization                                                    |     | Yes                |

### Sight reading

| Item                                                        | v1  | Future               |
| ----------------------------------------------------------- | --- | -------------------- |
| Generated exercises, levels mapped to ABRSM / French cycles | Yes |                      |
| Dandelot approach: reference notes, note-reading drills     | Yes |                      |
| Treble, bass and grand staff                                | Yes | Alto and tenor clefs |
| Performance mode with MIDI scoring (Safari warning)         | Yes |                      |
| Practice mode (untimed, unassessed)                         | Yes |                      |
| Optional metronome with random mute, optional cursor        | Yes |                      |
| Note overlay and level-scaled timing tolerance              | Yes |                      |
| Curated library of graded excerpts                          |     | Yes                  |
| Import MusicXML / MIDI                                      |     | Yes                  |
| Voice note-naming (Do Ré Mi or C D E) by microphone         |     | Yes                  |

### Inner rhythm

| Item                                                                        | v1  | Future       |
| --------------------------------------------------------------------------- | --- | ------------ |
| Rhythm reading (jazz): generated, straight and swing, Freddy Roux syllables | Yes |              |
| Polyrhythm: ratios and metric modulation, staff and circular view           | Yes |              |
| Practice mode with metronome, random mute, subdivisions, Listen help        | Yes |              |
| Performance mode scored by MIDI (keyboard or pad, one per hand)             |     | Next version |
| Summary scores (accuracy, steadiness, tempo held) and drift graph           |     | Next version |
| Microphone: claps, taps and sung syllables                                  |     | Next version |
| Classical rhythm reading                                                    |     | Later        |
| Other syllable systems                                                      |     | Later        |
| Licensed _Rhythm'n Jazz_ exercises (Billaudot)                              |     | Later        |
| Odd and mixed meters as their own track                                     |     | Later        |
| Backing tracks (drums and bass) in place of the metronome                   |     | Later        |

### Music theory

| Item                                                               | v1  | Future |
| ------------------------------------------------------------------ | --- | ------ |
| Three sub-modules: major, melodic minor, harmonic minor            | Yes |        |
| Name / write the mode (with parent scale), mode in context         | Yes |        |
| Name / build / voice the chord                                     | Yes |        |
| Voicings A and B with avoid-note alternatives, conventional ranges | Yes |        |
| Voice-leading sheets, strict rule-based checking                   | Yes |        |
| Hear the answer, play the progression                              | Yes |        |
| Switchable note names, chord symbol style, French mode names       | Yes |        |
| User-entered chord grids (e.g. from a real book)                   |     | Yes    |
| More voicings taught: shells, rootless, drop 2, upper structures   |     | Yes    |
| More parent scales: harmonic major, diminished, whole tone         |     | Yes    |

### Ear training

| Item                                                                              | v1  | Future        |
| --------------------------------------------------------------------------------- | --- | ------------- |
| Sub-modules: intervals, chords, voicings, modes, progressions                     | Yes |               |
| Chord ladder from seventh chords to upper structures                              | Yes |               |
| Voicings: A/B, rootless, drop 2, quartal, upper structures, clusters (selectable) | Yes |               |
| Reference given (root, drone or tonic)                                            | Yes |               |
| Multiple choice, naming, play-back on piano or MIDI                               | Yes |               |
| Auto-checking with side-by-side replay                                            | Yes |               |
| Block, arpeggiated, unlimited replay, piano sound                                 | Yes |               |
| Voicing set mapped to the user's music theory level                               |     | With tracking |
| Other instrument sounds (Rhodes, guitar…)                                         |     | Yes           |
| No reference (absolute pitch) at the top levels                                   |     | Yes           |
| Singing answers by microphone                                                     |     | Yes           |
| Melodic and bass-line dictation                                                   |     | Yes           |
| Excerpts from real recordings                                                     |     | Yes           |
| Spaced review of weak chords                                                      |     | Next scope    |

---

## 11. Open questions

**Sight reading**

- [ ] Preview time: how many seconds before the count-in? ABRSM gives 30 seconds. Fixed, set by level, or chosen by the user?
- [ ] Random mute: how many bars drop out, and does that grow with level?
- [ ] Mode names: are "Performance" and "Practice" right?
- [ ] Melodic players without MIDI (violin, cello, flute) can only run Performance mode unscored. Is that enough for v1?

**Inner rhythm**

- [ ] Circular view: display only, or can the user mute a part or change the ratio from it?

**Music theory**

- [ ] Confirm the alternative voicings and range limits with a conservatory jazz piano teacher before release.

**Next scope (dashboard)**

- [ ] Level placement: a short placement test, a self-declared ABRSM / French level, or starting low and levelling up quickly?
- [ ] Practice goals: should users set a weekly target (minutes or sessions), shown against the log?
