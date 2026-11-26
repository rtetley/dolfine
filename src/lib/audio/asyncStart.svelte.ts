/**
 * Guards a start that has to wait first (the audio engine loading, the microphone opening).
 * While one is pending, further starts are ignored, so a second click on a slow button doesn't
 * launch a second run. A start cancelled while it waits (the student stopped, or left the page)
 * never begins, so nothing keeps running in the background.
 */
export class AsyncStart {
	pending = $state(false);
	#generation = 0;

	/** Runs `prepare`, then `begin` unless cancelled meanwhile. Resolves to whether it began. */
	async run(prepare: () => Promise<unknown>, begin: () => void): Promise<boolean> {
		if (this.pending) return false;
		const mine = ++this.#generation;
		this.pending = true;
		try {
			await prepare();
		} finally {
			if (mine === this.#generation) this.pending = false;
		}
		if (mine !== this.#generation) return false;
		begin();
		return true;
	}

	/** Drops a pending start, and tells `isCurrent` callers their start is stale. */
	cancel(): void {
		this.#generation++;
		this.pending = false;
	}

	/** A token for starts with several waits: `isCurrent(token)` after each one. */
	token(): number {
		return ++this.#generation;
	}

	isCurrent(token: number): boolean {
		return token === this.#generation;
	}
}
