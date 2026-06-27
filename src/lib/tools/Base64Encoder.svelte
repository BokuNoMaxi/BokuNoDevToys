<script lang="ts">
	let textInput = $state('');
	let textOutput = $state('');
	let textMode = $state<'encode' | 'decode'>('encode');
	let textError = $state('');

	let imageSrc = $state('');
	let imageDataUri = $state('');
	let imageType = $state('');
	let imageCopied = $state(false);

	let textCopied = $state(false);

	function processText() {
		textError = '';
		textOutput = '';
		if (!textInput.trim()) return;
		try {
			if (textMode === 'encode') {
				textOutput = btoa(unescape(encodeURIComponent(textInput)));
			} else {
				textOutput = decodeURIComponent(escape(atob(textInput)));
			}
		} catch {
			textError = textMode === 'decode' ? 'Invalid Base64 string' : 'Encoding failed';
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
		<div class="flex gap-2 mb-4">
			<button
				onclick={() => { textMode = 'encode'; textOutput = ''; textError = ''; }}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {textMode === 'encode' ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}"
			>Encode</button>
			<button
				onclick={() => { textMode = 'decode'; textOutput = ''; textError = ''; }}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {textMode === 'decode' ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}"
			>Decode</button>
		</div>

		<textarea
			bind:value={textInput}
			oninput={processText}
			placeholder={textMode === 'encode' ? 'Enter text to encode…' : 'Enter Base64 string to decode…'}
			rows="4"
			class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-sm resize-y"
		></textarea>

		{#if textError}<p class="mt-2 text-red-400 text-sm">{textError}</p>{/if}

		{#if textOutput}
			<div class="mt-4">
				<div class="flex items-center justify-between mb-1.5">
					<span class="text-xs text-slate-500">{textMode === 'encode' ? 'Base64 encoded' : 'Decoded text'}</span>
					<button onclick={copyText} class="text-xs text-slate-500 hover:text-slate-300 transition-colors">
						{textCopied ? '✓ Copied' : 'Copy'}
					</button>
				</div>
				<textarea
					readonly
					value={textOutput}
					rows="4"
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-emerald-400 font-mono text-sm resize-y"
				></textarea>
			</div>
		{/if}
	</div>

	<!-- Image -->
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Image → Base64</h2>

		<label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-violet-500 transition-colors bg-slate-900">
			<span class="text-slate-500 text-sm">Click to upload image</span>
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
						<div class="flex justify-between mb-1">
							<span class="text-xs text-slate-500">MIME type</span>
						</div>
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
