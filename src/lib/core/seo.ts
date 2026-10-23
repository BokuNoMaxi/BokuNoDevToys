export type Status = 'pass' | 'warn' | 'fail';
export interface Check { key: string; label: string; status: Status; detail: string; weight: number; }

/** Analysiert ein geparstes HTML-Dokument. `url` aktiviert den HTTPS-Check. */
export function analyzeSeo(doc: Document, url?: string): Check[] {
	const checks: Check[] = [];

	// Title
	const title = doc.querySelector('title')?.textContent?.trim() ?? '';
	if (!title) checks.push({ key: 'title', label: 'Title Tag', status: 'fail', detail: 'Missing <title> tag', weight: 10 });
	else if (title.length < 10 || title.length > 60)
		checks.push({ key: 'title', label: 'Title Tag', status: 'warn', detail: `Length ${title.length} chars (optimal 10–60): "${title}"`, weight: 10 });
	else checks.push({ key: 'title', label: 'Title Tag', status: 'pass', detail: `"${title}" (${title.length} chars)`, weight: 10 });

	// Meta description
	const desc = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '';
	if (!desc) checks.push({ key: 'desc', label: 'Meta Description', status: 'fail', detail: 'Missing meta description', weight: 10 });
	else if (desc.length < 50 || desc.length > 160)
		checks.push({ key: 'desc', label: 'Meta Description', status: 'warn', detail: `Length ${desc.length} chars (optimal 50–160)`, weight: 10 });
	else checks.push({ key: 'desc', label: 'Meta Description', status: 'pass', detail: `${desc.length} chars`, weight: 10 });

	// Canonical
	const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
	checks.push(canonical
		? { key: 'canonical', label: 'Canonical URL', status: 'pass', detail: canonical, weight: 6 }
		: { key: 'canonical', label: 'Canonical URL', status: 'warn', detail: 'No canonical link found', weight: 6 });

	// H1
	const h1s = doc.querySelectorAll('h1');
	if (h1s.length === 0) checks.push({ key: 'h1', label: 'H1 Heading', status: 'fail', detail: 'No H1 found', weight: 10 });
	else if (h1s.length > 1) checks.push({ key: 'h1', label: 'H1 Heading', status: 'warn', detail: `${h1s.length} H1 tags found (should be 1)`, weight: 10 });
	else checks.push({ key: 'h1', label: 'H1 Heading', status: 'pass', detail: `"${h1s[0].textContent?.trim().slice(0, 60)}"`, weight: 10 });

	// Heading structure (h2 presence when content is long)
	const h2Count = doc.querySelectorAll('h2').length;
	checks.push({ key: 'h2', label: 'H2 Subheadings', status: h2Count > 0 ? 'pass' : 'warn', detail: `${h2Count} H2 tags found`, weight: 4 });

	// lang attribute
	const lang = doc.documentElement.getAttribute('lang') ?? '';
	checks.push(lang
		? { key: 'lang', label: 'HTML Lang Attribute', status: 'pass', detail: `lang="${lang}"`, weight: 5 }
		: { key: 'lang', label: 'HTML Lang Attribute', status: 'fail', detail: 'Missing lang attribute on <html>', weight: 5 });

	// Viewport
	const viewport = doc.querySelector('meta[name="viewport"]');
	checks.push(viewport
		? { key: 'viewport', label: 'Viewport Meta', status: 'pass', detail: 'Present', weight: 6 }
		: { key: 'viewport', label: 'Viewport Meta', status: 'fail', detail: 'Missing viewport meta tag', weight: 6 });

	// Charset
	const charset = doc.querySelector('meta[charset]');
	checks.push(charset
		? { key: 'charset', label: 'Charset Declaration', status: 'pass', detail: 'Present', weight: 3 }
		: { key: 'charset', label: 'Charset Declaration', status: 'warn', detail: 'No meta charset found', weight: 3 });

	// Robots meta
	const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content')?.toLowerCase() ?? '';
	if (robots.includes('noindex'))
		checks.push({ key: 'robots', label: 'Robots Meta', status: 'fail', detail: 'Page is set to noindex', weight: 8 });
	else checks.push({ key: 'robots', label: 'Robots Meta', status: 'pass', detail: robots || 'No restrictive robots meta', weight: 8 });

	// Images alt
	const imgs = Array.from(doc.querySelectorAll('img'));
	const withAlt = imgs.filter(i => (i.getAttribute('alt') ?? '').trim().length > 0).length;
	if (imgs.length === 0) checks.push({ key: 'alt', label: 'Image Alt Attributes', status: 'pass', detail: 'No images found', weight: 6 });
	else {
		const ratio = withAlt / imgs.length;
		checks.push({
			key: 'alt', label: 'Image Alt Attributes',
			status: ratio === 1 ? 'pass' : ratio > 0.5 ? 'warn' : 'fail',
			detail: `${withAlt}/${imgs.length} images have alt text`, weight: 6,
		});
	}

	// Open Graph
	const ogTitle = doc.querySelector('meta[property="og:title"]');
	const ogDesc = doc.querySelector('meta[property="og:description"]');
	const ogImage = doc.querySelector('meta[property="og:image"]');
	const ogCount = [ogTitle, ogDesc, ogImage].filter(Boolean).length;
	checks.push({
		key: 'og', label: 'Open Graph Tags', status: ogCount === 3 ? 'pass' : ogCount > 0 ? 'warn' : 'fail',
		detail: `${ogCount}/3 core OG tags present (title, description, image)`, weight: 8,
	});

	// Twitter Card
	const twCard = doc.querySelector('meta[name="twitter:card"]');
	checks.push(twCard
		? { key: 'twitter', label: 'Twitter Card', status: 'pass', detail: 'Present', weight: 4 }
		: { key: 'twitter', label: 'Twitter Card', status: 'warn', detail: 'No twitter:card meta found', weight: 4 });

	// Favicon
	const favicon = doc.querySelector('link[rel~="icon"]');
	checks.push(favicon
		? { key: 'favicon', label: 'Favicon', status: 'pass', detail: 'Present', weight: 3 }
		: { key: 'favicon', label: 'Favicon', status: 'warn', detail: 'No favicon link found', weight: 3 });

	// Structured data
	const jsonLd = doc.querySelectorAll('script[type="application/ld+json"]');
	checks.push({
		key: 'jsonld', label: 'Structured Data (JSON-LD)', status: jsonLd.length > 0 ? 'pass' : 'warn',
		detail: jsonLd.length > 0 ? `${jsonLd.length} JSON-LD block(s) found` : 'No structured data found', weight: 6,
	});

	// Word count (thin content check)
	const bodyClone = doc.body?.cloneNode(true) as HTMLElement | undefined;
	bodyClone?.querySelectorAll('script,style,noscript').forEach(e => e.remove());
	const text = bodyClone?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
	const wordCount = text ? text.split(' ').length : 0;
	checks.push({
		key: 'words', label: 'Content Length', status: wordCount >= 300 ? 'pass' : wordCount >= 100 ? 'warn' : 'fail',
		detail: `~${wordCount} words of visible text`, weight: 6,
	});

	// HTTPS (only meaningful in URL mode)
	if (url) {
		const isHttps = url.trim().toLowerCase().startsWith('https://');
		checks.push(isHttps
			? { key: 'https', label: 'HTTPS', status: 'pass', detail: 'Served over HTTPS', weight: 5 }
			: { key: 'https', label: 'HTTPS', status: 'fail', detail: 'Not served over HTTPS', weight: 5 });
	}

	return checks;
}

export function seoScore(checks: Check[]): number {
	const total = checks.reduce((s, c) => s + c.weight, 0);
	const earned = checks.reduce((s, c) => s + (c.status === 'pass' ? c.weight : c.status === 'warn' ? c.weight * 0.5 : 0), 0);
	return Math.round((earned / total) * 100);
}
