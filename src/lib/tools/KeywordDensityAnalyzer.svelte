<script lang="ts">
	import { t } from '$lib/i18n';
	import { keywordDensity, extractVisibleText } from '$lib/core/keywords';
	import { browserParseDoc } from '$lib/core/dom';
	import { isHttpUrl, fetchHtmlViaProxy } from '$lib/corsProxy';

	type Mode = 'paste' | 'url';
	let mode = $state<Mode>('paste');
	let input = $state('');
	let urlInput = $state('');
	let fetching = $state(false);
	let fetchError = $state('');
	let stripHtml = $state(true);
	let ngramSize = $state<1 | 2 | 3>(1);
	let lang = $state<'en' | 'de'>('en');

	async function fetchFromUrl() {
		if (!urlInput.trim() || !isHttpUrl(urlInput.trim())) {
			fetchError = $t('keywordDensity').invalidUrl;
			return;
		}
		fetching = true;
		fetchError = '';
		try {
			input = await fetchHtmlViaProxy(urlInput.trim());
			stripHtml = true;
		} catch {
			fetchError = $t('keywordDensity').fetchError;
		} finally {
			fetching = false;
		}
	}

	function extractText(raw: string): string {
		if (!stripHtml) return raw;
		try {
			return extractVisibleText(browserParseDoc(raw, 'html'), raw);
		} catch { return raw; }
	}

	let result = $derived(keywordDensity(extractText(input), ngramSize, lang));
</script>

<div class="space-y-4">
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<div class="flex gap-2">
			<button onclick={() => mode = 'paste'} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {mode === 'paste' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{$t('keywordDensity').pasteTab}</button>
			<button onclick={() => mode = 'url'} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {mode === 'url' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{$t('keywordDensity').urlTab}</button>
		</div>

		{#if mode === 'url'}
			<div class="flex gap-3">
				<input
					type="text"
					bind:value={urlInput}
					placeholder="https://example.com"
					class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500"
					onkeydown={(e) => e.key === 'Enter' && fetchFromUrl()}
				/>
				<button onclick={fetchFromUrl} disabled={fetching} class="px-4 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
					{fetching ? $t('keywordDensity').fetching : $t('keywordDensity').fetch}
				</button>
			</div>
			<p class="text-xs text-slate-300">{$t('keywordDensity').proxyNote}</p>
			{#if fetchError}<p class="text-red-300 text-sm">{fetchError}</p>{/if}
		{/if}

		<div class="flex items-center justify-between">
			<label class="text-xs font-semibold text-slate-300 uppercase tracking-wider" for="kd-input">{$t('keywordDensity').inputLabel}</label>
			<div class="flex items-center gap-3">
				<label class="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
					<input type="checkbox" bind:checked={stripHtml} class="accent-violet-500" />
					{$t('keywordDensity').stripHtml}
				</label>
			</div>
		</div>
		<textarea
			id="kd-input"
			bind:value={input}
			placeholder={$t('keywordDensity').placeholder}
			rows="10"
			class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 text-sm placeholder-slate-300 focus:outline-none focus:border-violet-500 resize-y"
			spellcheck="false"
		></textarea>

		<div class="flex items-center gap-4 flex-wrap">
			<div class="flex items-center gap-2">
				<span class="text-xs text-slate-300">{$t('keywordDensity').phraseLength}</span>
				{#each [1, 2, 3] as n}
					<button onclick={() => ngramSize = n as 1 | 2 | 3} class="px-3 py-1 rounded-lg text-xs font-mono transition-colors {ngramSize === n ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{n}</button>
				{/each}
			</div>
			<div class="flex items-center gap-2">
				<span class="text-xs text-slate-300">{$t('keywordDensity').stopwordLang}</span>
				{#each [['en','EN'],['de','DE']] as [v, label]}
					<button onclick={() => lang = v as 'en' | 'de'} class="px-3 py-1 rounded-lg text-xs font-medium transition-colors {lang === v ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{label}</button>
				{/each}
			</div>
		</div>
	</div>

	{#if result.rows.length > 0}
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('keywordDensity').resultsTitle}</h2>
				<span class="text-xs text-slate-300">{$t('keywordDensity').totalWords}: <span class="font-mono text-slate-300">{result.totalWords}</span></span>
			</div>
			<div class="space-y-1.5 max-h-[32rem] overflow-y-auto">
				{#each result.rows as row}
					<div class="flex items-center gap-3 bg-slate-900 rounded-lg px-4 py-2">
						<span class="flex-1 text-sm text-slate-200 font-mono truncate">{row.phrase}</span>
						<span class="text-xs text-slate-300 w-16 text-right">{row.count}×</span>
						<div class="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden shrink-0">
							<div class="h-full bg-violet-500" style="width:{Math.min(100, row.density * 8)}%"></div>
						</div>
						<span class="text-xs font-mono text-violet-300 w-14 text-right">{row.density.toFixed(1)}%</span>
					</div>
				{/each}
			</div>
		</div>
	{:else if input.trim()}
		<div class="bg-slate-800 rounded-xl p-6 text-center text-slate-300 text-sm">{$t('keywordDensity').noResults}</div>
	{/if}
</div>
