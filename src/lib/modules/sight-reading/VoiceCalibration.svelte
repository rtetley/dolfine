<script lang="ts">
	import { onDestroy } from 'svelte';
	import { m } from '#lib/i18n.ts';
	import { audioContext, ensureAudio } from '#lib/audio/engine.ts';
	import { type MetronomeHandle, startMetronome } from '#lib/audio/metronome.ts';
	import {
		buildProfile,
		CALIBRATION_BEAT_MS,
		calibrationPrompts
	} from '#lib/audio/voice/calibration.ts';
	import {
		type Microphone,
		microphoneError,
		openMicrophone,
		type Recorder
	} from '#lib/audio/voice/microphone.ts';
	import { findSyllables } from '#lib/audio/voice/syllables.ts';
	import { type Letter, LETTERS, noteName } from '#lib/music/pitch.ts';
	import { settings } from '#lib/state/settings.svelte.ts';
	import { voiceProfile } from '#lib/state/voiceProfile.svelte.ts';

	type Phase = 'idle' | 'running' | 'listening' | 'missing' | 'denied' | 'unavailable';

	const BEATS_PER_BAR = 7;
	const prompts = calibrationPrompts();

	let phase = $state<Phase>('idle');
	let current = $state(-1);
	let missing = $state<Letter[]>([]);

	const names = $derived(settings.noteNames);
	const ready = $derived(voiceProfile.for(names) !== null);
	const label = (letter: Letter): string => noteName({ letter, accidental: 0 }, names);
	const allNames = $derived(LETTERS.map(label).join(' '));

	let microphone: Microphone | null = null;
	let recorder: Recorder | null = null;
	let handle: MetronomeHandle | null = null;

	function release(): void {
		handle?.stop();
		handle = null;
		recorder = null;
		microphone?.close();
		microphone = null;
	}

	async function start(): Promise<void> {
		release();
		await ensureAudio();
		const context = audioContext();
		if (!context) return;
		try {
			microphone = await openMicrophone(context);
		} catch (error) {
			phase = microphoneError(error);
			return;
		}
		recorder = microphone.record();
		current = -1;
		phase = 'running';
		const metronome = startMetronome({
			bpm: 60000 / CALIBRATION_BEAT_MS,
			beatsPerBar: BEATS_PER_BAR,
			subdivision: 1,
			accent: 'downbeat',
			audible: true,
			muteMode: 'off',
			muteProbability: 0,
			countInBars: 1,
			bars: prompts.length / BEATS_PER_BAR,
			seed: 1,
			onTick: (tick) => {
				if (!tick.countIn) current = tick.bar * BEATS_PER_BAR + tick.beat;
			},
			onEnd: () => finish(metronome.readingStartTime)
		});
		handle = metronome;
	}

	function finish(firstClick: number): void {
		const recording = recorder?.stop();
		release();
		if (!recording) return;
		phase = 'listening';
		// Let the "listening" state paint before the analysis blocks the main thread.
		setTimeout(() => {
			const startMs = (recording.startTime - firstClick) * 1000;
			const syllables = findSyllables(recording.samples, recording.sampleRate).map((syllable) => ({
				...syllable,
				ms: startMs + syllable.time * 1000
			}));
			const result = buildProfile(prompts, syllables, names);
			if (result.ok) {
				voiceProfile.save(result.profile);
				phase = 'idle';
			} else {
				missing = result.missing;
				phase = 'missing';
			}
		}, 30);
	}

	onDestroy(release);
</script>

<section class="calibration" aria-label={m.voice_setup_label()}>
	<p>{m.voice_intro()}</p>
	{#if phase === 'running'}
		<p>{m.voice_setup_instructions()}</p>
		<p class="prompt" aria-live="polite">
			{#if current >= 0 && current < prompts.length}
				<span class="label">{m.voice_setup_say()}</span>
				<strong>{label(prompts[current])}</strong>
				<span class="label">
					{m.voice_setup_progress({ done: current + 1, total: prompts.length })}
				</span>
			{:else}
				<span class="label">{m.voice_setup_instructions()}</span>
			{/if}
		</p>
	{:else if phase === 'listening'}
		<p class="status" aria-live="polite">{m.voice_setup_listening()}</p>
	{:else}
		<p class="status" role={phase === 'idle' ? undefined : 'alert'}>
			{#if phase === 'missing'}
				{m.voice_setup_missing({ names: missing.map(label).join(', ') })}
			{:else if phase === 'denied'}
				{m.voice_mic_denied()}
			{:else if phase === 'unavailable'}
				{m.voice_mic_unavailable()}
			{:else if ready}
				{m.voice_setup_ready({ names: allNames })}
			{:else}
				{m.voice_setup_needed()}
			{/if}
		</p>
		<button type="button" onclick={() => void start()}>
			{ready ? m.voice_setup_again() : m.voice_setup_start()}
		</button>
	{/if}
</section>

<style>
	.calibration {
		margin-top: var(--space-4);
		max-width: var(--measure);
	}

	.prompt {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
	}

	.prompt strong {
		font-size: var(--step-3);
		min-width: 4ch;
		text-align: center;
	}

	.status {
		font-style: italic;
	}
</style>
