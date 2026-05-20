import express from 'express';
import { spawn } from 'child_process';
import path from 'path';

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

// 1. ADDED: Lightweight GET route for ChatGPT to safely inspect metadata
app.get('/mcp', (req, res) => {
  console.log("ChatGPT requested safe metadata/status inspect.");
  res.json({
    status: "online",
    bridge: "LH-MCP-Bridge",
    target_environment: process.env.WP_URL || process.env.WORDPRESS_URL || "unknown"
  });
});

// 2. The main POST route for executing tools remains secure
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
