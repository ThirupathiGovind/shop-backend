import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(currentDirectory, '..');
const frontendDirectory = process.env.SHOP_FRONTEND_DIRECTORY
  || path.resolve(backendDirectory, '..', 'shop-frontend');
const apiUrl = process.env.SHOP_API_URL || 'http://127.0.0.1:5001';

const textResult = (value) => ({
  content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
});

const requestApi = async (endpoint, options = {}) => {
  const response = await fetch(`${apiUrl}${endpoint}`, options);
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Shop API returned ${response.status}: ${body}`);
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

const readScripts = async (directory) => {
  const packageJson = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8'),
  );

  return packageJson.scripts || {};
};

const server = new McpServer({
  name: 'shop-development-tools',
  version: '1.0.0',
});

server.registerTool(
  'shop_health',
  {
    description: 'Read the shop API health status. This tool does not mutate data.',
    inputSchema: z.object({}),
  },
  async () => textResult(await requestApi('/health')),
);

server.registerTool(
  'product_search',
  {
    description: 'Search public shop products by keyword and page. This tool is read-only.',
    inputSchema: z.object({
      keyword: z.string().optional(),
      pageNumber: z.number().int().positive().optional(),
    }),
  },
  async ({ keyword, pageNumber }) => {
    const query = new URLSearchParams();
    if (keyword) query.set('keyword', keyword);
    if (pageNumber) query.set('pageNumber', String(pageNumber));

    const suffix = query.toString() ? `?${query.toString()}` : '';
    return textResult(await requestApi(`/api/products${suffix}`));
  },
);

server.registerTool(
  'order_diagnostics',
  {
    description: 'Read one order for development diagnostics using a configured test token.',
    inputSchema: z.object({ orderId: z.string().min(1) }),
  },
  async ({ orderId }) => {
    const token = process.env.SHOP_API_TOKEN;
    if (!token) {
      throw new Error('SHOP_API_TOKEN is required for order diagnostics.');
    }

    return textResult(await requestApi(`/api/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }));
  },
);

server.registerTool(
  'quality_report',
  {
    description: 'Read the configured quality scripts for the backend and frontend.',
    inputSchema: z.object({}),
  },
  async () => textResult({
    backend: await readScripts(backendDirectory),
    frontend: await readScripts(frontendDirectory),
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
