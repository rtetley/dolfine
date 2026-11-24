<script lang="ts">
	import DropCap from '#lib/brand/DropCap.svelte';
	import type { Guide } from '#lib/content/guides.ts';

	interface Props {
		guide: Guide;
		open?: boolean;
	}

	let { guide, open = false }: Props = $props();
</script>

<details class="guide" {open}>
	<summary>{guide.title}</summary>
	<div class="prose">
		{#each guide.paragraphs as paragraph, i (i)}
			{#if i === 0}
				<p><DropCap letter={paragraph.charAt(0)} />{paragraph.slice(1)}</p>
			{:else}
				<p>{paragraph}</p>
			{/if}
		{/each}
	</div>
</details>

<style>
	.guide {
		border-top: 1px solid var(--rule);
		padding: 0.6rem 0;
	}

	.guide summary {
		cursor: pointer;
		font-variant: small-caps;
		letter-spacing: 0.06em;
		color: var(--ink-soft);
	}

	.guide .prose {
		margin-top: 0.6rem;
		display: flow-root;
	}
</style>
