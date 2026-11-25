<script lang="ts">
	import { onDestroy } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { ensureAudio, playNotes } from '#lib/audio/engine.ts';
	import { m } from '#lib/i18n.ts';
	import { midi } from '#lib/midi/midi.svelte.ts';
	import Piano from './Piano.svelte';

	interface Props {
		selected: SvelteSet<number>;
		low?: number;
		high?: number;
		marked?: ReadonlyMap<number, 'good' | 'bad' | 'hint'>;
		disabled?: boolean;
		maxNotes?: number;
	}

	let {
		selected,
		low = 36,
		high = 84,
		marked = new Map(),
		disabled = false,
		maxNotes = 12
	}: Props = $props();

	function toggle(note: number): void {
		if (disabled) return;
		if (selected.has(note)) {
			selected.delete(note);
			return;
		}
		if (selected.size >= maxNotes) return;
		selected.add(note);
		void ensureAudio().then(() => playNotes([note], 0.8));
	}

	const stop = midi.onNote((event) => {
		if (event.on && event.midi >= low && event.midi <= high) toggle(event.midi);
	});

	onDestroy(stop);
</script>

<div class="note-input">
	<Piano {low} {high} {selected} {marked} {disabled} ontoggle={toggle} />
	<div class="row">
		<span class="label">
			{m.notes_selected({ count: selected.size })}{midi.status === 'ready'
				? ` · ${m.midi_keys_hint()}`
				: ''}
		</span>
		<button
			type="button"
			onclick={() => selected.clear()}
			disabled={disabled || selected.size === 0}
		>
			{m.action_clear()}
		</button>
		<button
			type="button"
			onclick={() => void ensureAudio().then(() => playNotes([...selected].sort((a, b) => a - b)))}
			disabled={selected.size === 0}
		>
			{m.action_hear_it()}
		</button>
	</div>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
		margin-top: var(--space-3);
	}
</style>
