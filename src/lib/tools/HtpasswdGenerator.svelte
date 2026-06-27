<script lang="ts">
	import bcrypt from 'bcryptjs';

	let username = $state('');
	let password = $state('');
	let htpasswdEntry = $state('');
	let generating = $state(false);
	let error = $state('');

	let protectedPath = $state('/var/www/html');
	let htpasswdPath = $state('/etc/apache2/.htpasswd');

	let domainConditions = $state<string[]>([]);
	let newDomain = $state('');

	let ipExclusions = $state<string[]>([]);
	let newIp = $state('');

	let copied = $state<Record<string, boolean>>({});

	async function generate() {
		error = '';
		htpasswdEntry = '';
		if (!username.trim() || !password.trim()) { error = 'Username and password required'; return; }
		generating = true;
		try {
			const salt = await bcrypt.genSalt(10);
			const hash = await bcrypt.hash(password, salt);
			htpasswdEntry = `${username.trim()}:${hash}`;
		} catch (e) {
			error = 'Failed to generate hash';
		}
		generating = false;
	}

	function addDomain() {
		const d = newDomain.trim();
		if (d && !domainConditions.includes(d)) { domainConditions = [...domainConditions, d]; }
		newDomain = '';
	}

	function addIp() {
		const ip = newIp.trim();
		if (ip && !ipExclusions.includes(ip)) { ipExclusions = [...ipExclusions, ip]; }
		newIp = '';
	}

	function copy(key: string, text: string) {
		navigator.clipboard.writeText(text);
		copied = { ...copied, [key]: true };
		setTimeout(() => { copied = { ...copied, [key]: false }; }, 2000);
	}

	let htaccessContent = $derived.by(() => {
		const lines: string[] = [];

		if (ipExclusions.length > 0) {
			lines.push('# Allow specific IPs without auth');
			for (const ip of ipExclusions) {
				if (ip.includes('/')) {
					lines.push(`Require ip ${ip}`);
				} else {
					lines.push(`Require ip ${ip}`);
				}
			}
			lines.push('');
		}

		if (domainConditions.length > 0) {
			for (const domain of domainConditions) {
				lines.push(`<If "%{HTTP_HOST} == '${domain}'">`);
				lines.push(`  AuthType Basic`);
				lines.push(`  AuthName "Restricted Area"`);
				lines.push(`  AuthUserFile ${htpasswdPath}`);
				if (ipExclusions.length > 0) {
					lines.push(`  <RequireAny>`);
					lines.push(`    Require valid-user`);
					for (const ip of ipExclusions) {
						lines.push(`    Require ip ${ip}`);
					}
					lines.push(`  </RequireAny>`);
				} else {
					lines.push(`  Require valid-user`);
				}
				lines.push(`</If>`);
				lines.push('');
			}
		} else {
			lines.push(`AuthType Basic`);
			lines.push(`AuthName "Restricted Area"`);
			lines.push(`AuthUserFile ${htpasswdPath}`);
			if (ipExclusions.length > 0) {
				lines.push(`<RequireAny>`);
				lines.push(`  Require valid-user`);
				for (const ip of ipExclusions) {
					lines.push(`  Require ip ${ip}`);
				}
				lines.push(`</RequireAny>`);
			} else {
				lines.push(`Require valid-user`);
			}
		}

		return lines.join('\n');
	});
</script>

<div class="space-y-6">
	<!-- Credentials -->
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Credentials</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-xs text-slate-500 mb-1.5">Username</label>
				<input type="text" bind:value={username} placeholder="admin"
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500" />
			</div>
			<div>
				<label class="block text-xs text-slate-500 mb-1.5">Password</label>
				<input type="password" bind:value={password} placeholder="••••••••"
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500" />
			</div>
		</div>
		{#if error}<p class="mt-2 text-red-400 text-sm">{error}</p>{/if}
		<button onclick={generate} disabled={generating} class="mt-4 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors">
			{generating ? 'Generating…' : 'Generate'}
		</button>

		{#if htpasswdEntry}
			<div class="mt-4">
				<div class="text-xs text-slate-500 mb-1.5">htpasswd entry</div>
				<div class="flex items-start gap-3 bg-slate-900 rounded-lg px-4 py-3">
					<code class="flex-1 text-sm font-mono text-violet-400 break-all">{htpasswdEntry}</code>
					<button onclick={() => copy('entry', htpasswdEntry)} class="text-xs text-slate-500 hover:text-slate-300 shrink-0 transition-colors">
						{copied['entry'] ? '✓' : 'Copy'}
					</button>
				</div>
				<p class="text-xs text-slate-600 mt-1.5">Add this line to your <code class="text-slate-500">.htpasswd</code> file at <code class="text-slate-500">{htpasswdPath}</code></p>
			</div>
		{/if}
	</div>

	<!-- Paths -->
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Paths</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-xs text-slate-500 mb-1.5">Protected directory</label>
				<input type="text" bind:value={protectedPath} class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono text-sm" />
			</div>
			<div>
				<label class="block text-xs text-slate-500 mb-1.5">htpasswd file path</label>
				<input type="text" bind:value={htpasswdPath} class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 font-mono text-sm" />
			</div>
		</div>
	</div>

	<!-- Domain Conditions -->
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Domain Conditions <span class="text-slate-600 font-normal normal-case text-xs">(optional — restrict auth to specific domains)</span></h2>
		<div class="flex gap-3 mt-4">
			<input type="text" bind:value={newDomain} placeholder="example.com"
				onkeydown={(e) => e.key === 'Enter' && addDomain()}
				class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-sm" />
			<button onclick={addDomain} class="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">Add</button>
		</div>
		{#if domainConditions.length > 0}
			<div class="mt-3 flex flex-wrap gap-2">
				{#each domainConditions as domain}
					<span class="flex items-center gap-2 bg-slate-900 rounded-full px-3 py-1 text-sm font-mono text-sky-400">
						{domain}
						<button onclick={() => { domainConditions = domainConditions.filter(d => d !== domain); }} class="text-slate-600 hover:text-red-400 transition-colors">✕</button>
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<!-- IP Exclusions -->
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">IP Exclusions <span class="text-slate-600 font-normal normal-case text-xs">(bypass auth for these IPs/CIDRs)</span></h2>
		<div class="flex gap-3 mt-4">
			<input type="text" bind:value={newIp} placeholder="192.168.1.0/24 or 10.0.0.1"
				onkeydown={(e) => e.key === 'Enter' && addIp()}
				class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono text-sm" />
			<button onclick={addIp} class="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">Add</button>
		</div>
		{#if ipExclusions.length > 0}
			<div class="mt-3 flex flex-wrap gap-2">
				{#each ipExclusions as ip}
					<span class="flex items-center gap-2 bg-slate-900 rounded-full px-3 py-1 text-sm font-mono text-emerald-400">
						{ip}
						<button onclick={() => { ipExclusions = ipExclusions.filter(i => i !== ip); }} class="text-slate-600 hover:text-red-400 transition-colors">✕</button>
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<!-- .htaccess Preview -->
	<div class="bg-slate-800 rounded-xl p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">.htaccess Content</h2>
			<button onclick={() => copy('htaccess', htaccessContent)} class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-400 hover:text-violet-400 transition-colors">
				{copied['htaccess'] ? '✓ Copied' : 'Copy'}
			</button>
		</div>
		<pre class="bg-slate-900 rounded-lg p-4 text-sm font-mono text-emerald-400 overflow-x-auto whitespace-pre">{htaccessContent}</pre>
		<p class="text-xs text-slate-600 mt-2">Place this in <code class="text-slate-500">{protectedPath}/.htaccess</code></p>
	</div>
</div>
