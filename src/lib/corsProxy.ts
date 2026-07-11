// Shared helper for fetching third-party pages client-side via a public CORS
// proxy (allorigins.win). The proxy is a free, unauthenticated service and is
// occasionally flaky (transient 500/522), so requests are retried with a
// short backoff before surfacing an error to the user.

const GET_ENDPOINT = (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
const RAW_ENDPOINT = (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

export function isHttpUrl(u: string): boolean {
	try {
		const parsed = new URL(u);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}

async function fetchWithRetry(url: string, attempts = 3, timeoutMs = 12000): Promise<Response> {
	let lastErr: unknown;
	for (let i = 0; i < attempts; i++) {
		try {
			const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
			if (res.ok) return res;
			lastErr = new Error(`HTTP ${res.status}`);
		} catch (e) {
			lastErr = e;
		}
		if (i < attempts - 1) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
	}
	throw lastErr instanceof Error ? lastErr : new Error('Request failed');
}

/** Fetch a page's HTML through the CORS proxy. Throws on failure/empty result. */
export async function fetchHtmlViaProxy(targetUrl: string): Promise<string> {
	const res = await fetchWithRetry(GET_ENDPOINT(targetUrl));
	const json = await res.json();
	const html: string = json.contents ?? '';
	if (!html) throw new Error('Proxy returned an empty response');
	return html;
}

/** Fetch a plain-text resource (robots.txt, sitemap.xml, …) through the CORS proxy. */
export async function fetchTextViaProxy(targetUrl: string): Promise<string> {
	const res = await fetchWithRetry(RAW_ENDPOINT(targetUrl));
	return await res.text();
}
