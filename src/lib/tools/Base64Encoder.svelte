<script lang="ts">
	let textInput = $state('');
	let textOutput = $state('');
	let textError = $state('');

	let imageSrc = $state('');
	let imageDataUri = $state('');
	let imageType = $state('');
	let imageCopied = $state(false);
	let textCopied = $state(false);

	function encode() {
		textError = '';
		if (!textInput.trim()) return;
		try {
			textOutput = btoa(unescape(encodeURIComponent(textInput)));
			textInput = '';
		} catch {
			textError = 'Encoding failed';
		}
	}

	function decode() {
		textError = '';
		if (!textInput.trim()) return;
		try {
			textOutput = decodeURIComponent(escape(atob(textInput)));
			textInput = '';
		} catch {
			textError = 'Invalid Base64 string';
		}
	}

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
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Text</h2>

		<div>
			<label class="block text-xs text-slate-500 mb-1.5">Input</label>
			<textarea
				bind:value={textInput}
				placeholder="Text hier eingeben…"
				rows="5"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-sm resize-y"
			></textarea>
		</div>

		<div class="flex gap-2 mt-3">
			<button
				onclick={encode}
				class="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
			>Encode →</button>
			<button
				onclick={decode}
				class="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
			>← Decode</button>
		</div>

		{#if textError}
			<p class="mt-3 text-red-400 text-sm">{textError}</p>
		{/if}

		<div class="mt-4">
			<div class="flex items-center justify-between mb-1.5">
				<label class="text-xs text-slate-500">Output</label>
				<button onclick={copyText} class="text-xs text-slate-500 hover:text-slate-300 transition-colors">
					{textCopied ? '✓ Copied' : 'Copy'}
				</button>
			</div>
			<textarea
				readonly
				value={textOutput}
				placeholder="Ergebnis erscheint hier…"
				rows="5"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-emerald-400 placeholder-slate-700 font-mono text-sm resize-y"
			></textarea>
		</div>
	</div>

	<!-- Image -->
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Image → Base64</h2>

		<label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-violet-500 transition-colors bg-slate-900">
			<span class="text-slate-500 text-sm">Bild auswählen</span>
			<span class="text-slate-600 text-xs mt-1">PNG, JPG, GIF, SVG, WebP</span>
			<input type="file" accept="image/*" onchange={handleImageUpload} class="hidden" />
		</label>

		{#if imageSrc}
			<div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="bg-slate-900 rounded-lg p-3 flex items-center justify-center min-h-32">
					<img src={imageSrc} alt="Uploaded" class="max-h-48 max-w-full object-contain rounded" />
				</div>
				<div class="space-y-3">
					<div>
						<span class="text-xs text-slate-500">MIME type: </span>
						<code class="text-sm text-sky-400 font-mono">{imageType}</code>
					</div>
					<div>
						<span class="text-xs text-slate-500">Base64 size: {Math.round(base64Only.length / 1024)} KB</span>
					</div>
					<div class="space-y-2">
						<button onclick={() => copyImage('datauri')} class="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors">
							{imageCopied ? '✓ Copied' : 'Copy Data URI (src="…")'}
						</button>
						<button onclick={() => copyImage('base64only')} class="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors">
							Copy Base64 only
						</button>
					</div>
				</div>
			</div>

			<div class="mt-4">
				<div class="text-xs text-slate-500 mb-1.5">HTML usage</div>
				<code class="block bg-slate-900 rounded-lg px-4 py-3 text-xs font-mono text-violet-400 break-all">
					&lt;img {imgAttribute.slice(0, 80)}{imgAttribute.length > 80 ? '…"' : ''} /&gt;
				</code>
			</div>
		{/if}
	</div>
</div>
