import { parentPort, workerData } from 'node:worker_threads';
import { findMatches } from '../../src/lib/core/regex';
import type { RegexJob } from './regex-worker.js';

const job = workerData as RegexJob;
try {
	parentPort!.postMessage({ matches: findMatches(job.pattern, job.text, job.flags) });
} catch (e) {
	parentPort!.postMessage({ error: (e as Error).message });
}
