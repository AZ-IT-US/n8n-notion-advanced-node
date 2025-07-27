# Installation Guide for n8n Notion Advanced Node

This guide provides step-by-step instructions for installing and using the n8n Notion Advanced community node.

## Prerequisites

- n8n instance (self-hosted or cloud)
- Node.js 16.10 or higher
- npm or pnpm package manager
- Notion API token (see [Notion API Setup](#notion-api-setup))

## Installation Methods

### Method 1: NPM Installation (Recommended)

#### For Self-Hosted n8n

1. **Install dependencies and build the package**:
   ```bash
   cd n8n-notion-advanced-node
   
   # Install dependencies (including TypeScript)
   npm install
   
   # Build the node
   npm run build
   
   # Optional: Publish to npm
   npm publish
   ```

   **If you get "tsc is not recognized":**
   ```bash
   # Option 1: Use npx to run TypeScript
   npx tsc
   
   # Option 2: Install TypeScript globally
   npm install -g typescript
   
   # Option 3: Use the npm script (recommended)
   npm run build
   ```

2. **Install in your n8n instance**:
   ```bash
   # Navigate to your n8n installation directory
   cd /path/to/your/n8n/installation
   
   # Install the community node
   npm install n8n-notion-advanced-node
   ```

3. **Restart n8n**:
   ```bash
   # If running as a service
   sudo systemctl restart n8n
   
   # Or if running directly
   npx n8n start
   ```

#### For n8n Cloud

1. Go to **Settings** → **Community Nodes**
2. Click **Install a community node**
3. Enter the package name: `n8n-notion-advanced-node`
4. Click **Install**

### Method 2: Local Development Installation

#### For testing and development:

1. **Build the node**:
   ```bash
   cd n8n-notion-advanced-node
   npm run build
   ```

2. **Link the package locally**:
   ```bash
   npm link
   ```

3. **In your n8n directory, link the node**:
   ```bash
   cd /path/to/your/n8n/installation
   npm link n8n-notion-advanced-node
   ```

4. **Set the custom nodes environment variable**:
   ```bash
   export N8N_CUSTOM_EXTENSIONS=/path/to/n8n-notion-advanced-node
   ```

5. **Start n8n**:
   ```bash
   npx n8n start
   ```

### Method 3: Docker Installation

#### If using n8n in Docker:

1. **Create a custom Dockerfile**:
   ```dockerfile
   FROM n8nio/n8n:latest
   
   USER root
   RUN npm install -g n8n-notion-advanced-node
   USER node
   ```

2. **Build and run**:
   ```bash
   docker build -t n8n-with-notion-advanced .
   docker run -p 5678:5678 n8n-with-notion-advanced
   ```

## Notion API Setup

### 1. Create a Notion Integration

1. Go to [Notion Developers](https://developers.notion.com/)
2. Click **"My integrations"**
3. Click **"Create new integration"**
4. Fill out the integration details:
   - **Name**: Your integration name (e.g., "n8n Integration")
   - **Associated workspace**: Select your workspace
   - **Type**: Internal
5. Click **"Submit"**
6. Copy the **Internal Integration Token** (starts with `secret_`)

### 2. Grant Database/Page Access

For each database or page you want to access:

1. Open the database/page in Notion
2. Click the **"Share"** button (top right)
3. Click **"Invite"**
4. Search for your integration name
5. Select it and choose appropriate permissions
6. Click **"Invite"**

### 3. Configure Credentials in n8n

1. In n8n, go to **Credentials**
2. Search for **"Notion API"**
3. Add new Notion API credentials:
   - **API Key**: Paste your Internal Integration Token
   - **Name**: Give it a descriptive name
4. Click **"Save"**

## Using the Node

### 1. Add the Node to Your Workflow

1. Create a new workflow or open an existing one
2. Click the **"+"** button to add a node
3. Search for **"Notion Advanced"**
4. Drag it into your workflow

### 2. Configure the Node

1. **Credentials**: Select your Notion API credentials
2. **Resource**: Choose what you want to work with:
   - **Page**: Create, read, update, or archive pages
   - **Block**: Create, read, update, or delete content blocks
   - **Database**: Query or create databases
   - **User**: Get user information

3. **Operation**: Select the specific action you want to perform

### 3. Configure Parameters

The node provides extensive configuration options:

#### For Pages:
- **Parent**: Page ID, Database ID, or search term
- **Title**: Page title
- **Properties**: Custom properties (JSON format)
- **Icon**: Emoji or image URL
- **Cover**: Cover image URL

#### For Blocks:
- **Block Type**: Choose from 25+ supported block types
- **Content**: Text content or rich text JSON
- **Properties**: Block-specific properties (color, language, etc.)
- **Children**: Nested blocks (JSON array)

## Examples

### Example 1: Create a Page with Multiple Blocks

```json
{
  "resource": "page",
  "operation": "create",
  "parent": "your-database-id",
  "title": "Meeting Notes",
  "blocks": {
    "block": [
      {
        "type": "heading_1",
        "content": "Team Meeting - January 2024",
        "properties": "{\"color\": \"blue\"}"
      },
      {
        "type": "paragraph",
        "content": "Attendees: John, Jane, Bob"
      },
      {
        "type": "bulleted_list_item",
        "content": "Discussed project timeline"
      },
      {
        "type": "code",
        "content": "console.log('Hello, world!');",
        "properties": "{\"language\": \"javascript\"}"
      }
    ]
  }
}
```

### Example 2: Create Rich Text Content

```json
{
  "type": "paragraph",
  "richText": "[
    {\"text\": {\"content\": \"This is \"}, \"annotations\": {\"bold\": false}},
    {\"text\": {\"content\": \"bold text\"}, \"annotations\": {\"bold\": true}},
    {\"text\": {\"content\": \" and \"}, \"annotations\": {\"bold\": false}},
    {\"text\": {\"content\": \"italic text\"}, \"annotations\": {\"italic\": true}}
  ]"
}
```

### Example 3: Query a Database

```json
{
  "resource": "database",
  "operation": "query",
  "databaseId": "your-database-id",
  "filter": "{
    \"and\": [
      {
        \"property\": \"Status\",
        \"select\": {\"equals\": \"In Progress\"}
      }
    ]
  }"
}
```

## Troubleshooting

### Common Issues
1. **"tsc is not recognized" or TypeScript compilation errors**
   ```bash
   # Solution 1: Install dependencies first
   npm install
   
   # Solution 2: Use npm script instead of direct tsc
   npm run build
   
   # Solution 3: Install TypeScript globally
   npm install -g typescript
   
   # Solution 4: Use npx
   npx tsc
   ```

1. **"Cannot find module 'n8n-notion-advanced-node'"**
   - Ensure the package is properly installed
   - Restart n8n after installation

2. **"Invalid credentials"**
   - Check your Notion API token
   - Ensure the integration has access to the target pages/databases

3. **"Page not found"**
   - Verify the page/database ID
   - Ensure your integration has been invited to the page/database

4. **"Block validation failed"**
   - Check the block structure and required properties
   - Refer to [Notion API documentation](https://developers.notion.com/reference/block) for block schemas

### Debug Mode

Enable debug logging in n8n:
```bash
export N8N_LOG_LEVEL=debug
npx n8n start
```

## Support and Documentation

- **Node Documentation**: See [README.md](./README.md)
- **Development Guide**: See [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Notion API Reference**: [https://developers.notion.com/reference](https://developers.notion.com/reference)
- **n8n Community**: [https://community.n8n.io](https://community.n8n.io)

## Version Compatibility

- **n8n**: 0.180.0 or higher
- **Node.js**: 16.10 or higher
- **Notion API**: Version 2022-06-28

## License

MIT License - see [LICENSE](./LICENSE) file for details.