<script lang="ts">
	import { m } from '#lib/i18n.ts';
	import { onDestroy } from 'svelte';
	import { ensureAudio, playSchedule } from '#lib/audio/engine.ts';
	import {
		type MetronomeHandle,
		type MetronomeTick,
		startMetronome
	} from '#lib/audio/metronome.ts';
	import MetronomePulse from '#lib/components/MetronomePulse.svelte';
	import Score from '#lib/notation/Score.svelte';
	import { type RhythmExercise, listenSchedule, type RhythmPrefs, rhythmScore } from './reading';

	interface Props {
		exercise: RhythmExercise;
		prefs: RhythmPrefs;
		onnext: () => void;
		onrepeat: () => void;
		onlevelup: () => void;
		onsetup: () => void;
	}

	let { exercise, prefs, onnext, onrepeat, onlevelup, onsetup }: Props = $props();

	let handle: MetronomeHandle | null = null;
	let tick = $state<MetronomeTick | null>(null);
	let running = $state(false);

	const score = $derived(rhythmScore(exercise, prefs.syllables));
	const subdivision = $derived((exercise.swing ? 1 : prefs.subdivision) as 1 | 2 | 3);

	async function toggleMetronome(): Promise<void> {
		if (running) {
			stop();
			return;
		}
		await ensureAudio();
		handle = startMetronome({
			bpm: (exercise.tempo * exercise.meter.unit) / 4,
			beatsPerBar: exercise.meter.beats,
			subdivision,
			accent: exercise.swing || prefs.twoAndFour ? 'two-and-four' : 'downbeat',
			audible: prefs.metronome !== 'off',
			muteMode: prefs.metronome === 'random-mute' ? 'random' : 'off',
			muteProbability: 0.35,
			countInBars: 1,
			bars: exercise.bars,
			seed: exercise.seed,
			onTick: (value) => (tick = value),
			onEnd: stop
		});
		running = true;
	}

	async function listen(): Promise<void> {
		await ensureAudio();
		playSchedule(listenSchedule(exercise));
	}

	function stop(): void {
		handle?.stop();
		handle = null;
		running = false;
		tick = null;
	}

	onDestroy(stop);
</script>

<div class="bar">
	<button
		type="button"
		class="primary"
		onclick={() => void toggleMetronome()}
		aria-pressed={running}
	>
		{running ? m.action_stop() : m.start_with_count_in()}
	</button>
	<button type="button" onclick={() => void listen()}>{m.listen()}</button>
	<MetronomePulse
		beat={tick?.beat ?? 0}
		beatsPerBar={exercise.meter.beats}
		muted={tick?.muted}
		countIn={tick?.countIn}
		active={running}
	/>
</div>

<Score {score} label={m.rhythm_exercise_label()} />

<div class="actions">
	<button type="button" onclick={onnext}>{m.action_new_exercise()}</button>
	<button type="button" onclick={onrepeat}>{m.same_exercise_again()}</button>
	{#if prefs.level < 10}<button type="button" onclick={onlevelup}>
			{m.action_level_up()}
		</button>{/if}
	<button type="button" onclick={onsetup}>{m.action_back_to_setup()}</button>
</div>

<style>
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem 1.2rem;
		margin: 1rem 0;
	}
</style>
