export interface SchemaItem {
	type: string;
	context: string;
	valid: boolean;
	data: Record<string, unknown>;
}

export function extractSchemas(html: string): SchemaItem[] {
	const items: SchemaItem[] = [];

	// Extract JSON-LD
	const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
	let m: RegExpExecArray | null;
	while ((m = scriptRe.exec(html)) !== null) {
		try {
			const data = JSON.parse(m[1].trim());
			const schemas = Array.isArray(data) ? data : [data];
			for (const s of schemas) {
				items.push({
					type: s['@type'] ?? 'Unknown',
					context: s['@context'] ?? '',
					valid: !!s['@type'] && !!s['@context'],
					data: s,
				});
			}
		} catch { /* skip malformed */ }
	}

	// Try treating paste input directly as JSON-LD
	if (items.length === 0 && !html.includes('<html')) {
		try {
			const data = JSON.parse(html.trim());
			const schemas = Array.isArray(data) ? data : [data];
			for (const s of schemas) {
				items.push({
					type: s['@type'] ?? 'Unknown',
					context: s['@context'] ?? '',
					valid: !!s['@type'] && !!s['@context'],
					data: s,
				});
			}
		} catch { /* not JSON */ }
	}

	return items;
}
