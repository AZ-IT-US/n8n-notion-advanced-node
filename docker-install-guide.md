# Docker Installation Guide for n8n Notion Advanced Node

## Method 1: Volume Mount (Recommended)

### Step 1: Prepare the Node Directory
```bash
# Current structure should be:
# n8n-notion-advanced-node/
# ├── nodes/
# ├── types/
# ├── package.json
# └── dist/ (created by build script)
```

### Step 2: Update your Docker Compose or run command

#### Option A: Docker Compose
Add this volume mount to your docker-compose.yml:

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password
      - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom-nodes
    volumes:
      - n8n_data:/home/node/.n8n
      - /path/to/n8n-notion-advanced-node:/home/node/.n8n/custom-nodes/n8n-notion-advanced-node:ro
    restart: unless-stopped

volumes:
  n8n_data:
```

#### Option B: Docker Run Command
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom-nodes \
  -v n8n_data:/home/node/.n8n \
  -v "$(pwd)/n8n-notion-advanced-node:/home/node/.n8n/custom-nodes/n8n-notion-advanced-node:ro" \
  n8nio/n8n
```

## Method 2: Copy into Running Container

### Step 1: Copy files to container
```bash
# Get your container ID
docker ps

# Copy the node to the container
docker cp ./n8n-notion-advanced-node <container_id>:/home/node/.n8n/custom-nodes/

# Set the environment variable
docker exec <container_id> sh -c "export N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom-nodes"
```

### Step 2: Restart n8n
```bash
docker restart <container_id>
```

## Method 3: Custom Docker Image

Create a Dockerfile:
```dockerfile
FROM n8nio/n8n:latest

USER root
COPY n8n-notion-advanced-node /home/node/.n8n/custom-nodes/n8n-notion-advanced-node
RUN chown -R node:node /home/node/.n8n/custom-nodes
USER node

ENV N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom-nodes
```

Build and run:
```bash
docker build -t n8n-with-notion-advanced .
docker run -p 5678:5678 n8n-with-notion-advanced