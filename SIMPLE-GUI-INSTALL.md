# Simple GUI Installation Guide

## The Easiest Way: npm + n8n GUI

### Step 1: Prepare Your Package (5 minutes)

1. **Update package.json** with your details:
   ```bash
   # Replace "your-username" with your actual npm username
   # Replace "Your Name" and email with your details
   ```

2. **Build the package**:
   ```bash
   npm run build
   ```

### Step 2: Publish to npm (2 minutes)

1. **Create npm account** (if you don't have one):
   - Go to https://www.npmjs.com/signup
   - Create account

2. **Login to npm**:
   ```bash
   npm login
   ```

3. **Publish your package**:
   ```bash
   npm publish --access public
   ```

### Step 3: Install via n8n GUI (1 minute)

1. **Open your n8n interface**
2. **Click the Settings gear icon** (bottom left)
3. **Click "Community Nodes"**
4. **Click "Install a community node"**
5. **Enter**: `@your-username/n8n-notion-advanced-node`
6. **Click "Install"**
7. **Wait for green checkmark**
8. **Done!** The "Notion Advanced" node now appears in your palette

## That's It! 🎉

No server access needed, no Docker restarts, no file copying. The node will automatically appear in your workflow editor under "Notion Advanced".

## Next Steps:

1. **Create Notion Integration**: https://developers.notion.com
2. **Add API Key**: In n8n credentials
3. **Share pages** with your integration
4. **Start building workflows!**

## Updating:

When you want to update the node:
1. Increment version in package.json
2. Run `npm publish`
3. In n8n GUI: Settings → Community Nodes → Update

## Benefits:

✅ **Pure GUI** - no technical setup  
✅ **One-click install** in n8n  
✅ **Automatic updates** available  
✅ **Easy sharing** with others  
✅ **Professional distribution**