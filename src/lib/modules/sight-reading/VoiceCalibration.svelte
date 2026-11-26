<script lang="ts">
	import { onDestroy } from 'svelte';
	import { m } from '#lib/i18n.ts';
	import { AsyncStart } from '#lib/audio/asyncStart.svelte.ts';
	import { audioContext, ensureAudio } from '#lib/audio/engine.ts';
	import { type MetronomeHandle, startMetronome } from '#lib/audio/metronome.ts';
	import {
		buildProfile,
		CALIBRATION_BEAT_MS,
		type CalibrationPrompt,
		calibrationPrompts,
		DECOYS
	} from '#lib/audio/voice/calibration.ts';
	import {
		type Microphone,
		microphoneError,
		openMicrophone,
		type Recorder,
		type Recording
	} from '#lib/audio/voice/microphone.ts';
	import { findSyllables } from '#lib/audio/voice/syllables.ts';
	import { type Letter, LETTERS, noteName } from '#lib/music/pitch.ts';
	import { collection } from '#lib/state/collection.svelte.ts';
	import { settings } from '#lib/state/settings.svelte.ts';
	import { voiceProfile } from '#lib/state/voiceProfile.svelte.ts';

	type Phase = 'idle' | 'running' | 'listening' | 'missing' | 'denied' | 'unavailable';

	const BEATS_PER_BAR = 7;

	let phase = $state<Phase>('idle');
	let current = $state(-1);
	let missing = $state<Letter[]>([]);

	const names = $derived(settings.noteNames);
	const prompts = $derived(calibrationPrompts(names));
	const ready = $derived(voiceProfile.for(names) !== null);
	const label = (letter: Letter): string => noteName({ letter, accidental: 0 }, names);
	const allNames = $derived(LETTERS.map(label).join(' '));
	const promptText = (prompt: CalibrationPrompt): string =>
		prompt.kind === 'name' ? label(prompt.letter) : prompt.text;
	const sequence = $derived({ names: allNames, decoys: DECOYS[names].join(' ') });
	/** Which name or decoy the current click asks for, to highlight it in the written sequence. */
	const asking = $derived(current >= 0 && current < prompts.length ? prompts[current] : null);
	const isAsked = (prompt: CalibrationPrompt): boolean =>
		asking !== null &&
		(prompt.kind === 'name'
			? asking.kind === 'name' && asking.letter === prompt.letter
			: asking.kind === 'decoy' && asking.text === prompt.text);

	let microphone: Microphone | null = null;
	let recorder: Recorder | null = null;
	let handle: MetronomeHandle | null = null;
	const starting = new AsyncStart();

	function release(): void {
		starting.cancel();
		handle?.stop();
		handle = null;
		recorder = null;
		microphone?.close();
		microphone = null;
	}

	async function start(): Promise<void> {
		release();
		const opening: { microphone: Microphone | null } = { microphone: null };
		try {
			const began = await starting.run(
				async () => {
					await ensureAudio();
					const context = audioContext();
					if (context) opening.microphone = await openMicrophone(context);
				},
				() => {
					if (opening.microphone) record(opening.microphone);
				}
			);
			// Left or restarted while the microphone was opening: let it go.
			if (!began) opening.microphone?.close();
		} catch (error) {
			phase = microphoneError(error);
		}
	}

	function record(opened: Microphone): void {
		microphone = opened;
		recorder = opened.record();
		const take = prompts;
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
			bars: take.length / BEATS_PER_BAR,
			seed: 1,
			onTick: (tick) => {
				if (!tick.countIn) current = tick.bar * BEATS_PER_BAR + tick.beat;
			},
			onEnd: () => finish(metronome.readingStartTime, take)
		});
		handle = metronome;
	}

	function finish(firstClick: number, take: CalibrationPrompt[]): void {
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
			if (collection.on) saveTake(recording, firstClick, take);
			const result = buildProfile(take, syllables, names);
			if (result.ok) {
				voiceProfile.save(result.profile);
				phase = 'idle';
			} else {
				missing = result.missing;
				phase = 'missing';
			}
		}, 30);
	}

	function saveTake(recording: Recording, firstClick: number, take: CalibrationPrompt[]): void {
		const system = names;
		void import('./capture').then(({ captureFileName, captureId, download, encodeSetup }) => {
			const id = captureId('setup');
			download(
				captureFileName(id),
				encodeSetup(id, recording, firstClick, CALIBRATION_BEAT_MS, take, system)
			);
		});
	}

	onDestroy(release);
</script>

<section class="calibration" aria-label={m.voice_setup_label()}>
	<p>{m.voice_intro()}</p>
	{#if collection.on}
		<p class="collecting" role="status">
			{m.collect_on()}
			<button type="button" onclick={() => collection.set(false)}>{m.collect_turn_off()}</button>
		</p>
	{/if}
	{#if phase === 'running'}
		<p>{m.voice_setup_instructions()}</p>
		<p class="sequence" aria-hidden="true">
			{#each prompts.slice(0, LETTERS.length) as prompt (promptText(prompt))}
				<span class:asked={isAsked(prompt)}>{promptText(prompt)}</span>
			{/each}
			<span class="times">×3</span>
			{#each prompts.slice(-DECOYS[names].length) as prompt (promptText(prompt))}
				<span class="decoy" class:asked={isAsked(prompt)}>{promptText(prompt)}</span>
			{/each}
		</p>
		<p class="prompt" aria-live="polite">
			{#if current >= 0 && current < prompts.length}
				<span class="label">{m.voice_setup_say()}</span>
				<strong class:decoy={prompts[current].kind === 'decoy'}>
					{promptText(prompts[current])}
				</strong>
				{#if prompts[current].kind === 'decoy'}
					<span class="label">{m.voice_setup_decoy()}</span>
				{/if}
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
		{#if phase !== 'denied' && phase !== 'unavailable'}
			<p class="to-say">{m.voice_setup_sequence(sequence)}</p>
		{/if}
		<button
			type="button"
			onclick={() => void start()}
			aria-busy={starting.pending}
			disabled={starting.pending}
		>
			{starting.pending ? m.audio_loading() : ready ? m.voice_setup_again() : m.voice_setup_start()}
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

	.collecting {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-3);
		max-width: var(--measure);
		padding: var(--space-2) var(--space-3);
		border-left: 2px solid var(--accent);
		font-size: var(--step--1);
	}

	.sequence {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-3);
		font-size: var(--step-1);
		color: var(--ink-faint);
	}

	.sequence .decoy {
		font-style: italic;
	}

	.sequence .asked {
		color: var(--accent);
		font-weight: 700;
	}

	.sequence .times {
		font-size: var(--step--1);
		align-self: center;
	}

	.prompt .decoy {
		font-style: italic;
		color: var(--ink-soft);
	}

	.status {
		font-style: italic;
	}
</style>
