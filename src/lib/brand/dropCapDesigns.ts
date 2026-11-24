import type { PoseName } from './dolphinPoses';

export type Extra =
	| { kind: 'waves'; y: number }
	| { kind: 'bubbles'; points: readonly (readonly [number, number, number])[] }
	| { kind: 'segno-dots' }
	| { kind: 'splash'; x: number; y: number; angle: number };

export interface DolphinPlacement {
	pose: PoseName;
	transform?: string;
}

export interface DropCapDesign {
	idea: string;
	dolphins: readonly DolphinPlacement[];
	extras: readonly Extra[];
}

const MIRROR = 'translate(100 0) scale(-1 1)';
const FLIP = 'translate(0 100) scale(1 -1)';
const small = (x: number, y: number, s: number, mirror = false): string =>
	`translate(${x} ${y}) scale(${mirror ? -s : s} ${s})`;

const rising = (x: number, y: number): Extra => ({
	kind: 'bubbles',
	points: [
		[x, y, 2.6],
		[x + 4, y - 7, 2],
		[x + 1, y - 13, 1.5]
	]
});

export const DROP_CAP_DESIGNS: Record<string, DropCapDesign> = {
	A: {
		idea: 'Leaps over the apex',
		dolphins: [{ pose: 'arc' }],
		extras: [{ kind: 'waves', y: 90 }]
	},
	B: {
		idea: 'The segno, bubbles either side',
		dolphins: [{ pose: 'segno' }],
		extras: [{ kind: 'segno-dots' }]
	},
	C: { idea: 'Circles inside the bowl', dolphins: [{ pose: 'ring' }], extras: [rising(48, 50)] },
	D: {
		idea: 'Hooks round the bowl',
		dolphins: [{ pose: 'hook', transform: MIRROR }],
		extras: [rising(20, 40)]
	},
	E: { idea: 'The segno', dolphins: [{ pose: 'segno' }], extras: [{ kind: 'segno-dots' }] },
	F: {
		idea: 'Swims along the top bar',
		dolphins: [{ pose: 'swim', transform: 'translate(0 -30)' }],
		extras: [{ kind: 'waves', y: 32 }]
	},
	G: {
		idea: 'Turns inside the spur',
		dolphins: [{ pose: 'ring', transform: MIRROR }],
		extras: [{ kind: 'splash', x: 70, y: 18, angle: -60 }]
	},
	H: {
		idea: 'Bridges the two stems',
		dolphins: [{ pose: 'arc', transform: small(5, 2, 0.9) }],
		extras: [{ kind: 'waves', y: 88 }]
	},
	I: { idea: 'Breaches straight up', dolphins: [{ pose: 'rise' }], extras: [rising(66, 30)] },
	J: { idea: 'Follows the hook', dolphins: [{ pose: 'hook' }], extras: [{ kind: 'waves', y: 92 }] },
	K: {
		idea: 'Dives off the arm',
		dolphins: [{ pose: 'dive', transform: MIRROR }],
		extras: [{ kind: 'splash', x: 82, y: 86, angle: 30 }]
	},
	L: {
		idea: 'Swims along the foot',
		dolphins: [{ pose: 'swim', transform: 'translate(4 28)' }],
		extras: [{ kind: 'waves', y: 94 }]
	},
	M: {
		idea: 'A pair leaping the peaks',
		dolphins: [
			{ pose: 'arc', transform: small(0, 8, 0.55) },
			{ pose: 'arc', transform: small(100, 8, 0.55, true) }
		],
		extras: [{ kind: 'waves', y: 90 }]
	},
	N: { idea: 'Dives down the diagonal', dolphins: [{ pose: 'dive' }], extras: [rising(70, 70)] },
	O: {
		idea: 'Swims round and round',
		dolphins: [{ pose: 'ring' }],
		extras: [{ kind: 'segno-dots' }]
	},
	P: {
		idea: 'Curls round the bowl',
		dolphins: [{ pose: 'hook', transform: small(0, 0, 0.92) }],
		extras: [rising(80, 60)]
	},
	Q: {
		idea: 'Circles, tail out as the tail',
		dolphins: [{ pose: 'ring', transform: 'rotate(25 50 50)' }],
		extras: [{ kind: 'splash', x: 84, y: 88, angle: 40 }]
	},
	R: {
		idea: 'Rises beside the leg',
		dolphins: [{ pose: 'rise', transform: MIRROR }],
		extras: [{ kind: 'waves', y: 90 }]
	},
	S: { idea: 'The segno itself', dolphins: [{ pose: 'segno' }], extras: [{ kind: 'segno-dots' }] },
	T: {
		idea: 'Balances on the crossbar',
		dolphins: [{ pose: 'swim', transform: `${MIRROR} translate(0 -34)` }],
		extras: [rising(20, 60)]
	},
	U: {
		idea: 'Rolls belly-up in the trough',
		dolphins: [{ pose: 'arc', transform: FLIP }],
		extras: [rising(50, 34)]
	},
	V: {
		idea: 'Two dive to meet at the point',
		dolphins: [
			{ pose: 'dive', transform: small(0, 0, 0.62) },
			{ pose: 'dive', transform: small(100, 0, 0.62, true) }
		],
		extras: [{ kind: 'splash', x: 50, y: 90, angle: 0 }]
	},
	W: {
		idea: 'A pod on the waves',
		dolphins: [
			{ pose: 'swim', transform: small(-4, 20, 0.6) },
			{ pose: 'swim', transform: small(40, 34, 0.6) }
		],
		extras: [{ kind: 'waves', y: 86 }]
	},
	X: {
		idea: 'Two dolphins crossing',
		dolphins: [{ pose: 'dive' }, { pose: 'dive', transform: MIRROR }],
		extras: []
	},
	Y: {
		idea: 'Breaches through the fork',
		dolphins: [{ pose: 'rise' }],
		extras: [{ kind: 'waves', y: 88 }]
	},
	Z: {
		idea: 'Zigzags down',
		dolphins: [{ pose: 'hook', transform: 'rotate(90 50 50)' }],
		extras: [rising(20, 26)]
	}
};

export const DEFAULT_DESIGN: DropCapDesign = DROP_CAP_DESIGNS.S;

export const designFor = (letter: string): DropCapDesign =>
	DROP_CAP_DESIGNS[letter.toUpperCase()] ?? DEFAULT_DESIGN;
