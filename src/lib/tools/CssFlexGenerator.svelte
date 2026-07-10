<script lang="ts">
	import { t } from '$lib/i18n';

	let direction = $state<string>('row');
	let justify = $state<string>('flex-start');
	let align = $state<string>('stretch');
	let wrap = $state<string>('nowrap');
	let gap = $state(16);
	let itemCount = $state(4);
	let copied = $state(false);

	const directions  = ['row', 'row-reverse', 'column', 'column-reverse'];
	const justifies   = ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'];
	const aligns      = ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'];
	const wraps       = ['nowrap', 'wrap', 'wrap-reverse'];
	const colors      = ['bg-violet-600','bg-sky-600','bg-emerald-600','bg-amber-600','bg-rose-600'];

	let css = $derived(`display: flex;\nflex-direction: ${direction};\njustify-content: ${justify};\nalign-items: ${align};\nflex-wrap: ${wrap};\ngap: ${gap}px;`);

	let containerStyle = $derived(
		`display:flex;flex-direction:${direction};justify-content:${justify};align-items:${align};flex-wrap:${wrap};gap:${gap}px;min-height:120px;`
	);

	function copy() {
		navigator.clipboard.writeText(css);
		copied = true;
		setTimeout(() => { copied = false; }, 1500);
	}

	type SelectOption = { label: string; value: string };
	function btnGroup(options: string[], current: string, setter: (v: string) => void) {
		return { options, current, setter };
	}
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<!-- Settings -->
		<div class="bg-slate-800 rounded-xl p-6 space-y-4">
			<!-- flex-direction -->
			<div>
				<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('cssFlex').direction}</label>
				<div class="flex flex-wrap gap-1.5">
					{#each directions as d}
						<button onclick={() => direction = d} class="px-3 py-1.5 rounded-lg text-xs font-mono transition-colors {direction === d ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{d}</button>
					{/each}
				</div>
			</div>

			<!-- justify-content -->
			<div>
				<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('cssFlex').justify}</label>
				<div class="flex flex-wrap gap-1.5">
					{#each justifies as j}
						<button onclick={() => justify = j} class="px-3 py-1.5 rounded-lg text-xs font-mono transition-colors {justify === j ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{j}</button>
					{/each}
				</div>
			</div>

			<!-- align-items -->
			<div>
				<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('cssFlex').align}</label>
				<div class="flex flex-wrap gap-1.5">
					{#each aligns as a}
						<button onclick={() => align = a} class="px-3 py-1.5 rounded-lg text-xs font-mono transition-colors {align === a ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{a}</button>
					{/each}
				</div>
			</div>

			<!-- flex-wrap -->
			<div>
				<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{$t('cssFlex').wrap}</label>
				<div class="flex flex-wrap gap-1.5">
					{#each wraps as w}
						<button onclick={() => wrap = w} class="px-3 py-1.5 rounded-lg text-xs font-mono transition-colors {wrap === w ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{w}</button>
					{/each}
				</div>
			</div>

			<!-- gap + item count -->
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">{$t('cssFlex').gap}: <span class="text-violet-300 font-mono">{gap}px</span></label>
					<input type="range" min="0" max="48" bind:value={gap} class="w-full accent-violet-500" />
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">{$t('cssFlex').itemCount}: <span class="text-violet-300 font-mono">{itemCount}</span></label>
					<input type="range" min="1" max="100" bind:value={itemCount} class="w-full accent-violet-500" />
				</div>
			</div>
		</div>

		<!-- Preview -->
		<div class="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('cssFlex').preview}</h2>
			<div class="flex-1 bg-slate-900 rounded-lg p-3 overflow-auto">
				<div style={containerStyle}>
					{#each Array(itemCount) as _, i}
						<div class="rounded px-3 py-2 {colors[i % colors.length]} text-white text-xs font-mono min-w-10 flex items-center justify-center">{i+1}</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<div class="bg-slate-800 rounded-xl p-6">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">{$t('cssFlex').output}</h2>
			<button onclick={copy} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{copied ? $t('cssFlex').copied : $t('cssFlex').copy}</button>
		</div>
		<pre class="bg-slate-900 rounded-lg px-4 py-3 text-emerald-400 text-sm font-mono overflow-x-auto">{css}</pre>
	</div>
</div>
