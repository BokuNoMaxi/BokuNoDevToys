<script lang="ts">
	import { t } from '$lib/i18n';

	type Mode = 'text' | 'image';
	let mode = $state<Mode>('text');

	let textInput = $state('BN');
	let bgColor = $state('#6d28d9');
	let fgColor = $state('#ffffff');
	let radius = $state(20);
	let fontSize = $state(60);

	// Image mode
	let uploadedImage = $state<HTMLImageElement | null>(null);
	let uploadedName = $state('');
	let imageFit = $state<'contain' | 'cover'>('contain');

	let previewCanvas = $state<HTMLCanvasElement | undefined>();
	let smallCanvases = $state<(HTMLCanvasElement | undefined)[]>([undefined, undefined, undefined]);

	const sizes = [16, 32, 64, 128];

	function loadImageFile(file: File) {
		uploadedName = file.name;
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => { uploadedImage = img; mode = 'image'; };
			img.src = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	function handleFileInput(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) loadImageFile(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer?.files[0];
		if (file && (file.type.startsWith('image/'))) loadImageFile(file);
	}

	function drawFavicon(canvas: HTMLCanvasElement, size: number) {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		canvas.width = size;
		canvas.height = size;

		const r = Math.round((radius / 100) * (size / 2));
		ctx.clearRect(0, 0, size, size);

		// Clipping mask (rounded rect)
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

		if (mode === 'image' && uploadedImage) {
			// Fill bg first
			ctx.fillStyle = bgColor;
			ctx.fill();
			ctx.save();
			ctx.clip();
			// Draw image with fit mode
			if (imageFit === 'cover') {
				const scale = Math.max(size / uploadedImage.width, size / uploadedImage.height);
				const w = uploadedImage.width * scale;
				const h = uploadedImage.height * scale;
				ctx.drawImage(uploadedImage, (size - w) / 2, (size - h) / 2, w, h);
			} else {
				const scale = Math.min(size / uploadedImage.width, size / uploadedImage.height);
				const w = uploadedImage.width * scale;
				const h = uploadedImage.height * scale;
				ctx.drawImage(uploadedImage, (size - w) / 2, (size - h) / 2, w, h);
			}
			ctx.restore();
		} else {
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

			<!-- Mode toggle -->
			<div class="flex gap-2">
				<button onclick={() => mode = 'text'} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {mode === 'text' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">Text / Emoji</button>
				<button onclick={() => mode = 'image'} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {mode === 'image' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">Bild hochladen</button>
			</div>

			{#if mode === 'text'}
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

				<div>
					<label class="block text-xs text-slate-400 mb-1.5">Font Size: <span class="text-violet-300 font-mono">{fontSize}%</span></label>
					<input type="range" min="20" max="90" bind:value={fontSize} class="w-full accent-violet-500" />
				</div>

				<div>
					<label class="block text-xs text-slate-400 mb-1.5">{$t('faviconGen').fgColor}</label>
					<div class="flex gap-2">
						<input type="color" bind:value={fgColor} class="h-10 w-12 rounded border border-slate-600 bg-slate-900 p-0.5 cursor-pointer" />
						<input type="text" bind:value={fgColor} class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-violet-500" />
					</div>
				</div>

			{:else}
				<!-- Image upload -->
				<div>
					<label
						class="flex flex-col items-center justify-center gap-2 w-full h-24 bg-slate-900 border-2 border-dashed border-slate-600 hover:border-violet-500 rounded-lg cursor-pointer transition-colors"
						ondragover={(e) => e.preventDefault()}
						ondrop={handleDrop}
					>
						<svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
						<span class="text-xs text-slate-400">{uploadedName || 'JPG, PNG oder SVG hochladen'}</span>
						<input type="file" accept="image/jpeg,image/png,image/svg+xml" onchange={handleFileInput} class="hidden" />
					</label>
				</div>

				<div>
					<span class="block text-xs text-slate-400 mb-2">Skalierung</span>
					<div class="flex gap-2">
						{#each [['contain', 'Contain'], ['cover', 'Cover']] as [v, label]}
							<button onclick={() => imageFit = v as 'contain' | 'cover'} class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors {imageFit === v ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{label}</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Shared: bg color + corner radius -->
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">{$t('faviconGen').bgColor}</label>
					<div class="flex gap-2">
						<input type="color" bind:value={bgColor} class="h-10 w-12 rounded border border-slate-600 bg-slate-900 p-0.5 cursor-pointer" />
						<input type="text" bind:value={bgColor} class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-violet-500" />
					</div>
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">{$t('faviconGen').radius}: <span class="text-violet-300 font-mono">{radius}%</span></label>
					<input type="range" min="0" max="50" bind:value={radius} class="w-full accent-violet-500 mt-3" />
				</div>
			</div>

			<!-- Download -->
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
