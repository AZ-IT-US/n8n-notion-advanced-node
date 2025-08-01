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
      
      // Skip completely empty lines and XML placeholders (now using dynamic prefix check)
      if (!trimmedLine || /__XML_[a-f0-9]{8}_\d+__/.test(trimmedLine)) continue;

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

  // Build hierarchical XML tree structure
  static buildXMLTree(content: string, tagProcessors: any[]): XMLNode[] {
    const allMatches: XMLNode[] = [];
    
    // Collect all XML tags with their positions
    tagProcessors.forEach(({ regex, blockCreator, listProcessor }) => {
      const globalRegex = new RegExp(regex.source, 'gis');
      let match;
      while ((match = globalRegex.exec(content)) !== null) {
        const tagName = match[0].match(/<(\w+)/)?.[1] || 'unknown';
        allMatches.push({
          id: `${tagName}_${match.index}_${Date.now()}_${Math.random()}`,
          tagName,
          start: match.index,
          end: match.index + match[0].length,
          match: match[0],
          processor: blockCreator,
          groups: match.slice(1),
          children: [],
          depth: 0,
          innerContent: match[0],
          replacement: undefined,
          listProcessor
        });
      }
    });

    // Sort by start position
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

      // Only push self-contained tags to stack (not self-closing)
      if (!node.match.endsWith('/>') && node.match.includes('</')) {
        nodeStack.push(node);
      }
    }

    return rootNodes;
  }

  // Process XML tree depth-first (children before parents)
  static processXMLTreeDepthFirst(nodes: XMLNode[], blocks: IDataObject[], placeholderPrefix: string): Map<string, string> {
    const replacements = new Map<string, string>();
    let blockCounter = 0;

    const processNode = (node: XMLNode): string => {
      // First, process all children depth-first
      for (const child of node.children) {
        const childReplacement = processNode(child);
        replacements.set(child.id, childReplacement);
      }

      // Extract inner content (content between opening and closing tags)
      let innerContent = '';
      
      try {
        // More robust inner content extraction
        const tagName = node.tagName.toLowerCase();
        const openTagRegex = new RegExp(`^<${tagName}[^>]*>`, 'i');
        const closeTagRegex = new RegExp(`</${tagName}>$`, 'i');
        
        const openMatch = node.match.match(openTagRegex);
        const closeMatch = node.match.match(closeTagRegex);
        
        if (openMatch && closeMatch) {
          const openTag = openMatch[0];
          const closeTag = closeMatch[0];
          const startIndex = openTag.length;
          const endIndex = node.match.length - closeTag.length;
          innerContent = node.match.substring(startIndex, endIndex);
        } else {
          // Fallback for self-closing or malformed tags
          innerContent = node.match.replace(/^<[^>]*>/, '').replace(/<\/[^>]*>$/, '');
        }
        
        // Replace child nodes in inner content with their processed content
        for (const child of node.children) {
          const childReplacement = replacements.get(child.id) || '';
          if (childReplacement !== undefined && innerContent.includes(child.match)) {
            innerContent = innerContent.replace(child.match, childReplacement);
          }
        }
      } catch (error) {
        console.warn(`Error extracting inner content for ${node.tagName}:`, error);
        innerContent = node.match;
      }

      // Process this node with updated inner content
      try {
        // Handle special list processors
        if (node.listProcessor && (node.tagName === 'ul' || node.tagName === 'ol')) {
          node.listProcessor(innerContent, blocks);
          return `${placeholderPrefix}${blockCounter++}__`;
        }
        
        // Use blockCreator to create the block
        const block = node.processor(...node.groups);
        
        if (block) {
          blocks.push(block);
        }
        
        return `${placeholderPrefix}${blockCounter++}__`;
      } catch (error) {
        console.warn(`Error processing XML node ${node.tagName}:`, error);
        return node.match; // Return original if processing fails
      }
    };

    // Process all root nodes
    for (const rootNode of nodes) {
      const replacement = processNode(rootNode);
      replacements.set(rootNode.id, replacement);
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
    
    // Generate unique placeholder prefix to avoid collisions
    const placeholderPrefix = `__XML_${randomUUID().slice(0, 8)}_`;
    
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
          return {
            type: 'paragraph',
            paragraph: {
              rich_text: NotionAITool.parseBasicMarkdown(content.trim()),
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

      // Standalone list items (only if not already processed in lists): <li>content</li>
      {
        regex: /<li\s*[^>]*>(.*?)<\/li>/gis,
        blockCreator: (content: string) => {
          if (content.trim()) {
            return {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: NotionAITool.parseBasicMarkdown(content.trim()),
              },
            };
          }
          return null;
        }
      },

      // Strong/Bold: <strong>content</strong> or <b>content</b> (only as standalone)
      {
        regex: /(?:^|>|\s)<(strong|b)>(.*?)<\/(strong|b)>(?=<|$|\s)/gis,
        blockCreator: (tag: string, content: string) => {
          return {
            type: 'paragraph',
            paragraph: {
              rich_text: NotionAITool.parseBasicMarkdown(`**${content.trim()}**`),
            },
          };
        }
      },

      // Emphasis/Italic: <em>content</em> or <i>content</i> (only as standalone)
      {
        regex: /(?:^|>|\s)<(em|i)>(.*?)<\/(em|i)>(?=<|$|\s)/gis,
        blockCreator: (tag: string, content: string) => {
          return {
            type: 'paragraph',
            paragraph: {
              rich_text: NotionAITool.parseBasicMarkdown(`*${content.trim()}*`),
            },
          };
        }
      },

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
      const replacements = NotionAITool.processXMLTreeDepthFirst(xmlTree, blocks, placeholderPrefix);
      
      // Step 3: Apply hierarchical replacements to content
      processedContent = NotionAITool.applyHierarchicalReplacements(processedContent, xmlTree, replacements);
      
      // Step 4: Clean up any remaining HTML tags
      processedContent = NotionAITool.cleanupRemainingHtml(processedContent, placeholderPrefix);
      
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
                return `${placeholderPrefix}${Math.random()}__`;
              } catch (error) {
                console.warn('Error in fallback processor:', error);
                return match;
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
      
      processedContent = NotionAITool.cleanupRemainingHtml(processedContent, placeholderPrefix);
    }

    return processedContent;
  }

  // Cleanup function to remove remaining HTML tags and XML_BLOCK artifacts
  static cleanupRemainingHtml(content: string, placeholderPrefix?: string): string {
    let cleaned = content;
    
    // Remove XML_BLOCK placeholder artifacts (support both old and new format)
    if (placeholderPrefix) {
      const placeholderRegex = new RegExp(`${placeholderPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\d+__`, 'g');
      cleaned = cleaned.replace(placeholderRegex, '');
    } else {
      // Fallback for backward compatibility
      cleaned = cleaned.replace(/__XML_BLOCK_\d+__/g, '');
      cleaned = cleaned.replace(/__XML_[a-f0-9]{8}_\d+__/g, '');
    }
    
    // Remove common HTML tags that might be left behind
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
      /<br\s*\/?>/gi,
    ];

    htmlTagsToRemove.forEach(regex => {
      cleaned = cleaned.replace(regex, '');
    });

    // Remove empty lines created by tag removal
    cleaned = cleaned.replace(/^\s*[\r\n]/gm, '');
    
    // Remove multiple consecutive line breaks
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Remove lines that contain only XML_BLOCK artifacts
    cleaned = cleaned.replace(/^.*__XML_BLOCK_\d+__.*$/gm, '');
    cleaned = cleaned.replace(/^.*__XML_[a-f0-9]{8}_\d+__.*$/gm, '');
    
    return cleaned.trim();
  }

  // Helper function to process nested HTML elements in list items
  static processNestedHtmlInListItem(content: string): string {
    let processed = content.trim();

    if (!processed) return '';

    try {
      // Handle multiple segments separated by HTML block elements
      const segments: string[] = [];
      
      // Split by block-level HTML elements like <p>, <div>, etc.
      const blockElements = /<(p|div|h[1-6]|blockquote)\s*[^>]*>.*?<\/\1>/gis;
      let lastIndex = 0;
      let match;
      
      const blockMatches = [];
      while ((match = blockElements.exec(processed)) !== null) {
        blockMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          content: match[0],
          tag: match[1]
        });
      }
      
      // Sort matches by position
      blockMatches.sort((a, b) => a.start - b.start);
      
      // Process text segments between block elements
      blockMatches.forEach((blockMatch, index) => {
        // Add text before this block element
        if (blockMatch.start > lastIndex) {
          const beforeText = processed.substring(lastIndex, blockMatch.start).trim();
          if (beforeText) {
            segments.push(NotionAITool.convertInlineHtmlToMarkdown(beforeText));
          }
        }
        
        // Process content inside block element
        const innerContent = blockMatch.content.replace(new RegExp(`^<${blockMatch.tag}[^>]*>`, 'i'), '')
                                                .replace(new RegExp(`</${blockMatch.tag}>$`, 'i'), '')
                                                .trim();
        if (innerContent) {
          segments.push(NotionAITool.convertInlineHtmlToMarkdown(innerContent));
        }
        
        lastIndex = blockMatch.end;
      });
      
      // Add remaining text after last block element
      if (lastIndex < processed.length) {
        const remainingText = processed.substring(lastIndex).trim();
        if (remainingText) {
          segments.push(NotionAITool.convertInlineHtmlToMarkdown(remainingText));
        }
      }
      
      // If no block elements were found, process the whole content
      if (blockMatches.length === 0) {
        segments.push(NotionAITool.convertInlineHtmlToMarkdown(processed));
      }
      
      // Join segments with space and clean up
      const result = segments.filter(s => s.trim()).join(' ').trim();
      
      // Final cleanup of any remaining artifacts
      return result.replace(/\s+/g, ' ').trim();
      
    } catch (error) {
      console.warn('Error processing nested HTML in list item:', error);
      // Fallback: just remove HTML tags and return text
      return processed.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  // Helper function to convert inline HTML to markdown
  static convertInlineHtmlToMarkdown(content: string): string {
    let processed = content;

    // Convert HTML formatting tags to markdown equivalents
    const htmlToMarkdown = [
      { regex: /<strong\s*[^>]*>(.*?)<\/strong>/gis, replacement: '**$1**' },
      { regex: /<b\s*[^>]*>(.*?)<\/b>/gis, replacement: '**$1**' },
      { regex: /<em\s*[^>]*>(.*?)<\/em>/gis, replacement: '*$1*' },
      { regex: /<i\s*[^>]*>(.*?)<\/i>/gis, replacement: '*$1*' },
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

  // Helper function to process nested lists and flatten them for Notion
  static processNestedList(listContent: string, listType: 'bulleted_list_item' | 'numbered_list_item', blocks: IDataObject[]): void {
    try {
      // More robust list item extraction using regex
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let match;
      
      while ((match = liRegex.exec(listContent)) !== null) {
        let itemContent = match[1].trim();
        
        if (!itemContent) continue;
        
        // Check if this item contains nested lists
        const hasNestedList = /<[uo]l\s*[^>]*>/i.test(itemContent);
        
        if (hasNestedList) {
          // Split content into parts: before nested list, nested list, after nested list
          const parts = itemContent.split(/(<[uo]l\s*[^>]*>[\s\S]*?<\/[uo]l>)/i);
          
          // Process the main content (before nested list)
          const mainContent = parts[0] ? parts[0].trim() : '';
          if (mainContent) {
            const cleanContent = NotionAITool.processNestedHtmlInListItem(mainContent);
            if (cleanContent) {
              blocks.push({
                type: listType,
                [listType]: {
                  rich_text: NotionAITool.parseBasicMarkdown(cleanContent),
                },
              });
            }
          }
          
          // Process nested lists
          for (let i = 1; i < parts.length; i += 2) {
            const nestedListHtml = parts[i];
            if (nestedListHtml) {
              const nestedListMatch = nestedListHtml.match(/<([uo]l)\s*[^>]*>([\s\S]*?)<\/\1>/i);
              if (nestedListMatch) {
                const [, nestedListTag, nestedContent] = nestedListMatch;
                const nestedListType = nestedListTag === 'ul' ? 'bulleted_list_item' : 'numbered_list_item';
                
                // Recursively process nested list
                NotionAITool.processNestedList(nestedContent, nestedListType, blocks);
              }
            }
          }
          
          // Process any content after nested lists
          if (parts.length > 2) {
            const afterContent = parts.slice(2).join('').trim();
            if (afterContent) {
              const cleanContent = NotionAITool.processNestedHtmlInListItem(afterContent);
              if (cleanContent) {
                blocks.push({
                  type: listType,
                  [listType]: {
                    rich_text: NotionAITool.parseBasicMarkdown(cleanContent),
                  },
                });
              }
            }
          }
        } else {
          // Simple item without nested lists
          const cleanContent = NotionAITool.processNestedHtmlInListItem(itemContent);
          if (cleanContent) {
            blocks.push({
              type: listType,
              [listType]: {
                rich_text: NotionAITool.parseBasicMarkdown(cleanContent),
              },
            });
          }
        }
      }
    } catch (error) {
      console.warn('Error processing nested list:', error);
      // Fallback: create a simple text block with the content
      blocks.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: 'Error processing list content' } }],
        },
      });
    }
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