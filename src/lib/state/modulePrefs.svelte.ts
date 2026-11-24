import { isRecord, mergeDefaults, readStored, writeStored } from './persisted';

export type ModuleId = 'sight-reading' | 'rhythm' | 'theory' | 'ear';

export const MODULE_ROUTES = {
	'sight-reading': '/sight-reading',
	rhythm: '/rhythm',
	theory: '/theory',
	ear: '/ear'
} as const satisfies Record<ModuleId, string>;

export interface ContinueEntry {
	module: ModuleId;
	summary: string;
}

const isContinueEntry = (value: unknown): value is ContinueEntry =>
	isRecord(value) &&
	typeof value.module === 'string' &&
	value.module in MODULE_ROUTES &&
	typeof value.summary === 'string';

class ContinueStore {
	entry = $state<ContinueEntry | null>(
		readStored<ContinueEntry | null>(
			'continue',
			null,
			(v): v is ContinueEntry | null => v === null || isContinueEntry(v)
		)
	);

	record(entry: ContinueEntry): void {
		this.entry = entry;
		writeStored('continue', entry);
	}
}

export const continueStore = new ContinueStore();

export function loadModulePrefs<T extends Record<string, unknown>>(
	module: ModuleId,
	defaults: T
): T {
	return mergeDefaults(defaults, readStored(`prefs:${module}`, {}, isRecord));
}

export function saveModulePrefs(module: ModuleId, prefs: Record<string, unknown>): void {
	writeStored(`prefs:${module}`, prefs);
}
