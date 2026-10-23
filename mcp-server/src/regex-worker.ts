import { Worker } from 'node:worker_threads';
import type { MatchGroup } from '../../src/lib/core/regex';

export interface RegexJob {
	pattern: string;
	text: string;
	flags: { g?: boolean; i?: boolean; m?: boolean; s?: boolean };
}

const TIMEOUT_MS = 2000;

/** Führt die Regex in einem Worker aus und bricht bei Überschreitung ab (ReDoS-Schutz). */
export function runRegexSafely(job: RegexJob): Promise<MatchGroup[]> {
	return new Promise((resolve, reject) => {
		const worker = new Worker(new URL('./regex-worker-entry.mjs', import.meta.url), { workerData: job });
		const timer = setTimeout(() => {
			void worker.terminate();
			reject(new Error(`Regex timed out after ${TIMEOUT_MS / 1000}s (possible catastrophic backtracking)`));
		}, TIMEOUT_MS);
		worker.once('message', (msg: { matches?: MatchGroup[]; error?: string }) => {
			clearTimeout(timer);
			void worker.terminate();
			if (msg.error) reject(new Error(msg.error));
			else resolve(msg.matches ?? []);
		});
		worker.once('error', (e) => { clearTimeout(timer); reject(e); });
	});
}
