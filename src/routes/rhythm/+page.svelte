<script lang="ts">
	import GuideText from '#lib/components/GuideText.svelte';
	import LevelPicker from '#lib/components/LevelPicker.svelte';
	import { m } from '#lib/i18n.ts';
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
			continueStore.record({
				module: 'rhythm',
				summary: m.rhythm_reading_summary({
					level: prefs.level,
					meter: `${exercise.meter.beats}/${exercise.meter.unit}`,
					feel: exercise.swing ? m.feel_swing() : m.feel_straight(),
					tempo: exercise.tempo,
					practice: m.practice_suffix()
				})
			});
		} else {
			ratio = chooseRatio(prefs, seed);
			continueStore.record({
				module: 'rhythm',
				summary: m.polyrhythm_summary({
					level: prefs.level,
					ratio: `${ratio[0]}:${ratio[1]}`,
					practice: m.practice_suffix()
				})
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
	<title>{m.page_title({ page: m.nav_rhythm() })}</title>
</svelte:head>

<div class="page">
	<h1>{m.nav_rhythm()}</h1>
	<p class="lede">{m.rhythm_lede()}</p>

	<div class="tabs" role="group" aria-label={m.submodule_label()}>
		<button
			type="button"
			aria-pressed={prefs.submodule === 'reading'}
			onclick={() => {
				update({ submodule: 'reading' });
				view = 'setup';
			}}
		>
			{m.rhythm_tab_reading()}
		</button>
		<button
			type="button"
			aria-pressed={prefs.submodule === 'polyrhythm'}
			onclick={() => {
				update({ submodule: 'polyrhythm' });
				view = 'setup';
			}}
		>
			{m.rhythm_tab_polyrhythm()}
		</button>
	</div>

	{#if view === 'setup'}
		<section class="setup" aria-label={m.setup_label()}>
			<LevelPicker
				level={prefs.level}
				mapping="classical"
				onchange={(level: Level) => update({ level })}
			/>
			{#if prefs.submodule === 'reading'}
				<label class="field">
					<span class="label">{m.feel_label()}</span>
					<select
						value={prefs.feel}
						onchange={(e) => update({ feel: e.currentTarget.value as Feel })}
					>
						<option value="level">{m.from_level()}</option>
						<option value="straight">{m.feel_straight()}</option>
						<option value="swing">{m.feel_swing()}</option>
					</select>
				</label>
				<label class="field">
					<span class="label">{m.swing_ratio_label()}</span>
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
					<span class="label">{m.syllables_label()}</span>
					<select
						value={prefs.syllables}
						onchange={(e) => update({ syllables: e.currentTarget.value as SyllableMode })}
					>
						<option value="on">{m.syllables_on()}</option>
						<option value="fade">{m.syllables_fade()}</option>
						<option value="off">{m.syllables_off()}</option>
					</select>
				</label>
				<label class="field">
					<span class="label">{m.time_signature_label()}</span>
					<select value={prefs.meter} onchange={(e) => update({ meter: e.currentTarget.value })}>
						{#each ['level', '4/4', '3/4', '2/2', '6/8', '12/8', '5/8', '7/8'] as option (option)}
							<option value={option}>{option === 'level' ? m.from_level() : option}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span class="label">{m.bars_label_level()}</span>
					<select
						value={prefs.bars}
						onchange={(e) => update({ bars: Number(e.currentTarget.value) })}
					>
						{#each [0, 4, 8, 16] as bars (bars)}<option value={bars}>
								{bars === 0 ? m.from_level() : bars}
							</option>{/each}
					</select>
				</label>
				<label class="field">
					<span class="label">{m.metronome_label()}</span>
					<select
						value={prefs.metronome}
						onchange={(e) =>
							update({ metronome: e.currentTarget.value as RhythmPrefs['metronome'] })}
					>
						<option value="on">{m.metronome_on()}</option>
						<option value="off">{m.metronome_off_count_in()}</option>
						<option value="random-mute">{m.metronome_random_mute()}</option>
					</select>
				</label>
				<label class="field">
					<span class="label">{m.subdivision_label()}</span>
					<select
						value={prefs.subdivision}
						onchange={(e) => update({ subdivision: Number(e.currentTarget.value) })}
					>
						<option value={1}>{m.subdivision_beats()}</option>
						<option value={2}>{m.subdivision_eighths()}</option>
						<option value={3}>{m.subdivision_triplets()}</option>
					</select>
				</label>
				<label class="field inline">
					<input
						type="checkbox"
						checked={prefs.twoAndFour}
						onchange={(e) => update({ twoAndFour: e.currentTarget.checked })}
					/>
					<span>{m.accent_two_and_four()}</span>
				</label>
			{:else}
				<label class="field">
					<span class="label">{m.ratio_label()}</span>
					<select value={prefs.ratio} onchange={(e) => update({ ratio: e.currentTarget.value })}>
						{#each RATIO_OPTIONS as option (option)}<option value={option}>
								{option === 'level' ? m.from_level() : option}
							</option>{/each}
					</select>
				</label>
				<label class="field">
					<span class="label">{m.poly_sound_label()}</span>
					<select value={prefs.sound} onchange={(e) => update({ sound: e.currentTarget.value })}>
						<option value="both">{m.poly_sound_both()}</option>
						<option value="a">{m.poly_sound_a()}</option>
						<option value="b">{m.poly_sound_b()}</option>
						<option value="downbeat">{m.poly_sound_downbeat()}</option>
					</select>
				</label>
				<label class="field inline">
					<input
						type="checkbox"
						checked={prefs.composite}
						onchange={(e) => update({ composite: e.currentTarget.checked })}
					/>
					<span>{m.show_composite()}</span>
				</label>
				<label class="field inline">
					<input
						type="checkbox"
						checked={prefs.modulation}
						onchange={(e) => update({ modulation: e.currentTarget.checked })}
					/>
					<span>{m.metric_modulation()}</span>
				</label>
			{/if}
			<label class="field">
				<span class="label">{m.tempo_label_level()}</span>
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
			<button type="button" class="primary" onclick={() => start()}>{m.action_start()}</button>
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
