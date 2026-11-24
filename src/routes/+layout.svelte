<script lang="ts">
	import '@fontsource-variable/alegreya';
	import '@fontsource-variable/alegreya/wght-italic.css';
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import SiteHeader from '#lib/components/SiteHeader.svelte';
	import { applyTheme, settings } from '#lib/state/settings.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	$effect(() => applyTheme(settings.value.theme));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>D.O.lfine</title>
	<meta
		name="description"
		content="Sight reading, inner rhythm, jazz theory and ear training for serious musicians."
	/>
</svelte:head>

<SiteHeader />
<main>
	{@render children()}
</main>
