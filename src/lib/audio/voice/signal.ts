/** Short-time analysis of a mono recording at 16 kHz: loudness, voicing and MFCCs per frame. */

export const ANALYSIS_RATE = 16_000;
export const FRAME = 400;
export const HOP = 160;
const FFT_SIZE = 1024;
const MEL_BANDS = 26;
const MEL_LOW_HZ = 80;
const MEL_HIGH_HZ = 7600;
export const CEPSTRA = 12;
const MIN_LAG = ANALYSIS_RATE / 400;
const MAX_LAG = ANALYSIS_RATE / 80;

export interface Frames {
	energyDb: Float32Array;
	voicing: Float32Array;
	mfcc: Float32Array[];
}

export const frameTime = (frame: number): number => (frame * HOP + FRAME / 2) / ANALYSIS_RATE;

function lowPassKernel(cutoff: number, taps: number): Float32Array {
	const kernel = new Float32Array(taps);
	const middle = (taps - 1) / 2;
	let sum = 0;
	for (let i = 0; i < taps; i++) {
		const x = i - middle;
		const sinc = x === 0 ? 2 * cutoff : Math.sin(2 * Math.PI * cutoff * x) / (Math.PI * x);
		const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (taps - 1));
		kernel[i] = sinc * window;
		sum += kernel[i];
	}
	return kernel.map((value) => value / sum);
}

/** Low-pass filters below the new Nyquist, then interpolates linearly. */
export function resample(samples: Float32Array, from: number, to = ANALYSIS_RATE): Float32Array {
	if (from === to) return samples;
	const kernel = lowPassKernel((0.45 * Math.min(from, to)) / from, 31);
	const half = (kernel.length - 1) / 2;
	const filtered = new Float32Array(samples.length);
	for (let i = 0; i < samples.length; i++) {
		let acc = 0;
		for (let k = 0; k < kernel.length; k++) {
			const j = i + k - half;
			if (j >= 0 && j < samples.length) acc += samples[j] * kernel[k];
		}
		filtered[i] = acc;
	}
	const length = Math.floor((samples.length * to) / from);
	const out = new Float32Array(length);
	for (let i = 0; i < length; i++) {
		const position = (i * from) / to;
		const left = Math.floor(position);
		const right = Math.min(left + 1, filtered.length - 1);
		const fraction = position - left;
		out[i] = filtered[left] * (1 - fraction) + filtered[right] * fraction;
	}
	return out;
}

/** In-place iterative radix-2 FFT; `re.length` must be a power of two. */
export function fft(re: Float64Array, im: Float64Array, inverse = false): void {
	const n = re.length;
	for (let i = 1, j = 0; i < n; i++) {
		let bit = n >> 1;
		for (; j & bit; bit >>= 1) j ^= bit;
		j ^= bit;
		if (i < j) {
			[re[i], re[j]] = [re[j], re[i]];
			[im[i], im[j]] = [im[j], im[i]];
		}
	}
	for (let size = 2; size <= n; size <<= 1) {
		const angle = ((inverse ? 2 : -2) * Math.PI) / size;
		const stepRe = Math.cos(angle);
		const stepIm = Math.sin(angle);
		for (let start = 0; start < n; start += size) {
			let wRe = 1;
			let wIm = 0;
			for (let k = 0; k < size / 2; k++) {
				const a = start + k;
				const b = a + size / 2;
				const tRe = re[b] * wRe - im[b] * wIm;
				const tIm = re[b] * wIm + im[b] * wRe;
				re[b] = re[a] - tRe;
				im[b] = im[a] - tIm;
				re[a] += tRe;
				im[a] += tIm;
				[wRe, wIm] = [wRe * stepRe - wIm * stepIm, wRe * stepIm + wIm * stepRe];
			}
		}
	}
	if (inverse) {
		for (let i = 0; i < n; i++) {
			re[i] /= n;
			im[i] /= n;
		}
	}
}

const hzToMel = (hz: number): number => 2595 * Math.log10(1 + hz / 700);
const melToHz = (mel: number): number => 700 * (10 ** (mel / 2595) - 1);

function melFilters(): Float32Array[] {
	const bins = FFT_SIZE / 2 + 1;
	const low = hzToMel(MEL_LOW_HZ);
	const high = hzToMel(MEL_HIGH_HZ);
	const edges = Array.from({ length: MEL_BANDS + 2 }, (_, i) =>
		Math.round((melToHz(low + ((high - low) * i) / (MEL_BANDS + 1)) * FFT_SIZE) / ANALYSIS_RATE)
	);
	return Array.from({ length: MEL_BANDS }, (_, band) => {
		const filter = new Float32Array(bins);
		const [left, centre, right] = [edges[band], edges[band + 1], edges[band + 2]];
		for (let bin = left; bin <= right; bin++) {
			if (bin < centre) filter[bin] = (bin - left) / Math.max(centre - left, 1);
			else filter[bin] = (right - bin) / Math.max(right - centre, 1);
		}
		return filter;
	});
}

const HAMMING = Float64Array.from(
	{ length: FRAME },
	(_, i) => 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (FRAME - 1))
);
const FILTERS = melFilters();

/** The window's own autocorrelation, divided out so a long lag isn't penalised (Boersma, 1993). */
const WINDOW_CORRELATION = ((): Float64Array => {
	const re = new Float64Array(FFT_SIZE);
	const im = new Float64Array(FFT_SIZE);
	re.set(HAMMING);
	fft(re, im);
	for (let i = 0; i < FFT_SIZE; i++) {
		re[i] = re[i] ** 2 + im[i] ** 2;
		im[i] = 0;
	}
	fft(re, im, true);
	const zero = re[0];
	return re.map((value) => value / zero);
})();

function cepstra(power: Float64Array): Float32Array {
	const logMel = FILTERS.map((filter) => {
		let energy = 0;
		for (let bin = 0; bin < filter.length; bin++) energy += filter[bin] * power[bin];
		return Math.log(energy + 1e-10);
	});
	const out = new Float32Array(CEPSTRA);
	for (let c = 1; c <= CEPSTRA; c++) {
		let acc = 0;
		for (let band = 0; band < MEL_BANDS; band++) {
			acc += logMel[band] * Math.cos((Math.PI * c * (band + 0.5)) / MEL_BANDS);
		}
		out[c - 1] = acc;
	}
	return out;
}

export function analyseFrames(samples: Float32Array): Frames {
	const count = Math.max(0, Math.floor((samples.length - FRAME) / HOP) + 1);
	const energyDb = new Float32Array(count);
	const voicing = new Float32Array(count);
	const mfcc: Float32Array[] = [];
	const re = new Float64Array(FFT_SIZE);
	const im = new Float64Array(FFT_SIZE);
	for (let f = 0; f < count; f++) {
		re.fill(0);
		im.fill(0);
		let squares = 0;
		for (let i = 0; i < FRAME; i++) {
			const sample = samples[f * HOP + i];
			squares += sample * sample;
			re[i] = sample * HAMMING[i];
		}
		energyDb[f] = 10 * Math.log10(squares / FRAME + 1e-10);
		fft(re, im);
		const power = new Float64Array(FFT_SIZE / 2 + 1);
		for (let bin = 0; bin <= FFT_SIZE / 2; bin++) power[bin] = re[bin] ** 2 + im[bin] ** 2;
		mfcc.push(cepstra(power));
		for (let i = 0; i < FFT_SIZE; i++) {
			re[i] = re[i] ** 2 + im[i] ** 2;
			im[i] = 0;
		}
		fft(re, im, true);
		let best = 0;
		if (re[0] > 0) {
			for (let lag = MIN_LAG; lag <= MAX_LAG; lag++) {
				best = Math.max(best, re[lag] / re[0] / WINDOW_CORRELATION[lag]);
			}
		}
		voicing[f] = Math.min(best, 1);
	}
	return { energyDb, voicing, mfcc };
}
