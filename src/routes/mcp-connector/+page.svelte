<!-- SPDX-License-Identifier: AGPL-3.0-only
     Copyright (C) 2026 Markus Ketterer -->
<script lang="ts">
	import { t } from '$lib/i18n';

	const CONNECTOR_URL = 'https://devtoys.bokunocompany.at/mcp';
	const CLAUDE_CODE_CMD = `claude mcp add --transport http --scope user devtoys ${CONNECTOR_URL}`;
	const CONFIG_JSON = JSON.stringify({ mcpServers: { devtoys: { type: 'http', url: CONNECTOR_URL } } }, null, 2);
	const SELF_HOST_CMD = 'docker compose up -d --build mcp';
	const VERIFY_CMD = `curl -s -X POST ${CONNECTOR_URL} \\
  -H 'content-type: application/json' \\
  -H 'accept: application/json, text/event-stream' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;

	let copiedKey = $state<string | null>(null);

	async function copy(key: string, value: string) {
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			return;
		}
		copiedKey = key;
		setTimeout(() => { if (copiedKey === key) copiedKey = null; }, 2000);
	}
</script>

<svelte:head>
	<title>{$t('mcpDocs').title} | BokuNoDevToys</title>
	<meta name="description" content={$t('mcpDocs').description} />
</svelte:head>

{#snippet codeBlock(key: string, code: string, ariaLabel: string)}
	<div class="relative bg-slate-900 border border-slate-700 rounded-lg">
		<pre class="p-4 pr-24 whitespace-pre-wrap break-all text-sm text-violet-300 font-mono"><code>{code}</code></pre>
		<button
			type="button"
			onclick={() => copy(key, code)}
			aria-label={ariaLabel}
			class="absolute top-2 right-2 text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white transition-colors"
		>{copiedKey === key ? $t('mcpDocs').copied : $t('mcpDocs').copy}</button>
	</div>
{/snippet}

<div class="max-w-3xl mx-auto">
	<h1 class="text-3xl font-bold text-slate-300 mb-4">{$t('mcpDocs').title}</h1>
	<p class="text-slate-300 mb-8">{$t('mcpDocs').intro}</p>

	<section class="mb-10" aria-labelledby="mcp-url-heading">
		<h2 id="mcp-url-heading" class="text-xl font-semibold text-violet-300 mb-3">{$t('mcpDocs').urlLabel}</h2>
		{@render codeBlock('url', CONNECTOR_URL, $t('mcpDocs').copyUrlAria)}
	</section>

	<section class="mb-10" aria-labelledby="mcp-connect-heading">
		<h2 id="mcp-connect-heading" class="text-xl font-semibold text-violet-300 mb-4">{$t('mcpDocs').connectTitle}</h2>

		<h3 class="text-lg font-semibold text-slate-300 mb-2">{$t('mcpDocs').chatTitle}</h3>
		<ol class="list-decimal pl-6 space-y-1 text-slate-300 mb-3">
			{#each $t('mcpDocs').chatSteps as step}
				<li>{step}</li>
			{/each}
		</ol>
		<p class="text-sm text-slate-300 mb-6">{$t('mcpDocs').chatNote}</p>

		<h3 class="text-lg font-semibold text-slate-300 mb-2">{$t('mcpDocs').codeTitle}</h3>
		<p class="text-slate-300 mb-2">{$t('mcpDocs').codeText}</p>
		<div class="mb-6">{@render codeBlock('cc', CLAUDE_CODE_CMD, $t('mcpDocs').copyCommandAria)}</div>

		<h3 class="text-lg font-semibold text-slate-300 mb-2">{$t('mcpDocs').otherTitle}</h3>
		<p class="text-slate-300 mb-2">{$t('mcpDocs').otherText}</p>
		{@render codeBlock('json', CONFIG_JSON, $t('mcpDocs').copyConfigAria)}
	</section>

	<section class="mb-10" aria-labelledby="mcp-tools-heading">
		<h2 id="mcp-tools-heading" class="text-xl font-semibold text-violet-300 mb-3">{$t('mcpDocs').toolsTitle}</h2>
		<div class="overflow-x-auto bg-slate-800 rounded-xl">
			<table class="w-full text-sm text-left">
				<caption class="sr-only">{$t('mcpDocs').toolsCaption}</caption>
				<thead>
					<tr class="border-b border-slate-700 text-slate-300">
						<th scope="col" class="px-4 py-3 font-semibold">{$t('mcpDocs').toolName}</th>
						<th scope="col" class="px-4 py-3 font-semibold">{$t('mcpDocs').toolDesc}</th>
					</tr>
				</thead>
				<tbody>
					{#each $t('mcpDocs').tools as tool}
						<tr class="border-b border-slate-700 last:border-0">
							<th scope="row" class="px-4 py-2 font-mono font-normal text-violet-300 whitespace-nowrap">{tool.name}</th>
							<td class="px-4 py-2 text-slate-300">{tool.desc}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="mb-10" aria-labelledby="mcp-notes-heading">
		<h2 id="mcp-notes-heading" class="text-xl font-semibold text-violet-300 mb-3">{$t('mcpDocs').notesTitle}</h2>
		<ul class="list-disc pl-6 space-y-1 text-slate-300">
			{#each $t('mcpDocs').notes as note}
				<li>{note}</li>
			{/each}
		</ul>
	</section>

	<section class="mb-10" aria-labelledby="mcp-verify-heading">
		<h2 id="mcp-verify-heading" class="text-xl font-semibold text-violet-300 mb-3">{$t('mcpDocs').verifyTitle}</h2>
		<p class="text-slate-300 mb-2">{$t('mcpDocs').verifyText}</p>
		{@render codeBlock('verify', VERIFY_CMD, $t('mcpDocs').copyCommandAria)}
	</section>

	<section class="mb-8" aria-labelledby="mcp-selfhost-heading">
		<h2 id="mcp-selfhost-heading" class="text-xl font-semibold text-violet-300 mb-3">{$t('mcpDocs').selfHostTitle}</h2>
		<p class="text-slate-300 mb-2">{$t('mcpDocs').selfHostText}</p>
		<div class="mb-3">{@render codeBlock('self', SELF_HOST_CMD, $t('mcpDocs').copyCommandAria)}</div>
		<p>
			<a href="https://github.com/BokuNoMaxi/BokuNoDevToys/tree/main/mcp-server" target="_blank" rel="noopener noreferrer" class="text-violet-300 hover:text-white underline">
				{$t('mcpDocs').selfHostLink}
			</a>
		</p>
	</section>

	<p class="sr-only" aria-live="polite">{copiedKey ? $t('mcpDocs').copied : ''}</p>
</div>
