<!-- SPDX-License-Identifier: AGPL-3.0-only
     Copyright (C) 2026 Markus Ketterer -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { consent, consentOpen, consentActions } from '$lib/consent';

	let announcement = $state('');

	function choose(value: 'analytics' | 'none') {
		consentActions.choose(value);
		announcement = value === 'analytics' ? $t('cookie').savedAccepted : $t('cookie').savedDeclined;
		// Der Hinweis verschwindet — Fokus auf den Einstieg zum erneuten Öffnen, statt ihn zu verlieren
		queueMicrotask(() => document.getElementById('cookie-settings-button')?.focus());
	}
</script>

{#if $consentOpen}
	<div
		role="region"
		aria-labelledby="cookie-notice-title"
		class="fixed z-30 bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-xl shadow-black/30"
	>
		<h2 id="cookie-notice-title" class="text-sm font-semibold text-slate-100 mb-1">{$t('cookie').title}</h2>
		<p class="text-xs text-slate-300 mb-3">
			{$t('cookie').text}
			<a href="/impressum#datenschutz" class="text-amber-400 hover:text-amber-300 underline">{$t('cookie').more}</a>
		</p>
		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => choose('analytics')}
				class="flex-1 text-xs px-3 py-2 rounded-lg bg-violet-700 text-white hover:bg-violet-600 transition-colors"
			>{$t('cookie').accept}</button>
			<button
				type="button"
				onclick={() => choose('none')}
				class="flex-1 text-xs px-3 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white transition-colors"
			>{$t('cookie').decline}</button>
		</div>
		{#if $consent !== 'unset'}
			<p class="text-xs text-slate-300 mt-2">
				{$consent === 'analytics' ? $t('cookie').currentAccepted : $t('cookie').currentDeclined}
			</p>
		{/if}
	</div>
{/if}

<p class="sr-only" aria-live="polite">{announcement}</p>
