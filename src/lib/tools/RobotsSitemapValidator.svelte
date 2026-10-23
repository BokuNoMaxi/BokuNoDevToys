<script lang="ts">
	import { t } from '$lib/i18n';
	import { validateRobots, extractSitemapUrl, validateSitemap, type Finding, type Status } from '$lib/core/sitemap';
	import { browserParseDoc } from '$lib/core/dom';
	import { fetchTextViaProxy } from '$lib/corsProxy';

	let domainInput = $state('');
	let fetching = $state(false);
	let error = $state('');

	let robotsFindings = $state<Finding[] | null>(null);
	let robotsRaw = $state('');
	let robotsUrl = $state('');
	let sitemapFindings = $state<Finding[] | null>(null);
	let sitemapUrlCount = $state(0);
	let sitemapRaw = $state('');
	let sitemapUrl = $state('');

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
			return await fetchTextViaProxy(url);
		} catch {
			return null;
		}
	}

	async function analyze() {
		const base = normalizeDomain(domainInput);
		if (!base) { error = $t('robotsSitemap').invalidUrl; return; }

		fetching = true;
		error = '';
		robotsFindings = null;
		sitemapFindings = null;
		robotsRaw = '';
		sitemapRaw = '';
		sitemapUrlCount = 0;

		robotsUrl = `${base}/robots.txt`;
		const robotsText = await fetchText(robotsUrl);
		if (robotsText === null) {
			error = $t('robotsSitemap').robotsFetchError;
			fetching = false;
			return;
		}
		robotsRaw = robotsText;
		robotsFindings = validateRobots(robotsText);

		sitemapUrl = extractSitemapUrl(robotsText) || `${base}/sitemap.xml`;

		const sitemapText = await fetchText(sitemapUrl);
		if (sitemapText === null) {
			sitemapFindings = [{ status: 'fail', text: `Could not fetch sitemap at ${sitemapUrl}` }];
		} else {
			sitemapRaw = sitemapText;
			const { findings, count } = validateSitemap(sitemapText, browserParseDoc);
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
			<div class="flex items-center justify-between mb-1">
				<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">robots.txt</h2>
				{#if robotsUrl}
					<a href={robotsUrl} target="_blank" rel="noopener noreferrer" class="text-xs text-violet-300 hover:text-violet-200 transition-colors">{$t('robotsSitemap').openLink} ↗</a>
				{/if}
			</div>
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
			<div class="flex items-center justify-between mb-1">
				<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">
					sitemap.xml {#if sitemapUrlCount > 0}<span class="text-violet-300 font-mono normal-case">({sitemapUrlCount} URLs)</span>{/if}
				</h2>
				{#if sitemapUrl}
					<a href={sitemapUrl} target="_blank" rel="noopener noreferrer" class="text-xs text-violet-300 hover:text-violet-200 transition-colors">{$t('robotsSitemap').openLink} ↗</a>
				{/if}
			</div>
			{#each sitemapFindings as f}
				<div class="flex items-start gap-3 bg-slate-900 rounded-lg px-4 py-2.5">
					<span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 {statusColor[f.status]}">{statusIcon[f.status]}</span>
					<p class="text-sm text-slate-300">{f.text}</p>
				</div>
			{/each}
			{#if sitemapRaw}
				<details class="mt-2">
					<summary class="text-xs text-slate-400 cursor-pointer hover:text-slate-200 transition-colors">{$t('robotsSitemap').viewSitemap}</summary>
					<pre class="mt-2 bg-slate-900 rounded-lg px-4 py-3 text-slate-300 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">{sitemapRaw}</pre>
				</details>
			{/if}
		</div>
	{/if}
</div>
