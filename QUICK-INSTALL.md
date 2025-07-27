# Quick Installation for Docker n8n

## You now have: `n8n-notion-advanced-node-deployment.zip`

## Steps to Install on Your Server:

### 1. Transfer the Zip File to Your Server
```bash
# Upload the zip file to your server using scp, sftp, or your preferred method
scp n8n-notion-advanced-node-deployment.zip user@your-server:/tmp/
```

### 2. On Your Server, Extract and Install

```bash
# Connect to your server
ssh user@your-server

# Create custom nodes directory
mkdir -p ~/.n8n/custom-nodes

# Extract the node
cd /tmp
unzip n8n-notion-advanced-node-deployment.zip -d ~/.n8n/custom-nodes/

# Set permissions (if needed)
chmod -R 755 ~/.n8n/custom-nodes/n8n-notion-advanced-node
```

### 3. Update Your Docker Setup

#### Option A: If using docker-compose.yml
Add this environment variable to your n8n service:
```yaml
environment:
  - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom-nodes
```

And add this volume mount:
```yaml
volumes:
  - ~/.n8n/custom-nodes:/home/node/.n8n/custom-nodes:ro
```

#### Option B: If using docker run
Add these flags to your docker run command:
```bash
-e N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom-nodes \
-v ~/.n8n/custom-nodes:/home/node/.n8n/custom-nodes:ro
```

### 4. Restart n8n
```bash
# If using docker-compose
docker-compose restart n8n

# If using docker run
docker restart <your-n8n-container-name>
```

### 5. Verify Installation
1. Open your n8n interface
2. Create a new workflow
3. Click the "+" to add a node
4. Search for "Notion Advanced"
5. You should see the new node available!

## Next Steps After Installation:

1. **Set up Notion API credentials:**
   - Go to https://developers.notion.com/
   - Create a new integration
   - Copy the API token
   - Add it as "Notion API" credentials in n8n

2. **Share your Notion pages/databases with the integration:**
   - Open your Notion page/database
   - Click "Share" → "Invite"
   - Add your integration

3. **Start using the node:**
   - Drag "Notion Advanced" into your workflow
   - Select your credentials
   - Choose resource (Page/Block/Database/User) and operation

## Troubleshooting:

If the node doesn't appear:
1. Check Docker logs: `docker logs <container-name>`
2. Verify the custom-nodes directory structure
3. Ensure the environment variable is set correctly
4. Try a full restart of the container

## Features Available:
✅ 25+ block types (paragraph, headings, lists, code, tables, etc.)
✅ Rich text with formatting (bold, italic, colors, links)
✅ Complete CRUD operations
✅ Database queries and creation
✅ User management
✅ Advanced block properties and nesting