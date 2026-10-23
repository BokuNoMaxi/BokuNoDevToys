import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { defineTool, text, okJson } from '../util.js';
import { nodeParseDoc } from '../node-dom.js';
import { parseLog, buildSummary, sortedDays, formatBytes } from '../../../src/lib/core/accesslog';
import { analyzeErrorLog } from '../../../src/lib/core/errorlog';
import { analyzeSeo, seoScore } from '../../../src/lib/core/seo';
import { keywordDensity, extractVisibleText } from '../../../src/lib/core/keywords';
import { extractSchemas } from '../../../src/lib/core/schema';
import { validateRobots, extractSitemapUrl, validateSitemap } from '../../../src/lib/core/sitemap';

export function registerAnalyzeTools(server: McpServer): void {
	defineTool(server, 'access_log_analyze', {
		title: 'Analyze an access log',
		description: 'Summarize an Apache/nginx combined-format access log for one day: requests, unique IPs, errors, bytes, hourly distribution, status classes, top paths/IPs and recognized bots. Day defaults to the last day in the log.',
		input: {
			log: text('Access log lines'),
			day: z.string().regex(/^\d{2}\/\w{3}\/\d{4}$/).optional().describe('e.g. 10/Oct/2023'),
			filter: z.enum(['all', 'bots', 'humans']).default('all'),
		},
		run: ({ log, day, filter }) => {
			const { parsed, unparsed } = parseLog(log);
			if (parsed.length === 0) throw new Error('No lines in Apache/nginx Combined Log Format found');
			const days = sortedDays(parsed);
			const selected = day ?? days[days.length - 1];
			if (!days.includes(selected)) throw new Error(`Day ${selected} not in log. Available: ${days.join(', ')}`);
			const s = buildSummary(selected, parsed, filter);
			return okJson({ days, unparsedLines: unparsed, ...s, bytesHuman: formatBytes(s.bytes) });
		},
	});

	defineTool(server, 'error_log_analyze', {
		title: 'Analyze an error log',
		description: 'Group Apache/nginx/PHP/syslog/ISO-timestamped error log lines by normalized message (IPs, ids, ports masked). Returns groups sorted by severity then frequency, each with count and an example line.',
		input: { log: text('Error log lines'), maxGroups: z.number().int().min(1).max(500).default(50) },
		run: ({ log, maxGroups }) => {
			const { groups, totalLines } = analyzeErrorLog(log);
			return okJson({ totalLines, groupCount: groups.length, groups: groups.slice(0, maxGroups) });
		},
	});

	defineTool(server, 'seo_analyze', {
		title: 'SEO score of an HTML page',
		description: 'Check pasted HTML for title, meta description, canonical, headings, lang, viewport, robots, image alt, Open Graph, Twitter card, favicon, JSON-LD and content length. Returns a 0-100 score and per-check status. Does not fetch URLs.',
		input: { html: text('HTML source'), url: z.string().max(2000).optional().describe('Page URL; enables the HTTPS check') },
		run: ({ html, url }) => {
			const checks = analyzeSeo(nodeParseDoc(html, 'html'), url);
			return okJson({ score: seoScore(checks), checks });
		},
	});

	defineTool(server, 'keyword_density', {
		title: 'Keyword density',
		description: 'Most frequent words or 2-3 word phrases (stop words removed, at least 2 occurrences) with density in percent.',
		input: {
			text: text('Plain text or HTML'),
			isHtml: z.boolean().default(false).describe('Strip HTML tags first'),
			ngram: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
			language: z.enum(['en', 'de']).default('en').describe('Stop word list'),
		},
		run: ({ text: t, isHtml, ngram, language }) => {
			const content = isHtml ? extractVisibleText(nodeParseDoc(t, 'html'), t) : t;
			return okJson(keywordDensity(content, ngram, language));
		},
	});

	defineTool(server, 'schema_extract', {
		title: 'Extract JSON-LD structured data',
		description: 'Extract schema.org JSON-LD blocks from HTML (or parse a bare JSON-LD document) with type, context and validity.',
		input: { html: text('HTML source or raw JSON-LD') },
		run: ({ html }) => {
			const items = extractSchemas(html);
			if (items.length === 0) throw new Error('No structured data found');
			return okJson(items);
		},
	});

	defineTool(server, 'robots_sitemap_validate', {
		title: 'Validate robots.txt or a sitemap',
		description: 'Validate pasted robots.txt content (also returns the declared sitemap URL) or sitemap XML (urlset / sitemapindex). Does not fetch URLs.',
		input: { kind: z.enum(['robots', 'sitemap']), content: text('robots.txt text or sitemap XML') },
		run: ({ kind, content }) => {
			if (kind === 'robots') return okJson({ findings: validateRobots(content), sitemapUrl: extractSitemapUrl(content) });
			const { findings, count } = validateSitemap(content, nodeParseDoc);
			return okJson({ urlCount: count, findings });
		},
	});
}
