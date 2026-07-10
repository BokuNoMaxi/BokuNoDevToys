<script lang="ts">
	import { t } from '$lib/i18n';
	import { format } from 'sql-formatter';

	type Dialect = 'mysql' | 'postgresql' | 'sqlite' | 'sql';
	let input = $state('');
	let dialect = $state<Dialect>('mysql');
	let copied = $state(false);

	let result = $derived.by((): { output: string; error: string } => {
		if (!input.trim()) return { output: '', error: '' };
		try {
			const output = format(input, { language: dialect, tabWidth: 2, keywordCase: 'upper' });
			return { output, error: '' };
		} catch (e) {
			return { output: '', error: (e as Error).message };
		}
	});

	function copy() {
		navigator.clipboard.writeText(result.output);
		copied = true;
		setTimeout(() => { copied = false; }, 1500);
	}

	const dialects: [Dialect, string][] = [
		['mysql',      'MySQL'],
		['postgresql', 'PostgreSQL'],
		['sqlite',     'SQLite'],
		['sql',        'Generic SQL'],
	];
</script>

<div class="space-y-4">
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<div>
			<span class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('sqlFormatter').dialect}</span>
			<div class="flex flex-wrap gap-2">
				{#each dialects as [d, label]}
					<button onclick={() => dialect = d} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {dialect === d ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{label}</button>
				{/each}
			</div>
		</div>

		<div>
			<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" for="sql-input">SQL</label>
			<textarea
				id="sql-input"
				bind:value={input}
				placeholder={$t('sqlFormatter').placeholder}
				rows="10"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-y"
				spellcheck="false"
			></textarea>
			{#if input}
				<button onclick={() => input = ''} class="mt-1.5 text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('sqlFormatter').clear}</button>
			{/if}
		</div>
	</div>

	<div class="bg-slate-800 rounded-xl p-6">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('sqlFormatter').result}</h2>
			{#if result.output}
				<button onclick={copy} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{copied ? $t('sqlFormatter').copied : $t('sqlFormatter').copy}</button>
			{/if}
		</div>
		{#if result.error}
			<p class="text-red-300 text-sm mb-2">{$t('sqlFormatter').error}: {result.error}</p>
		{/if}
		{#if result.output}
			<pre class="bg-slate-900 rounded-lg px-4 py-3 text-emerald-400 text-sm font-mono overflow-x-auto whitespace-pre max-h-96 overflow-y-auto">{result.output}</pre>
		{:else if !result.error}
			<div class="bg-slate-900 rounded-lg px-4 py-8 flex items-center justify-center">
				<p class="text-slate-400 text-sm">{$t('sqlFormatter').empty}</p>
			</div>
		{/if}
	</div>
</div>
