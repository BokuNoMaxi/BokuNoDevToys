import { format } from 'sql-formatter';

export function formatSQL(sql: string, dialect: string = 'mysql'): string {
  try {
    return format(sql, {
      language: dialect as any,
      tabWidth: 2,
      keywordCase: 'upper'
    });
  } catch (error) {
    throw new Error(`SQL formatting failed: ${(error as Error).message}`);
  }
}

export const sqlTools = [
  {
    name: 'format_sql',
    description: 'Format SQL query',
    inputSchema: {
      type: 'object' as const,
      properties: {
        sql: { type: 'string', description: 'SQL query to format' },
        dialect: {
          type: 'string',
          description: 'SQL dialect (mysql, postgresql, sqlite, tsql, plsql, mariadb, etc.)',
          default: 'mysql'
        }
      },
      required: ['sql']
    }
  }
];

export async function handleSQLTool(toolName: string, args: Record<string, string>): Promise<string> {
  try {
    if (toolName === 'format_sql') {
      return formatSQL(args.sql, args.dialect || 'mysql');
    }
    throw new Error(`Unknown tool: ${toolName}`);
  } catch (error) {
    throw new Error(`SQL error: ${(error as Error).message}`);
  }
}
