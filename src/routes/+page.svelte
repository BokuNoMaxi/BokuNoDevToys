<script lang="ts">
	import { categories } from '$lib/tools/config';

	const icons: Record<string, string> = {
		'Date & Time': '🕐',
		'Text': '📝',
		'Web Server': '🔒',
		'Encoding': '🔤'
	};
</script>

<svelte:head>
	<title>BokuNoDevToys — Developer Tools</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<div class="mb-10">
		<h1 class="text-3xl font-bold text-slate-100">BokuNoDevToys</h1>
		<p class="mt-2 text-slate-400">Eine Sammlung praktischer Tools für Entwickler — alles läuft direkt im Browser, keine Daten werden übertragen.</p>
	</div>

	<div class="space-y-8">
		{#each categories as category}
			<div>
				<div class="flex items-center gap-2 mb-4">
					<span class="text-lg">{icons[category.name] ?? '🔧'}</span>
					<h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wider">{category.name}</h2>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{#each category.tools as tool}
						<a
							href="/tools/{tool.id}"
							class="group bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-violet-500/50 rounded-xl p-5 transition-all duration-150"
						>
							<div class="flex items-start justify-between">
								<h3 class="font-semibold text-slate-200 group-hover:text-violet-400 transition-colors">{tool.name}</h3>
								<svg class="w-4 h-4 text-slate-600 group-hover:text-violet-400 mt-0.5 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
								</svg>
							</div>
							<p class="mt-1.5 text-sm text-slate-500 group-hover:text-slate-400 transition-colors">{tool.description}</p>
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-12 pt-8 border-t border-slate-800 text-center">
		<p class="text-xs text-slate-600">Alle Tools laufen clientseitig im Browser. Keine API-Calls, keine Datenweitergabe.</p>
	</div>
</div>
