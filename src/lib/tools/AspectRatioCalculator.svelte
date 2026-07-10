<script lang="ts">
	import { t } from '$lib/i18n';

	let width = $state(1920);
	let height = $state(1080);
	let ratioW = $state(16);
	let ratioH = $state(9);
	let calcWidth = $state('');
	let calcHeight = $state('');

	const presets = [
		{ label: '16:9',  w: 16, h: 9  },
		{ label: '4:3',   w: 4,  h: 3  },
		{ label: '1:1',   w: 1,  h: 1  },
		{ label: '3:2',   w: 3,  h: 2  },
		{ label: '21:9',  w: 21, h: 9  },
		{ label: '9:16',  w: 9,  h: 16 },
		{ label: '2:1',   w: 2,  h: 1  },
		{ label: '5:4',   w: 5,  h: 4  },
	];

	function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

	let ratio = $derived.by(() => {
		if (!width || !height) return null;
		const g = gcd(width, height);
		return { w: width / g, h: height / g };
	});

	let knownName = $derived.by(() => {
		if (!ratio) return null;
		const p = presets.find(p => p.w === ratio!.w && p.h === ratio!.h);
		return p?.label ?? null;
	});

	function applyPreset(p: { w: number; h: number }) {
		ratioW = p.w;
		ratioH = p.h;
		calcWidth = '';
		calcHeight = '';
	}

	function fromRatioWidth() {
		const w = parseFloat(calcWidth);
		if (!isNaN(w) && ratioH && ratioW) {
			calcHeight = ((w * ratioH) / ratioW).toFixed(0);
		}
	}

	function fromRatioHeight() {
		const h = parseFloat(calcHeight);
		if (!isNaN(h) && ratioH && ratioW) {
			calcWidth = ((h * ratioW) / ratioH).toFixed(0);
		}
	}

	// Preview box — max 280×180
	let preview = $derived.by(() => {
		if (!width || !height) return { w: 200, h: 112 };
		const maxW = 280, maxH = 180;
		const scale = Math.min(maxW / width, maxH / height);
		return { w: Math.round(width * scale), h: Math.round(height * scale) };
	});
</script>

<div class="space-y-4">
	<!-- From dimensions -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-5">
		<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('aspectRatio').from}</h2>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs text-slate-400 mb-1.5" for="ar-w">{$t('aspectRatio').width}</label>
				<input id="ar-w" type="number" bind:value={width} min="1" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500" />
			</div>
			<div>
				<label class="block text-xs text-slate-400 mb-1.5" for="ar-h">{$t('aspectRatio').height}</label>
				<input id="ar-h" type="number" bind:value={height} min="1" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500" />
			</div>
		</div>

		{#if ratio}
			<div class="flex items-center gap-4">
				<div class="bg-slate-900 rounded-lg px-4 py-3 flex items-center gap-3">
					<span class="text-slate-400 text-xs">{$t('aspectRatio').ratio}</span>
					<span class="font-mono text-lg text-violet-300 font-bold">{ratio.w}:{ratio.h}</span>
					{#if knownName}
						<span class="text-xs bg-violet-700/30 text-violet-300 px-2 py-0.5 rounded-full">{knownName}</span>
					{/if}
				</div>
				<!-- Preview -->
				<div
					class="bg-slate-700 rounded border-2 border-slate-600 flex items-center justify-center text-xs text-slate-400"
					style="width:{preview.w}px;height:{preview.h}px;min-width:40px;min-height:20px"
				>{width}×{height}</div>
			</div>
		{/if}
	</div>

	<!-- Presets -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-3">
		<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('aspectRatio').presets}</h2>
		<div class="flex flex-wrap gap-2">
			{#each presets as p}
				<button
					onclick={() => applyPreset(p)}
					class="px-3 py-1.5 rounded-lg text-sm font-mono transition-colors {ratioW === p.w && ratioH === p.h ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}"
				>{p.label}</button>
			{/each}
		</div>
	</div>

	<!-- Calculate from ratio -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('aspectRatio').knownRatio}: <span class="text-violet-300 font-mono">{ratioW}:{ratioH}</span></h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-xs text-slate-400 mb-1.5">{$t('aspectRatio').toWidth}</label>
				<div class="flex gap-2">
					<input type="number" bind:value={calcHeight} oninput={fromRatioHeight} placeholder={$t('aspectRatio').height} min="1" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500" />
					<span class="flex items-center text-slate-400 text-sm">→</span>
					<input type="text" value={calcWidth ? calcWidth + 'px' : ''} readonly placeholder={$t('aspectRatio').width} class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-emerald-400 font-mono text-sm focus:outline-none" />
				</div>
			</div>
			<div>
				<label class="block text-xs text-slate-400 mb-1.5">{$t('aspectRatio').toHeight}</label>
				<div class="flex gap-2">
					<input type="number" bind:value={calcWidth} oninput={fromRatioWidth} placeholder={$t('aspectRatio').width} min="1" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500" />
					<span class="flex items-center text-slate-400 text-sm">→</span>
					<input type="text" value={calcHeight ? calcHeight + 'px' : ''} readonly placeholder={$t('aspectRatio').height} class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-emerald-400 font-mono text-sm focus:outline-none" />
				</div>
			</div>
		</div>
	</div>
</div>
