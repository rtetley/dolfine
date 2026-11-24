export interface Rng {
	readonly seed: number;
	next(): number;
	int(min: number, max: number): number;
	pick<T>(items: readonly T[]): T;
	chance(probability: number): boolean;
	shuffle<T>(items: readonly T[]): T[];
	weighted<T>(entries: readonly (readonly [T, number])[]): T;
}

export function createRng(seed: number): Rng {
	let state = seed >>> 0;

	const next = (): number => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};

	const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));

	const pick = <T>(items: readonly T[]): T => {
		if (items.length === 0) throw new Error('Cannot pick from an empty list');
		return items[int(0, items.length - 1)];
	};

	const shuffle = <T>(items: readonly T[]): T[] => {
		const copy = [...items];
		for (let i = copy.length - 1; i > 0; i--) {
			const j = int(0, i);
			[copy[i], copy[j]] = [copy[j], copy[i]];
		}
		return copy;
	};

	const weighted = <T>(entries: readonly (readonly [T, number])[]): T => {
		const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
		if (total <= 0) throw new Error('Weights must sum to a positive number');
		let roll = next() * total;
		for (const [value, weight] of entries) {
			roll -= weight;
			if (roll < 0) return value;
		}
		return (entries.at(-1) as readonly [T, number])[0];
	};

	return {
		seed,
		next,
		int,
		pick,
		chance: (probability) => next() < probability,
		shuffle,
		weighted
	};
}

export const newSeed = (): number => Math.floor(Math.random() * 2 ** 32);
