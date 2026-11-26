<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import { onDestroy, onMount } from 'svelte';
	import { audioContext, audioToPerformanceTime, ensureAudio } from '#lib/audio/engine.ts';
	import {
		type MetronomeHandle,
		type MetronomeTick,
		startMetronome
	} from '#lib/audio/metronome.ts';
	import MetronomePulse from '#lib/components/MetronomePulse.svelte';
	import {
		type Microphone,
		type MicrophoneError,
		microphoneError,
		openMicrophone,
		type Recorder
	} from '#lib/audio/voice/microphone.ts';
	import { midi } from '#lib/midi/midi.svelte.ts';
	import type { PlayedNote } from '#lib/music/scoring.ts';
	import { settings } from '#lib/state/settings.svelte.ts';
	import { voiceProfile } from '#lib/state/voiceProfile.svelte.ts';
	import Score from '#lib/notation/Score.svelte';
	import type { ScoreLayout } from '#lib/notation/render.ts';
	import { buildTrack, cursorAt, type TrackPoint } from './cursorTrack';
	import { exerciseScore, metronomeBeat, type SightReadingExercise } from './exercise';
	import type { SightReadingPrefs } from './prefs';
	import { hearReading, type Performance } from './spoken';

	interface Props {
		exercise: SightReadingExercise;
		prefs: SightReadingPrefs;
		skipPreview?: boolean;
		onfinish: (performance: Performance) => void;
		onrestart: () => void;
		onstop: () => void;
	}

	let { exercise, prefs, skipPreview = false, onfinish, onrestart, onstop }: Props = $props();

	type Phase = 'preview' | 'starting' | 'running' | 'analysing';
	let phase = $state<Phase>('preview');
	let remaining = $state(0);
	let tick = $state<MetronomeTick | null>(null);
	let layout = $state<ScoreLayout | null>(null);
	let cursor = $state<TrackPoint | null>(null);
	let overlay = $state<HTMLDivElement>();
	let micProblem = $state<MicrophoneError | null>(null);

	const score = $derived(exerciseScore(exercise, { showReferences: prefs.referenceNotes }));
	const beat = $derived(metronomeBeat(exercise.meter, exercise.tempo));
	const profile = $derived(prefs.input === 'voice' ? voiceProfile.for(settings.noteNames) : null);

	let handle: MetronomeHandle | null = null;
	let frame = 0;
	let countdown: ReturnType<typeof setInterval> | undefined;
	let stopListening: (() => void) | null = null;
	let lastSystem = -1;
	const played: PlayedNote[] = [];
	let microphone: Microphone | null = null;
	let recorder: Recorder | null = null;

	onMount(() => {
		remaining = skipPreview ? 0 : prefs.previewSeconds;
		if (remaining <= 0) {
			void begin();
			return;
		}
		countdown = setInterval(() => {
			remaining -= 1;
			if (remaining <= 0) void begin();
		}, 1000);
	});

	async function begin(): Promise<void> {
		if (phase !== 'preview') return;
		clearInterval(countdown);
		phase = 'starting';
		await ensureAudio();
		const context = audioContext();
		if (profile && context) {
			try {
				microphone = await openMicrophone(context);
			} catch (error) {
				micProblem = microphoneError(error);
				phase = 'preview';
				return;
			}
			recorder = microphone.record();
		}
		handle = startMetronome({
			bpm: beat.bpm,
			beatsPerBar: beat.beatsPerBar,
			subdivision: 1,
			accent: 'downbeat',
			audible: prefs.metronome !== 'off',
			muteMode: prefs.metronome === 'random-mute' ? 'random' : 'off',
			muteProbability: 0.3,
			countInBars: 1,
			bars: exercise.bars,
			seed: exercise.seed,
			onTick: (value) => (tick = value),
			onEnd: finish
		});
		const readingStart = audioToPerformanceTime(handle.readingStartTime);
		stopListening = midi.onNote((event) => {
			if (event.on) played.push({ midi: event.midi, time: event.time - readingStart });
		});
		phase = 'running';
		const track = layout ? buildTrack(exercise, layout) : [];
		const animate = (): void => {
			const elapsed = performance.now() - readingStart;
			cursor = layout
				? cursorAt(track, elapsed, exercise.durationMs, layout.systems, layout.width)
				: null;
			if (cursor && cursor.system !== lastSystem) {
				lastSystem = cursor.system;
				const system = layout?.systems[cursor.system];
				if (system && overlay) {
					const top = overlay.getBoundingClientRect().top + window.scrollY + system.top;
					window.scrollTo({ top: Math.max(0, top - window.innerHeight / 3), behavior: 'smooth' });
				}
			}
			frame = requestAnimationFrame(animate);
		};
		frame = requestAnimationFrame(animate);
	}

	function teardown(): void {
		handle?.stop();
		cancelAnimationFrame(frame);
		clearInterval(countdown);
		stopListening?.();
		stopListening = null;
		recorder = null;
		microphone?.close();
		microphone = null;
	}

	function finish(): void {
		const recording = recorder?.stop();
		const readingStart = handle?.readingStartTime ?? 0;
		teardown();
		if (!recording || !profile) {
			onfinish({ input: 'midi', notes: [...played] });
			return;
		}
		phase = 'analysing';
		const heard = profile;
		// Let the "listening back" state paint before the analysis blocks the main thread.
		setTimeout(() => {
			onfinish({ input: 'voice', notes: hearReading(recording, readingStart, exercise, heard) });
		}, 30);
	}

	function stop(): void {
		teardown();
		onstop();
	}

	function restart(): void {
		teardown();
		onrestart();
	}

	onDestroy(teardown);

	const system = $derived(cursor && layout ? layout.systems[cursor.system] : undefined);
</script>

<div class="run">
	<div class="bar">
		{#if phase === 'preview' && micProblem}
			<p class="status" role="alert">
				{micProblem === 'denied' ? m.voice_mic_denied() : m.voice_mic_unavailable()}
			</p>
		{:else if phase === 'preview'}
			<p class="status">{m.preview_countdown({ seconds: remaining })}</p>
			<button type="button" class="primary" onclick={() => void begin()}>{m.start_now()}</button>
		{:else if phase === 'analysing'}
			<p class="status" aria-live="polite">{m.voice_analysing()}</p>
		{:else}
			<MetronomePulse
				beat={tick?.beat ?? 0}
				beatsPerBar={beat.beatsPerBar}
				muted={tick?.muted}
				countIn={tick?.countIn}
				active={tick !== null}
			/>
		{/if}
		<div class="controls">
			{#if phase === 'starting' || phase === 'running'}
				<button type="button" onclick={restart}>{m.action_restart()}</button>
			{/if}
			<button type="button" onclick={stop}>{m.action_stop()}</button>
		</div>
	</div>

	{#if exercise.slowedFrom}
		<p class="note">{m.voice_slowed({ from: exercise.slowedFrom, tempo: exercise.tempo })}</p>
	{/if}

	<div class="sheet" bind:this={overlay}>
		<Score {score} bind:layout label={m.sight_reading_exercise_label()} />
		{#if prefs.cursor && phase === 'running' && cursor && system}
			<div
				class="cursor"
				style:left="{cursor.x}px"
				style:top="{system.top}px"
				style:height="{system.bottom - system.top}px"
			></div>
		{/if}
	</div>
</div>

<style>
	.bar {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-3) 0;
		background: var(--paper);
		border-bottom: 1px solid var(--rule);
	}

	.controls {
		display: flex;
		gap: var(--space-3);
	}

	.status {
		margin: 0;
		font-variant: small-caps;
		letter-spacing: 0.06em;
	}

	.note {
		margin: var(--space-3) 0 0;
		font-size: var(--step--1);
		font-style: italic;
		color: var(--ink-soft);
	}

	.sheet {
		position: relative;
		margin-top: var(--space-4);
	}

	.cursor {
		position: absolute;
		width: 2px;
		background: var(--accent);
		opacity: 0.7;
		pointer-events: none;
		transform: translateX(-1px);
	}
</style>
