<script lang="ts">
	import { t } from '$lib/i18n';

	let tab = $state<'single' | 'multi'>('single');
	let singleInput = $state('');
	let multiInput = $state('');

	interface EmailResult {
		address: string;
		valid: boolean;
		localPart: { value: string; ok: boolean };
		at: boolean;
		domain: { value: string; ok: boolean };
		tld: { value: string; ok: boolean };
		reason?: string;
	}

	function validateEmail(email: string): EmailResult {
		const trimmed = email.trim();
		const atIdx = trimmed.lastIndexOf('@');

		if (atIdx < 1) return {
			address: trimmed, valid: false,
			localPart: { value: trimmed, ok: false },
			at: false,
			domain: { value: '', ok: false },
			tld: { value: '', ok: false },
			reason: 'Missing @',
		};

		const local = trimmed.slice(0, atIdx);
		const domainFull = trimmed.slice(atIdx + 1);
		const dotIdx = domainFull.lastIndexOf('.');
		const domain = dotIdx > 0 ? domainFull.slice(0, dotIdx) : domainFull;
		const tld = dotIdx > 0 ? domainFull.slice(dotIdx + 1) : '';

		const localOk = /^[a-zA-Z0-9._%+\-]+$/.test(local) && local.length > 0 && !local.startsWith('.') && !local.endsWith('.');
		const domainOk = /^[a-zA-Z0-9\-]+(\.[a-zA-Z0-9\-]+)*$/.test(domainFull) && domainFull.length > 0 && !domainFull.startsWith('-');
		const tldOk = /^[a-zA-Z]{2,}$/.test(tld);

		const valid = localOk && domainOk && tldOk;
		let reason: string | undefined;
		if (!localOk)  reason = `Invalid local part: "${local}"`;
		else if (!domainOk) reason = `Invalid domain: "${domainFull}"`;
		else if (!tldOk)    reason = `Invalid TLD: "${tld}"`;

		return {
			address: trimmed, valid,
			localPart: { value: local, ok: localOk },
			at: true,
			domain: { value: domain, ok: domainOk },
			tld: { value: tld, ok: tldOk },
			reason,
		};
	}

	let singleResult = $derived(singleInput.trim() ? validateEmail(singleInput) : null);

	let multiResults = $derived.by(() => {
		if (!multiInput.trim()) return [];
		return multiInput.split('\n').filter(l => l.trim()).map(l => validateEmail(l.trim()));
	});

	const ok = 'text-emerald-400';
	const bad = 'text-red-300';

	function statusIcon(v: boolean) { return v ? '✓' : '✗'; }
</script>

<div class="space-y-4">
	<!-- Tab selector -->
	<div class="flex gap-2">
		{#each [['single', $t('emailValidator').singleTab], ['multi', $t('emailValidator').multiTab]] as [key, label]}
			<button
				onclick={() => tab = key as 'single' | 'multi'}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {tab === key ? 'bg-violet-700 text-white' : 'bg-slate-800 text-slate-300 hover:text-slate-100'}"
			>{label}</button>
		{/each}
	</div>

	{#if tab === 'single'}
		<div class="bg-slate-800 rounded-xl p-6 space-y-4">
			<div>
				<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" for="ev-input">{$t('emailValidator').input}</label>
				<input
					id="ev-input"
					type="text"
					bind:value={singleInput}
					placeholder={$t('emailValidator').placeholder}
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500"
					spellcheck="false"
					autocomplete="off"
				/>
			</div>

			{#if singleResult}
				<div class="bg-slate-900 rounded-lg p-4 space-y-3">
					<div class="flex items-center gap-3">
						<span class="text-2xl {singleResult.valid ? ok : bad}">{singleResult.valid ? '✓' : '✗'}</span>
						<div>
							<span class="text-sm font-medium {singleResult.valid ? ok : bad}">
								{singleResult.valid ? $t('emailValidator').valid : $t('emailValidator').invalid}
							</span>
							{#if singleResult.reason && !singleResult.valid}
								<p class="text-xs text-red-300 mt-0.5">{singleResult.reason}</p>
							{/if}
						</div>
					</div>

					<div class="grid grid-cols-2 gap-2 text-xs mt-2">
						{#each [
							[$t('emailValidator').localPart, singleResult.localPart.value, singleResult.localPart.ok],
							[$t('emailValidator').at, '@', singleResult.at],
							[$t('emailValidator').domain, singleResult.domain.value, singleResult.domain.ok],
							[$t('emailValidator').tld, singleResult.tld.value, singleResult.tld.ok],
						] as [label, value, valid]}
							<div class="bg-slate-800 rounded-lg px-3 py-2">
								<div class="text-slate-400 mb-0.5">{label}</div>
								<div class="flex items-center gap-1.5">
									<span class="{valid ? ok : bad} font-mono">{value || '—'}</span>
									<span class="{valid ? ok : bad}">{statusIcon(valid as boolean)}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

	{:else}
		<div class="bg-slate-800 rounded-xl p-6 space-y-4">
			<div>
				<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2" for="ev-multi">{$t('emailValidator').multiTab}</label>
				<textarea
					id="ev-multi"
					bind:value={multiInput}
					placeholder={$t('emailValidator').multiPlaceholder}
					rows="8"
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-y"
					spellcheck="false"
				></textarea>
			</div>

			{#if multiResults.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full text-xs">
						<thead class="text-slate-400 border-b border-slate-700">
							<tr>
								<th class="text-left pb-2 pr-3">{$t('emailValidator').address}</th>
								<th class="text-left pb-2 pr-3">{$t('emailValidator').status}</th>
								<th class="text-left pb-2">{$t('emailValidator').reason}</th>
							</tr>
						</thead>
						<tbody>
							{#each multiResults as r}
								<tr class="border-b border-slate-800/50">
									<td class="py-1.5 pr-3 font-mono text-slate-300 break-all">{r.address}</td>
									<td class="py-1.5 pr-3 font-medium {r.valid ? ok : bad}">{r.valid ? $t('emailValidator').valid : $t('emailValidator').invalid}</td>
									<td class="py-1.5 text-slate-400">{r.reason ?? '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<p class="mt-3 text-xs text-slate-400">
						<span class="text-emerald-400">{multiResults.filter(r => r.valid).length}</span> {$t('emailValidator').valid} /
						<span class="text-red-300">{multiResults.filter(r => !r.valid).length}</span> {$t('emailValidator').invalid}
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
