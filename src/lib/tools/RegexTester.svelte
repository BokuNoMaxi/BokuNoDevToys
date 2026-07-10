<script lang="ts">
	import { t } from '$lib/i18n';

	let pattern = $state('');
	let testStr = $state('');
	let flagG = $state(true);
	let flagI = $state(false);
	let flagM = $state(false);
	let flagS = $state(false);

	interface MatchGroup { index: number; value: string; groups: (string | undefined)[]; }

	let result = $derived.by((): { highlighted: string; matches: MatchGroup[]; error: string } => {
		if (!pattern) return { highlighted: testStr, matches: [], error: '' };
		try {
			const flags = (flagG ? 'g' : '') + (flagI ? 'i' : '') + (flagM ? 'm' : '') + (flagS ? 's' : '');
			const re = new RegExp(pattern, flags || 'g');
			const matches: MatchGroup[] = [];
			let m: RegExpExecArray | null;
			const localRe = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
			while ((m = localRe.exec(testStr)) !== null) {
				matches.push({ index: m.index, value: m[0], groups: m.slice(1) });
				if (m[0].length === 0) localRe.lastIndex++;
			}
			// Build highlighted HTML
			let highlighted = '';
			let pos = 0;
			for (const match of matches) {
				highlighted += escHtml(testStr.slice(pos, match.index));
				highlighted += `<mark class="bg-amber-400/25 text-amber-300 rounded px-0.5">${escHtml(match.value)}</mark>`;
				pos = match.index + match.value.length;
			}
			highlighted += escHtml(testStr.slice(pos));
			return { highlighted, matches, error: '' };
		} catch (e) {
			return { highlighted: escHtml(testStr), matches: [], error: (e as Error).message };
		}
	});

	function escHtml(s: string) {
		return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
	}

	function clear() { pattern = ''; testStr = ''; }
</script>

<div class="space-y-4">
	<!-- Pattern + Flags -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<div>
			<label for="rx-pattern" class="block text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('regexTester').pattern}</label>
			<div class="flex items-center gap-0">
				<span class="px-3 py-2.5 bg-slate-700 rounded-l-lg text-slate-400 text-sm font-mono border border-slate-600 border-r-0">/</span>
				<input
					id="rx-pattern"
					bind:value={pattern}
					placeholder={$t('regexTester').patternPlaceholder}
					class="flex-1 bg-slate-900 border border-slate-600 px-3 py-2.5 text-slate-300 focus:outline-none focus:border-violet-500 text-sm font-mono"
					spellcheck="false"
					autocomplete="off"
				/>
				<span class="px-3 py-2.5 bg-slate-700 rounded-r-lg text-slate-400 text-sm font-mono border border-slate-600 border-l-0">/{(flagG?'g':'')+(flagI?'i':'')+(flagM?'m':'')+(flagS?'s':'')}</span>
			</div>
			{#if result.error}
				<p role="alert" class="mt-2 text-xs text-red-300">{$t('regexTester').invalidRegex}: {result.error}</p>
			{/if}
		</div>
		<div>
			<span class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('regexTester').flags}</span>
			<div class="flex gap-2" role="group" aria-label="Regex flags">
				{#each [['g', flagG, () => flagG = !flagG], ['i', flagI, () => flagI = !flagI], ['m', flagM, () => flagM = !flagM], ['s', flagS, () => flagS = !flagS]] as [label, active, toggle]}
					<button
						onclick={toggle as () => void}
						aria-pressed={active as boolean}
						class="w-10 py-1.5 rounded-lg text-sm font-mono font-bold transition-colors {active ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}"
					>{label}</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Test string + highlighted result -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('regexTester').testString}</h2>
				{#if pattern || testStr}
					<button onclick={clear} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('regexTester').clear}</button>
				{/if}
			</div>
			<textarea
				bind:value={testStr}
				placeholder={$t('regexTester').testPlaceholder}
				rows="14"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono resize-y"
				spellcheck="false"
			></textarea>
		</div>

		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center gap-3 mb-3">
				<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('regexTester').matches}</h2>
				{#if result.matches.length > 0}
					<span class="text-xs bg-violet-700/40 text-violet-300 px-2 py-0.5 rounded-full">{result.matches.length}</span>
				{/if}
			</div>
			<!-- Highlighted text -->
			<div class="bg-slate-900 rounded-lg px-4 py-3 text-sm font-mono whitespace-pre-wrap break-all min-h-32 max-h-48 overflow-y-auto leading-relaxed text-slate-300 mb-4">
				{#if testStr}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html result.highlighted || ''}
				{:else}
					<span class="text-slate-500">{$t('regexTester').testPlaceholder}</span>
				{/if}
			</div>
			<!-- Match table -->
			{#if result.matches.length === 0 && testStr && pattern && !result.error}
				<p class="text-slate-400 text-sm">{$t('regexTester').noMatches}</p>
			{:else if result.matches.length > 0}
				<div class="overflow-x-auto max-h-48 overflow-y-auto">
					<table class="w-full text-xs">
						<thead class="text-slate-400 border-b border-slate-700 sticky top-0 bg-slate-800">
							<tr>
								<th class="text-left pb-2 pr-3">#</th>
								<th class="text-left pb-2 pr-3">{$t('regexTester').fullMatch}</th>
								{#if result.matches[0]?.groups.length > 0}
									{#each result.matches[0].groups as _, gi}
										<th class="text-left pb-2 pr-3">{$t('regexTester').group} {gi + 1}</th>
									{/each}
								{/if}
							</tr>
						</thead>
						<tbody>
							{#each result.matches as match, i}
								<tr class="border-b border-slate-800/50">
									<td class="py-1.5 pr-3 text-slate-400">{i + 1}</td>
									<td class="py-1.5 pr-3 font-mono text-amber-300 break-all">{match.value}</td>
									{#each match.groups as g}
										<td class="py-1.5 pr-3 font-mono text-sky-300 break-all">{g ?? '—'}</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>
