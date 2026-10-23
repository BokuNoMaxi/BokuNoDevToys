export const STOPWORDS: Record<'en' | 'de', Set<string>> = {
	en: new Set(['a','an','the','and','or','but','if','then','else','of','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','once','is','are','was','were','be','been','being','have','has','had','having','do','does','did','doing','will','would','should','could','can','may','might','must','shall','i','you','he','she','it','we','they','them','this','that','these','those','not','no','so','than','too','very','just','also','as','it\'s']),
	de: new Set(['der','die','das','den','dem','des','ein','eine','einer','eines','einem','einen','und','oder','aber','wenn','dann','sonst','von','bei','für','mit','über','gegen','zwischen','in','aus','auf','ab','unter','wieder','ist','sind','war','waren','sein','wird','werden','wurde','haben','hat','hatte','kann','können','muss','müssen','soll','sollen','ich','du','er','sie','es','wir','ihr','sie','diese','jene','nicht','kein','so','als','auch','sehr','nur','zu','zum','zur','im','am','an','um']),
};

export function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.normalize('NFKC')
		.match(/[\p{L}\p{N}'-]+/gu) ?? [];
}

/** Sichtbarer Text eines HTML-Dokuments (ohne script/style/noscript). */
export function extractVisibleText(doc: Document, fallback: string): string {
	doc.querySelectorAll('script,style,noscript').forEach(e => e.remove());
	return doc.body?.textContent ?? fallback;
}

export interface KeywordRow { phrase: string; count: number; density: number; }

export function keywordDensity(
	text: string,
	ngramSize: 1 | 2 | 3,
	lang: 'en' | 'de'
): { rows: KeywordRow[]; totalWords: number } {
	const allWords = tokenize(text);
	const totalWords = allWords.length;
	if (totalWords === 0) return { rows: [], totalWords: 0 };

	const stopset = STOPWORDS[lang];
	const words = ngramSize === 1 ? allWords.filter(w => !stopset.has(w) && w.length > 1) : allWords;

	const counts = new Map<string, number>();
	if (ngramSize === 1) {
		for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
	} else {
		for (let i = 0; i <= allWords.length - ngramSize; i++) {
			const gram = allWords.slice(i, i + ngramSize);
			if (gram.some(w => stopset.has(w))) continue;
			const phrase = gram.join(' ');
			counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
		}
	}

	const rows = Array.from(counts.entries())
		.filter(([, c]) => c > 1)
		.map(([phrase, count]) => ({ phrase, count, density: (count / totalWords) * 100 }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 30);

	return { rows, totalWords };
}
