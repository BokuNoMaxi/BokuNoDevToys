import { writable } from 'svelte/store';

const COOKIE_KEY = 'devtoys_favorites';
const COOKIE_MAX_AGE = 31536000; // 1 year — refreshed on every tool visit via touch()

function readCookie(): Set<string> {
	if (typeof document === 'undefined') return new Set();
	const raw = document.cookie.split('; ').find((r) => r.startsWith(COOKIE_KEY + '='));
	if (!raw) return new Set();
	try {
		return new Set(JSON.parse(decodeURIComponent(raw.split('=')[1])));
	} catch {
		return new Set();
	}
}

function writeCookie(favs: Set<string>) {
	if (typeof document === 'undefined') return;
	const val = encodeURIComponent(JSON.stringify([...favs]));
	document.cookie = `${COOKIE_KEY}=${val};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

const _favorites = writable<Set<string>>(new Set()); // SSR default

export const favorites = {
	subscribe: _favorites.subscribe,
	init: () => _favorites.set(readCookie()),
	toggle: (id: string) => {
		_favorites.update((favs) => {
			const next = new Set(favs);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			writeCookie(next);
			return next;
		});
	},
	// Resets the cookie's max-age without changing its content, so favorites
	// only ever get lost through an explicit cookie clear, not inactivity.
	touch: () => {
		_favorites.update((favs) => {
			if (favs.size > 0) writeCookie(favs);
			return favs;
		});
	},
};
