<script lang="ts">
	import { t } from '$lib/i18n';

	type Shadow = { x: number; y: number; blur: number; spread: number; color: string; opacity: number; inset: boolean };

	let shadows = $state<Shadow[]>([
		{ x: 0, y: 4, blur: 24, spread: 0, color: '#000000', opacity: 25, inset: false },
	]);
	let activeIdx = $state(0);
	let bgColor = $state('#1e293b');
	let boxColor = $state('#334155');
	let copied = $state(false);

	function addShadow() {
		shadows = [...shadows, { x: 4, y: 4, blur: 16, spread: 0, color: '#000000', opacity: 30, inset: false }];
		activeIdx = shadows.length - 1;
	}

	function removeShadow(i: number) {
		if (shadows.length === 1) return;
		shadows = shadows.filter((_, idx) => idx !== i);
		activeIdx = Math.min(activeIdx, shadows.length - 1);
	}

	function hexToRgba(hex: string, opacity: number): string {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
	}

	function shadowStr(s: Shadow) {
		return `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${hexToRgba(s.color, s.opacity)}`;
	}

	let css = $derived('box-shadow: ' + shadows.map(shadowStr).join(',\n             ') + ';');
	let boxStyle = $derived(`box-shadow:${shadows.map(shadowStr).join(',')};background:${boxColor};`);

	function copy() {
		navigator.clipboard.writeText(css);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	let active = $derived(shadows[activeIdx]);
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<!-- Controls -->
		<div class="bg-slate-800 rounded-xl p-6 space-y-4">
			<!-- Layer tabs -->
			<div class="flex items-center gap-2 flex-wrap">
				{#each shadows as _, i}
					<button
						onclick={() => (activeIdx = i)}
						class="px-3 py-1 rounded-lg text-xs font-medium transition-colors {activeIdx === i ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}"
					>
						Layer {i + 1}
					</button>
				{/each}
				<button onclick={addShadow} class="px-3 py-1 rounded-lg text-xs bg-slate-900 text-slate-400 hover:text-slate-100 transition-colors">+ Layer</button>
				{#if shadows.length > 1}
					<button onclick={() => removeShadow(activeIdx)} class="px-3 py-1 rounded-lg text-xs bg-slate-900 text-red-400 hover:text-red-300 transition-colors">✕</button>
				{/if}
			</div>

			{#if active}
				<!-- Inset toggle -->
				<label class="flex items-center gap-2 cursor-pointer">
					<input type="checkbox" bind:checked={shadows[activeIdx].inset} class="accent-violet-500" />
					<span class="text-sm text-slate-300">Inset</span>
				</label>

				<div class="grid grid-cols-2 gap-3">
					{#each [['x', 'X Offset', -100, 100], ['y', 'Y Offset', -100, 100], ['blur', 'Blur', 0, 100], ['spread', 'Spread', -50, 50]] as [key, label, min, max]}
						<div>
							<label class="block text-xs text-slate-400 mb-1">{label}: <span class="text-violet-300 font-mono">{(shadows[activeIdx] as Record<string,number>)[key]}px</span></label>
							<input type="range" {min} {max} bind:value={(shadows[activeIdx] as Record<string,number>)[key]} class="w-full accent-violet-500" />
						</div>
					{/each}
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-xs text-slate-400 mb-1">Farbe</label>
						<input type="color" bind:value={shadows[activeIdx].color} class="h-10 w-full rounded border border-slate-600 bg-slate-900 p-0.5 cursor-pointer" />
					</div>
					<div>
						<label class="block text-xs text-slate-400 mb-1">Opacity: <span class="text-violet-300 font-mono">{shadows[activeIdx].opacity}%</span></label>
						<input type="range" min="0" max="100" bind:value={shadows[activeIdx].opacity} class="w-full accent-violet-500 mt-3" />
					</div>
				</div>
			{/if}

			<!-- Background colors -->
			<div class="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
				<div>
					<label class="block text-xs text-slate-400 mb-1">Vorschau Hintergrund</label>
					<input type="color" bind:value={bgColor} class="h-9 w-full rounded border border-slate-600 bg-slate-900 p-0.5 cursor-pointer" />
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1">Box Farbe</label>
					<input type="color" bind:value={boxColor} class="h-9 w-full rounded border border-slate-600 bg-slate-900 p-0.5 cursor-pointer" />
				</div>
			</div>
		</div>

		<!-- Preview -->
		<div class="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">Vorschau</h2>
			<div class="flex-1 rounded-lg flex items-center justify-center min-h-40" style="background:{bgColor}">
				<div class="w-32 h-32 rounded-xl transition-all" style={boxStyle}></div>
			</div>
		</div>
	</div>

	<!-- CSS Output -->
	<div class="bg-slate-800 rounded-xl p-6">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">CSS</h2>
			<button onclick={copy} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{copied ? 'Kopiert!' : 'Kopieren'}</button>
		</div>
		<pre class="bg-slate-900 rounded-lg px-4 py-3 text-emerald-400 text-sm font-mono overflow-x-auto">{css}</pre>
	</div>
</div>
