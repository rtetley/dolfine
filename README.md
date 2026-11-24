# D.O.lfine

Sight reading, inner rhythm, jazz theory and ear training for serious musicians. The product spec is in [PRD.md](PRD.md).

v1 is an MVP: every setting is selectable, nothing adapts to the user, and everything is stored in the browser (no accounts).

## Stack

- SvelteKit 3 + Svelte 5 (runes), TypeScript, static build (`adapter-static`, SPA, no SSR)
- VexFlow 5 for notation (lazy-loaded), Tone.js for audio (Salamander piano samples from the Tone.js CDN)
- Web MIDI for keyboard input (Chrome, Edge, Firefox; Safari shows a warning)
- Vitest for unit tests, ESLint + Prettier

## Getting started

```sh
nvm use          # Node 26
pnpm install
pnpm dev         # http://localhost:5173
```

| Script         | What it does              |
| -------------- | ------------------------- |
| `pnpm dev`     | Dev server                |
| `pnpm build`   | Static site in `build/`   |
| `pnpm preview` | Serve the build           |
| `pnpm test`    | Unit tests                |
| `pnpm check`   | svelte-check / TypeScript |
| `pnpm lint`    | Prettier check + ESLint   |

## Structure

```
src/lib/music/        pure music core: pitch, scales/modes, chords, voicings, voice leading,
                      progressions, rhythm, melody, polyrhythm, scoring, levels (unit-tested)
src/lib/notation/     score model (pure) + VexFlow renderer + <Score> component
src/lib/audio/        Tone.js engine, metronome, polyrhythm / metric-modulation scheduling
src/lib/midi/         Web MIDI input
src/lib/state/        browser-persisted settings, module prefs, Continue
src/lib/modules/      one folder per module: exercise logic (pure, tested) + Svelte views
src/lib/components/   shared UI: piano, choices, level picker, metronome pulse, logo
src/routes/           dashboard, settings and one route per module
```
