<script lang="ts">
	import { t } from '$lib/i18n';

	let baseHex = $state('#6d28d9');
	let copiedHex = $state<string | null>(null);

	function hexToHsl(hex: string): [number, number, number] {
		let r = parseInt(hex.slice(1, 3), 16) / 255;
		let g = parseInt(hex.slice(3, 5), 16) / 255;
		let b = parseInt(hex.slice(5, 7), 16) / 255;
		const max = Math.max(r, g, b), min = Math.min(r, g, b);
		let h = 0, s = 0;
		const l = (max + min) / 2;
		if (max !== min) {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
			else if (max === g) h = ((b - r) / d + 2) / 6;
			else h = ((r - g) / d + 4) / 6;
		}
		return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
	}

	function hslToHex(h: number, s: number, l: number): string {
		h = ((h % 360) + 360) % 360;
		s = Math.max(0, Math.min(100, s));
		l = Math.max(0, Math.min(100, l));
		const ss = s / 100, ll = l / 100;
		const a = ss * Math.min(ll, 1 - ll);
		const f = (n: number) => {
			const k = (n + h / 30) % 12;
			const c = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
			return Math.round(255 * c).toString(16).padStart(2, '0');
		};
		return '#' + f(0) + f(8) + f(4);
	}

	let palettes = $derived.by(() => {
		try {
			const [h, s, l] = hexToHsl(baseHex);
			return [
				{
					name: 'Komplementär',
					colors: [baseHex, hslToHex(h + 180, s, l)],
				},
				{
					name: 'Analog',
					colors: [hslToHex(h - 30, s, l), baseHex, hslToHex(h + 30, s, l)],
				},
				{
					name: 'Triadisch',
					colors: [baseHex, hslToHex(h + 120, s, l), hslToHex(h + 240, s, l)],
				},
				{
					name: 'Split-Komplementär',
					colors: [baseHex, hslToHex(h + 150, s, l), hslToHex(h + 210, s, l)],
				},
				{
					name: 'Tetradisch',
					colors: [baseHex, hslToHex(h + 90, s, l), hslToHex(h + 180, s, l), hslToHex(h + 270, s, l)],
				},
				{
					name: 'Monochrom',
					colors: [
						hslToHex(h, Math.max(0, s - 20), Math.min(90, l + 30)),
						hslToHex(h, Math.max(0, s - 10), Math.min(90, l + 15)),
						baseHex,
						hslToHex(h, Math.min(100, s + 10), Math.max(10, l - 15)),
						hslToHex(h, Math.min(100, s + 20), Math.max(10, l - 30)),
					],
				},
				{
					name: 'Shades',
					colors: [10, 20, 35, 50, 65, 80].map(ll => hslToHex(h, s, ll)),
				},
			];
		} catch {
			return [];
		}
	});

	function copy(hex: string) {
		navigator.clipboard.writeText(hex);
		copiedHex = hex;
		setTimeout(() => (copiedHex = null), 1500);
	}

	function copyAll(colors: string[]) {
		navigator.clipboard.writeText(colors.join(', '));
		copiedHex = colors.join('');
		setTimeout(() => (copiedHex = null), 1500);
	}
</script>

<div class="space-y-4">
	<!-- Input -->
	<div class="bg-slate-800 rounded-xl p-6">
		<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Basisfarbe</label>
		<div class="flex gap-3 items-center">
			<input type="color" bind:value={baseHex} class="h-12 w-16 rounded-lg border border-slate-600 bg-slate-900 p-0.5 cursor-pointer" />
			<input type="text" bind:value={baseHex} class="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500" />
			<div class="w-12 h-12 rounded-lg border border-slate-600 shrink-0" style="background:{baseHex}"></div>
		</div>
	</div>

	<!-- Palettes -->
	{#each palettes as palette}
		<div class="bg-slate-800 rounded-xl p-5">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{palette.name}</h2>
				<button onclick={() => copyAll(palette.colors)} class="text-xs text-slate-400 hover:text-slate-100 transition-colors">
					{copiedHex === palette.colors.join('') ? 'Kopiert!' : 'Alle kopieren'}
				</button>
			</div>
			<div class="flex gap-2 flex-wrap">
				{#each palette.colors as color}
					<button
						onclick={() => copy(color)}
						class="flex flex-col items-center gap-1.5 group"
						title={color}
					>
						<div class="w-14 h-14 rounded-lg border-2 border-transparent group-hover:border-white/30 transition-all" style="background:{color}"></div>
						<span class="text-xs font-mono text-slate-400 group-hover:text-slate-200 transition-colors">
							{copiedHex === color ? '✓' : color}
						</span>
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>
