import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { defineTool, ok, okJson } from '../util.js';
import { dateToTimestamp, timestampToDate, shiftDate, diffDates, convertTimezone, FIXED_TZ_OFFSET } from '../../../src/lib/core/datetime';
import { CSS_UNITS, convertCssUnit, checkContrast, aspectRatio, heightFromWidth, widthFromHeight } from '../../../src/lib/core/frontend';

export function registerCalcTools(server: McpServer): void {
	defineTool(server, 'timestamp_convert', {
		title: 'Unix timestamp conversion',
		description: 'Convert a date string to a Unix timestamp (seconds), or a Unix timestamp (seconds or ms) to a readable date. The server runs in UTC, so dates without timezone are interpreted as UTC.',
		input: {
			mode: z.enum(['to_timestamp', 'from_timestamp']),
			value: z.string().max(100).describe('Date string (e.g. 2026-03-01 12:00) or Unix timestamp'),
		},
		run: ({ mode, value }) => {
			const res = mode === 'to_timestamp' ? dateToTimestamp(value) : timestampToDate(value);
			if (res === null) throw new Error(mode === 'to_timestamp' ? 'Invalid date' : 'Invalid timestamp');
			return ok(res);
		},
	});

	const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('YYYY-MM-DD');
	const timeField = z.string().regex(/^\d{2}:\d{2}$/).default('00:00').describe('HH:MM');
	const amount = z.number().int().min(-100000).max(100000).default(0);

	defineTool(server, 'date_add', {
		title: 'Add/subtract time from a date',
		description: 'Add or subtract years, months, days, hours, minutes and seconds. Result as YYYY-MM-DD HH:MM:SS.',
		input: {
			date: dateField, time: timeField,
			operation: z.enum(['add', 'subtract']).default('add'),
			years: amount, months: amount, days: amount, hours: amount, minutes: amount, seconds: amount,
		},
		run: ({ date, time, operation, years, months, days, hours, minutes, seconds }) => {
			const res = shiftDate(date, time, { years, months, days, hours, minutes, seconds }, operation === 'add' ? 1 : -1);
			if (res === null) throw new Error('Invalid date');
			return ok(res);
		},
	});

	defineTool(server, 'date_diff', {
		title: 'Difference between two dates',
		description: 'Absolute difference between two date-times as totals and an approximate y/m/d breakdown (365-day years, 30-day months).',
		input: { dateA: dateField, timeA: timeField, dateB: dateField, timeB: timeField },
		run: ({ dateA, timeA, dateB, timeB }) => {
			const d = diffDates(dateA, timeA, dateB, timeB);
			if (d === null) throw new Error('Invalid date');
			return okJson(d);
		},
	});

	defineTool(server, 'timezone_convert', {
		title: 'Convert between fixed UTC offsets',
		description: 'Convert date/time between fixed offsets (UTC/GMT, MEZ=+1, MESZ=+2 or any numeric offset -12..+12). No DST rules: choose MEZ or MESZ explicitly.',
		input: {
			date: dateField, time: timeField,
			from: z.string().describe('UTC, GMT, MEZ, MESZ or an offset like +5 / -8'),
			to: z.string().describe('UTC, GMT, MEZ, MESZ or an offset like +5 / -8'),
		},
		run: ({ date, time, from, to }) => {
			const offset = (v: string) => {
				const key = v.trim().toUpperCase();
				if (key === 'GMT') return 0;
				if (key in FIXED_TZ_OFFSET) return FIXED_TZ_OFFSET[key];
				const n = Number(v);
				if (!Number.isInteger(n) || n < -12 || n > 12) throw new Error(`Unknown timezone/offset: ${v}`);
				return n;
			};
			const res = convertTimezone(date, time, offset(from), offset(to), to.trim().toUpperCase());
			if (res === null) throw new Error('Invalid date');
			return ok(res);
		},
	});

	defineTool(server, 'css_unit_convert', {
		title: 'Convert CSS units',
		description: 'Convert a CSS length between px, rem, em, pt, %, vw and vh.',
		input: {
			value: z.number(),
			unit: z.enum(CSS_UNITS),
			baseFontSize: z.number().positive().default(16),
			viewportWidth: z.number().positive().default(1440),
			viewportHeight: z.number().positive().default(900),
		},
		run: ({ value, unit, baseFontSize, viewportWidth, viewportHeight }) =>
			okJson(Object.fromEntries(
				convertCssUnit(String(value), unit, { baseFontSize, viewportW: viewportWidth, viewportH: viewportHeight })
					.map(r => [r.unit, r.value + r.unit])
			)),
	});

	defineTool(server, 'color_contrast', {
		title: 'WCAG color contrast',
		description: 'Contrast ratio of two colors (hex or rgb()) with WCAG AA/AAA pass flags for normal and large text.',
		input: { foreground: z.string().max(50), background: z.string().max(50) },
		run: ({ foreground, background }) => {
			const r = checkContrast(foreground, background);
			if (!r) throw new Error('Could not parse colors (use #rgb, #rrggbb or rgb(r, g, b))');
			return okJson({ ...r, ratio: Math.round(r.ratio * 100) / 100 });
		},
	});

	defineTool(server, 'aspect_ratio', {
		title: 'Aspect ratio calculator',
		description: 'Reduce width×height to a ratio (e.g. 1920×1080 → 16:9), or compute the missing side for a given ratio.',
		input: {
			width: z.number().positive().optional(),
			height: z.number().positive().optional(),
			ratioW: z.number().positive().optional().describe('Target ratio width, e.g. 16'),
			ratioH: z.number().positive().optional().describe('Target ratio height, e.g. 9'),
		},
		run: ({ width, height, ratioW, ratioH }) => {
			const out: Record<string, unknown> = {};
			if (width && height) out.ratio = aspectRatio(width, height);
			if (ratioW && ratioH) {
				if (width) out.heightForWidth = heightFromWidth(width, ratioW, ratioH);
				if (height) out.widthForHeight = widthFromHeight(height, ratioW, ratioH);
			}
			if (Object.keys(out).length === 0) throw new Error('Give width and height, or ratioW/ratioH together with width or height');
			return okJson(out);
		},
	});
}
