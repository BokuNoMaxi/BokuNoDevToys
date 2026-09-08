// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Markus Ketterer

/**
 * Build metadata injected at compile time via vite.config.ts
 */
export const commitHash = import.meta.env.COMMIT_HASH || 'unknown';
