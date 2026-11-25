<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import type { Level } from '#lib/music/levels.ts';
	import type { TrackId } from '#lib/progress/ladder.ts';
	import type { ModuleId } from '#lib/state/modulePrefs.svelte.ts';
	import { onboarding } from '#lib/state/onboarding.svelte.ts';

	interface Props {
		module: ModuleId;
		/** Graded modules: the ladders a self-declared level applies to. */
		tracks?: readonly TrackId[];
		/** Called after the student places themself, with the level to switch to. */
		onplace?: (level: Level) => void;
	}

	let { module, tracks = [], onplace }: Props = $props();

	// The introduction is read once; load its text only when it is shown.
	const loadPanel = () => import('./ModuleIntroPanel.svelte');
</script>

{#if !onboarding.hasSeen(module)}
	{#await loadPanel() then { default: Panel }}
		<Panel {module} {tracks} {onplace} />
	{/await}
{:else}
	<p class="reopen">
		<button type="button" class="text-button" onclick={() => onboarding.showIntroAgain(module)}>
			{m.intro_reopen()}
		</button>
	</p>
{/if}

<style>
	.reopen {
		margin: 0 0 var(--space-3);
	}

	.text-button {
		min-height: 0;
		height: auto;
		padding: 0;
		border: none;
		background: none;
		color: var(--ink-soft);
		font-size: var(--step--1);
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.text-button:hover:not(:disabled) {
		background: none;
		color: var(--ink);
	}
</style>
