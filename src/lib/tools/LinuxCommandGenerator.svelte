<script lang="ts">
	import { t } from '$lib/i18n';

	type CommandMode = 'rsync' | 'ssh' | 'diskUsage' | 'symlink' | 'tar' | 'find' | 'permissions' | 'grep' | 'sshKeygen';

	const MODES: { key: CommandMode; label: string }[] = [
		{ key: 'rsync', label: 'rsync' },
		{ key: 'ssh', label: 'ssh' },
		{ key: 'diskUsage', label: 'du / df' },
		{ key: 'symlink', label: 'ln' },
		{ key: 'tar', label: 'tar' },
		{ key: 'find', label: 'find' },
		{ key: 'permissions', label: 'chmod / chown' },
		{ key: 'grep', label: 'grep' },
		{ key: 'sshKeygen', label: 'ssh-keygen' },
	];

	let mode = $state<CommandMode>('rsync');
	let copied = $state(false);

	function escapeShell(val: string): string {
		return `'${val.replace(/'/g, `'\\''`)}'`;
	}

	function digits(val: string): string {
		return val.replace(/\D/g, '');
	}

	// --- rsync ---
	let rsyncState = $state({
		sourceIsRemote: false, sourceUser: '', sourceHost: '', sourcePath: '',
		destIsRemote: false, destUser: '', destHost: '', destPath: '',
		archive: true, verbose: true, compress: false, humanReadable: true,
		delete: false, dryRun: false, useSsh: false, sshPort: '', exclude: '',
	});

	function rsyncEndpoint(isRemote: boolean, user: string, host: string, path: string): string {
		return isRemote
			? `${user.trim() ? escapeShell(user.trim()) + '@' : ''}${escapeShell(host.trim())}:${escapeShell(path.trim())}`
			: escapeShell(path.trim());
	}

	function buildRsync(s: typeof rsyncState) {
		const srcReady = s.sourceIsRemote ? s.sourceHost.trim() && s.sourcePath.trim() : s.sourcePath.trim();
		const destReady = s.destIsRemote ? s.destHost.trim() && s.destPath.trim() : s.destPath.trim();
		if (!srcReady || !destReady) return { cmd: '', flags: [] as string[] };
		const flags: string[] = [];
		const shortFlags: string[] = [];
		if (s.archive) { shortFlags.push('a'); flags.push('archive'); }
		if (s.verbose) { shortFlags.push('v'); flags.push('verbose'); }
		if (s.compress) { shortFlags.push('z'); flags.push('compress'); }
		if (s.humanReadable) { shortFlags.push('h'); flags.push('humanReadable'); }
		const parts = ['rsync'];
		if (shortFlags.length) parts.push('-' + shortFlags.join(''));
		if (s.delete) { parts.push('--delete'); flags.push('delete'); }
		if (s.dryRun) { parts.push('--dry-run'); flags.push('dryRun'); }
		if (s.useSsh && s.sshPort.trim()) { parts.push(`-e "ssh -p ${digits(s.sshPort)}"`); flags.push('useSsh'); }
		if (s.exclude.trim()) { parts.push(`--exclude=${escapeShell(s.exclude.trim())}`); flags.push('exclude'); }
		parts.push(rsyncEndpoint(s.sourceIsRemote, s.sourceUser, s.sourceHost, s.sourcePath));
		parts.push(rsyncEndpoint(s.destIsRemote, s.destUser, s.destHost, s.destPath));
		return { cmd: parts.join(' ').replace(/\s+/g, ' ').trim(), flags };
	}

	// --- ssh ---
	let sshState = $state({
		user: '', host: '', port: '', identityFile: '', remoteCommand: '',
		allocateTty: false, forwardAgent: false,
	});

	function buildSsh(s: typeof sshState) {
		if (!s.host.trim()) return { cmd: '', flags: [] as string[] };
		const flags: string[] = [];
		const parts = ['ssh'];
		if (s.forwardAgent) { parts.push('-A'); flags.push('forwardAgent'); }
		if (s.allocateTty) { parts.push('-t'); flags.push('allocateTty'); }
		if (s.port.trim()) { parts.push('-p', digits(s.port)); flags.push('port'); }
		if (s.identityFile.trim()) { parts.push('-i', escapeShell(s.identityFile.trim())); flags.push('identityFile'); }
		parts.push(`${s.user.trim() ? escapeShell(s.user.trim()) + '@' : ''}${escapeShell(s.host.trim())}`);
		if (s.remoteCommand.trim()) { parts.push(s.remoteCommand.trim()); flags.push('remoteCommand'); }
		return { cmd: parts.join(' ').replace(/\s+/g, ' ').trim(), flags };
	}

	// --- disk usage (du/df) ---
	let diskUsageState = $state({
		tool: 'du' as 'du' | 'df', path: '.', humanReadable: true, summarize: true, maxDepth: '',
	});

	function buildDiskUsage(s: typeof diskUsageState) {
		const flags: string[] = [s.tool];
		const path = s.path.trim() ? escapeShell(s.path.trim()) : '';
		if (s.tool === 'du') {
			const shortFlags: string[] = [];
			if (s.summarize) { shortFlags.push('s'); flags.push('summarize'); }
			if (s.humanReadable) { shortFlags.push('h'); flags.push('humanReadable'); }
			const parts = ['du'];
			if (shortFlags.length) parts.push('-' + shortFlags.join(''));
			if (!s.summarize && s.maxDepth.trim()) { parts.push(`--max-depth=${digits(s.maxDepth)}`); flags.push('maxDepth'); }
			if (path) parts.push(path);
			return { cmd: parts.join(' ').replace(/\s+/g, ' ').trim(), flags };
		}
		const parts = ['df'];
		if (s.humanReadable) { parts.push('-h'); flags.push('humanReadable'); }
		if (path) parts.push(path);
		return { cmd: parts.join(' ').replace(/\s+/g, ' ').trim(), flags };
	}

	// --- symlink (ln) ---
	let symlinkState = $state({ linkType: 'soft' as 'soft' | 'hard', target: '', linkName: '', force: false });

	function buildSymlink(s: typeof symlinkState) {
		if (!s.target.trim() || !s.linkName.trim()) return { cmd: '', flags: [] as string[] };
		const flags: string[] = [];
		const shortFlags: string[] = [];
		if (s.linkType === 'soft') { shortFlags.push('s'); flags.push('soft'); } else { flags.push('hard'); }
		if (s.force) { shortFlags.push('f'); flags.push('force'); }
		const parts = ['ln'];
		if (shortFlags.length) parts.push('-' + shortFlags.join(''));
		parts.push(escapeShell(s.target.trim()), escapeShell(s.linkName.trim()));
		return { cmd: parts.join(' ').replace(/\s+/g, ' ').trim(), flags };
	}

	// --- tar ---
	let tarState = $state({
		mode: 'pack' as 'pack' | 'unpack', compression: 'none' as 'none' | 'gzip' | 'bzip2' | 'xz',
		archiveName: 'archive.tar', sourcePaths: '', extractTo: '', verbose: true,
	});

	function buildTar(s: typeof tarState) {
		if (!s.archiveName.trim()) return { cmd: '', flags: [] as string[] };
		if (s.mode === 'pack' && !s.sourcePaths.trim()) return { cmd: '', flags: [] as string[] };
		const flags: string[] = [s.mode];
		const compLetter: Record<string, string> = { none: '', gzip: 'z', bzip2: 'j', xz: 'J' };
		if (s.compression !== 'none') flags.push(s.compression);
		if (s.verbose) flags.push('verbose');
		const letters = (s.mode === 'pack' ? 'c' : 'x') + (s.verbose ? 'v' : '') + compLetter[s.compression] + 'f';
		const parts = ['tar', `-${letters}`, escapeShell(s.archiveName.trim())];
		if (s.mode === 'pack') {
			parts.push(s.sourcePaths.trim());
		} else if (s.extractTo.trim()) {
			parts.push('-C', escapeShell(s.extractTo.trim()));
			flags.push('extractTo');
		}
		return { cmd: parts.join(' ').replace(/\s+/g, ' ').trim(), flags };
	}

	// --- find ---
	let findState = $state({
		path: '.', namePattern: '', type: 'any' as 'any' | 'f' | 'd' | 'l',
		sizeSign: '' as '' | '+' | '-', sizeValue: '', sizeUnit: 'M' as 'k' | 'M' | 'G',
		mtimeSign: '' as '' | '+' | '-', mtimeDays: '', execCmd: '',
	});

	function buildFind(s: typeof findState) {
		const flags: string[] = [];
		const parts = ['find', escapeShell(s.path.trim() || '.')];
		if (s.namePattern.trim()) { parts.push('-name', escapeShell(s.namePattern.trim())); flags.push('name'); }
		if (s.type !== 'any') { parts.push('-type', s.type); flags.push('type'); }
		const sizeN = digits(s.sizeValue);
		if (sizeN) { parts.push('-size', `${s.sizeSign}${sizeN}${s.sizeUnit}`); flags.push('size'); }
		const mtimeN = digits(s.mtimeDays);
		if (mtimeN) { parts.push('-mtime', `${s.mtimeSign}${mtimeN}`); flags.push('mtime'); }
		if (s.execCmd.trim()) { parts.push('-exec', s.execCmd.trim(), '{}', '\\;'); flags.push('exec'); }
		return { cmd: parts.join(' ').replace(/\s+/g, ' ').trim(), flags };
	}

	// --- permissions (chmod/chown) ---
	let permissionsState = $state({
		action: 'chmod' as 'chmod' | 'chown', target: '', recursive: false,
		chmodMode: 'symbolic' as 'symbolic' | 'octal', octal: '755',
		whoU: true, whoG: false, whoO: false,
		op: '+' as '+' | '-' | '=',
		permR: true, permW: true, permX: false,
		chownUser: '', chownGroup: '',
	});

	function buildPermissions(s: typeof permissionsState) {
		if (!s.target.trim()) return { cmd: '', flags: [] as string[] };
		const flags: string[] = [];
		const parts: string[] = [];
		if (s.action === 'chmod') {
			parts.push('chmod');
			if (s.recursive) { parts.push('-R'); flags.push('recursive'); }
			if (s.chmodMode === 'octal') {
				parts.push(digits(s.octal) || '755');
				flags.push('chmodOctal');
			} else {
				const who = [s.whoU && 'u', s.whoG && 'g', s.whoO && 'o'].filter(Boolean).join('') || 'a';
				const perm = [s.permR && 'r', s.permW && 'w', s.permX && 'x'].filter(Boolean).join('');
				parts.push(`${who}${s.op}${perm}`);
				flags.push('chmodSymbolic');
			}
			parts.push(escapeShell(s.target.trim()));
		} else {
			let owner = '';
			if (s.chownUser.trim() && s.chownGroup.trim()) owner = `${s.chownUser.trim()}:${s.chownGroup.trim()}`;
			else if (s.chownUser.trim()) owner = s.chownUser.trim();
			else if (s.chownGroup.trim()) owner = `:${s.chownGroup.trim()}`;
			if (!owner) return { cmd: '', flags: [] as string[] };
			parts.push('chown');
			if (s.recursive) { parts.push('-R'); flags.push('recursive'); }
			parts.push(owner, escapeShell(s.target.trim()));
			flags.push('chown');
		}
		return { cmd: parts.join(' ').replace(/\s+/g, ' ').trim(), flags };
	}

	// --- grep ---
	let grepState = $state({
		pattern: '', path: '.', recursive: false, ignoreCase: false, lineNumbers: true,
		invertMatch: false, filesOnly: false, wordMatch: false,
		contextMode: 'none' as 'none' | 'A' | 'B' | 'C', contextLines: '3',
	});

	function buildGrep(s: typeof grepState) {
		if (!s.pattern.trim()) return { cmd: '', flags: [] as string[] };
		const flags: string[] = [];
		const shortFlags: string[] = [];
		if (s.recursive) { shortFlags.push('r'); flags.push('recursive'); }
		if (s.ignoreCase) { shortFlags.push('i'); flags.push('ignoreCase'); }
		if (s.lineNumbers) { shortFlags.push('n'); flags.push('lineNumbers'); }
		if (s.invertMatch) { shortFlags.push('v'); flags.push('invertMatch'); }
		if (s.filesOnly) { shortFlags.push('l'); flags.push('filesOnly'); }
		if (s.wordMatch) { shortFlags.push('w'); flags.push('wordMatch'); }
		const parts = ['grep'];
		if (shortFlags.length) parts.push('-' + shortFlags.join(''));
		if (s.contextMode !== 'none') {
			const n = digits(s.contextLines) || '3';
			parts.push(`-${s.contextMode}`, n);
			flags.push('context');
		}
		parts.push(escapeShell(s.pattern.trim()));
		if (s.path.trim()) parts.push(escapeShell(s.path.trim()));
		return { cmd: parts.join(' ').replace(/\s+/g, ' ').trim(), flags };
	}

	// --- ssh-keygen ---
	let sshKeygenState = $state({
		keyType: 'ed25519' as 'ed25519' | 'rsa' | 'ecdsa', bits: '4096',
		outputFile: '', comment: '', noPassphrase: false,
	});

	function buildSshKeygen(s: typeof sshKeygenState) {
		const flags: string[] = ['keyType'];
		const parts = ['ssh-keygen', '-t', s.keyType];
		if (s.keyType === 'rsa' && digits(s.bits)) { parts.push('-b', digits(s.bits)); flags.push('bits'); }
		if (s.outputFile.trim()) { parts.push('-f', escapeShell(s.outputFile.trim())); flags.push('outputFile'); }
		if (s.comment.trim()) { parts.push('-C', escapeShell(s.comment.trim())); flags.push('comment'); }
		if (s.noPassphrase) { parts.push('-N', '""'); flags.push('noPassphrase'); }
		return { cmd: parts.join(' ').replace(/\s+/g, ' ').trim(), flags };
	}

	let built = $derived.by(() => {
		switch (mode) {
			case 'rsync': return buildRsync(rsyncState);
			case 'ssh': return buildSsh(sshState);
			case 'diskUsage': return buildDiskUsage(diskUsageState);
			case 'symlink': return buildSymlink(symlinkState);
			case 'tar': return buildTar(tarState);
			case 'find': return buildFind(findState);
			case 'permissions': return buildPermissions(permissionsState);
			case 'grep': return buildGrep(grepState);
			case 'sshKeygen': return buildSshKeygen(sshKeygenState);
		}
	});
	let command = $derived(built.cmd);
	let activeFlags = $derived(built.flags);
	let isReady = $derived(!!command);

	let explanationItems = $derived.by(() => {
		const dict = ($t('linuxCommandGenerator').explain as Record<string, Record<string, string>>)[mode] ?? {};
		return activeFlags.map((key) => ({ key, text: dict[key] ?? key }));
	});

	function copy() {
		navigator.clipboard.writeText(command);
		copied = true;
		setTimeout(() => { copied = false; }, 1500);
	}
</script>

<div class="space-y-4">
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('linuxCommandGenerator').modeGroupLabel}</h2>
		<div class="flex flex-wrap gap-2" role="group" aria-label={$t('linuxCommandGenerator').modeGroupLabel}>
			{#each MODES as m}
				<button
					onclick={() => mode = m.key}
					aria-pressed={mode === m.key}
					class="text-xs px-3 py-1.5 rounded-lg font-mono transition-colors
						{mode === m.key ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700'}"
				>{m.label}</button>
			{/each}
		</div>
	</div>

	<div class="bg-slate-800 rounded-xl p-6 space-y-5">
		{#if mode === 'rsync'}
			{@const lc = $t('linuxCommandGenerator').rsync}
			<p class="text-sm text-slate-300">{lc.description}</p>
			<fieldset class="space-y-3">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.sourceLegend}</legend>
				<div role="group" aria-label={lc.sourceLegend} class="flex gap-2">
					<button onclick={() => rsyncState.sourceIsRemote = false} aria-pressed={!rsyncState.sourceIsRemote}
						class="text-xs px-3 py-1.5 rounded-lg transition-colors {!rsyncState.sourceIsRemote ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.localLabel}</button>
					<button onclick={() => rsyncState.sourceIsRemote = true} aria-pressed={rsyncState.sourceIsRemote}
						class="text-xs px-3 py-1.5 rounded-lg transition-colors {rsyncState.sourceIsRemote ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.remoteLabel}</button>
				</div>
				{#if rsyncState.sourceIsRemote}
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div>
							<label for="rsync-source-user" class="block text-xs text-slate-300 mb-1.5">{lc.user}</label>
							<input id="rsync-source-user" type="text" bind:value={rsyncState.sourceUser} placeholder={lc.userPlaceholder}
								class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
						</div>
						<div>
							<label for="rsync-source-host" class="block text-xs text-slate-300 mb-1.5">{lc.host}</label>
							<input id="rsync-source-host" type="text" bind:value={rsyncState.sourceHost} placeholder={lc.hostPlaceholder}
								class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
						</div>
						<div>
							<label for="rsync-source-path" class="block text-xs text-slate-300 mb-1.5">{lc.path}</label>
							<input id="rsync-source-path" type="text" bind:value={rsyncState.sourcePath} placeholder={lc.pathPlaceholderRemote}
								class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
						</div>
					</div>
				{:else}
					<div>
						<label for="rsync-source-path-local" class="block text-xs text-slate-300 mb-1.5">{lc.path}</label>
						<input id="rsync-source-path-local" type="text" bind:value={rsyncState.sourcePath} placeholder={lc.pathPlaceholderLocal}
							class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
					</div>
				{/if}
			</fieldset>
			<fieldset class="space-y-3">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.destLegend}</legend>
				<div role="group" aria-label={lc.destLegend} class="flex gap-2">
					<button onclick={() => rsyncState.destIsRemote = false} aria-pressed={!rsyncState.destIsRemote}
						class="text-xs px-3 py-1.5 rounded-lg transition-colors {!rsyncState.destIsRemote ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.localLabel}</button>
					<button onclick={() => rsyncState.destIsRemote = true} aria-pressed={rsyncState.destIsRemote}
						class="text-xs px-3 py-1.5 rounded-lg transition-colors {rsyncState.destIsRemote ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.remoteLabel}</button>
				</div>
				{#if rsyncState.destIsRemote}
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div>
							<label for="rsync-dest-user" class="block text-xs text-slate-300 mb-1.5">{lc.user}</label>
							<input id="rsync-dest-user" type="text" bind:value={rsyncState.destUser} placeholder={lc.userPlaceholder}
								class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
						</div>
						<div>
							<label for="rsync-dest-host" class="block text-xs text-slate-300 mb-1.5">{lc.host}</label>
							<input id="rsync-dest-host" type="text" bind:value={rsyncState.destHost} placeholder={lc.hostPlaceholder}
								class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
						</div>
						<div>
							<label for="rsync-dest-path" class="block text-xs text-slate-300 mb-1.5">{lc.path}</label>
							<input id="rsync-dest-path" type="text" bind:value={rsyncState.destPath} placeholder={lc.pathPlaceholderRemote}
								class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
						</div>
					</div>
				{:else}
					<div>
						<label for="rsync-dest-path-local" class="block text-xs text-slate-300 mb-1.5">{lc.path}</label>
						<input id="rsync-dest-path-local" type="text" bind:value={rsyncState.destPath} placeholder={lc.pathPlaceholderLocal}
							class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
					</div>
				{/if}
			</fieldset>
			<fieldset class="space-y-2">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.optionsLegend}</legend>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
					<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={rsyncState.archive} class="rounded border-slate-600 bg-slate-900" />{lc.archive}</label>
					<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={rsyncState.verbose} class="rounded border-slate-600 bg-slate-900" />{lc.verbose}</label>
					<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={rsyncState.compress} class="rounded border-slate-600 bg-slate-900" />{lc.compress}</label>
					<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={rsyncState.humanReadable} class="rounded border-slate-600 bg-slate-900" />{lc.humanReadable}</label>
					<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={rsyncState.delete} class="rounded border-slate-600 bg-slate-900" />{lc.delete}</label>
					<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={rsyncState.dryRun} class="rounded border-slate-600 bg-slate-900" />{lc.dryRun}</label>
				</div>
				<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={rsyncState.useSsh} class="rounded border-slate-600 bg-slate-900" />{lc.useSsh}</label>
				{#if rsyncState.useSsh}
					<div class="max-w-[10rem]">
						<label for="rsync-ssh-port" class="block text-xs text-slate-300 mb-1.5">{lc.sshPort}</label>
						<input id="rsync-ssh-port" type="text" inputmode="numeric" bind:value={rsyncState.sshPort} placeholder={lc.sshPortPlaceholder}
							class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
					</div>
				{/if}
				<div>
					<label for="rsync-exclude" class="block text-xs text-slate-300 mb-1.5">{lc.exclude}</label>
					<input id="rsync-exclude" type="text" bind:value={rsyncState.exclude} placeholder={lc.excludePlaceholder}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
				</div>
			</fieldset>
		{:else if mode === 'ssh'}
			{@const lc = $t('linuxCommandGenerator').ssh}
			<p class="text-sm text-slate-300">{lc.description}</p>
			<fieldset class="space-y-3">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.connectionLegend}</legend>
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div>
						<label for="ssh-user" class="block text-xs text-slate-300 mb-1.5">{lc.user}</label>
						<input id="ssh-user" type="text" bind:value={sshState.user} placeholder={lc.userPlaceholder}
							class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
					</div>
					<div>
						<label for="ssh-host" class="block text-xs text-slate-300 mb-1.5">{lc.host}</label>
						<input id="ssh-host" type="text" bind:value={sshState.host} placeholder={lc.hostPlaceholder}
							class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
					</div>
					<div>
						<label for="ssh-port" class="block text-xs text-slate-300 mb-1.5">{lc.port}</label>
						<input id="ssh-port" type="text" inputmode="numeric" bind:value={sshState.port} placeholder={lc.portPlaceholder}
							class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
					</div>
				</div>
				<div>
					<label for="ssh-identity" class="block text-xs text-slate-300 mb-1.5">{lc.identityFile}</label>
					<input id="ssh-identity" type="text" bind:value={sshState.identityFile} placeholder={lc.identityFilePlaceholder}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
				</div>
			</fieldset>
			<fieldset class="space-y-2">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.optionsLegend}</legend>
				<div>
					<label for="ssh-remote-cmd" class="block text-xs text-slate-300 mb-1.5">{lc.remoteCommand}</label>
					<input id="ssh-remote-cmd" type="text" bind:value={sshState.remoteCommand} placeholder={lc.remoteCommandPlaceholder}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
				</div>
				<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={sshState.allocateTty} class="rounded border-slate-600 bg-slate-900" />{lc.allocateTty}</label>
				<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={sshState.forwardAgent} class="rounded border-slate-600 bg-slate-900" />{lc.forwardAgent}</label>
			</fieldset>
		{:else if mode === 'diskUsage'}
			{@const lc = $t('linuxCommandGenerator').diskUsage}
			<p class="text-sm text-slate-300">{lc.description}</p>
			<fieldset class="space-y-3">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.optionsLegend}</legend>
				<div role="group" aria-label={lc.toolGroupLabel} class="flex gap-2">
					<button onclick={() => diskUsageState.tool = 'du'} aria-pressed={diskUsageState.tool === 'du'}
						class="text-xs px-3 py-1.5 rounded-lg font-mono transition-colors {diskUsageState.tool === 'du' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.duLabel}</button>
					<button onclick={() => diskUsageState.tool = 'df'} aria-pressed={diskUsageState.tool === 'df'}
						class="text-xs px-3 py-1.5 rounded-lg font-mono transition-colors {diskUsageState.tool === 'df' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.dfLabel}</button>
				</div>
				<div>
					<label for="du-path" class="block text-xs text-slate-300 mb-1.5">{lc.path}</label>
					<input id="du-path" type="text" bind:value={diskUsageState.path} placeholder={lc.pathPlaceholder}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
				</div>
				<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={diskUsageState.humanReadable} class="rounded border-slate-600 bg-slate-900" />{lc.humanReadable}</label>
				{#if diskUsageState.tool === 'du'}
					<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={diskUsageState.summarize} class="rounded border-slate-600 bg-slate-900" />{lc.summarize}</label>
					{#if !diskUsageState.summarize}
						<div class="max-w-[10rem]">
							<label for="du-max-depth" class="block text-xs text-slate-300 mb-1.5">{lc.maxDepth}</label>
							<input id="du-max-depth" type="text" inputmode="numeric" bind:value={diskUsageState.maxDepth} placeholder={lc.maxDepthPlaceholder}
								class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
						</div>
					{/if}
				{/if}
			</fieldset>
		{:else if mode === 'symlink'}
			{@const lc = $t('linuxCommandGenerator').symlink}
			<p class="text-sm text-slate-300">{lc.description}</p>
			<fieldset class="space-y-3">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.detailsLegend}</legend>
				<div role="group" aria-label={lc.typeGroupLabel} class="flex gap-2">
					<button onclick={() => symlinkState.linkType = 'soft'} aria-pressed={symlinkState.linkType === 'soft'}
						class="text-xs px-3 py-1.5 rounded-lg transition-colors {symlinkState.linkType === 'soft' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.softLabel}</button>
					<button onclick={() => symlinkState.linkType = 'hard'} aria-pressed={symlinkState.linkType === 'hard'}
						class="text-xs px-3 py-1.5 rounded-lg transition-colors {symlinkState.linkType === 'hard' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.hardLabel}</button>
				</div>
				<div>
					<label for="ln-target" class="block text-xs text-slate-300 mb-1.5">{lc.target}</label>
					<input id="ln-target" type="text" bind:value={symlinkState.target} placeholder={lc.targetPlaceholder}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
				</div>
				<div>
					<label for="ln-name" class="block text-xs text-slate-300 mb-1.5">{lc.linkName}</label>
					<input id="ln-name" type="text" bind:value={symlinkState.linkName} placeholder={lc.linkNamePlaceholder}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
				</div>
				<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={symlinkState.force} class="rounded border-slate-600 bg-slate-900" />{lc.force}</label>
			</fieldset>
		{:else if mode === 'tar'}
			{@const lc = $t('linuxCommandGenerator').tar}
			<p class="text-sm text-slate-300">{lc.description}</p>
			<fieldset class="space-y-3">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.archiveLegend}</legend>
				<div role="group" aria-label={lc.packModeGroupLabel} class="flex gap-2">
					<button onclick={() => tarState.mode = 'pack'} aria-pressed={tarState.mode === 'pack'}
						class="text-xs px-3 py-1.5 rounded-lg transition-colors {tarState.mode === 'pack' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.packLabel}</button>
					<button onclick={() => tarState.mode = 'unpack'} aria-pressed={tarState.mode === 'unpack'}
						class="text-xs px-3 py-1.5 rounded-lg transition-colors {tarState.mode === 'unpack' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.unpackLabel}</button>
				</div>
				<div role="group" aria-label={lc.compressionGroupLabel} class="flex flex-wrap gap-2">
					{#each [['none', lc.noneLabel], ['gzip', lc.gzipLabel], ['bzip2', lc.bzip2Label], ['xz', lc.xzLabel]] as [key, label]}
						<button onclick={() => tarState.compression = key as typeof tarState.compression} aria-pressed={tarState.compression === key}
							class="text-xs px-3 py-1.5 rounded-lg transition-colors {tarState.compression === key ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{label}</button>
					{/each}
				</div>
				<div>
					<label for="tar-name" class="block text-xs text-slate-300 mb-1.5">{lc.archiveName}</label>
					<input id="tar-name" type="text" bind:value={tarState.archiveName} placeholder={lc.archiveNamePlaceholder}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
				</div>
			</fieldset>
			<fieldset class="space-y-2">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.filesLegend}</legend>
				{#if tarState.mode === 'pack'}
					<div>
						<label for="tar-source-paths" class="block text-xs text-slate-300 mb-1.5">{lc.sourcePaths}</label>
						<input id="tar-source-paths" type="text" bind:value={tarState.sourcePaths} placeholder={lc.sourcePathsPlaceholder}
							class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
						<p class="text-xs text-slate-300 mt-1">{lc.sourcePathsHint}</p>
					</div>
				{:else}
					<div>
						<label for="tar-extract-to" class="block text-xs text-slate-300 mb-1.5">{lc.extractTo}</label>
						<input id="tar-extract-to" type="text" bind:value={tarState.extractTo} placeholder={lc.extractToPlaceholder}
							class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
					</div>
				{/if}
				<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={tarState.verbose} class="rounded border-slate-600 bg-slate-900" />{lc.verbose}</label>
			</fieldset>
		{:else if mode === 'find'}
			{@const lc = $t('linuxCommandGenerator').find}
			<p class="text-sm text-slate-300">{lc.description}</p>
			<fieldset class="space-y-3">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.locationLegend}</legend>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label for="find-path" class="block text-xs text-slate-300 mb-1.5">{lc.path}</label>
						<input id="find-path" type="text" bind:value={findState.path} placeholder={lc.pathPlaceholder}
							class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
					</div>
					<div>
						<label for="find-name" class="block text-xs text-slate-300 mb-1.5">{lc.namePattern}</label>
						<input id="find-name" type="text" bind:value={findState.namePattern} placeholder={lc.namePatternPlaceholder}
							class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
					</div>
				</div>
				<div class="max-w-xs">
					<label for="find-type" class="block text-xs text-slate-300 mb-1.5">{lc.type}</label>
					<select id="find-type" bind:value={findState.type}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm">
						<option value="any">{lc.typeAny}</option>
						<option value="f">{lc.typeFile}</option>
						<option value="d">{lc.typeDir}</option>
						<option value="l">{lc.typeLink}</option>
					</select>
				</div>
			</fieldset>
			<fieldset class="space-y-3">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.filtersLegend}</legend>
				<div>
					<span class="block text-xs text-slate-300 mb-1.5">{lc.sizeLabel}</span>
					<div class="flex gap-2">
						<select aria-label={lc.sizeLabel} bind:value={findState.sizeSign}
							class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm">
							<option value="">{lc.signExact}</option>
							<option value="+">{lc.signPlus}</option>
							<option value="-">{lc.signMinus}</option>
						</select>
						<input type="text" inputmode="numeric" bind:value={findState.sizeValue} placeholder={lc.sizeValuePlaceholder} aria-label={lc.sizeLabel}
							class="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
						<select aria-label={lc.sizeLabel} bind:value={findState.sizeUnit}
							class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm">
							<option value="k">{lc.unitK}</option>
							<option value="M">{lc.unitM}</option>
							<option value="G">{lc.unitG}</option>
						</select>
					</div>
				</div>
				<div>
					<span class="block text-xs text-slate-300 mb-1.5">{lc.mtimeLabel}</span>
					<div class="flex gap-2">
						<select aria-label={lc.mtimeLabel} bind:value={findState.mtimeSign}
							class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm">
							<option value="">{lc.signExact}</option>
							<option value="+">{lc.signPlus}</option>
							<option value="-">{lc.signMinus}</option>
						</select>
						<input type="text" inputmode="numeric" bind:value={findState.mtimeDays} placeholder={lc.mtimeDaysPlaceholder} aria-label={lc.mtimeLabel}
							class="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
					</div>
				</div>
			</fieldset>
			<fieldset class="space-y-2">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.actionLegend}</legend>
				<div>
					<label for="find-exec" class="block text-xs text-slate-300 mb-1.5">{lc.execCmd}</label>
					<input id="find-exec" type="text" bind:value={findState.execCmd} placeholder={lc.execCmdPlaceholder}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
					<p class="text-xs text-slate-300 mt-1">{lc.execCmdHint}</p>
				</div>
			</fieldset>
		{:else if mode === 'permissions'}
			{@const lc = $t('linuxCommandGenerator').permissions}
			<p class="text-sm text-slate-300">{lc.description}</p>
			<fieldset class="space-y-3">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.targetLegend}</legend>
				<div role="group" aria-label={lc.actionGroupLabel} class="flex gap-2">
					<button onclick={() => permissionsState.action = 'chmod'} aria-pressed={permissionsState.action === 'chmod'}
						class="text-xs px-3 py-1.5 rounded-lg font-mono transition-colors {permissionsState.action === 'chmod' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.chmodLabel}</button>
					<button onclick={() => permissionsState.action = 'chown'} aria-pressed={permissionsState.action === 'chown'}
						class="text-xs px-3 py-1.5 rounded-lg font-mono transition-colors {permissionsState.action === 'chown' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.chownLabel}</button>
				</div>
				<div>
					<label for="perm-target" class="block text-xs text-slate-300 mb-1.5">{lc.target}</label>
					<input id="perm-target" type="text" bind:value={permissionsState.target} placeholder={lc.targetPlaceholder}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
				</div>
				<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={permissionsState.recursive} class="rounded border-slate-600 bg-slate-900" />{lc.recursive}</label>
			</fieldset>
			{#if permissionsState.action === 'chmod'}
				<fieldset class="space-y-3">
					<legend class="text-xs text-slate-300 font-medium uppercase">{lc.chmodLegend}</legend>
					<div role="group" aria-label={lc.chmodModeGroupLabel} class="flex gap-2">
						<button onclick={() => permissionsState.chmodMode = 'symbolic'} aria-pressed={permissionsState.chmodMode === 'symbolic'}
							class="text-xs px-3 py-1.5 rounded-lg transition-colors {permissionsState.chmodMode === 'symbolic' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.symbolicLabel}</button>
						<button onclick={() => permissionsState.chmodMode = 'octal'} aria-pressed={permissionsState.chmodMode === 'octal'}
							class="text-xs px-3 py-1.5 rounded-lg transition-colors {permissionsState.chmodMode === 'octal' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.octalLabel}</button>
					</div>
					{#if permissionsState.chmodMode === 'octal'}
						<div class="max-w-[10rem]">
							<label for="perm-octal" class="block text-xs text-slate-300 mb-1.5">{lc.octal}</label>
							<input id="perm-octal" type="text" inputmode="numeric" bind:value={permissionsState.octal} placeholder={lc.octalPlaceholder}
								class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
						</div>
					{:else}
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div role="group" aria-label={lc.whoLabel}>
								<span class="block text-xs text-slate-300 mb-1.5">{lc.whoLabel}</span>
								<div class="space-y-1">
									<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={permissionsState.whoU} class="rounded border-slate-600 bg-slate-900" />{lc.whoU}</label>
									<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={permissionsState.whoG} class="rounded border-slate-600 bg-slate-900" />{lc.whoG}</label>
									<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={permissionsState.whoO} class="rounded border-slate-600 bg-slate-900" />{lc.whoO}</label>
								</div>
							</div>
							<div>
								<label for="perm-op" class="block text-xs text-slate-300 mb-1.5">{lc.opLabel}</label>
								<select id="perm-op" bind:value={permissionsState.op}
									class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm">
									<option value="+">{lc.opAdd}</option>
									<option value="-">{lc.opRemove}</option>
									<option value="=">{lc.opSet}</option>
								</select>
							</div>
							<div role="group" aria-label={lc.permLabel}>
								<span class="block text-xs text-slate-300 mb-1.5">{lc.permLabel}</span>
								<div class="space-y-1">
									<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={permissionsState.permR} class="rounded border-slate-600 bg-slate-900" />{lc.permR}</label>
									<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={permissionsState.permW} class="rounded border-slate-600 bg-slate-900" />{lc.permW}</label>
									<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={permissionsState.permX} class="rounded border-slate-600 bg-slate-900" />{lc.permX}</label>
								</div>
							</div>
						</div>
					{/if}
				</fieldset>
			{:else}
				<fieldset class="space-y-3">
					<legend class="text-xs text-slate-300 font-medium uppercase">{lc.chownLegend}</legend>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label for="perm-chown-user" class="block text-xs text-slate-300 mb-1.5">{lc.chownUser}</label>
							<input id="perm-chown-user" type="text" bind:value={permissionsState.chownUser} placeholder={lc.chownUserPlaceholder}
								class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
						</div>
						<div>
							<label for="perm-chown-group" class="block text-xs text-slate-300 mb-1.5">{lc.chownGroup}</label>
							<input id="perm-chown-group" type="text" bind:value={permissionsState.chownGroup} placeholder={lc.chownGroupPlaceholder}
								class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
						</div>
					</div>
				</fieldset>
			{/if}
		{:else if mode === 'grep'}
			{@const lc = $t('linuxCommandGenerator').grep}
			<p class="text-sm text-slate-300">{lc.description}</p>
			<fieldset class="space-y-3">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.searchLegend}</legend>
				<div>
					<label for="grep-pattern" class="block text-xs text-slate-300 mb-1.5">{lc.pattern}</label>
					<input id="grep-pattern" type="text" bind:value={grepState.pattern} placeholder={lc.patternPlaceholder}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
				</div>
				<div>
					<label for="grep-path" class="block text-xs text-slate-300 mb-1.5">{lc.path}</label>
					<input id="grep-path" type="text" bind:value={grepState.path} placeholder={lc.pathPlaceholder}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
				</div>
			</fieldset>
			<fieldset class="space-y-3">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.optionsLegend}</legend>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
					<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={grepState.recursive} class="rounded border-slate-600 bg-slate-900" />{lc.recursive}</label>
					<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={grepState.ignoreCase} class="rounded border-slate-600 bg-slate-900" />{lc.ignoreCase}</label>
					<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={grepState.lineNumbers} class="rounded border-slate-600 bg-slate-900" />{lc.lineNumbers}</label>
					<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={grepState.invertMatch} class="rounded border-slate-600 bg-slate-900" />{lc.invertMatch}</label>
					<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={grepState.filesOnly} class="rounded border-slate-600 bg-slate-900" />{lc.filesOnly}</label>
					<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={grepState.wordMatch} class="rounded border-slate-600 bg-slate-900" />{lc.wordMatch}</label>
				</div>
				<div>
					<label for="grep-context" class="block text-xs text-slate-300 mb-1.5">{lc.contextLabel}</label>
					<div class="flex gap-2">
						<select id="grep-context" bind:value={grepState.contextMode}
							class="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-violet-500 text-sm">
							<option value="none">{lc.contextNone}</option>
							<option value="A">{lc.contextA}</option>
							<option value="B">{lc.contextB}</option>
							<option value="C">{lc.contextC}</option>
						</select>
						{#if grepState.contextMode !== 'none'}
							<input type="text" inputmode="numeric" bind:value={grepState.contextLines} placeholder={lc.contextLinesPlaceholder} aria-label={lc.contextLabel}
								class="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
						{/if}
					</div>
				</div>
			</fieldset>
		{:else if mode === 'sshKeygen'}
			{@const lc = $t('linuxCommandGenerator').sshKeygen}
			<p class="text-sm text-slate-300">{lc.description}</p>
			<fieldset class="space-y-3">
				<legend class="text-xs text-slate-300 font-medium uppercase">{lc.optionsLegend}</legend>
				<div role="group" aria-label={lc.keyTypeGroupLabel} class="flex gap-2">
					<button onclick={() => sshKeygenState.keyType = 'ed25519'} aria-pressed={sshKeygenState.keyType === 'ed25519'}
						class="text-xs px-3 py-1.5 rounded-lg font-mono transition-colors {sshKeygenState.keyType === 'ed25519' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.ed25519Label}</button>
					<button onclick={() => sshKeygenState.keyType = 'rsa'} aria-pressed={sshKeygenState.keyType === 'rsa'}
						class="text-xs px-3 py-1.5 rounded-lg font-mono transition-colors {sshKeygenState.keyType === 'rsa' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.rsaLabel}</button>
					<button onclick={() => sshKeygenState.keyType = 'ecdsa'} aria-pressed={sshKeygenState.keyType === 'ecdsa'}
						class="text-xs px-3 py-1.5 rounded-lg font-mono transition-colors {sshKeygenState.keyType === 'ecdsa' ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-white'}">{lc.ecdsaLabel}</button>
				</div>
				{#if sshKeygenState.keyType === 'rsa'}
					<div class="max-w-[10rem]">
						<label for="keygen-bits" class="block text-xs text-slate-300 mb-1.5">{lc.bits}</label>
						<input id="keygen-bits" type="text" inputmode="numeric" bind:value={sshKeygenState.bits} placeholder={lc.bitsPlaceholder}
							class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
					</div>
				{/if}
				<div>
					<label for="keygen-output" class="block text-xs text-slate-300 mb-1.5">{lc.outputFile}</label>
					<input id="keygen-output" type="text" bind:value={sshKeygenState.outputFile} placeholder={lc.outputFilePlaceholder}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
				</div>
				<div>
					<label for="keygen-comment" class="block text-xs text-slate-300 mb-1.5">{lc.comment}</label>
					<input id="keygen-comment" type="text" bind:value={sshKeygenState.comment} placeholder={lc.commentPlaceholder}
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-500 text-sm font-mono" />
				</div>
				<label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" bind:checked={sshKeygenState.noPassphrase} class="rounded border-slate-600 bg-slate-900" />{lc.noPassphrase}</label>
			</fieldset>
		{/if}
	</div>

	<div class="bg-slate-800 rounded-xl p-6 space-y-3" aria-live="polite">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('linuxCommandGenerator').generatedCommand}</h2>
		{#if isReady}
			<div class="flex items-start gap-2">
				<code class="flex-1 block bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-emerald-400 font-mono text-sm break-all">{command}</code>
				<button onclick={copy} class="shrink-0 text-xs px-3 py-3 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white transition-colors">
					{copied ? $t('linuxCommandGenerator').copied : $t('linuxCommandGenerator').copy}
				</button>
			</div>
		{:else}
			<p class="text-sm text-slate-300">{$t('linuxCommandGenerator').fillRequired}</p>
		{/if}
	</div>

	{#if isReady && explanationItems.length > 0}
		<div class="bg-slate-800 rounded-xl p-6">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('linuxCommandGenerator').explanationTitle}</h2>
			<dl class="space-y-2">
				{#each explanationItems as item (item.key)}
					<div>
						<dt class="font-mono text-violet-300 text-xs">{item.key}</dt>
						<dd class="text-slate-300 text-sm">{item.text}</dd>
					</div>
				{/each}
			</dl>
		</div>
	{/if}
</div>
