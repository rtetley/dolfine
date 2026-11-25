# D.O.lfine

Sight reading, inner rhythm, jazz theory and ear training for serious musicians. The product spec is in [PRD.md](PRD.md).

v1 is an MVP: every setting is selectable, nothing adapts to the user, and everything is stored in the browser (no accounts).

## Stack

- SvelteKit 3 + Svelte 5 (runes), TypeScript, static build (`adapter-static`, SPA, no SSR)
- VexFlow 5 for notation (lazy-loaded), Tone.js for audio (Salamander piano samples from the Tone.js CDN)
- Web MIDI for keyboard input (Chrome, Edge, Firefox; Safari shows a warning)
- Vitest (unit, component and build tests), Playwright (end-to-end), ESLint + Prettier

## Getting started

```sh
nvm use          # Node 26
pnpm install
pnpm dev         # http://localhost:5173
```

| Script               | What it does                                      |
| -------------------- | ------------------------------------------------- |
| `pnpm dev`           | Dev server                                        |
| `pnpm build`         | Static site in `build/`                           |
| `pnpm preview`       | Serve the build                                   |
| `pnpm test`          | Unit and component tests                          |
| `pnpm test:unit`     | Unit tests in watch mode                          |
| `pnpm test:coverage` | Unit and component tests with coverage thresholds |
| `pnpm test:build`    | Build the site twice and check the output         |
| `pnpm test:e2e`      | End-to-end tests in Chromium                      |
| `pnpm test:all`      | Everything above                                  |
| `pnpm check`         | svelte-check / TypeScript                         |
| `pnpm lint`          | Prettier check + ESLint                           |

## Tests

Run `pnpm exec playwright install chromium` once before the component and end-to-end tests.

| Layer      | Where                     | Runs in           | Covers                                                                                                           |
| ---------- | ------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| Unit       | `src/**/*.test.ts`        | Node              | Music core, generators at every level, scoring, state, MIDI parsing, metronome and polyrhythm scheduling         |
| Component  | `src/**/*.svelte.test.ts` | Chromium (Vitest) | Shared components, VexFlow rendering, ear questions, results                                                     |
| Build      | `tests/build/`            | Node              | Every route prerendered, no broken asset links, GitHub Pages base path, VexFlow lazy-loaded, per-page JS budgets |
| End-to-end | `tests/e2e/`              | Chromium          | Every module flow, settings, Continue, fake MIDI keyboard, axe accessibility, mobile and GitHub Pages smoke runs |

End-to-end tests build the site and serve it the way GitHub Pages does, at `/` and at `/dolfine/`. Piano samples are answered with silence, and any console error fails the test.

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
