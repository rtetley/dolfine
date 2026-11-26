import type { Level } from '#lib/music/levels.ts';
import {
	emptyProgress,
	localDay,
	type ProgressState,
	type TrackId,
	trackOf
} from '#lib/progress/ladder.ts';
import { placeOnLevel, type ProgressEvent, recordAnswer } from '#lib/progress/record.ts';
import { readProgress } from '#lib/progress/stored.ts';
import { readStored, writeStored } from './persisted';
import { settings } from './settings.svelte';

const KEY = 'progress';

/**
 * The student's progress. There are no accounts yet, so it lives in this browser; when
 * accounts arrive, `load` and `save` are the two places that talk to the backend.
 */
class ProgressStore {
	state = $state<ProgressState>(load());
	/** Events from the latest answer, for the notice under the exercise. */
	lastEvents = $state<ProgressEvent[]>([]);

	/** The highest level the student may pick on a track, given the ladder setting. */
	unlocked(track: TrackId): Level {
		return settings.value.levelLadder === 'open' ? 10 : trackOf(this.state, track).unlocked;
	}

	record(track: TrackId, level: Level, exercise: string, correct: boolean): ProgressEvent[] {
		const { state, events } = recordAnswer(this.state, {
			track,
			level,
			exercise,
			correct,
			today: localDay()
		});
		this.state = state;
		this.lastEvents = events;
		save(state);
		return events;
	}

	/** Starts the student higher on some tracks (self-declared level); never lowers one. */
	place(tracks: readonly TrackId[], level: Level): void {
		this.state = tracks.reduce((state, track) => placeOnLevel(state, track, level), this.state);
		save(this.state);
	}

	clearEvents(): void {
		this.lastEvents = [];
	}

	reset(): void {
		this.state = emptyProgress();
		this.lastEvents = [];
		save(this.state);
	}
}

// readProgress does the validation, keeping whatever parts of the save are still good.
const isAnything = (value: unknown): value is unknown => value !== undefined;

function load(): ProgressState {
	return readProgress(readStored<unknown>(KEY, null, isAnything));
}

function save(state: ProgressState): void {
	writeStored(KEY, state);
}

export const progress = new ProgressStore();
