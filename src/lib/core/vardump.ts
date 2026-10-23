export interface VDNode {
	type: 'string' | 'int' | 'float' | 'bool' | 'null' | 'array' | 'object';
	value?: string | number | boolean;
	length?: number;
	children?: { key: string | number; value: VDNode }[];
	className?: string;
	objectId?: number;
}

export function parseVarDump(text: string): VDNode {
	// Normalize: remove carriage returns, strip leading/trailing whitespace per line
	const lines = text
		.replace(/\r\n/g, '\n')
		.split('\n')
		.map(l => l.trim())
		.filter(l => l.length > 0);

	let pos = 0;

	function peek() { return lines[pos] ?? ''; }
	function consume() { return lines[pos++] ?? ''; }

	function parseValue(): VDNode {
		const line = peek();

		if (line === 'NULL') {
			consume();
			return { type: 'null' };
		}

		if (line.startsWith('bool(')) {
			consume();
			return { type: 'bool', value: line === 'bool(true)' };
		}

		if (line.startsWith('int(')) {
			consume();
			return { type: 'int', value: parseInt(line.slice(4, -1)) };
		}

		if (line.startsWith('float(') || line.startsWith('double(')) {
			consume();
			const inner = line.startsWith('float(') ? line.slice(6, -1) : line.slice(7, -1);
			return { type: 'float', value: parseFloat(inner) };
		}

		if (line.startsWith('string(')) {
			consume();
			// string(N) "value" — value might contain escaped quotes
			const m = line.match(/^string\((\d+)\) "(.*)"/s);
			return { type: 'string', length: m ? parseInt(m[1]) : 0, value: m ? m[2] : '' };
		}

		if (line.startsWith('array(')) {
			consume(); // "array(N) {"
			const m = line.match(/^array\((\d+)\)/);
			const length = m ? parseInt(m[1]) : 0;
			const children: VDNode['children'] = [];

			while (pos < lines.length && peek() !== '}') {
				const keyLine = peek();
				// Key patterns: [0]=> or ["key"]=> or [key]:protected=> or [key:ClassName:private]=>
				const ki = keyLine.match(/^\[(\d+)\]=>$/) ??
				            keyLine.match(/^\["(.*?)"\]=>$/) ??
				            keyLine.match(/^\["(.*?)":.*?\]=>$/) ??
				            keyLine.match(/^\[(.+?)\]=>$/);
				if (ki) {
					consume();
					const rawKey = ki[1];
					const key = /^\d+$/.test(rawKey) ? parseInt(rawKey) : rawKey;
					const val = parseValue();
					children.push({ key, value: val });
				} else {
					consume(); // skip unexpected line
				}
			}
			if (peek() === '}') consume();
			return { type: 'array', length, children };
		}

		if (line.startsWith('object(')) {
			consume(); // "object(Class)#id (N) {"
			const m = line.match(/^object\((.+?)\)#(\d+) \((\d+)\)/);
			const className = m ? m[1] : 'unknown';
			const objectId  = m ? parseInt(m[2]) : 0;
			const length    = m ? parseInt(m[3]) : 0;
			const children: VDNode['children'] = [];

			while (pos < lines.length && peek() !== '}') {
				const keyLine = peek();
				const ki = keyLine.match(/^\["(.*?)"\]=>$/) ??
				            keyLine.match(/^\["(.*?)":.*?\]=>$/) ??
				            keyLine.match(/^\[(\d+)\]=>$/) ??
				            keyLine.match(/^\[(.+?)\]=>$/);
				if (ki) {
					consume();
					children.push({ key: ki[1], value: parseValue() });
				} else {
					consume();
				}
			}
			if (peek() === '}') consume();
			return { type: 'object', className, objectId, length, children };
		}

		// Fallback: treat unknown line as string
		consume();
		return { type: 'string', value: line, length: line.length };
	}

	return parseValue();
}

/** Baum → einfaches JSON-Objekt (PHP-Arrays/Objekte werden zu JSON-Objekten bzw. -Arrays). */
export function vdToPlain(node: VDNode): unknown {
	switch (node.type) {
		case 'null': return null;
		case 'bool': case 'int': case 'float': case 'string': return node.value;
		case 'array': case 'object': {
			const children = node.children ?? [];
			const isList = node.type === 'array' && children.every((c, i) => c.key === i);
			if (isList) return children.map(c => vdToPlain(c.value));
			const obj: Record<string, unknown> = {};
			for (const c of children) obj[String(c.key)] = vdToPlain(c.value);
			return node.type === 'object' ? { __class: node.className, ...obj } : obj;
		}
	}
}
