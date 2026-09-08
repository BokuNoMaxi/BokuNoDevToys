// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Markus Ketterer

import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()]
});
