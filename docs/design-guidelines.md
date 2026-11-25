# D.O.lfine design guidelines

How D.O.lfine looks, and how to keep it that way. Every value here lives in [`src/lib/styles/tokens.css`](../src/lib/styles/tokens.css); this document explains them. When the two disagree, the tokens win and this file needs fixing.

## Principles

1. **Paper and ink.** The app should feel like a well-printed score or method book: warm paper, dark ink, one red used sparingly. Nothing glows, nothing floats.
2. **The music is the content.** Scores, keyboards and questions carry the page. Chrome stays quiet: thin rules instead of boxes, small caps instead of bold labels.
3. **One accent per screen.** Oxblood marks the brand (logo, drop caps), the current selection and hover on the main action. If two things on a screen are oxblood, one of them is probably wrong.
4. **Feedback is never decoration.** Right, wrong and late have their own colours, distinct from the accent, and always come with words or a symbol, never colour alone.
5. **Readable for everyone.** Every text pairing meets WCAG AA in both themes, every control edge meets 3:1, and a test enforces it.

## Tokens

Tokens come in three layers. Components use only the second and third.

| Layer   | Examples                                    | Use in components?   |
| ------- | ------------------------------------------- | -------------------- |
| Palette | `--sepia-700`, `--oxblood-400`              | No, except brand art |
| Roles   | `--ink`, `--paper`, `--accent`, `--bad`     | Yes                  |
| Scale   | `--step-1`, `--space-4`, `--control-height` | Yes                  |

Roles are the paper-and-ink vocabulary the app already used; each role points at a palette shade per theme. Change a role in `tokens.css` and every component follows, in both themes.

## Colour

### Palette

Seven ramps of eleven shades, defined in **OKLCH** so that equal steps look equally far apart. Each ramp keeps one hue and lowers lightness from 50 to 950; chroma peaks in the middle so pale tints stay soft and deep shades stay rich. Shades are clipped to the sRGB gamut, so they look the same on every screen. Hex values below are for reference; the source of truth is the `oklch()` value in `tokens.css`.

| Ramp        | 50        | 100       | 200       | 300       | 400       | 500       | 600       | 700       | 800       | 900       | 950       |
| ----------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- |
| `sepia`     | `#f7f2e8` | `#ede5d9` | `#d7cec0` | `#c3b9a8` | `#aba293` | `#90887b` | `#766f65` | `#5d584f` | `#443f38` | `#2b2722` | `#1e1b17` |
| `oxblood`   | `#fcefed` | `#f7e0dc` | `#eec4bc` | `#e6aa9e` | `#d98c7e` | `#c36e5f` | `#aa5244` | `#8e3b2e` | `#6b271c` | `#46150e` | `#320f09` |
| `moss`      | `#eef4ef` | `#deeae0` | `#c0d6c4` | `#a4c4aa` | `#85af8e` | `#669772` | `#4b7d58` | `#356542` | `#214a2d` | `#122f1a` | `#0c2112` |
| `vermilion` | `#feeeed` | `#fbdfdc` | `#f5c1bc` | `#efa49e` | `#e4847e` | `#cf635f` | `#b54645` | `#982e2f` | `#731a1d` | `#4c0c0f` | `#36090a` |
| `crimson`   | `#feeef0` | `#fbdee2` | `#f5bfc7` | `#efa2af` | `#e48194` | `#cf6079` | `#b5425f` | `#982949` | `#731533` | `#4c081e` | `#360715` |
| `ochre`     | `#f8f1e8` | `#f1e4d5` | `#e3cbae` | `#d7b488` | `#c79a5e` | `#b17e35` | `#986403` | `#794e01` | `#593800` | `#392200` | `#291800` |
| `slate`     | `#edf3fa` | `#dce8f4` | `#bcd2e9` | `#9ebee0` | `#7ea7d2` | `#5e8dbe` | `#4274a5` | `#2b5b8a` | `#194269` | `#0c2945` | `#081d31` |

| Ramp        | Hue  | Role                                                               |
| ----------- | ---- | ------------------------------------------------------------------ |
| `sepia`     | 80°  | Neutrals: paper, rules, ink. Slightly warm, never pure grey.       |
| `oxblood`   | 31°  | Brand accent.                                                      |
| `moss`      | 151° | Right answers, success.                                            |
| `crimson`   | 8°   | Wrong answers, errors.                                             |
| `vermilion` | 24°  | Reserve. Too close to oxblood for feedback (see the decision log). |
| `ochre`     | 73°  | Early or late notes, warnings, hints.                              |
| `slate`     | 250° | Keyboard focus, information.                                       |

### Roles

| Role                          | Light                     | Dark                      | Use for                                                   |
| ----------------------------- | ------------------------- | ------------------------- | --------------------------------------------------------- |
| `--paper`                     | sepia-50                  | sepia-950                 | Page background                                           |
| `--paper-deep`                | sepia-100                 | sepia-900                 | Hover fills, disabled primary, quoted panels              |
| `--rule`                      | sepia-200                 | sepia-800                 | Dividers and decorative lines                             |
| `--rule-strong`               | sepia-500                 | sepia-600                 | Borders of fields, cards and anything clickable           |
| `--ink`                       | sepia-900                 | sepia-100                 | Body text, notation, the primary button                   |
| `--ink-soft`                  | sepia-700                 | sepia-300                 | Secondary text, labels, ledes, chevrons                   |
| `--ink-faint`                 | sepia-500                 | sepia-500                 | Disabled text only                                        |
| `--on-ink`                    | sepia-50                  | sepia-950                 | Text on an ink fill                                       |
| `--accent`                    | oxblood-700               | oxblood-400               | Brand, selection, hover on the main action                |
| `--accent-strong`             | oxblood-800               | oxblood-300               | Pressed or emphasised accent                              |
| `--accent-soft`               | oxblood-700 at 12%        | oxblood-400 at 14%        | Background of a selected control                          |
| `--on-accent`                 | sepia-50                  | sepia-950                 | Text on an accent fill                                    |
| `--good` / `--good-soft`      | moss-700 / moss-100       | moss-400 / moss-900       | Right answers: text / background                          |
| `--bad` / `--bad-soft`        | crimson-700 / crimson-100 | crimson-400 / crimson-900 | Wrong answers: text / background                          |
| `--late`                      | ochre-700                 | ochre-300                 | Early or late notes, hints                                |
| `--focus`                     | slate-700                 | slate-400                 | Focus rings                                               |
| `--key-white` / `--key-black` | sepia-50 / sepia-900      | sepia-200 / sepia-950     | On-screen piano. Keys stay piano-coloured in both themes. |

### Contrast

Measured with the WCAG 2 formula; `src/lib/styles/tokens.test.ts` checks every row, so CI fails if a palette change breaks one.

| Text or mark    | On               | Needs | Light | Dark  |
| --------------- | ---------------- | ----- | ----- | ----- |
| `--ink`         | `--paper`        | 4.5:1 | 13.28 | 13.70 |
| `--ink-soft`    | `--paper`        | 4.5:1 | 6.33  | 8.84  |
| `--ink-soft`    | `--paper-deep`   | 4.5:1 | 5.66  | 7.67  |
| `--ink-faint`   | `--paper`        | 3:1   | 3.14  | 4.88  |
| `--accent`      | `--paper`        | 4.5:1 | 6.69  | 6.51  |
| `--accent`      | `--paper-deep`   | 4.5:1 | 5.99  | 5.65  |
| `--good`        | `--paper`        | 4.5:1 | 6.09  | 6.96  |
| `--bad`         | `--paper`        | 4.5:1 | 6.86  | 6.39  |
| `--late`        | `--paper`        | 4.5:1 | 6.45  | 8.77  |
| `--focus`       | `--paper`        | 3:1   | 6.30  | 6.81  |
| `--rule-strong` | `--paper`        | 3:1   | 3.14  | 3.45  |
| `--on-ink`      | `--ink`          | 4.5:1 | 13.28 | 13.70 |
| `--on-accent`   | `--accent`       | 4.5:1 | 6.69  | 6.51  |
| `--ink`         | `--accent-soft`¹ | 4.5:1 | 11.79 | 12.21 |
| `--good`        | `--good-soft`    | 4.5:1 | 5.49  | 5.92  |
| `--bad`         | `--bad-soft`     | 4.5:1 | 6.07  | 5.76  |

¹ Measured against the opaque equivalent, oxblood-100 (light) and oxblood-900 (dark).

### Rules

- Use roles, not palette shades, in components. The exception is brand art (logo, drop caps) and the piano label, which sits on a key that is light in both themes.
- Never use `--rule` for the border of something clickable: it is 1.3:1 and fails WCAG 1.4.11. Use `--rule-strong`.
- Pair every feedback colour with a word or symbol: "Right.", strike-through for a wrong choice, ● counts in results.
- No literal colours in components. If a role is missing, add it to `tokens.css` for both themes.
- Avoid opacity for disabled states: it makes text unpredictable on tinted backgrounds. Use `--ink-faint` and `--rule-strong`.

## Typography

- **Typeface:** Alegreya (variable, served from the app), with Iowan Old Style, Palatino and Georgia as fallbacks. One family throughout; hierarchy comes from size, small caps and italics, not from a second face.
- **Accidentals:** Alegreya has no ♭ ♯ ♮ 𝄫 𝄪, so the stack starts with _Dolfine Accidentals_: the music subset of Noto Music (56 KB, bundled), limited to those five characters by `unicode-range` and enlarged 110% to match Alegreya. Browsers download it only on pages that show an accidental. Always write accidentals with these Unicode characters, never `b` or `#`.
- **Base size:** 112.5% of the browser default (18 px), line height `--leading` 1.6.
- **Numbers:** Alegreya's default old-style figures suit running text. Inputs, stats, tempo and anything tabular use `font-variant-numeric: lining-nums tabular-nums`. Otherwise a zero reads as the letter o.
- **French:** use a narrow no-break space before `? ! ;` and a no-break space before `:` (see `messages/fr.json`).

### Type scale

The scale is the golden ratio φ ≈ 1.618 in half steps of √φ ≈ 1.272, so every second step is a power of φ.

| Token       | Size      | px at 18 px | Use for                                                  |
| ----------- | --------- | ----------- | -------------------------------------------------------- |
| `--step--2` | 0.618 rem | 11          | Piano key names                                          |
| `--step--1` | 0.786 rem | 14          | Labels (small caps), captions, legends, exam equivalents |
| `--step-0`  | 1 rem     | 18          | Body text, controls, navigation                          |
| `--step-1`  | 1.272 rem | 23          | Question prompts, chord symbols, card titles, h2         |
| `--step-2`  | 1.618 rem | 29          | Result figures                                           |
| `--step-3`  | 2.058 rem | 37          | Page titles (h1)                                         |
| `--step-4`  | 2.618 rem | 47          | Reserved for display use                                 |

Labels are `.label`: small caps, lowercase, 0.08em tracking, `--ink-soft`. Ledes are italic `--ink-soft`. Headings are weight 500 with `--leading-tight`.

## Space and size

Spacing uses the same φ scale, in whole steps.

| Token       | Size      | Typical use                                |
| ----------- | --------- | ------------------------------------------ |
| `--space-1` | 0.236 rem | Label to field, icon gaps                  |
| `--space-2` | 0.382 rem | Vertical padding in controls, tight lists  |
| `--space-3` | 0.618 rem | Gaps between buttons, inline groups        |
| `--space-4` | 1 rem     | Horizontal padding in buttons, grid rows   |
| `--space-5` | 1.618 rem | Section padding, grid columns, page gutter |
| `--space-6` | 2.618 rem | Space above headings and between sections  |
| `--space-7` | 4.236 rem | Page bottom                                |

| Token              | Value     | Notes                                                                 |
| ------------------ | --------- | --------------------------------------------------------------------- |
| `--control-height` | 2.382 rem | Every button, field and checkbox row, so controls line up in a row    |
| `--radius`         | 4 px      | Controls and cards. Pills (badges) may use a full radius.             |
| `--border`         | 1 px      | All borders                                                           |
| `--measure`        | 44 rem    | Maximum width of running text (about 70 characters)                   |
| `--wide`           | 64 rem    | Maximum width of a page                                               |
| `--duration`       | 120 ms    | Hover and state transitions. Disabled under `prefers-reduced-motion`. |

Layout: pages are a single `.page` column. Settings go in a `.setup` grid of 12 rem minimum columns that wraps on its own; the one breakpoint, 40 rem, is only for components that must change shape on a phone (the drop cap falls back to an inline letter, the polyrhythm views stack).

## Components

### Buttons

| Kind                                  | Look                                                                           | Use                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Primary (`.primary`)                  | Ink fill, `--on-ink` text, oxblood on hover                                    | The one main action per screen: Start, Check, Next      |
| Secondary (default)                   | `--ink-soft` outline, transparent                                              | Every other action                                      |
| Toggle or tab (`aria-pressed="true"`) | `--accent-soft` fill, `--accent` border                                        | Sub-module tabs, metronome on/off                       |
| Disabled                              | `--ink-faint` text, `--rule-strong` border; primary gets a `--paper-deep` fill | Never hide a disabled action that will become available |

Write labels as verbs that say what happens: "Start", "Check", "Hear it", "Back to setup".

### Fields

- Outlined: `--paper` background, `--rule-strong` border, `--ink-soft` on hover, focus ring in `--focus`.
- Dropdowns draw their own chevron (`--chevron`, a per-theme SVG) with `--space-5` of clearance on the right; long options truncate with an ellipsis.
- Number inputs hide the spinners and use lining figures.
- Checkboxes are 1.1 rem, tinted with `accent-color: var(--accent)`, and line up with the controls of labelled fields in the same row.
- Every field has a visible label (`.label`) or, inside a labelled group, an `aria-label`.

### Answer feedback

- Choice grid: chosen answer gets the pressed style; after checking, the right answer gets `--good` on `--good-soft`, a wrong choice `--bad` on `--bad-soft` with strike-through.
- Feedback sentences use `.good` / `.bad` and always state the answer in words.
- Piano marks use a coloured bar at the bottom of the key (`good`, `bad`, `hint`), so the key colour still shows whether it is selected.

### Music

- Notation (VexFlow) takes `--ink` for notes and `--accent` for reference notes and the current note, read from CSS at render time, so it follows the theme.
- The on-screen piano keeps white keys light and black keys dark in both themes; selection is `--accent`.
- Drop caps open each guide in `--accent` (or `--ink` if the user picks black in Settings).

## Accessibility checklist for new components

- [ ] Colours come from roles, and any new pairing is added to `tokens.test.ts`.
- [ ] Clickable things have a `--rule-strong` or stronger edge and a visible focus ring.
- [ ] Controls use `--control-height`.
- [ ] State is not shown by colour alone.
- [ ] Text is in `messages/en.json` and `messages/fr.json`.
- [ ] It works at 390 px wide and in both themes (`pnpm test:e2e` runs axe on every page).

## Decision log

### 2026-11-25: first design system (issue #15)

The palette, the roles and the fixes below were settled without debate. Four open questions were reviewed as A/B pairs on real screens of the app:

| Decision         | A                                          | B                                                    | Chosen | Why                                                                                                                                                     |
| ---------------- | ------------------------------------------ | ---------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scale            | Golden ratio in √φ half steps, leading 1.6 | Perfect fourth (4:3) on a 0.25 rem grid, leading 1.5 | **A**  | The golden-number basis asked for in the issue; keeps the existing proportions (old h1 2 rem, now 2.058) where B's headings felt louder than the brand. |
| Primary button   | Ink, oxblood on hover                      | Oxblood                                              | **A**  | With an oxblood button, "wrong" feedback and the Next button share one red.                                                                             |
| Fields           | Outlined                                   | Filled with a bottom rule                            | **A**  | Fields and buttons share one visual language.                                                                                                           |
| Wrong-answer red | Vermilion (24°)                            | Crimson (8°)                                         | **B**  | Vermilion was nearly the brand hue (31°), so mistakes read as brand colour.                                                                             |

Fixed in the same review: dropdown arrows against the edge, three different control heights, unreadable old-style zeros in inputs, unthemed checkboxes, the level picker's misaligned row, a low-contrast disabled primary button in dark mode, an inverted piano in dark mode, a stray space after mobile drop caps, field borders below 3:1, and the "late" ochre at 3.5:1 (now 6.45:1).
