<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import { mod } from '#lib/music/pitch.ts';

	interface Props {
		low?: number;
		high?: number;
		selected?: ReadonlySet<number>;
		marked?: ReadonlyMap<number, 'good' | 'bad' | 'hint'>;
		disabled?: boolean;
		ontoggle?: (midi: number) => void;
	}

	let {
		low = 36,
		high = 84,
		selected = new Set(),
		marked = new Map(),
		disabled = false,
		ontoggle
	}: Props = $props();

	const BLACK = new Set([1, 3, 6, 8, 10]);
	const isBlack = (midi: number): boolean => BLACK.has(mod(midi, 12));

	const whites = $derived(
		Array.from({ length: high - low + 1 }, (_, i) => low + i).filter((m) => !isBlack(m))
	);
	const blacks = $derived(
		Array.from({ length: high - low + 1 }, (_, i) => low + i)
			.filter(isBlack)
			.map((midi) => ({ midi, after: whites.findIndex((w) => w > midi) - 1 }))
	);

	const keyName = (midi: number): string => {
		const names = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
		return `${names[mod(midi, 12)]}${Math.floor(midi / 12) - 1}`;
	};
</script>

<div class="piano" style:--whites={whites.length} role="group" aria-label={m.piano_label()}>
	{#each whites as midi, index (midi)}
		<button
			type="button"
			class="key white {marked.get(midi) ?? ''}"
			class:on={selected.has(midi)}
			style:--i={index}
			aria-label={keyName(midi)}
			aria-pressed={selected.has(midi)}
			{disabled}
			onclick={() => ontoggle?.(midi)}
		>
			{#if mod(midi, 12) === 0}<span class="c-label">{keyName(midi)}</span>{/if}
		</button>
	{/each}
	{#each blacks as { midi, after } (midi)}
		<button
			type="button"
			class="key black {marked.get(midi) ?? ''}"
			class:on={selected.has(midi)}
			style:--i={after}
			aria-label={keyName(midi)}
			aria-pressed={selected.has(midi)}
			{disabled}
			onclick={() => ontoggle?.(midi)}
		></button>
	{/each}
</div>

<style>
	.piano {
		--key: calc(100% / var(--whites));
		position: relative;
		height: 8.5rem;
		width: 100%;
		max-width: 60rem;
		user-select: none;
		touch-action: manipulation;
	}

	.key {
		position: absolute;
		top: 0;
		padding: 0;
		border-radius: 0 0 3px 3px;
		transition: background 80ms ease;
	}

	.white {
		left: calc(var(--key) * var(--i));
		width: var(--key);
		height: 100%;
		background: var(--paper);
		border: 1px solid var(--ink-soft);
		z-index: 1;
	}

	.black {
		left: calc(var(--key) * (var(--i) + 1) - var(--key) * 0.3);
		width: calc(var(--key) * 0.6);
		height: 60%;
		background: var(--ink);
		border: 1px solid var(--ink);
		z-index: 2;
	}

	.white:hover:not(:disabled) {
		background: var(--paper-deep);
	}

	.key.on {
		background: var(--accent);
		border-color: var(--accent);
	}

	.key.good {
		box-shadow: inset 0 -0.6rem 0 var(--good);
	}

	.key.bad {
		box-shadow: inset 0 -0.6rem 0 var(--bad);
	}

	.key.hint {
		box-shadow: inset 0 -0.6rem 0 var(--late);
	}

	.key:disabled {
		cursor: default;
		opacity: 1;
	}

	.c-label {
		position: absolute;
		bottom: 0.3rem;
		left: 0;
		right: 0;
		font-size: 0.6rem;
		color: var(--ink-soft);
	}
</style>
