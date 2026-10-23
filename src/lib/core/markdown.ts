import { marked } from 'marked';

/** Markdown → HTML (unsanitisiert; im Browser vor dem Rendern mit DOMPurify bereinigen). */
export function markdownToHtml(md: string): string {
	return marked(md) as string;
}
