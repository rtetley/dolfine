<script lang="ts">
	import { onDestroy } from 'svelte';
	import { ensureAudio, now } from '#lib/audio/engine.ts';
	import {
		planModulation,
		playModulation,
		type PolyHandle,
		type PolySound,
		startPolyrhythm
	} from '#lib/audio/poly.ts';
	import { POLYRHYTHM_LEVELS } from '#lib/music/rhythmLevels.ts';
	import { METRIC_MODULATIONS, polyrhythm } from '#lib/music/polyrhythm.ts';
	import { createRng } from '#lib/music/random.ts';
	import PolyCircle from './PolyCircle.svelte';
	import type { RhythmPrefs } from './reading';

	interface Props {
		ratio: [number, number];
		prefs: RhythmPrefs;
		seed: number;
		onnext: () => void;
		onsetup: () => void;
	}

	let { ratio, prefs, seed, onnext, onsetup }: Props = $props();

	const cycle = $derived(polyrhythm(ratio[0], ratio[1]));
	const tempo = $derived(prefs.tempo > 0 ? prefs.tempo : POLYRHYTHM_LEVELS[prefs.level].tempo);
	const modulation = $derived(createRng(seed).pick(METRIC_MODULATIONS));
	const plan = $derived(planModulation(tempo, modulation, 4, 2, 2));

	let handle: PolyHandle | null = null;
	let playing = $state(false);
	let progress = $state<number | null>(null);
	let frame = 0;
	let follow = $state(true);
	let modulationBeat = $state<{ phase: 'before' | 'after'; beat: number } | null>(null);
	let cancelModulation: (() => void) | null = null;

	async function toggle(): Promise<void> {
		if (handle) {
			stop();
			return;
		}
		await ensureAudio();
		handle = startPolyrhythm({ a: ratio[0], b: ratio[1], tempo, sound: prefs.sound as PolySound });
		playing = true;
		const animate = (): void => {
			if (!handle) return;
			const elapsed = now() - handle.startTime;
			progress = elapsed < 0 ? null : (elapsed % handle.cycleSeconds) / handle.cycleSeconds;
			frame = requestAnimationFrame(animate);
		};
		frame = requestAnimationFrame(animate);
	}

	function stop(): void {
		handle?.stop();
		handle = null;
		playing = false;
		cancelAnimationFrame(frame);
		progress = null;
	}

	async function playMod(): Promise<void> {
		await ensureAudio();
		cancelModulation?.();
		cancelModulation = playModulation(
			plan,
			4,
			follow,
			(phase, beat) => (modulationBeat = { phase, beat })
		);
	}

	onDestroy(() => {
		stop();
		cancelModulation?.();
	});
</script>

<div class="bar">
	<button type="button" class="primary" onclick={() => void toggle()} aria-pressed={playing}>
		{playing ? 'Stop' : `Play ${ratio[0]} against ${ratio[1]}`}
	</button>
	<span class="label">♩ = {tempo} · cycle of {ratio[1]} beats</span>
</div>

<PolyCircle {cycle} {progress} showComposite={prefs.composite} />

{#if prefs.modulation || POLYRHYTHM_LEVELS[prefs.level].modulation}
	<section class="modulation" aria-label="Metric modulation">
		<h2>Metric modulation</h2>
		<p class="equation">
			♩ = {tempo} &nbsp;→&nbsp; <em>{modulation.label}</em> &nbsp;→&nbsp; ♩ = {plan.newTempo}
		</p>
		<p class="lede">
			Two bars at the old tempo, then two at the new one. Hold the new pulse yourself if the
			metronome drops out.
		</p>
		<div class="actions">
			<button type="button" onclick={() => void playMod()}>Play the modulation</button>
			<label class="field inline">
				<input type="checkbox" bind:checked={follow} />
				<span>Metronome follows the change</span>
			</label>
			{#if modulationBeat}<span class="label">
					{modulationBeat.phase === 'before' ? 'old tempo' : 'new tempo'} · beat {modulationBeat.beat +
						1}
				</span>{/if}
		</div>
	</section>
{/if}

<div class="actions">
	<button type="button" onclick={onnext}>New ratio</button>
	<button type="button" onclick={onsetup}>Back to setup</button>
</div>

<style>
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		margin: 1rem 0;
	}

	.equation {
		font-size: 1.15rem;
	}
</style>
