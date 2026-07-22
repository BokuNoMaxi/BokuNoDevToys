<script lang="ts">
	import { page } from '$app/stores';
	import { findTool } from '$lib/tools/config';
	import { t } from '$lib/i18n';
	import { favorites } from '$lib/favorites';
	import DateTimeConverter from '$lib/tools/DateTimeConverter.svelte';
	import TextGenerator from '$lib/tools/TextGenerator.svelte';
	import HtpasswdGenerator from '$lib/tools/HtpasswdGenerator.svelte';
	import Base64Encoder from '$lib/tools/Base64Encoder.svelte';
	import MySQLExportImport from '$lib/tools/MySQLExportImport.svelte';
	import JsonFormatter from '$lib/tools/JsonFormatter.svelte';
	import HtmlViewer from '$lib/tools/HtmlViewer.svelte';
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
	import IpInfo from '$lib/tools/IpInfo.svelte';
	import CsvViewer from '$lib/tools/CsvViewer.svelte';
	import SqlFormatter from '$lib/tools/SqlFormatter.svelte';
	import ColorConverter from '$lib/tools/ColorConverter.svelte';
	import XmlToYaml from '$lib/tools/XmlToYaml.svelte';
	import MarkdownViewer from '$lib/tools/MarkdownViewer.svelte';
	import PasswordGenerator from '$lib/tools/PasswordGenerator.svelte';
	import CurlToCode from '$lib/tools/CurlToCode.svelte';
	import FaviconGenerator from '$lib/tools/FaviconGenerator.svelte';
	import QrCodeGenerator from '$lib/tools/QrCodeGenerator.svelte';
	import ColorContrastChecker from '$lib/tools/ColorContrastChecker.svelte';
	import AspectRatioCalculator from '$lib/tools/AspectRatioCalculator.svelte';
	import BorderRadiusGenerator from '$lib/tools/BorderRadiusGenerator.svelte';
	import CssGridGenerator from '$lib/tools/CssGridGenerator.svelte';
	import CssFlexGenerator from '$lib/tools/CssFlexGenerator.svelte';
	import SchemaAnalyzer from '$lib/tools/SchemaAnalyzer.svelte';
	import SvgViewer from '$lib/tools/SvgViewer.svelte';
	import BoxShadowGenerator from '$lib/tools/BoxShadowGenerator.svelte';
	import GradientGenerator from '$lib/tools/GradientGenerator.svelte';
	import UnitConverter from '$lib/tools/UnitConverter.svelte';
	import ColorPaletteGenerator from '$lib/tools/ColorPaletteGenerator.svelte';
	import GlassmorphismGenerator from '$lib/tools/GlassmorphismGenerator.svelte';
	import ClipPathGenerator from '$lib/tools/ClipPathGenerator.svelte';
	import SeoScoreAnalyzer from '$lib/tools/SeoScoreAnalyzer.svelte';
	import SerpPreview from '$lib/tools/SerpPreview.svelte';
	import SocialCardPreview from '$lib/tools/SocialCardPreview.svelte';
	import RobotsSitemapValidator from '$lib/tools/RobotsSitemapValidator.svelte';
	import KeywordDensityAnalyzer from '$lib/tools/KeywordDensityAnalyzer.svelte';

	let toolId = $derived($page.params.tool ?? '');
	let toolMeta = $derived(findTool(toolId));
	let toolTrans = $derived($t('tools')[toolId as keyof ReturnType<typeof $t>['tools']]);

	const SITE = 'https://devtoys.bokunocompany.at';
	let pageTitle = $derived(toolTrans ? `${toolTrans.name} — BokuNoDevToys` : 'BokuNoDevToys');
	let pageDesc = $derived(toolTrans?.description ?? '');
	let canonical = $derived(`${SITE}/tools/${toolId}`);

	// Refresh the favorites cookie's lifetime on every tool visit, so favorites
	// only get lost through an explicit cookie clear, not inactivity.
	$effect(() => {
		toolId;
		favorites.touch();
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
	{#if toolTrans}
		<meta name="description" content={pageDesc} />
		<link rel="canonical" href={canonical} />
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="BokuNoDevToys" />
		<meta property="og:title" content={pageTitle} />
		<meta property="og:description" content={pageDesc} />
		<meta property="og:url" content={canonical} />
		<meta name="twitter:card" content="summary" />
		<meta name="twitter:title" content={pageTitle} />
		<meta name="twitter:description" content={pageDesc} />
	{:else}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

{#if toolMeta}
	<div class="max-w-4xl mx-auto">
		<div class="mb-6 flex items-start justify-between gap-3">
			<div>
				<h1 class="text-2xl font-bold text-slate-100">{toolTrans?.name ?? toolId}</h1>
				<p class="text-slate-500 mt-1 text-sm">{toolTrans?.description ?? ''}</p>
			</div>
			<button
				onclick={() => favorites.toggle(toolId)}
				aria-pressed={$favorites.has(toolId)}
				aria-label={$favorites.has(toolId) ? $t('nav').removeFavorite : $t('nav').addFavorite}
				class="shrink-0 text-2xl leading-none transition-colors
					{$favorites.has(toolId) ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}"
			>{$favorites.has(toolId) ? '★' : '☆'}</button>
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
		{:else if toolId === 'html-viewer'}
			<HtmlViewer />
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
		{:else if toolId === 'ip-info'}
			<IpInfo />
		{:else if toolId === 'csv-viewer'}
			<CsvViewer />
		{:else if toolId === 'sql-formatter'}
			<SqlFormatter />
		{:else if toolId === 'color-converter'}
			<ColorConverter />
		{:else if toolId === 'xml-to-yaml'}
			<XmlToYaml />
		{:else if toolId === 'markdown-viewer'}
			<MarkdownViewer />
		{:else if toolId === 'password-generator'}
			<PasswordGenerator />
		{:else if toolId === 'curl-to-code'}
			<CurlToCode />
		{:else if toolId === 'favicon-generator'}
			<FaviconGenerator />
		{:else if toolId === 'qr-code-generator'}
			<QrCodeGenerator />
		{:else if toolId === 'color-contrast-checker'}
			<ColorContrastChecker />
		{:else if toolId === 'aspect-ratio-calculator'}
			<AspectRatioCalculator />
		{:else if toolId === 'border-radius-generator'}
			<BorderRadiusGenerator />
		{:else if toolId === 'css-grid-generator'}
			<CssGridGenerator />
		{:else if toolId === 'css-flex-generator'}
			<CssFlexGenerator />
		{:else if toolId === 'schema-analyzer'}
			<SchemaAnalyzer />
		{:else if toolId === 'svg-viewer'}
			<SvgViewer />
		{:else if toolId === 'box-shadow-generator'}
			<BoxShadowGenerator />
		{:else if toolId === 'gradient-generator'}
			<GradientGenerator />
		{:else if toolId === 'unit-converter'}
			<UnitConverter />
		{:else if toolId === 'color-palette-generator'}
			<ColorPaletteGenerator />
		{:else if toolId === 'glassmorphism-generator'}
			<GlassmorphismGenerator />
		{:else if toolId === 'clip-path-generator'}
			<ClipPathGenerator />
		{:else if toolId === 'seo-score-analyzer'}
			<SeoScoreAnalyzer />
		{:else if toolId === 'serp-preview'}
			<SerpPreview />
		{:else if toolId === 'social-card-preview'}
			<SocialCardPreview />
		{:else if toolId === 'robots-sitemap-validator'}
			<RobotsSitemapValidator />
		{:else if toolId === 'keyword-density-analyzer'}
			<KeywordDensityAnalyzer />
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
