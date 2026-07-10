<script lang="ts">
	import { t } from '$lib/i18n';

	let length = $state(20);
	let useUpper = $state(true);
	let useLower = $state(true);
	let useNumbers = $state(true);
	let useSymbols = $state(false);
	let extraChars = $state('');
	let count = $state(1);
	let passwords = $state<string[]>([]);
	let copiedIndex = $state<number | null>(null);
	let copiedAll = $state(false);

	const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const LOWER = 'abcdefghijklmnopqrstuvwxyz';
	const NUMS  = '0123456789';
	const SYMS  = '!@#$%^&*()-_=+[]{}|;:,.<>?';

	function buildCharset(): string {
		let cs = '';
		if (useUpper)   cs += UPPER;
		if (useLower)   cs += LOWER;
		if (useNumbers) cs += NUMS;
		if (useSymbols) cs += SYMS;
		if (extraChars) cs += extraChars;
		return cs;
	}

	function calcEntropy(charset: number, len: number): number {
		return Math.round(len * Math.log2(charset));
	}

	function generateOne(charset: string, len: number): string {
		const arr = new Uint32Array(len);
		crypto.getRandomValues(arr);
		return Array.from(arr, v => charset[v % charset.length]).join('');
	}

	function generate() {
		const cs = buildCharset();
		if (!cs) return;
		passwords = Array.from({ length: count }, () => generateOne(cs, length));
	}

	function strengthLabel(bits: number): { label: string; color: string } {
		if (bits < 40) return { label: $t('passwordGen').weak,     color: 'text-red-300' };
		if (bits < 60) return { label: $t('passwordGen').fair,     color: 'text-amber-300' };
		if (bits < 80) return { label: $t('passwordGen').strong,   color: 'text-emerald-300' };
		return              { label: $t('passwordGen').veryStrong, color: 'text-sky-300' };
	}

	function copy(i: number) {
		navigator.clipboard.writeText(passwords[i]);
		copiedIndex = i;
		setTimeout(() => { copiedIndex = null; }, 1500);
	}

	function copyAll() {
		navigator.clipboard.writeText(passwords.join('\n'));
		copiedAll = true;
		setTimeout(() => { copiedAll = false; }, 1500);
	}

	let entropy = $derived(calcEntropy(buildCharset().length || 1, length));
	let strength = $derived(strengthLabel(entropy));
</script>

<div class="space-y-4">
	<div class="bg-slate-800 rounded-xl p-6 space-y-5">
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
			<!-- Length -->
			<div>
				<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
					{$t('passwordGen').length}: <span class="text-violet-300 font-mono">{length}</span>
				</label>
				<input type="range" min="4" max="128" bind:value={length} class="w-full accent-violet-500" />
				<div class="flex justify-between text-xs text-slate-400 mt-1"><span>4</span><span>128</span></div>
			</div>

			<!-- Count -->
			<div>
				<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
					{$t('passwordGen').count}: <span class="text-violet-300 font-mono">{count}</span>
				</label>
				<input type="range" min="1" max="20" bind:value={count} class="w-full accent-violet-500" />
				<div class="flex justify-between text-xs text-slate-400 mt-1"><span>1</span><span>20</span></div>
			</div>
		</div>

		<!-- Character sets -->
		<div>
			<span class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('passwordGen').strength}</span>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
				{#each [
					[$t('passwordGen').uppercase, useUpper, () => useUpper = !useUpper],
					[$t('passwordGen').lowercase, useLower, () => useLower = !useLower],
					[$t('passwordGen').numbers,   useNumbers, () => useNumbers = !useNumbers],
					[$t('passwordGen').symbols,   useSymbols, () => useSymbols = !useSymbols],
				] as [label, active, toggle]}
					<button
						onclick={toggle as () => void}
						aria-pressed={active as boolean}
						class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left {active ? 'bg-violet-700/20 text-violet-300 border border-violet-700/50' : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-500'}"
					>
						<span class="w-4 h-4 rounded border flex items-center justify-center shrink-0 {active ? 'bg-violet-600 border-violet-500' : 'border-slate-500'}">
							{#if active}<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>{/if}
						</span>
						{label}
					</button>
				{/each}
			</div>
			<div>
				<label class="block text-xs text-slate-400 mb-1">{$t('passwordGen').extra}</label>
				<input type="text" bind:value={extraChars} placeholder="e.g. @€£" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 font-mono text-sm focus:outline-none focus:border-violet-500" />
			</div>
		</div>

		<!-- Entropy display -->
		<div class="flex items-center gap-3 bg-slate-900 rounded-lg px-4 py-2.5">
			<span class="text-xs text-slate-400">{$t('passwordGen').entropy}:</span>
			<span class="font-mono text-sm {strength.color}">{entropy} {$t('passwordGen').bits}</span>
			<span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 {strength.color}">{strength.label}</span>
		</div>

		<button
			onclick={generate}
			disabled={!buildCharset()}
			class="w-full px-5 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-40 text-white rounded-lg font-medium transition-colors"
		>{$t('passwordGen').generate}</button>
	</div>

	{#if passwords.length > 0}
		<div class="bg-slate-800 rounded-xl p-6 space-y-3">
			<div class="flex items-center justify-between mb-1">
				<span class="text-xs font-semibold text-slate-300 uppercase tracking-wider">Passwörter</span>
				{#if passwords.length > 1}
					<button onclick={copyAll} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">
						{copiedAll ? $t('passwordGen').copied : $t('passwordGen').copyAll}
					</button>
				{/if}
			</div>
			{#each passwords as pw, i}
				<div class="flex items-center gap-3 bg-slate-900 rounded-lg px-4 py-2.5">
					<span class="flex-1 font-mono text-sm text-emerald-400 break-all">{pw}</span>
					<button onclick={() => copy(i)} class="text-xs text-slate-300 hover:text-slate-100 shrink-0 transition-colors">
						{copiedIndex === i ? $t('passwordGen').copied : $t('passwordGen').copy}
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
