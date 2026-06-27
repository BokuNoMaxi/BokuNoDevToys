<script lang="ts">
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

	// For diff calculation
	let dateA = $state(new Date().toISOString().slice(0, 10));
	let timeA = $state('12:00');
	let dateB = $state(new Date().toISOString().slice(0, 10));
	let timeB = $state('12:00');

	function pad(n: number) { return String(Math.floor(Math.abs(n))).padStart(2, '0'); }

	function calculate() {
		error = '';
		result = '';
		if (!baseDate) { error = 'Bitte Startdatum angeben'; return; }

		try {
			const d = new Date(`${baseDate}T${baseTime || '00:00'}:00`);
			if (isNaN(d.getTime())) { error = 'Ungültiges Datum'; return; }

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
			error = `Fehler: ${(e as Error).message}`;
		}
	}

	function calculateDiff() {
		diffResult = '';
		try {
			const a = new Date(`${dateA}T${timeA || '00:00'}:00`);
			const b = new Date(`${dateB}T${timeB || '00:00'}:00`);
			if (isNaN(a.getTime()) || isNaN(b.getTime())) { diffResult = 'Ungültige Daten'; return; }

			let ms = Math.abs(b.getTime() - a.getTime());
			const totalSeconds = Math.floor(ms / 1000);
			const totalMinutes = Math.floor(totalSeconds / 60);
			const totalHours = Math.floor(totalMinutes / 60);
			const totalDays = Math.floor(totalHours / 24);

			const secs = totalSeconds % 60;
			const mins = totalMinutes % 60;
			const hrs = totalHours % 24;

			// Approximate years and months from days
			const approxYears = Math.floor(totalDays / 365);
			const approxMonths = Math.floor((totalDays % 365) / 30);
			const remDays = totalDays % 365 % 30;

			const direction = b >= a ? 'B ist nach A' : 'A ist nach B';

			diffResult = [
				`${direction}`,
				``,
				`Gesamt: ${totalDays} Tage / ${totalHours} Stunden / ${totalMinutes} Minuten / ${totalSeconds} Sekunden`,
				``,
				`Aufgeteilt: ${approxYears} J, ${approxMonths} M, ${remDays} T, ${pad(hrs)} h, ${pad(mins)} min, ${pad(secs)} sek`,
			].join('\n');
		} catch (e) {
			diffResult = `Fehler: ${(e as Error).message}`;
		}
	}

	function copy(text: string) { navigator.clipboard.writeText(text); }
</script>

<div class="space-y-8">
	<!-- Add/Subtract -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-5">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">Datum berechnen</h2>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-xs text-slate-500 mb-1.5">Startdatum</label>
				<input
					type="date"
					bind:value={baseDate}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
				/>
			</div>
			<div>
				<label class="block text-xs text-slate-500 mb-1.5">Startzeit</label>
				<input
					type="time"
					bind:value={baseTime}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
				/>
			</div>
		</div>

		<div class="flex gap-3">
			<button
				onclick={() => operation = 'add'}
				class="flex-1 py-2 rounded-lg font-medium transition-colors {operation === 'add' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'}"
			>
				+ Hinzufügen
			</button>
			<button
				onclick={() => operation = 'sub'}
				class="flex-1 py-2 rounded-lg font-medium transition-colors {operation === 'sub' ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'}"
			>
				− Abziehen
			</button>
		</div>

		<div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
			{#each [
				{ label: 'Jahre', bind: 'years', value: years },
				{ label: 'Monate', bind: 'months', value: months },
				{ label: 'Tage', bind: 'days', value: days },
				{ label: 'Stunden', bind: 'hours', value: hours },
				{ label: 'Minuten', bind: 'minutes', value: minutes },
				{ label: 'Sekunden', bind: 'seconds', value: seconds },
			] as field}
				<div>
					<label class="block text-xs text-slate-500 mb-1.5">{field.label}</label>
					<input
						type="number"
						min="0"
						value={field.value}
						oninput={(e) => {
							const v = parseInt((e.target as HTMLInputElement).value) || 0;
							if (field.bind === 'years') years = v;
							else if (field.bind === 'months') months = v;
							else if (field.bind === 'days') days = v;
							else if (field.bind === 'hours') hours = v;
							else if (field.bind === 'minutes') minutes = v;
							else if (field.bind === 'seconds') seconds = v;
						}}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono text-center"
					/>
				</div>
			{/each}
		</div>

		<button
			onclick={calculate}
			class="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors"
		>
			Berechnen
		</button>

		{#if error}
			<p class="text-red-400 text-sm">{error}</p>
		{/if}

		{#if result}
			<div class="flex items-center gap-3 bg-slate-900 rounded-lg px-4 py-3">
				<span class="font-mono text-emerald-400 text-lg flex-1">{result}</span>
				<button onclick={() => copy(result)} class="text-xs text-slate-500 hover:text-slate-300 transition-colors">Kopieren</button>
			</div>
		{/if}
	</div>

	<!-- Diff -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-5">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">Zeitdifferenz berechnen</h2>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
			<div class="space-y-3">
				<p class="text-xs text-slate-500 font-medium uppercase">Datum A</p>
				<input type="date" bind:value={dateA}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono" />
				<input type="time" bind:value={timeA}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono" />
			</div>
			<div class="space-y-3">
				<p class="text-xs text-slate-500 font-medium uppercase">Datum B</p>
				<input type="date" bind:value={dateB}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono" />
				<input type="time" bind:value={timeB}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono" />
			</div>
		</div>

		<button
			onclick={calculateDiff}
			class="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors"
		>
			Differenz berechnen
		</button>

		{#if diffResult}
			<div class="bg-slate-900 rounded-lg px-4 py-3">
				<pre class="font-mono text-sky-400 text-sm whitespace-pre">{diffResult}</pre>
			</div>
		{/if}
	</div>
</div>
