<script lang="ts">
	import { t } from '$lib/i18n';
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

	const STOPWORDS: Record<'en' | 'de', Set<string>> = {
		en: new Set(['a','an','the','and','or','but','if','then','else','of','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','once','is','are','was','were','be','been','being','have','has','had','having','do','does','did','doing','will','would','should','could','can','may','might','must','shall','i','you','he','she','it','we','they','them','this','that','these','those','not','no','so','than','too','very','just','also','as','it\'s']),
		de: new Set(['der','die','das','den','dem','des','ein','eine','einer','eines','einem','einen','und','oder','aber','wenn','dann','sonst','von','bei','für','mit','über','gegen','zwischen','in','aus','auf','ab','unter','wieder','ist','sind','war','waren','sein','wird','werden','wurde','haben','hat','hatte','kann','können','muss','müssen','soll','sollen','ich','du','er','sie','es','wir','ihr','sie','diese','jene','nicht','kein','so','als','auch','sehr','nur','zu','zum','zur','im','am','an','um']),
	};

	function extractText(raw: string): string {
		if (!stripHtml) return raw;
		try {
			const doc = new DOMParser().parseFromString(raw, 'text/html');
			doc.querySelectorAll('script,style,noscript').forEach(e => e.remove());
			return doc.body?.textContent ?? raw;
		} catch { return raw; }
	}

	function tokenize(text: string): string[] {
		return text
			.toLowerCase()
			.normalize('NFKC')
			.match(/[\p{L}\p{N}'-]+/gu) ?? [];
	}

	interface Row { phrase: string; count: number; density: number; }

	let result = $derived.by((): { rows: Row[]; totalWords: number } => {
		const text = extractText(input);
		const allWords = tokenize(text);
		const totalWords = allWords.length;
		if (totalWords === 0) return { rows: [], totalWords: 0 };

		const stopset = STOPWORDS[lang];
		const words = ngramSize === 1 ? allWords.filter(w => !stopset.has(w) && w.length > 1) : allWords;

		const counts = new Map<string, number>();
		if (ngramSize === 1) {
			for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
		} else {
			for (let i = 0; i <= allWords.length - ngramSize; i++) {
				const gram = allWords.slice(i, i + ngramSize);
				if (gram.some(w => stopset.has(w))) continue;
				const phrase = gram.join(' ');
				counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
			}
		}

		const rows = Array.from(counts.entries())
			.filter(([, c]) => c > 1)
			.map(([phrase, count]) => ({ phrase, count, density: (count / totalWords) * 100 }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 30);

		return { rows, totalWords };
	});
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
			<p class="text-xs text-slate-400">{$t('keywordDensity').proxyNote}</p>
			{#if fetchError}<p class="text-red-300 text-sm">{fetchError}</p>{/if}
		{/if}

		<div class="flex items-center justify-between">
			<label class="text-xs font-semibold text-slate-300 uppercase tracking-wider" for="kd-input">{$t('keywordDensity').inputLabel}</label>
			<div class="flex items-center gap-3">
				<label class="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
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
			class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-y"
			spellcheck="false"
		></textarea>

		<div class="flex items-center gap-4 flex-wrap">
			<div class="flex items-center gap-2">
				<span class="text-xs text-slate-400">{$t('keywordDensity').phraseLength}</span>
				{#each [1, 2, 3] as n}
					<button onclick={() => ngramSize = n as 1 | 2 | 3} class="px-3 py-1 rounded-lg text-xs font-mono transition-colors {ngramSize === n ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{n}</button>
				{/each}
			</div>
			<div class="flex items-center gap-2">
				<span class="text-xs text-slate-400">{$t('keywordDensity').stopwordLang}</span>
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
				<span class="text-xs text-slate-400">{$t('keywordDensity').totalWords}: <span class="font-mono text-slate-300">{result.totalWords}</span></span>
			</div>
			<div class="space-y-1.5 max-h-[32rem] overflow-y-auto">
				{#each result.rows as row}
					<div class="flex items-center gap-3 bg-slate-900 rounded-lg px-4 py-2">
						<span class="flex-1 text-sm text-slate-200 font-mono truncate">{row.phrase}</span>
						<span class="text-xs text-slate-400 w-16 text-right">{row.count}×</span>
						<div class="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden shrink-0">
							<div class="h-full bg-violet-500" style="width:{Math.min(100, row.density * 8)}%"></div>
						</div>
						<span class="text-xs font-mono text-violet-300 w-14 text-right">{row.density.toFixed(1)}%</span>
					</div>
				{/each}
			</div>
		</div>
	{:else if input.trim()}
		<div class="bg-slate-800 rounded-xl p-6 text-center text-slate-400 text-sm">{$t('keywordDensity').noResults}</div>
	{/if}
</div>
