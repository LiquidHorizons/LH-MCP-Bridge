import express from 'express';
import { spawn } from 'child_process';
import path from 'path';

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

// TRANSLATION LAYER: Converts ChatGPT's OpenAPI Web Action into a CLI command
app.post('/mcp', (req, res) => {
  const actionName = req.body.method || 'wp_get_site_info';
  const actionArgs = req.body.params || {};

  console.log(`Translating Custom GPT Web Action for: ${actionName}`);

  const binPath = path.resolve('./node_modules/.bin/wordpress-mcp-server');
  const mcpProcess = spawn('node', [binPath, '--server-type', 'stdio'], {
    env: { ...process.env, WP_URL: process.env.WP_URL || process.env.WORDPRESS_URL }
  });

  // Construct the exact JSON-RPC frame the command-line binary requires
  const mockPayload = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: actionName,
      arguments: actionArgs
    },
    id: 1
  };

  let responseData = '';
  mcpProcess.stdin.write(JSON.stringify(mockPayload) + '\n');
  mcpProcess.stdin.end();

  mcpProcess.stdout.on('data', (data) => { responseData += data.toString(); });
  mcpProcess.on('close', () => {
    try {
      const fullResponse = JSON.parse(responseData);
      
      // Unnest the text payload so ChatGPT's Web Action parser reads a clean JSON object
      if (fullResponse.result && fullResponse.result.content && fullResponse.result.content[0]) {
        res.json(JSON.parse(fullResponse.result.content[0].text));
      } else {
        res.json(fullResponse.result || fullResponse);
      }
    } catch (e) {
      res.status(500).json({ error: "Failed to parse underlying server framework response" });
    }
  });
});

// Clean status route for basic browser pings
app.get('/mcp', (req, res) => {
  res.json({ status: "online", target: process.env.WORDPRESS_URL || "unknown" });
});

app.listen(port, () => {
  console.log(`LH Bridge Web Server active on port ${port}`);
});
