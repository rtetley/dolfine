<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n.ts';
	import { LESSON_TEXT } from '#lib/modules/theory/lessonText.ts';
	import { LESSONS } from '#lib/modules/theory/lessons.ts';
</script>

<svelte:head>
	<title>{m.page_title({ page: m.lessons_title() })}</title>
</svelte:head>

<div class="page">
	<h1>{m.lessons_title()}</h1>
	<p class="lede">{m.lessons_lede()}</p>

	<ol class="lessons">
		{#each LESSONS as lesson, i (lesson)}
			<li>
				<a href={resolve('/theory/lessons/[lesson]', { lesson })}>
					<span class="number">{i + 1}</span>
					<span class="title">{LESSON_TEXT[lesson].title()}</span>
					<span class="summary">{LESSON_TEXT[lesson].summary()}</span>
					<span class="open">{m.lesson_open()}</span>
				</a>
			</li>
		{/each}
	</ol>

	<div class="actions">
		<a href={resolve('/theory')}>{m.lessons_back_to_exercises()}</a>
	</div>
</div>

<style>
	.lessons {
		list-style: none;
		margin: var(--space-5) 0 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: var(--space-4);
	}

	.lessons a {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: var(--space-1) var(--space-3);
		height: 100%;
		padding: var(--space-4) var(--space-5);
		border: var(--border) solid var(--rule-strong);
		border-radius: var(--radius);
		text-decoration: none;
		transition: border-color var(--duration) ease;
	}

	.lessons a:hover {
		border-color: var(--ink-soft);
	}

	.number {
		grid-row: span 3;
		font-size: var(--step-2);
		line-height: 1;
		color: var(--accent);
		font-variant-numeric: lining-nums;
	}

	.title {
		font-size: var(--step-1);
		line-height: var(--leading-tight);
	}

	.summary,
	.open {
		color: var(--ink-soft);
		font-size: var(--step--1);
	}

	.open {
		margin-top: var(--space-2);
	}
</style>
