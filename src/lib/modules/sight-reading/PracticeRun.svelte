<script lang="ts">
	import { onDestroy } from 'svelte';
	import { ensureAudio } from '#lib/audio/engine.ts';
	import {
		type MetronomeHandle,
		type MetronomeTick,
		startMetronome
	} from '#lib/audio/metronome.ts';
	import MetronomePulse from '#lib/components/MetronomePulse.svelte';
	import Score from '#lib/notation/Score.svelte';
	import { exerciseScore, metronomeBeat, type SightReadingExercise } from './exercise';
	import type { SightReadingPrefs } from './prefs';

	interface Props {
		exercise: SightReadingExercise;
		prefs: SightReadingPrefs;
		onnext: () => void;
		onsetup: () => void;
	}

	let { exercise, prefs, onnext, onsetup }: Props = $props();

	let handle: MetronomeHandle | null = null;
	let running = $state(false);
	let tick = $state<MetronomeTick | null>(null);
	let tempoOverride = $state<number | null>(null);
	const tempo = $derived(tempoOverride ?? exercise.tempo);

	const score = $derived(exerciseScore(exercise, { showReferences: prefs.referenceNotes }));
	const beat = $derived(metronomeBeat(exercise.meter, tempo));

	async function toggle(): Promise<void> {
		if (running) {
			stop();
			return;
		}
		await ensureAudio();
		handle = startMetronome({
			bpm: beat.bpm,
			beatsPerBar: beat.beatsPerBar,
			subdivision: 1,
			accent: 'downbeat',
			audible: true,
			muteMode: prefs.metronome === 'random-mute' ? 'random' : 'off',
			muteProbability: 0.3,
			countInBars: 0,
			seed: exercise.seed,
			onTick: (value) => (tick = value)
		});
		running = true;
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
	<button type="button" onclick={() => void toggle()} aria-pressed={running}>
		{running ? 'Stop metronome' : 'Start metronome'}
	</button>
	<label class="field inline">
		<span class="label">♩ =</span>
		<input
			type="number"
			min="30"
			max="240"
			value={tempo}
			disabled={running}
			onchange={(e) => (tempoOverride = Number(e.currentTarget.value))}
		/>
	</label>
	<MetronomePulse
		beat={tick?.beat ?? 0}
		beatsPerBar={beat.beatsPerBar}
		muted={tick?.muted}
		active={running}
	/>
</div>

<Score {score} label="Practice exercise" />

<div class="actions">
	<button type="button" class="primary" onclick={onnext}>New exercise</button>
	<button type="button" onclick={onsetup}>Back to setup</button>
</div>

<style>
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem 1.5rem;
		margin: 1rem 0;
	}

	input[type='number'] {
		width: 5rem;
	}
</style>
