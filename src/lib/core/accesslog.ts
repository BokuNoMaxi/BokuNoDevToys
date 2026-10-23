export interface LogEntry {
	ip: string;
	date: string;   // "10/Oct/2023"
	hour: number;
	method: string;
	path: string;
	status: number;
	bytes: number;
	userAgent: string;
	botName: string | null;   // null = not recognized as a bot
}

export interface DaySummary {
	date: string;
	total: number;
	uniqueIPs: number;
	errors: number;
	bytes: number;
	bots: number;
	hourly: number[];               // [0..23]
	statuses: Record<string, number>;
	topPaths: [string, number][];
	topIPs: [string, number][];
	topBots: [string, number][];
}

export type FilterMode = 'all' | 'bots' | 'humans';


// Combined Log Format: IP - user [date] "METHOD path proto" status bytes "ref" "ua"
export const LOG_RE = /^(\S+)\s+\S+\s+\S+\s+\[(\d{2}\/\w+\/\d{4}):(\d{2}):\d{2}:\d{2}\s[^\]]+\]\s+"(\S+)\s+([^"]*?)\s+\S+"\s+(\d+)\s+(\S+)(?:\s+"[^"]*"\s+"([^"]*)")?/;

// Known bot/crawler signatures, checked in order (most specific first).
// Falls back to a generic bot/crawler/spider heuristic if nothing matches.
export const BOT_PATTERNS: [RegExp, string][] = [
	[/googlebot/i, 'Googlebot'],
	[/bingbot/i, 'Bingbot'],
	[/slurp/i, 'Yahoo Slurp'],
	[/duckduckbot/i, 'DuckDuckBot'],
	[/baiduspider/i, 'Baiduspider'],
	[/yandexbot/i, 'YandexBot'],
	[/sogou/i, 'Sogou'],
	[/exabot/i, 'Exabot'],
	[/facebookexternalhit|facebot/i, 'Facebook Bot'],
	[/twitterbot/i, 'Twitterbot'],
	[/linkedinbot/i, 'LinkedInBot'],
	[/whatsapp/i, 'WhatsApp'],
	[/telegrambot/i, 'TelegramBot'],
	[/discordbot/i, 'Discordbot'],
	[/slackbot/i, 'Slackbot'],
	[/ahrefsbot/i, 'AhrefsBot'],
	[/semrushbot/i, 'SemrushBot'],
	[/mj12bot/i, 'MJ12bot'],
	[/dotbot/i, 'DotBot'],
	[/blexbot/i, 'BLEXBot'],
	[/petalbot/i, 'PetalBot'],
	[/dataforseobot/i, 'DataForSeoBot'],
	[/seznambot/i, 'SeznamBot'],
	[/uptimerobot/i, 'UptimeRobot'],
	[/pingdom/i, 'Pingdom'],
	[/statuscake/i, 'StatusCake'],
	[/applebot/i, 'Applebot'],
	[/gptbot/i, 'GPTBot'],
	[/chatgpt-user/i, 'ChatGPT-User'],
	[/claudebot/i, 'ClaudeBot'],
	[/anthropic-ai/i, 'Anthropic-AI'],
	[/perplexitybot/i, 'PerplexityBot'],
	[/ccbot/i, 'CCBot'],
	[/bytespider/i, 'Bytespider'],
	[/amazonbot/i, 'Amazonbot'],
	[/curl\//i, 'curl'],
	[/wget/i, 'Wget'],
	[/python-requests|python-urllib/i, 'Python-Client'],
	[/go-http-client/i, 'Go-http-client'],
	[/okhttp/i, 'okhttp'],
	[/scrapy/i, 'Scrapy'],
	[/node-fetch|axios/i, 'Node-Client'],
	[/postmanruntime/i, 'PostmanRuntime'],
	[/headlesschrome|phantomjs/i, 'Headless Browser'],
	[/bot|crawl|spider/i, 'Bot (generic)'],
];

export function detectBot(userAgent: string): string | null {
	if (!userAgent) return null;
	for (const [re, name] of BOT_PATTERNS) {
		if (re.test(userAgent)) return name;
	}
	return null;
}

export function parseLog(text: string) {
	const parsed: LogEntry[] = [];
	let unparsed = 0;
	for (const line of text.split('\n')) {
		if (!line.trim()) continue;
		const m = line.match(LOG_RE);
		if (!m) { unparsed++; continue; }
		const userAgent = m[8] ?? '';
		parsed.push({
			ip: m[1],
			date: m[2],
			hour: parseInt(m[3]),
			method: m[4],
			path: m[5].split('?')[0] || '/',
			status: parseInt(m[6]),
			bytes: m[7] === '-' ? 0 : parseInt(m[7]) || 0,
			userAgent,
			botName: detectBot(userAgent),
		});
	}
	return { parsed, unparsed };
}

export function buildSummary(date: string, data: LogEntry[], filter: FilterMode): DaySummary {
	let dayEntries = data.filter(e => e.date === date);
	if (filter === 'bots') dayEntries = dayEntries.filter(e => e.botName !== null);
	if (filter === 'humans') dayEntries = dayEntries.filter(e => e.botName === null);

	const hourly = Array(24).fill(0);
	const statuses: Record<string, number> = {};
	const pathCount = new Map<string, number>();
	const ipCount = new Map<string, number>();
	const botCount = new Map<string, number>();
	let bots = 0;

	for (const e of dayEntries) {
		hourly[e.hour]++;
		const sg = `${Math.floor(e.status / 100)}xx`;
		statuses[sg] = (statuses[sg] ?? 0) + 1;
		pathCount.set(e.path, (pathCount.get(e.path) ?? 0) + 1);
		ipCount.set(e.ip, (ipCount.get(e.ip) ?? 0) + 1);
		if (e.botName !== null) {
			bots++;
			botCount.set(e.botName, (botCount.get(e.botName) ?? 0) + 1);
		}
	}

	const topPaths = [...pathCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
	const topIPs = [...ipCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
	const topBots = [...botCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
	const uniqueIPs = ipCount.size;
	const errors = dayEntries.filter(e => e.status >= 400).length;
	const bytes = dayEntries.reduce((s, e) => s + e.bytes, 0);

	return { date, total: dayEntries.length, uniqueIPs, errors, bytes, bots, hourly, statuses, topPaths, topIPs, topBots };
}

const MONTHS: Record<string, number> = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};

/** Tage ("10/Oct/2023") chronologisch sortiert. */
export function sortedDays(entries: LogEntry[]): string[] {
	const parse = (d: string) => {
		const [day, mon, year] = d.split('/');
		return new Date(parseInt(year), MONTHS[mon] ?? 0, parseInt(day)).getTime();
	};
	return [...new Set(entries.map(e => e.date))].sort((a, b) => parse(a) - parse(b));
}

export function formatBytes(b: number): string {
	if (b < 1024) return `${b} B`;
	if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
	if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`;
	return `${(b / 1073741824).toFixed(2)} GB`;
}
