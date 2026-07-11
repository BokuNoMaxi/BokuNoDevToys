<script lang="ts">
	import { t } from '$lib/i18n';
	import { isHttpUrl, fetchHtmlViaProxy } from '$lib/corsProxy';

	type Mode = 'url' | 'paste';
	let mode = $state<Mode>('url');
	let urlInput = $state('');
	let pasteInput = $state('');
	let fetching = $state(false);
	let error = $state('');

	type Status = 'pass' | 'warn' | 'fail';
	interface Check { key: string; label: string; status: Status; detail: string; weight: number; }

	function analyzeHtml(html: string): Check[] {
		const doc = new DOMParser().parseFromString(html, 'text/html');
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
		if (mode === 'url' && urlInput) {
			const isHttps = urlInput.trim().toLowerCase().startsWith('https://');
			checks.push(isHttps
				? { key: 'https', label: 'HTTPS', status: 'pass', detail: 'Served over HTTPS', weight: 5 }
				: { key: 'https', label: 'HTTPS', status: 'fail', detail: 'Not served over HTTPS', weight: 5 });
		}

		return checks;
	}

	let checks = $state<Check[] | null>(null);

	let score = $derived.by(() => {
		if (!checks) return null;
		const total = checks.reduce((s, c) => s + c.weight, 0);
		const earned = checks.reduce((s, c) => s + (c.status === 'pass' ? c.weight : c.status === 'warn' ? c.weight * 0.5 : 0), 0);
		return Math.round((earned / total) * 100);
	});

	let scoreColor = $derived.by(() => {
		if (score === null) return 'text-slate-300';
		if (score >= 80) return 'text-emerald-400';
		if (score >= 50) return 'text-amber-400';
		return 'text-red-400';
	});

	async function fetchAndAnalyze() {
		if (!urlInput.trim() || !isHttpUrl(urlInput.trim())) {
			error = $t('seoScore').invalidUrl;
			return;
		}
		fetching = true;
		error = '';
		checks = null;
		try {
			const html = await fetchHtmlViaProxy(urlInput.trim());
			checks = analyzeHtml(html);
		} catch {
			error = $t('seoScore').fetchError;
		} finally {
			fetching = false;
		}
	}

	function analyzePaste() {
		error = '';
		if (!pasteInput.trim()) return;
		checks = analyzeHtml(pasteInput);
	}

	const statusIcon: Record<Status, string> = { pass: '✓', warn: '!', fail: '✕' };
	const statusColor: Record<Status, string> = {
		pass: 'text-emerald-400 bg-emerald-400/10',
		warn: 'text-amber-400 bg-amber-400/10',
		fail: 'text-red-400 bg-red-400/10',
	};
</script>

<div class="space-y-4">
	<!-- Mode tabs -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<div class="flex gap-2">
			<button onclick={() => mode = 'url'} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {mode === 'url' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{$t('seoScore').urlTab}</button>
			<button onclick={() => mode = 'paste'} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {mode === 'paste' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{$t('seoScore').pasteTab}</button>
		</div>

		{#if mode === 'url'}
			<div class="flex gap-3">
				<input
					type="text"
					bind:value={urlInput}
					placeholder="https://example.com"
					class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500"
					onkeydown={(e) => e.key === 'Enter' && fetchAndAnalyze()}
				/>
				<button onclick={fetchAndAnalyze} disabled={fetching} class="px-4 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
					{fetching ? $t('seoScore').analyzing : $t('seoScore').analyze}
				</button>
			</div>
			<p class="text-xs text-slate-400">{$t('seoScore').proxyNote}</p>
		{:else}
			<textarea
				bind:value={pasteInput}
				placeholder={$t('seoScore').pastePlaceholder}
				rows="8"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-xs placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-y"
				spellcheck="false"
			></textarea>
			<button onclick={analyzePaste} class="px-4 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-lg text-sm font-medium transition-colors">{$t('seoScore').analyze}</button>
		{/if}

		{#if error}
			<p class="text-red-300 text-sm">{error}</p>
		{/if}
	</div>

	{#if checks}
		<!-- Score -->
		<div class="bg-slate-800 rounded-xl p-6 flex items-center gap-6">
			<div class="text-5xl font-bold {scoreColor}">{score}</div>
			<div>
				<p class="text-sm text-slate-300 font-medium">{$t('seoScore').scoreLabel}</p>
				<p class="text-xs text-slate-400 mt-0.5">{$t('seoScore').scoreOutOf}</p>
			</div>
		</div>

		<!-- Checks -->
		<div class="bg-slate-800 rounded-xl p-6 space-y-2">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('seoScore').checksTitle}</h2>
			{#each checks as check}
				<div class="flex items-start gap-3 bg-slate-900 rounded-lg px-4 py-3">
					<span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 {statusColor[check.status]}">{statusIcon[check.status]}</span>
					<div class="flex-1 min-w-0">
						<p class="text-sm text-slate-200 font-medium">{check.label}</p>
						<p class="text-xs text-slate-400 mt-0.5 break-words">{check.detail}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
