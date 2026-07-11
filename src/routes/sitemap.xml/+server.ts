import { categories } from '$lib/tools/config';

export const prerender = true;

const SITE = 'https://devtoys.bokunocompany.at';

export function GET() {
	const urls = [
		`	<url><loc>${SITE}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
		...categories.flatMap((cat) =>
			cat.tools.map(
				(t) => `	<url><loc>${SITE}/tools/${t.id}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`
			)
		),
	].join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml' },
	});
}
