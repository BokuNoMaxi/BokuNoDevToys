<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { categories } from '$lib/tools/config';
	import { lang, t } from '$lib/i18n';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	let sidebarOpen = $state(false);

	onMount(() => lang.init());

	function currentTool() {
		return $page.params.tool ?? '';
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>BokuNoDevToys</title>
</svelte:head>

<div class="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
	{#if sidebarOpen}
		<div class="fixed inset-0 z-20 bg-black/60 lg:hidden" role="button" tabindex="0"
			onclick={() => sidebarOpen = false}
			onkeydown={(e) => e.key === 'Enter' && (sidebarOpen = false)}
		></div>
	{/if}

	<aside class="
		fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 flex flex-col
		transform transition-transform duration-200 ease-in-out
		{sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
	">
		<div class="px-5 py-5 border-b border-slate-800">
			<a href="/" class="flex items-center gap-2.5">
				<div class="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">B</div>
				<span class="font-semibold text-slate-100">BokuNoDevToys</span>
			</a>
		</div>

		<nav class="flex-1 overflow-y-auto py-4 px-3">
			{#each categories as category}
				<div class="mb-5">
					<div class="px-3 mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
						{$t('cats')[category.key]}
					</div>
					{#each category.tools as tool}
						<a
							href="/tools/{tool.id}"
							onclick={() => sidebarOpen = false}
							class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5
								{currentTool() === tool.id
									? 'bg-violet-600/20 text-violet-400 font-medium'
									: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
						>
							{($t('tools') as Record<string, {name: string} | undefined>)[tool.id]?.name ?? tool.id}
						</a>
					{/each}
				</div>
			{/each}
		</nav>

		<div class="px-5 py-4 border-t border-slate-800 flex items-center justify-between">
			<p class="text-xs text-slate-600">BokuNoDevToys</p>
			<div class="flex gap-1">
				<button
					onclick={() => lang.set('en')}
					class="text-xs px-2 py-1 rounded transition-colors {$lang === 'en' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'}"
				>EN</button>
				<button
					onclick={() => lang.set('de')}
					class="text-xs px-2 py-1 rounded transition-colors {$lang === 'de' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'}"
				>DE</button>
			</div>
		</div>
	</aside>

	<div class="flex-1 flex flex-col min-w-0">
		<header class="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900">
			<button onclick={() => sidebarOpen = !sidebarOpen} class="text-slate-400 hover:text-slate-200" aria-label="Toggle menu">
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
				</svg>
			</button>
			<span class="font-semibold text-slate-100">BokuNoDevToys</span>
			<div class="ml-auto flex gap-1">
				<button onclick={() => lang.set('en')} class="text-xs px-2 py-1 rounded transition-colors {$lang === 'en' ? 'bg-violet-600 text-white' : 'text-slate-500'}">EN</button>
				<button onclick={() => lang.set('de')} class="text-xs px-2 py-1 rounded transition-colors {$lang === 'de' ? 'bg-violet-600 text-white' : 'text-slate-500'}">DE</button>
			</div>
		</header>

		<main class="flex-1 overflow-y-auto p-6 lg:p-8">
			{@render children()}
		</main>
	</div>
</div>
