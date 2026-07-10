<script lang="ts">
	import { t } from '$lib/i18n';

	let url = $state('');
	let loading = $state(false);
	let error = $state('');
	let headers = $state<Record<string, string>>({});
	let checked = $state(false);

	const CORS_HEADERS = [
		{ key: 'access-control-allow-origin',      label: 'corsChecker', field: 'origin' as const },
		{ key: 'access-control-allow-methods',     label: 'corsChecker', field: 'methods' as const },
		{ key: 'access-control-allow-headers',     label: 'corsChecker', field: 'headers' as const },
		{ key: 'access-control-max-age',           label: 'corsChecker', field: 'maxAge' as const },
		{ key: 'access-control-allow-credentials', label: 'corsChecker', field: 'credentials' as const },
	];

	async function check() {
		if (!url.trim()) return;
		loading = true;
		error = '';
		headers = {};
		checked = false;
		try {
			const res = await fetch(url, { method: 'OPTIONS', mode: 'cors' });
			const h: Record<string, string> = {};
			for (const [k, v] of res.headers.entries()) {
				h[k.toLowerCase()] = v;
			}
			headers = h;
			checked = true;
		} catch (e) {
			error = (e as Error).message;
			checked = true;
		} finally {
			loading = false;
		}
	}

	function hasCorsHeaders() {
		return CORS_HEADERS.some(h => headers[h.key]);
	}

	function isGood(key: string, value: string) {
		if (key === 'access-control-allow-origin') return value === '*' || value.length > 0;
		return value.length > 0;
	}
</script>

<div class="space-y-4">
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<div>
			<label for="cors-url" class="block text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('corsChecker').url}</label>
			<div class="flex gap-3">
				<input
					id="cors-url"
					bind:value={url}
					placeholder={$t('corsChecker').urlPlaceholder}
					type="url"
					onkeydown={(e) => e.key === 'Enter' && check()}
					class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm"
				/>
				<button
					onclick={check}
					disabled={loading || !url.trim()}
					class="px-6 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors whitespace-nowrap"
				>{loading ? $t('corsChecker').checking : $t('corsChecker').check}</button>
			</div>
		</div>
		<p class="text-xs text-slate-400">{$t('corsChecker').browserNote}</p>
	</div>

	{#if checked}
		<div class="bg-slate-800 rounded-xl p-6">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">{$t('corsChecker').result}</h2>

			{#if error}
				<p role="alert" class="text-red-300 text-sm mb-3">{$t('corsChecker').errorHint}</p>
				<p class="text-xs font-mono text-slate-400">{error}</p>
			{:else if !hasCorsHeaders()}
				<p class="text-amber-400 text-sm">{$t('corsChecker').noHeaders}</p>
			{:else}
				<div class="space-y-3">
					{#each CORS_HEADERS as h}
						{@const value = headers[h.key]}
						<div class="flex items-start gap-3">
							<div class="w-2 h-2 rounded-full mt-1.5 shrink-0 {value ? (isGood(h.key, value) ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-slate-600'}"></div>
							<div class="flex-1 min-w-0">
								<p class="text-xs text-slate-400 font-mono">{h.key}</p>
								<p class="text-sm {value ? (isGood(h.key, value) ? 'text-emerald-300' : 'text-amber-300') : 'text-slate-500'}">
									{value ?? $t('corsChecker').notSet}
								</p>
							</div>
						</div>
					{/each}
				</div>

				<!-- All received headers -->
				{#if Object.keys(headers).length > 0}
					<details class="mt-6">
						<summary class="text-xs text-slate-400 cursor-pointer hover:text-slate-300">All response headers ({Object.keys(headers).length})</summary>
						<div class="mt-3 space-y-1 bg-slate-900 rounded-lg px-4 py-3 max-h-64 overflow-y-auto">
							{#each Object.entries(headers) as [k, v]}
								<div class="flex gap-2 text-xs font-mono">
									<span class="text-slate-400 shrink-0">{k}:</span>
									<span class="text-slate-300 break-all">{v}</span>
								</div>
							{/each}
						</div>
					</details>
				{/if}
			{/if}
		</div>
	{/if}
</div>
