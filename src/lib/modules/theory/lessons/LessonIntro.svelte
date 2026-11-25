<script lang="ts">
	import DropCap from '#lib/brand/DropCap.svelte';

	interface Props {
		paragraphs: string[];
	}

	let { paragraphs }: Props = $props();
</script>

<div class="prose intro">
	{#each paragraphs as paragraph, i (i)}
		{#if i === 0}
			<p><DropCap letter={paragraph.charAt(0)} />{paragraph.slice(1)}</p>
		{:else}
			<p>{paragraph}</p>
		{/if}
	{/each}
</div>

<style>
	.intro {
		display: flow-root;
		margin-bottom: var(--space-5);
	}
</style>
