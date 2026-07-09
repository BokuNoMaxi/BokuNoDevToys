<script lang="ts">
	import { t } from '$lib/i18n';

	let valuesText = $state('');
	let result = $state('');
	let shuffleResult = $state<string[]>([]);
	let history = $state<string[]>([]);
	let copied = $state(false);
	let copiedShuffle = $state(false);

	function rows() {
		return valuesText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
	}

	function isMultiCol() {
		return rows().some(r => r.includes(':'));
	}

	function shuffle<T>(arr: T[]): T[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	function pick() {
		const list = rows();
		if (list.length === 0) return;
		const picked = list[Math.floor(Math.random() * list.length)];
		result = picked;
		shuffleResult = [];
		history = [picked, ...history].slice(0, 10);
		copied = false;
	}

	function doShuffle() {
		const list = rows();
		if (list.length === 0) return;

		if (isMultiCol()) {
			// Split each row into columns, shuffle each column independently
			const split = list.map(r => r.split(':').map(c => c.trim()));
			const colCount = Math.max(...split.map(r => r.length));
			const cols = Array.from({ length: colCount }, (_, ci) =>
				shuffle(split.map(r => r[ci] ?? ''))
			);
			shuffleResult = list.map((_, ri) => cols.map(col => col[ri]).join(' : '));
		} else {
			shuffleResult = shuffle(list);
		}

		result = '';
		copiedShuffle = false;
	}

	function copy() {
		navigator.clipboard.writeText(result);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

	function copyShuffle() {
		navigator.clipboard.writeText(shuffleResult.join('\n'));
		copiedShuffle = true;
		setTimeout(() => { copiedShuffle = false; }, 2000);
	}
</script>

<div class="space-y-4">
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('randomValue').values}</h2>
		<div>
			<label for="rv-input" class="sr-only">{$t('randomValue').valuesLabel}</label>
			<textarea
				id="rv-input"
				bind:value={valuesText}
				placeholder={$t('randomValue').placeholder}
				rows="8"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm resize-y font-mono"
			></textarea>
			<p class="mt-1.5 text-xs text-slate-300">{rows().length} {$t('randomValue').entries}</p>
		</div>
		<div class="flex flex-wrap gap-3">
			<button onclick={pick} disabled={rows().length === 0}
				class="px-6 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors">
				{$t('randomValue').pick}
			</button>
			<button onclick={doShuffle} disabled={rows().length === 0}
				class="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 hover:text-white rounded-lg font-medium transition-colors">
				{$t('randomValue').shuffleAll}
			</button>
		</div>
		{#if isMultiCol()}
			<p class="text-xs text-slate-300">{$t('randomValue').multiColHint}</p>
		{/if}
	</div>

	{#if result}
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('randomValue').result}</h2>
				<button onclick={copy}
					class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-300 hover:text-violet-300 transition-colors">
					{copied ? $t('randomValue').copied : $t('randomValue').copy}
				</button>
			</div>
			<p class="text-2xl font-semibold text-emerald-400 break-all">{result}</p>
		</div>
	{/if}

	{#if shuffleResult.length > 0}
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('randomValue').shuffleResult}</h2>
				<button onclick={copyShuffle}
					class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-300 hover:text-violet-300 transition-colors">
					{copiedShuffle ? $t('randomValue').copied : $t('randomValue').copy}
				</button>
			</div>
			<div class="space-y-1">
				{#each shuffleResult as row, i}
					<div class="flex items-center gap-3">
						<span class="text-xs text-slate-400 w-5 text-right shrink-0">{i + 1}.</span>
						<span class="text-sm font-mono text-emerald-400">{row}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if history.length > 1}
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('randomValue').history}</h2>
				<button onclick={() => history = result ? [result] : []} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('randomValue').clearHistory}</button>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each history.slice(1) as h}
					<span class="text-sm text-slate-400 bg-slate-900 rounded px-2 py-1">{h}</span>
				{/each}
			</div>
		</div>
	{/if}
</div>
