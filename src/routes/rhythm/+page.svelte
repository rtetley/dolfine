<script lang="ts">
	import GuideText from '#lib/components/GuideText.svelte';
	import LevelPicker from '#lib/components/LevelPicker.svelte';
	import { RHYTHM_GUIDES } from '#lib/content/guides.ts';
	import type { Level } from '#lib/music/levels.ts';
	import { newSeed } from '#lib/music/random.ts';
	import Polyrhythm from '#lib/modules/rhythm/Polyrhythm.svelte';
	import {
		chooseRatio,
		createRhythmExercise,
		type Feel,
		RATIO_OPTIONS,
		RHYTHM_DEFAULTS,
		type RhythmExercise,
		type RhythmPrefs,
		type SyllableMode
	} from '#lib/modules/rhythm/reading.ts';
	import RhythmReading from '#lib/modules/rhythm/RhythmReading.svelte';
	import {
		continueStore,
		loadModulePrefs,
		saveModulePrefs
	} from '#lib/state/modulePrefs.svelte.ts';

	let prefs = $state<RhythmPrefs>(loadModulePrefs('rhythm', RHYTHM_DEFAULTS));
	let view = $state<'setup' | 'run'>('setup');
	let exercise = $state<RhythmExercise | null>(null);
	let seed = $state(newSeed());
	let ratio = $state<[number, number]>([3, 2]);
	let runKey = $state(0);

	function update(patch: Partial<RhythmPrefs>): void {
		prefs = { ...prefs, ...patch };
		saveModulePrefs('rhythm', prefs);
	}

	function start(nextSeed = newSeed()): void {
		seed = nextSeed;
		if (prefs.submodule === 'reading') {
			exercise = createRhythmExercise(prefs, seed);
			const feel = exercise.swing ? 'swing' : 'straight';
			continueStore.record({
				module: 'rhythm',
				summary: `Rhythm reading · Level ${prefs.level} · ${exercise.meter.beats}/${exercise.meter.unit} · ${feel} · ${exercise.tempo} bpm · Practice`
			});
		} else {
			ratio = chooseRatio(prefs, seed);
			continueStore.record({
				module: 'rhythm',
				summary: `Polyrhythm · Level ${prefs.level} · ${ratio[0]}:${ratio[1]} · Practice`
			});
		}
		runKey++;
		view = 'run';
	}

	function levelUp(): void {
		if (prefs.level < 10) update({ level: (prefs.level + 1) as Level });
		start();
	}
</script>

<svelte:head>
	<title>Inner rhythm · D.O.lfine</title>
</svelte:head>

<div class="page">
	<h1>Inner rhythm</h1>
	<p class="lede">
		Jazz rhythm reading after Freddy Roux’s Rhythm’n Jazz, and polyrhythm. Practice mode: the app
		keeps time, you perform.
	</p>

	<div class="tabs" role="group" aria-label="Sub-module">
		<button
			type="button"
			aria-pressed={prefs.submodule === 'reading'}
			onclick={() => {
				update({ submodule: 'reading' });
				view = 'setup';
			}}
		>
			Rhythm reading
		</button>
		<button
			type="button"
			aria-pressed={prefs.submodule === 'polyrhythm'}
			onclick={() => {
				update({ submodule: 'polyrhythm' });
				view = 'setup';
			}}
		>
			Polyrhythm
		</button>
	</div>

	{#if view === 'setup'}
		<section class="setup" aria-label="Exercise setup">
			<LevelPicker
				level={prefs.level}
				mapping="classical"
				onchange={(level: Level) => update({ level })}
			/>
			{#if prefs.submodule === 'reading'}
				<label class="field">
					<span class="label">Feel</span>
					<select
						value={prefs.feel}
						onchange={(e) => update({ feel: e.currentTarget.value as Feel })}
					>
						<option value="level">From level</option>
						<option value="straight">Straight</option>
						<option value="swing">Swing</option>
					</select>
				</label>
				<label class="field">
					<span class="label">Swing ratio (0 = level)</span>
					<input
						type="number"
						min="0"
						max="3"
						step="0.5"
						value={prefs.swingRatio}
						onchange={(e) => update({ swingRatio: Number(e.currentTarget.value) })}
					/>
				</label>
				<label class="field">
					<span class="label">Syllables</span>
					<select
						value={prefs.syllables}
						onchange={(e) => update({ syllables: e.currentTarget.value as SyllableMode })}
					>
						<option value="on">On</option>
						<option value="fade">Fading out</option>
						<option value="off">Off</option>
					</select>
				</label>
				<label class="field">
					<span class="label">Time signature</span>
					<select value={prefs.meter} onchange={(e) => update({ meter: e.currentTarget.value })}>
						{#each ['level', '4/4', '3/4', '2/2', '6/8', '12/8', '5/8', '7/8'] as option (option)}
							<option value={option}>{option === 'level' ? 'From level' : option}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span class="label">Bars (0 = level)</span>
					<select
						value={prefs.bars}
						onchange={(e) => update({ bars: Number(e.currentTarget.value) })}
					>
						{#each [0, 4, 8, 16] as bars (bars)}<option value={bars}>
								{bars === 0 ? 'From level' : bars}
							</option>{/each}
					</select>
				</label>
				<label class="field">
					<span class="label">Metronome</span>
					<select
						value={prefs.metronome}
						onchange={(e) =>
							update({ metronome: e.currentTarget.value as RhythmPrefs['metronome'] })}
					>
						<option value="on">On</option>
						<option value="off">Off (count-in only)</option>
						<option value="random-mute">Random mute</option>
					</select>
				</label>
				<label class="field">
					<span class="label">Subdivision clicks</span>
					<select
						value={prefs.subdivision}
						onchange={(e) => update({ subdivision: Number(e.currentTarget.value) })}
					>
						<option value={1}>Beats</option>
						<option value={2}>Eighths</option>
						<option value={3}>Triplets</option>
					</select>
				</label>
				<label class="field inline">
					<input
						type="checkbox"
						checked={prefs.twoAndFour}
						onchange={(e) => update({ twoAndFour: e.currentTarget.checked })}
					/>
					<span>Accent 2 and 4</span>
				</label>
			{:else}
				<label class="field">
					<span class="label">Ratio</span>
					<select value={prefs.ratio} onchange={(e) => update({ ratio: e.currentTarget.value })}>
						{#each RATIO_OPTIONS as option (option)}<option value={option}>
								{option === 'level' ? 'From level' : option}
							</option>{/each}
					</select>
				</label>
				<label class="field">
					<span class="label">Metronome sounds</span>
					<select value={prefs.sound} onchange={(e) => update({ sound: e.currentTarget.value })}>
						<option value="both">Both parts</option>
						<option value="a">Right hand part</option>
						<option value="b">Left hand part</option>
						<option value="downbeat">Shared downbeat only</option>
					</select>
				</label>
				<label class="field inline">
					<input
						type="checkbox"
						checked={prefs.composite}
						onchange={(e) => update({ composite: e.currentTarget.checked })}
					/>
					<span>Show composite</span>
				</label>
				<label class="field inline">
					<input
						type="checkbox"
						checked={prefs.modulation}
						onchange={(e) => update({ modulation: e.currentTarget.checked })}
					/>
					<span>Metric modulation</span>
				</label>
			{/if}
			<label class="field">
				<span class="label">Tempo (♩, 0 = level)</span>
				<input
					type="number"
					min="0"
					max="260"
					value={prefs.tempo}
					onchange={(e) => update({ tempo: Number(e.currentTarget.value) })}
				/>
			</label>
		</section>
		<div class="actions">
			<button type="button" class="primary" onclick={() => start()}>Start</button>
		</div>
		{#if prefs.submodule === 'reading'}
			<GuideText guide={RHYTHM_GUIDES.swing} open />
			<GuideText guide={RHYTHM_GUIDES.syllables} />
		{:else}
			<GuideText guide={RHYTHM_GUIDES.polyrhythm} open />
			<GuideText guide={RHYTHM_GUIDES.modulation} />
		{/if}
	{:else}
		{#key runKey}
			{#if prefs.submodule === 'reading' && exercise}
				<RhythmReading
					{exercise}
					{prefs}
					onnext={() => start()}
					onrepeat={() => start(seed)}
					onlevelup={levelUp}
					onsetup={() => (view = 'setup')}
				/>
			{:else}
				<Polyrhythm
					{ratio}
					{prefs}
					{seed}
					onnext={() => start()}
					onsetup={() => (view = 'setup')}
				/>
			{/if}
		{/key}
	{/if}
</div>
