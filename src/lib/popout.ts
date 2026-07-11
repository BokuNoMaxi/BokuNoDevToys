// Opens tool output in a separate browser window/tab for easier reading.
// Both helpers build the popout document via DOM APIs (never document.write
// with interpolated strings) so plain text content can't be interpreted as
// markup.

const BASE_STYLE = `
	color-scheme: dark;
	margin: 0;
	padding: 1.5rem;
	background: #0f172a;
	color: #cbd5e1;
	font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
	font-size: 13px;
	line-height: 1.6;
`;

function openBlankWindow(title: string): Window | null {
	const win = window.open('', '_blank', 'width=900,height=800');
	if (!win) return null;
	win.document.title = title;
	const style = win.document.createElement('style');
	style.textContent = `body { ${BASE_STYLE} } pre { white-space: pre-wrap; word-break: break-word; margin: 0; }`;
	win.document.head.appendChild(style);
	return win;
}

/** Open plain text content (e.g. formatted code) in a new window. Safe for any input — never interpreted as HTML. */
export function openPopoutText(title: string, text: string): void {
	const win = openBlankWindow(title);
	if (!win) {
		alert('Popup wurde vom Browser blockiert. Bitte Popups für diese Seite erlauben.');
		return;
	}
	const pre = win.document.createElement('pre');
	pre.textContent = text;
	win.document.body.appendChild(pre);
}

/**
 * Open pre-rendered HTML content (e.g. a rendered Markdown/HTML preview) in a new window.
 * The caller MUST pass content that is already sanitized (e.g. via DOMPurify) —
 * this function does not sanitize, it only displays.
 */
export function openPopoutHtml(title: string, html: string, extraCss = ''): void {
	const win = openBlankWindow(title);
	if (!win) {
		alert('Popup wurde vom Browser blockiert. Bitte Popups für diese Seite erlauben.');
		return;
	}
	win.document.body.style.background = '#fff';
	win.document.body.style.color = '#0f172a';
	if (extraCss) {
		const style = win.document.createElement('style');
		style.textContent = extraCss;
		win.document.head.appendChild(style);
	}
	const container = win.document.createElement('div');
	container.innerHTML = html;
	win.document.body.appendChild(container);
}
