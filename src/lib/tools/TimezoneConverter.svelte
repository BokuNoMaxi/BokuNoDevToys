<script lang="ts">
	// Timezones grouped by their UTC label (standard offset)
	const zoneGroups: Record<string, string[]> = {
		'UTC-12': ['Etc/GMT+12'],
		'UTC-11': ['Pacific/Pago_Pago', 'Pacific/Niue'],
		'UTC-10': ['Pacific/Honolulu', 'Pacific/Tahiti'],
		'UTC-9':  ['America/Anchorage', 'Pacific/Gambier'],
		'UTC-8':  ['America/Los_Angeles', 'America/Vancouver', 'America/Tijuana'],
		'UTC-7':  ['America/Denver', 'America/Phoenix', 'America/Edmonton'],
		'UTC-6':  ['America/Chicago', 'America/Mexico_City', 'America/Winnipeg'],
		'UTC-5':  ['America/New_York', 'America/Toronto', 'America/Bogota', 'America/Lima'],
		'UTC-4':  ['America/Halifax', 'America/Caracas', 'America/La_Paz', 'America/Santiago'],
		'UTC-3':  ['America/Sao_Paulo', 'America/Argentina/Buenos_Aires', 'America/Montevideo'],
		'UTC-2':  ['Etc/GMT+2'],
		'UTC-1':  ['Atlantic/Azores', 'Atlantic/Cape_Verde'],
		'UTC+0':  ['UTC', 'GMT', 'Europe/London', 'Europe/Lisbon', 'Africa/Abidjan'],
		'UTC+1':  ['Europe/Berlin', 'Europe/Paris', 'Europe/Rome', 'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Warsaw', 'Europe/Vienna', 'Europe/Brussels', 'Africa/Lagos'],
		'UTC+2':  ['Europe/Helsinki', 'Europe/Athens', 'Europe/Bucharest', 'Europe/Kiev', 'Africa/Cairo', 'Africa/Johannesburg', 'Asia/Jerusalem'],
		'UTC+3':  ['Europe/Moscow', 'Asia/Istanbul', 'Asia/Riyadh', 'Africa/Nairobi', 'Asia/Baghdad'],
		'UTC+3:30': ['Asia/Tehran'],
		'UTC+4':  ['Asia/Dubai', 'Asia/Baku', 'Asia/Tbilisi', 'Indian/Mauritius'],
		'UTC+4:30': ['Asia/Kabul'],
		'UTC+5':  ['Asia/Karachi', 'Asia/Tashkent', 'Asia/Yekaterinburg'],
		'UTC+5:30': ['Asia/Kolkata', 'Asia/Colombo'],
		'UTC+5:45': ['Asia/Kathmandu'],
		'UTC+6':  ['Asia/Dhaka', 'Asia/Almaty'],
		'UTC+6:30': ['Asia/Rangoon'],
		'UTC+7':  ['Asia/Bangkok', 'Asia/Ho_Chi_Minh', 'Asia/Jakarta'],
		'UTC+8':  ['Asia/Shanghai', 'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Taipei', 'Australia/Perth'],
		'UTC+9':  ['Asia/Tokyo', 'Asia/Seoul', 'Asia/Yakutsk'],
		'UTC+9:30': ['Australia/Adelaide', 'Australia/Darwin'],
		'UTC+10': ['Australia/Sydney', 'Australia/Melbourne', 'Pacific/Port_Moresby'],
		'UTC+11': ['Pacific/Guadalcanal', 'Pacific/Noumea'],
		'UTC+12': ['Pacific/Auckland', 'Pacific/Fiji', 'Asia/Kamchatka'],
		'UTC+13': ['Pacific/Tongatapu', 'Pacific/Apia'],
		'UTC+14': ['Pacific/Kiritimati'],
	};

	const offsetKeys = Object.keys(zoneGroups);

	let inputDate = $state(new Date().toISOString().slice(0, 10));
	let inputTime = $state(new Date().toTimeString().slice(0, 5));
	let fromOffset = $state('UTC+0');
	let fromZone   = $state('UTC');
	let toOffset   = $state('UTC+1');
	let toZone     = $state('Europe/Berlin');
	let result     = $state('');
	let error      = $state('');

	let fromZones  = $derived(zoneGroups[fromOffset] ?? []);
	let toZones    = $derived(zoneGroups[toOffset] ?? []);

	// Reset zone selection when offset changes
	$effect(() => {
		const zones = zoneGroups[fromOffset] ?? [];
		if (!zones.includes(fromZone)) fromZone = zones[0] ?? '';
	});
	$effect(() => {
		const zones = zoneGroups[toOffset] ?? [];
		if (!zones.includes(toZone)) toZone = zones[0] ?? '';
	});

	// Reliably get UTC offset in ms using formatToParts (no locale-string parsing issues)
	function getOffsetMs(tz: string, utcDate: Date): number {
		const parts = new Intl.DateTimeFormat('en-CA', {
			timeZone: tz,
			year: 'numeric', month: '2-digit', day: '2-digit',
			hour: '2-digit', minute: '2-digit', second: '2-digit',
			hour12: false
		}).formatToParts(utcDate);

		const p: Record<string, string> = {};
		parts.forEach(({ type, value }) => { p[type] = value; });

		// Interpret the displayed local time as if it were UTC to compute the delta
		const localAsUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
		return localAsUtc - utcDate.getTime(); // positive = zone is ahead of UTC
	}

	function convert() {
		error = '';
		result = '';
		if (!inputDate || !fromZone || !toZone) { error = 'Bitte alle Felder ausfüllen'; return; }

		try {
			// Treat input naively as UTC, then shift by fromZone offset to get actual UTC
			const approxUtc = new Date(`${inputDate}T${inputTime || '00:00'}:00Z`);
			if (isNaN(approxUtc.getTime())) { error = 'Ungültiges Datum'; return; }

			const offsetMs = getOffsetMs(fromZone, approxUtc);
			const utcDate = new Date(approxUtc.getTime() - offsetMs);

			result = new Intl.DateTimeFormat('de-DE', {
				timeZone: toZone,
				year: 'numeric', month: '2-digit', day: '2-digit',
				hour: '2-digit', minute: '2-digit', second: '2-digit',
				hour12: false,
				timeZoneName: 'shortOffset'
			}).format(utcDate);
		} catch (e) {
			error = `Fehler: ${(e as Error).message}`;
		}
	}

	function copy() { navigator.clipboard.writeText(result); }

	const selectClass = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm';
</script>

<div class="space-y-6">
	<div class="bg-slate-800 rounded-xl p-6 space-y-5">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">Zeitzonen Umrechner</h2>

		<!-- Date & Time input -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-xs text-slate-500 mb-1.5" for="tz-date">Datum</label>
				<input
					id="tz-date"
					type="date"
					bind:value={inputDate}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
				/>
			</div>
			<div>
				<label class="block text-xs text-slate-500 mb-1.5" for="tz-time">Uhrzeit</label>
				<input
					id="tz-time"
					type="time"
					bind:value={inputTime}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
				/>
			</div>
		</div>

		<!-- Zone selectors -->
		<div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-start">
			<!-- FROM -->
			<div class="space-y-2">
				<p class="text-xs text-slate-500 font-medium uppercase">Von</p>
				<select bind:value={fromOffset} class={selectClass}>
					{#each offsetKeys as key}
						<option value={key}>{key}</option>
					{/each}
				</select>
				<select bind:value={fromZone} class={selectClass}>
					{#each fromZones as z}
						<option value={z}>{z}</option>
					{/each}
				</select>
			</div>

			<div class="text-slate-500 text-xl text-center pt-8">→</div>

			<!-- TO -->
			<div class="space-y-2">
				<p class="text-xs text-slate-500 font-medium uppercase">Nach</p>
				<select bind:value={toOffset} class={selectClass}>
					{#each offsetKeys as key}
						<option value={key}>{key}</option>
					{/each}
				</select>
				<select bind:value={toZone} class={selectClass}>
					{#each toZones as z}
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
