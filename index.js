import * as mcp from '@respira/wordpress-mcp-server';

// This will print the exact export names to your Render logs so we can see them
console.log("Available package exports:", Object.keys(mcp));

// Fallback attempt using the first available export if our names are off
const ServerClass = mcp.WordPressMCPServer || mcp.WordPressMcpServer || Object.values(mcp)[0];

if (!ServerClass) {
  throw new Error("Could not find a valid server class constructor in the package.");
}

const server = new ServerClass({
  url: process.env.WORDPRESS_URL,
  username: process.env.WP_USERNAME,
  password: process.env.WP_APPLICATION_PASSWORD
});

const port = process.env.PORT || 10000;
server.listen(port, () => {
  console.log(`LH Staging MCP Bridge listening on port ${port}`);
});
