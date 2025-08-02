import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
  NodeOperationError,
  NodeConnectionType,
} from 'n8n-workflow';

import { randomUUID } from 'crypto';

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

// Interface for XML tag matching and processing
interface TagMatch {
  start: number;
  end: number;
  match: string;
  processor: (match: string, group1?: string, group2?: string, group3?: string) => string;
  groups: string[];
  replacement?: string;
}

// Interface for hierarchical XML tree structure
interface XMLNode {
  id: string;
  tagName: string;
  start: number;
  end: number;
  match: string;
  processor: (...args: string[]) => IDataObject | null;
  groups: string[];
  children: XMLNode[];
  parent?: XMLNode;
  depth: number;
  innerContent: string;
  replacement?: string;
  listProcessor?: (content: string, blocks: IDataObject[]) => void;
}

// Interface for object-based JSON hierarchy structure
interface HierarchyNode {
  block: IDataObject;
  children: HierarchyNode[];
  metadata?: {
    sourcePosition?: number;
    xmlNodeId?: string;
    tagName?: string;
  };
}

// Interface for processing results
interface ProcessingResult {
  blocks: IDataObject[];
  processedContent: string;
}

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

  // Helper method to support both camelCase and underscore parameter names for AI agent compatibility
  static getFlexibleParameter(executeFunctions: IExecuteFunctions, itemIndex: number, primaryName: string, alternativeNames: string[] = [], defaultValue?: any): any {
    try {
      // First try the primary (camelCase) parameter name
      return executeFunctions.getNodeParameter(primaryName, itemIndex, defaultValue);
    } catch (error) {
      // If that fails, try each alternative name
      for (const altName of alternativeNames) {
        try {
          return executeFunctions.getNodeParameter(altName, itemIndex, defaultValue);
        } catch (altError) {
          // Continue to next alternative
        }
      }
      
      // If all parameter names fail, return default value or throw original error
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw error;
    }
  }

  static async createPageWithContent(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    // Support both camelCase and underscore parameter names for AI agent compatibility
    const pageTitle = NotionAITool.getFlexibleParameter(executeFunctions, itemIndex, 'pageTitle', ['Page_Title', 'page_title']);
    const parentId = NotionAITool.getFlexibleParameter(executeFunctions, itemIndex, 'parentId', ['Parent_Page_Database_ID', 'parent_id', 'parentPageDatabaseId']);
    const content = NotionAITool.getFlexibleParameter(executeFunctions, itemIndex, 'content', ['Content'], '');
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
    const targetPageId = NotionAITool.getFlexibleParameter(executeFunctions, itemIndex, 'targetPageId', ['Target_Page_ID', 'target_page_id']);
    const content = NotionAITool.getFlexibleParameter(executeFunctions, itemIndex, 'content', ['Content']);

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
    const searchQuery = NotionAITool.getFlexibleParameter(executeFunctions, itemIndex, 'searchQuery', ['Search_Query', 'search_query'], '');
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
    const targetPageId = NotionAITool.getFlexibleParameter(executeFunctions, itemIndex, 'targetPageId', ['Target_Page_ID', 'target_page_id']);
    const propertiesToUpdate = NotionAITool.getFlexibleParameter(executeFunctions, itemIndex, 'propertiesToUpdate', ['Properties_To_Update', 'properties_to_update']);

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
    const parentId = NotionAITool.getFlexibleParameter(executeFunctions, itemIndex, 'parentId', ['Parent_Page_Database_ID', 'parent_id', 'parentPageDatabaseId']);
    const entryProperties = NotionAITool.getFlexibleParameter(executeFunctions, itemIndex, 'entryProperties', ['Entry_Properties', 'entry_properties']);

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
    const databaseId = NotionAITool.getFlexibleParameter(executeFunctions, itemIndex, 'databaseId', ['Database_ID', 'database_id']);
    const queryFilter = NotionAITool.getFlexibleParameter(executeFunctions, itemIndex, 'queryFilter', ['Query_Filter', 'query_filter'], '');
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
      
      // Skip completely empty lines and placeholder artifacts
      if (!trimmedLine || /__BLOCK_\d+__/.test(trimmedLine) || /^\d+__$/.test(trimmedLine)) continue;
      
      // Skip lines that contain ANY XML/HTML tag patterns (to prevent double processing)
      // This is a comprehensive check to ensure NO XML content gets processed twice
      const hasAnyXmlTags = (
        // Basic XML/HTML tag detection
        /<[^>]+>/.test(trimmedLine) ||
        // HTML-encoded tags
        /&lt;[^&]+&gt;/.test(trimmedLine) ||
        // Any opening or closing XML/HTML tags
        /<\/?[a-zA-Z][a-zA-Z0-9]*[^>]*>/.test(trimmedLine) ||
        // Self-closing tags
        /<[a-zA-Z][a-zA-Z0-9]*[^>]*\/>/.test(trimmedLine) ||
        // Common XML/HTML tag names (comprehensive list)
        /<\/?(?:h[1-6]|p|div|span|ul|ol|li|strong|b|em|i|code|pre|blockquote|callout|todo|image|embed|bookmark|equation|toggle|quote|divider|br|a|u|s|del|mark)\b[^>]*>/i.test(trimmedLine) ||
        // Specific attribute patterns
        /(?:type|src|href|alt|language|checked)="[^"]*"/.test(trimmedLine) ||
        // Any line that looks like it contains XML structure
        /^\s*<[^>]+>.*<\/[^>]+>\s*$/.test(trimmedLine) ||
        // Lines that start or end with XML tags
        /^\s*<[^>]+>/.test(trimmedLine) ||
        /<\/[^>]+>\s*$/.test(trimmedLine)
      );
      
      if (hasAnyXmlTags) {
        continue; // Skip ALL lines containing XML content to prevent double processing
      }

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

  // Helper function to resolve overlapping tag matches
  static resolveOverlaps(matches: TagMatch[]): TagMatch[] {
    const resolved: TagMatch[] = [];
    const sorted = matches.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start); // Prefer longer matches
    });
    
    for (const match of sorted) {
      const hasOverlap = resolved.some(existing =>
        (match.start < existing.end && match.end > existing.start)
      );
      if (!hasOverlap) {
        resolved.push(match);
      }
    }
    return resolved;
  }

  // Helper function to validate XML tag structure
  static validateXmlTag(match: string, tagName: string): boolean {
    try {
      // Basic validation for well-formed tags
      const openTag = new RegExp(`<${tagName}[^>]*>`, 'i');
      const closeTag = new RegExp(`</${tagName}>`, 'i');
      
      if (!openTag.test(match) || !closeTag.test(match)) {
        console.warn(`Malformed XML tag detected: ${match.substring(0, 50)}...`);
        return false;
      }
      return true;
    } catch (error) {
      console.warn(`Error validating XML tag: ${error}`);
      return false;
    }
  }

  // Helper function for optimized string replacement
  static optimizedReplace(content: string, matches: { start: number; end: number; replacement: string; match: string; }[]): string {
    if (matches.length === 0) return content;
    
    const parts: string[] = [];
    let lastIndex = 0;
    
    matches.forEach(({ start, end, replacement }) => {
      parts.push(content.substring(lastIndex, start));
      parts.push(replacement);
      lastIndex = end;
    });
    parts.push(content.substring(lastIndex));
    
    return parts.join('');
  }

  // Helper function for Unicode-safe position calculation
  static getUtf8BytePosition(str: string, charIndex: number): number {
    try {
      return Buffer.from(str.substring(0, charIndex), 'utf8').length;
    } catch (error) {
      // Fallback to character index if Buffer operations fail
      return charIndex;
    }
  }

  // Enhanced hierarchical XML tree structure using depth-aware parsing
  static buildXMLTree(content: string, tagProcessors: any[]): XMLNode[] {
    const allMatches: XMLNode[] = [];
    
    // Step 1: Use regex-based parsing to properly extract capture groups, then enhance with depth-aware structure
    tagProcessors.forEach(({ regex, blockCreator, listProcessor }) => {
      const globalRegex = new RegExp(regex.source, 'gis');
      let match;
      
      while ((match = globalRegex.exec(content)) !== null) {
        const fullMatch = match[0];
        const matchStart = match.index;
        const matchEnd = match.index + fullMatch.length;
        
        // Extract tag name for identification
        const tagPattern = regex.source.match(/<(\w+)/)?.[1] || 'unknown';
        
        // Extract inner content (between opening and closing tags)
        let innerContent = '';
        try {
          const openTagRegex = new RegExp(`^<${tagPattern}[^>]*>`, 'i');
          const closeTagRegex = new RegExp(`</${tagPattern}>$`, 'i');
          
          const openMatch = fullMatch.match(openTagRegex);
          const closeMatch = fullMatch.match(closeTagRegex);
          
          if (openMatch && closeMatch) {
            const openTag = openMatch[0];
            const closeTag = closeMatch[0];
            const startIndex = openTag.length;
            const endIndex = fullMatch.length - closeTag.length;
            innerContent = fullMatch.substring(startIndex, endIndex);
          } else {
            // Fallback for self-closing or malformed tags
            innerContent = fullMatch.replace(/^<[^>]*>/, '').replace(/<\/[^>]*>$/, '');
          }
        } catch (error) {
          console.warn(`Error extracting inner content for ${tagPattern}:`, error);
          innerContent = fullMatch;
        }
        
        const xmlNode = {
          id: `${tagPattern}_${matchStart}_${Date.now()}_${Math.random()}`,
          tagName: tagPattern,
          start: matchStart,
          end: matchEnd,
          match: fullMatch,
          processor: blockCreator,
          groups: match.slice(1), // Proper regex capture groups (excluding full match)
          children: [],
          depth: 0,
          innerContent,
          replacement: undefined,
          listProcessor
        };
        allMatches.push(xmlNode);
      }
    });

    // Step 2: Catch ANY remaining XML/HTML tags that weren't processed by specific processors
    const genericXmlRegex = /<[^>]+>[\s\S]*?<\/[^>]+>|<[^>]+\/>/gis;
    let genericMatch;
    const processedRanges = allMatches.map(node => ({ start: node.start, end: node.end }));
    
    while ((genericMatch = genericXmlRegex.exec(content)) !== null) {
      const matchStart = genericMatch.index;
      const matchEnd = genericMatch.index + genericMatch[0].length;
      
      // Check if this match overlaps with any already processed range
      const hasOverlap = processedRanges.some(range =>
        (matchStart < range.end && matchEnd > range.start)
      );
      
      if (!hasOverlap) {
        const tagName = genericMatch[0].match(/<(\w+)/)?.[1] || 'generic';
        const xmlNode = {
          id: `${tagName}_${matchStart}_${Date.now()}_${Math.random()}`,
          tagName,
          start: matchStart,
          end: matchEnd,
          match: genericMatch[0],
          processor: () => null,
          groups: [],
          children: [],
          depth: 0,
          innerContent: genericMatch[0],
          replacement: undefined,
          listProcessor: undefined
        };
        allMatches.push(xmlNode);
      }
    }

    // Sort by start position to maintain document order
    allMatches.sort((a, b) => a.start - b.start);

    // Build parent-child relationships
    const rootNodes: XMLNode[] = [];
    const nodeStack: XMLNode[] = [];

    for (const node of allMatches) {
      // Pop nodes from stack that don't contain this node
      while (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].end <= node.start) {
        nodeStack.pop();
      }

      // Set depth based on stack size
      node.depth = nodeStack.length;

      // If there's a parent on the stack, add this as its child
      if (nodeStack.length > 0) {
        const parent = nodeStack[nodeStack.length - 1];
        node.parent = parent;
        parent.children.push(node);
      } else {
        // This is a root node
        rootNodes.push(node);
      }

      // Push to stack for potential children
      if (!node.match.endsWith('/>') && node.match.includes('</')) {
        nodeStack.push(node);
      }
    }

    return rootNodes;
  }

  // Convert XML tree to HierarchyNode structure for cleaner processing
  static xmlTreeToHierarchy(nodes: XMLNode[]): HierarchyNode[] {
    const hierarchyNodes: HierarchyNode[] = [];
    
    const processNode = (xmlNode: XMLNode): HierarchyNode | null => {
      try {
        // Process children first
        const childHierarchyNodes: HierarchyNode[] = [];
        for (const child of xmlNode.children) {
          const childHierarchy = processNode(child);
          if (childHierarchy) {
            childHierarchyNodes.push(childHierarchy);
          }
        }
        
        // For list processors, handle them specially
        if (xmlNode.listProcessor && (xmlNode.tagName === 'ul' || xmlNode.tagName === 'ol')) {
          // Extract inner content
          const tagName = xmlNode.tagName.toLowerCase();
          const openTagRegex = new RegExp(`^<${tagName}[^>]*>`, 'i');
          const closeTagRegex = new RegExp(`</${tagName}>$`, 'i');
          
          let innerContent = xmlNode.match;
          const openMatch = xmlNode.match.match(openTagRegex);
          const closeMatch = xmlNode.match.match(closeTagRegex);
          
          if (openMatch && closeMatch) {
            const openTag = openMatch[0];
            const closeTag = closeMatch[0];
            const startIndex = openTag.length;
            const endIndex = xmlNode.match.length - closeTag.length;
            innerContent = xmlNode.match.substring(startIndex, endIndex);
          }
          
          // Build hierarchy structure for the list
          const listHierarchy = NotionAITool.buildListHierarchy(innerContent, xmlNode.tagName === 'ul' ? 'bulleted_list_item' : 'numbered_list_item', childHierarchyNodes);
          return listHierarchy;
        }
        
        // For regular nodes, create block and attach children
        const block = xmlNode.processor(...xmlNode.groups);
        if (!block) return null;
        
        const hierarchyNode: HierarchyNode = {
          block,
          children: childHierarchyNodes,
          metadata: {
            sourcePosition: xmlNode.start,
            xmlNodeId: xmlNode.id,
            tagName: xmlNode.tagName
          }
        };
        
        return hierarchyNode;
      } catch (error) {
        console.warn(`Error processing XML node ${xmlNode.tagName}:`, error);
        return null;
      }
    };
    
    // Process all root nodes
    for (const rootNode of nodes) {
      const hierarchyNode = processNode(rootNode);
      if (hierarchyNode) {
        if (hierarchyNode.block) {
          hierarchyNodes.push(hierarchyNode);
        } else if (hierarchyNode.children.length > 0) {
          // If it's a list container, add its children directly
          hierarchyNodes.push(...hierarchyNode.children);
        }
      }
    }
    
    return hierarchyNodes;
  }
  
  // Convert HierarchyNode structure to final Notion blocks
  static hierarchyToNotionBlocks(hierarchy: HierarchyNode[]): IDataObject[] {
    return hierarchy.map(node => {
      const block = { ...node.block };
      
      if (node.children.length > 0) {
        const blockData = block[block.type as string] as any;
        if (blockData && typeof blockData === 'object') {
          // Check if this block type can have children
          const childSupportingTypes = ['bulleted_list_item', 'numbered_list_item', 'toggle', 'quote', 'callout'];
          if (childSupportingTypes.includes(block.type as string)) {
            blockData.children = NotionAITool.hierarchyToNotionBlocks(node.children);
          }
        }
      }
      
      return block;
    });
  }
  
  // Process XML tree using the new hierarchy system
  static processXMLTreeDepthFirst(nodes: XMLNode[], blocks: IDataObject[], placeholderCounter: { value: number }): Map<string, string> {
    const replacements = new Map<string, string>();
    
    try {
      // Convert XML tree to hierarchy structure
      const hierarchy = NotionAITool.xmlTreeToHierarchy(nodes);
      
      // Convert hierarchy to final Notion blocks
      const finalBlocks = NotionAITool.hierarchyToNotionBlocks(hierarchy);
      
      // Add all blocks to the output
      blocks.push(...finalBlocks);
      
      // Mark all nodes as processed (empty replacement)
      const markProcessed = (nodeList: XMLNode[]) => {
        nodeList.forEach(node => {
          replacements.set(node.id, '');
          markProcessed(node.children);
        });
      };
      markProcessed(nodes);
      
    } catch (error) {
      console.warn('Error in hierarchy processing, falling back to legacy processing:', error);
      
      // Fallback to simple processing if hierarchy fails
      nodes.forEach(node => {
        try {
          const block = node.processor(...node.groups);
          if (block) {
            blocks.push(block);
          }
          replacements.set(node.id, '');
        } catch (nodeError) {
          console.warn(`Error processing fallback node ${node.tagName}:`, nodeError);
          replacements.set(node.id, '');
        }
      });
    }
    
    return replacements;
  }

  // Apply hierarchical replacements to content
  static applyHierarchicalReplacements(content: string, nodes: XMLNode[], replacements: Map<string, string>): string {
    let processedContent = content;
    
    // Sort nodes by start position in reverse order to avoid position shifts
    const allNodes = this.getAllNodesFromTree(nodes);
    allNodes.sort((a, b) => b.start - a.start);
    
    // Apply replacements from end to beginning
    for (const node of allNodes) {
      const replacement = replacements.get(node.id);
      if (replacement !== undefined) {
        processedContent = processedContent.substring(0, node.start) +
                          replacement +
                          processedContent.substring(node.end);
      }
    }
    
    return processedContent;
  }

  // Helper function to get all nodes from tree (flattened)
  static getAllNodesFromTree(nodes: XMLNode[]): XMLNode[] {
    const allNodes: XMLNode[] = [];
    
    const collectNodes = (nodeList: XMLNode[]) => {
      for (const node of nodeList) {
        allNodes.push(node);
        collectNodes(node.children);
      }
    };
    
    collectNodes(nodes);
    return allNodes;
  }

  // New hierarchical XML-like tag processing function
  static processXmlTags(content: string, blocks: IDataObject[]): string {
    let processedContent = content;
    
    // First, decode HTML entities to proper XML tags
    processedContent = NotionAITool.decodeHtmlEntities(processedContent);
    
    // Use simple sequential placeholder format: __BLOCK_N__
    let placeholderCounter = 1; // Start from 1 for cleaner numbering
    
    // Debug mode for development
    const DEBUG_ORDERING = process.env.NODE_ENV === 'development';

    // Define all tag processors
    const tagProcessors = [
      // Callouts: <callout type="info">content</callout>
      {
        regex: /<callout\s*(?:type="([^"]*)")?\s*>(.*?)<\/callout>/gis,
        blockCreator: (type: string = 'info', content: string) => {
          const emoji = NotionAITool.getCalloutEmoji(type.toLowerCase());
          const color = NotionAITool.getCalloutColor(type.toLowerCase());
          return {
            type: 'callout',
            callout: {
              rich_text: NotionAITool.parseBasicMarkdown(content.trim()),
              icon: { type: 'emoji', emoji },
              color: color,
            },
          };
        }
      },

      // Code blocks: <code language="javascript">content</code>
      {
        regex: /<code\s*(?:language="([^"]*)")?\s*>(.*?)<\/code>/gis,
        blockCreator: (language: string = 'plain_text', content: string) => {
          return {
            type: 'code',
            code: {
              rich_text: [createRichText(content.trim())],
              language: language === 'plain text' ? 'plain_text' : language,
            },
          };
        }
      },

      // Images: <image src="url" alt="description">caption</image>
      {
        regex: /<image\s+src="([^"]*)"(?:\s+alt="([^"]*)")?\s*>(.*?)<\/image>/gis,
        blockCreator: (src: string, alt: string = '', caption: string = '') => {
          const captionText = caption.trim() || alt;
          return {
            type: 'image',
            image: {
              type: 'external',
              external: { url: src },
              caption: captionText ? NotionAITool.parseBasicMarkdown(captionText) : [],
            },
          };
        }
      },

      // Self-closing images: <image src="url" alt="description"/>
      {
        regex: /<image\s+src="([^"]*)"(?:\s+alt="([^"]*)")?\s*\/>/gis,
        blockCreator: (src: string, alt: string = '') => {
          return {
            type: 'image',
            image: {
              type: 'external',
              external: { url: src },
              caption: alt ? NotionAITool.parseBasicMarkdown(alt) : [],
            },
          };
        }
      },

      // Equations: <equation>E=mc^2</equation>
      {
        regex: /<equation>(.*?)<\/equation>/gis,
        blockCreator: (expression: string) => {
          return {
            type: 'equation',
            equation: {
              expression: expression.trim(),
            },
          };
        }
      },

      // Embeds: <embed>url</embed>
      {
        regex: /<embed>(.*?)<\/embed>/gis,
        blockCreator: (url: string) => {
          return {
            type: 'embed',
            embed: {
              url: url.trim(),
            },
          };
        }
      },

      // Bookmarks: <bookmark>url</bookmark>
      {
        regex: /<bookmark>(.*?)<\/bookmark>/gis,
        blockCreator: (url: string) => {
          return {
            type: 'bookmark',
            bookmark: {
              url: url.trim(),
            },
          };
        }
      },

      // Toggles: <toggle>title</toggle>
      {
        regex: /<toggle>(.*?)<\/toggle>/gis,
        blockCreator: (title: string) => {
          return {
            type: 'toggle',
            toggle: {
              rich_text: NotionAITool.parseBasicMarkdown(title.trim()),
              children: [],
            },
          };
        }
      },

      // Quotes: <quote>content</quote>
      {
        regex: /<quote>(.*?)<\/quote>/gis,
        blockCreator: (content: string) => {
          return {
            type: 'quote',
            quote: {
              rich_text: NotionAITool.parseBasicMarkdown(content.trim()),
            },
          };
        }
      },

      // Dividers: <divider/> or <divider></divider>
      {
        regex: /<divider\s*\/?>/gis,
        blockCreator: () => {
          return {
            type: 'divider',
            divider: {},
          };
        }
      },

      // To-do items: <todo checked="true">content</todo>
      {
        regex: /<todo\s*(?:checked="([^"]*)")?\s*>(.*?)<\/todo>/gis,
        blockCreator: (checked: string = 'false', content: string) => {
          const isChecked = checked.toLowerCase() === 'true';
          return {
            type: 'to_do',
            to_do: {
              rich_text: NotionAITool.parseBasicMarkdown(content.trim()),
              checked: isChecked,
            },
          };
        }
      },

      // Headings: <h1>content</h1>, <h2>content</h2>, <h3>content</h3>
      {
        regex: /<h([123])>(.*?)<\/h[123]>/gis,
        blockCreator: (level: string, content: string) => {
          const headingType = `heading_${level}` as 'heading_1' | 'heading_2' | 'heading_3';
          return {
            type: headingType,
            [headingType]: {
              rich_text: [createRichText(content.trim())],
            },
          };
        }
      },

      // Paragraphs: <p>content</p>
      {
        regex: /<p>(.*?)<\/p>/gis,
        blockCreator: (content: string) => {
          // First convert HTML tags to markdown, then parse to rich text
          const markdownContent = NotionAITool.convertInlineHtmlToMarkdown(content.trim());
          return {
            type: 'paragraph',
            paragraph: {
              rich_text: NotionAITool.parseBasicMarkdown(markdownContent),
            },
          };
        }
      },

      // Process complete bulleted lists first: <ul><li>item</li></ul>
      {
        regex: /<ul\s*[^>]*>(.*?)<\/ul>/gis,
        blockCreator: (listContent: string) => {
          // This will be handled specially in hierarchical processing
          return null;
        },
        listProcessor: (listContent: string, blocks: IDataObject[]) => {
          NotionAITool.processNestedList(listContent, 'bulleted_list_item', blocks);
        }
      },

      // Process complete numbered lists first: <ol><li>item</li></ol>
      {
        regex: /<ol\s*[^>]*>(.*?)<\/ol>/gis,
        blockCreator: (listContent: string) => {
          // This will be handled specially in hierarchical processing
          return null;
        },
        listProcessor: (listContent: string, blocks: IDataObject[]) => {
          NotionAITool.processNestedList(listContent, 'numbered_list_item', blocks);
        }
      },

      // Blockquotes: <blockquote>content</blockquote>
      {
        regex: /<blockquote>(.*?)<\/blockquote>/gis,
        blockCreator: (content: string) => {
          return {
            type: 'quote',
            quote: {
              rich_text: NotionAITool.parseBasicMarkdown(content.trim()),
            },
          };
        }
      },

      // Preformatted text: <pre>content</pre>
      {
        regex: /<pre>(.*?)<\/pre>/gis,
        blockCreator: (content: string) => {
          return {
            type: 'code',
            code: {
              rich_text: [createRichText(content.trim())],
              language: 'plain_text',
            },
          };
        }
      },

      // REMOVED: Standalone <li> processor
      // <li> tags should ONLY be processed within <ul>/<ol> contexts via the list processors above
      // Having a standalone <li> processor causes XML fragments and double processing


      // Line breaks: <br/> or <br>
      {
        regex: /<br\s*\/?>/gis,
        blockCreator: () => {
          return {
            type: 'paragraph',
            paragraph: {
              rich_text: [createRichText('')],
            },
          };
        }
      },
    ];

    try {
      // Step 1: Build hierarchical XML tree
      const xmlTree = NotionAITool.buildXMLTree(processedContent, tagProcessors);
      
      if (DEBUG_ORDERING && xmlTree.length > 0) {
        console.log('XML Tree Structure:', xmlTree.map(node => ({
          tag: node.tagName,
          depth: node.depth,
          children: node.children.length,
          start: node.start
        })));
      }

      // Step 2: Process tree depth-first (children before parents)
      const counterRef = { value: 1 };
      const replacements = NotionAITool.processXMLTreeDepthFirst(xmlTree, blocks, counterRef);
      
      // Step 3: Apply hierarchical replacements to content
      processedContent = NotionAITool.applyHierarchicalReplacements(processedContent, xmlTree, replacements);
      
      // Step 4: Clean up any remaining HTML tags
      processedContent = NotionAITool.cleanupRemainingHtml(processedContent);
      
      if (DEBUG_ORDERING) {
        console.log(`Processed ${xmlTree.length} root XML nodes hierarchically, created ${blocks.length} blocks`);
      }
      
    } catch (error) {
      console.warn('Error in hierarchical XML processing, falling back to linear processing:', error);
      
      // Fallback to linear processing if hierarchical fails
      const allMatches: TagMatch[] = [];
      tagProcessors.forEach(({ regex, blockCreator }) => {
        const globalRegex = new RegExp(regex.source, 'gis');
        let match;
        while ((match = globalRegex.exec(processedContent)) !== null) {
          allMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            match: match[0],
            processor: (match: string, group1?: string, group2?: string, group3?: string) => {
              try {
                const block = (blockCreator as any)(group1 || '', group2 || '', group3 || '');
                if (block) {
                  blocks.push(block);
                }
                return ''; // Remove completely - no placeholder needed
              } catch (error) {
                console.warn('Error in fallback processor:', error);
                return ''; // Remove even on error
              }
            },
            groups: match.slice(1)
          });
        }
      });
      
      const resolvedMatches = NotionAITool.resolveOverlaps(allMatches);
      resolvedMatches.sort((a, b) => a.start - b.start);
      
      const processedMatches = resolvedMatches.map(({ start, end, match, processor, groups }) => {
        try {
          const replacement = processor(match, groups[0] || '', groups[1] || '', groups[2] || '');
          return { start, end, replacement, match };
        } catch (error) {
          return { start, end, replacement: match, match };
        }
      });
      
      if (processedMatches.length > 0) {
        processedContent = NotionAITool.optimizedReplace(processedContent, processedMatches);
      }
      
      processedContent = NotionAITool.cleanupRemainingHtml(processedContent);
    }

    return processedContent;
  }

  // Helper function to immediately clean up all placeholders after hierarchical processing
  static cleanupAllPlaceholders(content: string): string {
    let cleaned = content;
    
    // Since blocks have already been added to the blocks array during hierarchical processing,
    // we can safely remove all placeholders immediately to prevent partial replacement issues
    
    // Primary sequential placeholder patterns: __BLOCK_N__
    const sequentialPatterns = [
      /__BLOCK_\d+__/g,                    // Standard format: __BLOCK_1__, __BLOCK_2__, etc.
      /\b__BLOCK_\d+__\b/g,                // Word boundary version
      /__BL\w*_\d+__/g,                    // Partial matches like __BL..._N__
      /\b\w*OCK\d+_\b/g,                   // Catch patterns like "OCK23_"
      /\b\w*CK\d+_\b/g,                    // Catch patterns like "CK23_"
      /\b\w*K\d+_\b/g,                     // Catch patterns like "K23_"
      /\b\d+__\b/g,                        // Remnants like "23__"
      /__\d+__/g,                          // Alternative format: __1__, __2__, etc.
      /__\w*\d+_*/g,                       // Any underscore-digit patterns
      /\b[A-Z]*OCK\d+_*\b/g,               // Case variations of OCK patterns
    ];
    
    // Apply all sequential cleanup patterns
    sequentialPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Legacy UUID-based placeholder cleanup (for backwards compatibility)
    const legacyPatterns = [
      /__XML_[a-f0-9]{8}_\d+__/g,           // Standard format: __XML_abc12345_1__
      /\b[A-Z]{2}[a-z0-9]{8,12}_+\b/g,      // Variations like "MLb82d670450__"
      /\b[A-Za-z]{2,4}[a-f0-9]{6,12}_+\b/g, // More flexible pattern matching
      /_[a-f0-9]{8,12}_\d+_*/g,             // Underscore variations
      /[a-f0-9]{8,12}_\d+__/g,              // Without prefix
    ];
    
    // Apply legacy cleanup patterns
    legacyPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Additional aggressive patterns to catch any partial remnants
    const aggressivePatterns = [
      /\b[A-Z]{1,4}\d{1,3}_+\b/g,           // Patterns like "OCK23_", "CK23_", "K23_"
      /\b[A-Za-z]{1,6}\d{1,4}_+\b/g,        // More general partial patterns
      /_{2,}\d+_{0,2}/g,                    // Multiple underscores with digits
      /__+[A-Za-z]*\d+_*/g,                 // Underscore patterns with letters and digits
    ];
    
    // Apply aggressive cleanup patterns as final pass
    aggressivePatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Remove any double spaces created by removals
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    
    return cleaned;
  }

  // Helper function to decode HTML entities
  static decodeHtmlEntities(content: string): string {
    const entityMap: { [key: string]: string } = {
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&apos;': "'",
      '&#39;': "'",
      '&nbsp;': ' ',
    };
    
    let decoded = content;
    Object.entries(entityMap).forEach(([entity, char]) => {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    });
    
    return decoded;
  }

  // Cleanup function to remove remaining HTML tags and placeholder artifacts
  static cleanupRemainingHtml(content: string, placeholderPrefix?: string): string {
    let cleaned = content;
    
    // Clean up sequential placeholder format: __BLOCK_N__
    const sequentialPlaceholderPatterns = [
      /__BLOCK_\d+__/g,           // Standard format: __BLOCK_1__, __BLOCK_2__, etc.
      /\b\d+__\b/g,               // Remnants like "7__"
      /__\d+__/g,                 // Alternative format: __1__, __2__, etc.
    ];
    
    sequentialPlaceholderPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Legacy placeholder cleanup (for backwards compatibility)
    if (placeholderPrefix) {
      const escapedPrefix = placeholderPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const placeholderPattern = new RegExp(`${escapedPrefix}\\d+__`, 'g');
      cleaned = cleaned.replace(placeholderPattern, '');
    }
    
    // Clean up old UUID-based placeholders (for backwards compatibility)
    const legacyPlaceholderPatterns = [
      /__XML_[a-f0-9]{8}_\d+__/g,           // Standard format: __XML_abc12345_1__
      /\b[A-Z]{2}[a-z0-9]{8,12}_+\b/g,      // Variations like "MLb82d670450__"
      /\b[A-Za-z]{2,4}[a-f0-9]{6,12}_+\b/g, // More flexible pattern matching
      /_[a-f0-9]{8,12}_\d+_*/g,             // Underscore variations
      /[a-f0-9]{8,12}_\d+__/g,              // Without prefix
    ];
    
    legacyPlaceholderPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Remove common HTML tags that might be left behind AFTER processing
    // Note: We don't remove entire lines here - only clean up leftover tags
    const htmlTagsToRemove = [
      /<\/?ul\s*[^>]*>/gi,
      /<\/?ol\s*[^>]*>/gi,
      /<\/?li\s*[^>]*>/gi,
      /<\/?strong\s*[^>]*>/gi,
      /<\/?b\s*[^>]*>/gi,
      /<\/?em\s*[^>]*>/gi,
      /<\/?i\s*[^>]*>/gi,
      /<\/?div\s*[^>]*>/gi,
      /<\/?span\s*[^>]*>/gi,
      /<\/?p\s*[^>]*>/gi,
      /<\/?a\s*[^>]*>/gi,
      /<\/?code\s*[^>]*>/gi,
      /<\/?u\s*[^>]*>/gi,
      /<\/?s\s*[^>]*>/gi,
      /<\/?del\s*[^>]*>/gi,
      /<\/?mark\s*[^>]*>/gi,
      /<\/?h[1-6]\s*[^>]*>/gi,
      /<\/?blockquote\s*[^>]*>/gi,
      /<\/?callout\s*[^>]*>/gi,
      /<\/?todo\s*[^>]*>/gi,
      /<\/?image\s*[^>]*>/gi,
      /<\/?embed\s*[^>]*>/gi,
      /<\/?bookmark\s*[^>]*>/gi,
      /<\/?equation\s*[^>]*>/gi,
      /<\/?toggle\s*[^>]*>/gi,
      /<\/?quote\s*[^>]*>/gi,
      /<\/?pre\s*[^>]*>/gi,
      /<\/?divider\s*[^>]*>/gi,
      /<br\s*\/?>/gi,
    ];

    htmlTagsToRemove.forEach(regex => {
      cleaned = cleaned.replace(regex, '');
    });

    // Remove empty lines created by tag removal
    cleaned = cleaned.replace(/^\s*[\r\n]/gm, '');
    
    // Remove multiple consecutive line breaks
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
  }

  // Helper function to process nested HTML elements in list items
  static processNestedHtmlInListItem(content: string): string {
    let processed = content.trim();

    if (!processed) return '';

    try {
      // First, aggressively remove any nested list tags and their content
      // This prevents XML fragments from appearing in the final content
      processed = processed.replace(/<[uo]l\s*[^>]*>[\s\S]*?<\/[uo]l>/gi, '');
      
      // Remove any standalone list item tags that might be left behind
      processed = processed.replace(/<\/?li\s*[^>]*>/gi, '');
      
      // Remove any other common list-related fragments
      processed = processed.replace(/<\/?[uo]l\s*[^>]*>/gi, '');
      
      // Simple cleanup - just remove remaining HTML tags and clean whitespace
      // Avoid convertInlineHtmlToMarkdown to prevent duplication issues
      const result = processed
        .replace(/<[^>]*>/g, ' ')          // Remove any remaining HTML tags
        .replace(/\s+/g, ' ')              // Clean up whitespace
        .trim();
      
      return result;
      
    } catch (error) {
      console.warn('Error processing nested HTML in list item:', error);
      // Fallback: aggressively remove all HTML tags and return clean text
      return processed
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  // Helper function to convert inline HTML to markdown
  static convertInlineHtmlToMarkdown(content: string): string {
    let processed = content;

    // Convert HTML formatting tags to markdown equivalents - process in order to handle nested tags
    const htmlToMarkdown = [
      { regex: /<strong\s*[^>]*>(.*?)<\/strong>/gis, replacement: '**$1**' },
      { regex: /<b\s*[^>]*>(.*?)<\/b>/gis, replacement: '**$1**' },
      { regex: /<em\s*[^>]*>(.*?)<\/em>/gis, replacement: '_$1_' }, // Use underscore to avoid conflicts
      { regex: /<i\s*[^>]*>(.*?)<\/i>/gis, replacement: '_$1_' },   // Use underscore to avoid conflicts
      { regex: /<code\s*[^>]*>(.*?)<\/code>/gis, replacement: '`$1`' },
      { regex: /<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gis, replacement: '[$2]($1)' },
      { regex: /<u\s*[^>]*>(.*?)<\/u>/gis, replacement: '$1' }, // Notion doesn't support underline
      { regex: /<s\s*[^>]*>(.*?)<\/s>/gis, replacement: '~~$1~~' },
      { regex: /<del\s*[^>]*>(.*?)<\/del>/gis, replacement: '~~$1~~' },
      { regex: /<mark\s*[^>]*>(.*?)<\/mark>/gis, replacement: '$1' }, // Notion doesn't support highlight in rich text
    ];

    // Apply HTML to markdown conversions
    htmlToMarkdown.forEach(({ regex, replacement }) => {
      processed = processed.replace(regex, replacement);
    });

    // Remove any remaining HTML tags that we don't handle
    const tagsToRemove = [
      /<\/?span\s*[^>]*>/gi,
      /<br\s*\/?>/gi,
    ];

    tagsToRemove.forEach(regex => {
      processed = processed.replace(regex, ' ');
    });

    // Clean up extra whitespace
    processed = processed.replace(/\s+/g, ' ').trim();

    return processed;
  }

  // Build hierarchy structure for lists using HierarchyNode approach
  static buildListHierarchy(listContent: string, listType: 'bulleted_list_item' | 'numbered_list_item', childHierarchyNodes: HierarchyNode[]): HierarchyNode | null {
    try {
      // Process each <li> element and build hierarchy
      const listItems = NotionAITool.extractListItemsWithBranching(listContent);
      const listItemHierarchyNodes: HierarchyNode[] = [];
      
      // Map child hierarchy nodes to list items based on position
      let childNodeIndex = 0;
      
      for (let i = 0; i < listItems.length; i++) {
        const item = listItems[i];
        if (!item.text && !item.children.length) continue;
        
        // Create list item block
        const listItemBlock: IDataObject = {
          type: listType,
          [listType]: {
            rich_text: [],
          },
        };
        
        // Add parent text if present
        if (item.text && item.text.trim()) {
          const cleanText = NotionAITool.processNestedHtmlInListItem(item.text);
          if (cleanText) {
            (listItemBlock[listType] as any).rich_text = NotionAITool.parseBasicMarkdown(cleanText);
          }
        }
        
        // Collect child hierarchy nodes for this list item
        const itemChildNodes: HierarchyNode[] = [];
        
        // Add child hierarchy nodes that belong to this list item
        // For now, distribute them evenly - this could be improved with position mapping
        const childrenPerItem = Math.floor(childHierarchyNodes.length / listItems.length);
        const startIndex = i * childrenPerItem;
        const endIndex = i === listItems.length - 1 ? childHierarchyNodes.length : startIndex + childrenPerItem;
        
        for (let j = startIndex; j < endIndex; j++) {
          if (j < childHierarchyNodes.length) {
            itemChildNodes.push(childHierarchyNodes[j]);
          }
        }
        
        // Process nested list children (traditional nested lists)
        if (item.children.length > 0) {
          for (const child of item.children) {
            const childListType = child.type === 'ul' ? 'bulleted_list_item' : 'numbered_list_item';
            const childListHierarchy = NotionAITool.buildListHierarchy(child.content, childListType, []);
            if (childListHierarchy && childListHierarchy.children) {
              itemChildNodes.push(...childListHierarchy.children);
            }
          }
        }
        
        // Create hierarchy node for this list item
        const listItemHierarchyNode: HierarchyNode = {
          block: listItemBlock,
          children: itemChildNodes,
          metadata: {
            sourcePosition: i,
            tagName: listType
          }
        };
        
        // Only add if it has content or children
        const listData = listItemBlock[listType] as any;
        if ((listData.rich_text && listData.rich_text.length > 0) || itemChildNodes.length > 0) {
          listItemHierarchyNodes.push(listItemHierarchyNode);
        }
      }
      
      // Return a container that holds all list items
      return {
        block: null as any, // No container block needed
        children: listItemHierarchyNodes,
        metadata: {
          tagName: listType === 'bulleted_list_item' ? 'ul' : 'ol'
        }
      };
      
    } catch (error) {
      console.warn('Error building list hierarchy:', error);
      // Fallback: create a simple text block
      return {
        block: {
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: 'Error processing list content' } }],
          },
        },
        children: [],
        metadata: { tagName: 'paragraph' }
      };
    }
  }
  
  // Helper function to map child blocks to specific list items (legacy support)
  static mapChildBlocksToListItems(listContent: string, childBlocks: IDataObject[], childNodes: XMLNode[]): Map<number, IDataObject[]> {
    const listItemChildBlocks = new Map<number, IDataObject[]>();
    
    // Find all <li> positions in the content
    const liPositions: number[] = [];
    let pos = 0;
    while (pos < listContent.length) {
      const liStart = listContent.indexOf('<li', pos);
      if (liStart === -1) break;
      liPositions.push(liStart);
      pos = liStart + 3;
    }
    
    // Map child nodes to their corresponding list items
    childNodes.forEach((childNode, index) => {
      // Find which <li> this child node belongs to
      let liIndex = -1;
      for (let i = 0; i < liPositions.length; i++) {
        const liStart = liPositions[i];
        const nextLiStart = i + 1 < liPositions.length ? liPositions[i + 1] : listContent.length;
        
        if (childNode.start >= liStart && childNode.start < nextLiStart) {
          liIndex = i;
          break;
        }
      }
      
      if (liIndex >= 0 && index < childBlocks.length) {
        if (!listItemChildBlocks.has(liIndex)) {
          listItemChildBlocks.set(liIndex, []);
        }
        listItemChildBlocks.get(liIndex)!.push(childBlocks[index]);
      }
    });
    
    return listItemChildBlocks;
  }
  
  // Enhanced list processor that handles child blocks (legacy support)
  static processNestedListWithChildBlocks(listContent: string, listType: 'bulleted_list_item' | 'numbered_list_item', blocks: IDataObject[], listItemChildBlocks: Map<number, IDataObject[]>): void {
    try {
      // Process each <li> element as a potential branch point
      const listItems = NotionAITool.extractListItemsWithBranching(listContent);
      
      for (let i = 0; i < listItems.length; i++) {
        const item = listItems[i];
        if (!item.text && !item.children.length) continue;
        
        // Create list item block
        const listItemBlock: IDataObject = {
          type: listType,
          [listType]: {
            rich_text: [],
          },
        };
        
        // Add parent text if present
        if (item.text && item.text.trim()) {
          const cleanText = NotionAITool.processNestedHtmlInListItem(item.text);
          if (cleanText) {
            (listItemBlock[listType] as any).rich_text = NotionAITool.parseBasicMarkdown(cleanText);
          }
        }
        
        // Collect all child blocks
        const allChildBlocks: IDataObject[] = [];
        
        // Add child blocks from hierarchical processing
        const childBlocks = listItemChildBlocks.get(i) || [];
        allChildBlocks.push(...childBlocks);
        
        // Process nested list children (traditional nested lists)
        if (item.children.length > 0) {
          for (const child of item.children) {
            const childListType = child.type === 'ul' ? 'bulleted_list_item' : 'numbered_list_item';
            NotionAITool.processNestedList(child.content, childListType, allChildBlocks);
          }
        }
        
        // Add children to the parent block
        if (allChildBlocks.length > 0) {
          (listItemBlock[listType] as any).children = allChildBlocks;
        }
        
        // Only add the block if it has text or children
        const listData = listItemBlock[listType] as any;
        if ((listData.rich_text && listData.rich_text.length > 0) || listData.children) {
          blocks.push(listItemBlock);
        }
      }
    } catch (error) {
      console.warn('Error processing nested list with child blocks:', error);
      // Fallback: create a simple text block with the content
      blocks.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: 'Error processing list content with child blocks' } }],
        },
      });
    }
  }

  // Legacy function for backward compatibility
  static processNestedList(listContent: string, listType: 'bulleted_list_item' | 'numbered_list_item', blocks: IDataObject[], childNodes?: XMLNode[]): void {
    NotionAITool.processNestedListWithChildBlocks(listContent, listType, blocks, new Map());
  }

  // Extract list items with proper branching structure - simplified for hierarchical processing
  static extractListItemsWithBranching(content: string): Array<{text: string, children: Array<{type: string, content: string}>}> {
    const items: Array<{text: string, children: Array<{type: string, content: string}>}> = [];
    
    let pos = 0;
    
    while (pos < content.length) {
      // Find next <li> tag at the current level
      const liStart = content.indexOf('<li', pos);
      if (liStart === -1) break;
      
      const liOpenEnd = content.indexOf('>', liStart);
      if (liOpenEnd === -1) break;
      
      // Find the matching </li> using proper depth tracking for nested tags
      let depth = 0;
      let searchPos = liOpenEnd + 1; // Start after the opening <li> tag
      let liEnd = -1;
      
      while (searchPos < content.length) {
        const nextLiOpen = content.indexOf('<li', searchPos);
        const nextLiClose = content.indexOf('</li>', searchPos);
        
        // Handle case where no more closing tags
        if (nextLiClose === -1) break;
        
        // If there's an opening tag before the next closing tag
        if (nextLiOpen !== -1 && nextLiOpen < nextLiClose) {
          depth++;
          searchPos = nextLiOpen + 3; // Move past '<li'
        } else {
          // Found a closing tag
          if (depth === 0) {
            // This is our matching closing tag
            liEnd = nextLiClose;
            break;
          } else {
            // This closing tag belongs to a nested li
            depth--;
            searchPos = nextLiClose + 5; // Move past '</li>'
          }
        }
      }
      
      if (liEnd === -1) {
        // No matching closing tag found
        pos = liOpenEnd + 1;
        continue;
      }
      
      // Extract the content between <li> and </li>
      const fullItemContent = content.substring(liOpenEnd + 1, liEnd);
      if (!fullItemContent.trim()) {
        pos = liEnd + 5;
        continue;
      }
      
      const item = { text: '', children: [] as Array<{type: string, content: string}> };
      
      // Process the content to separate text from nested lists
      let contentPos = 0;
      let textParts: string[] = [];
      
      while (contentPos < fullItemContent.length) {
        // Look for the next nested list (ul or ol)
        const nextUlStart = fullItemContent.indexOf('<ul', contentPos);
        const nextOlStart = fullItemContent.indexOf('<ol', contentPos);
        
        let nextListStart = -1;
        let listType = '';
        
        if (nextUlStart !== -1 && (nextOlStart === -1 || nextUlStart < nextOlStart)) {
          nextListStart = nextUlStart;
          listType = 'ul';
        } else if (nextOlStart !== -1) {
          nextListStart = nextOlStart;
          listType = 'ol';
        }
        
        if (nextListStart === -1) {
          // No more nested lists - add remaining text
          const remainingText = fullItemContent.substring(contentPos);
          if (remainingText.trim()) {
            textParts.push(remainingText);
          }
          break;
        }
        
        // Add text before the nested list
        const textBefore = fullItemContent.substring(contentPos, nextListStart);
        if (textBefore.trim()) {
          textParts.push(textBefore);
        }
        
        // Find the end of this nested list
        const listOpenEnd = fullItemContent.indexOf('>', nextListStart);
        if (listOpenEnd === -1) {
          // Malformed list tag
          textParts.push(fullItemContent.substring(contentPos));
          break;
        }
        
        // Track depth to find the matching closing tag
        let listDepth = 1;
        let listSearchPos = listOpenEnd + 1;
        let listEnd = -1;
        
        const openTag = `<${listType}`;
        const closeTag = `</${listType}>`;
        
        while (listSearchPos < fullItemContent.length && listDepth > 0) {
          const nextListOpen = fullItemContent.indexOf(openTag, listSearchPos);
          const nextListClose = fullItemContent.indexOf(closeTag, listSearchPos);
          
          if (nextListClose === -1) break;
          
          if (nextListOpen !== -1 && nextListOpen < nextListClose) {
            listDepth++;
            listSearchPos = nextListOpen + openTag.length;
          } else {
            listDepth--;
            if (listDepth === 0) {
              listEnd = nextListClose + closeTag.length;
              break;
            }
            listSearchPos = nextListClose + closeTag.length;
          }
        }
        
        if (listEnd !== -1) {
          // Extract the content between <ul>/<ol> and </ul>/<ol>
          const listContent = fullItemContent.substring(listOpenEnd + 1, listEnd - closeTag.length);
          item.children.push({
            type: listType,
            content: listContent
          });
          contentPos = listEnd;
        } else {
          // Malformed nested list - treat remaining as text
          textParts.push(fullItemContent.substring(contentPos));
          break;
        }
      }
      
      // Combine all text parts and clean them
      if (textParts.length > 0) {
        const combinedText = textParts.join(' ').trim();
        const cleanText = NotionAITool.processNestedHtmlInListItem(combinedText);
        if (cleanText) {
          item.text = cleanText;
        }
      }
      
      // Only add items that have either text or children
      if (item.text.trim() || item.children.length > 0) {
        items.push(item);
      }
      
      pos = liEnd + 5; // Move past </li>
    }
    
    return items;
  }

  // Helper function to properly extract list items handling nested <li> tags
  static extractListItems(content: string): string[] {
    const items: string[] = [];
    
    // Use a more robust regex approach that respects nesting
    // This regex captures the complete <li>...</li> blocks including nested content
    const liRegex = /<li[^>]*>((?:[^<]|<(?!\/li>))*?(?:<[uo]l[^>]*>[\s\S]*?<\/[uo]l>(?:[^<]|<(?!\/li>))*?)*?)<\/li>/gi;
    
    let match;
    while ((match = liRegex.exec(content)) !== null) {
      const itemContent = match[1];
      if (itemContent && itemContent.trim()) {
        items.push(itemContent.trim());
      }
    }
    
    // Fallback to the old depth-tracking method if regex fails
    if (items.length === 0) {
      let currentPos = 0;
      
      while (currentPos < content.length) {
        // Find the next <li> opening tag
        const liStart = content.indexOf('<li', currentPos);
        if (liStart === -1) break;
        
        // Find the end of the opening tag
        const openTagEnd = content.indexOf('>', liStart);
        if (openTagEnd === -1) break;
        
        // Now find the matching closing </li> tag accounting for nesting
        let depth = 1;
        let pos = openTagEnd + 1;
        let itemEnd = -1;
        
        while (pos < content.length && depth > 0) {
          const nextLiOpen = content.indexOf('<li', pos);
          const nextLiClose = content.indexOf('</li>', pos);
          
          // If no more closing tags, we're done
          if (nextLiClose === -1) break;
          
          // If there's an opening tag before the next closing tag, increase depth
          if (nextLiOpen !== -1 && nextLiOpen < nextLiClose) {
            depth++;
            pos = nextLiOpen + 3; // Move past '<li'
          } else {
            // Found a closing tag
            depth--;
            if (depth === 0) {
              itemEnd = nextLiClose + 5; // Include the '</li>'
              break;
            } else {
              pos = nextLiClose + 5; // Move past '</li>'
            }
          }
        }
        
        if (itemEnd !== -1) {
          // Extract the content between <li...> and </li>
          const fullMatch = content.substring(liStart, itemEnd);
          const innerMatch = fullMatch.match(/<li[^>]*>([\s\S]*)<\/li>$/);
          if (innerMatch) {
            items.push(innerMatch[1]);
          }
          currentPos = itemEnd;
        } else {
          // Malformed HTML, skip this tag
          currentPos = openTagEnd + 1;
        }
      }
    }
    
    return items;
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
      { regex: /_([^_]+)_/g, type: 'italic' },                   // _italic_ (changed from *)
      { regex: /\*([^*]+)\*/g, type: 'italic' },                 // *italic* (keep for backward compatibility)
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