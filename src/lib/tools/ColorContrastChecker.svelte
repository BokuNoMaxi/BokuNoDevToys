<script lang="ts">
	import { t } from '$lib/i18n';
	import { checkContrast } from '$lib/core/frontend';

	let fgInput = $state('#ffffff');
	let bgInput = $state('#1e293b');

	let result = $derived(checkContrast(fgInput, bgInput));

	function badge(pass: boolean) {
		return pass
			? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40'
			: 'bg-red-900/30 text-red-300 border border-red-700/30';
	}
</script>

<div class="space-y-4">
	<!-- Color inputs -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" for="cc-fg">{$t('colorContrast').fg}</label>
				<div class="flex gap-2">
					<input type="color" bind:value={fgInput} class="h-10 w-12 rounded-lg cursor-pointer border border-slate-600 bg-slate-900 p-0.5" />
					<input id="cc-fg" type="text" bind:value={fgInput} placeholder="#ffffff" class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500" />
				</div>
			</div>
			<div>
				<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" for="cc-bg">{$t('colorContrast').bg}</label>
				<div class="flex gap-2">
					<input type="color" bind:value={bgInput} class="h-10 w-12 rounded-lg cursor-pointer border border-slate-600 bg-slate-900 p-0.5" />
					<input id="cc-bg" type="text" bind:value={bgInput} placeholder="#1e293b" class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500" />
				</div>
			</div>
		</div>

		{#if !result}
			<p class="text-red-300 text-sm">{$t('colorContrast').invalidColor}</p>
		{/if}
	</div>

	{#if result}
		<!-- Ratio + WCAG checks -->
		<div class="bg-slate-800 rounded-xl p-6 space-y-4">
			<div class="flex items-center gap-4">
				<div class="bg-slate-900 rounded-xl px-6 py-4 text-center">
					<div class="text-3xl font-bold font-mono text-violet-300">{result.ratio.toFixed(2)}<span class="text-lg text-slate-400">:1</span></div>
					<div class="text-xs text-slate-400 mt-1">{$t('colorContrast').ratio}</div>
				</div>
				<!-- Preview -->
				<div class="flex-1 rounded-xl p-4" style="background:{bgInput}">
					<p class="text-lg font-bold mb-1" style="color:{fgInput}">{$t('colorContrast').previewText}</p>
					<p class="text-sm" style="color:{fgInput}">{$t('colorContrast').previewText}</p>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3">
				{#each [
					[$t('colorContrast').aa + ' ' + $t('colorContrast').normal,  result.aaNormal,  '4.5:1'],
					[$t('colorContrast').aa + ' ' + $t('colorContrast').large,   result.aaLarge,   '3:1'],
					[$t('colorContrast').aaa + ' ' + $t('colorContrast').normal, result.aaaNormal, '7:1'],
					[$t('colorContrast').aaa + ' ' + $t('colorContrast').large,  result.aaaLarge,  '4.5:1'],
				] as [label, pass, req]}
					<div class="rounded-lg px-4 py-3 {badge(pass as boolean)}">
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium">{label}</span>
							<span class="font-bold text-sm">{pass ? $t('colorContrast').pass : $t('colorContrast').fail}</span>
						</div>
						<div class="text-xs opacity-70 mt-0.5">min. {req}</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
