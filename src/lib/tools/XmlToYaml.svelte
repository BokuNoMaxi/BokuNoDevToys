<script lang="ts">
	import { t } from '$lib/i18n';

	let xmlInput = $state('');
	let copied = $state(false);

	function nodeToObj(node: Element): unknown {
		const children = Array.from(node.children);
		const attrs = Array.from(node.attributes).reduce((acc, a) => {
			acc[`@${a.name}`] = a.value;
			return acc;
		}, {} as Record<string, string>);

		if (children.length === 0) {
			const text = node.textContent?.trim() ?? '';
			if (Object.keys(attrs).length === 0) return text || null;
			return { ...attrs, '#text': text || null };
		}

		const result: Record<string, unknown> = { ...attrs };
		const seen: Record<string, number> = {};

		for (const child of children) {
			const tag = child.tagName;
			seen[tag] = (seen[tag] ?? 0) + 1;
		}

		for (const child of children) {
			const tag = child.tagName;
			const val = nodeToObj(child);
			if (seen[tag] > 1) {
				if (!Array.isArray(result[tag])) result[tag] = [];
				(result[tag] as unknown[]).push(val);
			} else {
				result[tag] = val;
			}
		}
		return result;
	}

	function toYaml(obj: unknown, indent = 0): string {
		const pad = '  '.repeat(indent);
		if (obj === null || obj === undefined) return 'null';
		if (typeof obj === 'string') {
			if (obj === '') return "''";
			if (/[\n:#{}&*!,[\]|>'"%@`]/.test(obj) || obj.startsWith(' ') || obj.endsWith(' ')) {
				return `"${obj.replace(/"/g, '\\"')}"`;
			}
			return obj;
		}
		if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
		if (Array.isArray(obj)) {
			return obj.map(item => {
				const rendered = toYaml(item, indent + 1);
				if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
					return `${pad}- ${rendered.trimStart()}`;
				}
				return `${pad}- ${rendered}`;
			}).join('\n');
		}
		if (typeof obj === 'object') {
			const entries = Object.entries(obj as Record<string, unknown>);
			return entries.map(([k, v]) => {
				if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
					return `${pad}${k}:\n${toYaml(v, indent + 1)}`;
				}
				if (Array.isArray(v)) {
					return `${pad}${k}:\n${toYaml(v, indent)}`;
				}
				return `${pad}${k}: ${toYaml(v, indent + 1)}`;
			}).join('\n');
		}
		return String(obj);
	}

	let result = $derived.by((): { yaml: string; error: string } => {
		if (!xmlInput.trim()) return { yaml: '', error: '' };
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(xmlInput, 'application/xml');
			const parseErr = doc.querySelector('parsererror');
			if (parseErr) return { yaml: '', error: parseErr.textContent?.slice(0, 200) ?? 'Parse error' };
			const root = doc.documentElement;
			const obj = { [root.tagName]: nodeToObj(root) };
			return { yaml: toYaml(obj), error: '' };
		} catch (e) {
			return { yaml: '', error: (e as Error).message };
		}
	});

	function copy() {
		navigator.clipboard.writeText(result.yaml);
		copied = true;
		setTimeout(() => { copied = false; }, 1500);
	}
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('xmlToYaml').xmlInput}</h2>
				{#if xmlInput}
					<button onclick={() => { xmlInput = ''; }} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('xmlToYaml').clear}</button>
				{/if}
			</div>
			<textarea
				bind:value={xmlInput}
				placeholder={$t('xmlToYaml').placeholder}
				rows="18"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-y"
				spellcheck="false"
			></textarea>
		</div>

		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('xmlToYaml').yamlOutput}</h2>
				{#if result.yaml}
					<button onclick={copy} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{copied ? $t('xmlToYaml').copied : $t('xmlToYaml').copy}</button>
				{/if}
			</div>
			{#if result.error}
				<p class="text-red-300 text-xs mb-3">{$t('xmlToYaml').error}: {result.error}</p>
			{/if}
			{#if result.yaml}
				<pre class="bg-slate-900 rounded-lg px-4 py-3 text-emerald-400 text-sm font-mono overflow-x-auto whitespace-pre max-h-96 overflow-y-auto">{result.yaml}</pre>
			{:else if !result.error}
				<div class="bg-slate-900 rounded-lg px-4 py-8 min-h-48 flex items-center justify-center">
					<p class="text-slate-400 text-sm">{$t('xmlToYaml').placeholder}</p>
				</div>
			{/if}
		</div>
	</div>
</div>
