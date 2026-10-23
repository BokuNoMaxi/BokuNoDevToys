<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { t } from '$lib/i18n';
	import { dateToTimestamp, timestampToDate, formatLocal } from '$lib/core/datetime';

	let now = $state(new Date());
	let interval: ReturnType<typeof setInterval>;

	let dateInput = $state('');
	let tsInput = $state('');
	let dateToTs = $state('');
	let tsToDate = $state('');
	let dateError = $state('');
	let tsError = $state('');

	onMount(() => { interval = setInterval(() => { now = new Date(); }, 1000); });
	onDestroy(() => clearInterval(interval));

	function convertDateToTs() {
		dateError = '';
		dateToTs = '';
		const ts = dateToTimestamp(dateInput);
		if (ts === null) { dateError = $t('datetime').invalidDate; return; }
		dateToTs = ts;
	}

	function convertTsToDate() {
		tsError = '';
		tsToDate = '';
		const res = timestampToDate(tsInput);
		if (res === null) { tsError = $t('datetime').invalidTs; return; }
		tsToDate = res;
	}

	function copy(text: string) { navigator.clipboard.writeText(text); }
</script>

<div class="space-y-8">
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">{$t('datetime').currentTime}</h2>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div class="bg-slate-900 rounded-lg p-4">
				<div class="text-xs text-slate-300 mb-1">{$t('datetime').unixTimestamp}</div>
				<div class="text-xl font-mono text-violet-300">{Math.floor(now.getTime()/1000)}</div>
			</div>
			<div class="bg-slate-900 rounded-lg p-4">
				<div class="text-xs text-slate-300 mb-1">{$t('datetime').localTime}</div>
				<div class="text-xl font-mono text-emerald-400">{formatLocal(now)}</div>
			</div>
			<div class="bg-slate-900 rounded-lg p-4">
				<div class="text-xs text-slate-300 mb-1">UTC</div>
				<div class="text-xl font-mono text-sky-400">{now.toUTCString()}</div>
			</div>
		</div>
	</div>

	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4" id="dtc-date-label">{$t('datetime').dateToTs}</h2>
		<div class="flex gap-3">
			<input type="datetime-local" bind:value={dateInput}
				aria-labelledby="dtc-date-label"
				class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono" />
			<button onclick={convertDateToTs} class="px-5 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-lg font-medium transition-colors">
				{$t('datetime').convert}
			</button>
		</div>
		{#if dateError}<p class="mt-2 text-red-300 text-sm" role="alert">{dateError}</p>{/if}
		{#if dateToTs}
			<div class="mt-3 flex items-center gap-3 bg-slate-900 rounded-lg px-4 py-3">
				<span class="font-mono text-violet-300 text-lg flex-1">{dateToTs}</span>
				<button onclick={() => copy(dateToTs)} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{$t('datetime').copy}</button>
			</div>
		{/if}
	</div>

	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4" id="dtc-ts-label">{$t('datetime').tsToDate}</h2>
		<div class="flex gap-3">
			<input type="text" bind:value={tsInput} placeholder={$t('datetime').placeholder}
				aria-labelledby="dtc-ts-label"
				class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 font-mono" />
			<button onclick={convertTsToDate} class="px-5 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-lg font-medium transition-colors">
				{$t('datetime').convert}
			</button>
		</div>
		{#if tsError}<p class="mt-2 text-red-300 text-sm" role="alert">{tsError}</p>{/if}
		{#if tsToDate}
			<div class="mt-3 bg-slate-900 rounded-lg px-4 py-3">
				<pre class="font-mono text-emerald-400 text-sm whitespace-pre">{tsToDate}</pre>
			</div>
		{/if}
	</div>
</div>
