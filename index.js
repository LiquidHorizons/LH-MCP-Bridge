import { spawn } from 'child_process';
import path from 'path';

console.log("Starting WordPress MCP Server binary link...");

// This executes the hidden binary inside the installed node_modules folder directly
const binPath = path.resolve('./node_modules/.bin/wordpress-mcp-server');
const port = process.env.PORT || 10000;

const mcpProcess = spawn('node', [binPath, '--port', port], {
  env: { ...process.env },
  stdio: 'inherit' // This passes the package's internal logs directly into your Render console
});

mcpProcess.on('error', (err) => {
  console.error('Failed to start MCP server process:', err);
});

mcpProcess.on('exit', (code) => {
  console.log(`MCP server process exited with code ${code}`);
  process.exit(code || 1);
});
