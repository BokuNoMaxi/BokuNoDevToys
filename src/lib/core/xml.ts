import type { ParseDoc } from './dom';

export function nodeToObj(node: Element): unknown {
	const children = Array.from(node.children);
	const attrs = Array.from(node.attributes).reduce((acc, a) => {
		acc[`@${a.name}`] = a.value;
		return acc;
	}, {} as Record<string, string>);

	if (children.length === 0) {
		const text = node.textContent?.trim() ?? '';
		if (Object.keys(attrs).length === 0) return text || null;
		return { ...attrs, '#text': text || null };
	}

	const result: Record<string, unknown> = { ...attrs };
	const seen: Record<string, number> = {};

	for (const child of children) {
		const tag = child.tagName;
		seen[tag] = (seen[tag] ?? 0) + 1;
	}

	for (const child of children) {
		const tag = child.tagName;
		const val = nodeToObj(child);
		if (seen[tag] > 1) {
			if (!Array.isArray(result[tag])) result[tag] = [];
			(result[tag] as unknown[]).push(val);
		} else {
			result[tag] = val;
		}
	}
	return result;
}

export function toYaml(obj: unknown, indent = 0): string {
	const pad = '  '.repeat(indent);
	if (obj === null || obj === undefined) return 'null';
	if (typeof obj === 'string') {
		if (obj === '') return "''";
		if (/[\n:#{}&*!,[\]|>'"%@`]/.test(obj) || obj.startsWith(' ') || obj.endsWith(' ')) {
			return `"${obj.replace(/"/g, '\\"')}"`;
		}
		return obj;
	}
	if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
	if (Array.isArray(obj)) {
		return obj.map(item => {
			const rendered = toYaml(item, indent + 1);
			if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
				return `${pad}- ${rendered.trimStart()}`;
			}
			return `${pad}- ${rendered}`;
		}).join('\n');
	}
	if (typeof obj === 'object') {
		const entries = Object.entries(obj as Record<string, unknown>);
		return entries.map(([k, v]) => {
			if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
				return `${pad}${k}:\n${toYaml(v, indent + 1)}`;
			}
			if (Array.isArray(v)) {
				return `${pad}${k}:\n${toYaml(v, indent)}`;
			}
			return `${pad}${k}: ${toYaml(v, indent + 1)}`;
		}).join('\n');
	}
	return String(obj);
}

/** XML-String → YAML. Wirft bei ungültigem XML. */
export function xmlToYaml(xml: string, parse: ParseDoc): string {
	const doc = parse(xml, 'xml');
	const root = doc.documentElement;
	return toYaml({ [root.tagName]: nodeToObj(root) });
}
