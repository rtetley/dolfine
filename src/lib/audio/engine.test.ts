import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chordVelocity } from './engine';
import { salamanderUrls } from './instruments';

describe('piano samples', () => {
	it('serves a file for every note the sampler maps, a minor third apart from A0 to C8', () => {
		const urls = salamanderUrls();
		expect(Object.keys(urls)).toHaveLength(30);
		for (const file of Object.values(urls)) {
			expect(existsSync(`static/samples/piano/${file}`), file).toBe(true);
		}
	});

	it('plays dense voicings softer so they stay clear of the limiter', () => {
		expect(chordVelocity(1)).toBe(0.85);
		expect(chordVelocity(3)).toBe(0.85);
		expect(chordVelocity(6)).toBeCloseTo(0.6, 2);
		expect(chordVelocity(6) * 6).toBeGreaterThan(chordVelocity(3) * 3);
	});
});
