<script lang="ts">
	import { t } from '$lib/i18n';

	let original = $state('');
	let changed = $state('');
	let copied = $state(false);

	type DiffType = 'equal' | 'add' | 'remove';
	interface DiffLine { type: DiffType; text: string; origLine: number | null; newLine: number | null; }

	// Myers-LCS line diff
	function diff(a: string[], b: string[]): DiffLine[] {
		const m = a.length, n = b.length;
		const max = m + n;
		const v: number[] = new Array(2 * max + 1).fill(0);
		const trace: number[][] = [];

		for (let d = 0; d <= max; d++) {
			trace.push([...v]);
			for (let k = -d; k <= d; k += 2) {
				const ki = k + max;
				let x = (k === -d || (k !== d && v[ki - 1] < v[ki + 1])) ? v[ki + 1] : v[ki - 1] + 1;
				let y = x - k;
				while (x < m && y < n && a[x] === b[y]) { x++; y++; }
				v[ki] = x;
				if (x >= m && y >= n) {
					return backtrack(a, b, trace, max);
				}
			}
		}
		return backtrack(a, b, trace, max);
	}

	function backtrack(a: string[], b: string[], trace: number[][], max: number): DiffLine[] {
		const result: DiffLine[] = [];
		let x = a.length, y = b.length;
		let origLine = a.length, newLine = b.length;

		for (let d = trace.length - 1; d >= 0 && (x > 0 || y > 0); d--) {
			const v = trace[d];
			const k = x - y;
			const ki = k + max;
			const prevK = (k === -d || (k !== d && v[ki - 1] < v[ki + 1])) ? k + 1 : k - 1;
			const prevX = v[prevK + max];
			const prevY = prevX - prevK;

			while (x > prevX && y > prevY) { x--; y--; result.unshift({ type: 'equal', text: a[x], origLine: x + 1, newLine: y + 1 }); }
			if (d > 0) {
				if (x > prevX) { x--; result.unshift({ type: 'remove', text: a[x], origLine: x + 1, newLine: null }); }
				else if (y > prevY) { y--; result.unshift({ type: 'add', text: b[y], origLine: null, newLine: y + 1 }); }
			}
		}
		return result;
	}

	let lines = $derived.by(() => {
		if (!original && !changed) return [];
		return diff(original.split('\n'), changed.split('\n'));
	});

	let stats = $derived({
		added: lines.filter(l => l.type === 'add').length,
		removed: lines.filter(l => l.type === 'remove').length,
		unchanged: lines.filter(l => l.type === 'equal').length,
	});

	function copy() {
		const text = lines.map(l => {
			const pfx = l.type === 'add' ? '+' : l.type === 'remove' ? '-' : ' ';
			return `${pfx} ${l.text}`;
		}).join('\n');
		navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

	function clear() { original = ''; changed = ''; }
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div class="bg-slate-800 rounded-xl p-6">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('diffViewer').original}</h2>
			<textarea
				bind:value={original}
				placeholder={$t('diffViewer').originalPlaceholder}
				rows="14"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono resize-y"
			></textarea>
		</div>
		<div class="bg-slate-800 rounded-xl p-6">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('diffViewer').changed}</h2>
			<textarea
				bind:value={changed}
				placeholder={$t('diffViewer').changedPlaceholder}
				rows="14"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono resize-y"
			></textarea>
		</div>
	</div>

	{#if lines.length > 0}
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-3 flex-wrap gap-2">
				<div class="flex items-center gap-4">
					<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('diffViewer').result}</h2>
					<span class="text-xs text-emerald-400">+{stats.added} {$t('diffViewer').added}</span>
					<span class="text-xs text-red-300">−{stats.removed} {$t('diffViewer').removed}</span>
					<span class="text-xs text-slate-400">{stats.unchanged} {$t('diffViewer').unchanged}</span>
				</div>
				<div class="flex gap-2">
					<button onclick={copy} class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-300 hover:text-violet-300 transition-colors">
						{copied ? $t('diffViewer').copied : $t('diffViewer').copy}
					</button>
					<button onclick={clear} class="text-sm px-3 py-1 rounded-md text-slate-300 hover:text-slate-100 transition-colors">{$t('diffViewer').clear}</button>
				</div>
			</div>
			<div class="bg-slate-900 rounded-lg overflow-auto max-h-[600px]">
				<table class="w-full text-xs font-mono border-collapse">
					<tbody>
						{#each lines as line}
							{@const isAdd = line.type === 'add'}
							{@const isRem = line.type === 'remove'}
							<tr class="{isAdd ? 'bg-emerald-950/40' : isRem ? 'bg-red-950/40' : ''}">
								<td class="w-10 text-right px-2 py-0.5 select-none text-slate-500 border-r border-slate-800">{line.origLine ?? ''}</td>
								<td class="w-10 text-right px-2 py-0.5 select-none text-slate-500 border-r border-slate-800">{line.newLine ?? ''}</td>
								<td class="w-5 px-1 py-0.5 select-none text-center {isAdd ? 'text-emerald-400' : isRem ? 'text-red-300' : 'text-slate-600'}">{isAdd ? '+' : isRem ? '−' : ' '}</td>
								<td class="px-3 py-0.5 whitespace-pre {isAdd ? 'text-emerald-300' : isRem ? 'text-red-300' : 'text-slate-400'}">{line.text}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else if original || changed}
		<div class="bg-slate-800 rounded-xl p-6 flex items-center justify-center h-24">
			<p class="text-slate-400 text-sm">{$t('diffViewer').empty}</p>
		</div>
	{/if}
</div>
