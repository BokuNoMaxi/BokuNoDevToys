<script lang="ts">
	import { t } from '$lib/i18n';

	let installGuideOpen = $state(false);
	let copied = $state(false);

	let state = $state({
		filename: '',
		url: '',
		audioOnly: false,
		audioFormat: 'mp3' as 'mp3' | 'm4a' | 'opus' | 'wav',
		videoFormat: 'default' as 'default' | 'bestMp4' | 'bestAny' | 'worst',
		playlist: 'default' as 'default' | 'no' | 'yes',
		embedSubs: false,
		subLangs: '',
		embedThumbnail: false,
		embedMetadata: false,
		rateLimit: false,
		rateLimitValue: '',
		restrictFilenames: false,
	});

	function escapeShell(val: string): string {
		return `'${val.replace(/'/g, `'\\''`)}'`;
	}

	const FORMAT_SELECTORS: Record<string, string> = {
		bestMp4: 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]',
		bestAny: 'bestvideo+bestaudio/best',
		worst: 'worst',
	};

	function buildYtDlp(s: typeof state) {
		if (!s.url.trim()) return { cmd: '', flags: [] as string[] };
		const flags: string[] = [];
		const parts = ['yt-dlp'];

		if (s.filename.trim()) { parts.push('-o', escapeShell(s.filename.trim())); flags.push('output'); }

		if (s.audioOnly) {
			parts.push('-x', '--audio-format', s.audioFormat);
			flags.push('audioOnly');
		} else if (s.videoFormat !== 'default') {
			parts.push('-f', escapeShell(FORMAT_SELECTORS[s.videoFormat]));
			flags.push('videoFormat');
		}

		if (s.playlist === 'no') { parts.push('--no-playlist'); flags.push('noPlaylist'); }
		else if (s.playlist === 'yes') { parts.push('--yes-playlist'); flags.push('yesPlaylist'); }

		if (s.embedSubs) {
			parts.push('--embed-subs', '--sub-langs', escapeShell(s.subLangs.trim() || 'en.*,de.*'));
			flags.push('embedSubs');
		}

		if (s.embedThumbnail) { parts.push('--embed-thumbnail'); flags.push('embedThumbnail'); }
		if (s.embedMetadata) { parts.push('--embed-metadata'); flags.push('embedMetadata'); }

		if (s.rateLimit && s.rateLimitValue.trim()) {
			parts.push('--limit-rate', escapeShell(s.rateLimitValue.trim()));
			flags.push('rateLimit');
		}

		if (s.restrictFilenames) { parts.push('--restrict-filenames'); flags.push('restrictFilenames'); }

		parts.push(escapeShell(s.url.trim()));
		flags.push('url');

		return { cmd: parts.join(' ').replace(/\s+/g, ' ').trim(), flags };
	}

	let built = $derived.by(() => buildYtDlp(state));
	let command = $derived(built.cmd);
	let activeFlags = $derived(built.flags);
	let isReady = $derived(!!command);

	let lc = $derived($t('ytDlpDownloader'));

	let explanationItems = $derived.by(() => {
		const dict = (lc.explain as Record<string, string>) ?? {};
		return activeFlags.map((key) => ({ key, text: dict[key] ?? key }));
	});

	function copy() {
		navigator.clipboard.writeText(command);
		copied = true;
		setTimeout(() => { copied = false; }, 1500);
	}
</script>

<div class="space-y-4">
	<!-- Windows-Installationsanleitung (Akkordeon) -->
	<div class="bg-slate-800 rounded-xl overflow-hidden">
		<button
			onclick={() => installGuideOpen = !installGuideOpen}
			aria-expanded={installGuideOpen}
			class="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-slate-300 uppercase tracking-wider hover:text-slate-100 transition-colors"
		>
			<span>{lc.installGuideTitle}</span>
			<svg class="w-4 h-4 transition-transform duration-200 {installGuideOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
			</svg>
		</button>
		{#if installGuideOpen}
			<div class="px-6 pb-6 space-y-3">
				<ol class="list-decimal list-inside space-y-2 text-sm text-slate-300 font-mono">
					<li class="font-sans">{lc.installStep1}</li>
					<li class="font-sans">{lc.installStep2}</li>
					<li class="font-sans">{lc.installStep3}</li>
					<li class="font-sans">{lc.installStep4}</li>
				</ol>
				<p class="text-xs text-slate-300">{lc.installNote}</p>
			</div>
		{/if}
	</div>

	<div class="bg-slate-800 rounded-xl p-6 space-y-5">
		<p class="text-sm text-slate-300">{lc.description}</p>

		<fieldset class="space-y-3">
			<legend class="text-xs text-slate-300 font-medium uppercase">{lc.basicLegend}</legend>
			<div>
				<label for="ytdlp-filename" class="block text-xs text-slate-300 mb-1.5">{lc.filename}</label>
				<input id="ytdlp-filename" type="text" bind:value={state.filename} placeholder={lc.filenamePlaceholder}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
				<p class="text-xs text-slate-300 mt-1">{lc.filenameHint}</p>
			</div>
			<div>
				<label for="ytdlp-url" class="block text-xs text-slate-300 mb-1.5">{lc.url}</label>
				<input id="ytdlp-url" type="url" bind:value={state.url} placeholder={lc.urlPlaceholder}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
			</div>
		</fieldset>

		<fieldset class="space-y-3">
			<legend class="text-xs text-slate-300 font-medium uppercase">{lc.optionsLegend}</legend>

			<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={state.audioOnly} class="rounded border-slate-600 bg-slate-900" />{lc.audioOnly}</label>
			{#if state.audioOnly}
				<div class="max-w-xs">
					<label for="ytdlp-audio-format" class="block text-xs text-slate-300 mb-1.5">{lc.audioFormat}</label>
					<select id="ytdlp-audio-format" bind:value={state.audioFormat}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm">
						<option value="mp3">{lc.audioFormatMp3}</option>
						<option value="m4a">{lc.audioFormatM4a}</option>
						<option value="opus">{lc.audioFormatOpus}</option>
						<option value="wav">{lc.audioFormatWav}</option>
					</select>
				</div>
			{:else}
				<div class="max-w-xs">
					<label for="ytdlp-video-format" class="block text-xs text-slate-300 mb-1.5">{lc.videoFormatLabel}</label>
					<select id="ytdlp-video-format" bind:value={state.videoFormat}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm">
						<option value="default">{lc.videoFormatDefault}</option>
						<option value="bestMp4">{lc.videoFormatBestMp4}</option>
						<option value="bestAny">{lc.videoFormatBestAny}</option>
						<option value="worst">{lc.videoFormatWorst}</option>
					</select>
				</div>
			{/if}

			<div>
				<span class="block text-xs text-slate-300 mb-1.5">{lc.playlistGroupLabel}</span>
				<div role="group" aria-label={lc.playlistGroupLabel} class="flex flex-wrap gap-2">
					<button onclick={() => state.playlist = 'default'} aria-pressed={state.playlist === 'default'}
						class="text-xs px-3 py-1.5 rounded-lg transition-colors {state.playlist === 'default' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700'}">{lc.playlistDefault}</button>
					<button onclick={() => state.playlist = 'no'} aria-pressed={state.playlist === 'no'}
						class="text-xs px-3 py-1.5 rounded-lg transition-colors {state.playlist === 'no' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700'}">{lc.playlistNo}</button>
					<button onclick={() => state.playlist = 'yes'} aria-pressed={state.playlist === 'yes'}
						class="text-xs px-3 py-1.5 rounded-lg transition-colors {state.playlist === 'yes' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700'}">{lc.playlistYes}</button>
				</div>
			</div>

			<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={state.embedSubs} class="rounded border-slate-600 bg-slate-900" />{lc.embedSubs}</label>
			{#if state.embedSubs}
				<div class="max-w-xs">
					<label for="ytdlp-sub-langs" class="block text-xs text-slate-300 mb-1.5">{lc.subLangs}</label>
					<input id="ytdlp-sub-langs" type="text" bind:value={state.subLangs} placeholder={lc.subLangsPlaceholder}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
				</div>
			{/if}

			<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={state.embedThumbnail} class="rounded border-slate-600 bg-slate-900" />{lc.embedThumbnail}</label>
			<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={state.embedMetadata} class="rounded border-slate-600 bg-slate-900" />{lc.embedMetadata}</label>

			<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={state.rateLimit} class="rounded border-slate-600 bg-slate-900" />{lc.rateLimit}</label>
			{#if state.rateLimit}
				<div class="max-w-[10rem]">
					<label for="ytdlp-rate-limit" class="block text-xs text-slate-300 mb-1.5">{lc.rateLimitValue}</label>
					<input id="ytdlp-rate-limit" type="text" bind:value={state.rateLimitValue} placeholder={lc.rateLimitPlaceholder}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
				</div>
			{/if}

			<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={state.restrictFilenames} class="rounded border-slate-600 bg-slate-900" />{lc.restrictFilenames}</label>
		</fieldset>
	</div>

	<div class="bg-slate-800 rounded-xl p-6 space-y-3" aria-live="polite">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{lc.generatedCommand}</h2>
		{#if isReady}
			<div class="flex items-start gap-2">
				<code class="flex-1 block bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-emerald-400 font-mono text-sm break-all">{command}</code>
				<button onclick={copy} class="shrink-0 text-xs px-3 py-3 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white transition-colors">
					{copied ? lc.copied : lc.copy}
				</button>
			</div>
			<p class="text-xs text-slate-300">{lc.executionNote}</p>
		{:else}
			<p class="text-sm text-slate-300">{lc.fillRequired}</p>
		{/if}
	</div>

	{#if isReady && explanationItems.length > 0}
		<div class="bg-slate-800 rounded-xl p-6">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{lc.explanationTitle}</h2>
			<dl class="space-y-2">
				{#each explanationItems as item (item.key)}
					<div>
						<dt class="font-mono text-violet-300 text-xs">{item.key}</dt>
						<dd class="text-slate-300 text-sm">{item.text}</dd>
					</div>
				{/each}
			</dl>
		</div>
	{/if}
</div>
