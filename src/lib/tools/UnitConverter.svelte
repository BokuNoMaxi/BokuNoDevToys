<script lang="ts">
	import { t } from '$lib/i18n';
	import { CSS_UNITS, convertCssUnit } from '$lib/core/frontend';

	let baseFontSize = $state(16);
	let viewportW = $state(1440);
	let viewportH = $state(900);
	let inputValue = $state('16');
	let inputUnit = $state('px');
	let copiedUnit = $state<string | null>(null);

	const units = CSS_UNITS as readonly string[];
	const ctx = $derived({ baseFontSize, viewportW, viewportH });

	let results = $derived(convertCssUnit(inputValue, inputUnit, ctx));

	function copy(unit: string, value: string) {
		navigator.clipboard.writeText(value + unit);
		copiedUnit = unit;
		setTimeout(() => (copiedUnit = null), 1500);
	}

	// Multiple row converter
	type Row = { value: string; unit: string };
	let rows = $state<Row[]>([{ value: '16', unit: 'px' }, { value: '1.5', unit: 'rem' }, { value: '24', unit: 'pt' }]);

	function addRow() { rows = [...rows, { value: '', unit: 'px' }]; }
	function removeRow(i: number) { rows = rows.filter((_, idx) => idx !== i); }
</script>

<div class="space-y-4">
	<!-- Settings -->
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Einstellungen</h2>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div>
				<label class="block text-xs text-slate-300 mb-1.5">Base Font Size</label>
				<div class="flex items-center gap-2">
					<input type="number" bind:value={baseFontSize} min="1" max="32" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500" />
					<span class="text-slate-300 text-sm">px</span>
				</div>
			</div>
			<div>
				<label class="block text-xs text-slate-300 mb-1.5">Viewport Breite</label>
				<div class="flex items-center gap-2">
					<input type="number" bind:value={viewportW} min="320" max="3840" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500" />
					<span class="text-slate-300 text-sm">px</span>
				</div>
			</div>
			<div>
				<label class="block text-xs text-slate-300 mb-1.5">Viewport Höhe</label>
				<div class="flex items-center gap-2">
					<input type="number" bind:value={viewportH} min="320" max="2160" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500" />
					<span class="text-slate-300 text-sm">px</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Single converter -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">Wert umrechnen</h2>
		<div class="flex gap-3">
			<input
				type="number"
				bind:value={inputValue}
				placeholder="16"
				class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500"
			/>
			<div class="flex gap-1.5 flex-wrap">
				{#each units as u}
					<button onclick={() => inputUnit = u} class="px-3 py-2 rounded-lg text-xs font-mono transition-colors {inputUnit === u ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{u}</button>
				{/each}
			</div>
		</div>

		{#if results.length > 0}
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
				{#each results as r}
					<button
						onclick={() => copy(r.unit, r.value)}
						class="flex flex-col gap-0.5 bg-slate-900 rounded-lg px-3 py-2.5 text-left hover:bg-slate-700 transition-colors group {r.unit === inputUnit ? 'ring-1 ring-violet-500/50' : ''}"
					>
						<span class="text-xs text-slate-300 group-hover:text-white transition-colors">{r.unit}</span>
						<span class="font-mono text-sm text-emerald-400 group-hover:text-emerald-300 transition-colors">{r.value}<span class="text-slate-300 group-hover:text-white">{r.unit}</span></span>
						<span class="text-xs text-slate-300 group-hover:text-white transition-colors">{copiedUnit === r.unit ? 'Kopiert!' : 'Klicken zum Kopieren'}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>
