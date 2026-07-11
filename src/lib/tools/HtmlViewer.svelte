<script lang="ts">
	import { t } from '$lib/i18n';
	import DOMPurify from 'dompurify';
	import { openPopoutText, openPopoutHtml } from '$lib/popout';

	let input = $state('');
	let indentSize = $state(2);
	let copied = $state(false);

	const VOID_ELEMENTS = new Set([
		'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
		'link', 'meta', 'param', 'source', 'track', 'wbr',
	]);

	const PRE_ELEMENTS = new Set(['pre', 'textarea', 'script', 'style']);

	function formatAttrs(el: Element): string {
		return Array.from(el.attributes)
			.map(a => ` ${a.name}="${a.value.replace(/"/g, '&quot;')}"`)
			.join('');
	}

	function formatNode(node: Node, depth: number, indent: string, lines: string[]): void {
		const pad = indent.repeat(depth);

		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent?.trim() ?? '';
			if (text) lines.push(pad + text);
			return;
		}

		if (node.nodeType === Node.COMMENT_NODE) {
			lines.push(`${pad}<!--${node.textContent ?? ''}-->`);
			return;
		}

		if (node.nodeType !== Node.ELEMENT_NODE) return;

		const el = node as Element;
		const tag = el.tagName.toLowerCase();
		const attrs = formatAttrs(el);
		const openTag = `<${tag}${attrs}>`;

		if (VOID_ELEMENTS.has(tag)) {
			lines.push(`${pad}${openTag}`);
			return;
		}

		if (PRE_ELEMENTS.has(tag)) {
			const raw = tag === 'script' || tag === 'style' ? el.textContent ?? '' : el.innerHTML;
			lines.push(`${pad}${openTag}${raw}</${tag}>`);
			return;
		}

		const children = Array.from(el.childNodes).filter(n =>
			n.nodeType === Node.ELEMENT_NODE ||
			n.nodeType === Node.COMMENT_NODE ||
			(n.nodeType === Node.TEXT_NODE && (n.textContent?.trim().length ?? 0) > 0)
		);

		if (children.length === 0) {
			lines.push(`${pad}${openTag}</${tag}>`);
			return;
		}

		// Single text-only child that's short -> keep on one line
		if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
			const text = children[0].textContent?.trim() ?? '';
			lines.push(`${pad}${openTag}${text}</${tag}>`);
			return;
		}

		lines.push(`${pad}${openTag}`);
		for (const child of children) formatNode(child, depth + 1, indent, lines);
		lines.push(`${pad}</${tag}>`);
	}

	let result = $derived.by((): { formatted: string; error: string } => {
		if (!input.trim()) return { formatted: '', error: '' };
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(input, 'text/html');
			const parseErr = doc.querySelector('parsererror');
			if (parseErr) return { formatted: '', error: parseErr.textContent?.slice(0, 200) ?? 'Parse error' };

			const indent = ' '.repeat(indentSize);
			const lines: string[] = [];

			const hasHtmlTag = /<html[\s>]/i.test(input);
			if (hasHtmlTag) {
				formatNode(doc.documentElement, 0, indent, lines);
			} else {
				for (const child of Array.from(doc.body.childNodes)) {
					formatNode(child, 0, indent, lines);
				}
			}

			return { formatted: lines.join('\n'), error: '' };
		} catch (e) {
			return { formatted: '', error: (e as Error).message };
		}
	});

	let safeHtml = $derived(input.trim() ? DOMPurify.sanitize(input) : '');

	function copy() {
		navigator.clipboard.writeText(result.formatted);
		copied = true;
		setTimeout(() => { copied = false; }, 1500);
	}
</script>

<div class="space-y-4">
	<!-- Input -->
	<div class="bg-slate-800 rounded-xl p-6">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('htmlViewer').input}</h2>
			<div class="flex items-center gap-3">
				<label class="flex items-center gap-1.5 text-xs text-slate-400">
					{$t('htmlViewer').indent}
					<select bind:value={indentSize} class="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-violet-500">
						<option value={2}>2</option>
						<option value={4}>4</option>
						<option value={8}>8</option>
					</select>
				</label>
				{#if input}
					<button onclick={() => input = ''} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('htmlViewer').clear}</button>
				{/if}
			</div>
		</div>
		<textarea
			bind:value={input}
			placeholder={$t('htmlViewer').placeholder}
			rows="10"
			class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-xs placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-y"
			spellcheck="false"
		></textarea>
		{#if result.error}
			<p class="mt-2 text-red-300 text-sm">{result.error}</p>
		{/if}
	</div>

	<!-- Formatted output -->
	<div class="bg-slate-800 rounded-xl p-6">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('htmlViewer').formatted}</h2>
			{#if result.formatted}
				<div class="flex items-center gap-3">
					<button onclick={() => openPopoutText($t('htmlViewer').formatted, result.formatted)} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('htmlViewer').popout}</button>
					<button onclick={copy} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{copied ? $t('htmlViewer').copied : $t('htmlViewer').copy}</button>
				</div>
			{/if}
		</div>
		<pre class="bg-slate-900 rounded-lg px-4 py-3 text-emerald-400 text-xs font-mono overflow-x-auto min-h-24 max-h-[32rem] overflow-y-auto whitespace-pre">{result.formatted || $t('htmlViewer').placeholder}</pre>
	</div>

	<!-- Rendered preview -->
	<div class="bg-slate-800 rounded-xl p-6">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('htmlViewer').preview}</h2>
			{#if safeHtml}
				<button onclick={() => openPopoutHtml($t('htmlViewer').preview, safeHtml)} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('htmlViewer').popout}</button>
			{/if}
		</div>
		<div class="bg-white rounded-lg px-6 py-5 min-h-24 max-h-[32rem] overflow-y-auto text-black">
			{#if safeHtml}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html safeHtml}
			{:else}
				<p class="text-slate-500 text-sm">{$t('htmlViewer').placeholder}</p>
			{/if}
		</div>
	</div>
</div>
