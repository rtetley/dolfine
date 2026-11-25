<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n.ts';
	import ScaleLesson from '#lib/modules/theory/lessons/ScaleLesson.svelte';
	import VoicingsLesson from '#lib/modules/theory/lessons/VoicingsLesson.svelte';
	import { LESSON_TEXT } from '#lib/modules/theory/lessonText.ts';
	import { LESSON_PARENTS } from '#lib/modules/theory/lessons.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const text = $derived(LESSON_TEXT[data.lesson]);
</script>

<svelte:head>
	<title>{m.page_title({ page: text.title() })}</title>
</svelte:head>

<div class="page">
	<p class="label">
		<a href={resolve('/theory/lessons')}>{m.lessons_title()}</a>
	</p>
	<h1>{text.title()}</h1>

	{#key data.lesson}
		{#if data.lesson === 'voicings'}
			<VoicingsLesson paragraphs={text.paragraphs()} />
		{:else}
			<ScaleLesson parent={LESSON_PARENTS[data.lesson]} paragraphs={text.paragraphs()} />
		{/if}
	{/key}

	<div class="actions">
		<a href={resolve('/theory/lessons')}>{m.lessons_all()}</a>
		<a href={resolve('/theory')}>{m.lessons_back_to_exercises()}</a>
	</div>
</div>
