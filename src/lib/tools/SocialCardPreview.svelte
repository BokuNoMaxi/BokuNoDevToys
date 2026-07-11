<script lang="ts">
	import { t } from '$lib/i18n';
	import { isHttpUrl, fetchHtmlViaProxy } from '$lib/corsProxy';

	type Mode = 'manual' | 'url';
	let mode = $state<Mode>('manual');

	let ogTitle = $state('BokuNoDevToys — Free Online Developer Tools');
	let ogDescription = $state('Free browser-based developer tools. Everything runs client-side — no data leaves your browser.');
	let ogImage = $state('');
	let ogUrl = $state('https://devtoys.bokunocompany.at');
	let siteName = $state('BokuNoDevToys');

	let fetchUrl = $state('');
	let fetching = $state(false);
	let error = $state('');

	// Only allow http(s) image URLs into <img src> to prevent scheme abuse (javascript:, data:, etc.)
	function safeImageUrl(u: string): string {
		return u && isHttpUrl(u) ? u : '';
	}

	function safeDisplayUrl(u: string): string {
		if (!u) return '';
		try {
			const p = new URL(isHttpUrl(u) ? u : `https://${u}`);
			return p.hostname;
		} catch { return ''; }
	}

	async function fetchMeta() {
		if (!fetchUrl.trim() || !isHttpUrl(fetchUrl.trim())) {
			error = $t('socialCard').invalidUrl;
			return;
		}
		fetching = true;
		error = '';
		try {
			const html = await fetchHtmlViaProxy(fetchUrl.trim());
			const doc = new DOMParser().parseFromString(html, 'text/html');
			const get = (sel: string, attr = 'content') => doc.querySelector(sel)?.getAttribute(attr)?.trim() ?? '';

			ogTitle = get('meta[property="og:title"]') || doc.querySelector('title')?.textContent?.trim() || '';
			ogDescription = get('meta[property="og:description"]') || get('meta[name="description"]') || '';
			ogImage = get('meta[property="og:image"]');
			ogUrl = get('meta[property="og:url"]') || fetchUrl.trim();
			siteName = get('meta[property="og:site_name"]') || safeDisplayUrl(fetchUrl.trim());
		} catch {
			error = $t('socialCard').fetchError;
		} finally {
			fetching = false;
		}
	}

	let displayImage = $derived(safeImageUrl(ogImage));
	let displayHost = $derived(safeDisplayUrl(ogUrl) || 'example.com');
</script>

<div class="space-y-4">
	<!-- Input -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<div class="flex gap-2">
			<button onclick={() => mode = 'manual'} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {mode === 'manual' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{$t('socialCard').manualTab}</button>
			<button onclick={() => mode = 'url'} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {mode === 'url' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{$t('socialCard').urlTab}</button>
		</div>

		{#if mode === 'url'}
			<div class="flex gap-3">
				<input
					type="text"
					bind:value={fetchUrl}
					placeholder="https://example.com"
					class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500"
					onkeydown={(e) => e.key === 'Enter' && fetchMeta()}
				/>
				<button onclick={fetchMeta} disabled={fetching} class="px-4 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
					{fetching ? $t('socialCard').fetching : $t('socialCard').fetch}
				</button>
			</div>
			{#if error}<p class="text-red-300 text-sm">{error}</p>{/if}
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="sm:col-span-2">
					<label class="block text-xs text-slate-400 mb-1.5">og:title</label>
					<input type="text" bind:value={ogTitle} class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-violet-500" />
				</div>
				<div class="sm:col-span-2">
					<label class="block text-xs text-slate-400 mb-1.5">og:description</label>
					<textarea bind:value={ogDescription} rows="2" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-violet-500 resize-y"></textarea>
				</div>
				<div class="sm:col-span-2">
					<label class="block text-xs text-slate-400 mb-1.5">og:image (URL)</label>
					<input type="text" bind:value={ogImage} placeholder="https://…/image.png" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-violet-500" />
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">og:url</label>
					<input type="text" bind:value={ogUrl} class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-violet-500" />
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">og:site_name</label>
					<input type="text" bind:value={siteName} class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-violet-500" />
				</div>
			</div>
		{/if}
	</div>

	<!-- Facebook / LinkedIn style card -->
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('socialCard').facebookPreview}</h2>
		<div class="max-w-md rounded-lg overflow-hidden border border-slate-300 bg-white">
			<div class="aspect-[1.91/1] bg-slate-200 flex items-center justify-center overflow-hidden">
				{#if displayImage}
					<img src={displayImage} alt="" class="w-full h-full object-cover" />
				{:else}
					<span class="text-slate-400 text-xs">{$t('socialCard').noImage}</span>
				{/if}
			</div>
			<div class="p-3 bg-[#f0f2f5]">
				<p class="text-xs text-[#65676b] uppercase">{displayHost}</p>
				<p class="text-sm font-semibold text-[#050505] mt-0.5 leading-tight line-clamp-2">{ogTitle || 'Title'}</p>
				<p class="text-xs text-[#65676b] mt-0.5 line-clamp-1">{ogDescription || ''}</p>
			</div>
		</div>
	</div>

	<!-- Twitter/X style card -->
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('socialCard').twitterPreview}</h2>
		<div class="max-w-md rounded-2xl overflow-hidden border border-slate-700">
			<div class="aspect-[1.91/1] bg-slate-700 flex items-center justify-center overflow-hidden">
				{#if displayImage}
					<img src={displayImage} alt="" class="w-full h-full object-cover" />
				{:else}
					<span class="text-slate-400 text-xs">{$t('socialCard').noImage}</span>
				{/if}
			</div>
			<div class="p-3 bg-slate-900">
				<p class="text-xs text-slate-400">{displayHost}</p>
				<p class="text-sm font-medium text-slate-100 mt-0.5 leading-tight line-clamp-1">{ogTitle || 'Title'}</p>
				<p class="text-xs text-slate-400 mt-0.5 line-clamp-2">{ogDescription || ''}</p>
			</div>
		</div>
	</div>
</div>
