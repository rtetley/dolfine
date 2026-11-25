<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import { onsetFractions, type PolyrhythmCycle } from '#lib/music/polyrhythm.ts';

	interface Props {
		cycle: PolyrhythmCycle;
		progress: number | null;
		showComposite: boolean;
	}

	let { cycle, progress, showComposite }: Props = $props();

	const R = 80;
	const point = (fraction: number, radius: number): { x: number; y: number } => ({
		x: 100 + radius * Math.sin(fraction * 2 * Math.PI),
		y: 100 - radius * Math.cos(fraction * 2 * Math.PI)
	});

	const partA = $derived(onsetFractions(cycle.onsetsA, cycle.length).map((f) => point(f, R)));
	const partB = $derived(onsetFractions(cycle.onsetsB, cycle.length).map((f) => point(f, R - 22)));
	const hand = $derived(progress === null ? null : point(progress, R + 8));
</script>

<div class="views">
	<svg
		viewBox="0 0 200 200"
		class="circle"
		role="img"
		aria-label={m.poly_circle_label({ a: cycle.a, b: cycle.b })}
	>
		<circle cx="100" cy="100" r={R} class="track" />
		<circle cx="100" cy="100" r={R - 22} class="track" />
		{#each partA as p, i (i)}<circle cx={p.x} cy={p.y} r="6" class="a" />{/each}
		{#each partB as p, i (i)}<rect
				x={p.x - 5}
				y={p.y - 5}
				width="10"
				height="10"
				class="b"
			/>{/each}
		{#if hand}<line x1="100" y1="100" x2={hand.x} y2={hand.y} class="hand" />{/if}
		<text x="100" y="106" text-anchor="middle" class="ratio">{cycle.a}:{cycle.b}</text>
	</svg>

	<div class="lanes" aria-label={m.poly_lanes_label()}>
		<div class="lane">
			<span class="lane-label">{m.poly_right_hand({ count: cycle.a })}</span>
			<div class="line">
				{#each cycle.onsetsA as onset, i (i)}<span
						class="mark a"
						style:left="{(onset / cycle.length) * 100}%"
					></span>{/each}
			</div>
		</div>
		<div class="lane">
			<span class="lane-label">{m.poly_left_hand({ count: cycle.b })}</span>
			<div class="line">
				{#each cycle.onsetsB as onset, i (i)}<span
						class="mark b"
						style:left="{(onset / cycle.length) * 100}%"
					></span>{/each}
			</div>
		</div>
		{#if showComposite}
			<div class="lane">
				<span class="lane-label">{m.poly_composite()}</span>
				<div class="line">
					{#each cycle.composite as event, i (i)}<span
							class="mark c"
							style:left="{(event.position / cycle.length) * 100}%"
						></span>{/each}
				</div>
			</div>
		{/if}
		{#if progress !== null}<div
				class="playhead"
				style:left="calc(9rem + (100% - 9rem) * {progress})"
			></div>{/if}
	</div>
</div>

<style>
	.views {
		display: grid;
		grid-template-columns: minmax(10rem, 16rem) 1fr;
		gap: 2rem;
		align-items: center;
		margin: 1.5rem 0;
	}

	@media (max-width: 40rem) {
		.views {
			grid-template-columns: 1fr;
		}
	}

	.track {
		fill: none;
		stroke: var(--rule);
	}

	.a {
		fill: var(--accent);
	}

	.b {
		fill: var(--ink);
	}

	.hand {
		stroke: var(--accent);
		stroke-width: 1.5;
	}

	.ratio {
		fill: var(--ink-soft);
		font-family: var(--serif);
		font-size: 14px;
	}

	.lanes {
		position: relative;
		display: grid;
		gap: 1.2rem;
	}

	.lane {
		display: grid;
		grid-template-columns: 9rem 1fr;
		align-items: center;
	}

	.lane-label {
		font-size: 0.85rem;
		color: var(--ink-soft);
	}

	.line {
		position: relative;
		height: 1rem;
		border-bottom: 1px solid var(--rule);
	}

	.mark {
		position: absolute;
		bottom: -0.35rem;
		width: 0.7rem;
		height: 0.7rem;
		transform: translateX(-50%);
	}

	.mark.a {
		border-radius: 50%;
		background: var(--accent);
	}

	.mark.b {
		background: var(--ink);
	}

	.mark.c {
		border-radius: 50%;
		border: 1px solid var(--ink-soft);
	}

	.playhead {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		background: var(--accent);
		opacity: 0.6;
	}
</style>
