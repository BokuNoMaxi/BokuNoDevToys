<script lang="ts">
	import { t } from '$lib/i18n';

	interface LogEntry {
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

	interface DaySummary {
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

	type FilterMode = 'all' | 'bots' | 'humans';

	let fileName = $state('');
	let entries = $state<LogEntry[]>([]);
	let days = $state<string[]>([]);
	let selectedDay = $state('');
	let filterMode = $state<FilterMode>('all');
	let summary = $state<DaySummary | null>(null);
	let parseError = $state('');
	let dragging = $state(false);
	let hoveredHour = $state<number | null>(null);

	// Combined Log Format: IP - user [date] "METHOD path proto" status bytes "ref" "ua"
	const LOG_RE = /^(\S+)\s+\S+\s+\S+\s+\[(\d{2}\/\w+\/\d{4}):(\d{2}):\d{2}:\d{2}\s[^\]]+\]\s+"(\S+)\s+([^"]*?)\s+\S+"\s+(\d+)\s+(\S+)(?:\s+"[^"]*"\s+"([^"]*)")?/;

	// Known bot/crawler signatures, checked in order (most specific first).
	// Falls back to a generic bot/crawler/spider heuristic if nothing matches.
	const BOT_PATTERNS: [RegExp, string][] = [
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

	function detectBot(userAgent: string): string | null {
		if (!userAgent) return null;
		for (const [re, name] of BOT_PATTERNS) {
			if (re.test(userAgent)) return name;
		}
		return null;
	}

	function parseLog(text: string) {
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

	function buildSummary(date: string, data: LogEntry[], filter: FilterMode): DaySummary {
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

	function selectDay(day: string) {
		selectedDay = day;
		summary = buildSummary(day, entries, filterMode);
		hoveredHour = null;
	}

	function setFilter(mode: FilterMode) {
		filterMode = mode;
		if (selectedDay) summary = buildSummary(selectedDay, entries, filterMode);
	}

	function loadFile(file: File) {
		fileName = file.name;
		parseError = '';
		entries = [];
		days = [];
		summary = null;
		selectedDay = '';

		const reader = new FileReader();
		reader.onload = (ev) => {
			const text = ev.target?.result as string ?? '';
			const { parsed, unparsed } = parseLog(text);
			if (parsed.length === 0) {
				parseError = $t('accessLog').parseError;
				return;
			}
			entries = parsed;
			const daySet = new Set(parsed.map(e => e.date));
			// Sort days chronologically
			days = [...daySet].sort((a, b) => {
				const months: Record<string,number> = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
				const parse = (d: string) => {
					const [day, mon, year] = d.split('/');
					return new Date(parseInt(year), months[mon] ?? 0, parseInt(day)).getTime();
				};
				return parse(a) - parse(b);
			});
			selectDay(days[days.length - 1]); // default to last day
		};
		reader.readAsText(file);
	}

	function handleFileInput(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) loadFile(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		const file = e.dataTransfer?.files[0];
		if (file) loadFile(file);
	}

	function clear() {
		fileName = ''; entries = []; days = []; selectedDay = ''; summary = null; parseError = ''; filterMode = 'all';
	}

	function formatBytes(b: number): string {
		if (b < 1024) return `${b} B`;
		if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
		if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`;
		return `${(b / 1073741824).toFixed(2)} GB`;
	}

	// Chart helpers
	const CHART_W = 600;
	const CHART_H = 140;
	const PAD_L = 44;
	const PAD_B = 24;
	const PAD_T = 10;
	const plotW = CHART_W - PAD_L - 8;
	const plotH = CHART_H - PAD_B - PAD_T;
	const slotW = plotW / 24;
	const barW = Math.max(slotW - 3, 4);

	function barX(hour: number) { return PAD_L + hour * slotW + (slotW - barW) / 2; }
	function barY(val: number, max: number) { return PAD_T + plotH - (max > 0 ? (val / max) * plotH : 0); }
	function barH(val: number, max: number) { return max > 0 ? (val / max) * plotH : 0; }

	function gridLines(max: number): { y: number; label: string }[] {
		if (max === 0) return [];
		const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
		const step = steps.find(s => max / s <= 4) ?? Math.ceil(max / 4);
		const lines = [];
		for (let v = step; v <= max; v += step) {
			lines.push({ y: barY(v, max), label: v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) });
		}
		return lines;
	}

	// Status colors (project palette, WCAG AAA on dark)
	const statusColors: Record<string, string> = {
		'2xx': '#34d399', // emerald-400
		'3xx': '#38bdf8', // sky-400
		'4xx': '#fbbf24', // amber-400
		'5xx': '#fca5a5', // red-300
	};
	const statusOrder = ['2xx', '3xx', '4xx', '5xx'];
</script>

<div class="space-y-4">
	<!-- Upload -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('accessLog').upload}</h2>
		<label
			class="flex flex-col items-center justify-center border-2 border-dashed rounded-lg px-4 py-8 cursor-pointer transition-colors
				{dragging ? 'border-violet-500 bg-violet-900/20' : 'border-slate-600 hover:border-slate-500'}"
			ondragover={(e) => { e.preventDefault(); dragging = true; }}
			ondragleave={() => dragging = false}
			ondrop={handleDrop}
			aria-label={$t('accessLog').dropZone}
		>
			<svg class="w-10 h-10 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
			</svg>
			<span class="text-sm text-slate-300">{$t('accessLog').dropZone}</span>
			<span class="text-xs text-slate-400 mt-1">Apache / nginx Combined Log Format</span>
			{#if fileName}<span class="mt-2 text-xs text-violet-300 font-medium">{fileName}</span>{/if}
			<input type="file" accept=".log,.txt,.gz" onchange={handleFileInput} class="sr-only" />
		</label>

		{#if parseError}
			<p role="alert" class="text-xs text-red-300">{parseError}</p>
		{/if}

		{#if fileName}
			<button onclick={clear} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('accessLog').clear}</button>
		{/if}
	</div>

	{#if summary}
		<!-- Day selector -->
		{#if days.length > 1}
			<div class="bg-slate-800 rounded-xl p-6">
				<label for="day-select" class="block text-xs text-slate-300 mb-1.5">{$t('accessLog').selectDay}</label>
				<select
					id="day-select"
					value={selectedDay}
					onchange={(e) => selectDay((e.target as HTMLSelectElement).value)}
					class="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
				>
					{#each days as d}
						<option value={d}>{d}</option>
					{/each}
				</select>
			</div>
		{/if}

		<!-- Bot filter -->
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center gap-3" role="group" aria-label={$t('accessLog').filterGroupLabel}>
				<span class="text-xs text-slate-300">{$t('accessLog').filterGroupLabel}</span>
				{#each [
					{ mode: 'all' as FilterMode, label: $t('accessLog').filterAll },
					{ mode: 'bots' as FilterMode, label: $t('accessLog').filterBotsOnly },
					{ mode: 'humans' as FilterMode, label: $t('accessLog').filterHumansOnly },
				] as f}
					<button
						onclick={() => setFilter(f.mode)}
						aria-pressed={filterMode === f.mode}
						class="text-xs px-3 py-1.5 rounded-lg transition-colors
							{filterMode === f.mode ? 'bg-violet-700 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white'}"
					>{f.label}</button>
				{/each}
			</div>
		</div>

		<!-- Stat tiles -->
		<div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
			{#each [
				{ label: $t('accessLog').totalRequests, value: summary.total.toLocaleString(), color: 'text-violet-300' },
				{ label: $t('accessLog').uniqueIPs, value: summary.uniqueIPs.toLocaleString(), color: 'text-sky-400' },
				{ label: $t('accessLog').errors, value: summary.errors.toLocaleString(), color: 'text-red-300' },
				{ label: $t('accessLog').bytesTransferred, value: formatBytes(summary.bytes), color: 'text-emerald-400' },
				{ label: $t('accessLog').bots, value: summary.bots.toLocaleString(), color: 'text-amber-400' },
			] as tile}
				<div class="bg-slate-800 rounded-xl p-4">
					<p class="text-xs text-slate-300 mb-1">{tile.label}</p>
					<p class="text-2xl font-bold font-mono {tile.color}">{tile.value}</p>
				</div>
			{/each}
		</div>

		<!-- Hourly bar chart -->
		<div class="bg-slate-800 rounded-xl p-6">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">{$t('accessLog').requestsPerHour}</h2>
			<!-- Hover info -->
			<div class="h-5 text-xs text-slate-300 mb-2">
				{#if hoveredHour !== null}
					<span class="font-mono">{String(hoveredHour).padStart(2,'0')}:00</span>
					&nbsp;—&nbsp;
					<span class="text-violet-300 font-semibold">{summary.hourly[hoveredHour]}</span>
					{$t('accessLog').requests}
				{/if}
			</div>
			<div class="overflow-x-auto">
				<svg viewBox="0 0 {CHART_W} {CHART_H}" width="100%" role="img" aria-label={$t('accessLog').requestsPerHour}>
					{#snippet chartContent()}
						{@const max = Math.max(...summary.hourly, 1)}
						{@const grid = gridLines(max)}

						<!-- Gridlines -->
						{#each grid as g}
							<line x1={PAD_L} y1={g.y} x2={CHART_W - 8} y2={g.y} stroke="#334155" stroke-width="1"/>
							<text x={PAD_L - 4} y={g.y + 4} text-anchor="end" font-size="10" fill="#94a3b8">{g.label}</text>
						{/each}

						<!-- Baseline -->
						<line x1={PAD_L} y1={PAD_T + plotH} x2={CHART_W - 8} y2={PAD_T + plotH} stroke="#475569" stroke-width="1"/>

						<!-- Bars -->
						{#each summary.hourly as count, hour}
							<rect
								x={barX(hour)}
								y={barY(count, max)}
								width={barW}
								height={barH(count, max)}
								fill={hoveredHour === hour ? '#7c3aed' : '#5b21b6'}
								rx="2"
								onmouseenter={() => hoveredHour = hour}
								onmouseleave={() => hoveredHour = null}
								role="img"
								aria-label="{hour}:00 — {count} {$t('accessLog').requests}"
								class="cursor-pointer"
							/>
						{/each}

						<!-- Hour labels every 6h -->
						{#each [0, 6, 12, 18, 23] as h}
							<text
								x={barX(h) + barW / 2}
								y={CHART_H - 6}
								text-anchor="middle"
								font-size="10"
								fill="#94a3b8"
							>{h}</text>
						{/each}
					{/snippet}
					{@render chartContent()}
				</svg>
			</div>
		</div>

		<!-- Status codes -->
		<div class="bg-slate-800 rounded-xl p-6">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">{$t('accessLog').statusCodes}</h2>
			<div class="flex h-5 rounded overflow-hidden gap-px">
				{#each statusOrder as sg}
					{#if summary.statuses[sg]}
						{@const pct = (summary.statuses[sg] / summary.total * 100).toFixed(1)}
						<div
							style="width: {pct}%; background: {statusColors[sg]}"
							title="{sg}: {summary.statuses[sg]} ({pct}%)"
						></div>
					{/if}
				{/each}
			</div>
			<div class="flex flex-wrap gap-4 mt-3">
				{#each statusOrder as sg}
					{#if summary.statuses[sg]}
						<div class="flex items-center gap-1.5">
							<div class="w-3 h-3 rounded-sm" style="background: {statusColors[sg]}"></div>
							<span class="text-xs text-slate-300">{sg} <span class="font-semibold">{summary.statuses[sg].toLocaleString()}</span></span>
						</div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Top paths + IPs -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<div class="bg-slate-800 rounded-xl p-6">
				<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('accessLog').topPaths}</h2>
				<div class="space-y-2">
					{#each summary.topPaths as [path, count]}
						{@const pct = summary.total > 0 ? count / summary.total * 100 : 0}
						<div>
							<div class="flex items-center justify-between mb-0.5">
								<span class="text-xs font-mono text-slate-300 truncate max-w-[75%]" title={path}>{path}</span>
								<span class="text-xs text-slate-400 shrink-0 ml-2">{count}</span>
							</div>
							<div class="h-1 bg-slate-700 rounded">
								<div class="h-1 bg-violet-600 rounded" style="width: {pct}%"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="bg-slate-800 rounded-xl p-6">
				<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('accessLog').topIPs}</h2>
				<div class="space-y-2">
					{#each summary.topIPs as [ip, count]}
						{@const pct = summary.total > 0 ? count / summary.total * 100 : 0}
						<div>
							<div class="flex items-center justify-between mb-0.5">
								<span class="text-xs font-mono text-slate-300">{ip}</span>
								<span class="text-xs text-slate-400 ml-2">{count}</span>
							</div>
							<div class="h-1 bg-slate-700 rounded">
								<div class="h-1 bg-sky-700 rounded" style="width: {pct}%"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Top bots -->
		<div class="bg-slate-800 rounded-xl p-6">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('accessLog').topBots}</h2>
			{#if summary.topBots.length > 0}
				<div class="space-y-2">
					{#each summary.topBots as [name, count]}
						{@const pct = summary.total > 0 ? count / summary.total * 100 : 0}
						<div>
							<div class="flex items-center justify-between mb-0.5">
								<span class="text-xs font-mono text-slate-300 truncate max-w-[75%]" title={name}>{name}</span>
								<span class="text-xs text-slate-400 shrink-0 ml-2">{count}</span>
							</div>
							<div class="h-1 bg-slate-700 rounded">
								<div class="h-1 bg-amber-500 rounded" style="width: {pct}%"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-xs text-slate-300">{$t('accessLog').noBots}</p>
			{/if}
		</div>
	{/if}
</div>
