export type PrettierMode = 'auto' | 'single' | 'paragraph' | 'compact';
export type UrlTransform = 'none' | 'encode' | 'decode';
export type CaseTransform = 'none' | 'camel' | 'pascal' | 'snake' | 'kebab';

export function toCase(text: string, ct: CaseTransform): string {
	if (ct === 'none') return text;
	const words = text
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.split(/[\s\-_]+/)
		.filter(w => w.length > 0)
		.map(w => w.toLowerCase());
	if (ct === 'camel') return words.map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join('');
	if (ct === 'pascal') return words.map(w => w[0].toUpperCase() + w.slice(1)).join('');
	if (ct === 'snake') return words.join('_');
	if (ct === 'kebab') return words.join('-');
	return text;
}

export function removeHtml(text: string): string {
	return text
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/?(p|div|h[1-6]|li|tr|blockquote|section|article|header|footer|main|aside)[^>]*>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&[a-z]+;/gi, ' ');
}

export function prettify(text: string, m: PrettierMode, doStripHtml: boolean): string {
	if (!text.trim()) return '';

	let result = doStripHtml ? removeHtml(text) : text;

	result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	result = result.split('\n').map(l => l.trim()).join('\n');

	let resolvedMode = m;
	if (m === 'auto') {
		const lines = result.split('\n').filter(l => l.length > 0);
		const avgLen = lines.reduce((s, l) => s + l.length, 0) / (lines.length || 1);
		resolvedMode = avgLen < 60 ? 'single' : 'paragraph';
	}

	if (resolvedMode === 'single') {
		result = result.split('\n').filter(l => l.length > 0).join(' ');
		result = result.replace(/\s{2,}/g, ' ').trim();
	} else if (resolvedMode === 'paragraph') {
		result = result.replace(/\n{3,}/g, '\n\n');
		result = result.split('\n\n').map(para =>
			para.split('\n').filter(l => l.length > 0).join(' ').replace(/\s{2,}/g, ' ')
		).join('\n\n').trim();
	} else if (resolvedMode === 'compact') {
		result = result.split('\n').filter(l => l.length > 0).join('\n');
		result = result.replace(/\s{2,}/g, ' ').trim();
	}

	return result;
}

export function prettifyText(
	input: string,
	opts: { mode?: PrettierMode; stripHtml?: boolean; url?: UrlTransform; caseTransform?: CaseTransform } = {}
): string {
	let result = prettify(input, opts.mode ?? 'auto', opts.stripHtml ?? false);
	if (opts.url === 'encode') result = encodeURIComponent(result);
	else if (opts.url === 'decode') { try { result = decodeURIComponent(result); } catch { /* keep */ } }
	return toCase(result, opts.caseTransform ?? 'none');
}
