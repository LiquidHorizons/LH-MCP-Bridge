import { WordPressMCPServer } from '@respira/wordpress-mcp-server';

// The package class name is usually 'WordPressMCPServer' or exported as default
const server = new WordPressMCPServer({
  url: process.env.WORDPRESS_URL,
  username: process.env.WP_USERNAME,
  password: process.env.WP_APPLICATION_PASSWORD
});

const port = process.env.PORT || 10000;

server.listen(port, () => {
  console.log(`LH Staging MCP Bridge listening on port ${port}`);
});
