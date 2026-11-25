<script lang="ts">
	import '@fontsource-variable/alegreya';
	import '@fontsource-variable/alegreya/wght-italic.css';
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { preloadAudio } from '#lib/audio/engine.ts';
	import SiteHeader from '#lib/components/SiteHeader.svelte';
	import { getLocale, m } from '#lib/i18n.ts';
	import { applyTheme, settings } from '#lib/state/settings.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	$effect(() => applyTheme(settings.value.theme));
	$effect(() => {
		if (/^\/(sight-reading|rhythm|theory|ear)/.test(page.route.id ?? '')) preloadAudio();
	});
	$effect(() => {
		document.documentElement.lang = getLocale();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>D.O.lfine</title>
	<meta name="description" content={m.meta_description()} />
</svelte:head>

<SiteHeader />
<main>
	{@render children()}
</main>
