<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import { type DrillStanding, percent, REQUIRED_CORRECT } from '#lib/progress/ladder.ts';

	interface Props {
		label: string;
		standing: DrillStanding;
		disabled?: boolean;
		onpick: () => void;
	}

	let { label, standing, disabled = false, onpick }: Props = $props();

	const RADIUS = 30;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

	const value = $derived(percent(standing.ratio));
	const detail = $derived(
		standing.passed
			? m.drill_graded()
			: m.drill_towards({ correct: standing.recentCorrect, required: REQUIRED_CORRECT })
	);
</script>

<button
	type="button"
	class="drill"
	class:passed={standing.passed}
	{disabled}
	aria-label={m.drill_label({ exercise: label, detail })}
	onclick={onpick}
>
	<span class="dial" aria-hidden="true">
		<svg viewBox="0 0 72 72">
			<circle class="track" cx="36" cy="36" r={RADIUS} />
			<circle
				class="fill"
				class:empty={value === 0}
				cx="36"
				cy="36"
				r={RADIUS}
				stroke-dasharray={CIRCUMFERENCE}
				stroke-dashoffset={CIRCUMFERENCE * (1 - value / 100)}
			/>
		</svg>
		<span class="value">{standing.passed ? '✓' : m.percent({ value })}</span>
	</span>
	<span class="name">{label}</span>
</button>

<style>
	.drill {
		display: grid;
		justify-items: center;
		align-content: start;
		gap: var(--space-2);
		width: 7.5rem;
		min-height: 0;
		padding: var(--space-2);
		border-color: transparent;
		text-align: center;
	}

	.drill:hover:not(:disabled) .track {
		stroke: var(--ink-soft);
	}

	.dial {
		position: relative;
		display: grid;
		place-items: center;
		width: 4.5rem;
		height: 4.5rem;
	}

	svg {
		position: absolute;
		inset: 0;
		transform: rotate(-90deg);
	}

	circle {
		fill: none;
		stroke-width: 4;
	}

	.track {
		stroke: var(--rule-strong);
		transition: stroke var(--duration) ease;
	}

	.fill {
		stroke: var(--ink);
		stroke-linecap: round;
		transition: stroke-dashoffset var(--duration) ease;
	}

	.fill.empty {
		stroke-opacity: 0;
	}

	.passed .fill {
		stroke: var(--good);
	}

	.value {
		font-size: var(--step--1);
		font-variant-numeric: lining-nums tabular-nums;
	}

	.passed .value {
		color: var(--good);
		font-size: var(--step-1);
	}

	.name {
		font-size: var(--step--1);
		line-height: var(--leading-tight);
	}
</style>
