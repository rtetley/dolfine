<script lang="ts">
	import { settings } from '#lib/state/settings.svelte.ts';
	import DolphinPoseArt from './DolphinPoseArt.svelte';
	import { POSES } from './dolphinPoses';
	import { designFor, type Extra } from './dropCapDesigns';

	interface Props {
		letter: string;
		lines?: number;
	}

	let { letter, lines = 3 }: Props = $props();

	const HEIGHT = 100;
	const BASELINE = 99;
	const FONT_SIZE = 157;
	const SIDE_ROOM = 14;

	let glyph = $state<SVGTextElement>();
	let glyphWidth = $state(70);

	const design = $derived(designFor(letter));
	const width = $derived(Math.max(HEIGHT, glyphWidth + SIDE_ROOM * 2));
	const artOffset = $derived((width - HEIGHT) / 2);

	$effect(() => {
		if (glyph) glyphWidth = glyph.getComputedTextLength();
	});

	const wavePath = (y: number): string =>
		`M-6 ${y} q6 -4 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 M2 ${y + 5} q6 -3 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0`;

	const splashPath = (extra: Extract<Extra, { kind: 'splash' }>): string =>
		[-50, -20, 10, 40]
			.map((spread) => {
				const angle = ((extra.angle - 90 + spread) * Math.PI) / 180;
				const x1 = extra.x + Math.cos(angle) * 3;
				const y1 = extra.y + Math.sin(angle) * 3;
				const x2 = extra.x + Math.cos(angle) * 9;
				const y2 = extra.y + Math.sin(angle) * 9;
				return `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`;
			})
			.join(' ');
</script>

<span
	class="dropcap"
	class:descender={/[QJ]/i.test(letter)}
	class:black={settings.value.dropCapColor === 'black'}
	style:--lines={lines}
	style:--ratio={width / HEIGHT}
>
	<svg class="art" viewBox="0 0 {width} {HEIGHT}" aria-hidden="true">
		<text
			bind:this={glyph}
			x={width / 2}
			y={BASELINE}
			class="letter"
			text-anchor="middle"
			font-size={FONT_SIZE}
		>
			{letter}
		</text>
		<g
			class="ornament"
			transform="translate({artOffset} 0)"
			fill="none"
			stroke="currentColor"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			{#each design.extras as extra, i (i)}
				{#if extra.kind === 'waves'}
					<path d={wavePath(extra.y)} stroke-width="0.9" />
				{:else if extra.kind === 'bubbles'}
					{#each extra.points as [x, y, r], j (j)}<circle
							cx={x}
							cy={y}
							{r}
							stroke-width="0.9"
						/>{/each}
				{:else if extra.kind === 'segno-dots'}
					<circle cx="6" cy="50" r="3.6" stroke-width="1.1" />
					<circle cx="94" cy="50" r="3.6" stroke-width="1.1" />
				{:else}
					<path d={splashPath(extra)} stroke-width="0.9" />
				{/if}
			{/each}
			{#each design.dolphins as dolphin, i (i)}
				<g transform={dolphin.transform}>
					<DolphinPoseArt pose={POSES[dolphin.pose]} weight={1.5} fill="var(--paper)" />
				</g>
			{/each}
		</g>
	</svg>
	<span class="fallback" aria-hidden="true">{letter}</span>
	<span class="visually-hidden">{letter}</span>
</span>

<style>
	.dropcap {
		--height: calc((var(--lines) - 1) * 1lh + 0.76em);
		float: left;
		height: var(--height);
		width: calc(var(--height) * var(--ratio));
		margin: 0.38em 0.45em 0.2em -0.1em;
	}

	.dropcap.descender {
		margin-bottom: 0.8lh;
	}

	.art {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.dropcap {
		color: var(--accent);
	}

	.dropcap.black {
		color: var(--ink);
	}

	.letter {
		font-family: inherit;
		font-weight: 500;
		fill: currentColor;
		stroke: none;
	}

	.fallback {
		display: none;
	}

	@media (max-width: 40rem) {
		.dropcap {
			float: none;
			width: auto;
			height: auto;
			margin: 0;
		}

		.art {
			display: none;
		}

		.fallback {
			display: inline;
		}
	}
</style>
