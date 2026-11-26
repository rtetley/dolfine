import { isRecord, readStored, writeStored } from './persisted';
import { MODULE_ROUTES, type ModuleId } from './modulePrefs.svelte';

export type TourState = 'pending' | 'done';

export interface OnboardingState {
	/** The app tour: offered once on the dashboard, then only from Settings. */
	tour: TourState;
	/** Modules whose first-visit introduction the student has put away. */
	seen: ModuleId[];
}

const KEY = 'onboarding';
const FRESH: OnboardingState = { tour: 'pending', seen: [] };

const isModule = (value: unknown): value is ModuleId =>
	typeof value === 'string' && value in MODULE_ROUTES;

export function readOnboarding(value: unknown): OnboardingState {
	if (!isRecord(value)) return { ...FRESH, seen: [] };
	return {
		tour: value.tour === 'done' ? 'done' : 'pending',
		seen: Array.isArray(value.seen)
			? value.seen.filter((v, i, all): v is ModuleId => isModule(v) && all.indexOf(v) === i)
			: []
	};
}

const isAnything = (value: unknown): value is unknown => value !== undefined;

/**
 * Where the student is in onboarding. Kept in this browser until accounts exist; then it
 * belongs with the rest of the student's profile.
 */
class OnboardingStore {
	state = $state<OnboardingState>(readOnboarding(readStored<unknown>(KEY, null, isAnything)));

	get tourPending(): boolean {
		return this.state.tour === 'pending';
	}

	finishTour(): void {
		this.save({ ...this.state, tour: 'done' });
	}

	replayTour(): void {
		this.save({ ...this.state, tour: 'pending' });
	}

	hasSeen(module: ModuleId): boolean {
		return this.state.seen.includes(module);
	}

	markSeen(module: ModuleId): void {
		if (!this.hasSeen(module)) this.save({ ...this.state, seen: [...this.state.seen, module] });
	}

	showIntroAgain(module: ModuleId): void {
		this.save({ ...this.state, seen: this.state.seen.filter((m) => m !== module) });
	}

	resetIntros(): void {
		this.save({ ...this.state, seen: [] });
	}

	private save(next: OnboardingState): void {
		this.state = next;
		writeStored(KEY, next);
	}
}

export const onboarding = new OnboardingStore();
