import { afterNavigate, replaceState } from '$app/navigation';

const PARAM = 'resume';

/** Added to a module's address by Continue, to start an exercise straight away. */
export const RESUME_QUERY = PARAM;

/**
 * Registers `start` to run when the page was opened from Continue. Call during component
 * setup. The flag is removed from the address so a reload or Back lands on the setup.
 */
export function onResume(start: () => void): void {
	afterNavigate(() => {
		const url = new URL(location.href);
		if (!url.searchParams.has(PARAM)) return;
		url.searchParams.delete(PARAM);
		// The current page's own (already resolved) address, minus the flag.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void replaceState(url, {});
		start();
	});
}
