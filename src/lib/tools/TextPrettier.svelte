<script lang="ts">
	import { t } from '$lib/i18n';

	let input = $state('');
	let copied = $state(false);

	type Mode = 'auto' | 'single' | 'paragraph' | 'compact';
	let mode = $state<Mode>('auto');
	let stripHtml = $state(false);

	function removeHtml(text: string): string {
		return text
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<\/?(p|div|h[1-6]|li|tr|blockquote|section|article|header|footer|main|aside)[^>]*>/gi, '\n')
			.replace(/<[^>]+>/g, '')
			.replace(/&nbsp;/g, ' ')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&[a-z]+;/gi, ' ');
	}

	function prettify(text: string, m: Mode, doStripHtml: boolean): string {
		if (!text.trim()) return '';

		let result = doStripHtml ? removeHtml(text) : text;

		// Normalize line endings and trim each line
		result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
		result = result.split('\n').map(l => l.trim()).join('\n');

		let resolvedMode = m;
		if (m === 'auto') {
			const lines = result.split('\n').filter(l => l.length > 0);
			const avgLen = lines.reduce((s, l) => s + l.length, 0) / (lines.length || 1);
			resolvedMode = avgLen < 60 ? 'single' : 'paragraph';
		}

		if (resolvedMode === 'single') {
			result = result.split('\n').filter(l => l.length > 0).join(' ');
			result = result.replace(/\s{2,}/g, ' ').trim();
		} else if (resolvedMode === 'paragraph') {
			result = result.replace(/\n{3,}/g, '\n\n');
			result = result.split('\n\n').map(para =>
				para.split('\n').filter(l => l.length > 0).join(' ').replace(/\s{2,}/g, ' ')
			).join('\n\n').trim();
		} else if (resolvedMode === 'compact') {
			result = result.split('\n').filter(l => l.length > 0).join('\n');
			result = result.replace(/\s{2,}/g, ' ').trim();
		}

		return result;
	}

	let output = $derived(prettify(input, mode, stripHtml));

	function copy() {
		navigator.clipboard.writeText(output);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

	function handlePaste(e: ClipboardEvent) {
		const text = e.clipboardData?.getData('text') ?? '';
		if (text) {
			e.preventDefault();
			input = text;
		}
	}
</script>

<div class="space-y-4">
	<div class="bg-slate-800 rounded-xl p-6 space-y-5">
		<div>
			<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{$t('textPrettier').mode}</h2>
			<div class="flex flex-wrap gap-2" role="group" aria-label={$t('textPrettier').modeGroupLabel}>
				{#each (['auto', 'single', 'paragraph', 'compact'] as Mode[]) as m}
					<button
						onclick={() => mode = m}
						aria-pressed={mode === m}
						class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {mode === m ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}"
					>{$t('textPrettier')[m]}</button>
				{/each}
			</div>
			<p class="mt-2 text-xs text-slate-600">{$t('textPrettier')[`${mode}Hint` as keyof ReturnType<typeof $t>['textPrettier']]}</p>
		</div>

		<div>
			<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{$t('textPrettier').options}</h2>
			<div class="flex flex-wrap gap-2" role="group" aria-label={$t('textPrettier').optionsGroupLabel}>
				<button
					onclick={() => stripHtml = !stripHtml}
					aria-pressed={stripHtml}
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {stripHtml ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}"
				>{$t('textPrettier').stripHtml}</button>
			</div>
			{#if stripHtml}
				<p class="mt-2 text-xs text-slate-600">{$t('textPrettier').stripHtmlHint}</p>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div class="bg-slate-800 rounded-xl p-6">
			<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{$t('textPrettier').input}</h2>
			<label for="tp-input" class="sr-only">{$t('textPrettier').inputLabel}</label>
			<textarea
				id="tp-input"
				bind:value={input}
				onpaste={handlePaste}
				placeholder={$t('textPrettier').placeholder}
				rows="14"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-700 focus:outline-none focus:border-violet-500 text-sm resize-y"
			></textarea>
			{#if input}
				<button onclick={() => input = ''} class="mt-2 text-xs text-slate-600 hover:text-slate-400 transition-colors">{$t('textPrettier').clear}</button>
			{/if}
		</div>

		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">{$t('textPrettier').output}</h2>
				{#if output}
					<button onclick={copy} class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-400 hover:text-violet-400 transition-colors">
						{copied ? $t('textPrettier').copied : $t('textPrettier').copy}
					</button>
				{/if}
			</div>
			{#if output}
				<div class="bg-slate-900 rounded-lg px-4 py-3 text-slate-300 text-sm whitespace-pre-wrap min-h-32 max-h-96 overflow-y-auto leading-relaxed">{output}</div>
				<p class="mt-2 text-xs text-slate-600">{output.length} {$t('textPrettier').chars}</p>
			{:else}
				<div class="bg-slate-900 rounded-lg px-4 py-3 min-h-32 flex items-center justify-center">
					<p class="text-slate-700 text-sm">{$t('textPrettier').empty}</p>
				</div>
			{/if}
		</div>
	</div>
</div>
