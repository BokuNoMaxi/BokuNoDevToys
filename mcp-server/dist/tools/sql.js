import { format } from 'sql-formatter';
export function formatSQL(sql, dialect = 'mysql') {
    try {
        return format(sql, {
            language: dialect,
            tabWidth: 2,
            keywordCase: 'upper'
        });
    }
    catch (error) {
        throw new Error(`SQL formatting failed: ${error.message}`);
    }
}
export const sqlTools = [
    {
        name: 'format_sql',
        description: 'Format SQL query',
        inputSchema: {
            type: 'object',
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
export async function handleSQLTool(toolName, args) {
    try {
        if (toolName === 'format_sql') {
            return formatSQL(args.sql, args.dialect || 'mysql');
        }
        throw new Error(`Unknown tool: ${toolName}`);
    }
    catch (error) {
        throw new Error(`SQL error: ${error.message}`);
    }
}
//# sourceMappingURL=sql.js.map