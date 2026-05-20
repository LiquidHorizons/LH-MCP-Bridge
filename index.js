import express from 'express';
import { spawn } from 'child_process';
import path from 'path';

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

app.get('/mcp', (req, res) => {
  console.log("Executing strict, unchunked raw text site-info payload...");
  
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
      let targetPayload = fullResponse;

      // Extract raw inner content if it exists
      if (fullResponse.result && fullResponse.result.content && fullResponse.result.content[0]) {
        try {
          targetPayload = JSON.parse(fullResponse.result.content[0].text);
        } catch (e) {
          targetPayload = fullResponse.result.content[0].text;
        }
      } else if (fullResponse.result) {
        targetPayload = fullResponse.result;
      }

      // Convert payload to a clean, single-line string with a trailing newline
      const cleanString = JSON.stringify(targetPayload) + '\n';
      const buffer = Buffer.from(cleanString, 'utf-8');

      // CRITICAL: Explicitly kill chunked transfer encoding and any non-JSON bytes
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': buffer.length,
        'Connection': 'close',
        'Transfer-Encoding': 'identity' // Forces compression/chunking off
      });

      // Blast the raw bytes directly to the socket stream
      res.write(buffer);
      res.end();
      
      console.log("Raw text payload successfully flushed.");
    } catch (e) {
      res.status(500).send("Failed to process internal tool output.");
    }
  });
});

// Post handler remains intact
app.post('/mcp', (req, res) => {
  const binPath = path.resolve('./node_modules/.bin/wordpress-mcp-server');
  const mcpProcess = spawn('node', [binPath, '--server-type', 'stdio'], {
    env: { ...process.env, WP_URL: process.env.WP_URL || process.env.WORDPRESS_URL }
  });

  let responseData = '';
  mcpProcess.stdin.write(JSON.stringify(req.body) + '\n');
  mcpProcess.stdin.end();

  mcpProcess.stdout.on('data', (data) => { responseData += data.toString(); });
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
