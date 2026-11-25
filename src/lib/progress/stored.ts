import { isRecord } from '#lib/state/persisted.ts';
import { ACHIEVEMENTS } from './achievements';
import {
	emptyProgress,
	isLevel,
	type LevelRecord,
	type ProgressState,
	TRACKS,
	type TrackProgress,
	UNLOCK_WINDOW
} from './ladder';

const count = (value: unknown): number =>
	typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isDay = (value: unknown): value is string => typeof value === 'string' && DAY.test(value);

function readLevelRecord(value: unknown): LevelRecord | null {
	if (!isRecord(value)) return null;
	const recent = Array.isArray(value.recent)
		? value.recent.filter((x): x is boolean => typeof x === 'boolean').slice(-UNLOCK_WINDOW)
		: [];
	const answered = Math.max(count(value.answered), recent.length);
	return { recent, answered, correct: Math.min(count(value.correct), answered) };
}

function readTrack(value: unknown): TrackProgress | null {
	if (!isRecord(value)) return null;
	const levels: TrackProgress['levels'] = {};
	if (isRecord(value.levels)) {
		for (const [key, raw] of Object.entries(value.levels)) {
			const level = Number(key);
			const record = readLevelRecord(raw);
			if (isLevel(level) && record) levels[level] = record;
		}
	}
	return { unlocked: isLevel(value.unlocked) ? value.unlocked : 1, levels };
}

/**
 * Rebuilds a progress state from whatever was stored, keeping every valid part and dropping
 * the rest, so a corrupt or older save never costs the student all of their progress.
 */
export function readProgress(value: unknown): ProgressState {
	const state = emptyProgress();
	if (!isRecord(value)) return state;
	state.xp = count(value.xp);
	state.answered = count(value.answered);
	state.correct = Math.min(count(value.correct), state.answered);
	state.run = count(value.run);
	state.bestRun = Math.max(count(value.bestRun), state.run);
	state.days = Array.isArray(value.days) ? [...new Set(value.days.filter(isDay))].sort() : [];
	if (isRecord(value.tracks)) {
		for (const track of TRACKS) {
			const parsed = readTrack(value.tracks[track]);
			if (parsed) state.tracks[track] = parsed;
		}
	}
	if (isRecord(value.achievements)) {
		for (const id of ACHIEVEMENTS) {
			const day = value.achievements[id];
			if (isDay(day)) state.achievements[id] = day;
		}
	}
	return state;
}
