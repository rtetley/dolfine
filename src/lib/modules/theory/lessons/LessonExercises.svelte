<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import DrillButton from '#lib/components/DrillButton.svelte';
	import { m } from '#lib/i18n.ts';
	import { drillStanding, trackOf } from '#lib/progress/ladder.ts';
	import { progress } from '#lib/state/progress.svelte.ts';
	import { THEORY_EXERCISE_LABELS } from '../exerciseLabels';
	import { lessonExercises, lessonLevel } from '../lessonPlan';
	import type { LessonId } from '../lessons';
	import type { TheoryExercise } from '../questions';

	interface Props {
		lesson: LessonId;
	}

	let { lesson }: Props = $props();

	const level = $derived(lessonLevel(lesson));
	const track = $derived(trackOf(progress.state, 'theory'));

	/** The colour lessons are practised by ear: the chord colours drill at the open ear level. */
	const byEar = $derived(lesson === 'chord-colours' || lesson === 'four-colours');

	function trainEar(): void {
		const query = new URLSearchParams({
			level: String(progress.unlocked('ear')),
			exercise: 'colours'
		});
		// The path is resolved; resolve() cannot express the query string.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(`${resolve('/ear')}?${query.toString()}`);
	}

	function practise(exercise: TheoryExercise): void {
		const query = new URLSearchParams({ level: String(level), exercise });
		// The path is resolved; resolve() cannot express the query string.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(`${resolve('/theory')}?${query.toString()}`);
	}
</script>

<p>{m.lesson_exercises_intro({ level })}</p>
<ul class="drills">
	{#each lessonExercises(lesson) as exercise (exercise)}
		<li>
			<DrillButton
				label={THEORY_EXERCISE_LABELS[exercise]}
				standing={drillStanding(track, level, exercise)}
				onpick={() => practise(exercise)}
			/>
		</li>
	{/each}
</ul>
{#if byEar}
	<p class="ear">
		<button type="button" class="primary" onclick={trainEar}>{m.lesson_colour_ear_link()}</button>
	</p>
{/if}

<style>
	.drills {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
