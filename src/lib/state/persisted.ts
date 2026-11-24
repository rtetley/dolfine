const PREFIX = 'dolfine:';

export function readStored<T>(
	key: string,
	fallback: T,
	isValid: (value: unknown) => value is T
): T {
	try {
		const raw = globalThis.localStorage?.getItem(PREFIX + key);
		if (raw === null || raw === undefined) return fallback;
		const parsed: unknown = JSON.parse(raw);
		return isValid(parsed) ? parsed : fallback;
	} catch {
		return fallback;
	}
}

export function writeStored(key: string, value: unknown): void {
	try {
		globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify(value));
	} catch {
		// storage can be full or blocked (private mode); settings then last for the session only
	}
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

export function mergeDefaults<T extends Record<string, unknown>>(defaults: T, stored: unknown): T {
	if (!isRecord(stored)) return defaults;
	const merged: Record<string, unknown> = { ...defaults };
	for (const key of Object.keys(defaults)) {
		if (key in stored && typeof stored[key] === typeof defaults[key]) merged[key] = stored[key];
	}
	return merged as T;
}
