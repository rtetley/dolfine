<script lang="ts">
	import { m } from '#lib/i18n.ts';
	interface Props {
		beat: number;
		beatsPerBar: number;
		muted?: boolean;
		countIn?: boolean;
		active?: boolean;
	}

	let { beat, beatsPerBar, muted = false, countIn = false, active = false }: Props = $props();
</script>

<div class="pulse" aria-hidden="true">
	{#each Array.from({ length: beatsPerBar }, (_, i) => i) as i (i)}
		<span class="beat" class:now={active && i === beat} class:muted class:count={countIn}></span>
	{/each}
	<span class="caption">{countIn ? m.pulse_count_in() : muted ? m.pulse_silent_bar() : ''}</span>
</div>

<style>
	.pulse {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 1.5rem;
	}

	.beat {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		border: 1px solid var(--accent);
		transition: background 60ms linear;
	}

	.beat.now {
		background: var(--accent);
	}

	.beat.now.muted {
		background: transparent;
		border-style: dashed;
	}

	.caption {
		font-size: var(--step--1);
		color: var(--ink-soft);
		font-style: italic;
		margin-left: var(--space-1);
	}
</style>
