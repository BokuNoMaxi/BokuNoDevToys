import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const PORT = 4100 + Math.floor(Math.random() * 500);
const BASE = `http://127.0.0.1:${PORT}`;
let proc;
let client;

before(async () => {
	proc = spawn('node', ['dist/server.mjs'], { env: { ...process.env, PORT: String(PORT), TZ: 'UTC' }, stdio: ['ignore', 'pipe', 'inherit'] });
	await new Promise((resolve) => proc.stdout.on('data', (d) => d.toString().includes('listening') && resolve()));
	client = new Client({ name: 'test', version: '1.0.0' });
	await client.connect(new StreamableHTTPClientTransport(new URL(`${BASE}/mcp`)));
});

after(async () => {
	await client?.close();
	proc?.kill();
});

const call = async (name, args = {}) => {
	const r = await client.callTool({ name, arguments: args });
	return { isError: !!r.isError, text: r.content.find((c) => c.type === 'text')?.text ?? '', content: r.content };
};

test('lists all tools with annotations and descriptions', async () => {
	const { tools } = await client.listTools();
	assert.equal(tools.length, 32);
	for (const t of tools) {
		assert.ok(t.description?.length > 10, `${t.name} has a description`);
		assert.equal(t.annotations?.readOnlyHint, true, `${t.name} is read-only`);
	}
});

test('base64 round trip incl. unicode', async () => {
	assert.equal((await call('base64', { mode: 'encode', input: 'hello' })).text, 'aGVsbG8=');
	const enc = (await call('base64', { mode: 'encode', input: 'Grüße 🎉' })).text;
	assert.equal((await call('base64', { mode: 'decode', input: enc })).text, 'Grüße 🎉');
	const bad = await call('base64', { mode: 'decode', input: '%%%' });
	assert.equal(bad.isError, true);
});

test('json_format formats, minifies and reports errors', async () => {
	assert.equal((await call('json_format', { json: '{"a":1,"b":[1,2]}' })).text, '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}');
	assert.equal((await call('json_format', { json: '{ "a" : 1 }', indent: 0 })).text, '{"a":1}');
	assert.equal((await call('json_format', { json: '{oops' })).isError, true);
});

test('sql_format', async () => {
	const r = await call('sql_format', { sql: 'select a,b from t where x=1' });
	assert.match(r.text, /SELECT\n\s+a,\n\s+b\nFROM\n\s+t\nWHERE\n\s+x = 1/);
});

test('xml_to_yaml and invalid xml', async () => {
	const r = await call('xml_to_yaml', { xml: '<root><item id="1">a</item><item id="2">b</item></root>' });
	assert.equal(r.isError, false);
	assert.match(r.text, /root:\n\s+item:/);
	assert.equal((await call('xml_to_yaml', { xml: '<root><a></root>' })).isError, true);
});

test('vardump_to_json', async () => {
	const r = await call('vardump_to_json', { vardump: 'array(2) {\n  ["a"]=>\n  int(1)\n  ["b"]=>\n  string(2) "hi"\n}' });
	assert.deepEqual(JSON.parse(r.text), { a: 1, b: 'hi' });
});

test('markdown_to_html', async () => {
	assert.match((await call('markdown_to_html', { markdown: '# T\n\n**b**' })).text, /<h1>T<\/h1>\n<p><strong>b<\/strong><\/p>/);
});

test('color_convert and color_contrast', async () => {
	const c = JSON.parse((await call('color_convert', { color: '#8b5cf6' })).text);
	assert.equal(c.rgb, 'rgb(139, 92, 246)');
	assert.equal(c.hsl, 'hsl(258, 90%, 66%)');
	assert.equal((await call('color_convert', { color: 'nope' })).isError, true);
	const k = JSON.parse((await call('color_contrast', { foreground: '#ffffff', background: '#000000' })).text);
	assert.equal(k.ratio, 21);
	assert.equal(k.aaaNormal, true);
});

test('csv_parse auto-detects delimiter', async () => {
	const r = JSON.parse((await call('csv_parse', { csv: 'a;b\n1;"x;y"\n2;z' })).text);
	assert.equal(r.delimiter, ';');
	assert.deepEqual(r.columns, ['a', 'b']);
	assert.deepEqual(r.rows, [['1', 'x;y'], ['2', 'z']]);
});

test('diff_text', async () => {
	const r = await call('diff_text', { original: 'a\nb\nc', changed: 'a\nB\nc' });
	assert.match(r.text, /"added":1,"removed":1,"unchanged":2/);
	assert.match(r.text, /- b\n\+ B/);
	const big = 'x\n'.repeat(2000);
	assert.equal((await call('diff_text', { original: big, changed: big })).isError, true);
});

test('text_prettify', async () => {
	assert.equal((await call('text_prettify', { text: '  a  \n\n b ', mode: 'single' })).text, 'a b');
	assert.equal((await call('text_prettify', { text: 'Hello World foo', mode: 'single', caseTransform: 'snake' })).text, 'hello_world_foo');
});

test('text_generate honours paragraphs and maxChars', async () => {
	const r = (await call('text_generate', { model: 'lorem-ipsum', paragraphs: 2 })).text;
	assert.equal(r.split('\n\n').length, 2);
	assert.ok(r.startsWith('Lorem ipsum dolor sit amet'));
	assert.ok((await call('text_generate', { paragraphs: 3, maxChars: 80 })).text.length <= 81);
});

test('regex_test and catastrophic backtracking timeout', async () => {
	const r = JSON.parse((await call('regex_test', { pattern: '(\\d+)-(\\w+)', text: '12-ab 7-z', flags: 'g' })).text);
	assert.equal(r.count, 2);
	assert.deepEqual(r.matches[0].groups, ['12', 'ab']);
	assert.equal((await call('regex_test', { pattern: '(', text: 'x' })).isError, true);
	const t0 = Date.now();
	const evil = await call('regex_test', { pattern: '^(a+)+$', text: 'a'.repeat(40) + 'b' });
	assert.equal(evil.isError, true);
	assert.match(evil.text, /timed out/);
	assert.ok(Date.now() - t0 < 5000);
	// server still healthy afterwards
	assert.equal((await call('base64', { mode: 'encode', input: 'ok' })).isError, false);
});

test('hash_text matches known digests', async () => {
	assert.equal((await call('hash_text', { text: 'hello', algorithm: 'MD5' })).text, '5d41402abc4b2a76b9719d911017c592');
	assert.equal((await call('hash_text', { text: 'hello', algorithm: 'SHA-1' })).text, 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
	assert.equal((await call('hash_text', { text: 'hello' })).text, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
	assert.equal((await call('hash_text', { text: '', algorithm: 'MD5' })).text, 'd41d8cd98f00b204e9800998ecf8427e');
});

test('password_generate respects options', async () => {
	const r = JSON.parse((await call('password_generate', { length: 30, count: 3, symbols: false, upper: false, lower: false, numbers: true })).text);
	assert.equal(r.passwords.length, 3);
	for (const p of r.passwords) assert.match(p, /^\d{30}$/);
	assert.equal(r.entropyBits, Math.round(30 * Math.log2(10)));
	assert.equal((await call('password_generate', { upper: false, lower: false, numbers: false })).isError, true);
});

test('random tools stay in range', async () => {
	const n = JSON.parse((await call('random_int', { min: 5, max: 7, count: 200 })).text);
	assert.ok(n.every((v) => v >= 5 && v <= 7) && new Set(n).size === 3);
	const s = (await call('random_pick', { values: 'a\nb\nc', action: 'shuffle' })).text.split('\n').sort();
	assert.deepEqual(s, ['a', 'b', 'c']);
	assert.ok(['a', 'b'].includes((await call('random_pick', { values: 'a\nb', action: 'pick' })).text));
});

test('cron_next_runs', async () => {
	const r = JSON.parse((await call('cron_next_runs', { expression: '30 8 * * 1', count: 2, from: '2026-01-01T00:00:00Z' })).text);
	assert.deepEqual(r, ['2026-01-05T08:30:00.000Z', '2026-01-12T08:30:00.000Z']);
	assert.equal((await call('cron_next_runs', { expression: '* *' })).isError, true);
});

test('curl_to_code', async () => {
	const r = await call('curl_to_code', { curl: `curl -X POST https://x.test/a -H 'Content-Type: application/json' -d '{"a":1}'`, target: 'python' });
	assert.match(r.text, /requests\.post\('https:\/\/x\.test\/a', headers=\{'Content-Type': 'application\/json'\}, data="\{\\"a\\":1\}"\)/);
	assert.equal((await call('curl_to_code', { curl: 'ls -la', target: 'js' })).isError, true);
});

test('qr_generate returns a PNG', async () => {
	const r = await call('qr_generate', { type: 'wifi', content: 'Home', wifiPassword: 'pw', size: 128 });
	const img = r.content.find((c) => c.type === 'image');
	assert.equal(img.mimeType, 'image/png');
	assert.equal(Buffer.from(img.data, 'base64').subarray(1, 4).toString(), 'PNG');
	assert.match(r.text, /WIFI:S:Home;T:WPA;P:pw;;/);
});

test('date tools', async () => {
	assert.equal((await call('timestamp_convert', { mode: 'to_timestamp', value: '2026-01-01T00:00:00Z' })).text, '1767225600');
	assert.match((await call('timestamp_convert', { mode: 'from_timestamp', value: '1767225600' })).text, /UTC:   Thu, 01 Jan 2026 00:00:00 GMT/);
	assert.equal((await call('date_add', { date: '2026-01-31', time: '10:00', months: 1 })).text, '2026-03-03 10:00:00');
	assert.equal((await call('date_add', { date: '2026-03-01', operation: 'subtract', days: 1 })).text, '2026-02-28 00:00:00');
	const d = JSON.parse((await call('date_diff', { dateA: '2026-01-01', dateB: '2026-01-03', timeB: '12:30' })).text);
	assert.equal(d.totalDays, 2);
	assert.equal(d.hours, 12);
	assert.equal((await call('timezone_convert', { date: '2026-06-01', time: '12:00', from: 'UTC', to: 'MESZ' })).text, '01.06.2026 14:00:00 MESZ+2');
	assert.equal((await call('timezone_convert', { date: '2026-06-01', time: '12:00', from: '+5', to: '-3' })).text, '01.06.2026 04:00:00 -3-3');
});

test('css_unit_convert and aspect_ratio', async () => {
	const u = JSON.parse((await call('css_unit_convert', { value: 24, unit: 'px' })).text);
	assert.equal(u.rem, '1.5rem');
	assert.equal(u.pt, '18pt');
	const a = JSON.parse((await call('aspect_ratio', { width: 1920, height: 1080, ratioW: 4, ratioH: 3 })).text);
	assert.deepEqual(a.ratio, { w: 16, h: 9, name: '16:9' });
	assert.equal(a.heightForWidth, 1440);
});

const ACCESS = [
	'1.1.1.1 - - [10/Oct/2023:13:55:36 +0000] "GET /a?x=1 HTTP/1.1" 200 100 "-" "Mozilla/5.0"',
	'1.1.1.1 - - [10/Oct/2023:13:56:00 +0000] "GET /a HTTP/1.1" 404 50 "-" "Mozilla/5.0"',
	'2.2.2.2 - - [10/Oct/2023:14:00:00 +0000] "GET /b HTTP/1.1" 200 2048 "-" "Googlebot/2.1"',
	'garbage line',
].join('\n');

test('access_log_analyze', async () => {
	const r = JSON.parse((await call('access_log_analyze', { log: ACCESS })).text);
	assert.equal(r.total, 3);
	assert.equal(r.uniqueIPs, 2);
	assert.equal(r.errors, 1);
	assert.equal(r.bots, 1);
	assert.equal(r.unparsedLines, 1);
	assert.deepEqual(r.topPaths[0], ['/a', 2]);
	assert.equal(r.hourly[13], 2);
	assert.equal((await call('access_log_analyze', { log: ACCESS, filter: 'bots' })).isError, false);
	assert.equal((await call('access_log_analyze', { log: ACCESS, day: '11/Oct/2023' })).isError, true);
	assert.equal((await call('access_log_analyze', { log: 'nothing' })).isError, true);
});

test('error_log_analyze groups by normalized message', async () => {
	const log = [
		'2023/10/10 13:55:36 [error] 29#29: *1 connect() failed (111) while connecting to upstream, client: 1.2.3.4',
		'2023/10/10 13:55:37 [error] 29#29: *2 connect() failed (111) while connecting to upstream, client: 5.6.7.8',
		'[10-Oct-2023 13:55:36 UTC] PHP Warning: Undefined variable $x in /var/www/a.php on line 12',
	].join('\n');
	const r = JSON.parse((await call('error_log_analyze', { log })).text);
	assert.equal(r.totalLines, 3);
	assert.equal(r.groups[0].level, 'error');
	assert.equal(r.groups[0].count, 2);
});

const HTML = '<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Hello World Page</title><meta name="description" content="A description that is long enough to be considered fine by the SEO checker here."><meta name="viewport" content="width=device-width"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","name":"x"}</script></head><body><h1>Main</h1><h2>Sub</h2><p>word word word</p><img src="a.png"></body></html>';

test('seo_analyze, schema_extract, keyword_density', async () => {
	const seo = JSON.parse((await call('seo_analyze', { html: HTML, url: 'https://x.test/' })).text);
	assert.ok(seo.score > 40 && seo.score < 100);
	const by = Object.fromEntries(seo.checks.map((c) => [c.key, c.status]));
	assert.equal(by.title, 'pass');
	assert.equal(by.lang, 'pass');
	assert.equal(by.alt, 'fail');
	assert.equal(by.jsonld, 'pass');
	assert.equal(by.https, 'pass');
	const schema = JSON.parse((await call('schema_extract', { html: HTML })).text);
	assert.equal(schema[0].type, 'Article');
	assert.equal(schema[0].valid, true);
	assert.equal((await call('schema_extract', { html: '<p>none</p>' })).isError, true);
	const kd = JSON.parse((await call('keyword_density', { text: 'cat dog cat bird cat dog the the', ngram: 1 })).text);
	assert.deepEqual(kd.rows.map((r) => [r.phrase, r.count]), [['cat', 3], ['dog', 2]]);
});

test('robots_sitemap_validate', async () => {
	const rb = JSON.parse((await call('robots_sitemap_validate', { kind: 'robots', content: 'User-agent: *\nDisallow: /admin\nSitemap: https://x.test/sitemap.xml' })).text);
	assert.equal(rb.sitemapUrl, 'https://x.test/sitemap.xml');
	assert.ok(rb.findings.every((f) => f.status === 'pass'));
	const sm = JSON.parse((await call('robots_sitemap_validate', { kind: 'sitemap', content: '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://x.test/</loc><lastmod>2026-01-01</lastmod></url></urlset>' })).text);
	assert.equal(sm.urlCount, 1);
	const bad = JSON.parse((await call('robots_sitemap_validate', { kind: 'sitemap', content: '<urlset><url></urlset>' })).text);
	assert.equal(bad.findings[0].status, 'fail');
});

test('HTTP surface: health, 404, 405, invalid json, oversize', async () => {
	assert.equal((await fetch(`${BASE}/healthz`)).status, 200);
	assert.equal((await fetch(`${BASE}/.well-known/oauth-authorization-server`)).status, 404);
	const get = await fetch(`${BASE}/mcp`);
	assert.equal(get.status, 405);
	const bad = await fetch(`${BASE}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{nope' });
	assert.equal(bad.status, 400);
	const huge = await fetch(`${BASE}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: 'x'.repeat(7 * 1024 * 1024) }).catch((e) => e);
	assert.ok(huge instanceof Error || huge.status === 413);
});

test('input size limit is enforced by schema', async () => {
	const r = await call('base64', { mode: 'encode', input: 'x'.repeat(2_000_001) }).catch((e) => ({ isError: true, text: String(e) }));
	assert.equal(r.isError, true);
});

test('docs page lists exactly the registered tools (en + de)', async () => {
	const { readFileSync } = await import('node:fs');
	const { tools } = await client.listTools();
	const names = tools.map((t) => t.name).sort();
	for (const file of ['en', 'de']) {
		const src = readFileSync(new URL(`../../src/lib/translations/${file}.ts`, import.meta.url), 'utf8');
		const section = src.slice(src.indexOf('mcpDocs: {'));
		const listed = [...section.matchAll(/\{ name: '([a-z_0-9]+)'/g)].map((m) => m[1]).sort();
		assert.deepEqual(listed, names, `${file}.ts tool list matches server`);
	}
});
