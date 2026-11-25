import { m } from '#lib/i18n.ts';

export interface PolyrhythmCycle {
	a: number;
	b: number;
	length: number;
	onsetsA: number[];
	onsetsB: number[];
	composite: { position: number; parts: ('a' | 'b')[] }[];
}

const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));
export const lcm = (x: number, y: number): number => (x * y) / gcd(x, y);

export function polyrhythm(a: number, b: number): PolyrhythmCycle {
	if (a < 1 || b < 1) throw new Error('Polyrhythm parts must have at least one beat');
	const length = lcm(a, b);
	const onsetsA = Array.from({ length: a }, (_, i) => (i * length) / a);
	const onsetsB = Array.from({ length: b }, (_, i) => (i * length) / b);
	const positions = [...new Set([...onsetsA, ...onsetsB])].sort((x, y) => x - y);
	const composite = positions.map((position) => ({
		position,
		parts: [
			...(onsetsA.includes(position) ? (['a'] as const) : []),
			...(onsetsB.includes(position) ? (['b'] as const) : [])
		]
	}));
	return { a, b, length, onsetsA, onsetsB, composite };
}

export const onsetFractions = (onsets: readonly number[], length: number): number[] =>
	onsets.map((onset) => onset / length);

export interface MetricModulation {
	readonly label: string;
	readonly ratio: number;
}

const modulation = (label: () => string, ratio: number): MetricModulation => ({
	get label() {
		return label();
	},
	ratio
});

export const METRIC_MODULATIONS: readonly MetricModulation[] = [
	modulation(m.modulation_dotted_quarter_to_quarter, 2 / 3),
	modulation(m.modulation_quarter_to_dotted_quarter, 3 / 2),
	modulation(m.modulation_triplet_eighth_to_eighth, 3 / 2),
	modulation(m.modulation_eighth_to_triplet_eighth, 2 / 3),
	modulation(m.modulation_quarter_to_half, 1 / 2),
	modulation(m.modulation_triplet_quarter_to_quarter, 3 / 2),
	modulation(m.modulation_quintuplet_to_sixteenth, 5 / 4)
];

export const modulatedTempo = (bpm: number, modulation: MetricModulation): number =>
	Math.round(bpm * modulation.ratio);
