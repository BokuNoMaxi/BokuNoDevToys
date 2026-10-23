export interface RGB { r: number; g: number; b: number; }

export interface ColorData {
	hex: string;
	rgb: string;
	hsl: string;
	hsv: string;
	cmyk: string;
}

const CSS_NAMES: Record<string, string> = {
	red:'#ff0000',green:'#008000',blue:'#0000ff',white:'#ffffff',black:'#000000',
	yellow:'#ffff00',cyan:'#00ffff',magenta:'#ff00ff',orange:'#ffa500',purple:'#800080',
	pink:'#ffc0cb',lime:'#00ff00',navy:'#000080',teal:'#008080',silver:'#c0c0c0',gray:'#808080',
	grey:'#808080',violet:'#ee82ee',indigo:'#4b0082',maroon:'#800000',olive:'#808000',
};

export function parseToRgb(raw: string): RGB | null {
	const s = raw.trim().toLowerCase();

	if (CSS_NAMES[s]) return hexToRgb(CSS_NAMES[s]);

	const hex3 = s.match(/^#?([0-9a-f]{3})$/i);
	if (hex3) {
		const [r, g, b] = hex3[1].split('').map(c => parseInt(c + c, 16));
		return { r, g, b };
	}
	const hex6 = s.match(/^#?([0-9a-f]{6})$/i);
	if (hex6) return hexToRgb('#' + hex6[1]);

	const rgb = s.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
	if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };

	const hsl = s.match(/^hsla?\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%/);
	if (hsl) return hslToRgb(+hsl[1], +hsl[2] / 100, +hsl[3] / 100);

	const hsv = s.match(/^hsv\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%/);
	if (hsv) return hsvToRgb(+hsv[1], +hsv[2] / 100, +hsv[3] / 100);

	const cmyk = s.match(/^cmyk\(([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)%/);
	if (cmyk) return cmykToRgb(+cmyk[1] / 100, +cmyk[2] / 100, +cmyk[3] / 100, +cmyk[4] / 100);

	return null;
}

export function hexToRgb(hex: string): RGB | null {
	const m = hex.match(/^#([0-9a-f]{6})$/i);
	if (!m) return null;
	return { r: parseInt(m[1].slice(0,2),16), g: parseInt(m[1].slice(2,4),16), b: parseInt(m[1].slice(4,6),16) };
}

export function hslToRgb(h: number, s: number, l: number): RGB {
	const a = s * Math.min(l, 1 - l);
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
	};
	return { r: Math.round(f(0)*255), g: Math.round(f(8)*255), b: Math.round(f(4)*255) };
}

export function hsvToRgb(h: number, s: number, v: number): RGB {
	let r = 0, g = 0, b = 0;
	const i = Math.floor(h / 60) % 6;
	const f = h / 60 - Math.floor(h / 60);
	const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
	if (i === 0) { r=v; g=t; b=p; } else if (i === 1) { r=q; g=v; b=p; }
	else if (i === 2) { r=p; g=v; b=t; } else if (i === 3) { r=p; g=q; b=v; }
	else if (i === 4) { r=t; g=p; b=v; } else { r=v; g=p; b=q; }
	return { r: Math.round(r*255), g: Math.round(g*255), b: Math.round(b*255) };
}

export function cmykToRgb(c: number, m: number, y: number, k: number): RGB {
	return {
		r: Math.round(255 * (1 - c) * (1 - k)),
		g: Math.round(255 * (1 - m) * (1 - k)),
		b: Math.round(255 * (1 - y) * (1 - k)),
	};
}

export function rgbToHex({ r, g, b }: RGB): string {
	return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

export function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
	r /= 255; g /= 255; b /= 255;
	const max = Math.max(r, g, b), min = Math.min(r, g, b);
	let h = 0, s = 0;
	const l = (max + min) / 2;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
		else if (max === g) h = ((b - r) / d + 2) / 6;
		else h = ((r - g) / d + 4) / 6;
	}
	return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function rgbToHsv({ r, g, b }: RGB): { h: number; s: number; v: number } {
	r /= 255; g /= 255; b /= 255;
	const max = Math.max(r, g, b), min = Math.min(r, g, b);
	const v = max, d = max - min;
	const s = max === 0 ? 0 : d / max;
	let h = 0;
	if (max !== min) {
		if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
		else if (max === g) h = ((b - r) / d + 2) / 6;
		else h = ((r - g) / d + 4) / 6;
	}
	return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

export function rgbToCmyk({ r, g, b }: RGB): { c: number; m: number; y: number; k: number } {
	const rr = r / 255, gg = g / 255, bb = b / 255;
	const k = 1 - Math.max(rr, gg, bb);
	if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
	return {
		c: Math.round((1 - rr - k) / (1 - k) * 100),
		m: Math.round((1 - gg - k) / (1 - k) * 100),
		y: Math.round((1 - bb - k) / (1 - k) * 100),
		k: Math.round(k * 100),
	};
}

export function convertColor(input: string): ColorData | null {
	const rgb = parseToRgb(input);
	if (!rgb) return null;
	const hsl = rgbToHsl(rgb);
	const hsv = rgbToHsv(rgb);
	const cmyk = rgbToCmyk(rgb);
	return {
		hex: rgbToHex(rgb),
		rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
		hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
		hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
		cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
	};
}
