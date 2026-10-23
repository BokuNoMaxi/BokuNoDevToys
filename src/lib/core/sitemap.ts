import type { ParseDoc } from './dom';

export type Status = 'pass' | 'warn' | 'fail';
export interface Finding { status: Status; text: string; }

export function validateRobots(text: string): Finding[] {
	const findings: Finding[] = [];
	const lines = text.split('\n').map(l => l.trim());
	const hasUserAgent = lines.some(l => /^user-agent:/i.test(l));
	const hasSitemap = lines.some(l => /^sitemap:/i.test(l));
	const hasDisallow = lines.some(l => /^disallow:/i.test(l));
	const blocksRoot = lines.some(l => /^disallow:\s*\/\s*$/i.test(l));

	findings.push(hasUserAgent
		? { status: 'pass', text: 'Contains at least one User-agent directive' }
		: { status: 'fail', text: 'No User-agent directive found' });

	findings.push(hasDisallow || hasUserAgent
		? { status: 'pass', text: 'Contains Disallow/Allow rules' }
		: { status: 'warn', text: 'No Disallow rules found (entire site is crawlable)' });

	if (blocksRoot) findings.push({ status: 'warn', text: 'A "Disallow: /" blocks the entire site for at least one user-agent group' });

	findings.push(hasSitemap
		? { status: 'pass', text: 'Sitemap directive present' }
		: { status: 'warn', text: 'No Sitemap: directive found in robots.txt' });

	const unknownDirectives = lines.filter(l =>
		l && !l.startsWith('#') &&
		!/^(user-agent|disallow|allow|sitemap|crawl-delay|host):/i.test(l)
	);
	if (unknownDirectives.length > 0) {
		findings.push({ status: 'warn', text: `${unknownDirectives.length} line(s) with unrecognized syntax` });
	}

	return findings;
}

export function extractSitemapUrl(robotsText: string): string | null {
	const match = robotsText.split('\n').find(l => /^sitemap:/i.test(l.trim()));
	if (!match) return null;
	return match.split(':').slice(1).join(':').trim();
}

export function validateSitemap(xml: string, parse: ParseDoc): { findings: Finding[]; count: number } {
	const findings: Finding[] = [];
	let count = 0;
	let doc: Document;
	try {
		doc = parse(xml, 'xml');
	} catch {
		findings.push({ status: 'fail', text: 'XML could not be parsed — invalid syntax' });
		return { findings, count };
	}
	try {

		const isIndex = doc.querySelector('sitemapindex') !== null;
		const isUrlset = doc.querySelector('urlset') !== null;

		if (!isIndex && !isUrlset) {
			findings.push({ status: 'fail', text: 'Root element is neither <urlset> nor <sitemapindex>' });
			return { findings, count };
		}

		if (isIndex) {
			const sitemaps = doc.querySelectorAll('sitemap > loc');
			count = sitemaps.length;
			findings.push({ status: 'pass', text: `Sitemap index with ${count} sub-sitemap(s)` });
		} else {
			const urls = doc.querySelectorAll('url > loc');
			count = urls.length;
			findings.push({ status: 'pass', text: `Valid urlset with ${count} URL(s)` });

			if (count > 50000) findings.push({ status: 'fail', text: 'Exceeds 50,000 URL limit per sitemap (spec violation)' });

			const nonAbsolute = Array.from(urls).filter(l => {
				const v = l.textContent?.trim() ?? '';
				return !/^https?:\/\//i.test(v);
			});
			if (nonAbsolute.length > 0) findings.push({ status: 'warn', text: `${nonAbsolute.length} <loc> entries are not absolute URLs` });

			const withLastmod = doc.querySelectorAll('url > lastmod').length;
			findings.push({
				status: withLastmod > 0 ? 'pass' : 'warn',
				text: withLastmod > 0 ? `${withLastmod}/${count} entries include <lastmod>` : 'No <lastmod> dates found',
			});
		}
	} catch {
		findings.push({ status: 'fail', text: 'Unexpected error parsing sitemap XML' });
	}
	return { findings, count };
}
