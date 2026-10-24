<script lang="ts">
	import { t } from '$lib/i18n';
	import { convertColor, type ColorData as CoreColor } from '$lib/core/color';

	type ColorData = CoreColor & { preview: string };

	let input = $state('');
	let copiedKey = $state<string | null>(null);

	let result = $derived.by((): { data: ColorData; error: string } | null => {
		if (!input.trim()) return null;
		const data = convertColor(input);
		if (!data) return { data: null as unknown as ColorData, error: $t('colorConverter').invalid };
		return { data: { ...data, preview: data.hex }, error: '' };
	});

	let colorPickerEl = $state<HTMLInputElement | undefined>();

	function onPickerChange(e: Event) {
		input = (e.target as HTMLInputElement).value;
	}

	function copy(key: string, value: string) {
		navigator.clipboard.writeText(value);
		copiedKey = key;
		setTimeout(() => { copiedKey = null; }, 1500);
	}
</script>

<div class="space-y-4">
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<div>
			<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" for="cc-input">{$t('colorConverter').input}</label>
			<div class="flex gap-3">
				<!-- Color swatch — click opens native picker -->
				<div class="relative shrink-0">
					<div
						class="w-12 h-11 rounded-lg border-2 cursor-pointer transition-colors {result?.data ? 'border-slate-600 hover:border-violet-500' : 'border-slate-700 bg-slate-900'}"
						style={result?.data ? `background:${result.data.preview}` : ''}
						onclick={() => colorPickerEl?.click()}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && colorPickerEl?.click()}
						aria-label="Open color picker"
					></div>
					<input
						bind:this={colorPickerEl}
						type="color"
						value={result?.data?.hex ?? '#6d28d9'}
						onchange={onPickerChange}
						oninput={onPickerChange}
						class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
						tabindex="-1"
					/>
				</div>
				<input
					id="cc-input"
					type="text"
					bind:value={input}
					placeholder={$t('colorConverter').placeholder}
					class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500"
					spellcheck="false"
					autocomplete="off"
				/>
			</div>
			<p class="mt-1.5 text-xs text-slate-300">{$t('colorConverter').inputLabel}</p>
		</div>

		{#if result?.error}
			<p class="text-red-300 text-sm">{result.error}</p>
		{/if}
	</div>

	{#if result?.data}
		<div class="bg-slate-800 rounded-xl p-6 space-y-3">
			{#each [
				['hex',  $t('colorConverter').hex,  result.data.hex],
				['rgb',  $t('colorConverter').rgb,  result.data.rgb],
				['hsl',  $t('colorConverter').hsl,  result.data.hsl],
				['hsv',  $t('colorConverter').hsv,  result.data.hsv],
				['cmyk', $t('colorConverter').cmyk, result.data.cmyk],
			] as [key, label, value]}
				<div class="flex items-center gap-3 bg-slate-900 rounded-lg px-4 py-2.5">
					<span class="text-xs text-slate-300 w-14 shrink-0">{label}</span>
					<span class="flex-1 font-mono text-sm text-emerald-400">{value}</span>
					<button onclick={() => copy(key, value)} class="text-xs text-slate-300 hover:text-slate-100 transition-colors shrink-0">
						{copiedKey === key ? $t('colorConverter').copied : $t('colorConverter').copy}
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
