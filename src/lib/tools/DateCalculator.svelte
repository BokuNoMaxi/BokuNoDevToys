<script lang="ts">
	import { t } from '$lib/i18n';

	let baseDate = $state(new Date().toISOString().slice(0, 10));
	let baseTime = $state(new Date().toTimeString().slice(0, 5));
	let operation = $state<'add' | 'sub'>('add');

	let years = $state(0);
	let months = $state(0);
	let days = $state(0);
	let hours = $state(0);
	let minutes = $state(0);
	let seconds = $state(0);

	let result = $state('');
	let diffResult = $state('');
	let error = $state('');

	let dateA = $state(new Date().toISOString().slice(0, 10));
	let timeA = $state('12:00');
	let dateB = $state(new Date().toISOString().slice(0, 10));
	let timeB = $state('12:00');

	function pad(n: number) { return String(Math.floor(Math.abs(n))).padStart(2, '0'); }

	function calculate() {
		const dc = $t('dateCalc');
		error = '';
		result = '';
		if (!baseDate) { error = dc.enterDate; return; }
		try {
			const d = new Date(`${baseDate}T${baseTime || '00:00'}:00`);
			if (isNaN(d.getTime())) { error = dc.invalidDate; return; }
			const sign = operation === 'add' ? 1 : -1;
			d.setFullYear(d.getFullYear() + sign * years);
			d.setMonth(d.getMonth() + sign * months);
			d.setDate(d.getDate() + sign * days);
			d.setHours(d.getHours() + sign * hours);
			d.setMinutes(d.getMinutes() + sign * minutes);
			d.setSeconds(d.getSeconds() + sign * seconds);
			const fmt = (n: number) => String(n).padStart(2, '0');
			result = `${d.getFullYear()}-${fmt(d.getMonth()+1)}-${fmt(d.getDate())} ${fmt(d.getHours())}:${fmt(d.getMinutes())}:${fmt(d.getSeconds())}`;
		} catch (e) {
			error = `${dc.error}: ${(e as Error).message}`;
		}
	}

	function calculateDiff() {
		const dc = $t('dateCalc');
		diffResult = '';
		try {
			const a = new Date(`${dateA}T${timeA || '00:00'}:00`);
			const b = new Date(`${dateB}T${timeB || '00:00'}:00`);
			if (isNaN(a.getTime()) || isNaN(b.getTime())) { diffResult = dc.invalidDates; return; }

			const ms = Math.abs(b.getTime() - a.getTime());
			const totalSeconds = Math.floor(ms / 1000);
			const totalMinutes = Math.floor(totalSeconds / 60);
			const totalHours = Math.floor(totalMinutes / 60);
			const totalDays = Math.floor(totalHours / 24);
			const secs = totalSeconds % 60;
			const mins = totalMinutes % 60;
			const hrs = totalHours % 24;
			const approxYears = Math.floor(totalDays / 365);
			const approxMonths = Math.floor((totalDays % 365) / 30);
			const remDays = totalDays % 365 % 30;
			const direction = b >= a ? dc.bAfterA : dc.aAfterB;

			diffResult = [
				direction,
				'',
				`${dc.total}: ${totalDays} ${dc.daysUnit} / ${totalHours} ${dc.hoursUnit} / ${totalMinutes} ${dc.minutesUnit} / ${totalSeconds} ${dc.secondsUnit}`,
				'',
				`${dc.breakdown}: ${approxYears} y, ${approxMonths} m, ${remDays} d, ${pad(hrs)} h, ${pad(mins)} min, ${pad(secs)} s`,
			].join('\n');
		} catch (e) {
			diffResult = `${$t('dateCalc').error}: ${(e as Error).message}`;
		}
	}

	function copy(text: string) { navigator.clipboard.writeText(text); }
</script>

<div class="space-y-8">
	<div class="bg-slate-800 rounded-xl p-6 space-y-5">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">{$t('dateCalc').calcTitle}</h2>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-xs text-slate-500 mb-1.5" for="dc-date">{$t('dateCalc').startDate}</label>
				<input id="dc-date" type="date" bind:value={baseDate}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono" />
			</div>
			<div>
				<label class="block text-xs text-slate-500 mb-1.5" for="dc-time">{$t('dateCalc').startTime}</label>
				<input id="dc-time" type="time" bind:value={baseTime}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono" />
			</div>
		</div>

		<div class="flex gap-3">
			<button onclick={() => operation = 'add'}
				class="flex-1 py-2 rounded-lg font-medium transition-colors {operation === 'add' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'}">
				{$t('dateCalc').add}
			</button>
			<button onclick={() => operation = 'sub'}
				class="flex-1 py-2 rounded-lg font-medium transition-colors {operation === 'sub' ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'}">
				{$t('dateCalc').subtract}
			</button>
		</div>

		<div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
			{#each [
				{ labelKey: 'years' as const, val: years, set: (v: number) => years = v },
				{ labelKey: 'months' as const, val: months, set: (v: number) => months = v },
				{ labelKey: 'days' as const, val: days, set: (v: number) => days = v },
				{ labelKey: 'hours' as const, val: hours, set: (v: number) => hours = v },
				{ labelKey: 'minutes' as const, val: minutes, set: (v: number) => minutes = v },
				{ labelKey: 'seconds' as const, val: seconds, set: (v: number) => seconds = v },
			] as field}
				<div>
					<label class="block text-xs text-slate-500 mb-1.5">{$t('dateCalc')[field.labelKey]}</label>
					<input type="number" min="0" value={field.val}
						oninput={(e) => field.set(parseInt((e.target as HTMLInputElement).value) || 0)}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono text-center" />
				</div>
			{/each}
		</div>

		<button onclick={calculate} class="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors">
			{$t('dateCalc').calculate}
		</button>

		{#if error}<p class="text-red-400 text-sm">{error}</p>{/if}
		{#if result}
			<div class="flex items-center gap-3 bg-slate-900 rounded-lg px-4 py-3">
				<span class="font-mono text-emerald-400 text-lg flex-1">{result}</span>
				<button onclick={() => copy(result)} class="text-xs text-slate-500 hover:text-slate-300 transition-colors">{$t('dateCalc').copy}</button>
			</div>
		{/if}
	</div>

	<div class="bg-slate-800 rounded-xl p-6 space-y-5">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">{$t('dateCalc').diffTitle}</h2>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
			<div class="space-y-3">
				<p class="text-xs text-slate-500 font-medium uppercase">{$t('dateCalc').dateA}</p>
				<input type="date" bind:value={dateA}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono" />
				<input type="time" bind:value={timeA}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono" />
			</div>
			<div class="space-y-3">
				<p class="text-xs text-slate-500 font-medium uppercase">{$t('dateCalc').dateB}</p>
				<input type="date" bind:value={dateB}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono" />
				<input type="time" bind:value={timeB}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono" />
			</div>
		</div>

		<button onclick={calculateDiff} class="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors">
			{$t('dateCalc').calcDiff}
		</button>

		{#if diffResult}
			<div class="bg-slate-900 rounded-lg px-4 py-3">
				<pre class="font-mono text-sky-400 text-sm whitespace-pre">{diffResult}</pre>
			</div>
		{/if}
	</div>
</div>
