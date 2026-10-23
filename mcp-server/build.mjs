import { build } from 'esbuild';

await build({
	entryPoints: { server: 'src/http.ts', 'regex-worker-entry': 'src/regex-worker-entry.ts' },
	outdir: 'dist',
	outExtension: { '.js': '.mjs' },
	bundle: true,
	platform: 'node',
	target: 'node20',
	format: 'esm',
	// Core-Dateien liegen ausserhalb von mcp-server; deren Bare-Imports (marked, sql-formatter, …)
	// werden hier aufgeloest, falls kein Root-node_modules existiert (z. B. im Docker-Build).
	nodePaths: ['node_modules'],
	banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
	logLevel: 'info',
});
