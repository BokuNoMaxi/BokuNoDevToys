<script lang="ts">
	import { t } from '$lib/i18n';

	let linked = $state(true);
	let unit = $state<'px' | '%' | 'rem'>('px');
	let tl = $state(12);
	let tr = $state(12);
	let br = $state(12);
	let bl = $state(12);
	let copied = $state(false);

	const presets = [
		{ label: 'None',     v: [0, 0, 0, 0] },
		{ label: 'Rounded',  v: [8, 8, 8, 8] },
		{ label: 'Pill',     v: [999, 999, 999, 999] },
		{ label: 'Squircle', v: [30, 30, 30, 30] },
		{ label: 'Blob',     v: [60, 40, 50, 70] },
		{ label: 'Card',     v: [16, 16, 0, 0] },
	];

	function setAll(v: number) {
		tl = tr = br = bl = v;
	}

	function applyPreset(v: number[]) {
		[tl, tr, br, bl] = v;
	}

	function handleChange(corner: 'tl' | 'tr' | 'br' | 'bl', val: number) {
		if (linked) { setAll(val); }
		else {
			if (corner === 'tl') tl = val;
			if (corner === 'tr') tr = val;
			if (corner === 'br') br = val;
			if (corner === 'bl') bl = val;
		}
	}

	let maxVal = $derived(unit === '%' ? 50 : unit === 'rem' ? 10 : 100);

	let cssValue = $derived.by(() => {
		const u = unit;
		const vals = [tl, tr, br, bl].map(v => `${v}${u}`);
		if (new Set(vals).size === 1) return `border-radius: ${vals[0]};`;
		return `border-radius: ${vals[0]} ${vals[1]} ${vals[2]} ${vals[3]};`;
	});

	let previewStyle = $derived(`border-radius: ${tl}${unit} ${tr}${unit} ${br}${unit} ${bl}${unit};`);

	function copy() {
		navigator.clipboard.writeText(cssValue);
		copied = true;
		setTimeout(() => { copied = false; }, 1500);
	}

	const corners = [
		{ key: 'tl' as const, label: () => $t('borderRadius').topLeft,     get: () => tl },
		{ key: 'tr' as const, label: () => $t('borderRadius').topRight,    get: () => tr },
		{ key: 'br' as const, label: () => $t('borderRadius').bottomRight, get: () => br },
		{ key: 'bl' as const, label: () => $t('borderRadius').bottomLeft,  get: () => bl },
	];
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<!-- Controls -->
		<div class="bg-slate-800 rounded-xl p-6 space-y-5">
			<!-- Unit + link -->
			<div class="flex items-center justify-between">
				<div class="flex gap-1">
					{#each ['px', '%', 'rem'] as u}
						<button onclick={() => unit = u as 'px' | '%' | 'rem'} class="px-3 py-1.5 rounded-lg text-xs font-mono transition-colors {unit === u ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{u}</button>
					{/each}
				</div>
				<button onclick={() => linked = !linked} class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors {linked ? 'bg-violet-700/20 text-violet-300' : 'bg-slate-900 text-slate-300'}">
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
					{$t('borderRadius').link}
				</button>
			</div>

			<!-- Sliders -->
			<div class="grid grid-cols-2 gap-4">
				{#each corners as c}
					<div>
						<label class="block text-xs text-slate-400 mb-1.5">{c.label()} <span class="text-violet-300 font-mono">{c.get()}{unit}</span></label>
						<input
							type="range" min="0" max={maxVal} value={c.get()}
							oninput={(e) => handleChange(c.key, Number((e.target as HTMLInputElement).value))}
							class="w-full accent-violet-500"
						/>
					</div>
				{/each}
			</div>

			<!-- Presets -->
			<div>
				<span class="block text-xs text-slate-400 mb-2">{$t('borderRadius').presets}</span>
				<div class="flex flex-wrap gap-2">
					{#each presets as p}
						<button onclick={() => applyPreset(p.v)} class="px-3 py-1.5 text-xs rounded-lg bg-slate-900 text-slate-300 hover:text-slate-100 transition-colors">{p.label}</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Preview -->
		<div class="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('aspectRatio').preview}</h2>
			<div class="flex-1 flex items-center justify-center">
				<div
					class="w-48 h-32 bg-gradient-to-br from-violet-600 to-sky-500"
					style={previewStyle}
				></div>
			</div>

			<div>
				<div class="flex items-center justify-between mb-2">
					<span class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('borderRadius').output}</span>
					<button onclick={copy} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{copied ? $t('borderRadius').copied : $t('borderRadius').copy}</button>
				</div>
				<div class="bg-slate-900 rounded-lg px-4 py-3 font-mono text-emerald-400 text-sm">{cssValue}</div>
			</div>
		</div>
	</div>
</div>
