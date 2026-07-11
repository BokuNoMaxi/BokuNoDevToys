<script lang="ts">
	import { t } from '$lib/i18n';

	let domainInput = $state('');
	let fetching = $state(false);
	let error = $state('');

	type Status = 'pass' | 'warn' | 'fail';
	interface Finding { status: Status; text: string; }

	let robotsFindings = $state<Finding[] | null>(null);
	let robotsRaw = $state('');
	let sitemapFindings = $state<Finding[] | null>(null);
	let sitemapUrlCount = $state(0);

	function normalizeDomain(input: string): string | null {
		let s = input.trim();
		if (!s) return null;
		if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
		try {
			const u = new URL(s);
			return `${u.protocol}//${u.host}`;
		} catch { return null; }
	}

	async function fetchText(url: string): Promise<string | null> {
		try {
			const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
			const res = await fetch(proxy, { signal: AbortSignal.timeout(15000) });
			if (!res.ok) return null;
			return await res.text();
		} catch { return null; }
	}

	function validateRobots(text: string): Finding[] {
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

	function extractSitemapUrl(robotsText: string): string | null {
		const match = robotsText.split('\n').find(l => /^sitemap:/i.test(l.trim()));
		if (!match) return null;
		return match.split(':').slice(1).join(':').trim();
	}

	function validateSitemap(xml: string): { findings: Finding[]; count: number } {
		const findings: Finding[] = [];
		let count = 0;
		try {
			const doc = new DOMParser().parseFromString(xml, 'application/xml');
			const parseErr = doc.querySelector('parsererror');
			if (parseErr) {
				findings.push({ status: 'fail', text: 'XML could not be parsed — invalid syntax' });
				return { findings, count };
			}

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

	async function analyze() {
		const base = normalizeDomain(domainInput);
		if (!base) { error = $t('robotsSitemap').invalidUrl; return; }

		fetching = true;
		error = '';
		robotsFindings = null;
		sitemapFindings = null;
		robotsRaw = '';
		sitemapUrlCount = 0;

		const robotsText = await fetchText(`${base}/robots.txt`);
		if (robotsText === null) {
			error = $t('robotsSitemap').robotsFetchError;
			fetching = false;
			return;
		}
		robotsRaw = robotsText;
		robotsFindings = validateRobots(robotsText);

		let sitemapUrl = extractSitemapUrl(robotsText);
		if (!sitemapUrl) sitemapUrl = `${base}/sitemap.xml`;

		const sitemapText = await fetchText(sitemapUrl);
		if (sitemapText === null) {
			sitemapFindings = [{ status: 'fail', text: `Could not fetch sitemap at ${sitemapUrl}` }];
		} else {
			const { findings, count } = validateSitemap(sitemapText);
			sitemapFindings = findings;
			sitemapUrlCount = count;
		}

		fetching = false;
	}

	const statusIcon: Record<Status, string> = { pass: '✓', warn: '!', fail: '✕' };
	const statusColor: Record<Status, string> = {
		pass: 'text-emerald-400 bg-emerald-400/10',
		warn: 'text-amber-400 bg-amber-400/10',
		fail: 'text-red-400 bg-red-400/10',
	};
</script>

<div class="space-y-4">
	<div class="bg-slate-800 rounded-xl p-6 space-y-3">
		<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider" for="domain-input">{$t('robotsSitemap').domainLabel}</label>
		<div class="flex gap-3">
			<input
				id="domain-input"
				type="text"
				bind:value={domainInput}
				placeholder="example.com"
				class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500"
				onkeydown={(e) => e.key === 'Enter' && analyze()}
			/>
			<button onclick={analyze} disabled={fetching} class="px-4 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
				{fetching ? $t('robotsSitemap').checking : $t('robotsSitemap').check}
			</button>
		</div>
		<p class="text-xs text-slate-400">{$t('robotsSitemap').proxyNote}</p>
		{#if error}<p class="text-red-300 text-sm">{error}</p>{/if}
	</div>

	{#if robotsFindings}
		<div class="bg-slate-800 rounded-xl p-6 space-y-2">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">robots.txt</h2>
			{#each robotsFindings as f}
				<div class="flex items-start gap-3 bg-slate-900 rounded-lg px-4 py-2.5">
					<span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 {statusColor[f.status]}">{statusIcon[f.status]}</span>
					<p class="text-sm text-slate-300">{f.text}</p>
				</div>
			{/each}
			{#if robotsRaw}
				<details class="mt-2">
					<summary class="text-xs text-slate-400 cursor-pointer hover:text-slate-200 transition-colors">{$t('robotsSitemap').viewRaw}</summary>
					<pre class="mt-2 bg-slate-900 rounded-lg px-4 py-3 text-slate-300 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">{robotsRaw}</pre>
				</details>
			{/if}
		</div>
	{/if}

	{#if sitemapFindings}
		<div class="bg-slate-800 rounded-xl p-6 space-y-2">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
				sitemap.xml {#if sitemapUrlCount > 0}<span class="text-violet-300 font-mono normal-case">({sitemapUrlCount} URLs)</span>{/if}
			</h2>
			{#each sitemapFindings as f}
				<div class="flex items-start gap-3 bg-slate-900 rounded-lg px-4 py-2.5">
					<span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 {statusColor[f.status]}">{statusIcon[f.status]}</span>
					<p class="text-sm text-slate-300">{f.text}</p>
				</div>
			{/each}
		</div>
	{/if}
</div>
