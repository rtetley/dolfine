<script lang="ts">
	import { TOUR_STEPS } from '#lib/content/onboarding.ts';
	import { m } from '#lib/i18n.ts';

	interface Props {
		/** Called when the tour ends, finished or skipped. */
		onfinish: () => void;
	}

	let { onfinish }: Props = $props();

	let index = $state(0);
	let heading = $state<HTMLElement>();

	const step = $derived(TOUR_STEPS[index] ?? TOUR_STEPS[0]);
	const last = $derived(index === TOUR_STEPS.length - 1);

	// Point at the element the step is about, and keep keyboard focus in the tour.
	$effect(() => {
		const target = step?.target
			? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
			: null;
		target?.classList.add('tour-target');
		target?.scrollIntoView({ block: 'nearest' });
		heading?.focus();
		return () => target?.classList.remove('tour-target');
	});

	function onkeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') onfinish();
	}
</script>

<svelte:window {onkeydown} />

<div class="tour" role="dialog" aria-labelledby="tour-title" aria-describedby="tour-text">
	<p class="label">{m.tour_step({ step: index + 1, total: TOUR_STEPS.length })}</p>
	<h2 id="tour-title" tabindex="-1" bind:this={heading}>{step?.title()}</h2>
	<p id="tour-text">{step?.text()}</p>
	<div class="buttons">
		{#if index > 0}
			<button type="button" onclick={() => index--}>{m.tour_back()}</button>
		{/if}
		<button type="button" class="primary" onclick={() => (last ? onfinish() : index++)}>
			{index === 0 ? m.tour_take() : last ? m.tour_finish() : m.tour_next()}
		</button>
		{#if !last}
			<button type="button" onclick={onfinish}>{m.tour_skip()}</button>
		{/if}
	</div>
</div>

<style>
	.tour {
		position: fixed;
		right: var(--space-5);
		bottom: var(--space-5);
		z-index: 10;
		width: min(24rem, calc(100vw - 2 * var(--space-4)));
		padding: var(--space-4) var(--space-5);
		background: var(--paper);
		border: 3px double var(--ink);
		border-radius: var(--radius);
		box-shadow: 0 0.4rem 1.6rem color-mix(in oklch, var(--ink) 18%, transparent);
	}

	h2 {
		margin: var(--space-1) 0 var(--space-2);
		font-size: var(--step-1);
	}

	p {
		margin: 0;
	}

	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin-top: var(--space-4);
	}

	@media (max-width: 40rem) {
		.tour {
			right: var(--space-4);
			left: var(--space-4);
			bottom: var(--space-4);
			width: auto;
		}
	}
</style>
