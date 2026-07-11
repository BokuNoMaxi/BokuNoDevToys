<script lang="ts">
	import { t } from '$lib/i18n';

	type Point = { x: number; y: number };

	const presets: Record<string, Point[]> = {
		Dreieck:      [{ x: 50, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
		Raute:        [{ x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 50 }],
		Pentagon:     [{ x: 50, y: 0 }, { x: 100, y: 38 }, { x: 82, y: 100 }, { x: 18, y: 100 }, { x: 0, y: 38 }],
		Hexagon:      [{ x: 25, y: 0 }, { x: 75, y: 0 }, { x: 100, y: 50 }, { x: 75, y: 100 }, { x: 25, y: 100 }, { x: 0, y: 50 }],
		Pfeil:        [{ x: 0, y: 25 }, { x: 60, y: 25 }, { x: 60, y: 0 }, { x: 100, y: 50 }, { x: 60, y: 100 }, { x: 60, y: 75 }, { x: 0, y: 75 }],
		Chevron:      [{ x: 0, y: 0 }, { x: 75, y: 0 }, { x: 100, y: 50 }, { x: 75, y: 100 }, { x: 0, y: 100 }, { x: 25, y: 50 }],
		Stern:        [
			{ x: 50, y: 0 }, { x: 61, y: 35 }, { x: 98, y: 35 }, { x: 68, y: 57 },
			{ x: 79, y: 91 }, { x: 50, y: 70 }, { x: 21, y: 91 }, { x: 32, y: 57 },
			{ x: 2, y: 35 }, { x: 39, y: 35 },
		],
		Parallelogramm: [{ x: 20, y: 0 }, { x: 100, y: 0 }, { x: 80, y: 100 }, { x: 0, y: 100 }],
	};

	let points = $state<Point[]>(presets['Dreieck'].map(p => ({ ...p })));
	let activePreset = $state('Dreieck');
	let boxColor = $state('#6d28d9');
	let dragging = $state<number | null>(null);
	let svgEl = $state<SVGSVGElement | undefined>();
	let copied = $state(false);
	let nextId = $state(0);

	function applyPreset(name: string) {
		activePreset = name;
		points = presets[name].map(p => ({ ...p }));
	}

	let clipValue = $derived('polygon(' + points.map(p => `${p.x}% ${p.y}%`).join(', ') + ')');
	let css = $derived(`clip-path: ${clipValue};\n-webkit-clip-path: ${clipValue};`);

	function onMouseDown(e: MouseEvent, i: number) {
		e.preventDefault();
		dragging = i;
	}

	function onMouseMove(e: MouseEvent) {
		if (dragging === null || !svgEl) return;
		const rect = svgEl.getBoundingClientRect();
		const x = Math.round(Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100)));
		const y = Math.round(Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100)));
		points = points.map((p, i) => i === dragging ? { x, y } : p);
	}

	function onTouchMove(e: TouchEvent) {
		if (dragging === null || !svgEl) return;
		e.preventDefault();
		const touch = e.touches[0];
		const rect = svgEl.getBoundingClientRect();
		const x = Math.round(Math.max(0, Math.min(100, (touch.clientX - rect.left) / rect.width * 100)));
		const y = Math.round(Math.max(0, Math.min(100, (touch.clientY - rect.top) / rect.height * 100)));
		points = points.map((p, i) => i === dragging ? { x, y } : p);
	}

	function stopDrag() { dragging = null; }

	function addPoint() {
		points = [...points, { x: 50, y: 50 }];
		activePreset = '';
	}

	function removePoint(i: number) {
		if (points.length <= 3) return;
		points = points.filter((_, idx) => idx !== i);
		activePreset = '';
	}

	function copy() {
		navigator.clipboard.writeText(css);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<svelte:window onmouseup={stopDrag} onmousemove={onMouseMove} ontouchend={stopDrag} />

<div class="space-y-4">
	<!-- Presets -->
	<div class="bg-slate-800 rounded-xl p-6 space-y-3">
		<label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Vorlagen</label>
		<div class="flex flex-wrap gap-2">
			{#each Object.keys(presets) as name}
				<button onclick={() => applyPreset(name)} class="px-3 py-1.5 rounded-lg text-sm transition-colors {activePreset === name ? 'bg-violet-700 text-white' : 'bg-slate-900 text-slate-300 hover:text-slate-100'}">{name}</button>
			{/each}
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<!-- Interactive canvas -->
		<div class="bg-slate-800 rounded-xl p-6 space-y-4">
			<div class="flex items-center justify-between">
				<label class="text-xs font-semibold text-slate-300 uppercase tracking-wider">Punkte ziehen</label>
				<div class="flex gap-2">
					<button onclick={addPoint} class="text-xs text-violet-300 hover:text-violet-200 transition-colors">+ Punkt</button>
				</div>
			</div>

			<!-- SVG Canvas -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<svg
				bind:this={svgEl}
				viewBox="0 0 100 100"
				class="w-full rounded-lg border border-slate-700 cursor-crosshair select-none"
				style="background:#0f172a;aspect-ratio:1"
				ontouchmove={onTouchMove}
			>
				<!-- Grid lines -->
				{#each [25, 50, 75] as g}
					<line x1={g} y1="0" x2={g} y2="100" stroke="#334155" stroke-width="0.3" />
					<line x1="0" y1={g} x2="100" y2={g} stroke="#334155" stroke-width="0.3" />
				{/each}

				<!-- Filled shape -->
				<polygon
					points={points.map(p => `${p.x},${p.y}`).join(' ')}
					fill={boxColor}
					fill-opacity="0.5"
					stroke={boxColor}
					stroke-width="0.5"
				/>

				<!-- Drag handles -->
				{#each points as p, i}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<circle
						cx={p.x} cy={p.y} r="3"
						fill={dragging === i ? '#fff' : '#6d28d9'}
						stroke="#fff"
						stroke-width="0.8"
						class="cursor-grab"
						onmousedown={(e) => onMouseDown(e, i)}
						ontouchstart={(e) => { e.preventDefault(); dragging = i; }}
					/>
					<text x={p.x + 3} y={p.y - 2} font-size="4" fill="#94a3b8">{i + 1}</text>
				{/each}
			</svg>

			<!-- Point list -->
			<div class="space-y-1 max-h-48 overflow-y-auto">
				{#each points as p, i}
					<div class="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-1.5 text-xs">
						<span class="text-slate-500 w-4">{i + 1}</span>
						<span class="text-slate-400">X:</span>
						<input type="number" bind:value={p.x} min="0" max="100" onchange={() => activePreset = ''}
							class="w-14 bg-slate-800 rounded px-1.5 py-0.5 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-violet-500" />
						<span class="text-slate-400">Y:</span>
						<input type="number" bind:value={p.y} min="0" max="100" onchange={() => activePreset = ''}
							class="w-14 bg-slate-800 rounded px-1.5 py-0.5 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-violet-500" />
						{#if points.length > 3}
							<button onclick={() => removePoint(i)} class="ml-auto text-slate-500 hover:text-red-400 transition-colors">✕</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Live preview -->
		<div class="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
			<div class="flex items-center justify-between">
				<h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider">Vorschau</h2>
				<div class="flex items-center gap-2">
					<label class="text-xs text-slate-400">Farbe</label>
					<input type="color" bind:value={boxColor} class="h-7 w-10 rounded border border-slate-600 bg-slate-900 p-0.5 cursor-pointer" />
				</div>
			</div>
			<div class="flex-1 bg-slate-900 rounded-lg flex items-center justify-center min-h-48">
				<div
					class="w-48 h-48"
					style="background:{boxColor};clip-path:{clipValue};-webkit-clip-path:{clipValue};"
				></div>
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
