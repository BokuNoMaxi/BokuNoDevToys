// ── CSS-Einheiten ───────────────────────────────────────────────────────
export const CSS_UNITS = ['px', 'rem', 'em', 'pt', '%', 'vw', 'vh'] as const;

export interface UnitContext { baseFontSize: number; viewportW: number; viewportH: number; }

export function toPx(val: number, unit: string, c: UnitContext): number {
	switch (unit) {
		case 'px':  return val;
		case 'rem': return val * c.baseFontSize;
		case 'em':  return val * c.baseFontSize;
		case 'pt':  return val * (96 / 72);
		case '%':   return val * c.baseFontSize / 100;
		case 'vw':  return val * c.viewportW / 100;
		case 'vh':  return val * c.viewportH / 100;
		default:    return val;
	}
}

export function fromPx(px: number, unit: string, c: UnitContext): string {
	let r: number;
	switch (unit) {
		case 'px':  r = px; break;
		case 'rem': r = px / c.baseFontSize; break;
		case 'em':  r = px / c.baseFontSize; break;
		case 'pt':  r = px * (72 / 96); break;
		case '%':   r = px / c.baseFontSize * 100; break;
		case 'vw':  r = px / c.viewportW * 100; break;
		case 'vh':  r = px / c.viewportH * 100; break;
		default:    r = px;
	}
	return r.toFixed(4).replace(/\.?0+$/, '');
}

export function convertCssUnit(value: string, unit: string, c: UnitContext): { unit: string; value: string }[] {
	const num = parseFloat(value);
	if (isNaN(num) || value.trim() === '') return [];
	const px = toPx(num, unit, c);
	return CSS_UNITS.map(u => ({ unit: u, value: u === unit ? value : fromPx(px, u, c) }));
}

// ── Farbkontrast (WCAG) ─────────────────────────────────────────────────
export function parseHex(raw: string): [number, number, number] | null {
	const s = raw.trim().replace('#', '');
	if (s.length === 3) {
		const [r, g, b] = s.split('').map(c => parseInt(c + c, 16));
		return [r, g, b];
	}
	if (s.length === 6) {
		return [parseInt(s.slice(0,2),16), parseInt(s.slice(2,4),16), parseInt(s.slice(4,6),16)];
	}
	const m = raw.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
	if (m) return [+m[1], +m[2], +m[3]];
	return null;
}

function sRGB(c: number): number {
	const v = c / 255;
	return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function luminance(r: number, g: number, b: number): number {
	return 0.2126 * sRGB(r) + 0.7152 * sRGB(g) + 0.0722 * sRGB(b);
}

export function contrastRatio(l1: number, l2: number): number {
	const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
	return (light + 0.05) / (dark + 0.05);
}

export interface ContrastResult {
	ratio: number;
	aaLarge: boolean;
	aaNormal: boolean;
	aaaLarge: boolean;
	aaaNormal: boolean;
}

export function checkContrast(fgInput: string, bgInput: string): ContrastResult | null {
	const fg = parseHex(fgInput);
	const bg = parseHex(bgInput);
	if (!fg || !bg) return null;
	const ratio = contrastRatio(luminance(...fg), luminance(...bg));
	return {
		ratio,
		aaLarge:   ratio >= 3,
		aaNormal:  ratio >= 4.5,
		aaaLarge:  ratio >= 4.5,
		aaaNormal: ratio >= 7,
	};
}

// ── Seitenverhältnis ────────────────────────────────────────────────────
export const ASPECT_PRESETS = [
	{ label: '16:9',  w: 16, h: 9  },
	{ label: '4:3',   w: 4,  h: 3  },
	{ label: '1:1',   w: 1,  h: 1  },
	{ label: '3:2',   w: 3,  h: 2  },
	{ label: '21:9',  w: 21, h: 9  },
	{ label: '9:16',  w: 9,  h: 16 },
	{ label: '2:1',   w: 2,  h: 1  },
	{ label: '5:4',   w: 5,  h: 4  },
];

export function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

export function aspectRatio(width: number, height: number): { w: number; h: number; name: string | null } | null {
	if (!width || !height) return null;
	const g = gcd(width, height);
	const w = width / g, h = height / g;
	return { w, h, name: ASPECT_PRESETS.find(p => p.w === w && p.h === h)?.label ?? null };
}

export function heightFromWidth(width: number, ratioW: number, ratioH: number): number | null {
	if (!isNaN(width) && width > 0 && ratioW && ratioH) return Math.round((width * ratioH) / ratioW);
	return null;
}

export function widthFromHeight(height: number, ratioW: number, ratioH: number): number | null {
	if (!isNaN(height) && height > 0 && ratioW && ratioH) return Math.round((height * ratioW) / ratioH);
	return null;
}
