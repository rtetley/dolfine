<script lang="ts">
	import { SEGNO_DOLPHIN as art } from './segnoDolphin';

	interface Props {
		weight?: number;
		fill?: string;
	}

	let { weight = 1.4, fill = 'none' }: Props = $props();
</script>

<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
	<path d={art.slash} stroke-width={weight * 0.7} />
	<path d={art.dorsal} {fill} stroke-width={weight} />
	<path d={art.pectoral} {fill} stroke-width={weight} />
	<path d={art.body} {fill} stroke-width={weight} />
	<path d={art.ribs} stroke-width={weight * 0.45} />
	<path d={art.hatch} stroke-width={weight * 0.4} />
	<path d={art.belly} stroke-width={weight * 0.45} />
	<path d={art.contour} stroke-width={weight * 0.35} />
	<path d={art.mouth} stroke-width={weight * 0.55} />
	<path d={art.brow} stroke-width={weight * 0.5} />
	<path d={art.blowhole} stroke-width={weight * 0.5} />
	<path d={art.crease} stroke-width={weight * 0.45} />
	<circle cx={art.eye.cx} cy={art.eye.cy} r="2.3" {fill} stroke-width={weight * 0.6} />
	<circle cx={art.eye.cx} cy={art.eye.cy} r={weight * 0.75} fill="currentColor" stroke="none" />
	{#each art.bubbles as bubble, i (i)}
		<circle cx={bubble.cx} cy={bubble.cy} r="3.6" stroke-width={weight * 0.7} />
	{/each}
</g>
