<script lang="ts">
	import { t } from '$lib/i18n';
	import { prettifyText, type PrettierMode, type UrlTransform, type CaseTransform } from '$lib/core/text';

	let input = $state('');
	let copied = $state(false);

	type Mode = PrettierMode;
	let mode = $state<Mode>('auto');
	let stripHtml = $state(false);
	let urlTransform = $state<UrlTransform>('none');
	let caseTransform = $state<CaseTransform>('none');

	let output = $derived(prettifyText(input, { mode, stripHtml, url: urlTransform, caseTransform }));

	function copy() {
		navigator.clipboard.writeText(output);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

	function handlePaste(e: ClipboardEvent) {
		const text = e.clipboardData?.getData('text') ?? '';
		if (text) {
			e.preventDefault();
			const ta = e.target as HTMLTextAreaElement;
			const start = ta.selectionStart ?? input.length;
			const end = ta.selectionEnd ?? input.length;
			input = input.slice(0, start) + text + input.slice(end);
		}
	}
</script>

<div class="space-y-4">
	<div class="bg-slate-800 rounded-xl p-6 space-y-5">
		<div>
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('textPrettier').mode}</h2>
			<div class="flex flex-wrap gap-2" role="group" aria-label={$t('textPrettier').modeGroupLabel}>
				{#each (['auto', 'single', 'paragraph', 'compact'] as Mode[]) as m}
					<button
						onclick={() => mode = m}
						aria-pressed={mode === m}
						class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {mode === m ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}"
					>{$t('textPrettier')[m]}</button>
				{/each}
			</div>
			<p class="mt-2 text-xs text-slate-300">{$t('textPrettier')[`${mode}Hint` as keyof ReturnType<typeof $t>['textPrettier']]}</p>
		</div>

		<div>
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('textPrettier').options}</h2>
			<div class="flex flex-wrap gap-2" role="group" aria-label={$t('textPrettier').optionsGroupLabel}>
				<button
					onclick={() => stripHtml = !stripHtml}
					aria-pressed={stripHtml}
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {stripHtml ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}"
				>{$t('textPrettier').stripHtml}</button>
			</div>
			{#if stripHtml}
				<p class="mt-2 text-xs text-slate-300">{$t('textPrettier').stripHtmlHint}</p>
			{/if}
		</div>

		<div>
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('textPrettier').urlTransform}</h2>
			<div class="flex flex-wrap gap-2" role="group" aria-label={$t('textPrettier').urlTransformGroupLabel}>
				{#each (['none', 'encode', 'decode'] as UrlTransform[]) as u}
					<button
						onclick={() => urlTransform = u}
						aria-pressed={urlTransform === u}
						class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {urlTransform === u ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}"
					>{$t('textPrettier')[`url${u.charAt(0).toUpperCase() + u.slice(1)}` as 'urlNone' | 'urlEncode' | 'urlDecode']}</button>
				{/each}
			</div>
			<p class="mt-2 text-xs text-slate-300">{$t('textPrettier')[`url${urlTransform.charAt(0).toUpperCase() + urlTransform.slice(1)}Hint` as 'urlNoneHint' | 'urlEncodeHint' | 'urlDecodeHint']}</p>
		</div>

		<div>
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('textPrettier').caseTransform}</h2>
			<div class="flex flex-wrap gap-2" role="group" aria-label={$t('textPrettier').caseTransformGroupLabel}>
				{#each (['none', 'camel', 'pascal', 'snake', 'kebab'] as CaseTransform[]) as c}
					<button
						onclick={() => caseTransform = c}
						aria-pressed={caseTransform === c}
						class="px-4 py-2 rounded-lg text-sm font-medium font-mono transition-colors {caseTransform === c ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}"
					>{$t('textPrettier')[`case${c.charAt(0).toUpperCase() + c.slice(1)}` as 'caseNone' | 'caseCamel' | 'casePascal' | 'caseSnake' | 'caseKebab']}</button>
				{/each}
			</div>
			<p class="mt-2 text-xs text-slate-300">{$t('textPrettier')[`case${caseTransform.charAt(0).toUpperCase() + caseTransform.slice(1)}Hint` as 'caseNoneHint' | 'caseCamelHint' | 'casePascalHint' | 'caseSnakeHint' | 'caseKebabHint']}</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div class="bg-slate-800 rounded-xl p-6">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('textPrettier').input}</h2>
			<label for="tp-input" class="sr-only">{$t('textPrettier').inputLabel}</label>
			<textarea
				id="tp-input"
				bind:value={input}
				onpaste={handlePaste}
				placeholder={$t('textPrettier').placeholder}
				rows="14"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm resize-y"
			></textarea>
			{#if input}
				<button onclick={() => input = ''} class="mt-2 text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('textPrettier').clear}</button>
			{/if}
		</div>

		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('textPrettier').output}</h2>
				{#if output}
					<button onclick={copy} class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-300 hover:text-violet-300 transition-colors">
						{copied ? $t('textPrettier').copied : $t('textPrettier').copy}
					</button>
				{/if}
			</div>
			{#if output}
				<div class="bg-slate-900 rounded-lg px-4 py-3 text-slate-300 text-sm whitespace-pre-wrap min-h-32 max-h-96 overflow-y-auto leading-relaxed">{output}</div>
				<p class="mt-2 text-xs text-slate-300">{output.length} {$t('textPrettier').chars}</p>
			{:else}
				<div class="bg-slate-900 rounded-lg px-4 py-3 min-h-32 flex items-center justify-center">
					<p class="text-slate-400 text-sm">{$t('textPrettier').empty}</p>
				</div>
			{/if}
		</div>
	</div>
</div>
