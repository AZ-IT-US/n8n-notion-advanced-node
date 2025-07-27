const { NodeConnectionType, NodeOperationError } = require('n8n-workflow');

const {
  notionApiRequest,
  validateCredentials,
  createRichText,
  resolvePageId,
} = require('./NotionUtils');

class NotionAITool {
  constructor() {
    this.description = {
      displayName: 'Notion AI Tool',
      name: 'notionAiTool',
      icon: 'file:notion.svg',
      group: ['ai'],
      version: 1,
      subtitle: '={{$parameter["operation"]}}',
      description: 'AI-powered tool for creating and managing Notion content. Designed for use with AI Agent Nodes.',
      defaults: {
        name: 'Notion AI Tool',
      },
      inputs: [NodeConnectionType.Main],
      outputs: [NodeConnectionType.Main],
      credentials: [
        {
          name: 'notionApi',
          required: true,
        },
      ],
      properties: [
        {
          displayName: 'Operation',
          name: 'operation',
          type: 'options',
          noDataExpression: true,
          options: [
            {
              name: 'Create Page with Content',
              value: 'createPageWithContent',
              description: 'Create a new Notion page with structured content including text, headings, lists, and formatting',
              action: 'Create a Notion page with content',
            },
            {
              name: 'Add Content to Page',
              value: 'addContentToPage',
              description: 'Append new content blocks (paragraphs, headings, lists, etc.) to an existing Notion page',
              action: 'Add content to existing page',
            },
            {
              name: 'Search and Retrieve Pages',
              value: 'searchPages',
              description: 'Search for Notion pages by title, content, or properties and retrieve their information',
              action: 'Search and retrieve pages',
            },
            {
              name: 'Update Page Properties',
              value: 'updatePageProperties',
              description: 'Update page title, properties, status, tags, or other metadata',
              action: 'Update page properties',
            },
            {
              name: 'Create Database Entry',
              value: 'createDatabaseEntry',
              description: 'Create a new entry in a Notion database with specified properties and values',
              action: 'Create database entry',
            },
            {
              name: 'Query Database',
              value: 'queryDatabase',
              description: 'Search and filter database entries based on criteria and retrieve matching records',
              action: 'Query database',
            },
          ],
          default: 'createPageWithContent',
        },
        // CREATE PAGE WITH CONTENT
        {
          displayName: 'Page Title',
          name: 'pageTitle',
          type: 'string',
          required: true,
          displayOptions: {
            show: {
              operation: ['createPageWithContent'],
            },
          },
          default: '',
          description: 'The title of the new page to create',
        },
        {
          displayName: 'Parent Page/Database ID',
          name: 'parentId',
          type: 'string',
          required: true,
          displayOptions: {
            show: {
              operation: ['createPageWithContent', 'createDatabaseEntry'],
            },
          },
          default: '',
          description: 'ID of the parent page or database where this should be created. Can be a Notion URL or page ID.',
        },
        {
          displayName: 'Content',
          name: 'content',
          type: 'string',
          typeOptions: {
            rows: 6,
          },
          displayOptions: {
            show: {
              operation: ['createPageWithContent', 'addContentToPage'],
            },
          },
          default: '',
          description: 'The content to add. Use natural language - AI will structure it into appropriate blocks (headings, paragraphs, lists, etc.)',
          placeholder: 'Example:\n# Main Heading\nThis is a paragraph with **bold** and *italic* text.\n\n## Subheading\n- First bullet point\n- Second bullet point\n\n> This is a quote block',
        },
        // ADD CONTENT TO PAGE
        {
          displayName: 'Target Page ID',
          name: 'targetPageId',
          type: 'string',
          required: true,
          displayOptions: {
            show: {
              operation: ['addContentToPage', 'updatePageProperties'],
            },
          },
          default: '',
          description: 'ID or URL of the existing page to modify',
        },
        // SEARCH PAGES
        {
          displayName: 'Search Query',
          name: 'searchQuery',
          type: 'string',
          displayOptions: {
            show: {
              operation: ['searchPages'],
            },
          },
          default: '',
          description: 'Search terms to find pages. Leave empty to get all pages.',
        },
        {
          displayName: 'Search Type',
          name: 'searchType',
          type: 'options',
          displayOptions: {
            show: {
              operation: ['searchPages'],
            },
          },
          options: [
            {
              name: 'All Content',
              value: 'all',
              description: 'Search in page titles and content',
            },
            {
              name: 'Titles Only',
              value: 'title',
              description: 'Search only in page titles',
            },
            {
              name: 'Recent Pages',
              value: 'recent',
              description: 'Get recently modified pages',
            },
          ],
          default: 'all',
        },
        // UPDATE PAGE PROPERTIES
        {
          displayName: 'Properties to Update',
          name: 'propertiesToUpdate',
          type: 'string',
          typeOptions: {
            rows: 4,
          },
          displayOptions: {
            show: {
              operation: ['updatePageProperties'],
            },
          },
          default: '',
          description: 'Properties to update in JSON format or natural language. Example: {"status": "In Progress", "priority": "High"} or "Set status to Done and priority to Low"',
        },
        // DATABASE OPERATIONS
        {
          displayName: 'Database ID',
          name: 'databaseId',
          type: 'string',
          required: true,
          displayOptions: {
            show: {
              operation: ['queryDatabase'],
            },
          },
          default: '',
          description: 'ID or URL of the database to query',
        },
        {
          displayName: 'Entry Properties',
          name: 'entryProperties',
          type: 'string',
          typeOptions: {
            rows: 4,
          },
          displayOptions: {
            show: {
              operation: ['createDatabaseEntry'],
            },
          },
          default: '',
          description: 'Properties for the new database entry in JSON format or natural language description',
        },
        {
          displayName: 'Query Filter',
          name: 'queryFilter',
          type: 'string',
          displayOptions: {
            show: {
              operation: ['queryDatabase'],
            },
          },
          default: '',
          description: 'Filter criteria in natural language (e.g., "status is Done and priority is High") or JSON format',
        },
        // COMMON OPTIONS
        {
          displayName: 'Additional Options',
          name: 'additionalOptions',
          type: 'collection',
          placeholder: 'Add Option',
          default: {},
          options: [
            {
              displayName: 'Icon',
              name: 'icon',
              type: 'string',
              default: '',
              description: 'Emoji icon for the page (e.g., 📝, 🎯, 📊)',
            },
            {
              displayName: 'Cover Image URL',
              name: 'coverUrl',
              type: 'string',
              default: '',
              description: 'URL of cover image for the page',
            },
            {
              displayName: 'Return Full Content',
              name: 'returnFullContent',
              type: 'boolean',
              default: false,
              description: 'Whether to return full page content or just metadata',
            },
            {
              displayName: 'Max Results',
              name: 'maxResults',
              type: 'number',
              default: 20,
              description: 'Maximum number of results to return (1-100)',
            },
          ],
        },
      ],
    };
  }

  async execute() {
    const items = this.getInputData();
    const responseData = [];

    // Validate credentials
    const isValid = await validateCredentials.call(this);
    if (!isValid) {
      throw new NodeOperationError(this.getNode(), 'Invalid Notion API credentials');
    }

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i);
        let result;

        switch (operation) {
          case 'createPageWithContent':
            result = await this.createPageWithContent(i);
            break;
          case 'addContentToPage':
            result = await this.addContentToPage(i);
            break;
          case 'searchPages':
            result = await this.searchPages(i);
            break;
          case 'updatePageProperties':
            result = await this.updatePageProperties(i);
            break;
          case 'createDatabaseEntry':
            result = await this.createDatabaseEntry(i);
            break;
          case 'queryDatabase':
            result = await this.queryDatabase(i);
            break;
          default:
            throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
        }

        responseData.push({
          operation,
          success: true,
          ...result,
        });
      } catch (error) {
        if (this.continueOnFail()) {
          responseData.push({
            error: error.message,
            success: false,
          });
        } else {
          throw error;
        }
      }
    }

    return [this.helpers.returnJsonArray(responseData)];
  }

  async createPageWithContent(itemIndex) {
    const pageTitle = this.getNodeParameter('pageTitle', itemIndex);
    const parentId = this.getNodeParameter('parentId', itemIndex);
    const content = this.getNodeParameter('content', itemIndex, '');
    const additionalOptions = this.getNodeParameter('additionalOptions', itemIndex, {});

    const resolvedParentId = await resolvePageId.call(this, parentId);

    // Create the page first
    const pageBody = {
      parent: { page_id: resolvedParentId },
      properties: {
        title: {
          title: [createRichText(pageTitle)],
        },
      },
    };

    // Add icon and cover if provided
    if (additionalOptions.icon) {
      pageBody.icon = { type: 'emoji', emoji: additionalOptions.icon };
    }
    if (additionalOptions.coverUrl) {
      pageBody.cover = { type: 'external', external: { url: additionalOptions.coverUrl } };
    }

    const page = await notionApiRequest.call(this, 'POST', '/pages', pageBody);

    // If content is provided, add it to the page
    if (content) {
      const blocks = this.parseContentToBlocks(content);
      if (blocks.length > 0) {
        await notionApiRequest.call(this, 'PATCH', `/blocks/${page.id}/children`, {
          children: blocks,
        });
      }
    }

    return {
      pageId: page.id,
      title: pageTitle,
      url: page.url,
      message: `Created page "${pageTitle}" with content`,
    };
  }

  async addContentToPage(itemIndex) {
    const targetPageId = this.getNodeParameter('targetPageId', itemIndex);
    const content = this.getNodeParameter('content', itemIndex);

    const resolvedPageId = await resolvePageId.call(this, targetPageId);
    const blocks = this.parseContentToBlocks(content);

    if (blocks.length === 0) {
      throw new NodeOperationError(this.getNode(), 'No valid content blocks found to add');
    }

    const result = await notionApiRequest.call(this, 'PATCH', `/blocks/${resolvedPageId}/children`, {
      children: blocks,
    });

    return {
      pageId: resolvedPageId,
      blocksAdded: blocks.length,
      message: `Added ${blocks.length} content blocks to page`,
      result,
    };
  }

  async searchPages(itemIndex) {
    const searchQuery = this.getNodeParameter('searchQuery', itemIndex, '');
    const searchType = this.getNodeParameter('searchType', itemIndex, 'all');
    const additionalOptions = this.getNodeParameter('additionalOptions', itemIndex, {});
    const maxResults = additionalOptions.maxResults || 20;

    const body = {
      page_size: Math.min(maxResults, 100),
    };

    if (searchQuery) {
      body.query = searchQuery;
    }

    body.filter = {
      property: 'object',
      value: 'page',
    };

    const response = await notionApiRequest.call(this, 'POST', '/search', body);

    return {
      totalResults: response.results?.length || 0,
      pages: response.results || [],
      message: `Found ${response.results?.length || 0} pages`,
    };
  }

  async updatePageProperties(itemIndex) {
    const targetPageId = this.getNodeParameter('targetPageId', itemIndex);
    const propertiesToUpdate = this.getNodeParameter('propertiesToUpdate', itemIndex);

    const resolvedPageId = await resolvePageId.call(this, targetPageId);
    const properties = this.parsePropertiesToUpdate(propertiesToUpdate);

    const result = await notionApiRequest.call(this, 'PATCH', `/pages/${resolvedPageId}`, {
      properties,
    });

    return {
      pageId: resolvedPageId,
      updatedProperties: Object.keys(properties),
      message: `Updated ${Object.keys(properties).length} properties`,
      result,
    };
  }

  async createDatabaseEntry(itemIndex) {
    const parentId = this.getNodeParameter('parentId', itemIndex);
    const entryProperties = this.getNodeParameter('entryProperties', itemIndex);

    const resolvedParentId = await resolvePageId.call(this, parentId);
    const properties = this.parsePropertiesToUpdate(entryProperties);

    const result = await notionApiRequest.call(this, 'POST', '/pages', {
      parent: { database_id: resolvedParentId },
      properties,
    });

    return {
      entryId: result.id,
      databaseId: resolvedParentId,
      message: 'Created new database entry',
      result,
    };
  }

  async queryDatabase(itemIndex) {
    const databaseId = this.getNodeParameter('databaseId', itemIndex);
    const queryFilter = this.getNodeParameter('queryFilter', itemIndex, '');
    const additionalOptions = this.getNodeParameter('additionalOptions', itemIndex, {});
    const maxResults = additionalOptions.maxResults || 20;

    const resolvedDatabaseId = await resolvePageId.call(this, databaseId);
    const body = {
      page_size: Math.min(maxResults, 100),
    };

    if (queryFilter) {
      try {
        body.filter = JSON.parse(queryFilter);
      } catch {
        // If not JSON, create a simple text filter
        body.filter = {
          property: 'Name',
          title: {
            contains: queryFilter,
          },
        };
      }
    }

    const response = await notionApiRequest.call(this, 'POST', `/databases/${resolvedDatabaseId}/query`, body);

    return {
      databaseId: resolvedDatabaseId,
      totalResults: response.results?.length || 0,
      entries: response.results || [],
      message: `Found ${response.results?.length || 0} database entries`,
    };
  }

  parseContentToBlocks(content) {
    const blocks = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse different content types
      if (line.startsWith('# ')) {
        blocks.push({
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [createRichText(line.substring(2))],
          },
        });
      } else if (line.startsWith('## ')) {
        blocks.push({
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [createRichText(line.substring(3))],
          },
        });
      } else if (line.startsWith('### ')) {
        blocks.push({
          object: 'block',
          type: 'heading_3',
          heading_3: {
            rich_text: [createRichText(line.substring(4))],
          },
        });
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        blocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [createRichText(line.substring(2))],
          },
        });
      } else if (line.match(/^\d+\. /)) {
        blocks.push({
          object: 'block',
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [createRichText(line.replace(/^\d+\. /, ''))],
          },
        });
      } else if (line.startsWith('> ')) {
        blocks.push({
          object: 'block',
          type: 'quote',
          quote: {
            rich_text: [createRichText(line.substring(2))],
          },
        });
      } else if (line.startsWith('```')) {
        // Handle code blocks
        const codeLines = [];
        i++; // Skip the opening ```
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        blocks.push({
          object: 'block',
          type: 'code',
          code: {
            rich_text: [createRichText(codeLines.join('\n'))],
            language: 'plain text',
          },
        });
      } else {
        // Regular paragraph
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [createRichText(line)],
          },
        });
      }
    }

    return blocks;
  }

  parsePropertiesToUpdate(propertiesString) {
    try {
      // Try to parse as JSON first
      return JSON.parse(propertiesString);
    } catch {
      // If not JSON, try to parse natural language
      const properties = {};
      
      // Simple natural language parsing
      const patterns = [
        /set\s+(\w+)\s+to\s+(.+?)(?:\s+and|$)/gi,
        /(\w+)\s*:\s*(.+?)(?:\s*,|$)/gi,
        /(\w+)\s*=\s*(.+?)(?:\s*,|$)/gi,
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(propertiesString)) !== null) {
          const [, key, value] = match;
          properties[key.trim()] = {
            rich_text: [createRichText(value.trim())],
          };
        }
      }

      return properties;
    }
  }
}

exports.NotionAITool = NotionAITool;