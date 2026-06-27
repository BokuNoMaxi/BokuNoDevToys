<script lang="ts">
	import { page } from '$app/stores';
	import { findTool } from '$lib/tools/config';
	import { t } from '$lib/i18n';
	import DateTimeConverter from '$lib/tools/DateTimeConverter.svelte';
	import TextGenerator from '$lib/tools/TextGenerator.svelte';
	import HtpasswdGenerator from '$lib/tools/HtpasswdGenerator.svelte';
	import Base64Encoder from '$lib/tools/Base64Encoder.svelte';
	import MySQLExportImport from '$lib/tools/MySQLExportImport.svelte';
	import JsonFormatter from '$lib/tools/JsonFormatter.svelte';
	import VarDumpFormatter from '$lib/tools/VarDumpFormatter.svelte';
	import TimezoneConverter from '$lib/tools/TimezoneConverter.svelte';
	import DateCalculator from '$lib/tools/DateCalculator.svelte';
	import TextPrettier from '$lib/tools/TextPrettier.svelte';

	let toolId = $derived($page.params.tool ?? '');
	let toolMeta = $derived(findTool(toolId));
	let toolTrans = $derived($t('tools')[toolId as keyof ReturnType<typeof $t>['tools']]);
</script>

<svelte:head>
	<title>{toolTrans ? `${toolTrans.name} — BokuNoDevToys` : 'BokuNoDevToys'}</title>
</svelte:head>

{#if toolMeta}
	<div class="max-w-4xl mx-auto">
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-slate-100">{toolTrans?.name ?? toolId}</h1>
			<p class="text-slate-500 mt-1 text-sm">{toolTrans?.description ?? ''}</p>
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
		{:else if toolId === 'json-formatter'}
			<JsonFormatter />
		{:else if toolId === 'vardump-formatter'}
			<VarDumpFormatter />
		{:else if toolId === 'timezone-converter'}
			<TimezoneConverter />
		{:else if toolId === 'date-calculator'}
			<DateCalculator />
		{:else if toolId === 'text-prettier'}
			<TextPrettier />
		{/if}
	</div>
{:else}
	<div class="max-w-4xl mx-auto flex items-center justify-center h-64">
		<div class="text-center">
			<p class="text-slate-500 text-lg">{$t('nav').notFound}</p>
			<a href="/tools/datetime" class="mt-3 inline-block text-violet-400 hover:text-violet-300 text-sm">{$t('nav').goToDatetime}</a>
		</div>
	</div>
{/if}
