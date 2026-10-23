export interface ErrorGroup {
	normalized: string;
	level: string;
	count: number;
	example: string;
}

export function parseLine(line: string): { level: string; message: string } | null {
	if (!line.trim()) return null;
	// Skip stack trace lines
	if (/^(\s+#\d+|\s+Stack trace:|\s+thrown in)/.test(line)) return null;

	let m: RegExpMatchArray | null;

	// Apache error: [timestamp] [level:subtype] [pid N] [client IP:port] message
	m = line.match(/^\[.*?\]\s+\[(\w+)(?::\w+)?\](?:\s+\[pid \d+\])?(?:\s+\[client [\d.:\[\]]+\])?\s*(.+)/);
	if (m) return { level: m[1].toLowerCase(), message: m[2].trim() };

	// Nginx error: YYYY/MM/DD HH:MM:SS [level] PID#TID: [*reqid] message
	m = line.match(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} \[(\w+)\] \d+#\d+: (?:\*\d+ )?(.+)/);
	if (m) return { level: m[1].toLowerCase(), message: m[2].trim() };

	// PHP error: [DD-Mon-YYYY HH:MM:SS UTC] PHP Level: message
	m = line.match(/^\[\d{2}-\w{3}-\d{4} \d{2}:\d{2}:\d{2}(?: \w+)?\] PHP (\w+(?: \w+)*): (.+)/);
	if (m) {
		const lvl = m[1].toLowerCase();
		return {
			level: lvl.includes('fatal') || lvl.includes('error') ? 'error' : lvl.includes('warn') ? 'warn' : 'notice',
			message: m[2].trim()
		};
	}

	// Syslog: Mon DD HH:MM:SS host service[pid]: message
	m = line.match(/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\S+\s+\S+:\s*(.+)/i);
	if (m) return { level: 'info', message: m[1].trim() };

	// ISO timestamp + optional level
	m = line.match(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?\s+(?:\[?(\w+)\]?\s+)?(.+)/);
	if (m) return { level: (m[1] || 'info').toLowerCase(), message: m[2].trim() };

	return { level: 'unknown', message: line.trim() };
}

export function normalize(msg: string): string {
	return msg
		.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?\b/g, '{IP}')
		.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '{UUID}')
		.replace(/\*\d+\b/g, '*{N}')
		.replace(/\bpid \d+/gi, 'pid {N}')
		.replace(/\bport \d+/gi, 'port {N}')
		.replace(/\bon line \d+/gi, 'on line {N}')
		.replace(/\bin \/\S+ on line \d+/gi, 'in {FILE} on line {N}')
		.replace(/(?<![a-zA-Z]):\d{2,5}\b/g, ':{PORT}')
		.replace(/\b[0-9a-f]{16,}\b/gi, '{HEX}')
		.replace(/\b\d{10,}\b/g, '{ID}')
		.trim();
}

export function levelPriority(level: string): number {
	const p: Record<string, number> = {
		error: 0, fatal: 0, crit: 1, alert: 1, emerg: 1,
		warn: 2, warning: 2, notice: 3, info: 4, debug: 5, unknown: 6
	};
	return p[level] ?? 6;
}

export function analyzeErrorLog(text: string): { groups: ErrorGroup[]; totalLines: number } {
	const lines = text.split('\n');
	const totalLines = lines.filter(l => l.trim()).length;
	const map = new Map<string, ErrorGroup>();

	for (const line of lines) {
		const parsed = parseLine(line);
		if (!parsed) continue;
		const key = normalize(parsed.message);
		if (!key) continue;
		const existing = map.get(key);
		if (existing) {
			existing.count++;
		} else {
			map.set(key, { normalized: key, level: parsed.level, count: 1, example: line.trim() });
		}
	}

	const groups = [...map.values()].sort((a, b) => {
		const lp = levelPriority(a.level) - levelPriority(b.level);
		return lp !== 0 ? lp : b.count - a.count;
	});
	return { groups, totalLines };
}

export function errorGroupsToText(groups: ErrorGroup[]): string {
	return groups.map(g => `[${g.level.toUpperCase()}] (${g.count}×) ${g.normalized}`).join('\n');
}
