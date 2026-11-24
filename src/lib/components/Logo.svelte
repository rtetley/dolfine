<script lang="ts">
	import SegnoDolphinArt from '#lib/brand/SegnoDolphinArt.svelte';

	interface Props {
		size?: number;
	}

	let { size = 40 }: Props = $props();
</script>

<svg
	class="logo"
	width={size}
	height={size}
	viewBox="0 0 100 100"
	role="img"
	aria-label="D.O.lfine: a dolphin in the shape of a segno"
>
	<SegnoDolphinArt weight={3.2} fill="var(--paper)" />
</svg>

<style>
	.logo {
		display: block;
		color: var(--accent);
		overflow: visible;
	}
</style>
