<script lang="ts">
	import { categories } from '$lib/tools/config';
	import { t } from '$lib/i18n';

	const icons: Record<string, string> = {
		dateTime: '🕐',
		text: '📝',
		webServer: '🔒',
		format: '{}',
		database: '🗄️',
		encoding: '🔤',
	};
</script>

<svelte:head>
	<title>BokuNoDevToys — Free Online Developer Tools</title>
	<meta name="description" content="Free browser-based developer tools: JSON formatter, regex tester, QR code generator, CSS generators, hash & password generators and many more. Everything runs client-side — no data leaves your browser." />
	<link rel="canonical" href="https://devtoys.bokunocompany.at/" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="BokuNoDevToys" />
	<meta property="og:title" content="BokuNoDevToys — Free Online Developer Tools" />
	<meta property="og:description" content="Free browser-based developer tools. Everything runs client-side — no data leaves your browser." />
	<meta property="og:url" content="https://devtoys.bokunocompany.at/" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="BokuNoDevToys — Free Online Developer Tools" />
	<meta name="twitter:description" content="Free browser-based developer tools. Everything runs client-side — no data leaves your browser." />
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'BokuNoDevToys',
		url: 'https://devtoys.bokunocompany.at/',
		applicationCategory: 'DeveloperApplication',
		operatingSystem: 'Any',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
		description: 'Free browser-based developer tools. Everything runs client-side — no data leaves your browser.'
	})}</scr` + `ipt>`}
</svelte:head>

<div class="max-w-4xl mx-auto">
	<div class="mb-10">
		<h1 class="text-3xl font-bold text-slate-100">BokuNoDevToys</h1>
		<p class="mt-2 text-slate-300">{$t('home').subtitle}</p>
	</div>

	<div class="space-y-8">
		{#each categories as category}
			{@const tools = $t('tools')}
			{@const cats = $t('cats')}
			<div>
				<div class="flex items-center gap-2 mb-4">
					<span class="text-lg">{icons[category.key] ?? '🔧'}</span>
					<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{cats[category.key]}</h2>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{#each category.tools as tool}
						{@const meta = tools[tool.id as keyof typeof tools]}
						<a
							href="/tools/{tool.id}"
							class="group bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-violet-500/50 rounded-xl p-5 transition-all duration-150"
						>
							<div class="flex items-start justify-between">
								<h3 class="font-semibold text-slate-200 group-hover:text-violet-300 transition-colors">{meta?.name ?? tool.id}</h3>
								<svg class="w-4 h-4 text-slate-600 group-hover:text-violet-300 mt-0.5 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
								</svg>
							</div>
							<p class="mt-1.5 text-sm text-slate-300 group-hover:text-slate-200 transition-colors">{meta?.description ?? ''}</p>
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-12 pt-8 border-t border-slate-800 text-center">
		<p class="text-xs text-slate-400">{$t('home').footer}</p>
	</div>
</div>
