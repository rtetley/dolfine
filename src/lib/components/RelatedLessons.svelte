<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n.ts';
	import type { LessonId } from '#lib/modules/theory/lessons.ts';
	import { LESSON_TEXT } from '#lib/modules/theory/lessonText.ts';

	interface Props {
		lessons: readonly LessonId[];
	}

	let { lessons }: Props = $props();
</script>

{#if lessons.length > 0}
	<nav class="related-lessons" aria-label={m.related_lessons_label()}>
		<span class="label">{m.related_lessons_label()}</span>
		{#each lessons as lesson, i (lesson)}
			{#if i > 0}<span aria-hidden="true"> · </span>{/if}
			<a href={resolve('/theory/lessons/[lesson]', { lesson })}>{LESSON_TEXT[lesson].title()}</a>
		{/each}
	</nav>
{/if}

<style>
	.related-lessons {
		margin: 0 0 var(--space-4);
		font-size: var(--step--1);
	}

	.label {
		margin-right: var(--space-2);
	}
</style>
