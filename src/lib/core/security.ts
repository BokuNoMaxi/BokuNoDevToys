import bcrypt from 'bcryptjs';

export const CHARSETS = {
	upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	lower: 'abcdefghijklmnopqrstuvwxyz',
	numbers: '0123456789',
	symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
};

export interface PasswordOptions {
	length: number;
	upper: boolean;
	lower: boolean;
	numbers: boolean;
	symbols: boolean;
	extraChars: string;
}

export function buildCharset(o: Omit<PasswordOptions, 'length'>): string {
	let cs = '';
	if (o.upper) cs += CHARSETS.upper;
	if (o.lower) cs += CHARSETS.lower;
	if (o.numbers) cs += CHARSETS.numbers;
	if (o.symbols) cs += CHARSETS.symbols;
	if (o.extraChars) cs += o.extraChars;
	return cs;
}

export function calcEntropy(charsetSize: number, len: number): number {
	return Math.round(len * Math.log2(charsetSize));
}

export function generatePassword(charset: string, len: number): string {
	// Rejection sampling: Werte oberhalb des größten Vielfachen der
	// Charset-Länge verwerfen, sonst sind frühe Zeichen überrepräsentiert
	const limit = Math.floor(0x100000000 / charset.length) * charset.length;
	const out: string[] = [];
	while (out.length < len) {
		const arr = new Uint32Array(len - out.length);
		crypto.getRandomValues(arr);
		for (const v of arr) {
			if (v < limit && out.length < len) out.push(charset[v % charset.length]);
		}
	}
	return out.join('');
}

export async function htpasswdEntry(username: string, password: string): Promise<string> {
	const salt = await bcrypt.genSalt(10);
	const hash = await bcrypt.hash(password, salt);
	return `${username.trim()}:${hash}`;
}
