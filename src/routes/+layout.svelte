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

	<aside id="sidebar" aria-label="Navigation" class="
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

		<nav class="flex-1 overflow-y-auto py-4 px-3" aria-label="Tools">
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
			<div class="flex items-center gap-3">
				<a href="https://bokunocompany.at" target="_blank" rel="noopener noreferrer" class="text-slate-600 hover:text-slate-300 transition-colors" aria-label="bokunocompany.at">
					<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
					</svg>
				</a>
				<a href="https://github.com/BokuNoMaxi" target="_blank" rel="noopener noreferrer" class="text-slate-600 hover:text-slate-300 transition-colors" aria-label="GitHub">
					<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
					</svg>
				</a>
			</div>
			<div class="flex gap-1" role="group" aria-label="Language">
				<button
					onclick={() => lang.set('en')}
					aria-pressed={$lang === 'en'}
					aria-label="English"
					class="text-xs px-2 py-1 rounded transition-colors {$lang === 'en' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'}"
				>EN</button>
				<button
					onclick={() => lang.set('de')}
					aria-pressed={$lang === 'de'}
					aria-label="Deutsch"
					class="text-xs px-2 py-1 rounded transition-colors {$lang === 'de' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'}"
				>DE</button>
			</div>
		</div>
		<p class="px-5 pb-4 text-xs text-slate-700 text-center">BokuNoDevToys &copy; {new Date().getFullYear()}</p>
	</aside>

	<div class="flex-1 flex flex-col min-w-0">
		<header class="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900" aria-label="Mobile Navigation">
			<button
				onclick={() => sidebarOpen = !sidebarOpen}
				aria-expanded={sidebarOpen}
				aria-controls="sidebar"
				aria-label="Toggle menu"
				class="text-slate-400 hover:text-slate-200"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
				</svg>
			</button>
			<span class="font-semibold text-slate-100">BokuNoDevToys</span>
			<div class="ml-auto flex gap-1" role="group" aria-label="Language">
				<button onclick={() => lang.set('en')} aria-pressed={$lang === 'en'} aria-label="English" class="text-xs px-2 py-1 rounded transition-colors {$lang === 'en' ? 'bg-violet-600 text-white' : 'text-slate-500'}">EN</button>
				<button onclick={() => lang.set('de')} aria-pressed={$lang === 'de'} aria-label="Deutsch" class="text-xs px-2 py-1 rounded transition-colors {$lang === 'de' ? 'bg-violet-600 text-white' : 'text-slate-500'}">DE</button>
			</div>
		</header>

		<main class="flex-1 overflow-y-auto p-6 lg:p-8">
			{@render children()}
		</main>
	</div>
</div>
