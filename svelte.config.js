// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Markus Ketterer

import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	preprocess: vitePreprocess(),
	compilerOptions: {
		runes: true
	},
	kit: {
		adapter: adapter({ fallback: '200.html' })
	}
};
