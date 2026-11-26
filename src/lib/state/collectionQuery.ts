const OFF = new Set(['off', '0', 'false', 'no']);

/**
 * Whether the page's query string turns collection mode on (`?collect`) or off (`?collect=off`).
 * `?debug` is the older spelling. Without either, the stored choice stands.
 */
export function collectionFromQuery(search: string, current: boolean): boolean {
	const params = new URLSearchParams(search);
	const value = params.get('collect') ?? params.get('debug');
	return value === null ? current : !OFF.has(value.toLowerCase());
}
