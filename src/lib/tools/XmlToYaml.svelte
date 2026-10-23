<script lang="ts">
	import { t } from '$lib/i18n';
	import { xmlToYaml } from '$lib/core/xml';
	import { browserParseDoc } from '$lib/core/dom';

	let xmlInput = $state('');
	let copied = $state(false);

	let result = $derived.by((): { yaml: string; error: string } => {
		if (!xmlInput.trim()) return { yaml: '', error: '' };
		try {
			return { yaml: xmlToYaml(xmlInput, browserParseDoc), error: '' };
		} catch (e) {
			return { yaml: '', error: (e as Error).message };
		}
	});

	function copy() {
		navigator.clipboard.writeText(result.yaml);
		copied = true;
		setTimeout(() => { copied = false; }, 1500);
	}
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('xmlToYaml').xmlInput}</h2>
				{#if xmlInput}
					<button onclick={() => { xmlInput = ''; }} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('xmlToYaml').clear}</button>
				{/if}
			</div>
			<textarea
				bind:value={xmlInput}
				placeholder={$t('xmlToYaml').placeholder}
				rows="18"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-y"
				spellcheck="false"
			></textarea>
		</div>

		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('xmlToYaml').yamlOutput}</h2>
				{#if result.yaml}
					<button onclick={copy} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{copied ? $t('xmlToYaml').copied : $t('xmlToYaml').copy}</button>
				{/if}
			</div>
			{#if result.error}
				<p class="text-red-300 text-xs mb-3">{$t('xmlToYaml').error}: {result.error}</p>
			{/if}
			{#if result.yaml}
				<pre class="bg-slate-900 rounded-lg px-4 py-3 text-emerald-400 text-sm font-mono overflow-x-auto whitespace-pre max-h-96 overflow-y-auto">{result.yaml}</pre>
			{:else if !result.error}
				<div class="bg-slate-900 rounded-lg px-4 py-8 min-h-48 flex items-center justify-center">
					<p class="text-slate-400 text-sm">{$t('xmlToYaml').placeholder}</p>
				</div>
			{/if}
		</div>
	</div>
</div>
