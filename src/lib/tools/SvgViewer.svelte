<script lang="ts">
	import { t } from '$lib/i18n';
	import DOMPurify from 'dompurify';

	let svgCode = $state('');
	let bg = $state<'white' | 'gray' | 'black' | 'checker'>('checker');
	let pngSize = $state(512);
	let dropped = $state(false);
	let canvasRef = $state<HTMLCanvasElement | undefined>();

	function handleFile(file: File) {
		const reader = new FileReader();
		reader.onload = (e) => { svgCode = e.target?.result as string ?? ''; };
		reader.readAsText(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dropped = false;
		const file = e.dataTransfer?.files[0];
		if (file && file.type === 'image/svg+xml') handleFile(file);
	}

	function handleFileInput(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) handleFile(file);
	}

	interface SvgInfo { viewBox: string; width: string; height: string; elements: number; }

	let info = $derived.by((): SvgInfo | null => {
		if (!svgCode.trim()) return null;
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(svgCode, 'image/svg+xml');
			const svg = doc.querySelector('svg');
			if (!svg) return null;
			return {
				viewBox: svg.getAttribute('viewBox') ?? '—',
				width:   svg.getAttribute('width')   ?? '—',
				height:  svg.getAttribute('height')  ?? '—',
				elements: doc.querySelectorAll('*').length - 1,
			};
		} catch { return null; }
	});

	let safeHtml = $derived(svgCode
		? DOMPurify.sanitize(svgCode, { USE_PROFILES: { svg: true, svgFilters: true } })
		: '');

	const bgStyles: Record<string, string> = {
		white:   'background:#fff',
		gray:    'background:#808080',
		black:   'background:#000',
		checker: 'background-image:linear-gradient(45deg,#aaa 25%,transparent 25%),linear-gradient(-45deg,#aaa 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#aaa 75%),linear-gradient(-45deg,transparent 75%,#aaa 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0',
	};

	function downloadSvg() {
		const a = document.createElement('a');
		a.download = 'image.svg';
		a.href = URL.createObjectURL(new Blob([svgCode], { type: 'image/svg+xml' }));
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 1000);
	}

	async function downloadPng() {
		const img = new Image();
		const blob = new Blob([svgCode], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = pngSize;
			canvas.height = pngSize;
			const ctx = canvas.getContext('2d')!;
			ctx.drawImage(img, 0, 0, pngSize, pngSize);
			URL.revokeObjectURL(url);
			const a = document.createElement('a');
			a.download = 'image.png';
			a.href = canvas.toDataURL('image/png');
			a.click();
		};
		img.src = url;
	}
</script>

<div class="space-y-4">
	<!-- Input -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<div class="flex items-center gap-3 flex-wrap">
			<label
				class="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-lg cursor-pointer text-sm text-slate-300 hover:text-slate-100 transition-colors"
				ondragover={(e) => { e.preventDefault(); dropped = true; }}
				ondragleave={() => dropped = false}
				ondrop={handleDrop}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
				{$t('svgViewer').dropZone}
				<input type="file" accept=".svg,image/svg+xml" onchange={handleFileInput} class="hidden" />
			</label>
			<span class="text-slate-500 text-xs">{$t('svgViewer').orPaste}</span>
			{#if svgCode}
				<button onclick={() => svgCode = ''} class="text-xs text-slate-300 hover:text-slate-100 ml-auto transition-colors">{$t('svgViewer').clear}</button>
			{/if}
		</div>

		<div>
			<label class="block text-xs text-slate-400 mb-1.5" for="svg-paste">{$t('svgViewer').pasteLabel}</label>
			<textarea
				id="svg-paste"
				bind:value={svgCode}
				placeholder={$t('svgViewer').paste}
				rows="6"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-xs placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-y"
				spellcheck="false"
			></textarea>
		</div>
	</div>

	{#if safeHtml}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
			<!-- Preview -->
			<div class="lg:col-span-2 bg-slate-800 rounded-xl p-6 space-y-3">
				<div class="flex items-center justify-between flex-wrap gap-2">
					<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('aspectRatio').preview}</h2>
					<div class="flex gap-1.5">
						{#each ['white', 'gray', 'black', 'checker'] as bgKey}
							<button
								onclick={() => bg = bgKey as typeof bg}
								class="text-xs px-2.5 py-1 rounded transition-colors {bg === bgKey ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}"
							>
								{$t('svgViewer')[`bg${bgKey.charAt(0).toUpperCase() + bgKey.slice(1)}` as 'bgWhite' | 'bgGray' | 'bgBlack' | 'bgChecker']}
							</button>
						{/each}
					</div>
				</div>
				<div class="rounded-lg overflow-hidden flex items-center justify-center min-h-48" style={bgStyles[bg]}>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html safeHtml}
				</div>
			</div>

			<!-- Info + Download -->
			<div class="bg-slate-800 rounded-xl p-6 space-y-4">
				{#if info}
					<div>
						<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('svgViewer').info}</h2>
						<div class="space-y-2 text-xs">
							{#each [
								[$t('svgViewer').viewbox, info.viewBox],
								[$t('svgViewer').dimensions, `${info.width} × ${info.height}`],
								[$t('svgViewer').elements, String(info.elements)],
							] as [label, value]}
								<div class="flex justify-between gap-2">
									<span class="text-slate-400">{label}</span>
									<span class="font-mono text-slate-300 text-right">{value}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<div>
					<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Download</h2>
					<div class="space-y-2">
						<button onclick={downloadSvg} class="w-full px-4 py-2 bg-slate-900 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100 rounded-lg text-sm transition-colors">{$t('svgViewer').downloadSvg}</button>
						<div class="flex gap-2">
							<select bind:value={pngSize} class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-slate-200 text-xs focus:outline-none focus:border-violet-500">
								{#each [128, 256, 512, 1024] as s}<option value={s}>{s}px</option>{/each}
							</select>
							<button onclick={downloadPng} class="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100 rounded-lg text-sm transition-colors">{$t('svgViewer').downloadPng}</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
