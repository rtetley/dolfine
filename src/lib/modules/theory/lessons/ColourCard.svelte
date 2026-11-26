<script lang="ts">
	import { ensureAudio, playArpeggio, playSchedule, stopAll } from '#lib/audio/engine.ts';
	import { m } from '#lib/i18n.ts';
	import { formatSuffix } from '#lib/music/chords.ts';
	import {
		CHORD_COLOURS,
		type ColourId,
		colourMidis,
		colourScale,
		colourVoicing,
		type ColourVoicingType
	} from '#lib/music/colours.ts';
	import { noteName, type PitchClassName, toMidi } from '#lib/music/pitch.ts';
	import Score from '#lib/notation/Score.svelte';
	import { settings } from '#lib/state/settings.svelte.ts';
	import { grandStaff, scaleScore } from '../display';
	import { COLOUR_SCALE_NAMES, COLOUR_TEXT } from '../colourText';

	interface Props {
		colour: ColourId;
		root: PitchClassName;
	}

	let { colour, root }: Props = $props();

	const TYPES: readonly ColourVoicingType[] = ['A', 'B'];

	const info = $derived(CHORD_COLOURS[colour]);
	const nameOf = (id: ColourId): string =>
		`${noteName(root, settings.noteNames)}${formatSuffix(CHORD_COLOURS[id].suffix, settings.value.chordStyle)}`;
	const name = $derived(nameOf(colour));
	const scaleName = $derived(COLOUR_SCALE_NAMES[info.scale]());
	const scale = $derived(colourScale(colour, root));
	const formula = (type: ColourVoicingType): string =>
		`${info.voicings[type].lh.join(' ')} / ${info.voicings[type].rh.join(' ')}`;
	const voicings = $derived(
		grandStaff(
			TYPES.map((type) => {
				const { lh, rh } = colourVoicing(colour, root, type);
				return { id: `${colour}${type}`, pitches: [...lh, ...rh], label: type, lhCount: lh.length };
			})
		)
	);

	async function hearScale(): Promise<void> {
		await ensureAudio();
		stopAll();
		const midis = scale.map(toMidi);
		playArpeggio([...midis, (midis[0] ?? 60) + 12], 0.28, 0.6);
	}

	async function hearType(type: ColourVoicingType): Promise<void> {
		await ensureAudio();
		stopAll();
		playSchedule([{ midis: colourMidis(colour, root, type), at: 0, duration: 2.2 }]);
	}

	/** This colour, then the one it is easiest to mistake it for, then this one again. */
	async function compare(): Promise<void> {
		await ensureAudio();
		stopAll();
		const self = colourMidis(colour, root, 'A');
		const other = colourMidis(info.similar, root, 'A');
		playSchedule([
			{ midis: self, at: 0, duration: 1.6 },
			{ midis: other, at: 1.9, duration: 1.6 },
			{ midis: self, at: 3.8, duration: 1.8 }
		]);
	}
</script>

<article class="colour" aria-labelledby="colour-{colour}">
	<header>
		<h3 id="colour-{colour}">{name}</h3>
		<p class="label">{m.lesson_colour_scale({ name: scaleName })}</p>
	</header>
	<p class="about">{COLOUR_TEXT[colour]()}</p>

	<div class="staves">
		<div>
			<Score
				score={scaleScore(scale, `${colour}s`)}
				label={m.lesson_scale_label({ name: scaleName })}
			/>
			<button type="button" onclick={() => void hearScale()}>{m.hear_the_scale()}</button>
		</div>
		<div>
			<Score
				score={voicings}
				preferredPerLine={2}
				label={m.lesson_colour_voicings_label({ name })}
			/>
			<ul class="types">
				{#each TYPES as type (type)}
					<li>
						<button type="button" onclick={() => void hearType(type)}>
							{m.lesson_hear_type({ type })}
						</button>
						<span class="formula">{formula(type)}</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<div class="actions">
		<button type="button" onclick={() => void compare()}>
			{m.lesson_compare_with({ name: nameOf(info.similar) })}
		</button>
	</div>
</article>

<style>
	.colour {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-5) 0;
		border-top: var(--border) solid var(--rule);
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-2) var(--space-4);
	}

	h3 {
		margin: 0;
		font-size: var(--step-2);
	}

	header .label,
	.about {
		margin: 0;
	}

	.about {
		max-width: var(--measure);
	}

	.staves {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: var(--space-4);
		align-items: end;
	}

	.types {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-4);
		margin: var(--space-2) 0 0;
		padding: 0;
		list-style: none;
	}

	.formula {
		margin-left: var(--space-2);
		color: var(--ink-soft);
		font-variant-numeric: lining-nums;
	}

	.actions {
		margin: 0;
	}
</style>
