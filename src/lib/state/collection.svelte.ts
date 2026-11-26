import { collectionFromQuery } from './collectionQuery';
import { readStored, writeStored } from './persisted';

const KEY = 'collect-mode';
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

/**
 * Collection mode saves every spoken set-up and reading to this computer's downloads, with the
 * labels the reader adds, to tune recognition and later train a model. Nothing is sent anywhere.
 */
class CollectionStore {
	on = $state(readStored(KEY, false, isBoolean));

	syncWithQuery(search: string): void {
		this.set(collectionFromQuery(search, this.on));
	}

	set(on: boolean): void {
		this.on = on;
		writeStored(KEY, on);
	}
}

export const collection = new CollectionStore();
