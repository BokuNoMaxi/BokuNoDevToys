<script lang="ts">
	const BASE = [
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
		'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
		'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
		'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
		'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
		'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',
		'Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante.',
		'Donec eu libero sit amet quam egestas semper.',
		'Aenean ultricies mi vitae est.',
		'Mauris placerat eleifend leo.'
	];

	const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed eiusmod tempor incididunt labore dolore magna aliqua enim minim veniam nostrud exercitation ullamco laboris nisi aliquip commodo consequat duis aute irure reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat proident culpa officia deserunt mollit anim laborum'.split(' ');

	let paragraphs = $state(3);
	let maxChars = $state(0);
	let result = $state('');
	let copied = $state(false);

	function randomSentence() {
		const len = 8 + Math.floor(Math.random() * 10);
		const words = Array.from({ length: len }, () => WORDS[Math.floor(Math.random() * WORDS.length)]);
		words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
		return words.join(' ') + '.';
	}

	function generateParagraph(idx: number) {
		if (idx === 0) return BASE.join(' ');
		const sentCount = 4 + Math.floor(Math.random() * 4);
		return Array.from({ length: sentCount }, () => randomSentence()).join(' ');
	}

	function generate() {
		const paras = Array.from({ length: paragraphs }, (_, i) => generateParagraph(i));
		let text = paras.join('\n\n');
		if (maxChars > 0 && text.length > maxChars) {
			text = text.slice(0, maxChars).replace(/\s+\S*$/, '') + '…';
		}
		result = text;
		copied = false;
	}

	function copy() {
		navigator.clipboard.writeText(result);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

	generate();
</script>

<div class="space-y-6">
	<div class="bg-slate-800 rounded-xl p-6">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5">Settings</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
			<div>
				<label class="block text-sm text-slate-300 mb-2">Paragraphs: <span class="text-violet-300 font-semibold">{paragraphs}</span></label>
				<input type="range" min="1" max="20" bind:value={paragraphs} class="w-full accent-violet-500" />
				<div class="flex justify-between text-xs text-slate-300 mt-1"><span>1</span><span>20</span></div>
			</div>
			<div>
				<label class="block text-sm text-slate-300 mb-2">
					Max Characters: <span class="text-violet-300 font-semibold">{maxChars === 0 ? 'unlimited' : maxChars}</span>
				</label>
				<input type="range" min="0" max="5000" step="50" bind:value={maxChars} class="w-full accent-violet-500" />
				<div class="flex justify-between text-xs text-slate-300 mt-1"><span>unlimited</span><span>5000</span></div>
			</div>
		</div>
		<button onclick={generate} class="mt-5 px-6 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-lg font-medium transition-colors">
			Generate
		</button>
	</div>

	{#if result}
		<div class="bg-slate-800 rounded-xl p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">Result</h2>
				<div class="flex items-center gap-3">
					<span class="text-xs text-slate-300">{result.length} characters</span>
					<button onclick={copy} class="text-sm px-3 py-1 rounded-md border border-slate-600 hover:border-violet-500 text-slate-300 hover:text-violet-300 transition-colors">
						{copied ? '✓ Copied' : 'Copy'}
					</button>
				</div>
			</div>
			<div class="bg-slate-900 rounded-lg p-4 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-serif max-h-[500px] overflow-y-auto">
				{result}
			</div>
		</div>
	{/if}
</div>
