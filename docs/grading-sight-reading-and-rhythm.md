# Grading sight reading and inner rhythm

_Design note for issue #13 (progress tracking). Status: proposal, for a later release. Nothing here is implemented._

Music theory and ear training already have a progress ladder: every answer is right or wrong, and a level opens once the student gets 18 of their last 20 answers right (`src/lib/progress/`). Sight reading and inner rhythm don't fit that model. A performance is never just right or wrong. It is _mostly_ right, a little late, and it drifts. This note covers how to grade them, and what microphone grading with AI would cost.

## 1. What a grade should measure

| Module        | What we can measure                                                                                         | What the student should see                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Sight reading | Pitch accuracy, rhythm accuracy (onset within the level's tolerance window), tempo kept, notes missed/extra | Pitch %, rhythm %, tempo; overlay per note (already exists)   |
| Rhythm (read) | Onset accuracy against the written rhythm, swing ratio held, steadiness when the metronome mutes            | Accuracy %, steadiness (ms spread), drift graph over the bars |
| Polyrhythm    | Onset accuracy per hand, alignment of the shared downbeats, tempo held across a metric modulation           | Accuracy per hand, downbeat alignment, tempo before/after     |

`src/lib/music/scoring.ts` already scores a MIDI performance (`scorePerformance` → pitch %, rhythm %, per-note outcomes, with a level-scaled tolerance). That is the core of any grade. The question is only **where the played notes come from**: MIDI, keyboard taps, or a microphone.

### A proposed ladder rule

A single right/wrong window doesn't work here. Instead:

- A run **counts** for the ladder only if it was played in Performance mode, at or above the level's minimum tempo, with the cursor and metronome settings the level prescribes (no easier overrides).
- A run **passes** when both pitch and rhythm accuracy are ≥ 85 % (sight reading), or onset accuracy ≥ 85 % and steadiness within the level's spread (rhythm).
- A level **opens the next** after 4 passes among the last 5 counted runs. Runs are long, so the window is shorter than theory's 20 answers.
- The thresholds tighten with the level, the same way the timing tolerance already does.

All numbers are drafts to review with conservatory teachers, like the level mappings.

## 2. Inputs, cheapest first

1. **MIDI keyboard (exists).** Exact pitch and timing. Grades sight reading for pianists today. It only needs the ladder rule above wired to `scorePerformance`.
2. **Keyboard or touch taps (rhythm).** Space bar, a pad or the screen for each hand. Timing only, which is all the rhythm module needs. Browser event timestamps are good to a few milliseconds, once you calibrate for device latency (one tap-along bar before the exercise).
3. **Microphone.** The only option for violinists, flautists, singers, and for claps and spoken syllables. This is the expensive and hard part, covered next.

## 3. Microphone grading

The issue suggests recording the student, sending the audio to an AI, and grading tempo and notes. There are two ways to do that.

### Option A: send audio to a multimodal model

Record the run, upload it with the exercise (as MusicXML or a note list), and ask the model to compare.

**Cost (rates from third-party trackers, Nov 2026; check the providers' pricing pages before committing):**

| Model                        | Audio input price                                                  | Audio tokens per minute | ≈ cost per minute of audio    |
| ---------------------------- | ------------------------------------------------------------------ | ----------------------- | ----------------------------- |
| Gemini 3.1 Flash-Lite        | $0.50 / M tokens                                                   | 1,500 (25 tokens/s)     | $0.0008                       |
| Gemini 2.5 Flash             | $1.00 / M tokens                                                   | 1,500                   | $0.0015                       |
| Gemini 3.8 Live (streaming)  | $3.00 / M tokens                                                   | 1,500                   | $0.005                        |
| OpenAI gpt-realtime-2.1-mini | $10 / M tokens                                                     | ~600–800 (assumption)   | ~$0.007                       |
| OpenAI gpt-realtime-2.1      | $32 / M tokens                                                     | ~600–800 (assumption)   | ~$0.02–0.03                   |
| Claude                       | No raw audio input in the Messages API docs at the time of writing | n/a                     | n/a (text only, see option B) |

Output (a JSON list of per-note verdicts, ~300–500 tokens per run) adds well under $0.001 per run on any of these models.

**Usage assumptions per active student:** 10 minutes of graded playing a day (the rest of a session is preview, reading the results, retries), 20 days a month = **200 minutes/month**. With ×1.5 for prompt overhead, retries and the exercise sent as context:

| Model                  | Per student per month | 1,000 students | 10,000 students  |
| ---------------------- | --------------------- | -------------- | ---------------- |
| Gemini Flash-Lite      | ≈ $0.25               | ≈ $250         | ≈ $2,500         |
| Gemini Flash           | ≈ $0.45               | ≈ $450         | ≈ $4,500         |
| Gemini Live            | ≈ $1.50               | ≈ $1,500       | ≈ $15,000        |
| OpenAI realtime (mini) | ≈ $2                  | ≈ $2,000       | ≈ $20,000        |
| OpenAI realtime (full) | ≈ $6–9                | ≈ $6,000–9,000 | ≈ $60,000–90,000 |

Add upload bandwidth and a small backend (the API key can't ship in a static site), which is a few dollars a month at these volumes.

**Why A is risky, whatever the price:**

- **Timing precision.** Grading rhythm needs onsets to ±20–50 ms. General audio LLMs summarise what they hear. They don't report reliable millisecond onsets, and the result changes between runs of the same recording. Nobody accepts a grade that changes on resubmission.
- **Pitch on real instruments.** Vibrato, intonation and polyphony (piano, double stops) are hard for general models. They're the core job of dedicated music-transcription models.
- **Privacy.** Recordings of minors at a conservatory leave the device. That needs consent, and a data processing agreement with the provider (GDPR in France).
- **Latency.** Results come after an upload and a model call, seconds rather than instantly.

### Option B (recommended): transcribe on the device, grade with our own code

Turn audio into note events **in the browser**, then reuse `scorePerformance` exactly as for MIDI.

- **Monophonic pitch** (violin, flute, voice, single-line bass): a pitch tracker (YIN or autocorrelation) on the Web Audio API, a few hundred lines with no model. A small neural tracker (CREPE-tiny or SPICE, about 2 MB) helps with noisy rooms.
- **Polyphonic piano:** Spotify's _basic-pitch_ runs in the browser through TensorFlow.js (model about 1 MB). It handles note onsets and pitch well enough for graded reading, at least at moderate tempi.
- **Rhythm (claps, taps, syllables):** onset detection only (spectral flux). It's cheap and accurate to about 10 ms after latency calibration, so the rhythm module could start with the microphone straight away.

**Cost:** $0 per run. The work runs on the student's machine, and the audio never leaves it. The price is engineering time instead:

| Work                                                            | Rough estimate |
| --------------------------------------------------------------- | -------------- |
| Microphone capture, latency calibration, permission UX          | 1 week         |
| Onset detection plus rhythm grading (rhythm module, claps/taps) | 1–2 weeks      |
| Monophonic pitch tracking plus mapping to `PlayedNote`          | 1–2 weeks      |
| basic-pitch integration for piano, lazy-loaded like VexFlow     | 1–2 weeks      |
| Test corpus: recordings of real students at each level, tuning  | 2 weeks        |

### Where an LLM still helps

Once the performance is a list of scored notes, a text model can turn the numbers into a teacher's sentence ("You rushed every dotted quarter in bars 5–8; count the dot"). That replaces `resultsCommentary`'s fixed sentences. It's a few hundred text tokens per run, a fraction of a cent, and can use any provider, Claude included. It's optional and not needed for grading.

## 4. Recommendation

1. **Next release:** wire the ladder rule to the existing MIDI scoring (sight reading for pianists) and add tap input for the rhythm module. No new costs.
2. **Then:** on-device microphone grading, starting with onset detection for rhythm, then monophonic pitch, then basic-pitch for piano.
3. **Don't** grade by sending raw audio to a general AI model. Gemini Flash would be cheap enough (≈ $0.25–0.50 per student a month), but it can't promise the timing precision or repeatability a grade needs, and it sends students' recordings off the device.
4. **Maybe:** LLM-written commentary on top of our own scores, once the scores are trustworthy.

## Open questions

- Ladder thresholds per level (pass marks, minimum tempo, window size), to settle with teachers.
- Should a run with the cursor on count towards the ladder at the higher levels, where the PRD expects it off?
- Latency calibration: once per device, or before every session?
- Consent wording for microphone use by minors.
