<script lang="ts">
	import { t } from '$lib/i18n';
	import { onMount } from 'svelte';

	interface GeoInfo { country_name?: string; region?: string; city?: string; org?: string; asn?: string; }
	interface IpData { ip: string; geo: GeoInfo | null; error: boolean; }

	let ipv4 = $state<IpData | null>(null);
	let ipv6 = $state<IpData | null>(null);
	let loading = $state(true);

	// CIDR calculator
	let cidrIp   = $state('');
	let cidrPfx  = $state('24');
	let cidrTest = $state('');

	async function fetchIp(url: string): Promise<string> {
		const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
		const data = await res.json();
		return data.ip as string;
	}

	async function fetchGeo(ip: string): Promise<GeoInfo | null> {
		try {
			const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(5000) });
			return await res.json() as GeoInfo;
		} catch { return null; }
	}

	onMount(async () => {
		loading = true;
		const results = await Promise.allSettled([
			fetchIp('https://api.ipify.org?format=json'),
			fetchIp('https://api64.ipify.org?format=json'),
		]);

		const v4ip = results[0].status === 'fulfilled' ? results[0].value : null;
		const v6ip = results[1].status === 'fulfilled' ? results[1].value : null;
		// api64 returns IPv4 if no IPv6 available — detect true IPv6
		const trueV6 = v6ip && v6ip !== v4ip && v6ip.includes(':') ? v6ip : null;

		const [geo4, geo6] = await Promise.all([
			v4ip ? fetchGeo(v4ip) : Promise.resolve(null),
			trueV6 ? fetchGeo(trueV6) : Promise.resolve(null),
		]);

		ipv4 = v4ip ? { ip: v4ip, geo: geo4, error: false } : { ip: '', geo: null, error: true };
		ipv6 = trueV6 ? { ip: trueV6, geo: geo6, error: false } : null;
		loading = false;
	});

	// CIDR calculation
	interface CidrResult { network: string; broadcast: string; hosts: number; contains: boolean | null; }

	let cidrResult = $derived.by((): CidrResult | null => {
		if (!cidrIp.trim()) return null;
		try {
			const prefix = parseInt(cidrPfx);
			if (isNaN(prefix) || prefix < 0 || prefix > 32) return null;
			const parts = cidrIp.trim().split('.').map(Number);
			if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null;
			const ipInt = (parts[0]<<24)|(parts[1]<<16)|(parts[2]<<8)|parts[3];
			const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
			const netInt = (ipInt & mask) >>> 0;
			const bcastInt = (netInt | (~mask >>> 0)) >>> 0;
			const toStr = (n: number) => [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.');
			const hosts = prefix >= 31 ? 0 : Math.pow(2, 32 - prefix) - 2;

			let contains: boolean | null = null;
			if (cidrTest.trim()) {
				const tp = cidrTest.trim().split('.').map(Number);
				if (tp.length === 4 && !tp.some(p => isNaN(p) || p < 0 || p > 255)) {
					const testInt = (tp[0]<<24)|(tp[1]<<16)|(tp[2]<<8)|tp[3];
					contains = (testInt >>> 0) >= netInt && (testInt >>> 0) <= bcastInt;
				}
			}
			return { network: toStr(netInt), broadcast: toStr(bcastInt), hosts, contains };
		} catch { return null; }
	});

	function tile(label: string, value: string | undefined, color = 'text-slate-300') {
		return { label, value: value || '—', color };
	}
</script>

<div class="space-y-4">
	<!-- IP Cards -->
	{#if loading}
		<div class="bg-slate-800 rounded-xl p-8 flex items-center justify-center">
			<p class="text-slate-400 text-sm">{$t('ipInfo').loading}</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 {ipv6 ? 'lg:grid-cols-2' : ''} gap-4">
			{#each [{ label: $t('ipInfo').ipv4, data: ipv4 }, ...(ipv6 ? [{ label: $t('ipInfo').ipv6, data: ipv6 }] : [])] as card}
				<div class="bg-slate-800 rounded-xl p-6">
					<div class="flex items-center gap-2 mb-1">
						<span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
					</div>
					{#if card.data?.error}
						<p class="text-red-300 text-sm">{$t('ipInfo').error}</p>
					{:else}
						<p class="text-2xl font-mono font-bold text-violet-300 mb-4 break-all">{card.data?.ip}</p>
						{#if card.data?.geo}
							{@const g = card.data.geo}
							<div class="grid grid-cols-2 gap-2">
								{#each [
									tile($t('ipInfo').country, g.country_name),
									tile($t('ipInfo').region, g.region),
									tile($t('ipInfo').city, g.city),
									tile($t('ipInfo').isp, g.org, 'text-sky-300'),
									tile($t('ipInfo').asn, g.asn, 'text-slate-300'),
								] as item}
									<div>
										<p class="text-xs text-slate-400">{item.label}</p>
										<p class="text-sm {item.color} font-medium">{item.value}</p>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-xs text-slate-400">{$t('ipInfo').geoError}</p>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- CIDR Calculator -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{$t('ipInfo').cidrCalc}</h2>
		<div class="flex gap-3 flex-wrap">
			<div class="flex-1 min-w-40">
				<label for="cidr-ip" class="block text-xs text-slate-400 mb-1">{$t('ipInfo').cidrIp}</label>
				<input id="cidr-ip" bind:value={cidrIp} placeholder="192.168.1.0"
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 font-mono focus:outline-none focus:border-violet-500 text-sm" />
			</div>
			<div class="w-24">
				<label for="cidr-pfx" class="block text-xs text-slate-400 mb-1">{$t('ipInfo').cidrPrefix}</label>
				<div class="flex items-center gap-1">
					<span class="text-slate-400 text-sm">/</span>
					<input id="cidr-pfx" bind:value={cidrPfx} type="number" min="0" max="32"
						class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 font-mono focus:outline-none focus:border-violet-500 text-sm" />
				</div>
			</div>
			<div class="flex-1 min-w-40">
				<label for="cidr-test" class="block text-xs text-slate-400 mb-1">{$t('ipInfo').cidrTestIp}</label>
				<input id="cidr-test" bind:value={cidrTest} placeholder="192.168.1.50"
					class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 font-mono focus:outline-none focus:border-violet-500 text-sm" />
			</div>
		</div>

		{#if cidrResult}
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
				{#each [
					{ label: $t('ipInfo').cidrNetwork, value: cidrResult.network, color: 'text-emerald-400' },
					{ label: $t('ipInfo').cidrBroadcast, value: cidrResult.broadcast, color: 'text-sky-400' },
					{ label: $t('ipInfo').cidrHosts, value: cidrResult.hosts.toLocaleString(), color: 'text-violet-300' },
					...(cidrResult.contains !== null ? [{ label: $t('ipInfo').cidrContains, value: cidrResult.contains ? $t('ipInfo').yes : $t('ipInfo').no, color: cidrResult.contains ? 'text-emerald-400' : 'text-red-300' }] : []),
				] as item}
					<div class="bg-slate-900 rounded-lg p-3">
						<p class="text-xs text-slate-400 mb-1">{item.label}</p>
						<p class="font-mono text-sm font-bold {item.color}">{item.value}</p>
					</div>
				{/each}
			</div>
		{:else if cidrIp.trim()}
			<p class="text-xs text-red-300">{$t('ipInfo').invalidIp}</p>
		{/if}
	</div>
</div>
