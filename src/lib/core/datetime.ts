function pad(n: number) { return String(n).padStart(2, '0'); }

export function formatLocal(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Datumstext → Unix-Timestamp (Sekunden); null bei ungültigem Datum. */
export function dateToTimestamp(input: string): string | null {
	const d = new Date(input);
	if (isNaN(d.getTime())) return null;
	return String(Math.floor(d.getTime() / 1000));
}

/** Unix-Timestamp (Sekunden oder Millisekunden) → Lokal/UTC; null bei ungültigem Wert. */
export function timestampToDate(input: string): string | null {
	const n = Number(input.trim());
	if (!input.trim() || isNaN(n)) return null;
	const ms = n < 1e12 ? n * 1000 : n;
	const d = new Date(ms);
	return `Local: ${formatLocal(d)}\nUTC:   ${d.toUTCString()}`;
}

export interface DateShift {
	years: number; months: number; days: number;
	hours: number; minutes: number; seconds: number;
}

/** Addiert (sign=1) bzw. subtrahiert (sign=-1) ein Intervall; null bei ungültigem Datum. */
export function shiftDate(date: string, time: string, shift: DateShift, sign: 1 | -1): string | null {
	const d = new Date(`${date}T${time || '00:00'}:00`);
	if (isNaN(d.getTime())) return null;
	d.setFullYear(d.getFullYear() + sign * shift.years);
	d.setMonth(d.getMonth() + sign * shift.months);
	d.setDate(d.getDate() + sign * shift.days);
	d.setHours(d.getHours() + sign * shift.hours);
	d.setMinutes(d.getMinutes() + sign * shift.minutes);
	d.setSeconds(d.getSeconds() + sign * shift.seconds);
	return formatLocal(d);
}

export interface DateDiff {
	bAfterA: boolean;
	totalDays: number; totalHours: number; totalMinutes: number; totalSeconds: number;
	years: number; months: number; days: number; hours: number; minutes: number; seconds: number;
}

export function diffDates(dateA: string, timeA: string, dateB: string, timeB: string): DateDiff | null {
	const a = new Date(`${dateA}T${timeA || '00:00'}:00`);
	const b = new Date(`${dateB}T${timeB || '00:00'}:00`);
	if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
	const ms = Math.abs(b.getTime() - a.getTime());
	const totalSeconds = Math.floor(ms / 1000);
	const totalMinutes = Math.floor(totalSeconds / 60);
	const totalHours = Math.floor(totalMinutes / 60);
	const totalDays = Math.floor(totalHours / 24);
	return {
		bAfterA: b >= a,
		totalDays, totalHours, totalMinutes, totalSeconds,
		years: Math.floor(totalDays / 365),
		months: Math.floor((totalDays % 365) / 30),
		days: totalDays % 365 % 30,
		hours: totalHours % 24,
		minutes: totalMinutes % 60,
		seconds: totalSeconds % 60,
	};
}

export const FIXED_TZ_OFFSET: Record<string, number> = { UTC: 0, MEZ: 1, MESZ: 2 };

/** Wandelt Datum/Zeit von einem festen UTC-Offset in einen anderen (Format dd.mm.yyyy hh:mm:ss). */
export function convertTimezone(
	date: string, time: string,
	fromOffset: number, toOffset: number, toLabel: string
): string | null {
	const toTz = toOffset === 0 ? 'UTC' : `Etc/GMT${toOffset > 0 ? -toOffset : '+' + Math.abs(toOffset)}`;
	const approxUtc = new Date(`${date}T${time || '00:00'}:00Z`);
	if (isNaN(approxUtc.getTime())) return null;
	const utcDate = new Date(approxUtc.getTime() - fromOffset * 3600000);
	const parts = new Intl.DateTimeFormat('de-DE', {
		timeZone: toTz,
		year: 'numeric', month: '2-digit', day: '2-digit',
		hour: '2-digit', minute: '2-digit', second: '2-digit',
		hour12: false,
	}).formatToParts(utcDate);
	const p: Record<string, string> = {};
	parts.forEach(({ type, value }) => { p[type] = value; });
	const sign = toOffset >= 0 ? '+' : '';
	return `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}:${p.second} ${toLabel}${sign}${toOffset}`;
}
