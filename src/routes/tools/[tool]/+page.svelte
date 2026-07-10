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
	import RandomInt from '$lib/tools/RandomInt.svelte';
	import RandomValue from '$lib/tools/RandomValue.svelte';
	import ErrorLogAnalyzer from '$lib/tools/ErrorLogAnalyzer.svelte';
	import AccessLogAnalyzer from '$lib/tools/AccessLogAnalyzer.svelte';
	import DiffViewer from '$lib/tools/DiffViewer.svelte';
	import RegexTester from '$lib/tools/RegexTester.svelte';
	import HashGenerator from '$lib/tools/HashGenerator.svelte';
	import CronBuilder from '$lib/tools/CronBuilder.svelte';
	import CorsChecker from '$lib/tools/CorsChecker.svelte';
	import IpInfo from '$lib/tools/IpInfo.svelte';
	import CsvViewer from '$lib/tools/CsvViewer.svelte';

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
		{:else if toolId === 'random-int'}
			<RandomInt />
		{:else if toolId === 'random-value'}
			<RandomValue />
		{:else if toolId === 'error-log'}
			<ErrorLogAnalyzer />
		{:else if toolId === 'access-log'}
			<AccessLogAnalyzer />
		{:else if toolId === 'diff-viewer'}
			<DiffViewer />
		{:else if toolId === 'regex-tester'}
			<RegexTester />
		{:else if toolId === 'hash-generator'}
			<HashGenerator />
		{:else if toolId === 'cron-builder'}
			<CronBuilder />
		{:else if toolId === 'cors-checker'}
			<CorsChecker />
		{:else if toolId === 'ip-info'}
			<IpInfo />
		{:else if toolId === 'csv-viewer'}
			<CsvViewer />
		{/if}
	</div>
{:else}
	<div class="max-w-4xl mx-auto flex items-center justify-center h-64">
		<div class="text-center">
			<p class="text-slate-500 text-lg">{$t('nav').notFound}</p>
			<a href="/tools/datetime" class="mt-3 inline-block text-violet-300 hover:text-violet-300 text-sm">{$t('nav').goToDatetime}</a>
		</div>
	</div>
{/if}
