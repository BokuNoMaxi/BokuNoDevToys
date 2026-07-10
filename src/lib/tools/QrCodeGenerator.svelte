<script lang="ts">
	import { t } from '$lib/i18n';
	import QRCode from 'qrcode';
	import { onMount } from 'svelte';

	type QrType = 'url' | 'text' | 'email' | 'wifi' | 'phone';
	let qrType = $state<QrType>('url');
	let urlVal = $state('https://');
	let textVal = $state('');
	let emailVal = $state('');
	let phoneVal = $state('');
	let wifiSsid = $state('');
	let wifiPass = $state('');
	let wifiEnc = $state<'WPA' | 'WEP' | 'nopass'>('WPA');
	let size = $state(256);
	let errorLevel = $state<'L' | 'M' | 'Q' | 'H'>('M');
	let fgColor = $state('#000000');
	let bgColor = $state('#ffffff');

	let canvasEl = $state<HTMLCanvasElement | undefined>();
	let generated = $state(false);

	function buildContent(): string {
		if (qrType === 'url')   return urlVal;
		if (qrType === 'text')  return textVal;
		if (qrType === 'email') return `mailto:${emailVal}`;
		if (qrType === 'phone') return `tel:${phoneVal}`;
		if (qrType === 'wifi')  return `WIFI:S:${wifiSsid};T:${wifiEnc};P:${wifiPass};;`;
		return '';
	}

	async function generate() {
		if (!canvasEl) return;
		const content = buildContent();
		if (!content) return;
		try {
			await QRCode.toCanvas(canvasEl, content, {
				width: size,
				errorCorrectionLevel: errorLevel,
				color: { dark: fgColor, light: bgColor },
			});
			generated = true;
		} catch { /* ignore */ }
	}

	function download() {
		if (!canvasEl) return;
		const a = document.createElement('a');
		a.download = 'qrcode.png';
		a.href = canvasEl.toDataURL('image/png');
		a.click();
	}

	const types: [QrType, string][] = [
		['url', 'URL'], ['text', 'Text'], ['email', 'E-Mail'], ['wifi', 'WiFi'], ['phone', 'Phone']
	];
	const errorLevels: ('L' | 'M' | 'Q' | 'H')[] = ['L', 'M', 'Q', 'H'];
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<!-- Settings -->
		<div class="bg-slate-800 rounded-xl p-6 space-y-4">
			<!-- Type -->
			<div>
				<span class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('qrCode').type}</span>
				<div class="flex flex-wrap gap-2">
					{#each types as [k, label]}
						<button onclick={() => { qrType = k; generated = false; }} class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors {qrType === k ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{label}</button>
					{/each}
				</div>
			</div>

			<!-- Content fields -->
			<div class="space-y-3">
				{#if qrType === 'url'}
					<div>
						<label class="block text-xs text-slate-400 mb-1.5">URL</label>
						<input type="url" bind:value={urlVal} placeholder={$t('qrCode').urlPlaceholder} class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-violet-500" />
					</div>
				{:else if qrType === 'text'}
					<div>
						<label class="block text-xs text-slate-400 mb-1.5">Text</label>
						<textarea bind:value={textVal} placeholder={$t('qrCode').textPlaceholder} rows="4" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-violet-500 resize-y"></textarea>
					</div>
				{:else if qrType === 'email'}
					<div>
						<label class="block text-xs text-slate-400 mb-1.5">E-Mail</label>
						<input type="email" bind:value={emailVal} placeholder={$t('qrCode').emailPlaceholder} class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-violet-500" />
					</div>
				{:else if qrType === 'phone'}
					<div>
						<label class="block text-xs text-slate-400 mb-1.5">{$t('qrCode').typePhone}</label>
						<input type="tel" bind:value={phoneVal} placeholder={$t('qrCode').phonePlaceholder} class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-violet-500" />
					</div>
				{:else if qrType === 'wifi'}
					<div class="space-y-2">
						<div>
							<label class="block text-xs text-slate-400 mb-1">{$t('qrCode').ssid}</label>
							<input type="text" bind:value={wifiSsid} placeholder="MyNetwork" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-violet-500" />
						</div>
						<div>
							<label class="block text-xs text-slate-400 mb-1">{$t('qrCode').password}</label>
							<input type="text" bind:value={wifiPass} placeholder="password" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-violet-500" />
						</div>
						<div>
							<span class="block text-xs text-slate-400 mb-1">{$t('qrCode').encryption}</span>
							<div class="flex gap-2">
								{#each ['WPA', 'WEP', 'nopass'] as enc}
									<button onclick={() => wifiEnc = enc as 'WPA' | 'WEP' | 'nopass'} class="px-3 py-1.5 rounded-lg text-xs font-mono transition-colors {wifiEnc === enc ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{enc}</button>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Options -->
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">{$t('qrCode').size}: <span class="text-violet-300 font-mono">{size}px</span></label>
					<input type="range" min="128" max="512" step="32" bind:value={size} class="w-full accent-violet-500" />
				</div>
				<div>
					<span class="block text-xs text-slate-400 mb-1.5">{$t('qrCode').errorLevel}</span>
					<div class="flex gap-1">
						{#each errorLevels as lvl}
							<button onclick={() => errorLevel = lvl} class="px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors {errorLevel === lvl ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{lvl}</button>
						{/each}
					</div>
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">{$t('qrCode').fgColor}</label>
					<div class="flex gap-2">
						<input type="color" bind:value={fgColor} class="h-9 w-10 rounded border border-slate-600 bg-slate-900 p-0.5 cursor-pointer" />
						<input type="text" bind:value={fgColor} class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-violet-500" />
					</div>
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">{$t('qrCode').bgColor}</label>
					<div class="flex gap-2">
						<input type="color" bind:value={bgColor} class="h-9 w-10 rounded border border-slate-600 bg-slate-900 p-0.5 cursor-pointer" />
						<input type="text" bind:value={bgColor} class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-violet-500" />
					</div>
				</div>
			</div>

			<button onclick={generate} class="w-full px-5 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-lg font-medium transition-colors">{$t('qrCode').generate}</button>
		</div>

		<!-- Preview -->
		<div class="bg-slate-800 rounded-xl p-6 flex flex-col gap-4 items-center justify-center">
			<canvas bind:this={canvasEl} class="rounded-lg {!generated ? 'hidden' : ''}"></canvas>
			{#if !generated}
				<div class="w-48 h-48 bg-slate-900 rounded-lg flex items-center justify-center">
					<p class="text-slate-400 text-sm text-center px-4">{$t('qrCode').generate}</p>
				</div>
			{/if}
			{#if generated}
				<button onclick={download} class="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors">{$t('qrCode').download}</button>
			{/if}
		</div>
	</div>
</div>
