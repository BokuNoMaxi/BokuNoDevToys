<script lang="ts">
	import { t } from '$lib/i18n';
	import { MODELS, generateText } from '$lib/core/textgen';

	let selectedModel = $state(MODELS[0]);
	let paragraphs = $state(3);
	let maxChars = $state(0);
	let result = $state('');
	let copied = $state(false);

	function generate() {
		result = generateText(selectedModel, paragraphs, maxChars);
		copied = false;
	}

	function copy() {
		navigator.clipboard.writeText(result);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

	generate();
</script>

<div class="space-y-6">
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5">{$t('textGen').settings}</h2>

		<div class="mb-5">
			<label for="model-select" class="block text-xs text-slate-300 mb-1.5">{$t('textGen').modelStyle}</label>
			<div class="flex items-center gap-3">
				<select id="model-select" bind:value={selectedModel}
					class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 appearance-none cursor-pointer">
					{#each MODELS as model}
						<option value={model}>{model.label} — {model.language}</option>
					{/each}
				</select>
				<span class="text-xs text-slate-300 shrink-0">{selectedModel.sentences.length} {$t('textGen').sentences}</span>
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
			<div>
				<label for="para-range" class="block text-sm text-slate-300 mb-2">
					{$t('textGen').paragraphs}: <span class="text-violet-300 font-semibold">{paragraphs}</span>
				</label>
				<input id="para-range" type="range" min="1" max="20" bind:value={paragraphs} class="w-full accent-violet-500" />
				<div class="flex justify-between text-xs text-slate-300 mt-1"><span>1</span><span>20</span></div>
			</div>
			<div>
				<label for="chars-range" class="block text-sm text-slate-300 mb-2">
					{$t('textGen').maxChars}: <span class="text-violet-300 font-semibold">{maxChars === 0 ? $t('textGen').unlimited : maxChars}</span>
				</label>
				<input id="chars-range" type="range" min="0" max="5000" step="50" bind:value={maxChars} class="w-full accent-violet-500" />
				<div class="flex justify-between text-xs text-slate-300 mt-1"><span>∞</span><span>5000</span></div>
			</div>
		</div>

		<button onclick={generate} class="mt-5 px-6 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-lg font-medium transition-colors">
			{$t('textGen').generate}
		</button>
	</div>

	{#if result}
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('textGen').result}</h2>
				<div class="flex items-center gap-3">
					<span class="text-xs text-slate-300">{result.length} {$t('textGen').chars}</span>
					<button onclick={copy} class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-300 hover:text-violet-300 transition-colors">
						{copied ? $t('textGen').copied : $t('textGen').copy}
					</button>
				</div>
			</div>
			<div class="bg-slate-900 rounded-lg p-4 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-serif max-h-[500px] overflow-y-auto">
				{result}
			</div>
		</div>
	{/if}
</div>
