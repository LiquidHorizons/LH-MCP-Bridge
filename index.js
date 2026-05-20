import express from 'express';
import { spawn } from 'child_process';
import path from 'path';

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

// Updated GET route to speak fluent JSON-RPC to the connector
app.get('/mcp', (req, res) => {
  console.log("ChatGPT requested metadata/status inspect via GET.");
  res.json({
    jsonrpc: "2.0",
    result: {
      status: "online",
      bridge: "LH-MCP-Bridge",
      target_environment: process.env.WP_URL || process.env.WORDPRESS_URL || "unknown"
    },
    id: null
  });
});

// The main POST route for executing tools remains secure
app.post('/mcp', (req, res) => {
  console.log("Forwarding ChatGPT execution command to MCP process...");
  
  const binPath = path.resolve('./node_modules/.bin/wordpress-mcp-server');
  
  const mcpProcess = spawn('node', [binPath, '--server-type', 'stdio'], {
    env: { 
      ...process.env,
      WP_URL: process.env.WP_URL || process.env.WORDPRESS_URL 
    }
  });

  let responseData = '';

  mcpProcess.stdin.write(JSON.stringify(req.body) + '\n');
  mcpProcess.stdin.end();

  mcpProcess.stdout.on('data', (data) => {
    responseData += data.toString();
  });

  mcpProcess.on('close', () => {
    try {
      res.json(JSON.parse(responseData));
    } catch (e) {
      res.status(500).send("Failed to parse MCP response");
    }
  });
});

app.listen(port, () => {
  console.log(`LH Bridge Web Server permanently active on port ${port}`);
});
