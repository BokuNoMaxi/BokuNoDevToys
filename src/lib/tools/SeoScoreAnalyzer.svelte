<script lang="ts">
	import { t } from '$lib/i18n';
	import { analyzeSeo, seoScore, type Check, type Status } from '$lib/core/seo';
	import { browserParseDoc } from '$lib/core/dom';
	import { isHttpUrl, fetchHtmlViaProxy } from '$lib/corsProxy';

	type Mode = 'url' | 'paste';
	let mode = $state<Mode>('url');
	let urlInput = $state('');
	let pasteInput = $state('');
	let fetching = $state(false);
	let error = $state('');

	function analyzeHtml(html: string): Check[] {
		return analyzeSeo(browserParseDoc(html, 'html'), mode === 'url' ? urlInput : undefined);
	}

	let checks = $state<Check[] | null>(null);

	let score = $derived(checks ? seoScore(checks) : null);

	let scoreColor = $derived.by(() => {
		if (score === null) return 'text-slate-300';
		if (score >= 80) return 'text-emerald-400';
		if (score >= 50) return 'text-amber-400';
		return 'text-red-300';
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
		fail: 'text-red-300 bg-red-400/10',
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
			<p class="text-xs text-slate-300">{$t('seoScore').proxyNote}</p>
		{:else}
			<textarea
				bind:value={pasteInput}
				placeholder={$t('seoScore').pastePlaceholder}
				rows="8"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-xs placeholder-slate-300 focus:outline-none focus:border-violet-500 resize-y"
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
				<p class="text-xs text-slate-300 mt-0.5">{$t('seoScore').scoreOutOf}</p>
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
						<p class="text-xs text-slate-300 mt-0.5 break-words">{check.detail}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
