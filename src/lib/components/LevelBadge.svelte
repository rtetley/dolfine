<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import type { Level } from '#lib/music/levels.ts';
	import { ROMAN_NUMERALS } from '#lib/progress/labels.ts';

	interface Props {
		level: Level;
		size?: 'small' | 'large';
		/** Read out instead of the default "Level N badge". */
		label?: string;
	}

	let { level, size = 'small', label }: Props = $props();
</script>

<!-- An engraved roundel with the level in roman numerals, like a plate number in an old edition. -->
<span class="badge {size}" role="img" aria-label={label ?? m.badge_label({ level })}>
	<span class="numeral" aria-hidden="true">{ROMAN_NUMERALS[level - 1]}</span>
</span>

<style>
	.badge {
		--size: 2.6rem;
		display: inline-grid;
		place-items: center;
		flex: none;
		width: var(--size);
		height: var(--size);
		border: 3px double var(--ink);
		border-radius: 50%;
		background: var(--paper);
		color: var(--ink);
		box-shadow: inset 0 0 0 2px var(--paper);
	}

	.badge.large {
		--size: 4.2rem;
		border-width: 4px;
	}

	.numeral {
		font-variant: small-caps;
		font-variant-numeric: lining-nums;
		letter-spacing: 0.02em;
		font-size: var(--step-0);
		line-height: 1;
	}

	.large .numeral {
		font-size: var(--step-2);
	}
</style>
