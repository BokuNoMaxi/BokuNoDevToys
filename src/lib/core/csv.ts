export type Delim = ',' | ';' | '\t' | '|' | 'auto';
export type Enclosure = '"' | "'" | 'none' | 'auto';
export type Escape = '\\' | '"' | 'none' | 'auto';

export interface ParsedData { headers: string[]; rows: string[][]; delimiter: string; enclosure: string; }

export function detectDelimiter(text: string): ',' | ';' | '\t' | '|' {
	const line = text.split('\n')[0] ?? '';
	const counts: Record<string, number> = {
		',':  (line.match(/,/g)  ?? []).length,
		';':  (line.match(/;/g)  ?? []).length,
		'\t': (line.match(/\t/g) ?? []).length,
		'|':  (line.match(/\|/g) ?? []).length,
	};
	return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ',') as ',' | ';' | '\t' | '|';
}

export function detectEnclosure(text: string, delim: string): '"' | "'" | 'none' {
	// Kopfzeilen sind oft unquoted, Werte quoted — daher die ersten Zeilen prüfen, nicht nur die erste.
	const lines = text.split('\n').slice(0, 20);
	for (const line of lines) {
		if (line.includes(`"${delim}`) || line.includes(`${delim}"`) || line.startsWith('"')) return '"';
	}
	for (const line of lines) {
		if (line.includes(`'${delim}`) || line.includes(`${delim}'`) || line.startsWith("'")) return "'";
	}
	return 'none';
}

export function parseCsv(text: string, delim: string, encl: string, esc: string): string[][] {
	const rows: string[][] = [];
	for (const line of text.split('\n')) {
		if (!line.trim()) continue;
		const cells: string[] = [];
		let inQuote = false, cell = '';
		const hasEncl = encl !== 'none' && encl !== '';
		for (let i = 0; i < line.length; i++) {
			const ch = line[i];
			// Handle escape sequences
			if (hasEncl && esc !== 'none' && ch === esc && i + 1 < line.length) {
				if (esc === '\\') { cell += line[i + 1]; i++; continue; }
				if (esc === '"' && ch === encl && line[i + 1] === encl) { cell += encl; i++; continue; }
			}
			if (hasEncl && ch === encl) { inQuote = !inQuote; continue; }
			if (ch === delim && !inQuote) { cells.push(cell.trim()); cell = ''; continue; }
			cell += ch;
		}
		cells.push(cell.trim());
		rows.push(cells);
	}
	return rows;
}

export function loadCsv(
	raw: string,
	optDelim: Delim = 'auto',
	optEnclosure: Enclosure = 'auto',
	optEscape: Escape = 'auto'
): ParsedData | null {
	if (!raw.trim()) return null;
	const delim   = optDelim     === 'auto' ? detectDelimiter(raw) : optDelim;
	const encl    = optEnclosure === 'auto' ? detectEnclosure(raw, delim) : optEnclosure;
	const escChar = optEscape    === 'auto' ? (encl === '"' ? '"' : encl === "'" ? 'none' : 'none') : optEscape;

	const rows = parseCsv(raw, delim, encl, escChar);
	if (rows.length === 0) return null;
	return { headers: rows[0], rows: rows.slice(1), delimiter: delim, enclosure: encl };
}
