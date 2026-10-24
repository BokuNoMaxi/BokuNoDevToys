// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Markus Ketterer

import { writable } from 'svelte/store';

/**
 * Einwilligung für externe Skripte (derzeit: Cloudflare Web Analytics).
 * Wird als First-Party-Cookie gespeichert, weil nginx den Wert liest und nur bei
 * "analytics" den Cloudflare-Beacon in der Content-Security-Policy freigibt.
 * Ohne Einwilligung kann der Browser das Skript also gar nicht laden.
 */
export type Consent = 'unset' | 'analytics' | 'none';

const COOKIE_NAME = 'devtoys_consent';
const MAX_AGE = 60 * 60 * 24 * 180; // 6 Monate

function read(): Consent {
	if (typeof document === 'undefined') return 'unset';
	const raw = document.cookie.split('; ').find(r => r.startsWith(COOKIE_NAME + '='));
	const value = raw?.split('=')[1];
	return value === 'analytics' || value === 'none' ? value : 'unset';
}

const _consent = writable<Consent>('unset');
/** true, wenn der Hinweis angezeigt werden soll (noch keine Wahl oder erneut geöffnet). */
const _open = writable(false);

export const consent = { subscribe: _consent.subscribe };
export const consentOpen = { subscribe: _open.subscribe };

export const consentActions = {
	init() {
		const value = read();
		_consent.set(value);
		_open.set(value === 'unset');
	},
	choose(value: 'analytics' | 'none') {
		document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax; Secure`;
		_consent.set(value);
		_open.set(false);
	},
	reopen() {
		_open.set(true);
	},
};
