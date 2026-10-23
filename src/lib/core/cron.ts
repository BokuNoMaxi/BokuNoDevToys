function matches(val: string, n: number): boolean {
	if (val === '*') return true;
	if (val.startsWith('*/')) { const step = parseInt(val.slice(2)); return n % step === 0; }
	if (val.includes(',')) return val.split(',').some(v => parseInt(v) === n);
	if (val.includes('-')) { const [a, b] = val.split('-').map(Number); return n >= a && n <= b; }
	return parseInt(val) === n;
}

/** Nächste Ausführungszeitpunkte (lokale Zeit) eines 5-Felder-Cron-Ausdrucks. */
export function cronNextRuns(expression: string, count = 5, from: Date = new Date()): Date[] {
	const [m, h, d, mo, wd] = expression.trim().split(/\s+/);
	if (!wd) throw new Error('Cron-Ausdruck braucht 5 Felder: Minute Stunde Tag Monat Wochentag');
	const results: Date[] = [];
	const candidate = new Date(from);
	candidate.setSeconds(0, 0);
	candidate.setMinutes(candidate.getMinutes() + 1);

	let iterations = 0;
	while (results.length < count && iterations < 527040) {
		iterations++;
		if (matches(mo, candidate.getMonth() + 1) && matches(d, candidate.getDate()) &&
			matches(wd, candidate.getDay()) && matches(h, candidate.getHours()) && matches(m, candidate.getMinutes())) {
			results.push(new Date(candidate));
		}
		candidate.setMinutes(candidate.getMinutes() + 1);
	}
	return results;
}
