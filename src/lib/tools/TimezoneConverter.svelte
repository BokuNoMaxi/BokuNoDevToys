<script lang="ts">
	let inputDate = $state(new Date().toISOString().slice(0, 10));
	let inputTime = $state('12:00');
	let fromZone = $state('UTC');
	let toZone = $state('Europe/Berlin');
	let result = $state('');
	let error = $state('');

	const commonZones = [
		'UTC', 'GMT',
		'Europe/Berlin', 'Europe/London', 'Europe/Paris', 'Europe/Rome',
		'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Warsaw', 'Europe/Moscow',
		'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
		'America/Sao_Paulo', 'America/Toronto', 'America/Mexico_City',
		'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Seoul', 'Asia/Kolkata',
		'Asia/Dubai', 'Asia/Singapore', 'Asia/Bangkok',
		'Australia/Sydney', 'Australia/Melbourne',
		'Pacific/Auckland', 'Pacific/Honolulu',
		'Africa/Cairo', 'Africa/Johannesburg',
	];

	function getOffsetMinutes(tz: string, utcDate: Date): number {
		const utcStr = utcDate.toLocaleString('en-US', { timeZone: 'UTC' });
		const tzStr = utcDate.toLocaleString('en-US', { timeZone: tz });
		return (new Date(utcStr).getTime() - new Date(tzStr).getTime()) / 60000;
	}

	function convert() {
		error = '';
		result = '';
		if (!inputDate) { error = 'Bitte Datum eingeben'; return; }

		try {
			// Treat input as UTC to get approximate ms, then adjust for fromZone offset
			const approxUtc = new Date(`${inputDate}T${inputTime || '00:00'}:00Z`);
			if (isNaN(approxUtc.getTime())) { error = 'Ungültiges Datum'; return; }

			const offsetMin = getOffsetMinutes(fromZone, approxUtc);
			const utcMs = approxUtc.getTime() + offsetMin * 60000;
			const utcDate = new Date(utcMs);

			const fmt = (tz: string) => new Intl.DateTimeFormat('de-DE', {
				timeZone: tz,
				year: 'numeric', month: '2-digit', day: '2-digit',
				hour: '2-digit', minute: '2-digit', second: '2-digit',
				hour12: false,
				timeZoneName: 'shortOffset'
			}).format(utcDate);

			result = fmt(toZone);
		} catch (e) {
			error = `Fehler: ${(e as Error).message}`;
		}
	}

	function copy() { navigator.clipboard.writeText(result); }
</script>

<div class="space-y-6">
	<div class="bg-slate-800 rounded-xl p-6 space-y-5">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">Zeitzonen Umrechner</h2>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-xs text-slate-500 mb-1.5">Datum</label>
				<input
					type="date"
					bind:value={inputDate}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
				/>
			</div>
			<div>
				<label class="block text-xs text-slate-500 mb-1.5">Uhrzeit</label>
				<input
					type="time"
					bind:value={inputTime}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
				/>
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
			<div>
				<label class="block text-xs text-slate-500 mb-1.5">Von Zeitzone</label>
				<select
					bind:value={fromZone}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500"
				>
					{#each commonZones as z}
						<option value={z}>{z}</option>
					{/each}
				</select>
			</div>
			<div class="text-slate-500 text-xl text-center pb-2.5">→</div>
			<div>
				<label class="block text-xs text-slate-500 mb-1.5">Nach Zeitzone</label>
				<select
					bind:value={toZone}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500"
				>
					{#each commonZones as z}
						<option value={z}>{z}</option>
					{/each}
				</select>
			</div>
		</div>

		<button
			onclick={convert}
			class="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors"
		>
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
