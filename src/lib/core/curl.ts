export interface ParsedCurl {
	url: string;
	method: string;
	headers: [string, string][];
	body: string | null;
	user: string | null;
}

export function parseCurl(raw: string): ParsedCurl | null {
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

export function toJs(p: ParsedCurl): string {
	const opts: string[] = [`method: '${p.method}'`];
	const hdrs: [string, string][] = [...p.headers];
	if (p.user) hdrs.push(['Authorization', 'Basic ' + btoa(p.user)]);
	if (hdrs.length) {
		opts.push(`headers: {\n${hdrs.map(([k, v]) => `    '${k}': '${v}'`).join(',\n')}\n  }`);
	}
	if (p.body) opts.push(`body: ${JSON.stringify(p.body)}`);

	return `fetch('${p.url}', {\n  ${opts.join(',\n  ')}\n})\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));`;
}

export function toPhp(p: ParsedCurl): string {
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

export function toPython(p: ParsedCurl): string {
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

export type CurlTarget = 'js' | 'php' | 'python';

/** curl-Befehl → Code; null, wenn der Befehl nicht erkannt wurde. */
export function curlToCode(input: string, target: CurlTarget): string | null {
	const parsed = parseCurl(input);
	if (!parsed || !parsed.url) return null;
	if (target === 'js') return toJs(parsed);
	if (target === 'php') return toPhp(parsed);
	return toPython(parsed);
}
