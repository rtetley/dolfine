<script lang="ts">
	import SegnoDolphinArt from '#lib/brand/SegnoDolphinArt.svelte';
	import { m } from '#lib/i18n.ts';

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
	aria-label={m.logo_label()}
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
