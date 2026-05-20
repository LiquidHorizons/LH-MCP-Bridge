import { spawn } from 'child_process';
import path from 'path';

console.log("Starting WordPress MCP Server in production bridge mode...");

const binPath = path.resolve('./node_modules/.bin/wordpress-mcp-server');
const port = process.env.PORT || 10000;

// Explicitly pass server execution variables down to the package binary
const mcpProcess = spawn('node', [binPath, '--port', port, '--server-type', 'http'], {
  env: { 
    ...process.env,
    // Double ensuring the package catches the correct mapped keys
    WP_URL: process.env.WP_URL || process.env.WORDPRESS_URL 
  },
  stdio: 'inherit'
});

mcpProcess.on('error', (err) => {
  console.error('Failed to start MCP server process:', err);
});

mcpProcess.on('exit', (code) => {
  console.log(`MCP server process exited with code ${code}`);
  if (code === 0) {
    console.log("Process exited cleanly but should be running continuously. Restarting handling may be required.");
  }
  process.exit(code || 1);
});
