<script lang="ts">
	import { t } from '$lib/i18n';

	export interface VDNode {
		type: 'string' | 'int' | 'float' | 'bool' | 'null' | 'array' | 'object';
		value?: string | number | boolean;
		length?: number;
		children?: { key: string | number; value: VDNode }[];
		className?: string;
		objectId?: number;
	}

	let { node, depth = 0 }: { node: VDNode; depth?: number } = $props();

	let collapsed = $state(depth > 2);

	const count = $derived(node.children?.length ?? 0);
	const isEmpty = $derived(count === 0);
</script>

{#if node.type === 'null'}
	<span class="text-slate-500 italic">NULL</span>

{:else if node.type === 'bool'}
	<span class="text-amber-400 font-semibold">{node.value ? 'true' : 'false'}</span>

{:else if node.type === 'int'}
	<span class="text-sky-400">{node.value}</span>
	<span class="text-slate-600 text-xs ml-1">int</span>

{:else if node.type === 'float'}
	<span class="text-sky-300">{node.value}</span>
	<span class="text-slate-600 text-xs ml-1">float</span>

{:else if node.type === 'string'}
	<span class="text-emerald-400">"{node.value}"</span>
	<span class="text-slate-600 text-xs ml-1">({node.length})</span>

{:else if node.type === 'array' || node.type === 'object'}
	<span>
		{#if node.type === 'object'}
			<span class="text-violet-400 font-semibold">{node.className}</span>
			<span class="text-slate-600 text-xs">#{node.objectId}</span>
			<span class="text-slate-500 text-xs ml-1">object</span>
		{:else}
			<span class="text-slate-400 text-xs">array</span>
		{/if}
		<span class="text-slate-500 text-xs ml-1">({count})</span>

		{#if isEmpty}
			<span class="text-slate-600 ml-1">&#123;&#125;</span>
		{:else}
			<button
				onclick={() => collapsed = !collapsed}
				class="text-slate-400 hover:text-violet-400 transition-colors font-mono text-xs ml-1 select-none"
				aria-label={collapsed ? $t('vardump').expand : $t('vardump').collapse}
				aria-expanded={!collapsed}
			>{collapsed ? '▶' : '▼'}</button>

			{#if collapsed}
				<button
					onclick={() => collapsed = false}
					class="text-slate-500 hover:text-slate-300 font-mono text-xs transition-colors"
					aria-label="{$t('vardump').expand}: {count} {$t('vardump').entries}"
				>&#123; {count} {$t('vardump').entries} &#125;</button>
			{:else}
				<div class="ml-4 border-l border-slate-700 pl-3 mt-0.5">
					{#each node.children ?? [] as child, i}
						<div class="py-0.5">
							<span class="text-violet-300 font-mono text-xs">
								{typeof child.key === 'number' ? child.key : `"${child.key}"`}
							</span>
							<span class="text-slate-600 mx-1">=&gt;</span>
							<svelte:self node={child.value} depth={depth + 1} />
							{#if i < count - 1}<span class="text-slate-700">,</span>{/if}
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</span>
{/if}
