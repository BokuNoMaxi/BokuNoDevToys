<script lang="ts">
	import { t } from '$lib/i18n';

	let title = $state('Free Online Developer Tools');
	let url = $state('https://devtoys.bokunocompany.at');
	let description = $state('A collection of practical tools for developers — everything runs directly in the browser, no data is transmitted.');

	let titleLen = $derived(title.length);
	let descLen = $derived(description.length);

	function status(len: number, min: number, max: number): 'good' | 'warn' | 'bad' {
		if (len === 0) return 'bad';
		if (len < min || len > max) return 'warn';
		return 'good';
	}

	let titleStatus = $derived(status(titleLen, 10, 60));
	let descStatus = $derived(status(descLen, 50, 160));

	const statusColor: Record<string, string> = {
		good: 'text-emerald-400',
		warn: 'text-amber-400',
		bad: 'text-red-400',
	};

	let breadcrumb = $derived.by(() => {
		try {
			const u = new URL(url || 'https://example.com');
			const parts = u.pathname.split('/').filter(Boolean);
			return [u.hostname, ...parts].join(' › ');
		} catch {
			return url;
		}
	});

	// Truncate like Google does, roughly at pixel-equivalent character counts
	function truncate(text: string, max: number): string {
		if (text.length <= max) return text;
		return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
	}

	let displayTitle = $derived(truncate(title, 60));
	let displayDesc = $derived(truncate(description, 160));
</script>

<div class="space-y-4">
	<!-- Inputs -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-4">
		<div>
			<div class="flex items-center justify-between mb-1.5">
				<label class="text-xs text-slate-400" for="serp-title">{$t('serpPreview').titleLabel}</label>
				<span class="text-xs font-mono {statusColor[titleStatus]}">{titleLen}/60</span>
			</div>
			<input
				id="serp-title"
				type="text"
				bind:value={title}
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-violet-500"
			/>
		</div>

		<div>
			<label class="block text-xs text-slate-400 mb-1.5" for="serp-url">{$t('serpPreview').urlLabel}</label>
			<input
				id="serp-url"
				type="text"
				bind:value={url}
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-violet-500"
			/>
		</div>

		<div>
			<div class="flex items-center justify-between mb-1.5">
				<label class="text-xs text-slate-400" for="serp-desc">{$t('serpPreview').descLabel}</label>
				<span class="text-xs font-mono {statusColor[descStatus]}">{descLen}/160</span>
			</div>
			<textarea
				id="serp-desc"
				bind:value={description}
				rows="3"
				class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-violet-500 resize-y"
			></textarea>
		</div>
	</div>

	<!-- Google SERP preview -->
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">{$t('serpPreview').googlePreview}</h2>
		<div class="bg-white rounded-lg px-5 py-4 max-w-xl" style="font-family:Arial,sans-serif">
			<div class="flex items-center gap-2 mb-1">
				<div class="w-7 h-7 rounded-full bg-slate-200 shrink-0"></div>
				<div class="min-w-0">
					<p class="text-sm text-[#1a0dab] truncate">{breadcrumb}</p>
				</div>
			</div>
			<p class="text-xl text-[#1a0dab] leading-tight hover:underline cursor-pointer" style="font-family:arial,sans-serif">{displayTitle}</p>
			<p class="text-sm text-[#4d5156] mt-1 leading-snug">{displayDesc}</p>
		</div>
	</div>
</div>
