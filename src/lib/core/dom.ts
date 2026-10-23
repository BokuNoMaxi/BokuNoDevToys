/** Parst HTML oder XML zu einem Document. Im Browser via DOMParser, im MCP-Server via linkedom. */
export type ParseDoc = (src: string, type: 'html' | 'xml') => Document;

export const browserParseDoc: ParseDoc = (src, type) => {
	const doc = new DOMParser().parseFromString(src, type === 'xml' ? 'application/xml' : 'text/html');
	if (type === 'xml') {
		const err = doc.querySelector('parsererror');
		if (err) throw new Error(err.textContent?.slice(0, 200) ?? 'Parse error');
	}
	return doc;
};
