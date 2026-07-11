<script lang="ts">
	import VarDumpNode, { type VDNode } from '$lib/components/VarDumpNode.svelte';
	import { t } from '$lib/i18n';
	import { openPopoutText } from '$lib/popout';

	let input = $state('');
	let parsed = $state<VDNode | null>(null);
	let error = $state('');

	// ── Parser ──────────────────────────────────────────────────────────────

	function parseVarDump(text: string): VDNode {
		// Normalize: remove carriage returns, strip leading/trailing whitespace per line
		const lines = text
			.replace(/\r\n/g, '\n')
			.split('\n')
			.map(l => l.trim())
			.filter(l => l.length > 0);

		let pos = 0;

		function peek() { return lines[pos] ?? ''; }
		function consume() { return lines[pos++] ?? ''; }

		function parseValue(): VDNode {
			const line = peek();

			if (line === 'NULL') {
				consume();
				return { type: 'null' };
			}

			if (line.startsWith('bool(')) {
				consume();
				return { type: 'bool', value: line === 'bool(true)' };
			}

			if (line.startsWith('int(')) {
				consume();
				return { type: 'int', value: parseInt(line.slice(4, -1)) };
			}

			if (line.startsWith('float(') || line.startsWith('double(')) {
				consume();
				const inner = line.startsWith('float(') ? line.slice(6, -1) : line.slice(7, -1);
				return { type: 'float', value: parseFloat(inner) };
			}

			if (line.startsWith('string(')) {
				consume();
				// string(N) "value" — value might contain escaped quotes
				const m = line.match(/^string\((\d+)\) "(.*)"/s);
				return { type: 'string', length: m ? parseInt(m[1]) : 0, value: m ? m[2] : '' };
			}

			if (line.startsWith('array(')) {
				consume(); // "array(N) {"
				const m = line.match(/^array\((\d+)\)/);
				const length = m ? parseInt(m[1]) : 0;
				const children: VDNode['children'] = [];

				while (pos < lines.length && peek() !== '}') {
					const keyLine = peek();
					// Key patterns: [0]=> or ["key"]=> or [key]:protected=> or [key:ClassName:private]=>
					const ki = keyLine.match(/^\[(\d+)\]=>$/) ??
					            keyLine.match(/^\["(.*?)"\]=>$/) ??
					            keyLine.match(/^\["(.*?)":.*?\]=>$/) ??
					            keyLine.match(/^\[(.+?)\]=>$/);
					if (ki) {
						consume();
						const rawKey = ki[1];
						const key = /^\d+$/.test(rawKey) ? parseInt(rawKey) : rawKey;
						const val = parseValue();
						children.push({ key, value: val });
					} else {
						consume(); // skip unexpected line
					}
				}
				if (peek() === '}') consume();
				return { type: 'array', length, children };
			}

			if (line.startsWith('object(')) {
				consume(); // "object(Class)#id (N) {"
				const m = line.match(/^object\((.+?)\)#(\d+) \((\d+)\)/);
				const className = m ? m[1] : 'unknown';
				const objectId  = m ? parseInt(m[2]) : 0;
				const length    = m ? parseInt(m[3]) : 0;
				const children: VDNode['children'] = [];

				while (pos < lines.length && peek() !== '}') {
					const keyLine = peek();
					const ki = keyLine.match(/^\["(.*?)"\]=>$/) ??
					            keyLine.match(/^\["(.*?)":.*?\]=>$/) ??
					            keyLine.match(/^\[(\d+)\]=>$/) ??
					            keyLine.match(/^\[(.+?)\]=>$/);
					if (ki) {
						consume();
						children.push({ key: ki[1], value: parseValue() });
					} else {
						consume();
					}
				}
				if (peek() === '}') consume();
				return { type: 'object', className, objectId, length, children };
			}

			// Fallback: treat unknown line as string
			consume();
			return { type: 'string', value: line, length: line.length };
		}

		return parseValue();
	}

	// Serialize a parsed tree back to canonical, fully-expanded var_dump text (for popout).
	function nodeToText(node: VDNode, indent = ''): string {
		switch (node.type) {
			case 'null': return 'NULL';
			case 'bool': return `bool(${node.value ? 'true' : 'false'})`;
			case 'int': return `int(${node.value})`;
			case 'float': return `float(${node.value})`;
			case 'string': return `string(${node.length}) "${node.value}"`;
			case 'array':
			case 'object': {
				const children = node.children ?? [];
				const header = node.type === 'array'
					? `array(${children.length})`
					: `object(${node.className})#${node.objectId} (${children.length})`;
				if (children.length === 0) return `${header} {\n${indent}}`;
				const childIndent = indent + '  ';
				const body = children.map(c => {
					const keyStr = typeof c.key === 'number' ? `[${c.key}]` : `["${c.key}"]`;
					return `${childIndent}${keyStr}=>\n${childIndent}${nodeToText(c.value, childIndent)}`;
				}).join('\n');
				return `${header} {\n${body}\n${indent}}`;
			}
		}
	}

	// ────────────────────────────────────────────────────────────────────────

	function format() {
		error = '';
		parsed = null;
		if (!input.trim()) return;
		try {
			parsed = parseVarDump(input);
		} catch (e) {
			error = (e as Error).message;
		}
	}

	function handlePaste() {
		setTimeout(format, 0);
	}
</script>

<div class="space-y-6">
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1.5">var_dump</h2>
		<p class="text-xs text-slate-300 mb-3">Supported: string, int, float, bool, NULL, array, object — nested.</p>
		<label for="vd-input" class="sr-only">{$t('vardump').inputLabel}</label>
		<textarea
			id="vd-input"
			bind:value={input}
			onpaste={handlePaste}
			placeholder={'array(2) {\n  [0]=>\n  string(5) "hello"\n  [1]=>\n  int(42)\n}'}
			rows="10"
			class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-violet-500 font-mono text-xs resize-y"
		></textarea>
		{#if error}
			<p class="mt-2 text-red-300 text-sm font-mono" role="alert">{error}</p>
		{/if}
		<button
			onclick={format}
			disabled={!input.trim()}
			class="mt-3 px-5 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
		>{$t('vardump').parse}</button>
	</div>

	{#if parsed !== null}
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('vardump').result}</h2>
				<button onclick={() => openPopoutText($t('vardump').result, nodeToText(parsed))} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('vardump').popout}</button>
			</div>
			<div class="bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto max-h-[600px] overflow-y-auto">
				<VarDumpNode node={parsed} />
			</div>
		</div>
	{/if}
</div>
