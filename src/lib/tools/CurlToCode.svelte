<script lang="ts">
	import { t } from '$lib/i18n';
	import { curlToCode } from '$lib/core/curl';

	let input = $state('');
	let target = $state<'js' | 'php' | 'python'>('js');
	let copied = $state(false);

	let result = $derived.by(() => {
		if (!input.trim()) return null;
		const code = curlToCode(input, target);
		if (code === null) return { code: '', error: $t('curlToCode').error };
		return { code, error: '' };
	});

	function copy() {
		if (result?.code) {
			navigator.clipboard.writeText(result.code);
			copied = true;
			setTimeout(() => { copied = false; }, 1500);
		}
	}
</script>

<div class="space-y-4">
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<div>
			<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" for="curl-input">{$t('curlToCode').input}</label>
			<textarea
				id="curl-input"
				bind:value={input}
				placeholder={$t('curlToCode').placeholder}
				rows="5"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-y"
				spellcheck="false"
			></textarea>
			{#if input}
				<button onclick={() => input = ''} class="mt-1.5 text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('curlToCode').clear}</button>
			{/if}
		</div>

		<div>
			<span class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('curlToCode').target}</span>
			<div class="flex gap-2">
				{#each [['js', $t('curlToCode').js], ['php', $t('curlToCode').php], ['python', $t('curlToCode').python]] as [key, label]}
					<button
						onclick={() => target = key as 'js' | 'php' | 'python'}
						class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {target === key ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}"
					>{label}</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="bg-slate-800 rounded-xl p-6">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('curlToCode').result}</h2>
			{#if result?.code}
				<button onclick={copy} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{copied ? $t('curlToCode').copied : $t('curlToCode').copy}</button>
			{/if}
		</div>
		{#if result?.error}
			<p class="text-red-300 text-sm">{result.error}</p>
		{:else if result?.code}
			<pre class="bg-slate-900 rounded-lg px-4 py-3 text-emerald-400 text-sm overflow-x-auto whitespace-pre font-mono leading-relaxed">{result.code}</pre>
		{:else}
			<div class="bg-slate-900 rounded-lg px-4 py-8 flex items-center justify-center">
				<p class="text-slate-400 text-sm">{$t('curlToCode').empty}</p>
			</div>
		{/if}
	</div>
</div>
