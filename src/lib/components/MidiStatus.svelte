<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import { isMidiSupported, midi } from '#lib/midi/midi.svelte.ts';

	const supported = isMidiSupported();
</script>

<div class="midi-status" role="status">
	{#if !supported}
		<p class="warning">{m.midi_unsupported()}</p>
	{:else if midi.status === 'ready'}
		<p>
			<span class="dot on"></span>
			{midi.devices.length > 0
				? m.midi_ready_devices({ devices: midi.devices.join(', ') })
				: m.midi_ready_no_device()}
		</p>
	{:else if midi.status === 'denied'}
		<p class="warning">{m.midi_denied()}</p>
	{:else}
		<button type="button" onclick={() => midi.connect()} disabled={midi.status === 'requesting'}>
			{m.midi_connect()}
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
