<!-- SPDX-License-Identifier: AGPL-3.0-only
     Copyright (C) 2026 Markus Ketterer -->
<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<svelte:head>
	<title>{$t('impressum').title} | BokuNoDevToys</title>
	<meta name="description" content="{$t('impressum').description}" />
</svelte:head>

<div class="max-w-3xl mx-auto">
	<h1 class="text-3xl font-bold text-slate-300 mb-8">{$t('impressum').title}</h1>

	<section class="mb-8">
		<h2 class="text-xl font-semibold text-violet-300 mb-4">{$t('impressum').responsible}</h2>
		<p class="text-slate-300 mb-4">
			Markus Ketterer<br />
			<a href="https://www.bokunocompany.at" target="_blank" rel="noopener noreferrer" class="text-violet-400 hover:text-violet-300 underline">
				www.bokunocompany.at
			</a>
		</p>
	</section>

	<section class="mb-8">
		<h2 class="text-xl font-semibold text-violet-300 mb-4">{$t('impressum').sourceCode}</h2>
		<p class="text-slate-300 mb-4">
			<a href="https://github.com/BokuNoMaxi/BokuNoDevToys" target="_blank" rel="noopener noreferrer" class="text-violet-400 hover:text-violet-300 underline">
				{$t('impressum').sourceLinkText}
			</a>
		</p>
		<p class="text-slate-300 text-sm">
			BokuNoDevToys is released under the GNU Affero General Public License v3.0 (AGPL-3.0-only). If you operate this application as a network service, you must provide access to the source code to all users.
		</p>
	</section>

	<section class="mb-8">
		<h2 class="text-xl font-semibold text-violet-300 mb-4">{$t('impressum').liability}</h2>
		<p class="text-slate-300 text-sm">
			{$t('impressum').liabilityText}
		</p>
	</section>

	<section class="mb-8">
		<h2 class="text-xl font-semibold text-violet-300 mb-4">{$t('impressum').thirdParty}</h2>
		<p class="text-slate-300 text-sm">
			{$t('impressum').thirdPartyText}
		</p>
	</section>

	<section>
		<h2 class="text-xl font-semibold text-violet-300 mb-4">{$t('impressum').contact}</h2>
		<p class="text-slate-300 text-sm">
			{$t('impressum').contactText}
		</p>
	</section>
</div>
