<script lang="ts">
	import JsonNode from '$lib/components/JsonNode.svelte';
	import { t } from '$lib/i18n';

	let input = $state('');
	let parsed = $state<unknown>(null);
	let error = $state('');
	let rawFormatted = $state('');
	let view = $state<'tree' | 'raw'>('tree');
	let copied = $state(false);

	function format() {
		error = '';
		parsed = null;
		rawFormatted = '';
		if (!input.trim()) return;
		try {
			const obj = JSON.parse(input);
			parsed = obj;
			rawFormatted = JSON.stringify(obj, null, 2);
		} catch (e) {
			error = (e as Error).message;
		}
	}

	function copy() {
		navigator.clipboard.writeText(rawFormatted);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

	function handlePaste() {
		// auto-format after paste
		setTimeout(format, 0);
	}
</script>

<div class="space-y-6">
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">JSON</h2>
		<label for="json-input" class="sr-only">{$t('json').inputLabel}</label>
		<textarea
			id="json-input"
			bind:value={input}
			onpaste={handlePaste}
			placeholder={`{"key": "value", "array": [1, 2, 3]}`}
			rows="8"
			class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-violet-500 font-mono text-xs resize-y"
		></textarea>
		{#if error}
			<p class="mt-2 text-red-300 text-sm font-mono" role="alert">{error}</p>
		{/if}
		<button
			onclick={format}
			disabled={!input.trim()}
			class="mt-3 px-5 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
		>{$t('json').format}</button>
	</div>

	{#if parsed !== null}
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-4">
				<div class="flex gap-2">
					<button
						onclick={() => view = 'tree'}
						class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors {view === 'tree' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}"
					>🌲 {$t('json').tree}</button>
					<button
						onclick={() => view = 'raw'}
						class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors {view === 'raw' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}"
					>{ '{}'} {$t('json').raw}</button>
				</div>
				<button onclick={copy} class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-300 hover:text-violet-300 transition-colors">
					{copied ? $t('json').copied : $t('json').copy}
				</button>
			</div>

			{#if view === 'tree'}
				<div class="bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto max-h-[600px] overflow-y-auto">
					<JsonNode value={parsed} />
				</div>
			{:else}
				<pre class="bg-slate-900 rounded-lg p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[600px] overflow-y-auto whitespace-pre">{rawFormatted}</pre>
			{/if}
		</div>
	{/if}
</div>
