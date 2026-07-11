<script lang="ts">
	import { t } from '$lib/i18n';

	let blur = $state(12);
	let bgColor = $state('#ffffff');
	let bgOpacity = $state(15);
	let borderOpacity = $state(25);
	let borderWidth = $state(1);
	let borderRadius = $state(16);
	let shadowBlur = $state(32);
	let shadowOpacity = $state(30);
	let copied = $state(false);

	// Background scene color
	let bg1 = $state('#6d28d9');
	let bg2 = $state('#06b6d4');

	function hexToRgba(hex: string, opacity: number): string {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
	}

	let glassStyle = $derived(
		`backdrop-filter:blur(${blur}px);-webkit-backdrop-filter:blur(${blur}px);` +
		`background:${hexToRgba(bgColor, bgOpacity)};` +
		`border:${borderWidth}px solid ${hexToRgba('#ffffff', borderOpacity)};` +
		`border-radius:${borderRadius}px;` +
		`box-shadow:0 8px ${shadowBlur}px ${hexToRgba('#000000', shadowOpacity)};`
	);

	let css = $derived(
		`backdrop-filter: blur(${blur}px);\n` +
		`-webkit-backdrop-filter: blur(${blur}px);\n` +
		`background: ${hexToRgba(bgColor, bgOpacity)};\n` +
		`border: ${borderWidth}px solid ${hexToRgba('#ffffff', borderOpacity)};\n` +
		`border-radius: ${borderRadius}px;\n` +
		`box-shadow: 0 8px ${shadowBlur}px ${hexToRgba('#000000', shadowOpacity)};`
	);

	function copy() {
		navigator.clipboard.writeText(css);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<!-- Controls -->
		<div class="bg-slate-800 rounded-xl p-6 space-y-4">
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">Blur: <span class="text-violet-300 font-mono">{blur}px</span></label>
					<input type="range" min="0" max="40" bind:value={blur} class="w-full accent-violet-500" />
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">Hintergrund Opacity: <span class="text-violet-300 font-mono">{bgOpacity}%</span></label>
					<input type="range" min="0" max="100" bind:value={bgOpacity} class="w-full accent-violet-500" />
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">Border Opacity: <span class="text-violet-300 font-mono">{borderOpacity}%</span></label>
					<input type="range" min="0" max="100" bind:value={borderOpacity} class="w-full accent-violet-500" />
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">Border Breite: <span class="text-violet-300 font-mono">{borderWidth}px</span></label>
					<input type="range" min="0" max="4" bind:value={borderWidth} class="w-full accent-violet-500" />
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">Eckenradius: <span class="text-violet-300 font-mono">{borderRadius}px</span></label>
					<input type="range" min="0" max="48" bind:value={borderRadius} class="w-full accent-violet-500" />
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">Schatten Blur: <span class="text-violet-300 font-mono">{shadowBlur}px</span></label>
					<input type="range" min="0" max="80" bind:value={shadowBlur} class="w-full accent-violet-500" />
				</div>
			</div>

			<div class="grid grid-cols-3 gap-3 pt-2 border-t border-slate-700">
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">Glas Farbe</label>
					<input type="color" bind:value={bgColor} class="h-9 w-full rounded border border-slate-600 bg-slate-900 p-0.5 cursor-pointer" />
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">BG Farbe 1</label>
					<input type="color" bind:value={bg1} class="h-9 w-full rounded border border-slate-600 bg-slate-900 p-0.5 cursor-pointer" />
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">BG Farbe 2</label>
					<input type="color" bind:value={bg2} class="h-9 w-full rounded border border-slate-600 bg-slate-900 p-0.5 cursor-pointer" />
				</div>
			</div>
		</div>

		<!-- Preview -->
		<div class="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">Vorschau</h2>
			<div class="flex-1 rounded-lg flex items-center justify-center min-h-48 relative overflow-hidden"
				style="background:linear-gradient(135deg,{bg1},{bg2})">
				<!-- Decorative circles -->
				<div class="absolute w-32 h-32 rounded-full opacity-40 top-4 left-4" style="background:{bg2}"></div>
				<div class="absolute w-20 h-20 rounded-full opacity-30 bottom-8 right-8" style="background:{bg1}"></div>
				<!-- Glass card -->
				<div class="relative z-10 p-6 text-white text-center" style={glassStyle}>
					<p class="text-lg font-semibold">Glassmorphism</p>
					<p class="text-sm opacity-80 mt-1">CSS Effect</p>
				</div>
			</div>
		</div>
	</div>

	<div class="bg-slate-800 rounded-xl p-6">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">CSS</h2>
			<button onclick={copy} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{copied ? 'Kopiert!' : 'Kopieren'}</button>
		</div>
		<pre class="bg-slate-900 rounded-lg px-4 py-3 text-emerald-400 text-sm font-mono overflow-x-auto">{css}</pre>
	</div>
</div>
