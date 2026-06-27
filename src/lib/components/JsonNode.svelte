<script lang="ts">
	let { value, depth = 0 }: { value: unknown; depth?: number } = $props();

	let collapsed = $state(depth > 2);

	const type = $derived(
		value === null ? 'null'
		: Array.isArray(value) ? 'array'
		: typeof value
	);

	const entries = $derived(
		type === 'array' ? (value as unknown[]).map((v, i) => [i, v] as [number, unknown])
		: type === 'object' ? Object.entries(value as Record<string, unknown>)
		: []
	) as [string | number, unknown][];

	const count = $derived(entries.length);
	const isEmpty = $derived(count === 0);
	const bracket = $derived(type === 'array' ? ['[', ']'] : ['{', '}']);
	const preview = $derived(
		type === 'array' ? `Array(${count})`
		: type === 'object' ? `Object{${count}}`
		: ''
	);
</script>

{#if type === 'string'}
	<span class="text-emerald-400">"{value as string}"</span>
{:else if type === 'number'}
	<span class="text-sky-400">{value as number}</span>
{:else if type === 'boolean'}
	<span class="text-amber-400">{String(value)}</span>
{:else if type === 'null'}
	<span class="text-slate-500 italic">null</span>
{:else if isEmpty}
	<span class="text-slate-500">{bracket[0]}{bracket[1]}</span>
{:else}
	<span>
		<button
			onclick={() => collapsed = !collapsed}
			class="text-slate-400 hover:text-violet-400 transition-colors font-mono text-xs mr-1 select-none"
			aria-label={collapsed ? 'aufklappen' : 'zuklappen'}
		>{collapsed ? '▶' : '▼'}</button>

		{#if collapsed}
			<button
				onclick={() => collapsed = false}
				class="text-slate-500 hover:text-slate-300 font-mono text-xs transition-colors"
			>{bracket[0]} {preview} {bracket[1]}</button>
		{:else}
			<span class="text-slate-400">{bracket[0]}</span>
			<div class="ml-4 border-l border-slate-700 pl-3">
				{#each entries as [key, val], i}
					<div class="py-0.5">
						<span class="text-violet-300 font-mono text-xs">
							{type === 'array' ? key : `"${key}"`}
						</span>
						<span class="text-slate-600 mx-1">:</span>
						<svelte:self value={val} depth={depth + 1} />
						{#if i < count - 1}<span class="text-slate-600">,</span>{/if}
					</div>
				{/each}
			</div>
			<span class="text-slate-400">{bracket[1]}</span>
		{/if}
	</span>
{/if}
