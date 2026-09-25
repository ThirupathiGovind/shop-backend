# Backend Instructions

- Run `npm run lint`, `npm test`, and `npm run test:coverage` before completing backend changes.
- Test authored runtime JavaScript modules and keep tests isolated from production data.
- Never commit secrets, bearer tokens, MongoDB connection strings, or payment credentials.
- Treat the MCP server as development-only and read-only.
- Do not add arbitrary database queries, destructive seed commands, payment actions, or production writes to MCP.
- Preserve existing API response contracts unless an API migration is explicitly requested.
