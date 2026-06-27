<script lang="ts">
	import JsonNode from '$lib/components/JsonNode.svelte';

	type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	type BodyType = 'none' | 'form' | 'json' | 'raw';
	type Tab = 'headers' | 'body';

	interface KV { id: number; key: string; value: string; enabled: boolean }

	let method = $state<Method>('GET');
	let url = $state('');
	let activeTab = $state<Tab>('headers');
	let bodyType = $state<BodyType>('none');

	let headers = $state<KV[]>([{ id: 1, key: '', value: '', enabled: true }]);
	let formData = $state<KV[]>([{ id: 1, key: '', value: '', enabled: true }]);
	let jsonBody = $state('');
	let rawBody = $state('');

	let loading = $state(false);
	let response = $state<{
		status: number;
		statusText: string;
		time: number;
		body: string;
		parsedJson: unknown;
		resHeaders: Record<string, string>;
		isJson: boolean;
	} | null>(null);
	let reqError = $state('');
	let resView = $state<'pretty' | 'raw' | 'headers'>('pretty');

	let nextId = 2;
	function newRow(): KV { return { id: nextId++, key: '', value: '', enabled: true }; }

	function ensureLastEmpty(list: KV[]) {
		if (list.length === 0 || list[list.length - 1].key || list[list.length - 1].value) {
			list.push(newRow());
		}
	}

	function removeRow(list: KV[], id: number) {
		const idx = list.findIndex(r => r.id === id);
		if (idx !== -1) list.splice(idx, 1);
		if (list.length === 0) list.push(newRow());
	}

	async function send() {
		if (!url.trim()) return;
		reqError = '';
		response = null;
		loading = true;

		const reqHeaders = new Headers();
		for (const h of headers) {
			if (h.enabled && h.key.trim() && h.value.trim()) {
				reqHeaders.set(h.key.trim(), h.value.trim());
			}
		}

		let body: BodyInit | undefined;
		if (method !== 'GET' && method !== 'DELETE') {
			if (bodyType === 'form') {
				const fd = new FormData();
				for (const row of formData) {
					if (row.enabled && row.key.trim()) fd.append(row.key.trim(), row.value);
				}
				body = fd;
			} else if (bodyType === 'json') {
				reqHeaders.set('Content-Type', 'application/json');
				body = jsonBody;
			} else if (bodyType === 'raw') {
				body = rawBody;
			}
		}

		const start = performance.now();
		try {
			const res = await fetch(url.trim(), { method, headers: reqHeaders, body });
			const time = Math.round(performance.now() - start);
			const text = await res.text();
			const ct = res.headers.get('content-type') ?? '';
			const isJson = ct.includes('json') || (text.trim().startsWith('{') || text.trim().startsWith('['));

			let parsedJson: unknown = null;
			if (isJson) { try { parsedJson = JSON.parse(text); } catch {} }

			const resHeaders: Record<string, string> = {};
			res.headers.forEach((v, k) => { resHeaders[k] = v; });

			response = { status: res.status, statusText: res.statusText, time, body: text, parsedJson, resHeaders, isJson: !!parsedJson };
		} catch (e) {
			reqError = (e as Error).message;
			if (reqError.includes('Failed to fetch') || reqError.includes('NetworkError')) {
				reqError += '\n\nMöglicherweise blockiert CORS den Request. Prüfe ob der Server den Origin erlaubt, oder verwende einen CORS-Proxy.';
			}
		}
		loading = false;
	}

	function statusColor(s: number) {
		if (s < 300) return 'text-emerald-400 bg-emerald-400/10';
		if (s < 400) return 'text-sky-400 bg-sky-400/10';
		if (s < 500) return 'text-amber-400 bg-amber-400/10';
		return 'text-red-400 bg-red-400/10';
	}

	function copyResponse() {
		navigator.clipboard.writeText(response?.body ?? '');
	}

	const METHOD_COLORS: Record<Method, string> = {
		GET: 'text-emerald-400', POST: 'text-sky-400', PUT: 'text-amber-400',
		PATCH: 'text-violet-400', DELETE: 'text-red-400'
	};
</script>

<div class="space-y-4">
	<!-- Request Line -->
	<div class="bg-slate-800 rounded-xl p-4">
		<div class="flex gap-2">
			<select
				bind:value={method}
				class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 font-mono font-semibold text-sm focus:outline-none focus:border-violet-500 {METHOD_COLORS[method]} cursor-pointer"
			>
				{#each (['GET','POST','PUT','PATCH','DELETE'] as Method[]) as m}
					<option value={m} class={METHOD_COLORS[m]}>{m}</option>
				{/each}
			</select>
			<input
				type="text"
				bind:value={url}
				placeholder="https://api.example.com/endpoint"
				onkeydown={(e) => e.key === 'Enter' && send()}
				class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-sm"
			/>
			<button
				onclick={send}
				disabled={loading || !url.trim()}
				class="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg font-medium text-sm transition-colors shrink-0"
			>
				{loading ? '…' : 'Senden'}
			</button>
		</div>
	</div>

	<!-- Headers + Body Tabs -->
	<div class="bg-slate-800 rounded-xl overflow-hidden">
		<div class="flex border-b border-slate-700">
			<button
				onclick={() => activeTab = 'headers'}
				class="px-5 py-3 text-sm font-medium transition-colors {activeTab === 'headers' ? 'text-violet-400 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-300'}"
			>
				Headers
				{#if headers.filter(h => h.enabled && h.key.trim()).length > 0}
					<span class="ml-1.5 text-xs bg-violet-600/30 text-violet-400 rounded-full px-1.5 py-0.5">{headers.filter(h => h.enabled && h.key.trim()).length}</span>
				{/if}
			</button>
			<button
				onclick={() => activeTab = 'body'}
				class="px-5 py-3 text-sm font-medium transition-colors {activeTab === 'body' ? 'text-violet-400 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-300'}"
			>
				Body
				{#if bodyType !== 'none'}<span class="ml-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 inline-block"></span>{/if}
			</button>
		</div>

		<div class="p-4">
			{#if activeTab === 'headers'}
				<div class="space-y-2">
					{#each headers as row (row.id)}
						<div class="flex gap-2 items-center">
							<input type="checkbox" bind:checked={row.enabled} class="accent-violet-500 shrink-0" />
							<input
								type="text"
								bind:value={row.key}
								oninput={() => ensureLastEmpty(headers)}
								placeholder="Header-Name (z.B. Authorization)"
								class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-xs"
							/>
							<input
								type="text"
								bind:value={row.value}
								oninput={() => ensureLastEmpty(headers)}
								placeholder="Bearer token123…"
								class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-xs"
							/>
							<button onclick={() => removeRow(headers, row.id)} class="text-slate-700 hover:text-red-400 transition-colors text-sm px-1 shrink-0">✕</button>
						</div>
					{/each}
				</div>

			{:else}
				<!-- Body type selector -->
				<div class="flex gap-2 mb-4">
					{#each (['none','form','json','raw'] as BodyType[]) as bt}
						<button
							onclick={() => bodyType = bt}
							class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize {bodyType === bt ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}"
						>{bt === 'none' ? 'Keiner' : bt === 'form' ? 'Form Data' : bt.toUpperCase()}</button>
					{/each}
				</div>

				{#if bodyType === 'none'}
					<p class="text-slate-600 text-sm text-center py-4">Kein Request-Body</p>

				{:else if bodyType === 'form'}
					<div class="space-y-2">
						{#each formData as row (row.id)}
							<div class="flex gap-2 items-center">
								<input type="checkbox" bind:checked={row.enabled} class="accent-violet-500 shrink-0" />
								<input
									type="text"
									bind:value={row.key}
									oninput={() => ensureLastEmpty(formData)}
									placeholder="key"
									class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-xs"
								/>
								<input
									type="text"
									bind:value={row.value}
									oninput={() => ensureLastEmpty(formData)}
									placeholder="value"
									class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-xs"
								/>
								<button onclick={() => removeRow(formData, row.id)} class="text-slate-700 hover:text-red-400 transition-colors text-sm px-1 shrink-0">✕</button>
							</div>
						{/each}
					</div>

				{:else if bodyType === 'json'}
					<textarea
						bind:value={jsonBody}
						placeholder={`{\n  "key": "value"\n}`}
						rows="8"
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-violet-500 font-mono text-xs resize-y"
					></textarea>

				{:else if bodyType === 'raw'}
					<textarea
						bind:value={rawBody}
						placeholder="Raw request body…"
						rows="8"
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-violet-500 font-mono text-xs resize-y"
					></textarea>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Error -->
	{#if reqError}
		<div class="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
			<p class="text-red-400 text-sm font-mono whitespace-pre-wrap">{reqError}</p>
		</div>
	{/if}

	<!-- Response -->
	{#if response}
		<div class="bg-slate-800 rounded-xl overflow-hidden">
			<!-- Status bar -->
			<div class="flex items-center gap-4 px-4 py-3 border-b border-slate-700 bg-slate-900/50">
				<span class="font-mono font-bold text-sm px-2.5 py-1 rounded-lg {statusColor(response.status)}">
					{response.status} {response.statusText}
				</span>
				<span class="text-slate-500 text-sm">{response.time} ms</span>
				<span class="text-slate-600 text-xs">{response.body.length} bytes</span>
				<div class="flex gap-1.5 ml-auto">
					{#each (['pretty', 'raw', 'headers'] as const) as v}
						<button
							onclick={() => resView = v}
							class="px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize {resView === v ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}"
						>{v === 'pretty' ? 'Pretty' : v === 'raw' ? 'Raw' : 'Headers'}</button>
					{/each}
					<button onclick={copyResponse} class="px-3 py-1 rounded-lg text-xs border border-slate-700 hover:border-violet-500 text-slate-500 hover:text-violet-400 transition-colors ml-1">
						Kopieren
					</button>
				</div>
			</div>

			<div class="p-4 max-h-[500px] overflow-y-auto">
				{#if resView === 'pretty'}
					{#if response.isJson && response.parsedJson !== null}
						<div class="font-mono text-sm">
							<JsonNode value={response.parsedJson} />
						</div>
					{:else}
						<pre class="font-mono text-xs text-slate-300 whitespace-pre-wrap break-all">{response.body}</pre>
					{/if}

				{:else if resView === 'raw'}
					<pre class="font-mono text-xs text-slate-300 whitespace-pre-wrap break-all">{response.body}</pre>

				{:else}
					<div class="space-y-1.5">
						{#each Object.entries(response.resHeaders) as [k, v]}
							<div class="flex gap-3 font-mono text-xs">
								<span class="text-violet-400 shrink-0 min-w-40">{k}</span>
								<span class="text-slate-300 break-all">{v}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
