export type DiffType = 'equal' | 'add' | 'remove';
export interface DiffLine { type: DiffType; text: string; origLine: number | null; newLine: number | null; }

// Myers-LCS line diff
function diff(a: string[], b: string[]): DiffLine[] {
	const m = a.length, n = b.length;
	const max = m + n;
	const v: number[] = new Array(2 * max + 1).fill(0);
	const trace: number[][] = [];

	for (let d = 0; d <= max; d++) {
		trace.push([...v]);
		for (let k = -d; k <= d; k += 2) {
			const ki = k + max;
			let x = (k === -d || (k !== d && v[ki - 1] < v[ki + 1])) ? v[ki + 1] : v[ki - 1] + 1;
			let y = x - k;
			while (x < m && y < n && a[x] === b[y]) { x++; y++; }
			v[ki] = x;
			if (x >= m && y >= n) {
				return backtrack(a, b, trace, max);
			}
		}
	}
	return backtrack(a, b, trace, max);
}

function backtrack(a: string[], b: string[], trace: number[][], max: number): DiffLine[] {
	const result: DiffLine[] = [];
	let x = a.length, y = b.length;

	for (let d = trace.length - 1; d >= 0 && (x > 0 || y > 0); d--) {
		const v = trace[d];
		const k = x - y;
		const ki = k + max;
		const prevK = (k === -d || (k !== d && v[ki - 1] < v[ki + 1])) ? k + 1 : k - 1;
		const prevX = v[prevK + max];
		const prevY = prevX - prevK;

		while (x > prevX && y > prevY) { x--; y--; result.unshift({ type: 'equal', text: a[x], origLine: x + 1, newLine: y + 1 }); }
		if (d > 0) {
			if (x > prevX) { x--; result.unshift({ type: 'remove', text: a[x], origLine: x + 1, newLine: null }); }
			else if (y > prevY) { y--; result.unshift({ type: 'add', text: b[y], origLine: null, newLine: y + 1 }); }
		}
	}
	return result;
}

export function diffText(original: string, changed: string): DiffLine[] {
	if (!original && !changed) return [];
	return diff(original.split('\n'), changed.split('\n'));
}

export function diffStats(lines: DiffLine[]) {
	return {
		added: lines.filter(l => l.type === 'add').length,
		removed: lines.filter(l => l.type === 'remove').length,
		unchanged: lines.filter(l => l.type === 'equal').length,
	};
}

export function diffToText(lines: DiffLine[]): string {
	return lines.map(l => {
		const pfx = l.type === 'add' ? '+' : l.type === 'remove' ? '-' : ' ';
		return `${pfx} ${l.text}`;
	}).join('\n');
}
