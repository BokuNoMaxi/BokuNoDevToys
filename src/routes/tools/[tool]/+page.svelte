<script lang="ts">
	import { page } from '$app/stores';
	import { findTool } from '$lib/tools/config';
	import DateTimeConverter from '$lib/tools/DateTimeConverter.svelte';
	import TextGenerator from '$lib/tools/TextGenerator.svelte';
	import HtpasswdGenerator from '$lib/tools/HtpasswdGenerator.svelte';
	import Base64Encoder from '$lib/tools/Base64Encoder.svelte';
	import MySQLExportImport from '$lib/tools/MySQLExportImport.svelte';
	import HttpClient from '$lib/tools/HttpClient.svelte';
	import JsonFormatter from '$lib/tools/JsonFormatter.svelte';
	import VarDumpFormatter from '$lib/tools/VarDumpFormatter.svelte';

	let toolId = $derived($page.params.tool);
	let toolMeta = $derived(findTool(toolId));
</script>

<svelte:head>
	<title>{toolMeta ? `${toolMeta.name} — BokuNoDevToys` : 'BokuNoDevToys'}</title>
</svelte:head>

{#if toolMeta}
	<div class="max-w-4xl mx-auto">
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-slate-100">{toolMeta.name}</h1>
			<p class="text-slate-500 mt-1 text-sm">{toolMeta.description}</p>
		</div>

		{#if toolId === 'datetime'}
			<DateTimeConverter />
		{:else if toolId === 'text-generator'}
			<TextGenerator />
		{:else if toolId === 'htpasswd'}
			<HtpasswdGenerator />
		{:else if toolId === 'base64'}
			<Base64Encoder />
		{:else if toolId === 'mysql-export-import'}
			<MySQLExportImport />
		{:else if toolId === 'http-client'}
			<HttpClient />
		{:else if toolId === 'json-formatter'}
			<JsonFormatter />
		{:else if toolId === 'vardump-formatter'}
			<VarDumpFormatter />
		{/if}
	</div>
{:else}
	<div class="max-w-4xl mx-auto flex items-center justify-center h-64">
		<div class="text-center">
			<p class="text-slate-500 text-lg">Tool nicht gefunden</p>
			<a href="/tools/datetime" class="mt-3 inline-block text-violet-400 hover:text-violet-300 text-sm">Zum DateTime Converter</a>
		</div>
	</div>
{/if}
