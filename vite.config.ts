// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Markus Ketterer

import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

// Inject commit hash into build at compile time
function getCommitHash(): string {
	try {
		return execSync('git rev-parse --short HEAD').toString().trim();
	} catch {
		// Fallback: try environment variable or use placeholder
		return process.env.COMMIT_HASH || 'dev';
	}
}

const commitHash = getCommitHash();

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		'import.meta.env.COMMIT_HASH': JSON.stringify(commitHash)
	}
});
