<script lang="ts">
	const bases = ['GMT', 'MEZ', 'MESZ'];
	const offsets = Array.from({ length: 25 }, (_, i) => i - 12); // -12 to +12

	// MEZ = UTC+1, MESZ = UTC+2 — fixed offsets
	const fixedOffset: Record<string, number> = { MEZ: 1, MESZ: 2 };

	let inputDate = $state(new Date().toISOString().slice(0, 10));
	let inputTime = $state(new Date().toTimeString().slice(0, 5));

	let fromBase   = $state('GMT');
	let fromOffset = $state(0);
	let toBase     = $state('MEZ');
	let toOffset   = $state(1);

	// Auto-set offset when a fixed-offset base is chosen
	$effect(() => { if (fixedOffset[fromBase] !== undefined) fromOffset = fixedOffset[fromBase]; });
	$effect(() => { if (fixedOffset[toBase]   !== undefined) toOffset   = fixedOffset[toBase]; });

	let result = $state('');
	let error  = $state('');

	function offsetToTz(offset: number): string {
		// Etc/GMT uses inverted sign convention
		return offset === 0 ? 'UTC' : `Etc/GMT${offset > 0 ? -offset : '+' + Math.abs(offset)}`;
	}

	function offsetLabel(o: number): string {
		if (o === 0) return '±0';
		return o > 0 ? `+${o}` : `${o}`;
	}

	function convert() {
		error = '';
		result = '';
		if (!inputDate) { error = 'Bitte Datum eingeben'; return; }

		try {
			const fromTz = offsetToTz(fromOffset);
			const toTz   = offsetToTz(toOffset);

			// Treat input as UTC, then shift by fromOffset to get actual UTC moment
			const approxUtc = new Date(`${inputDate}T${inputTime || '00:00'}:00Z`);
			if (isNaN(approxUtc.getTime())) { error = 'Ungültiges Datum'; return; }

			// The input time is in fromOffset — subtract offset to get UTC
			const utcMs  = approxUtc.getTime() - fromOffset * 3600000;
			const utcDate = new Date(utcMs);

			const parts = new Intl.DateTimeFormat('de-DE', {
				timeZone: toTz,
				year: 'numeric', month: '2-digit', day: '2-digit',
				hour: '2-digit', minute: '2-digit', second: '2-digit',
				hour12: false,
			}).formatToParts(utcDate);

			const p: Record<string, string> = {};
			parts.forEach(({ type, value }) => { p[type] = value; });

			const sign = toOffset >= 0 ? '+' : '';
			result = `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}:${p.second} ${toBase}${sign}${toOffset}`;
		} catch (e) {
			error = `Fehler: ${(e as Error).message}`;
		}
	}

	function copy() { navigator.clipboard.writeText(result); }

	const selectClass = 'bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500';
</script>

<div class="space-y-6">
	<div class="bg-slate-800 rounded-xl p-6 space-y-5">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">Zeitzonen Umrechner</h2>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-xs text-slate-500 mb-1.5" for="tz-date">Datum</label>
				<input id="tz-date" type="date" bind:value={inputDate}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono" />
			</div>
			<div>
				<label class="block text-xs text-slate-500 mb-1.5" for="tz-time">Uhrzeit</label>
				<input id="tz-time" type="time" bind:value={inputTime}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono" />
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
			<div>
				<p class="text-xs text-slate-500 mb-2 uppercase font-medium">Von</p>
				<div class="flex gap-2">
					<select bind:value={fromBase} class="{selectClass} w-24">
						{#each bases as b}<option value={b}>{b}</option>{/each}
					</select>
					<select bind:value={fromOffset} disabled={fixedOffset[fromBase] !== undefined} class="{selectClass} flex-1 disabled:opacity-40 disabled:cursor-not-allowed">
						{#each offsets as o}<option value={o}>{offsetLabel(o)}</option>{/each}
					</select>
				</div>
			</div>

			<div class="text-slate-500 text-xl text-center pb-2.5">→</div>

			<div>
				<p class="text-xs text-slate-500 mb-2 uppercase font-medium">Nach</p>
				<div class="flex gap-2">
					<select bind:value={toBase} class="{selectClass} w-24">
						{#each bases as b}<option value={b}>{b}</option>{/each}
					</select>
					<select bind:value={toOffset} disabled={fixedOffset[toBase] !== undefined} class="{selectClass} flex-1 disabled:opacity-40 disabled:cursor-not-allowed">
						{#each offsets as o}<option value={o}>{offsetLabel(o)}</option>{/each}
					</select>
				</div>
			</div>
		</div>

		<button onclick={convert}
			class="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors">
			Umrechnen
		</button>

		{#if error}
			<p class="text-red-400 text-sm">{error}</p>
		{/if}

		{#if result}
			<div class="flex items-center gap-3 bg-slate-900 rounded-lg px-4 py-3">
				<span class="font-mono text-emerald-400 text-lg flex-1">{result}</span>
				<button onclick={copy} class="text-xs text-slate-500 hover:text-slate-300 transition-colors">Kopieren</button>
			</div>
		{/if}
	</div>
</div>
