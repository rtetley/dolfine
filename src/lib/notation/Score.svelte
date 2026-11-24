<script lang="ts">
	import type { Score } from './model';
	import type { ScoreLayout } from './render';

	interface Props {
		score: Score;
		preferredPerLine?: number;
		label?: string;
		layout?: ScoreLayout | null;
		hidden?: boolean;
	}

	let {
		score,
		preferredPerLine = 4,
		label = 'Music notation',
		layout = $bindable(null),
		hidden = false
	}: Props = $props();

	let host = $state<HTMLDivElement>();
	let width = $state(0);

	const renderer = import('./render');

	$effect(() => {
		const target = host;
		const options = { width: Math.floor(width), preferredPerLine };
		const current = score;
		if (!target || width < 120) return;
		let stale = false;
		void renderer.then(({ renderScore }) => {
			if (!stale) layout = renderScore(target, current, options);
		});
		return () => {
			stale = true;
		};
	});
</script>

<figure class="score" class:hidden aria-label={label} bind:clientWidth={width}>
	<div bind:this={host} class="canvas"></div>
</figure>

<style>
	.score {
		margin: 0;
		width: 100%;
		position: relative;
	}

	.canvas :global(svg) {
		display: block;
		max-width: 100%;
		height: auto;
	}

	.hidden .canvas {
		visibility: hidden;
	}
</style>
