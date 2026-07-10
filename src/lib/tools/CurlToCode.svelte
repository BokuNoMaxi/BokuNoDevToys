<script lang="ts">
	import { t } from '$lib/i18n';

	let input = $state('');
	let target = $state<'js' | 'php' | 'python'>('js');
	let copied = $state(false);

	interface ParsedCurl {
		url: string;
		method: string;
		headers: [string, string][];
		body: string | null;
		user: string | null;
	}

	function parseCurl(raw: string): ParsedCurl | null {
		const s = raw.trim();
		if (!s.startsWith('curl')) return null;

		let url = '';
		let method = 'GET';
		const headers: [string, string][] = [];
		let body: string | null = null;
		let user: string | null = null;

		// Tokenize handling quoted strings
		const tokens: string[] = [];
		const re = /(?:'([^']*)'|"((?:[^"\\]|\\.)*)"|(\S+))/g;
		let m: RegExpExecArray | null;
		while ((m = re.exec(s)) !== null) {
			tokens.push(m[1] ?? m[2]?.replace(/\\"/g, '"').replace(/\\\\/g, '\\') ?? m[3]);
		}

		let i = 1; // skip 'curl'
		while (i < tokens.length) {
			const tok = tokens[i];
			if (tok === '-X' || tok === '--request') {
				method = tokens[++i] ?? method;
			} else if (tok === '-H' || tok === '--header') {
				const h = tokens[++i] ?? '';
				const ci = h.indexOf(':');
				if (ci > 0) headers.push([h.slice(0, ci).trim(), h.slice(ci + 1).trim()]);
			} else if (tok === '-d' || tok === '--data' || tok === '--data-raw' || tok === '--data-binary') {
				body = tokens[++i] ?? '';
				if (method === 'GET') method = 'POST';
			} else if (tok === '-u' || tok === '--user') {
				user = tokens[++i] ?? '';
			} else if (tok === '-b' || tok === '--cookie') {
				const val = tokens[++i] ?? '';
				headers.push(['Cookie', val]);
			} else if (tok === '--compressed') {
				headers.push(['Accept-Encoding', 'gzip, deflate, br']);
			} else if (tok === '-L' || tok === '--location' || tok === '-s' || tok === '--silent') {
				// ignore
			} else if (!tok.startsWith('-')) {
				if (!url) url = tok;
			}
			i++;
		}

		return { url, method, headers, body, user };
	}

	function toJs(p: ParsedCurl): string {
		const opts: string[] = [`method: '${p.method}'`];
		const hdrs: [string, string][] = [...p.headers];
		if (p.user) hdrs.push(['Authorization', 'Basic ' + btoa(p.user)]);
		if (hdrs.length) {
			opts.push(`headers: {\n${hdrs.map(([k, v]) => `    '${k}': '${v}'`).join(',\n')}\n  }`);
		}
		if (p.body) opts.push(`body: ${JSON.stringify(p.body)}`);

		return `fetch('${p.url}', {\n  ${opts.join(',\n  ')}\n})\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));`;
	}

	function toPhp(p: ParsedCurl): string {
		const hdrs: [string, string][] = [...p.headers];
		if (p.user) hdrs.push(['Authorization', 'Basic ' + btoa(p.user)]);
		const hdrStr = hdrs.map(([k, v]) => `  '${k}: ${v}',`).join('\n');
		return `$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, '${p.url}');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${p.method}');${hdrs.length ? `
curl_setopt($ch, CURLOPT_HTTPHEADER, [
${hdrStr}
]);` : ''}${p.body ? `
curl_setopt($ch, CURLOPT_POSTFIELDS, ${JSON.stringify(p.body)});` : ''}
$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);
if ($error) { echo "Error: $error"; } else { echo $response; }`;
	}

	function toPython(p: ParsedCurl): string {
		const hdrs: [string, string][] = [...p.headers];
		if (p.user) hdrs.push(['Authorization', 'Basic ' + btoa(p.user)]);
		const hdrDict = '{' + hdrs.map(([k, v]) => `'${k}': '${v}'`).join(', ') + '}';
		const method = p.method.toLowerCase();
		const dataArg = p.body ? `, data=${JSON.stringify(p.body)}` : '';
		const hdrArg = hdrs.length ? `, headers=${hdrDict}` : '';
		return `import requests

response = requests.${method}('${p.url}'${hdrArg}${dataArg})
print(response.status_code)
print(response.json())`;
	}

	let result = $derived.by(() => {
		if (!input.trim()) return null;
		const parsed = parseCurl(input);
		if (!parsed || !parsed.url) return { code: '', error: $t('curlToCode').error };
		let code = '';
		if (target === 'js') code = toJs(parsed);
		else if (target === 'php') code = toPhp(parsed);
		else code = toPython(parsed);
		return { code, error: '' };
	});

	function copy() {
		if (result?.code) {
			navigator.clipboard.writeText(result.code);
			copied = true;
			setTimeout(() => { copied = false; }, 1500);
		}
	}
</script>

<div class="space-y-4">
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<div>
			<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" for="curl-input">{$t('curlToCode').input}</label>
			<textarea
				id="curl-input"
				bind:value={input}
				placeholder={$t('curlToCode').placeholder}
				rows="5"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-y"
				spellcheck="false"
			></textarea>
			{#if input}
				<button onclick={() => input = ''} class="mt-1.5 text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('curlToCode').clear}</button>
			{/if}
		</div>

		<div>
			<span class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('curlToCode').target}</span>
			<div class="flex gap-2">
				{#each [['js', $t('curlToCode').js], ['php', $t('curlToCode').php], ['python', $t('curlToCode').python]] as [key, label]}
					<button
						onclick={() => target = key as 'js' | 'php' | 'python'}
						class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {target === key ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}"
					>{label}</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="bg-slate-800 rounded-xl p-6">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('curlToCode').result}</h2>
			{#if result?.code}
				<button onclick={copy} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{copied ? $t('curlToCode').copied : $t('curlToCode').copy}</button>
			{/if}
		</div>
		{#if result?.error}
			<p class="text-red-300 text-sm">{result.error}</p>
		{:else if result?.code}
			<pre class="bg-slate-900 rounded-lg px-4 py-3 text-emerald-400 text-sm overflow-x-auto whitespace-pre font-mono leading-relaxed">{result.code}</pre>
		{:else}
			<div class="bg-slate-900 rounded-lg px-4 py-8 flex items-center justify-center">
				<p class="text-slate-400 text-sm">{$t('curlToCode').empty}</p>
			</div>
		{/if}
	</div>
</div>
