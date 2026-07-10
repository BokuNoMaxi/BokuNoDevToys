<script lang="ts">
	import { t } from '$lib/i18n';

	let cols = $state(3);
	let rows = $state(3);
	let colGap = $state(16);
	let rowGap = $state(16);
	let colTemplate = $state<string[]>(['1fr', '1fr', '1fr']);
	let copied = $state(false);

	const colors = ['bg-violet-700/60','bg-sky-700/60','bg-emerald-700/60','bg-amber-700/60','bg-rose-700/60','bg-indigo-700/60'];

	function addCol() {
		colTemplate = [...colTemplate, '1fr'];
		cols = colTemplate.length;
	}
	function removeCol(i: number) {
		colTemplate = colTemplate.filter((_, idx) => idx !== i);
		cols = colTemplate.length;
	}
	function setTemplate(i: number, val: string) {
		colTemplate = colTemplate.map((v, idx) => idx === i ? val : v);
	}

	let css = $derived.by(() => {
		const tpl = colTemplate.join(' ');
		return `.container {\n  display: grid;\n  grid-template-columns: ${tpl};\n  grid-template-rows: repeat(${rows}, 1fr);\n  gap: ${rowGap}px ${colGap}px;\n}`;
	});

	let previewCells = $derived(cols * rows);
	let gridStyle = $derived(`display:grid;grid-template-columns:${colTemplate.join(' ')};grid-template-rows:repeat(${rows},minmax(40px,1fr));gap:${rowGap}px ${colGap}px;`);

	function copy() {
		navigator.clipboard.writeText(css);
		copied = true;
		setTimeout(() => { copied = false; }, 1500);
	}

	const templatePresets = ['1fr', 'auto', '200px', 'minmax(100px,1fr)', '2fr'];
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<!-- Settings -->
		<div class="bg-slate-800 rounded-xl p-6 space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">{$t('cssGrid').rows}: <span class="text-violet-300 font-mono">{rows}</span></label>
					<input type="range" min="1" max="8" bind:value={rows} class="w-full accent-violet-500" />
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">{$t('cssGrid').colGap}: <span class="text-violet-300 font-mono">{colGap}px</span></label>
					<input type="range" min="0" max="48" bind:value={colGap} class="w-full accent-violet-500" />
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">{$t('cssGrid').rowGap}: <span class="text-violet-300 font-mono">{rowGap}px</span></label>
					<input type="range" min="0" max="48" bind:value={rowGap} class="w-full accent-violet-500" />
				</div>
			</div>

			<!-- Column template -->
			<div>
				<div class="flex items-center justify-between mb-2">
					<span class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('cssGrid').template}</span>
					<button onclick={addCol} class="text-xs px-2.5 py-1 rounded-lg bg-violet-700 hover:bg-violet-800 text-white transition-colors">{$t('cssGrid').addCol}</button>
				</div>
				<div class="space-y-2">
					{#each colTemplate as tpl, i}
						<div class="flex items-center gap-2">
							<span class="text-xs text-slate-400 w-14">Col {i+1}</span>
							<select
								value={tpl}
								onchange={(e) => setTemplate(i, (e.target as HTMLSelectElement).value)}
								class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-violet-500"
							>
								{#each templatePresets as p}<option value={p}>{p}</option>{/each}
							</select>
							<input
								type="text"
								value={tpl}
								oninput={(e) => setTemplate(i, (e.target as HTMLInputElement).value)}
								class="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-violet-500"
							/>
							{#if colTemplate.length > 1}
								<button onclick={() => removeCol(i)} class="text-xs text-red-300 hover:text-red-200 transition-colors">{$t('cssGrid').removeCol}</button>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Preview -->
		<div class="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('cssGrid').preview}</h2>
			<div class="flex-1 overflow-auto">
				<div style={gridStyle}>
					{#each Array(previewCells) as _, i}
						<div class="rounded {colors[i % colors.length]} flex items-center justify-center text-xs text-white/60 min-h-10">{i+1}</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<div class="bg-slate-800 rounded-xl p-6">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('cssGrid').output}</h2>
			<button onclick={copy} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{copied ? $t('cssGrid').copied : $t('cssGrid').copy}</button>
		</div>
		<pre class="bg-slate-900 rounded-lg px-4 py-3 text-emerald-400 text-sm font-mono overflow-x-auto">{css}</pre>
	</div>
</div>
