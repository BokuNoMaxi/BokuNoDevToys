<script lang="ts">
	import { t } from '$lib/i18n';

	let textInput = $state('BN');
	let bgColor = $state('#6d28d9');
	let fgColor = $state('#ffffff');
	let radius = $state(20);
	let fontSize = $state(60);

	let previewCanvas = $state<HTMLCanvasElement | undefined>();
	let smallCanvases = $state<(HTMLCanvasElement | undefined)[]>([undefined, undefined, undefined]);

	const sizes = [16, 32, 64, 128];

	function drawFavicon(canvas: HTMLCanvasElement, size: number) {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		canvas.width = size;
		canvas.height = size;

		const r = Math.round((radius / 100) * (size / 2));
		ctx.clearRect(0, 0, size, size);

		ctx.beginPath();
		ctx.moveTo(r, 0);
		ctx.lineTo(size - r, 0);
		ctx.quadraticCurveTo(size, 0, size, r);
		ctx.lineTo(size, size - r);
		ctx.quadraticCurveTo(size, size, size - r, size);
		ctx.lineTo(r, size);
		ctx.quadraticCurveTo(0, size, 0, size - r);
		ctx.lineTo(0, r);
		ctx.quadraticCurveTo(0, 0, r, 0);
		ctx.closePath();
		ctx.fillStyle = bgColor;
		ctx.fill();

		const text = textInput.slice(0, 2);
		const fSize = Math.round((fontSize / 100) * size);
		ctx.font = `bold ${fSize}px sans-serif`;
		ctx.fillStyle = fgColor;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(text, size / 2, size / 2 + size * 0.03);
	}

	$effect(() => {
		if (previewCanvas) drawFavicon(previewCanvas, 128);
		smallCanvases.forEach((c, i) => { if (c) drawFavicon(c, sizes[i]); });
	});

	function download(size: number) {
		const canvas = document.createElement('canvas');
		drawFavicon(canvas, size);
		const a = document.createElement('a');
		a.download = `favicon-${size}x${size}.png`;
		a.href = canvas.toDataURL('image/png');
		a.click();
	}
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<!-- Settings -->
		<div class="bg-slate-800 rounded-xl p-6 space-y-5">
			<div>
				<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" for="fav-text">{$t('faviconGen').text}</label>
				<input
					id="fav-text"
					type="text"
					bind:value={textInput}
					placeholder={$t('faviconGen').textPlaceholder}
					maxlength="2"
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 font-mono text-2xl text-center focus:outline-none focus:border-violet-500 tracking-widest"
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">{$t('faviconGen').bgColor}</label>
					<div class="flex gap-2">
						<input type="color" bind:value={bgColor} class="h-10 w-12 rounded border border-slate-600 bg-slate-900 p-0.5 cursor-pointer" />
						<input type="text" bind:value={bgColor} class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-violet-500" />
					</div>
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">{$t('faviconGen').fgColor}</label>
					<div class="flex gap-2">
						<input type="color" bind:value={fgColor} class="h-10 w-12 rounded border border-slate-600 bg-slate-900 p-0.5 cursor-pointer" />
						<input type="text" bind:value={fgColor} class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-violet-500" />
					</div>
				</div>
			</div>

			<div>
				<label class="block text-xs text-slate-400 mb-1.5">{$t('faviconGen').radius}: <span class="text-violet-300 font-mono">{radius}%</span></label>
				<input type="range" min="0" max="50" bind:value={radius} class="w-full accent-violet-500" />
			</div>
			<div>
				<label class="block text-xs text-slate-400 mb-1.5">Font Size: <span class="text-violet-300 font-mono">{fontSize}%</span></label>
				<input type="range" min="20" max="90" bind:value={fontSize} class="w-full accent-violet-500" />
			</div>

			<div>
				<span class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('faviconGen').download}</span>
				<div class="flex gap-2 flex-wrap">
					{#each sizes as s}
						<button onclick={() => download(s)} class="px-4 py-2 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded-lg text-sm font-mono transition-colors border border-slate-700 hover:border-slate-500">
							{s}×{s}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Preview -->
		<div class="bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-6">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider self-start">{$t('faviconGen').preview}</h2>
			<canvas bind:this={previewCanvas} style="width:128px;height:128px;image-rendering:pixelated;" class="rounded-lg shadow-xl"></canvas>
			<div class="flex items-end gap-4">
				{#each [0, 1, 2] as idx}
					<div class="flex flex-col items-center gap-1">
						<canvas bind:this={smallCanvases[idx]} style="width:{sizes[idx]}px;height:{sizes[idx]}px;image-rendering:pixelated;" class="rounded"></canvas>
						<span class="text-xs text-slate-400">{sizes[idx]}px</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
