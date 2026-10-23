export function base64Encode(text: string): string {
	return btoa(unescape(encodeURIComponent(text)));
}

export function base64Decode(text: string): string {
	return decodeURIComponent(escape(atob(text)));
}
