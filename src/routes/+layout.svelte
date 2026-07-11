<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { categories } from '$lib/tools/config';
	import { lang, t } from '$lib/i18n';
	import favicon from '$lib/assets/favicon.svg';
	import logo from '$lib/assets/logo.svg';

	let { children } = $props();
	let sidebarOpen = $state(false);

	// Accordion state — persisted in cookie
	const COOKIE_KEY = 'sidebar_open_cats';
	function readCookie(): Set<string> {
		if (typeof document === 'undefined') return new Set(categories.map(c => c.key));
		const raw = document.cookie.split('; ').find(r => r.startsWith(COOKIE_KEY + '='));
		if (!raw) return new Set(categories.map(c => c.key));
		try { return new Set(JSON.parse(decodeURIComponent(raw.split('=')[1]))); }
		catch { return new Set(categories.map(c => c.key)); }
	}
	function writeCookie(open: Set<string>) {
		const val = encodeURIComponent(JSON.stringify([...open]));
		document.cookie = `${COOKIE_KEY}=${val};path=/;max-age=31536000;SameSite=Lax`;
	}

	let openCats = $state<Set<string>>(new Set(categories.map(c => c.key)));

	onMount(() => {
		lang.init();
		openCats = readCookie();
	});

	function toggleCat(key: string) {
		const next = new Set(openCats);
		if (next.has(key)) next.delete(key); else next.add(key);
		openCats = next;
		writeCookie(next);
	}

	function currentTool() {
		return $page.params.tool ?? '';
	}

	const catMeta: Record<string, { icon: string; color: string; border: string }> = {
		dateTime:  { icon: '📅', color: 'text-sky-400',     border: 'border-sky-500' },
		text:      { icon: '📝', color: 'text-emerald-400', border: 'border-emerald-500' },
		format:    { icon: '🔧', color: 'text-amber-400',   border: 'border-amber-500' },
		security:  { icon: '🔐', color: 'text-red-400',     border: 'border-red-500' },
		generator: { icon: '⚙️', color: 'text-violet-400',  border: 'border-violet-500' },
		analyzer:  { icon: '🔍', color: 'text-cyan-400',    border: 'border-cyan-500' },
		frontend:  { icon: '🖼️', color: 'text-pink-400',    border: 'border-pink-500' },
	};
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
			<a href="/" class="flex items-center">
				<img src={logo} alt="BokuNo DevToys" style="width:80%;height:auto;margin:auto;max-height:50px;" />
			</a>
		</div>

		<nav class="flex-1 overflow-y-auto py-2 px-2" aria-label="Tools">
			{#each categories as category}
				{@const isOpen = openCats.has(category.key)}
				{@const hasActive = category.tools.some(t => t.id === currentTool())}
				{@const meta = catMeta[category.key] ?? { icon: '•', color: 'text-slate-400', border: 'border-slate-500' }}
				<div class="mb-1">
					<!-- Category header -->
					<button
						onclick={() => toggleCat(category.key)}
						aria-expanded={isOpen}
						class="w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors group
							{hasActive ? 'bg-slate-800/60' : 'hover:bg-slate-800/40'}"
					>
						<span class="text-base leading-none">{meta.icon}</span>
						<span class="flex-1 text-left text-xs font-bold uppercase tracking-widest
							{hasActive ? meta.color : 'text-slate-400 group-hover:text-slate-200'}">
							{$t('cats')[category.key]}
						</span>
						<svg class="w-3 h-3 shrink-0 transition-transform duration-200 {isOpen ? 'rotate-180' : ''} text-slate-500 group-hover:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
						</svg>
					</button>

					<!-- Tool list -->
					{#if isOpen}
						<div class="ml-3 mt-0.5 mb-2 border-l-2 {hasActive ? meta.border : 'border-slate-700/60'} pl-2">
							{#each category.tools as tool}
								<a
									href="/tools/{tool.id}"
									onclick={() => sidebarOpen = false}
									class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors mb-0.5
										{currentTool() === tool.id
											? 'bg-violet-700/20 text-violet-300 font-medium'
											: 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'}"
								>
									{($t('tools') as Record<string, {name: string} | undefined>)[tool.id]?.name ?? tool.id}
								</a>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</nav>

		<div class="px-5 py-4 border-t border-slate-800 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<a href="https://bokunocompany.at" target="_blank" rel="noopener noreferrer" class="text-slate-300 hover:text-slate-100 transition-colors" aria-label="bokunocompany.at">
					<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
					</svg>
				</a>
				<a href="https://github.com/BokuNoMaxi" target="_blank" rel="noopener noreferrer" class="text-slate-300 hover:text-slate-100 transition-colors" aria-label="GitHub">
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
					class="text-xs px-2 py-1 rounded transition-colors {$lang === 'en' ? 'bg-violet-700 text-white' : 'text-slate-300 hover:text-slate-100'}"
				>EN</button>
				<button
					onclick={() => lang.set('de')}
					aria-pressed={$lang === 'de'}
					aria-label="Deutsch"
					class="text-xs px-2 py-1 rounded transition-colors {$lang === 'de' ? 'bg-violet-700 text-white' : 'text-slate-300 hover:text-slate-100'}"
				>DE</button>
			</div>
		</div>
		<p class="px-5 pb-4 text-xs text-slate-400 text-center">BokuNoDevToys &copy; {new Date().getFullYear()}</p>
	</aside>

	<div class="flex-1 flex flex-col min-w-0">
		<header class="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900" aria-label="Mobile Navigation">
			<button
				onclick={() => sidebarOpen = !sidebarOpen}
				aria-expanded={sidebarOpen}
				aria-controls="sidebar"
				aria-label="Toggle menu"
				class="text-slate-300 hover:text-slate-100"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
				</svg>
			</button>
			<img src={logo} alt="BokuNo DevToys" style="width:80%;height:auto;margin:auto;max-height:50px;" />
			<div class="ml-auto flex gap-1" role="group" aria-label="Language">
				<button onclick={() => lang.set('en')} aria-pressed={$lang === 'en'} aria-label="English" class="text-xs px-2 py-1 rounded transition-colors {$lang === 'en' ? 'bg-violet-700 text-white' : 'text-slate-300'}">EN</button>
				<button onclick={() => lang.set('de')} aria-pressed={$lang === 'de'} aria-label="Deutsch" class="text-xs px-2 py-1 rounded transition-colors {$lang === 'de' ? 'bg-violet-700 text-white' : 'text-slate-300'}">DE</button>
			</div>
		</header>

		<main class="flex-1 overflow-y-auto p-6 lg:p-8">
			{@render children()}
		</main>
	</div>
</div>
