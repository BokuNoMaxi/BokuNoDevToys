import { format as formatSqlLib } from 'sql-formatter';

export type SqlDialect = 'mysql' | 'postgresql' | 'sqlite' | 'sql';

export function formatJson(input: string, indent = 2): string {
	return JSON.stringify(JSON.parse(input), null, indent);
}

export function minifyJson(input: string): string {
	return JSON.stringify(JSON.parse(input));
}

export function formatSql(input: string, dialect: SqlDialect = 'mysql'): string {
	return formatSqlLib(input, { language: dialect, tabWidth: 2, keywordCase: 'upper' });
}
