# Grading sight reading by speaking the note names

_Design note, a variant of [Grading sight reading and inner rhythm](grading-sight-reading-and-rhythm.md). Status: proposal, for a later release. Nothing here is implemented._

The original idea for microphone grading was simple. The student reads the score aloud, saying each note's name in rhythm ("do, ré, mi, sol…" or "C, D, E, G…"). The app listens, checks that every name is right, and checks that it arrived on time. This is the _lecture de notes rythmée_ of French formation musicale classes. It trains the eye-to-name reflex and the inner pulse without needing an instrument.

This note works out how to build that version, and how it compares with listening to an instrument.

## 1. Why speaking is worth it

The instrument plan has two hard problems: every instrument sounds different, and the piano is polyphonic. Speaking avoids both.

| Concern                 | Listening to an instrument                | Listening to spoken names                                  |
| ----------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| Who can be graded       | One pipeline per instrument family        | Every student, whatever they play, with no MIDI keyboard   |
| What must be recognised | Any pitch, polyphony, vibrato, intonation | 7 words in a known order: a closed vocabulary with a prior |
| Skill graded            | Reading plus technique                    | Reading only: clef, note names, rhythm                     |
| Octave and accidentals  | Graded                                    | Not spoken, so not graded (see §5)                         |
| Hardest part            | Polyphonic transcription                  | Timing: when a syllable "lands" is fuzzy (see §3)          |

The two modes complement each other. Spoken reading grades the reading itself, from Level 1 and for every instrument. MIDI, and later instrument listening, grades playing what you read.

## 2. What the student does

1. **Choose the names.** The app uses the existing setting, `NoteNameSystem` (`letters` | `solfege`, defaulting from the language). The student says the natural name of each written note head, with no octave and no accidental.
2. **Calibrate once per device.** The student says "do" (or "C") on four metronome clicks, then each of the seven names twice. This takes about 20 seconds. It measures input latency and gives the recogniser a sample of the student's voice (§4).
3. **Preview, then read.** The flow is the same as Performance mode today: a count-in, the cursor if the level allows it, and the metronome. The student speaks one name per note. Rests are silent. A tied or held note is said once, at its onset.
4. **Results.** The existing per-note overlay (`correct` / `early` / `late` / `wrong` / `missed`) is reused unchanged, along with name % and rhythm %.

The student uses a single staff only, treble or bass (and the C clefs later). Nobody can read a grand staff aloud.

## 3. Timing: what "on time" means for a syllable

Grading timing is the part that needs care. It is also the reason not to use off-the-shelf speech recognition.

- **The beat of a syllable is its vowel, not its first sound.** Listeners hear a spoken syllable land at its _perceptual centre_ (P-centre). The P-centre sits near the vowel onset, 30–100 ms after the acoustic start, and the gap depends on the consonant. The "s" of _sol_ and _si_ starts early. The "d" of _do_ and _ré_'s "r" start late. Grading the raw acoustic onset would mark every _sol_ as early.
- **So we time the vowel onset**: the rise of voiced energy (periodicity in the 80–400 Hz band) after the consonant. Then we subtract a per-syllable offset measured at calibration, so each student's _sol_ is compared with their own _sol_.
- **Tolerance.** The sight-reading levels already scale the window from 160 ms (Level 1) to 52 ms (Level 10). Speech onsets jitter more than key presses, so the spoken mode should use `max(level.toleranceMs, 80)` until a test corpus says otherwise.
- **Speed limit.** Nobody articulates more than about 5 clear names a second. At 104 bpm, Level 10's tempo, sixteenth notes would need 7. The spoken mode caps the rate at `notes per second ≤ 5` and lowers the tempo for that run, telling the student why. A run that is slowed this way still counts towards the ladder.
- **Latency.** Microphone latency varies with the device and the browser. Calibration takes the median offset of the four "do"s against the clicks. It is stored per device and redone when `navigator.mediaDevices` fires `devicechange`.

## 4. Recognising the names

The problem is much smaller than speech recognition. The score tells us **which name should arrive and roughly when**. We are verifying a known sequence (did the expected word arrive near this time, or another of the seven?), not transcribing free speech.

### Option A: the browser's Web Speech API

`SpeechRecognition` is free and already in the browser, but it is the wrong tool.

- It returns no per-word timestamps, so it can't grade rhythm.
- It is built for dictation. It merges or drops short isolated syllables, and it "corrects" _ré_ into _raie_ or _les_.
- Grammars (`SpeechGrammarList`) are ignored in practice.
- Support and where the audio goes differ by browser: Firefox has none, and some browsers send the audio to a server.

**Verdict:** rejected.

### Option B: cloud transcription with word timestamps

Whisper-family APIs and Google or Deepgram speech-to-text return word timings at roughly $0.003–0.006 a minute (2025 list prices; check before committing). At the original plan's 200 graded minutes per student a month, that is about $1 per student a month.

But their word timestamps are accurate to ±50–100 ms at best, which is too coarse for Levels 6–10. They are poor on single isolated syllables. And as with the instrument plan, recordings of minors would leave the device.

**Verdict:** rejected for grading, for the same reasons as the original plan's option A.

### Option C (recommended): on-device, closed vocabulary

The audio is processed in the browser, frame by frame, through a Web Audio `AudioWorklet`:

1. **Segment.** Detect voiced syllables: energy plus periodicity, which also rejects claps, coughs and metronome clicks. Each syllable gives a time (its vowel onset, §3) and a short window of audio.
2. **Classify** each syllable as one of the seven names (plus "noise").
   - **Phase 1: template matching, no model.** Compute MFCC features for the syllable, then use dynamic time warping (DTW) against the student's own calibration recordings of the seven names. For one known speaker and seven words, this classic approach is accurate and needs no training data. It is a few hundred lines of TypeScript.
   - **Phase 2, only if Phase 1 falls short: a small trained classifier.** A CNN on log-mel features, trained offline on a corpus of children's and adults' voices, exported to ONNX and run with `onnxruntime-web`. The model would be under 500 KB and lazy-loaded like VexFlow. This works without calibration, but it needs the corpus.
3. **Use the score as a prior.** Score each segment by how much more likely the expected name is than the best other name. That avoids failing a student for one mumbled consonant, while still catching real misreads, which are typically a third off (_mi_ for _sol_) or the wrong clef.

**Cost:** $0 per run. The audio never leaves the device and nothing is recorded or stored, only the features of the calibration samples.

### Which names are easier to tell apart

| System       | Words                 | Pairs that sound alike                                                                            |
| ------------ | --------------------- | ------------------------------------------------------------------------------------------------- |
| Solfège (fr) | do ré mi fa sol la si | Vowel shared: do/sol, fa/la, mi/si. The consonants still differ clearly                           |
| Letters (en) | C D E F G A B         | "bee, see, dee, ee, gee" all rhyme on /iː/. Only a short, quiet consonant separates five of seven |

English letter names are acoustically the hardest case: five of the seven differ only by their first consonant. Offer the solfège names in English too, and set lower expectations for letter-name accuracy until the corpus shows it works. If needed, accept the classifier's top two candidates for the rhyming letters at the lower levels.

## 5. Fitting it into the code

- **Scoring.** `scorePerformance` matches on exact MIDI. Generalise it to take the comparison as a parameter, so the spoken mode compares letters (and an instrument tracker can later forgive octave errors):

  ```ts
  scorePerformance(expected, played, toleranceMs, (same = (e, p) => e.midi === p.midi));
  ```

  A spoken name becomes a `PlayedNote` carrying its letter. The expected notes already have their spelling from the exercise generator.

- **What is graded.** In this mode, name % replaces pitch % and rhythm % keeps its meaning. Octave and accidental are out of scope, which matches classroom _lecture de notes_. A later option could ask for "fa dièse" or "F sharp" at the higher levels. It needs two syllables per note, so it would halve the speed limit.
- **Ladder.** Use the original plan's run rule unchanged: a run passes at ≥ 85 % names and ≥ 85 % rhythm, and a level needs 4 passes among the last 5 counted runs. Since #34, a level is a set of exercises that each need their grade. So "spoken reading" is one exercise of each sight-reading level, next to "play (MIDI)", and either one can open the next level for students without a keyboard.
- **Metronome bleed.** The microphone hears the click from the speakers. Request `echoCancellation: true` in `getUserMedia`, and recommend headphones on the setup screen. The voicing check in step 1 rejects clicks that get through. Check during calibration that echo cancellation doesn't shift the onsets: if it does, keep the timing measured with it turned off.
- **New files** (each one under 400 lines): `src/lib/audio/mic.ts` (capture, permission, calibration storage), `src/lib/audio/syllables.worklet.ts` (segmentation), `src/lib/audio/spokenNames.ts` (MFCC, DTW, classifying with the prior: pure functions, unit-tested on fixture recordings).

## 6. Estimate

| Work                                                                   | Rough estimate |
| ---------------------------------------------------------------------- | -------------- |
| Microphone capture, permission UX, latency calibration                 | 1 week         |
| Syllable segmentation and vowel-onset timing in an AudioWorklet        | 1–2 weeks      |
| MFCC and DTW classifier, calibration recordings, score prior           | 1–2 weeks      |
| Spoken mode in sight reading: speed cap, single staff, results, ladder | 1 week         |
| Test corpus (children and adults, fr and en, quiet and noisy rooms)    | 2 weeks        |
| _Phase 2 only:_ trained CNN classifier with `onnxruntime-web`          | 2–3 weeks      |

That is 6–8 weeks for Phase 1, similar to the instrument plan's on-device option. The spoken mode grades every student, though, not just pianists and monophonic instruments.

## 7. Recommendation

1. Build the spoken mode **before** listening to instruments. It reuses the same microphone, calibration and onset groundwork, it covers every student, and it avoids polyphony.
2. Start with solfège names (French users and English users who choose them). Turn on letter names once the corpus shows the rhyming letters are told apart reliably.
3. Keep everything on the device. No audio leaves the browser, so there is no data processing agreement, and the consent wording only concerns microphone access.

## Open questions

- Should "spoken reading" alone be able to open the next sight-reading level, or should it count for only half when a MIDI keyboard is connected?
- Is the 5-names-a-second cap right for children at Levels 1–3? It might be closer to 3.
- Should the higher levels ask for accidentals ("fa dièse"), or is that a separate theory skill?
- How much calibration will students accept: once per device, or a quick check before each session?
