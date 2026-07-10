<script lang="ts">
	import { t } from '$lib/i18n';

	let tab = $state<'url' | 'paste'>('paste');
	let urlInput = $state('');
	let pasteInput = $state('');
	let fetching = $state(false);
	let error = $state('');

	interface SchemaItem {
		type: string;
		context: string;
		valid: boolean;
		data: Record<string, unknown>;
	}

	let results = $state<SchemaItem[]>([]);
	let copiedIdx = $state<number | null>(null);

	function extractSchemas(html: string): SchemaItem[] {
		const items: SchemaItem[] = [];

		// Extract JSON-LD
		const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
		let m: RegExpExecArray | null;
		while ((m = scriptRe.exec(html)) !== null) {
			try {
				const data = JSON.parse(m[1].trim());
				const schemas = Array.isArray(data) ? data : [data];
				for (const s of schemas) {
					items.push({
						type: s['@type'] ?? 'Unknown',
						context: s['@context'] ?? '',
						valid: !!s['@type'] && !!s['@context'],
						data: s,
					});
				}
			} catch { /* skip malformed */ }
		}

		// Try treating paste input directly as JSON-LD
		if (items.length === 0 && !html.includes('<html')) {
			try {
				const data = JSON.parse(html.trim());
				const schemas = Array.isArray(data) ? data : [data];
				for (const s of schemas) {
					items.push({
						type: s['@type'] ?? 'Unknown',
						context: s['@context'] ?? '',
						valid: !!s['@type'] && !!s['@context'],
						data: s,
					});
				}
			} catch { /* not JSON */ }
		}

		return items;
	}

	async function fetchAndAnalyze() {
		if (!urlInput.trim()) return;
		fetching = true;
		error = '';
		results = [];
		try {
			const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(urlInput)}`;
			const res = await fetch(proxy);
			const json = await res.json();
			const html: string = json.contents ?? '';
			results = extractSchemas(html);
			if (results.length === 0) error = $t('schemaAnalyzer').noSchema;
		} catch (e) {
			error = (e as Error).message;
		} finally {
			fetching = false;
		}
	}

	function analyze() {
		error = '';
		results = extractSchemas(pasteInput);
		if (results.length === 0) error = $t('schemaAnalyzer').noSchema;
	}

	function copyItem(i: number) {
		navigator.clipboard.writeText(JSON.stringify(results[i].data, null, 2));
		copiedIdx = i;
		setTimeout(() => { copiedIdx = null; }, 1500);
	}
</script>

<div class="space-y-4">
	<!-- Tabs -->
	<div class="flex gap-2">
		{#each [['paste', $t('schemaAnalyzer').pasteTab], ['url', $t('schemaAnalyzer').urlTab]] as [key, label]}
			<button onclick={() => { tab = key as 'url' | 'paste'; results = []; error = ''; }} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {tab === key ? 'bg-violet-700 text-white' : 'bg-slate-800 text-slate-300 hover:text-slate-100'}">{label}</button>
		{/each}
	</div>

	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		{#if tab === 'url'}
			<div>
				<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" for="schema-url">{$t('schemaAnalyzer').url}</label>
				<div class="flex gap-2">
					<input id="schema-url" type="url" bind:value={urlInput} placeholder={$t('schemaAnalyzer').urlPlaceholder} class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-violet-500" />
					<button onclick={fetchAndAnalyze} disabled={fetching} class="px-4 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
						{fetching ? $t('schemaAnalyzer').fetching : $t('schemaAnalyzer').fetch}
					</button>
				</div>
				<p class="mt-1.5 text-xs text-slate-400">Uses allorigins.win as CORS proxy</p>
			</div>
		{:else}
			<div>
				<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" for="schema-paste">{$t('schemaAnalyzer').pasteTab}</label>
				<textarea id="schema-paste" bind:value={pasteInput} placeholder={$t('schemaAnalyzer').paste} rows="8" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-xs placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-y" spellcheck="false"></textarea>
				<div class="flex gap-2 mt-2">
					<button onclick={analyze} class="px-4 py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-lg text-sm font-medium transition-colors">{$t('schemaAnalyzer').analyze}</button>
					{#if pasteInput}
						<button onclick={() => { pasteInput = ''; results = []; error = ''; }} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('schemaAnalyzer').clear}</button>
					{/if}
				</div>
			</div>
		{/if}

		{#if error}
			<p class="text-red-300 text-sm">{error}</p>
		{/if}
	</div>

	{#if results.length > 0}
		<div class="space-y-3">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('schemaAnalyzer').result} ({results.length})</h2>
			{#each results as item, i}
				<div class="bg-slate-800 rounded-xl p-5 space-y-3">
					<div class="flex items-center justify-between flex-wrap gap-2">
						<div class="flex items-center gap-3">
							<span class="text-sm font-semibold text-slate-200">{item.type}</span>
							<span class="text-xs px-2 py-0.5 rounded-full {item.valid ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40' : 'bg-red-900/30 text-red-300 border border-red-700/30'}">
								{item.valid ? $t('schemaAnalyzer').valid : $t('schemaAnalyzer').invalid}
							</span>
							{#if item.context}
								<span class="text-xs text-slate-400 font-mono">{item.context}</span>
							{/if}
						</div>
						<button onclick={() => copyItem(i)} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">
							{copiedIdx === i ? $t('schemaAnalyzer').copied : $t('schemaAnalyzer').copy}
						</button>
					</div>
					<pre class="bg-slate-900 rounded-lg px-4 py-3 text-slate-300 text-xs font-mono overflow-x-auto whitespace-pre">{JSON.stringify(item.data, null, 2)}</pre>
				</div>
			{/each}
		</div>
	{/if}
</div>
