<script lang="ts">
	export interface Choice {
		id: string;
		label: string;
	}

	interface Props {
		choices: readonly Choice[];
		selected?: string | null;
		correctId?: string | null;
		revealed?: boolean;
		onchoose: (id: string) => void;
	}

	let { choices, selected = null, correctId = null, revealed = false, onchoose }: Props = $props();

	const stateOf = (id: string): string => {
		if (!revealed) return selected === id ? 'selected' : '';
		if (id === correctId) return 'right';
		return id === selected ? 'wrong' : '';
	};
</script>

<div class="choices" role="group">
	{#each choices as choice (choice.id)}
		<button
			type="button"
			class={stateOf(choice.id)}
			aria-pressed={selected === choice.id}
			disabled={revealed}
			onclick={() => onchoose(choice.id)}
		>
			{choice.label}
		</button>
	{/each}
</div>

<style>
	.choices {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		gap: 0.5rem;
	}

	button {
		text-align: left;
	}

	button:disabled {
		opacity: 1;
		cursor: default;
	}

	.right {
		border-color: var(--good);
		color: var(--good);
		background: color-mix(in srgb, var(--good) 10%, transparent);
	}

	.wrong {
		border-color: var(--bad);
		color: var(--bad);
		text-decoration: line-through;
	}
</style>
