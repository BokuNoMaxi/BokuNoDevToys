import { parseHTML, DOMParser } from 'linkedom';
import { XMLValidator } from 'fast-xml-parser';
import type { ParseDoc } from '../../src/lib/core/dom';

/** Server-seitiger Ersatz für den Browser-DOMParser (linkedom + strikte XML-Validierung). */
export const nodeParseDoc: ParseDoc = (src, type) => {
	if (type === 'xml') {
		const valid = XMLValidator.validate(src);
		if (valid !== true) throw new Error(valid.err.msg);
		return new DOMParser().parseFromString(src, 'text/xml') as unknown as Document;
	}
	return parseHTML(src).document as unknown as Document;
};
