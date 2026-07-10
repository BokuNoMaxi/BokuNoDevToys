<script lang="ts">
	import { t } from '$lib/i18n';

	let pattern = $state('');
	let testStr = $state('');
	let flagG = $state(true);
	let flagI = $state(false);
	let flagM = $state(false);
	let flagS = $state(false);

	interface MatchGroup { index: number; value: string; groups: (string | undefined)[]; }

	let result = $derived.by((): { highlighted: string; matches: MatchGroup[]; error: string } => {
		if (!pattern) return { highlighted: escHtml(testStr), matches: [], error: '' };
		try {
			const flags = (flagG ? 'g' : '') + (flagI ? 'i' : '') + (flagM ? 'm' : '') + (flagS ? 's' : '');
			const matches: MatchGroup[] = [];
			let m: RegExpExecArray | null;
			const localRe = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
			while ((m = localRe.exec(testStr)) !== null) {
				matches.push({ index: m.index, value: m[0], groups: m.slice(1) });
				if (m[0].length === 0) localRe.lastIndex++;
			}
			let highlighted = '';
			let pos = 0;
			for (const match of matches) {
				highlighted += escHtml(testStr.slice(pos, match.index));
				highlighted += `<mark class="bg-amber-400/25 text-amber-300 rounded px-0.5">${escHtml(match.value)}</mark>`;
				pos = match.index + match.value.length;
			}
			highlighted += escHtml(testStr.slice(pos));
			return { highlighted, matches, error: '' };
		} catch (e) {
			return { highlighted: escHtml(testStr), matches: [], error: (e as Error).message };
		}
	});

	function escHtml(s: string) {
		return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
	}

	function clear() { pattern = ''; testStr = ''; }

	// ── Pattern explanation ──────────────────────────────────────────────────
	interface Token { token: string; desc: string; color: string; }

	function explainPattern(p: string): Token[] {
		if (!p) return [];
		const tokens: Token[] = [];
		let i = 0;

		// color pool (cycling through for groups)
		const groupColors = ['text-sky-300','text-emerald-300','text-amber-300','text-violet-300','text-rose-300'];
		let groupDepth = 0;

		function peek(offset = 0) { return p[i + offset]; }

		function esc(ch: string): Token {
			const map: Record<string, string> = {
				'd': 'Ziffer [0-9]', 'D': 'Keine Ziffer', 'w': 'Wortzeichen [a-zA-Z0-9_]',
				'W': 'Kein Wortzeichen', 's': 'Whitespace', 'S': 'Kein Whitespace',
				'b': 'Wortgrenze', 'B': 'Keine Wortgrenze',
				'n': 'Zeilenumbruch', 't': 'Tabulator', 'r': 'Carriage Return',
				'A': 'Textanfang', 'Z': 'Textende',
			};
			return { token: '\\' + ch, desc: map[ch] ?? `Literal "${ch}"`, color: 'text-sky-400' };
		}

		function quantifierDesc(q: string): string {
			if (q === '*') return '0 oder mehr';
			if (q === '+') return '1 oder mehr';
			if (q === '?') return 'optional (0 oder 1)';
			const m = q.match(/^\{(\d+)(?:,(\d*))?\}$/);
			if (m) {
				if (m[2] === undefined) return `genau ${m[1]}x`;
				if (m[2] === '') return `mindestens ${m[1]}x`;
				return `${m[1]}–${m[2]}x`;
			}
			return q;
		}

		function readQuantifier(): string {
			const next = peek();
			if (next === '*' || next === '+' || next === '?') {
				let q = next; i++;
				if (peek() === '?') { q += '?'; i++; q += ' (lazy)'; }
				return q;
			}
			if (next === '{') {
				let j = i + 1, raw = '{';
				while (j < p.length && p[j] !== '}') { raw += p[j]; j++; }
				if (j < p.length) { raw += '}'; i = j + 1; return raw; }
			}
			return '';
		}

		while (i < p.length) {
			const ch = p[i];

			if (ch === '\\') {
				i++;
				const t = esc(peek());
				i++;
				const q = readQuantifier();
				tokens.push({ ...t, desc: t.desc + (q ? ` — ${quantifierDesc(q)}` : ''), token: t.token + q });
				continue;
			}

			if (ch === '[') {
				let raw = '[', j = i + 1;
				if (p[j] === '^') { raw += '^'; j++; }
				while (j < p.length && p[j] !== ']') { raw += p[j]; j++; }
				raw += ']'; i = j + 1;
				const negated = raw[1] === '^';
				const inner = raw.slice(negated ? 2 : 1, -1);
				const q = readQuantifier();
				tokens.push({
					token: raw + q,
					desc: `${negated ? 'Keines' : 'Eines'} der Zeichen: ${inner}` + (q ? ` — ${quantifierDesc(q)}` : ''),
					color: 'text-amber-400',
				});
				continue;
			}

			if (ch === '(') {
				i++;
				let kind = 'Capture Group';
				let color = groupColors[groupDepth % groupColors.length];
				groupDepth++;
				let prefix = '(';
				if (peek() === '?' ) {
					const nc = peek(1);
					if (nc === ':')  { kind = 'Non-Capture Group'; color = 'text-slate-400'; prefix = '(?:'; i += 2; }
					else if (nc === '=') { kind = 'Lookahead (gefolgt von …)'; color = 'text-rose-400'; prefix = '(?='; i += 2; }
					else if (nc === '!') { kind = 'Negativer Lookahead (nicht gefolgt von …)'; color = 'text-rose-400'; prefix = '(?!'; i += 2; }
					else if (nc === '<') {
						const nc2 = peek(2);
						if (nc2 === '=') { kind = 'Lookbehind (nach …)'; color = 'text-rose-400'; prefix = '(?<='; i += 3; }
						else if (nc2 === '!') { kind = 'Negativer Lookbehind'; color = 'text-rose-400'; prefix = '(?<!'; i += 3; }
						else {
							// named group (?<name>
							let name = ''; let j = i + 2;
							while (j < p.length && p[j] !== '>') { name += p[j]; j++; }
							kind = `Named Capture Group "${name}"`; prefix = `(?<${name}>`; i = j + 1;
						}
					}
				}
				tokens.push({ token: prefix, desc: `Beginn ${kind}`, color });
				continue;
			}

			if (ch === ')') {
				groupDepth = Math.max(0, groupDepth - 1);
				i++;
				const q = readQuantifier();
				tokens.push({ token: ')' + q, desc: 'Ende Gruppe' + (q ? ` — ${quantifierDesc(q)}` : ''), color: 'text-slate-400' });
				continue;
			}

			if (ch === '|') {
				i++;
				tokens.push({ token: '|', desc: 'Oder (Alternative)', color: 'text-slate-400' });
				continue;
			}

			if (ch === '^') {
				i++;
				tokens.push({ token: '^', desc: 'Anfang der Zeile', color: 'text-violet-400' });
				continue;
			}

			if (ch === '$') {
				i++;
				tokens.push({ token: '$', desc: 'Ende der Zeile', color: 'text-violet-400' });
				continue;
			}

			if (ch === '.') {
				i++;
				const q = readQuantifier();
				tokens.push({ token: '.' + q, desc: 'Beliebiges Zeichen' + (q ? ` — ${quantifierDesc(q)}` : ''), color: 'text-sky-400' });
				continue;
			}

			// Literal character
			i++;
			const q = readQuantifier();
			tokens.push({ token: ch + q, desc: `Literal "${ch}"` + (q ? ` — ${quantifierDesc(q)}` : ''), color: 'text-slate-300' });
		}

		return tokens;
	}

	let explanation = $derived(explainPattern(pattern));

	// ── Common patterns ──────────────────────────────────────────────────────
	const commonPatterns = [
		{ name: 'E-Mail',            pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}' },
		{ name: 'URL (http/https)',   pattern: 'https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+([\\w\\-.,@?^=%&:\\/~+#]*[\\w\\-@?^=%&\\/~+#])?' },
		{ name: 'IPv4',              pattern: '(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)' },
		{ name: 'Slug',              pattern: '[a-z0-9]+(?:-[a-z0-9]+)*' },
		{ name: 'Nur Buchstaben',    pattern: '^[a-zA-ZäöüÄÖÜß]+$' },
		{ name: 'Nur Zahlen',        pattern: '^\\d+$' },
		{ name: 'Telefon (DE/Int.)', pattern: '\\+?[\\d\\s\\-()]{7,20}' },
		{ name: 'Hex-Farbe',         pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b' },
		{ name: 'Datum DD.MM.YYYY',  pattern: '\\b(0?[1-9]|[12]\\d|3[01])\\.(0?[1-9]|1[0-2])\\.\\d{4}\\b' },
		{ name: 'PLZ (AT/DE)',       pattern: '\\b\\d{4,5}\\b' },
	];

	let copiedPattern = $state<string | null>(null);
	let commonPatternsOpen = $state(false);
	function applyPattern(p: string) {
		pattern = p;
		copiedPattern = p;
		setTimeout(() => { copiedPattern = null; }, 1500);
	}

	// ── Reference data ───────────────────────────────────────────────────────
	const refSections = [
		{
			title: 'Zeichenklassen',
			rows: [
				['.', 'Beliebiges Zeichen (außer Zeilenumbruch, ohne Flag s)'],
				['\\d', 'Ziffer [0-9]'],
				['\\D', 'Keine Ziffer'],
				['\\w', 'Wortzeichen [a-zA-Z0-9_]'],
				['\\W', 'Kein Wortzeichen'],
				['\\s', 'Leerzeichen, Tab, Zeilenumbruch'],
				['\\S', 'Kein Whitespace'],
				['[abc]', 'Eines der Zeichen a, b oder c'],
				['[^abc]', 'Keines der Zeichen a, b, c'],
				['[a-z]', 'Zeichen im Bereich a bis z'],
				['[a-zA-Z0-9]', 'Buchstaben und Ziffern'],
			]
		},
		{
			title: 'Quantifizierer',
			rows: [
				['*', '0 oder mehr (greedy)'],
				['+', '1 oder mehr (greedy)'],
				['?', '0 oder 1 (optional)'],
				['{n}', 'Genau n mal'],
				['{n,}', 'Mindestens n mal'],
				['{n,m}', 'Zwischen n und m mal'],
				['*?', '0 oder mehr (lazy, so wenig wie möglich)'],
				['+?', '1 oder mehr (lazy)'],
			]
		},
		{
			title: 'Anker & Grenzen',
			rows: [
				['^', 'Anfang der Zeile (mit Flag m: jede Zeile)'],
				['$', 'Ende der Zeile (mit Flag m: jede Zeile)'],
				['\\b', 'Wortgrenze'],
				['\\B', 'Keine Wortgrenze'],
			]
		},
		{
			title: 'Gruppen',
			rows: [
				['(abc)', 'Capture Group — wird in Treffer-Tabelle angezeigt'],
				['(?:abc)', 'Non-Capture Group — gruppiert ohne zu erfassen'],
				['(?<name>abc)', 'Named Capture Group'],
				['(?=abc)', 'Lookahead: gefolgt von abc'],
				['(?!abc)', 'Negativer Lookahead: nicht gefolgt von abc'],
				['(?<=abc)', 'Lookbehind: nach abc'],
				['(?<!abc)', 'Negativer Lookbehind: nicht nach abc'],
			]
		},
		{
			title: 'Alternativen & Escapes',
			rows: [
				['a|b', 'a oder b'],
				['\\n', 'Zeilenumbruch'],
				['\\t', 'Tabulator'],
				['\\.', 'Literal-Punkt (Backslash escaped Sonderzeichen)'],
				['[\\^\\$\\.\\|\\?\\*\\+\\(\\)]', 'Sonderzeichen die escaped werden müssen'],
			]
		},
		{
			title: 'Flags',
			rows: [
				['g', 'Global — alle Treffer finden (nicht nur den ersten)'],
				['i', 'Case-insensitive — Groß-/Kleinschreibung ignorieren'],
				['m', 'Multiline — ^ und $ matchen jede Zeile'],
				['s', 'Dotall — . matcht auch Zeilenumbrüche'],
			]
		},
	];
</script>

<div class="space-y-4">
	<!-- Pattern + Flags -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<div>
			<label for="rx-pattern" class="block text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('regexTester').pattern}</label>
			<div class="flex items-center gap-0">
				<span class="px-3 py-2.5 bg-slate-700 rounded-l-lg text-slate-400 text-sm font-mono border border-slate-600 border-r-0">/</span>
				<input
					id="rx-pattern"
					bind:value={pattern}
					placeholder={$t('regexTester').patternPlaceholder}
					class="flex-1 bg-slate-900 border border-slate-600 px-3 py-2.5 text-slate-300 focus:outline-none focus:border-violet-500 text-sm font-mono"
					spellcheck="false"
					autocomplete="off"
				/>
				<span class="px-3 py-2.5 bg-slate-700 rounded-r-lg text-slate-400 text-sm font-mono border border-slate-600 border-l-0">/{(flagG?'g':'')+(flagI?'i':'')+(flagM?'m':'')+(flagS?'s':'')}</span>
			</div>
			{#if result.error}
				<p role="alert" class="mt-2 text-xs text-red-300">{$t('regexTester').invalidRegex}: {result.error}</p>
			{/if}
		</div>

		<!-- Pattern explanation -->
		{#if explanation.length > 0 && !result.error}
			<div class="bg-slate-900/70 rounded-lg px-4 py-3">
				<p class="text-xs text-slate-400 uppercase tracking-wider mb-2">{$t('regexTester').explanation}</p>
				<div class="flex flex-wrap gap-y-2 gap-x-0">
					{#each explanation as tok}
						<div class="group relative">
							<span class="font-mono text-sm px-1.5 py-0.5 rounded cursor-default border border-transparent hover:border-slate-600 hover:bg-slate-800 transition-colors {tok.color}">{tok.token}</span>
							<!-- Tooltip -->
							<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-10 pointer-events-none">
								<div class="bg-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg border border-slate-600 max-w-52 text-center leading-snug">
									{tok.desc}
								</div>
								<div class="w-2 h-2 bg-slate-700 border-r border-b border-slate-600 rotate-45 mx-auto -mt-1"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div>
			<span class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('regexTester').flags}</span>
			<div class="flex gap-2" role="group" aria-label="Regex flags">
				{#each [['g', flagG, () => flagG = !flagG], ['i', flagI, () => flagI = !flagI], ['m', flagM, () => flagM = !flagM], ['s', flagS, () => flagS = !flagS]] as [label, active, toggle]}
					<button
						onclick={toggle as () => void}
						aria-pressed={active as boolean}
						class="w-10 py-1.5 rounded-lg text-sm font-mono font-bold transition-colors {active ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}"
					>{label}</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Test string + highlighted result -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('regexTester').testString}</h2>
				{#if pattern || testStr}
					<button onclick={clear} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('regexTester').clear}</button>
				{/if}
			</div>
			<textarea
				bind:value={testStr}
				placeholder={$t('regexTester').testPlaceholder}
				rows="14"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono resize-y"
				spellcheck="false"
			></textarea>
		</div>

		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center gap-3 mb-3">
				<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('regexTester').matches}</h2>
				{#if result.matches.length > 0}
					<span class="text-xs bg-violet-700/40 text-violet-300 px-2 py-0.5 rounded-full">{result.matches.length}</span>
				{/if}
			</div>
			<div class="bg-slate-900 rounded-lg px-4 py-3 text-sm font-mono whitespace-pre-wrap break-all min-h-32 max-h-48 overflow-y-auto leading-relaxed text-slate-300 mb-4">
				{#if testStr}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html result.highlighted || ''}
				{:else}
					<span class="text-slate-500">{$t('regexTester').testPlaceholder}</span>
				{/if}
			</div>
			{#if result.matches.length === 0 && testStr && pattern && !result.error}
				<p class="text-slate-400 text-sm">{$t('regexTester').noMatches}</p>
			{:else if result.matches.length > 0}
				<div class="overflow-x-auto max-h-48 overflow-y-auto">
					<table class="w-full text-xs">
						<thead class="text-slate-400 border-b border-slate-700 sticky top-0 bg-slate-800">
							<tr>
								<th class="text-left pb-2 pr-3">#</th>
								<th class="text-left pb-2 pr-3">{$t('regexTester').fullMatch}</th>
								{#if result.matches[0]?.groups.length > 0}
									{#each result.matches[0].groups as _, gi}
										<th class="text-left pb-2 pr-3">{$t('regexTester').group} {gi + 1}</th>
									{/each}
								{/if}
							</tr>
						</thead>
						<tbody>
							{#each result.matches as match, i}
								<tr class="border-b border-slate-800/50">
									<td class="py-1.5 pr-3 text-slate-400">{i + 1}</td>
									<td class="py-1.5 pr-3 font-mono text-amber-300 break-all">{match.value}</td>
									{#each match.groups as g}
										<td class="py-1.5 pr-3 font-mono text-sky-300 break-all">{g ?? '—'}</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>

	<!-- Common Patterns (Akkordeon) -->
	<div class="bg-slate-800 rounded-xl overflow-hidden">
		<button
			onclick={() => commonPatternsOpen = !commonPatternsOpen}
			aria-expanded={commonPatternsOpen}
			class="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-slate-300 uppercase tracking-wider hover:text-slate-100 transition-colors"
		>
			<span>{$t('regexTester').commonPatterns}</span>
			<svg class="w-4 h-4 transition-transform duration-200 {commonPatternsOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
			</svg>
		</button>
		{#if commonPatternsOpen}
			<div class="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
				{#each commonPatterns as cp}
					<button
						onclick={() => applyPattern(cp.pattern)}
						class="flex items-start gap-3 text-left px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 transition-colors group"
					>
						<div class="flex-1 min-w-0">
							<div class="text-xs font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">{cp.name}</div>
							<div class="text-xs font-mono text-slate-400 truncate mt-0.5">{cp.pattern}</div>
						</div>
						<span class="text-xs shrink-0 mt-0.5 {copiedPattern === cp.pattern ? 'text-emerald-400' : 'text-violet-400'}">
							{copiedPattern === cp.pattern ? '✓' : '→'}
						</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Regex Reference -->
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">{$t('regexTester').reference}</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
			{#each refSections as section}
				<div>
					<h3 class="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">{section.title}</h3>
					<table class="w-full text-xs">
						<tbody>
							{#each section.rows as [token, desc]}
								<tr class="border-b border-slate-700/40 last:border-0">
									<td class="py-1.5 pr-3 font-mono text-amber-300 whitespace-nowrap align-top">{token}</td>
									<td class="py-1.5 text-slate-400 leading-snug">{desc}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/each}
		</div>
	</div>
</div>
