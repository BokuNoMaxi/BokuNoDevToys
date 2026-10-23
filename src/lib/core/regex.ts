export interface MatchGroup { index: number; value: string; groups: (string | undefined)[]; }

export function findMatches(pattern: string, text: string, flags: { g?: boolean; i?: boolean; m?: boolean; s?: boolean } = { g: true }): MatchGroup[] {
	const f = (flags.g ? 'g' : '') + (flags.i ? 'i' : '') + (flags.m ? 'm' : '') + (flags.s ? 's' : '');
	const matches: MatchGroup[] = [];
	let m: RegExpExecArray | null;
	const localRe = new RegExp(pattern, f.includes('g') ? f : f + 'g');
	while ((m = localRe.exec(text)) !== null) {
		matches.push({ index: m.index, value: m[0], groups: m.slice(1) });
		if (m[0].length === 0) localRe.lastIndex++;
	}
	return matches;
}
