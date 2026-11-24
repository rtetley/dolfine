<script lang="ts">
	interface Props {
		size?: number;
	}

	let { size = 40 }: Props = $props();
</script>

<svg
	class="logo"
	width={size * 1.6}
	height={size}
	viewBox="0 0 64 40"
	role="img"
	aria-label="D.O.lfine dolphin"
	fill="none"
	stroke="currentColor"
	stroke-width="1.3"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<path
		d="M3 23 C7 20.5 11 19.5 15.5 19.5 C21 11.5 33 8 43.5 11.5 L46.5 5.5 L48.8 12.8 C53.5 15.5 56.5 18.5 58.6 21.6 L63 17.6 L61.2 24.6 L63.6 31 L58 26.8 C51.5 28 44 28.8 36 28.2 C28 27.6 20.5 26.4 15.5 25.2 C10.5 27 6 26.2 3 23 Z"
	/>
	<path d="M30 27.6 L26.4 33.4 L34.2 28.2" />
	<circle cx="12.2" cy="21.6" r="0.8" fill="currentColor" stroke="none" />
	<path d="M3.5 23.2 C7 23.6 10 23.4 13 22.8" stroke-width="0.8" />
	<path
		d="M20 24.4 L23 21.6 M24.5 25.2 L27.5 22.2 M29 25.8 L32 22.8 M33.5 26.2 L36.5 23.2 M38 26.4 L41 23.4 M42.5 26.2 L45.5 23.2"
		stroke-width="0.6"
		opacity="0.7"
	/>
</svg>

<style>
	.logo {
		display: block;
		color: var(--ink);
	}
</style>
