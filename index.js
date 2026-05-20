import express from 'express';
import { spawn } from 'child_process';
import path from 'path';

const app = express();
const port = process.env.PORT || 10000;

// Middleware to parse incoming JSON from ChatGPT
app.use(express.json());

app.post('/mcp', (req, res) => {
  console.log("Forwarding ChatGPT request to MCP process...");
  
  const binPath = path.resolve('./node_modules/.bin/wordpress-mcp-server');
  
  // Launch the package tool using standard input/output mode
  const mcpProcess = spawn('node', [binPath, '--server-type', 'stdio'], {
    env: { 
      ...process.env,
      WP_URL: process.env.WP_URL || process.env.WORDPRESS_URL 
    }
  });

  let responseData = '';

  // Write ChatGPT's request straight into the package
  mcpProcess.stdin.write(JSON.stringify(req.body) + '\n');
  mcpProcess.stdin.end();

  // Capture the package's answer
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
