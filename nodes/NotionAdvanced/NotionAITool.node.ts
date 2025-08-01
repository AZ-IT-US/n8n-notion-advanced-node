import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
  NodeOperationError,
  NodeConnectionType,
} from 'n8n-workflow';

import {
  notionApiRequest,
  validateCredentials,
  createRichText,
  resolvePageId,
  createHeadingBlock,
  createDividerBlock,
  createCalloutBlock,
  createImageBlock,
  createEquationBlock,
  createEmbedBlock,
  createBookmarkBlock,
  createToggleBlock,
  createListItemBlock,
  createToDoBlock,
  createQuoteBlock,
  createCodeBlock,
  createParagraphBlock,
} from './NotionUtils';

export class NotionAITool implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Notion AI Tool',
    name: 'notionAiTool',
    icon: 'file:notion.svg',
    group: ['ai'] as any,
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'AI-powered tool for creating and managing Notion content. Designed for use with AI Agent Nodes.',
    defaults: {
      name: 'Notion AI Tool',
    },
    inputs: ['main'],
    outputs: ['main'],
    usableAsTool: true,
    codex: {
      categories: ['Productivity', 'AI', 'Documentation'],
      subcategories: {
        'Productivity': ['Notion', 'Knowledge Management'],
        'AI': ['AI Agent Tools', 'Natural Language Processing'],
        'Documentation': ['Page Creation', 'Content Management']
      },
      resources: {
        primaryDocumentation: [
          {
            url: 'https://github.com/AZ-IT-US/n8n-notion-advanced-node#ai-tool-usage',
          },
        ],
      },
      alias: ['notion', 'productivity', 'ai-tool', 'pages', 'database'],
    },
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

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const responseData: IDataObject[] = [];

    // Validate credentials
    const isValid = await validateCredentials.call(this);
    if (!isValid) {
      throw new NodeOperationError(this.getNode(), 'Invalid Notion API credentials');
    }

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string;
        let result: IDataObject;
        
        switch (operation) {
          case 'createPageWithContent':
            result = await NotionAITool.createPageWithContent(this, i);
            break;
          case 'addContentToPage':
            result = await NotionAITool.addContentToPage(this, i);
            break;
          case 'searchPages':
            result = await NotionAITool.searchPages(this, i);
            break;
          case 'updatePageProperties':
            result = await NotionAITool.updatePageProperties(this, i);
            break;
          case 'createDatabaseEntry':
            result = await NotionAITool.createDatabaseEntry(this, i);
            break;
          case 'queryDatabase':
            result = await NotionAITool.queryDatabase(this, i);
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
            error: (error as Error).message,
            success: false,
          });
        } else {
          throw error;
        }
      }
    }

    return [this.helpers.returnJsonArray(responseData)];
  }

  static async createPageWithContent(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const pageTitle = executeFunctions.getNodeParameter('pageTitle', itemIndex) as string;
    const parentId = executeFunctions.getNodeParameter('parentId', itemIndex) as string;
    const content = executeFunctions.getNodeParameter('content', itemIndex, '') as string;
    const additionalOptions = executeFunctions.getNodeParameter('additionalOptions', itemIndex, {}) as IDataObject;

    const resolvedParentId = await resolvePageId.call(executeFunctions, parentId);

    // Create the page first
    const pageBody: IDataObject = {
      parent: { page_id: resolvedParentId },
      properties: {
        title: {
          title: [createRichText(pageTitle)],
        },
      },
    };

    // Add icon and cover if provided
    if (additionalOptions.icon) {
      pageBody.icon = { type: 'emoji', emoji: additionalOptions.icon as string };
    }
    if (additionalOptions.coverUrl) {
      pageBody.cover = { type: 'external', external: { url: additionalOptions.coverUrl as string } };
    }

    const page = await notionApiRequest.call(executeFunctions, 'POST', '/pages', pageBody);

    // If content is provided, add it to the page
    if (content) {
      const blocks = NotionAITool.parseContentToBlocks(content);
      if (blocks.length > 0) {
        await notionApiRequest.call(executeFunctions, 'PATCH', `/blocks/${page.id}/children`, {
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

  static async addContentToPage(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const targetPageId = executeFunctions.getNodeParameter('targetPageId', itemIndex) as string;
    const content = executeFunctions.getNodeParameter('content', itemIndex) as string;

    const resolvedPageId = await resolvePageId.call(executeFunctions, targetPageId);
    const blocks = NotionAITool.parseContentToBlocks(content);

    if (blocks.length === 0) {
      throw new NodeOperationError(executeFunctions.getNode(), 'No valid content blocks found to add');
    }

    const result = await notionApiRequest.call(executeFunctions, 'PATCH', `/blocks/${resolvedPageId}/children`, {
      children: blocks,
    });

    return {
      pageId: resolvedPageId,
      blocksAdded: blocks.length,
      message: `Added ${blocks.length} content blocks to page`,
      result,
    };
  }

  static async searchPages(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const searchQuery = executeFunctions.getNodeParameter('searchQuery', itemIndex, '') as string;
    const additionalOptions = executeFunctions.getNodeParameter('additionalOptions', itemIndex, {}) as IDataObject;
    const maxResults = (additionalOptions.maxResults as number) || 20;

    const body: IDataObject = {
      page_size: Math.min(maxResults, 100),
    };

    if (searchQuery) {
      body.query = searchQuery;
    }

    body.filter = {
      property: 'object',
      value: 'page',
    };

    const response = await notionApiRequest.call(executeFunctions, 'POST', '/search', body);

    return {
      totalResults: response.results?.length || 0,
      pages: response.results || [],
      message: `Found ${response.results?.length || 0} pages`,
    };
  }

  static async updatePageProperties(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const targetPageId = executeFunctions.getNodeParameter('targetPageId', itemIndex) as string;
    const propertiesToUpdate = executeFunctions.getNodeParameter('propertiesToUpdate', itemIndex) as string;

    const resolvedPageId = await resolvePageId.call(executeFunctions, targetPageId);
    const properties = NotionAITool.parsePropertiesToUpdate(propertiesToUpdate);

    const result = await notionApiRequest.call(executeFunctions, 'PATCH', `/pages/${resolvedPageId}`, {
      properties,
    });

    return {
      pageId: resolvedPageId,
      updatedProperties: Object.keys(properties),
      message: `Updated ${Object.keys(properties).length} properties`,
      result,
    };
  }

  static async createDatabaseEntry(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const parentId = executeFunctions.getNodeParameter('parentId', itemIndex) as string;
    const entryProperties = executeFunctions.getNodeParameter('entryProperties', itemIndex) as string;

    const resolvedParentId = await resolvePageId.call(executeFunctions, parentId);
    const properties = NotionAITool.parsePropertiesToUpdate(entryProperties);

    const result = await notionApiRequest.call(executeFunctions, 'POST', '/pages', {
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

  static async queryDatabase(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const databaseId = executeFunctions.getNodeParameter('databaseId', itemIndex) as string;
    const queryFilter = executeFunctions.getNodeParameter('queryFilter', itemIndex, '') as string;
    const additionalOptions = executeFunctions.getNodeParameter('additionalOptions', itemIndex, {}) as IDataObject;
    const maxResults = (additionalOptions.maxResults as number) || 20;

    const resolvedDatabaseId = await resolvePageId.call(executeFunctions, databaseId);
    const body: IDataObject = {
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

    const response = await notionApiRequest.call(executeFunctions, 'POST', `/databases/${resolvedDatabaseId}/query`, body);

    return {
      databaseId: resolvedDatabaseId,
      totalResults: response.results?.length || 0,
      entries: response.results || [],
      message: `Found ${response.results?.length || 0} database entries`,
    };
  }

  static parseContentToBlocks(content: string): IDataObject[] {
    const blocks: IDataObject[] = [];
    
    // Handle both actual newlines and escaped \n characters
    const normalizedContent = content.replace(/\\n/g, '\n');
    
    // First, process XML-like tags for reliable parsing
    const processedContent = NotionAITool.processXmlTags(normalizedContent, blocks);
    
    // Then process remaining content with traditional markdown patterns
    const lines = processedContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Skip completely empty lines and XML placeholders
      if (!trimmedLine || trimmedLine.startsWith('__XML_BLOCK_')) continue;

      // Traditional markdown patterns (for backwards compatibility)
      if (trimmedLine.startsWith('# ')) {
        blocks.push({
          type: 'heading_1',
          heading_1: {
            rich_text: [createRichText(trimmedLine.substring(2).trim())],
          },
        });
      } else if (trimmedLine.startsWith('## ')) {
        blocks.push({
          type: 'heading_2',
          heading_2: {
            rich_text: [createRichText(trimmedLine.substring(3).trim())],
          },
        });
      } else if (trimmedLine.startsWith('### ')) {
        blocks.push({
          type: 'heading_3',
          heading_3: {
            rich_text: [createRichText(trimmedLine.substring(4).trim())],
          },
        });
      } else if (trimmedLine === '---' || trimmedLine === '***') {
        blocks.push({
          type: 'divider',
          divider: {},
        });
      } else if (trimmedLine.includes('[!') && trimmedLine.startsWith('>')) {
        // Callout blocks: > [!info] content
        const calloutMatch = trimmedLine.match(/^>\s*\[!(\w+)\]\s*(.*)/i);
        if (calloutMatch) {
          const [, calloutType, text] = calloutMatch;
          const emoji = NotionAITool.getCalloutEmoji(calloutType.toLowerCase());
          const color = NotionAITool.getCalloutColor(calloutType.toLowerCase());
          blocks.push({
            type: 'callout',
            callout: {
              rich_text: NotionAITool.parseBasicMarkdown(text),
              icon: { type: 'emoji', emoji },
              color: color,
            },
          });
        } else {
          blocks.push({
            type: 'quote',
            quote: {
              rich_text: NotionAITool.parseBasicMarkdown(trimmedLine.substring(1).trim()),
            },
          });
        }
      } else if (trimmedLine.startsWith('![') && trimmedLine.includes('](') && trimmedLine.endsWith(')')) {
        // Image: ![alt text](url)
        const match = trimmedLine.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (match) {
          const [, altText, url] = match;
          blocks.push({
            type: 'image',
            image: {
              type: 'external',
              external: { url },
              caption: altText ? NotionAITool.parseBasicMarkdown(altText) : [],
            },
          });
        }
      } else if (trimmedLine.startsWith('$$') && trimmedLine.endsWith('$$') && trimmedLine.length > 4) {
        // Equation: $$equation$$
        const equation = trimmedLine.substring(2, trimmedLine.length - 2).trim();
        blocks.push({
          type: 'equation',
          equation: {
            expression: equation,
          },
        });
      } else if ((trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')) && !trimmedLine.includes(' ')) {
        // Check if it's a video URL for embed, otherwise bookmark
        const videoPatterns = [
          /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)/i,
          /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/)/i,
          /(?:https?:\/\/)?(?:www\.)?(?:dailymotion\.com\/video\/)/i,
          /(?:https?:\/\/)?(?:www\.)?(?:twitch\.tv\/)/i,
          /(?:https?:\/\/)?(?:www\.)?(?:loom\.com\/share\/)/i,
          /(?:https?:\/\/)?(?:www\.)?(?:figma\.com\/)/i,
          /(?:https?:\/\/)?(?:www\.)?(?:miro\.com\/)/i,
          /(?:https?:\/\/)?(?:codepen\.io\/)/i
        ];
        
        const isEmbeddableUrl = videoPatterns.some(pattern => pattern.test(trimmedLine));
        
        if (isEmbeddableUrl) {
          blocks.push({
            type: 'embed',
            embed: {
              url: trimmedLine,
            },
          });
        } else {
          blocks.push({
            type: 'bookmark',
            bookmark: {
              url: trimmedLine,
            },
          });
        }
      } else if (trimmedLine.startsWith('- [') && (trimmedLine.includes('[ ]') || trimmedLine.includes('[x]') || trimmedLine.includes('[X]'))) {
        // To-do list items: - [ ] or - [x] or - [X]
        const isChecked = trimmedLine.includes('[x]') || trimmedLine.includes('[X]');
        const text = trimmedLine.replace(/^-\s*\[[ xX]\]\s*/, '').trim();
        blocks.push({
          type: 'to_do',
          to_do: {
            rich_text: NotionAITool.parseBasicMarkdown(text),
            checked: isChecked,
          },
        });
      } else if (trimmedLine.startsWith('- ') && !trimmedLine.startsWith('- [')) {
        // Bullet list items: - item (but not todos)
        const listText = trimmedLine.substring(2).trim();
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: NotionAITool.parseBasicMarkdown(listText),
          },
        });
      } else if (/^\d+\.\s/.test(trimmedLine)) {
        // Numbered list items: 1. item
        const listText = trimmedLine.replace(/^\d+\.\s/, '').trim();
        blocks.push({
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: NotionAITool.parseBasicMarkdown(listText),
          },
        });
      } else if (trimmedLine.startsWith('> ') && !trimmedLine.includes('[!')) {
        // Quote block (but not callout)
        blocks.push({
          type: 'quote',
          quote: {
            rich_text: NotionAITool.parseBasicMarkdown(trimmedLine.substring(2).trim()),
          },
        });
      } else if (trimmedLine.startsWith('```')) {
        // Handle code blocks
        const language = trimmedLine.substring(3).trim() || 'plain text';
        const codeLines: string[] = [];
        i++; // Skip the opening ```
        
        // Collect all code lines until closing ```
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        
        blocks.push({
          type: 'code',
          code: {
            rich_text: [createRichText(codeLines.join('\n'))],
            language: language === 'plain text' ? 'plain_text' : language,
          },
        });
      } else {
        // Regular paragraph - handle basic markdown formatting
        const richText = NotionAITool.parseBasicMarkdown(trimmedLine);
        blocks.push({
          type: 'paragraph',
          paragraph: {
            rich_text: richText,
          },
        });
      }
    }

    return blocks;
  }

  // New XML-like tag processing function
  static processXmlTags(content: string, blocks: IDataObject[]): string {
    let processedContent = content;
    let blockCounter = 0;

    // Process XML-like tags in order of priority
    const tagProcessors = [
      // Callouts: <callout type="info">content</callout>
      {
        regex: /<callout\s*(?:type="([^"]*)")?\s*>(.*?)<\/callout>/gis,
        processor: (match: string, type: string = 'info', content: string) => {
          const emoji = NotionAITool.getCalloutEmoji(type.toLowerCase());
          const color = NotionAITool.getCalloutColor(type.toLowerCase());
          blocks.push({
            type: 'callout',
            callout: {
              rich_text: NotionAITool.parseBasicMarkdown(content.trim()),
              icon: { type: 'emoji', emoji },
              color: color,
            },
          });
          return `__XML_BLOCK_${blockCounter++}__`;
        }
      },

      // Code blocks: <code language="javascript">content</code>
      {
        regex: /<code\s*(?:language="([^"]*)")?\s*>(.*?)<\/code>/gis,
        processor: (match: string, language: string = 'plain_text', content: string) => {
          blocks.push({
            type: 'code',
            code: {
              rich_text: [createRichText(content.trim())],
              language: language === 'plain text' ? 'plain_text' : language,
            },
          });
          return `__XML_BLOCK_${blockCounter++}__`;
        }
      },

      // Images: <image src="url" alt="description">caption</image>
      {
        regex: /<image\s+src="([^"]*)"(?:\s+alt="([^"]*)")?\s*>(.*?)<\/image>/gis,
        processor: (match: string, src: string, alt: string = '', caption: string = '') => {
          const captionText = caption.trim() || alt;
          blocks.push({
            type: 'image',
            image: {
              type: 'external',
              external: { url: src },
              caption: captionText ? NotionAITool.parseBasicMarkdown(captionText) : [],
            },
          });
          return `__XML_BLOCK_${blockCounter++}__`;
        }
      },

      // Self-closing images: <image src="url" alt="description"/>
      {
        regex: /<image\s+src="([^"]*)"(?:\s+alt="([^"]*)")?\s*\/>/gis,
        processor: (match: string, src: string, alt: string = '') => {
          blocks.push({
            type: 'image',
            image: {
              type: 'external',
              external: { url: src },
              caption: alt ? NotionAITool.parseBasicMarkdown(alt) : [],
            },
          });
          return `__XML_BLOCK_${blockCounter++}__`;
        }
      },

      // Equations: <equation>E=mc^2</equation>
      {
        regex: /<equation>(.*?)<\/equation>/gis,
        processor: (match: string, expression: string) => {
          blocks.push({
            type: 'equation',
            equation: {
              expression: expression.trim(),
            },
          });
          return `__XML_BLOCK_${blockCounter++}__`;
        }
      },

      // Embeds: <embed>url</embed>
      {
        regex: /<embed>(.*?)<\/embed>/gis,
        processor: (match: string, url: string) => {
          blocks.push({
            type: 'embed',
            embed: {
              url: url.trim(),
            },
          });
          return `__XML_BLOCK_${blockCounter++}__`;
        }
      },

      // Bookmarks: <bookmark>url</bookmark>
      {
        regex: /<bookmark>(.*?)<\/bookmark>/gis,
        processor: (match: string, url: string) => {
          blocks.push({
            type: 'bookmark',
            bookmark: {
              url: url.trim(),
            },
          });
          return `__XML_BLOCK_${blockCounter++}__`;
        }
      },

      // Toggles: <toggle>title</toggle>
      {
        regex: /<toggle>(.*?)<\/toggle>/gis,
        processor: (match: string, title: string) => {
          blocks.push({
            type: 'toggle',
            toggle: {
              rich_text: NotionAITool.parseBasicMarkdown(title.trim()),
              children: [],
            },
          });
          return `__XML_BLOCK_${blockCounter++}__`;
        }
      },

      // Quotes: <quote>content</quote>
      {
        regex: /<quote>(.*?)<\/quote>/gis,
        processor: (match: string, content: string) => {
          blocks.push({
            type: 'quote',
            quote: {
              rich_text: NotionAITool.parseBasicMarkdown(content.trim()),
            },
          });
          return `__XML_BLOCK_${blockCounter++}__`;
        }
      },

      // Dividers: <divider/> or <divider></divider>
      {
        regex: /<divider\s*\/?>/gis,
        processor: (match: string) => {
          blocks.push({
            type: 'divider',
            divider: {},
          });
          return `__XML_BLOCK_${blockCounter++}__`;
        }
      },

      // To-do items: <todo checked="true">content</todo>
      {
        regex: /<todo\s*(?:checked="([^"]*)")?\s*>(.*?)<\/todo>/gis,
        processor: (match: string, checked: string = 'false', content: string) => {
          const isChecked = checked.toLowerCase() === 'true';
          blocks.push({
            type: 'to_do',
            to_do: {
              rich_text: NotionAITool.parseBasicMarkdown(content.trim()),
              checked: isChecked,
            },
          });
          return `__XML_BLOCK_${blockCounter++}__`;
        }
      },

      // Headings: <h1>content</h1>, <h2>content</h2>, <h3>content</h3>
      {
        regex: /<h([123])>(.*?)<\/h[123]>/gis,
        processor: (match: string, level: string, content: string) => {
          const headingType = `heading_${level}` as 'heading_1' | 'heading_2' | 'heading_3';
          blocks.push({
            type: headingType,
            [headingType]: {
              rich_text: [createRichText(content.trim())],
            },
          });
          return `__XML_BLOCK_${blockCounter++}__`;
        }
      },
    ];

    // Process each tag type
    tagProcessors.forEach(({ regex, processor }) => {
      processedContent = processedContent.replace(regex, (match: string, group1?: string, group2?: string, group3?: string) => {
        return processor(match, group1 || '', group2 || '', group3 || '');
      });
    });

    return processedContent;
  }

  // Helper function to get callout emoji based on type
  static getCalloutEmoji(type: string): string {
    const emojiMap: { [key: string]: string } = {
      'info': 'ℹ️',
      'warning': '⚠️',
      'danger': '🚨',
      'error': '❌',
      'note': '📝',
      'tip': '💡',
      'success': '✅',
      'question': '❓',
    };
    return emojiMap[type] || 'ℹ️';
  }

  // Helper function to get callout color based on type
  static getCalloutColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      'info': 'blue',
      'warning': 'yellow',
      'danger': 'red',
      'error': 'red',
      'note': 'gray',
      'tip': 'green',
      'success': 'green',
      'question': 'purple',
    };
    return colorMap[type] || 'gray';
  }

  // Helper function to parse basic markdown formatting in text
  static parseBasicMarkdown(text: string): IDataObject[] {
    const richTextObjects: IDataObject[] = [];
    
    // Find and collect all formatting patterns with their positions
    const patterns = [
      { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'link' },        // [text](url)
      { regex: /\*\*\*([^*]+)\*\*\*/g, type: 'bold_italic' },    // ***bold italic***
      { regex: /\*\*([^*]+)\*\*/g, type: 'bold' },               // **bold**
      { regex: /\*([^*]+)\*/g, type: 'italic' },                 // *italic*
      { regex: /~~([^~]+)~~/g, type: 'strikethrough' },          // ~~strikethrough~~
      { regex: /`([^`]+)`/g, type: 'code' },                     // `code`
    ];
    
    interface MatchResult {
      start: number;
      end: number;
      text: string;
      type: string;
      url?: string;
    }
    
    const matches: MatchResult[] = [];
    
    // Collect all matches
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern.regex.source, 'g');
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (pattern.type === 'link') {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[1], // Link text
            type: pattern.type,
            url: match[2] // Link URL
          });
        } else {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[1], // Inner text
            type: pattern.type
          });
        }
      }
    });
    
    // Sort matches by position and resolve overlaps (prefer longer matches)
    matches.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start); // Prefer longer matches
    });
    
    // Remove overlapping matches (keep the first/longer one)
    const resolvedMatches: MatchResult[] = [];
    for (const match of matches) {
      const hasOverlap = resolvedMatches.some(existing =>
        (match.start < existing.end && match.end > existing.start)
      );
      if (!hasOverlap) {
        resolvedMatches.push(match);
      }
    }
    
    // Sort again by position
    resolvedMatches.sort((a, b) => a.start - b.start);
    
    // If no formatting found, return simple rich text
    if (resolvedMatches.length === 0) {
      return [createRichText(text) as unknown as IDataObject];
    }
    
    // Build rich text segments
    let lastIndex = 0;
    
    resolvedMatches.forEach(match => {
      // Add plain text before this match
      if (match.start > lastIndex) {
        const plainText = text.substring(lastIndex, match.start);
        if (plainText) {
          richTextObjects.push(createRichText(plainText) as unknown as IDataObject);
        }
      }
      
      // Add formatted text
      const richTextObj: any = {
        type: 'text',
        text: { content: match.text },
        annotations: {}
      };
      
      // Apply formatting based on type
      switch (match.type) {
        case 'bold':
          richTextObj.annotations.bold = true;
          break;
        case 'italic':
          richTextObj.annotations.italic = true;
          break;
        case 'bold_italic':
          richTextObj.annotations.bold = true;
          richTextObj.annotations.italic = true;
          break;
        case 'strikethrough':
          richTextObj.annotations.strikethrough = true;
          break;
        case 'code':
          richTextObj.annotations.code = true;
          break;
        case 'link':
          richTextObj.text.link = { url: match.url };
          break;
      }
      
      // Clean up empty annotations
      if (Object.keys(richTextObj.annotations).length === 0) {
        delete richTextObj.annotations;
      }
      
      richTextObjects.push(richTextObj as unknown as IDataObject);
      lastIndex = match.end;
    });
    
    // Add remaining plain text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        richTextObjects.push(createRichText(remainingText) as unknown as IDataObject);
      }
    }
    
    return richTextObjects.length > 0 ? richTextObjects : [createRichText(text) as unknown as IDataObject];
  }

  static parsePropertiesToUpdate(propertiesString: string): IDataObject {
    try {
      // Try to parse as JSON first
      return JSON.parse(propertiesString);
    } catch {
      // If not JSON, try to parse natural language
      const properties: IDataObject = {};
      
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