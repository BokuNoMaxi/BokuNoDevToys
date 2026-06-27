<script lang="ts">
	import { t } from '$lib/i18n';

	let input = $state('');
	let copied = $state(false);

	type Mode = 'auto' | 'single' | 'paragraph' | 'compact' | 'stripHtml';
	let mode = $state<Mode>('auto');

	function prettify(text: string, m: Mode): string {
		if (!text.trim()) return '';

		if (m === 'stripHtml') {
			// Replace block-level tags with newlines before stripping
			let result = text
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
			// Clean up whitespace
			result = result.split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n');
			result = result.replace(/\n{3,}/g, '\n\n').trim();
			return result;
		}

		// Normalize line endings
		let result = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

		// Trim each line
		result = result.split('\n').map(l => l.trim()).join('\n');

		if (m === 'auto') {
			// Detect if it looks like a paragraph-heavy text (many short lines)
			const lines = result.split('\n').filter(l => l.length > 0);
			const avgLen = lines.reduce((s, l) => s + l.length, 0) / (lines.length || 1);
			m = avgLen < 60 ? 'single' : 'paragraph';
		}

		if (m === 'single') {
			// Join all non-empty lines into one continuous text, collapse whitespace
			result = result.split('\n').filter(l => l.length > 0).join(' ');
			result = result.replace(/\s{2,}/g, ' ').trim();
		} else if (m === 'paragraph') {
			// Collapse multiple blank lines into one, keep single blank lines as paragraph breaks
			result = result.replace(/\n{3,}/g, '\n\n');
			// Join lines within a paragraph (no blank line between them) into single lines
			result = result.split('\n\n').map(para =>
				para.split('\n').filter(l => l.length > 0).join(' ').replace(/\s{2,}/g, ' ')
			).join('\n\n').trim();
		} else if (m === 'compact') {
			// Remove ALL blank lines, keep single newlines
			result = result.split('\n').filter(l => l.length > 0).join('\n');
			result = result.replace(/\s{2,}/g, ' ').trim();
		}

		return result;
	}

	let output = $derived(prettify(input, mode));

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

<div class="space-y-6">
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">{$t('textPrettier').mode}</h2>
		<div class="flex flex-wrap gap-2">
			{#each (['auto', 'single', 'paragraph', 'compact', 'stripHtml'] as Mode[]) as m}
				<button
					onclick={() => mode = m}
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {mode === m ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}"
				>{$t('textPrettier')[m]}</button>
			{/each}
		</div>
		<p class="mt-3 text-xs text-slate-600">{$t('textPrettier')[`${mode}Hint` as keyof ReturnType<typeof $t>['textPrettier']]}</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div class="bg-slate-800 rounded-xl p-6">
			<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{$t('textPrettier').input}</h2>
			<textarea
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
