<script lang="ts">
	let user = $state('');
	let password = $state('');
	let host = $state('localhost');
	let database = $state('');
	let filename = $state('backup');
	let envInput = $state('');
	let envError = $state('');
	let copied = $state<Record<string, boolean>>({});

	function parseEnv() {
		envError = '';
		const lines = envInput.split('\n');
		const map: Record<string, string> = {};

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const eq = trimmed.indexOf('=');
			if (eq === -1) continue;
			const key = trimmed.slice(0, eq).trim();
			// Strip surrounding quotes from value
			let val = trimmed.slice(eq + 1).trim();
			if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
				val = val.slice(1, -1);
			}
			map[key] = val;
		}

		const found = { user: map['DB_USER'], password: map['DB_PASSWORD'], host: map['DB_HOST'], database: map['DB_NAME'] ?? map['DB_DATABASE'] };
		const missing = Object.entries(found).filter(([, v]) => !v).map(([k]) => k);

		if (missing.length === 4) {
			envError = 'Keine bekannten DB_* Variablen gefunden.';
			return;
		}
		if (missing.length > 0) {
			envError = `Nicht gefunden: ${missing.map(k => ({ user: 'DB_USER', password: 'DB_PASSWORD', host: 'DB_HOST', database: 'DB_NAME / DB_DATABASE' } as Record<string,string>)[k]).join(', ')}`;
		}

		if (found.user) user = found.user;
		if (found.password) password = found.password;
		if (found.host) host = found.host;
		if (found.database) database = found.database;
		if (!missing.length) envInput = '';
	}

	function escapeShell(val: string): string {
		// Wrap in single quotes, escape embedded single quotes
		return `'${val.replace(/'/g, `'\\''`)}'`;
	}

	let exportCmd = $derived.by(() => {
		if (!user || !database) return '';
		const u = escapeShell(user);
		const p = password ? `-p${escapeShell(password)}` : '';
		const h = host && host !== 'localhost' ? `-h ${escapeShell(host)}` : '';
		const db = escapeShell(database);
		const file = (filename || 'backup').replace(/\.sql$/i, '') + '.sql';
		return `mysqldump -u ${u} ${p}${p ? ' ' : ''}${h}${h ? ' ' : ''}${db} > ${file}`.replace(/\s+/g, ' ').trim();
	});

	let importCmd = $derived.by(() => {
		if (!user || !database) return '';
		const u = escapeShell(user);
		const p = password ? `-p${escapeShell(password)}` : '';
		const h = host && host !== 'localhost' ? `-h ${escapeShell(host)}` : '';
		const db = escapeShell(database);
		const file = (filename || 'backup').replace(/\.sql$/i, '') + '.sql';
		return `mysql -u ${u} ${p}${p ? ' ' : ''}${h}${h ? ' ' : ''}${db} < ${file}`.replace(/\s+/g, ' ').trim();
	});

	function copy(key: string, text: string) {
		navigator.clipboard.writeText(text);
		copied = { ...copied, [key]: true };
		setTimeout(() => { copied = { ...copied, [key]: false }; }, 2000);
	}

	let isReady = $derived(!!user && !!database);
</script>

<div class="space-y-6">

	<!-- .env Import -->
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">.env Import</h2>
		<p class="text-xs text-slate-500 mb-4">
			Kopiere den Inhalt deiner <code class="text-slate-400">.env</code>-Datei hier hinein — die Felder
			<code class="text-slate-400">DB_USER</code>, <code class="text-slate-400">DB_PASSWORD</code>,
			<code class="text-slate-400">DB_HOST</code> und <code class="text-slate-400">DB_NAME</code> / <code class="text-slate-400">DB_DATABASE</code>
			werden automatisch übernommen.
		</p>
		<textarea
			bind:value={envInput}
			placeholder={'DB_USER=myuser\nDB_PASSWORD=secret\nDB_HOST=localhost\nDB_NAME=mydb\n# oder: DB_DATABASE=mydb\n# Kommentare und andere Variablen werden ignoriert'}
			rows="6"
			class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-700 focus:outline-none focus:border-violet-500 font-mono text-xs resize-y"
		></textarea>
		{#if envError}
			<p class="mt-2 text-amber-400 text-sm">{envError}</p>
		{/if}
		<button
			onclick={parseEnv}
			disabled={!envInput.trim()}
			class="mt-3 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
		>
			Werte übernehmen
		</button>
	</div>

	<!-- Connection Fields -->
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Verbindungsparameter</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label for="db-user" class="block text-xs text-slate-500 mb-1.5">Username <span class="text-red-500">*</span></label>
				<input id="db-user" type="text" bind:value={user} placeholder="root"
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-sm" />
			</div>
			<div>
				<label for="db-pass" class="block text-xs text-slate-500 mb-1.5">Password</label>
				<input id="db-pass" type="password" bind:value={password} placeholder="••••••••"
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-sm" />
			</div>
			<div>
				<label for="db-host" class="block text-xs text-slate-500 mb-1.5">Host</label>
				<input id="db-host" type="text" bind:value={host} placeholder="localhost"
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-sm" />
			</div>
			<div>
				<label for="db-name" class="block text-xs text-slate-500 mb-1.5">Datenbank <span class="text-red-500">*</span></label>
				<input id="db-name" type="text" bind:value={database} placeholder="my_database"
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-sm" />
			</div>
			<div class="sm:col-span-2">
				<label for="db-file" class="block text-xs text-slate-500 mb-1.5">Dateiname <span class="text-slate-600">(ohne .sql)</span></label>
				<input id="db-file" type="text" bind:value={filename} placeholder="backup"
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-sm" />
			</div>
		</div>
	</div>

	<!-- Generated Commands -->
	{#if isReady}
		<div class="space-y-4">
			<!-- Export -->
			<div class="bg-slate-800 rounded-xl p-6">
				<div class="flex items-center justify-between mb-3">
					<div>
						<h2 class="text-sm font-semibold text-slate-300">Export <span class="ml-2 text-xs font-normal text-slate-500">Datenbank → Datei</span></h2>
					</div>
					<button
						onclick={() => copy('export', exportCmd)}
						class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-400 hover:text-violet-400 transition-colors"
					>
						{copied['export'] ? '✓ Kopiert' : 'Kopieren'}
					</button>
				</div>
				<pre class="bg-slate-900 rounded-lg px-4 py-3 text-sm font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap break-all">{exportCmd}</pre>
			</div>

			<!-- Import -->
			<div class="bg-slate-800 rounded-xl p-6">
				<div class="flex items-center justify-between mb-3">
					<div>
						<h2 class="text-sm font-semibold text-slate-300">Import <span class="ml-2 text-xs font-normal text-slate-500">Datei → Datenbank</span></h2>
					</div>
					<button
						onclick={() => copy('import', importCmd)}
						class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-400 hover:text-violet-400 transition-colors"
					>
						{copied['import'] ? '✓ Kopiert' : 'Kopieren'}
					</button>
				</div>
				<pre class="bg-slate-900 rounded-lg px-4 py-3 text-sm font-mono text-sky-400 overflow-x-auto whitespace-pre-wrap break-all">{importCmd}</pre>
			</div>
		</div>
	{:else}
		<div class="bg-slate-800/50 border border-dashed border-slate-700 rounded-xl p-8 text-center">
			<p class="text-slate-600 text-sm">Bitte Username und Datenbankname eingeben, um die Befehle zu generieren.</p>
		</div>
	{/if}
</div>
