<script lang="ts">
	import { t } from '$lib/i18n';

	let min = $state(1);
	let max = $state(100);
	let count = $state(1);
	let result = $state<number[]>([]);
	let history = $state<number[]>([]);
	let copied = $state(false);

	function generate() {
		if (min > max) [min, max] = [max, min];
		const nums = Array.from({ length: count }, () =>
			Math.floor(Math.random() * (max - min + 1)) + min
		);
		result = nums;
		history = [...nums, ...history].slice(0, 20);
		copied = false;
	}

	function copy() {
		navigator.clipboard.writeText(result.join(', '));
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

	generate();
</script>

<div class="space-y-4">
	<div class="bg-slate-800 rounded-xl p-6 space-y-5">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('randomInt').settings}</h2>

		<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
			<div>
				<label for="ri-min" class="block text-xs text-slate-300 mb-1.5">{$t('randomInt').min}</label>
				<input id="ri-min" type="number" bind:value={min}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm" />
			</div>
			<div>
				<label for="ri-max" class="block text-xs text-slate-300 mb-1.5">{$t('randomInt').max}</label>
				<input id="ri-max" type="number" bind:value={max}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm" />
			</div>
			<div>
				<label for="ri-count" class="block text-xs text-slate-300 mb-1.5">{$t('randomInt').count}</label>
				<input id="ri-count" type="number" min="1" max="100" bind:value={count}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm" />
			</div>
		</div>

		<button onclick={generate}
			class="px-6 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-lg font-medium transition-colors">
			{$t('randomInt').generate}
		</button>
	</div>

	{#if result.length > 0}
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('randomInt').result}</h2>
				<button onclick={copy}
					class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-300 hover:text-violet-300 transition-colors">
					{copied ? $t('randomInt').copied : $t('randomInt').copy}
				</button>
			</div>
			<div class="flex flex-wrap gap-3">
				{#each result as n}
					<span class="text-3xl font-mono font-bold text-emerald-400">{n}</span>
				{/each}
			</div>
		</div>
	{/if}

	{#if history.length > result.length}
		<div class="bg-slate-800 rounded-xl p-6">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('randomInt').history}</h2>
			<div class="flex flex-wrap gap-2">
				{#each history.slice(result.length) as n}
					<span class="text-sm font-mono text-slate-400 bg-slate-900 rounded px-2 py-1">{n}</span>
				{/each}
			</div>
		</div>
	{/if}
</div>
