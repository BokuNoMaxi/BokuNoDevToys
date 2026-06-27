<script lang="ts">
	import { t } from '$lib/i18n';

	let textInput = $state('');
	let textMode = $state<'encode' | 'decode'>('encode');

	let imageSrc = $state('');
	let imageDataUri = $state('');
	let imageType = $state('');
	let imageCopied = $state(false);
	let textCopied = $state(false);

	function setMode(mode: 'encode' | 'decode') {
		if (textMode === mode) return;
		textMode = mode;
		textInput = '';
	}

	let computed = $derived.by(() => {
		if (!textInput.trim()) return { output: '', error: '' };
		try {
			if (textMode === 'encode') return { output: btoa(unescape(encodeURIComponent(textInput))), error: '' };
			return { output: decodeURIComponent(escape(atob(textInput))), error: '' };
		} catch {
			return { output: '', error: textMode === 'decode' ? 'Invalid Base64 string' : 'Encoding failed' };
		}
	});

	let textOutput = $derived(computed.output);
	let textError = $derived(computed.error);

	function copyText() {
		navigator.clipboard.writeText(textOutput);
		textCopied = true;
		setTimeout(() => { textCopied = false; }, 2000);
	}

	function handleImageUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		imageType = file.type;
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			imageSrc = result;
			imageDataUri = result;
		};
		reader.readAsDataURL(file);
	}

	function copyImage(what: 'datauri' | 'base64only') {
		const text = what === 'datauri' ? imageDataUri : imageDataUri.split(',')[1];
		navigator.clipboard.writeText(text);
		imageCopied = true;
		setTimeout(() => { imageCopied = false; }, 2000);
	}

	let base64Only = $derived(imageDataUri ? imageDataUri.split(',')[1] : '');
	let imgAttribute = $derived(imageDataUri ? `src="${imageDataUri}"` : '');
</script>

<div class="space-y-6">
	<!-- Text -->
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5">{$t('base64').textTab}</h2>

		<div>
			<label class="block text-xs text-slate-300 mb-1.5" for="b64-text-input">{$t('base64').input}</label>
			<textarea
				id="b64-text-input"
				bind:value={textInput}
				placeholder={$t('base64').textPlaceholder}
				rows="5"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 font-mono text-sm resize-y"
			></textarea>
		</div>

		<div class="flex gap-2 mt-3" role="group" aria-label="{$t('base64').encode} / {$t('base64').decode}">
			<button
				onclick={() => setMode('encode')}
				aria-pressed={textMode === 'encode'}
				class="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors {textMode === 'encode' ? 'bg-violet-700 text-white' : 'bg-slate-700 text-slate-200 hover:text-white hover:bg-slate-600'}"
			>{$t('base64').encode}</button>
			<button
				onclick={() => setMode('decode')}
				aria-pressed={textMode === 'decode'}
				class="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors {textMode === 'decode' ? 'bg-violet-700 text-white' : 'bg-slate-700 text-slate-200 hover:text-white hover:bg-slate-600'}"
			>{$t('base64').decode}</button>
		</div>

		{#if textError}
			<p class="mt-3 text-red-300 text-sm" role="alert">{textError}</p>
		{/if}

		<div class="mt-4">
			<div class="flex items-center justify-between mb-1.5">
				<label class="text-xs text-slate-300" for="b64-text-output">{$t('base64').output}</label>
				<button onclick={copyText} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">
					{textCopied ? $t('base64').copied : $t('base64').copy}
				</button>
			</div>
			<textarea
				id="b64-text-output"
				readonly
				value={textOutput}
				placeholder={$t('base64').resultPlaceholder}
				rows="5"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-emerald-400 placeholder-slate-400 font-mono text-sm resize-y"
			></textarea>
		</div>
	</div>

	<!-- Image -->
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5">{$t('base64').imageTab} → Base64</h2>

		<label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-violet-500 transition-colors bg-slate-900">
			<span class="text-slate-300 text-sm">{$t('base64').dropImage}</span>
			<span class="text-slate-300 text-xs mt-1">PNG, JPG, GIF, SVG, WebP</span>
			<input type="file" accept="image/*" onchange={handleImageUpload} class="hidden" />
		</label>

		{#if imageSrc}
			<div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="bg-slate-900 rounded-lg p-3 flex items-center justify-center min-h-32">
					<img src={imageSrc} alt="Uploaded" class="max-h-48 max-w-full object-contain rounded" />
				</div>
				<div class="space-y-3">
					<div>
						<span class="text-xs text-slate-300">MIME type: </span>
						<code class="text-sm text-sky-300 font-mono">{imageType}</code>
					</div>
					<div>
						<span class="text-xs text-slate-300">Base64 size: {Math.round(base64Only.length / 1024)} KB</span>
					</div>
					<div class="space-y-2">
						<button onclick={() => copyImage('datauri')} class="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors">
							{imageCopied ? $t('base64').copied : 'Copy Data URI (src="…")'}
						</button>
						<button onclick={() => copyImage('base64only')} class="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors">
							Copy Base64 only
						</button>
					</div>
				</div>
			</div>

			<div class="mt-4">
				<div class="text-xs text-slate-300 mb-1.5">HTML usage</div>
				<code class="block bg-slate-900 rounded-lg px-4 py-3 text-xs font-mono text-violet-300 break-all">
					&lt;img {imgAttribute.slice(0, 80)}{imgAttribute.length > 80 ? '…"' : ''} /&gt;
				</code>
			</div>
		{/if}
	</div>
</div>
