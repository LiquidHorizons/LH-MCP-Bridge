import express from 'express';
import { spawn } from 'child_process';
import path from 'path';

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

// REWORKED: Unpacks the internal JSON-RPC wrapper to return raw result data
app.get('/mcp', (req, res) => {
  console.log("Connector environment forced a GET request. Executing internal wp_get_site_info...");
  
  const binPath = path.resolve('./node_modules/.bin/wordpress-mcp-server');
  
  const mcpProcess = spawn('node', [binPath, '--server-type', 'stdio'], {
    env: { 
      ...process.env,
      WP_URL: process.env.WP_URL || process.env.WORDPRESS_URL 
    }
  });

  const mockToolCall = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "wp_get_site_info",
      arguments: {}
    },
    id: 1
  };

  let responseData = '';

  mcpProcess.stdin.write(JSON.stringify(mockToolCall) + '\n');
  mcpProcess.stdin.end();

  mcpProcess.stdout.on('data', (data) => {
    responseData += data.toString();
  });

  mcpProcess.on('close', () => {
    try {
      const fullResponse = JSON.parse(responseData);
      
      // If the binary returned a strict MCP JSON-RPC tool result, extract the raw content
      if (fullResponse.result && fullResponse.result.content) {
        console.log("Unpacking nested MCP tool content text block...");
        try {
          // Often the content is returned as an array containing text objects
          const rawText = fullResponse.result.content[0].text;
          res.json(JSON.parse(rawText));
        } catch (innerErr) {
          res.json(fullResponse.result.content);
        }
      } else if (fullResponse.result) {
        // Fallback to standard protocol result object
        res.json(fullResponse.result);
      } else {
        res.json(fullResponse);
      }
    } catch (e) {
      res.status(500).send("Failed to execute internal site info fetch.");
    }
  });
});

// Main POST route remains intact for full tool execution when supported
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
