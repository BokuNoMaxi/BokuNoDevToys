<script lang="ts">
	import { t, lang } from '$lib/i18n';

	type FieldMode = 'simple' | 'manual';
	interface Field { mode: FieldMode; simple: string; manual: string; }

	function field(simple: string): Field { return { mode: 'simple', simple, manual: simple }; }

	let minute  = $state(field('*'));
	let hour    = $state(field('*'));
	let day     = $state(field('*'));
	let month   = $state(field('*'));
	let weekday = $state(field('*'));
	let copied  = $state(false);

	function val(f: Field) { return f.mode === 'manual' ? f.manual : f.simple; }

	let expression = $derived(`${val(minute)} ${val(hour)} ${val(day)} ${val(month)} ${val(weekday)}`);

	// Minute options
	const minuteOpts = ['*','0','*/5','*/10','*/15','*/30'];
	const hourOpts   = ['*','0','*/2','*/6','*/12'];
	const dayOpts    = ['*','1','15','*/7'];
	const monthOpts  = ['*','1','3','6','9','12'];
	const wdOpts     = ['*','1','2','3','4','5','1-5','6,0'];

	function minuteLabel(v: string) {
		const tr = $t('cronBuilder');
		if (v === '*') return tr.everyMinute;
		if (v === '0') return '0';
		if (v.startsWith('*/')) return `${tr.every} ${v.slice(2)} min`;
		return v;
	}
	function hourLabel(v: string) {
		const tr = $t('cronBuilder');
		if (v === '*') return tr.everyHour;
		if (v === '0') return `${tr.at} 00:00`;
		if (v.startsWith('*/')) return `${tr.every} ${v.slice(2)}h`;
		return v;
	}
	function dayLabel(v: string) {
		const tr = $t('cronBuilder');
		if (v === '*') return tr.everyDay;
		if (v.startsWith('*/')) return `${tr.every} ${v.slice(2)} ${tr.day}`;
		return `${tr.on} ${v}.`;
	}
	function monthLabel(v: string) {
		const tr = $t('cronBuilder');
		if (v === '*') return tr.everyDay;
		const months = tr.months;
		const n = parseInt(v);
		if (!isNaN(n)) return months[n-1] ?? v;
		return v;
	}
	function wdLabel(v: string) {
		const tr = $t('cronBuilder');
		const days = tr.weekdays;
		if (v === '*') return tr.everyDay;
		if (v === '1-5') return `${days[1]}–${days[5]}`;
		if (v === '6,0') return `${days[6]} ${tr.and} ${days[0]}`;
		const n = parseInt(v);
		if (!isNaN(n)) return days[n] ?? v;
		return v;
	}

	// Describe expression in plain text
	let description = $derived.by(() => {
		const tr = $t('cronBuilder');
		const parts: string[] = [];
		const m = val(minute), h = val(hour), d = val(day), mo = val(month), wd = val(weekday);
		if (m === '*' && h === '*') parts.push(tr.everyMinute);
		else if (m === '0' && h === '*') parts.push(tr.everyHour);
		else if (m === '0' && h === '0') parts.push(tr.everyDay);
		else {
			if (m === '*') parts.push(tr.everyMinute);
			else if (m.startsWith('*/')) parts.push(`${tr.every} ${m.slice(2)} min`);
			else parts.push(`${tr.at} :${m.padStart(2,'0')}`);
			if (h !== '*') {
				if (h.startsWith('*/')) parts.push(`${tr.every} ${h.slice(2)}h`);
				else parts.push(`${tr.at} ${h.padStart(2,'0')}:00`);
			}
		}
		if (d !== '*') parts.push(`${tr.on} ${d}.`);
		if (mo !== '*') {
			const months = tr.months;
			const n = parseInt(mo);
			parts.push(!isNaN(n) ? `${tr.in ?? 'in'} ${months[n-1] ?? mo}` : mo);
		}
		if (wd !== '*') {
			const days = tr.weekdays;
			if (wd === '1-5') parts.push(`${days[1]}–${days[5]}`);
			else if (wd === '6,0') parts.push(`${days[6]} ${tr.and} ${days[0]}`);
			else { const n = parseInt(wd); parts.push(!isNaN(n) ? (days[n] ?? wd) : wd); }
		}
		return parts.join(', ');
	});

	// Compute next 5 execution times
	let nextRuns = $derived.by(() => {
		try {
			const [m, h, d, mo, wd] = expression.split(' ');
			const now = new Date();
			const results: string[] = [];
			const candidate = new Date(now);
			candidate.setSeconds(0, 0);
			candidate.setMinutes(candidate.getMinutes() + 1);

			function matches(val: string, n: number, min: number, max: number): boolean {
				if (val === '*') return true;
				if (val.startsWith('*/')) { const step = parseInt(val.slice(2)); return (n - min) % step === 0; }
				if (val.includes(',')) return val.split(',').some(v => parseInt(v) === n);
				if (val.includes('-')) { const [a,b] = val.split('-').map(Number); return n >= a && n <= b; }
				return parseInt(val) === n;
			}

			let iterations = 0;
			while (results.length < 5 && iterations < 527040) {
				iterations++;
				const cMin = candidate.getMinutes();
				const cHour = candidate.getHours();
				const cDay = candidate.getDate();
				const cMonth = candidate.getMonth() + 1;
				const cWd = candidate.getDay();
				if (matches(mo, cMonth, 1, 12) && matches(d, cDay, 1, 31) &&
					matches(wd, cWd, 0, 6) && matches(h, cHour, 0, 23) && matches(m, cMin, 0, 59)) {
					results.push(candidate.toLocaleString($lang === 'de' ? 'de-AT' : 'en-US', {
						weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
						hour: '2-digit', minute: '2-digit'
					}));
				}
				candidate.setMinutes(candidate.getMinutes() + 1);
			}
			return results;
		} catch { return []; }
	});

	function copy() {
		navigator.clipboard.writeText(expression);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

	function setManual(f: Field, v: string) { f.manual = v; }
</script>

<div class="space-y-4">
	<!-- Fields -->
	{#each [
		{ label: $t('cronBuilder').minute,  f: minute,  opts: minuteOpts,  lbl: minuteLabel },
		{ label: $t('cronBuilder').hour,    f: hour,    opts: hourOpts,    lbl: hourLabel },
		{ label: $t('cronBuilder').day,     f: day,     opts: dayOpts,     lbl: dayLabel },
		{ label: $t('cronBuilder').month,   f: month,   opts: monthOpts,   lbl: monthLabel },
		{ label: $t('cronBuilder').weekday, f: weekday, opts: wdOpts,      lbl: wdLabel },
	] as { label, f, opts, lbl }}
		<div class="bg-slate-800 rounded-xl p-5">
			<div class="flex items-center justify-between mb-3">
				<h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{label}</h3>
				<div class="flex gap-1 text-xs" role="group">
					<button
						onclick={() => f.mode = 'simple'}
						aria-pressed={f.mode === 'simple'}
						class="px-3 py-1 rounded-l-md border border-slate-600 transition-colors {f.mode === 'simple' ? 'bg-violet-700 text-white border-violet-700' : 'text-slate-300 hover:text-slate-100'}"
					>{$t('cronBuilder').simple}</button>
					<button
						onclick={() => f.mode = 'manual'}
						aria-pressed={f.mode === 'manual'}
						class="px-3 py-1 rounded-r-md border border-slate-600 border-l-0 transition-colors {f.mode === 'manual' ? 'bg-violet-700 text-white border-violet-700' : 'text-slate-300 hover:text-slate-100'}"
					>{$t('cronBuilder').manual}</button>
				</div>
			</div>
			{#if f.mode === 'simple'}
				<div class="flex flex-wrap gap-2">
					{#each opts as o}
						<button
							onclick={() => f.simple = o}
							aria-pressed={f.simple === o}
							class="px-3 py-1.5 rounded-lg text-sm font-mono transition-colors {f.simple === o ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}"
						><span class="font-bold">{o}</span><span class="ml-2 text-xs opacity-70">{lbl(o)}</span></button>
					{/each}
				</div>
			{:else}
				<input
					type="text"
					value={f.manual}
					oninput={(e) => setManual(f, (e.target as HTMLInputElement).value)}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-300 font-mono focus:outline-none focus:border-violet-500 text-sm"
					placeholder="* / */5 / 0-5 / 1,2,3"
				/>
			{/if}
		</div>
	{/each}

	<!-- Result -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<div>
			<div class="flex items-center justify-between mb-2">
				<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('cronBuilder').expression}</h2>
				<button onclick={copy} class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-300 hover:text-violet-300 transition-colors">
					{copied ? $t('cronBuilder').copied : $t('cronBuilder').copy}
				</button>
			</div>
			<p class="font-mono text-2xl text-emerald-400 bg-slate-900 rounded-lg px-4 py-3 tracking-widest">{expression}</p>
		</div>
		{#if description}
			<div>
				<h3 class="text-xs text-slate-400 uppercase tracking-wider mb-1">{$t('cronBuilder').description}</h3>
				<p class="text-slate-300 text-sm">{description}</p>
			</div>
		{/if}
		{#if nextRuns.length > 0}
			<div>
				<h3 class="text-xs text-slate-400 uppercase tracking-wider mb-2">{$t('cronBuilder').nextRuns}</h3>
				<ol class="space-y-1">
					{#each nextRuns as run, i}
						<li class="text-sm font-mono text-slate-300"><span class="text-slate-500 mr-2">{i+1}.</span>{run}</li>
					{/each}
				</ol>
			</div>
		{/if}
	</div>
</div>
