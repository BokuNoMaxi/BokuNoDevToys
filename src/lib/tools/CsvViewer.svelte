<script lang="ts">
	import { t } from '$lib/i18n';

	let raw = $state('');
	let fileName = $state('');
	let dragging = $state(false);
	let parsed = $state(false);
	let sortCol = $state(-1);
	let sortAsc = $state(true);
	let detectedDelim = $state<',' | ';' | '\t'>(',');

	interface ParsedData { headers: string[]; rows: string[][]; delimiter: ',' | ';' | '\t'; }
	let data = $state<ParsedData | null>(null);

	function detectDelimiter(text: string): ',' | ';' | '\t' {
		const line = text.split('\n')[0] ?? '';
		const counts = { ',': (line.match(/,/g) ?? []).length, ';': (line.match(/;/g) ?? []).length, '\t': (line.match(/\t/g) ?? []).length };
		if (counts['\t'] > counts[','] && counts['\t'] > counts[';']) return '\t';
		if (counts[';'] > counts[',']) return ';';
		return ',';
	}

	function parseCsv(text: string, delim: string): string[][] {
		const rows: string[][] = [];
		for (const line of text.split('\n')) {
			if (!line.trim()) continue;
			const cells: string[] = [];
			let inQuote = false, cell = '';
			for (let i = 0; i < line.length; i++) {
				const ch = line[i];
				if (ch === '"') { inQuote = !inQuote; }
				else if (ch === delim && !inQuote) { cells.push(cell.trim()); cell = ''; }
				else { cell += ch; }
			}
			cells.push(cell.trim());
			rows.push(cells);
		}
		return rows;
	}

	function load() {
		if (!raw.trim()) return;
		const delim = detectDelimiter(raw);
		detectedDelim = delim;
		const rows = parseCsv(raw, delim);
		if (rows.length === 0) { data = null; return; }
		data = { headers: rows[0], rows: rows.slice(1), delimiter: delim };
		sortCol = -1;
		sortAsc = true;
		parsed = true;
	}

	function clear() { raw = ''; fileName = ''; data = null; parsed = false; sortCol = -1; }

	function loadFile(file: File) {
		fileName = file.name;
		const reader = new FileReader();
		reader.onload = (e) => { raw = e.target?.result as string ?? ''; load(); };
		reader.readAsText(file);
	}

	function handleFileInput(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) loadFile(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault(); dragging = false;
		const file = e.dataTransfer?.files[0];
		if (file) loadFile(file);
	}

	function toggleSort(col: number) {
		if (sortCol === col) sortAsc = !sortAsc;
		else { sortCol = col; sortAsc = true; }
	}

	let displayRows = $derived.by(() => {
		if (!data) return [];
		let rows = data.rows.slice(0, 500);
		if (sortCol >= 0) {
			rows = [...rows].sort((a, b) => {
				const av = a[sortCol] ?? '', bv = b[sortCol] ?? '';
				const an = parseFloat(av), bn = parseFloat(bv);
				const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : av.localeCompare(bv);
				return sortAsc ? cmp : -cmp;
			});
		}
		return rows;
	});

	const delimLabel = (d: string) => d === ',' ? $t('csvViewer').delimComma : d === ';' ? $t('csvViewer').delimSemi : $t('csvViewer').delimTab;
</script>

<div class="space-y-4">
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('csvViewer').input}</h2>
		<label
			class="flex flex-col items-center justify-center border-2 border-dashed rounded-lg px-4 py-6 cursor-pointer transition-colors
				{dragging ? 'border-violet-500 bg-violet-900/20' : 'border-slate-600 hover:border-slate-500'}"
			ondragover={(e) => { e.preventDefault(); dragging = true; }}
			ondragleave={() => dragging = false}
			ondrop={handleDrop}
		>
			<svg class="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
			</svg>
			<span class="text-sm text-slate-300">{$t('csvViewer').dropZone}</span>
			{#if fileName}<span class="mt-1 text-xs text-violet-300">{fileName}</span>{/if}
			<input type="file" accept=".csv,.tsv,.txt" onchange={handleFileInput} class="sr-only" />
		</label>

		<div class="flex items-center gap-3">
			<div class="flex-1 h-px bg-slate-700"></div>
			<span class="text-xs text-slate-400">{$t('csvViewer').orPaste}</span>
			<div class="flex-1 h-px bg-slate-700"></div>
		</div>

		<label for="csv-input" class="sr-only">{$t('csvViewer').pasteLabel}</label>
		<textarea
			id="csv-input"
			bind:value={raw}
			placeholder={$t('csvViewer').pastePlaceholder}
			rows="5"
			class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-xs font-mono resize-y"
		></textarea>

		<div class="flex gap-3">
			<button
				onclick={load}
				disabled={!raw.trim()}
				class="px-6 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
			>{$t('csvViewer').parse}</button>
			{#if raw || data}
				<button onclick={clear} class="px-4 py-2.5 text-slate-300 hover:text-slate-100 text-sm transition-colors">{$t('csvViewer').clear}</button>
			{/if}
		</div>
	</div>

	{#if data}
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center gap-4 mb-4 flex-wrap">
				<p class="text-sm text-slate-300">
					<span class="text-emerald-400 font-semibold">{data.rows.length}</span> {$t('csvViewer').rows}
					&nbsp;·&nbsp;
					<span class="text-sky-400 font-semibold">{data.headers.length}</span> {$t('csvViewer').columns}
					&nbsp;·&nbsp;
					<span class="text-slate-400">{$t('csvViewer').delimiter}: {delimLabel(data.delimiter)}</span>
				</p>
				{#if data.rows.length > 500}
					<span class="text-xs text-amber-400">{$t('csvViewer').truncated}</span>
				{/if}
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-xs border-collapse">
					<thead>
						<tr class="border-b border-slate-700">
							{#each data.headers as header, ci}
								<th class="text-left py-2 px-3 text-slate-400 font-semibold whitespace-nowrap">
									<button
										onclick={() => toggleSort(ci)}
										class="flex items-center gap-1 hover:text-slate-200 transition-colors"
										aria-label="{sortAsc ? $t('csvViewer').sortDesc : $t('csvViewer').sortAsc}"
									>
										{header}
										{#if sortCol === ci}
											<span class="text-violet-400">{sortAsc ? '↑' : '↓'}</span>
										{:else}
											<span class="text-slate-600 opacity-0 group-hover:opacity-100">↕</span>
										{/if}
									</button>
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each displayRows as row, ri}
							<tr class="border-b border-slate-800/50 {ri % 2 === 0 ? '' : 'bg-slate-900/20'} hover:bg-slate-700/20">
								{#each data.headers as _, ci}
									<td class="py-1.5 px-3 text-slate-300 font-mono max-w-xs truncate" title={row[ci] ?? ''}>{row[ci] ?? ''}</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else if parsed}
		<div class="bg-slate-800 rounded-xl p-6">
			<p class="text-slate-400 text-sm">{$t('csvViewer').empty}</p>
		</div>
	{/if}
</div>
