<script lang="ts">
	import { isMidiSupported, midi } from '#lib/midi/midi.svelte.ts';

	const supported = isMidiSupported();
</script>

<div class="midi-status" role="status">
	{#if !supported}
		<p class="warning">
			This browser has no Web MIDI, so MIDI scoring is off. Use Chrome, Edge or Firefox to connect a
			keyboard; everything else works here.
		</p>
	{:else if midi.status === 'ready'}
		<p>
			<span class="dot on"></span>
			MIDI ready{midi.devices.length > 0
				? ` · ${midi.devices.join(', ')}`
				: ' · no device detected yet'}
		</p>
	{:else if midi.status === 'denied'}
		<p class="warning">
			MIDI access was refused. Allow it in the browser's site settings to enable scoring.
		</p>
	{:else}
		<button type="button" onclick={() => midi.connect()} disabled={midi.status === 'requesting'}>
			Connect MIDI keyboard
		</button>
	{/if}
</div>

<style>
	.midi-status p {
		margin: 0;
		font-size: 0.9rem;
		color: var(--ink-soft);
	}

	.warning {
		border-left: 2px solid var(--late);
		padding-left: 0.6rem;
	}

	.dot {
		display: inline-block;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: var(--good);
		margin-right: 0.3rem;
	}
</style>
