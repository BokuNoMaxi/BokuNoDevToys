<script lang="ts">
	import { t } from '$lib/i18n';
	import { computeHash, type HashAlgorithm } from '$lib/core/hash';

	type Algorithm = HashAlgorithm;
	let input = $state('');
	let algorithm = $state<Algorithm>('SHA-256');
	let hash = $state('');
	let computing = $state(false);
	let copied = $state(false);

	$effect(() => {
		if (!input) { hash = ''; return; }
		computing = true;
		computeHash(input, algorithm).then(h => { hash = h; computing = false; });
	});

	function copy() {
		navigator.clipboard.writeText(hash);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

	const algos: Algorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'];
</script>

<div class="space-y-4">
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<div>
			<label for="hash-input" class="block text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('hashGen').input}</label>
			<textarea
				id="hash-input"
				bind:value={input}
				placeholder={$t('hashGen').placeholder}
				rows="6"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono resize-y"
			></textarea>
		</div>
		<div>
			<span class="block text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('hashGen').algorithm}</span>
			<div class="flex flex-wrap gap-2" role="group" aria-label="Hash algorithm">
				{#each algos as algo}
					<button
						onclick={() => algorithm = algo}
						aria-pressed={algorithm === algo}
						class="px-4 py-2 rounded-lg text-sm font-medium font-mono transition-colors {algorithm === algo ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}"
					>{algo}</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="bg-slate-800 rounded-xl p-6">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('hashGen').result}</h2>
			{#if hash}
				<button onclick={copy} class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-300 hover:text-violet-300 transition-colors">
					{copied ? $t('hashGen').copied : $t('hashGen').copy}
				</button>
			{/if}
		</div>
		{#if computing}
			<p class="text-slate-400 text-sm">{$t('hashGen').computing}</p>
		{:else if hash}
			<p class="font-mono text-emerald-400 break-all text-sm bg-slate-900 rounded-lg px-4 py-3">{hash}</p>
		{:else}
			<p class="text-slate-400 text-sm">{$t('hashGen').empty}</p>
		{/if}
	</div>
</div>
