<script lang="ts">
	import { t } from '$lib/i18n';

	interface ErrorGroup {
		normalized: string;
		level: string;
		count: number;
		example: string;
	}

	let inputText = $state('');
	let fileName = $state('');
	let groups = $state<ErrorGroup[]>([]);
	let totalLines = $state(0);
	let analyzed = $state(false);
	let copied = $state(false);
	let dragging = $state(false);

	function parseLine(line: string): { level: string; message: string } | null {
		if (!line.trim()) return null;
		// Skip stack trace lines
		if (/^(\s+#\d+|\s+Stack trace:|\s+thrown in)/.test(line)) return null;

		let m: RegExpMatchArray | null;

		// Apache error: [timestamp] [level:subtype] [pid N] [client IP:port] message
		m = line.match(/^\[.*?\]\s+\[(\w+)(?::\w+)?\](?:\s+\[pid \d+\])?(?:\s+\[client [\d.:\[\]]+\])?\s*(.+)/);
		if (m) return { level: m[1].toLowerCase(), message: m[2].trim() };

		// Nginx error: YYYY/MM/DD HH:MM:SS [level] PID#TID: [*reqid] message
		m = line.match(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} \[(\w+)\] \d+#\d+: (?:\*\d+ )?(.+)/);
		if (m) return { level: m[1].toLowerCase(), message: m[2].trim() };

		// PHP error: [DD-Mon-YYYY HH:MM:SS UTC] PHP Level: message
		m = line.match(/^\[\d{2}-\w{3}-\d{4} \d{2}:\d{2}:\d{2}(?: \w+)?\] PHP (\w+(?: \w+)*): (.+)/);
		if (m) {
			const lvl = m[1].toLowerCase();
			return {
				level: lvl.includes('fatal') || lvl.includes('error') ? 'error' : lvl.includes('warn') ? 'warn' : 'notice',
				message: m[2].trim()
			};
		}

		// Syslog: Mon DD HH:MM:SS host service[pid]: message
		m = line.match(/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\S+\s+\S+:\s*(.+)/i);
		if (m) return { level: 'info', message: m[1].trim() };

		// ISO timestamp + optional level
		m = line.match(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?\s+(?:\[?(\w+)\]?\s+)?(.+)/);
		if (m) return { level: (m[1] || 'info').toLowerCase(), message: m[2].trim() };

		return { level: 'unknown', message: line.trim() };
	}

	function normalize(msg: string): string {
		return msg
			.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?\b/g, '{IP}')
			.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '{UUID}')
			.replace(/\*\d+\b/g, '*{N}')
			.replace(/\bpid \d+/gi, 'pid {N}')
			.replace(/\bport \d+/gi, 'port {N}')
			.replace(/\bon line \d+/gi, 'on line {N}')
			.replace(/\bin \/\S+ on line \d+/gi, 'in {FILE} on line {N}')
			.replace(/(?<![a-zA-Z]):\d{2,5}\b/g, ':{PORT}')
			.replace(/\b[0-9a-f]{16,}\b/gi, '{HEX}')
			.replace(/\b\d{10,}\b/g, '{ID}')
			.trim();
	}

	function levelPriority(level: string): number {
		const p: Record<string, number> = {
			error: 0, fatal: 0, crit: 1, alert: 1, emerg: 1,
			warn: 2, warning: 2, notice: 3, info: 4, debug: 5, unknown: 6
		};
		return p[level] ?? 6;
	}

	function analyze() {
		const lines = inputText.split('\n');
		totalLines = lines.filter(l => l.trim()).length;
		const map = new Map<string, ErrorGroup>();

		for (const line of lines) {
			const parsed = parseLine(line);
			if (!parsed) continue;
			const key = normalize(parsed.message);
			if (!key) continue;
			const existing = map.get(key);
			if (existing) {
				existing.count++;
			} else {
				map.set(key, { normalized: key, level: parsed.level, count: 1, example: line.trim() });
			}
		}

		groups = [...map.values()].sort((a, b) => {
			const lp = levelPriority(a.level) - levelPriority(b.level);
			return lp !== 0 ? lp : b.count - a.count;
		});
		analyzed = true;
	}

	function loadFile(file: File) {
		fileName = file.name;
		const reader = new FileReader();
		reader.onload = (ev) => { inputText = ev.target?.result as string ?? ''; };
		reader.readAsText(file);
	}

	function handleFileInput(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) loadFile(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		const file = e.dataTransfer?.files[0];
		if (file) loadFile(file);
	}

	function clear() {
		inputText = ''; fileName = ''; groups = []; totalLines = 0; analyzed = false;
	}

	function copy() {
		const text = groups.map(g => `[${g.level.toUpperCase()}] (${g.count}×) ${g.normalized}`).join('\n');
		navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

	const levelColor: Record<string, string> = {
		error: 'text-red-300', fatal: 'text-red-300', crit: 'text-red-300',
		alert: 'text-red-300', emerg: 'text-red-300',
		warn: 'text-amber-400', warning: 'text-amber-400',
		notice: 'text-sky-400', info: 'text-slate-300',
		debug: 'text-slate-400', unknown: 'text-slate-300',
	};

	const levelBorder: Record<string, string> = {
		error: 'border-red-800/60', fatal: 'border-red-800/60', crit: 'border-red-800/60',
		alert: 'border-red-800/60', emerg: 'border-red-800/60',
		warn: 'border-amber-700/50', warning: 'border-amber-700/50',
		notice: 'border-sky-800/50', info: 'border-slate-700',
		debug: 'border-slate-800', unknown: 'border-slate-700',
	};
</script>

<div class="space-y-4">
	<!-- Input -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('errorLog').input}</h2>

		<!-- Drop zone -->
		<label
			class="flex flex-col items-center justify-center border-2 border-dashed rounded-lg px-4 py-6 cursor-pointer transition-colors
				{dragging ? 'border-violet-500 bg-violet-900/20' : 'border-slate-600 hover:border-slate-500'}"
			ondragover={(e) => { e.preventDefault(); dragging = true; }}
			ondragleave={() => dragging = false}
			ondrop={handleDrop}
			aria-label={$t('errorLog').dropZone}
		>
			<svg class="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
			</svg>
			<span class="text-sm text-slate-300">{$t('errorLog').dropZone}</span>
			{#if fileName}<span class="mt-1 text-xs text-violet-300">{fileName}</span>{/if}
			<input type="file" accept=".log,.txt" onchange={handleFileInput} class="sr-only" />
		</label>

		<div class="flex items-center gap-3">
			<div class="flex-1 h-px bg-slate-700"></div>
			<span class="text-xs text-slate-400">{$t('errorLog').orPaste}</span>
			<div class="flex-1 h-px bg-slate-700"></div>
		</div>

		<label for="el-input" class="sr-only">{$t('errorLog').pasteLabel}</label>
		<textarea
			id="el-input"
			bind:value={inputText}
			placeholder={$t('errorLog').pastePlaceholder}
			rows="6"
			class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-xs font-mono resize-y"
		></textarea>

		<div class="flex gap-3">
			<button
				onclick={analyze}
				disabled={!inputText.trim()}
				class="px-6 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
			>{$t('errorLog').analyze}</button>
			{#if inputText || analyzed}
				<button onclick={clear} class="px-4 py-2.5 text-slate-300 hover:text-slate-100 text-sm transition-colors">{$t('errorLog').clear}</button>
			{/if}
		</div>
	</div>

	<!-- Results -->
	{#if analyzed}
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('errorLog').result}</h2>
					<p class="text-xs text-slate-300 mt-1">
						<span class="text-emerald-400 font-semibold">{groups.length}</span> {$t('errorLog').uniqueErrors}
						&nbsp;·&nbsp;
						{totalLines} {$t('errorLog').totalLines}
					</p>
				</div>
				{#if groups.length > 0}
					<button onclick={copy} class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-300 hover:text-violet-300 transition-colors">
						{copied ? $t('errorLog').copied : $t('errorLog').copy}
					</button>
				{/if}
			</div>

			{#if groups.length === 0}
				<p class="text-slate-400 text-sm">{$t('errorLog').empty}</p>
			{:else}
				<div class="space-y-2 max-h-[600px] overflow-y-auto pr-1">
					{#each groups as g}
						<div class="border rounded-lg px-4 py-3 bg-slate-900/60 {levelBorder[g.level] ?? 'border-slate-700'}">
							<div class="flex items-start justify-between gap-3">
								<div class="flex items-center gap-2 shrink-0">
									<span class="text-xs font-bold uppercase {levelColor[g.level] ?? 'text-slate-300'}">{g.level}</span>
									<span class="text-xs text-slate-400 bg-slate-800 rounded px-1.5 py-0.5">{g.count}×</span>
								</div>
							</div>
							<p class="mt-1.5 text-xs font-mono text-slate-300 break-all">{g.normalized}</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
