import { categories } from '$lib/tools/config';

// Beim Prerendern eine HTML-Datei für jedes registrierte Tool erzeugen
export const entries = () =>
	categories.flatMap((cat) => cat.tools.map((t) => ({ tool: t.id })));
