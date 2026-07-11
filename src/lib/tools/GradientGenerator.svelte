<script lang="ts">
	import { t } from '$lib/i18n';

	type GType = 'linear' | 'radial' | 'conic';
	type Stop = { color: string; position: number; id: number };

	let gradType = $state<GType>('linear');
	let angle = $state(135);
	let nextId = 3;
	let stops = $state<Stop[]>([
		{ color: '#6d28d9', position: 0, id: 1 },
		{ color: '#06b6d4', position: 100, id: 2 },
	]);
	let copied = $state(false);

	function addStop() {
		const mid = Math.round((stops[0].position + stops[stops.length - 1].position) / 2);
		stops = [...stops, { color: '#ec4899', position: mid, id: nextId++ }].sort((a, b) => a.position - b.position);
	}

	function removeStop(id: number) {
		if (stops.length <= 2) return;
		stops = stops.filter(s => s.id !== id);
	}

	let gradStr = $derived.by(() => {
		const s = [...stops].sort((a, b) => a.position - b.position).map(s => `${s.color} ${s.position}%`).join(', ');
		if (gradType === 'linear') return `linear-gradient(${angle}deg, ${s})`;
		if (gradType === 'radial') return `radial-gradient(circle, ${s})`;
		return `conic-gradient(from ${angle}deg, ${s})`;
	});

	let css = $derived(`background: ${gradStr};`);

	function copy() {
		navigator.clipboard.writeText(css);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<!-- Controls -->
		<div class="bg-slate-800 rounded-xl p-6 space-y-5">
			<!-- Type -->
			<div>
				<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Typ</label>
				<div class="flex gap-2">
					{#each [['linear','Linear'],['radial','Radial'],['conic','Conic']] as [v, label]}
						<button onclick={() => gradType = v as GType} class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors {gradType === v ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{label}</button>
					{/each}
				</div>
			</div>

			<!-- Angle (linear + conic) -->
			{#if gradType !== 'radial'}
				<div>
					<label class="block text-xs text-slate-400 mb-1.5">Winkel: <span class="text-violet-300 font-mono">{angle}°</span></label>
					<input type="range" min="0" max="360" bind:value={angle} class="w-full accent-violet-500" />
				</div>
			{/if}

			<!-- Color stops -->
			<div>
				<div class="flex items-center justify-between mb-2">
					<label class="text-xs font-semibold text-slate-300 uppercase tracking-wider">Farbstopps</label>
					<button onclick={addStop} class="text-xs text-violet-300 hover:text-violet-200 transition-colors">+ Stopp</button>
				</div>
				<div class="space-y-2">
					{#each stops as stop (stop.id)}
						<div class="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2">
							<input type="color" bind:value={stop.color} class="h-8 w-10 rounded border border-slate-600 bg-slate-900 p-0.5 cursor-pointer shrink-0" />
							<input type="range" min="0" max="100" bind:value={stop.position} class="flex-1 accent-violet-500" />
							<span class="text-xs font-mono text-slate-400 w-8 text-right">{stop.position}%</span>
							{#if stops.length > 2}
								<button onclick={() => removeStop(stop.id)} class="text-slate-500 hover:text-red-400 text-xs ml-1 transition-colors">✕</button>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Preview -->
		<div class="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">Vorschau</h2>
			<div class="flex-1 rounded-lg min-h-40" style="background:{gradStr}"></div>
			<!-- Stop bar -->
			<div class="relative h-4 rounded-full overflow-hidden" style="background:{gradStr}">
				{#each stops as stop}
					<div class="absolute top-0 w-1 h-full bg-white/60 rounded" style="left:{stop.position}%;transform:translateX(-50%)"></div>
				{/each}
			</div>
		</div>
	</div>

	<div class="bg-slate-800 rounded-xl p-6">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">CSS</h2>
			<button onclick={copy} class="text-xs text-slate-300 hover:text-slate-100 transition-colors">{copied ? 'Kopiert!' : 'Kopieren'}</button>
		</div>
		<pre class="bg-slate-900 rounded-lg px-4 py-3 text-emerald-400 text-sm font-mono overflow-x-auto">{css}</pre>
	</div>
</div>
