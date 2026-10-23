export function randomInts(min: number, max: number, count: number): number[] {
	if (min > max) [min, max] = [max, min];
	return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

export function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export function valueRows(text: string): string[] {
	return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

export function pickRandom(list: string[]): string {
	return list[Math.floor(Math.random() * list.length)];
}

export function shuffleRows(list: string[]): string[] {
	if (list.some(r => r.includes(':'))) {
		const split = list.map(r => r.split(':').map(c => c.trim()));
		const colCount = Math.max(...split.map(r => r.length));
		const cols = Array.from({ length: colCount }, (_, ci) =>
			shuffle(split.map(r => r[ci] ?? ''))
		);
		return list.map((_, ri) => cols.map(col => col[ri]).join(' : '));
	}
	return shuffle(list);
}
