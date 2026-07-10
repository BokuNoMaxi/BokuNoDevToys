<script lang="ts">
	import { t } from '$lib/i18n';
	import { marked } from 'marked';

	let input = $state('');
	let copied = $state(false);

	let rendered = $derived.by(() => {
		if (!input.trim()) return '';
		return marked(input) as string;
	});

	function copy() {
		navigator.clipboard.writeText(input);
		copied = true;
		setTimeout(() => { copied = false; }, 1500);
	}
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('markdownViewer').input}</h2>
				<div class="flex gap-2">
					{#if input}
						<button onclick={() => input = ''} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('markdownViewer').clear}</button>
						<button onclick={copy} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{copied ? $t('markdownViewer').copied : $t('markdownViewer').copy}</button>
					{/if}
				</div>
			</div>
			<textarea
				bind:value={input}
				placeholder={$t('markdownViewer').placeholder}
				rows="20"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-y"
				spellcheck="false"
			></textarea>
		</div>

		<div class="bg-slate-800 rounded-xl p-6">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('markdownViewer').preview}</h2>
			<div class="bg-slate-900 rounded-lg px-6 py-5 min-h-32 overflow-y-auto max-h-[calc(100vh-200px)] prose-md">
				{#if rendered}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html rendered}
				{:else}
					<p class="text-slate-400 text-sm">{$t('markdownViewer').placeholder}</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	:global(.prose-md h1) { font-size: 1.5rem; font-weight: 700; color: #e2e8f0; margin: 0.75rem 0; border-bottom: 1px solid #334155; padding-bottom: 0.5rem; }
	:global(.prose-md h2) { font-size: 1.25rem; font-weight: 600; color: #e2e8f0; margin: 0.75rem 0; }
	:global(.prose-md h3) { font-size: 1.1rem; font-weight: 600; color: #cbd5e1; margin: 0.5rem 0; }
	:global(.prose-md h4, .prose-md h5, .prose-md h6) { font-weight: 600; color: #94a3b8; margin: 0.5rem 0; }
	:global(.prose-md p) { color: #cbd5e1; margin: 0.5rem 0; line-height: 1.7; }
	:global(.prose-md a) { color: #a78bfa; text-decoration: underline; }
	:global(.prose-md strong) { color: #e2e8f0; font-weight: 700; }
	:global(.prose-md em) { color: #94a3b8; font-style: italic; }
	:global(.prose-md code) { background: #0f172a; color: #34d399; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.85em; font-family: monospace; }
	:global(.prose-md pre) { background: #0f172a; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 0.75rem 0; }
	:global(.prose-md pre code) { background: none; padding: 0; }
	:global(.prose-md ul) { list-style: disc; padding-left: 1.5rem; color: #cbd5e1; margin: 0.5rem 0; }
	:global(.prose-md ol) { list-style: decimal; padding-left: 1.5rem; color: #cbd5e1; margin: 0.5rem 0; }
	:global(.prose-md li) { margin: 0.2rem 0; }
	:global(.prose-md blockquote) { border-left: 3px solid #6d28d9; padding-left: 1rem; margin: 0.75rem 0; color: #94a3b8; font-style: italic; }
	:global(.prose-md hr) { border: none; border-top: 1px solid #334155; margin: 1rem 0; }
	:global(.prose-md table) { border-collapse: collapse; width: 100%; margin: 0.75rem 0; }
	:global(.prose-md th) { background: #1e293b; color: #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; border: 1px solid #334155; }
	:global(.prose-md td) { color: #cbd5e1; padding: 0.5rem 0.75rem; border: 1px solid #334155; }
	:global(.prose-md tr:nth-child(even) td) { background: #1e293b; }
</style>
