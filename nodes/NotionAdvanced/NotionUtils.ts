import {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
  INodeExecutionData,
  NodeApiError,
  NodeOperationError,
} from 'n8n-workflow';

import {
  Block,
  BlockInput,
  BlockWithId,
  NotionCredentials,
  RichTextObject,
  RichTextAnnotations,
  NotionColor,
  NotionPage,
  NotionApiResponse,
  NotionBlockChildrenResponse,
  NotionSearchResponse,
  PageInput,
} from '../../types/NotionTypes';

/**
 * Makes an authenticated request to the Notion API
 */
export async function notionApiRequest(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
): Promise<any> {
  const credentials = (await this.getCredentials('notionApi')) as NotionCredentials;

  const options: IHttpRequestOptions = {
    method,
    headers: {
      'Authorization': `Bearer ${credentials.apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    url: `https://api.notion.com/v1${endpoint}`,
    body,
    qs,
    json: true,
  };

  try {
    return await this.helpers.httpRequest(options);
  } catch (error) {
    throw new NodeApiError(this.getNode(), {
      message: (error as Error).message,
      description: 'Failed to make Notion API request',
      httpCode: (error as any).status || (error as any).statusCode || 500,
    });
  }
}

/**
 * Validates Notion API credentials by making a test request
 */
export async function validateCredentials(this: IExecuteFunctions): Promise<boolean> {
  try {
    await notionApiRequest.call(this, 'GET', '/users/me');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Creates a rich text object from a string with optional formatting
 */
export function createRichText(
  text: string,
  annotations: Partial<RichTextAnnotations> = {},
  link?: string,
): RichTextObject {
  return {
    type: 'text',
    text: {
      content: text,
      link: link ? { url: link } : null,
    },
    annotations: {
      bold: annotations.bold || false,
      italic: annotations.italic || false,
      strikethrough: annotations.strikethrough || false,
      underline: annotations.underline || false,
      code: annotations.code || false,
      color: annotations.color || 'default',
    },
    plain_text: text,
    href: link || null,
  };
}

/**
 * Parses rich text input from various formats
 */
export function parseRichTextInput(input: any): RichTextObject[] {
  if (typeof input === 'string') {
    return [createRichText(input)];
  }

  if (Array.isArray(input)) {
    return input.map((item: any) => {
      if (typeof item === 'string') {
        return createRichText(item);
      }
      
      if (typeof item === 'object' && item !== null) {
        return createRichText(
          item.text || item.content || '',
          item.annotations || {},
          item.link || item.url,
        );
      }
      
      return createRichText('');
    });
  }

  if (typeof input === 'object' && input !== null) {
    if (input.type === 'text' || input.type === 'mention' || input.type === 'equation') {
      return [input as RichTextObject];
    }
    
    return [createRichText(
      input.text || input.content || '',
      input.annotations || {},
      input.link || input.url,
    )];
  }

  return [createRichText('')];
}

/**
 * Creates a paragraph block
 */
export function createParagraphBlock(
  text: string | RichTextObject[],
  color?: NotionColor,
  children?: Block[],
): Block {
  return {
    type: 'paragraph',
    paragraph: {
      rich_text: typeof text === 'string' ? [createRichText(text)] : text,
      color,
      children,
    },
  };
}

/**
 * Creates a heading block
 */
export function createHeadingBlock(
  level: 1 | 2 | 3,
  text: string | RichTextObject[],
  color?: NotionColor,
  isToggleable?: boolean,
): Block {
  const richText = typeof text === 'string' ? [createRichText(text)] : text;
  const headingData = {
    rich_text: richText,
    color,
    is_toggleable: isToggleable,
  };

  switch (level) {
    case 1:
      return {
        type: 'heading_1',
        heading_1: headingData,
      };
    case 2:
      return {
        type: 'heading_2',
        heading_2: headingData,
      };
    case 3:
      return {
        type: 'heading_3',
        heading_3: headingData,
      };
    default:
      throw new Error('Invalid heading level. Must be 1, 2, or 3.');
  }
}

/**
 * Creates a list item block
 */
export function createListItemBlock(
  type: 'bulleted_list_item' | 'numbered_list_item',
  text: string | RichTextObject[],
  color?: NotionColor,
  children?: Block[],
): Block {
  const richText = typeof text === 'string' ? [createRichText(text)] : text;
  
  if (type === 'bulleted_list_item') {
    return {
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: richText,
        color,
        children,
      },
    };
  } else {
    return {
      type: 'numbered_list_item',
      numbered_list_item: {
        rich_text: richText,
        color,
        children,
      },
    };
  }
}

/**
 * Creates a to-do block
 */
export function createToDoBlock(
  text: string | RichTextObject[],
  checked: boolean = false,
  color?: NotionColor,
  children?: Block[],
): Block {
  return {
    type: 'to_do',
    to_do: {
      rich_text: typeof text === 'string' ? [createRichText(text)] : text,
      checked,
      color,
      children,
    },
  };
}

/**
 * Creates a code block
 */
export function createCodeBlock(
  code: string,
  language?: string,
  caption?: RichTextObject[],
): Block {
  return {
    type: 'code',
    code: {
      rich_text: [createRichText(code)],
      language,
      caption,
    },
  };
}

/**
 * Creates a quote block
 */
export function createQuoteBlock(
  text: string | RichTextObject[],
  color?: NotionColor,
  children?: Block[],
): Block {
  return {
    type: 'quote',
    quote: {
      rich_text: typeof text === 'string' ? [createRichText(text)] : text,
      color,
      children,
    },
  };
}

/**
 * Creates a callout block
 */
export function createCalloutBlock(
  text: string | RichTextObject[],
  icon?: string,
  color?: NotionColor,
  children?: Block[],
): Block {
  const iconObject = icon ? { type: 'emoji' as const, emoji: icon } : undefined;
  
  return {
    type: 'callout',
    callout: {
      rich_text: typeof text === 'string' ? [createRichText(text)] : text,
      icon: iconObject,
      color,
      children,
    },
  };
}

/**
 * Creates a divider block
 */
export function createDividerBlock(): Block {
  return {
    type: 'divider',
    divider: {},
  };
}

/**
 * Creates an equation block
 */
export function createEquationBlock(expression: string): Block {
  return {
    type: 'equation',
    equation: {
      expression,
    },
  };
}

/**
 * Creates an image block
 */
export function createImageBlock(url: string, caption?: RichTextObject[]): Block {
  return {
    type: 'image',
    image: {
      type: 'external',
      external: { url },
      caption,
    },
  };
}

/**
 * Creates a bookmark block
 */
export function createBookmarkBlock(url: string, caption?: RichTextObject[]): Block {
  return {
    type: 'bookmark',
    bookmark: {
      url,
      caption,
    },
  };
}

/**
 * Creates an embed block
 */
export function createEmbedBlock(url: string, caption?: RichTextObject[]): Block {
  return {
    type: 'embed',
    embed: {
      url,
      caption,
    },
  };
}

/**
 * Creates a toggle block
 */
export function createToggleBlock(
  text: string | RichTextObject[],
  color?: NotionColor,
  children?: Block[],
): Block {
  return {
    type: 'toggle',
    toggle: {
      rich_text: typeof text === 'string' ? [createRichText(text)] : text,
      color,
      children,
    },
  };
}

/**
 * Creates a table block with rows
 */
export function createTableBlock(
  tableWidth: number,
  rows: RichTextObject[][][],
  hasColumnHeader: boolean = false,
  hasRowHeader: boolean = false,
): Block {
  const tableRows = rows.map(cells => ({
    type: 'table_row' as const,
    table_row: { cells },
  }));

  return {
    type: 'table',
    table: {
      table_width: tableWidth,
      has_column_header: hasColumnHeader,
      has_row_header: hasRowHeader,
      children: tableRows,
    },
  };
}

/**
 * Converts BlockInput to actual Block objects
 */
export function convertBlockInput(blockInput: BlockInput): Block {
  const { type, content = '', properties = {}, children } = blockInput;
  const richText = parseRichTextInput(blockInput.richText || content);
  const childBlocks = children ? children.map(convertBlockInput) : undefined;

  switch (type) {
    case 'paragraph':
      return createParagraphBlock(richText, properties.color, childBlocks);
    
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
      const level = parseInt(type.split('_')[1]) as 1 | 2 | 3;
      return createHeadingBlock(level, richText, properties.color, properties.isToggleable);
    
    case 'bulleted_list_item':
    case 'numbered_list_item':
      return createListItemBlock(type, richText, properties.color, childBlocks);
    
    case 'to_do':
      return createToDoBlock(richText, properties.checked, properties.color, childBlocks);
    
    case 'code':
      return createCodeBlock(content, properties.language, properties.caption);
    
    case 'quote':
      return createQuoteBlock(richText, properties.color, childBlocks);
    
    case 'callout':
      return createCalloutBlock(richText, properties.icon, properties.color, childBlocks);
    
    case 'divider':
      return createDividerBlock();
    
    case 'equation':
      return createEquationBlock(properties.expression || content);
    
    case 'image':
      return createImageBlock(properties.url || content, properties.caption);
    
    case 'bookmark':
      return createBookmarkBlock(properties.url || content, properties.caption);
    
    case 'embed':
      return createEmbedBlock(properties.url || content, properties.caption);
    
    default:
      throw new Error(`Unsupported block type: ${type}`);
  }
}

/**
 * Resolves a page ID from various input formats (URL, ID, title search)
 */
export async function resolvePageId(
  this: IExecuteFunctions,
  pageInput: string,
): Promise<string> {
  // If it looks like a UUID, return it directly
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(pageInput)) {
    return pageInput;
  }
  
  // If it looks like a Notion URL, extract the ID
  const urlRegex = /https:\/\/www\.notion\.so\/[^\/]*-([a-f0-9]{32})/;
  const urlMatch = pageInput.match(urlRegex);
  if (urlMatch) {
    const rawId = urlMatch[1];
    // Convert 32-character ID to UUID format
    return `${rawId.slice(0, 8)}-${rawId.slice(8, 12)}-${rawId.slice(12, 16)}-${rawId.slice(16, 20)}-${rawId.slice(20)}`;
  }
  
  // Otherwise, search for page by title
  const searchResponse = await notionApiRequest.call(
    this,
    'POST',
    '/search',
    {
      query: pageInput,
      filter: { property: 'object', value: 'page' },
    },
  ) as NotionSearchResponse;
  
  if (searchResponse.results && searchResponse.results.length > 0) {
    const page = searchResponse.results[0] as NotionPage;
    return page.id;
  }
  
  throw new NodeOperationError(
    this.getNode(),
    `Could not find page with identifier: ${pageInput}`,
  );
}

/**
 * Validates a block structure before sending to Notion API
 */
export function validateBlock(block: Block): void {
  if (!block.type) {
    throw new Error('Block must have a type property');
  }
  
  // Add specific validation for each block type as needed
  switch (block.type) {
    case 'paragraph':
      if (!('paragraph' in block) || !block.paragraph || !Array.isArray(block.paragraph.rich_text)) {
        throw new Error('Paragraph block must have rich_text array');
      }
      break;
    
    case 'code':
      if (!('code' in block) || !block.code || !Array.isArray(block.code.rich_text)) {
        throw new Error('Code block must have rich_text array');
      }
      break;
    
    // Add more validation cases as needed
  }
}

/**
 * Paginated request helper for Notion API
 */
export async function paginatedRequest(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
): Promise<any[]> {
  const results: any[] = [];
  let hasMore = true;
  let nextCursor: string | undefined;
  
  while (hasMore) {
    const requestBody = { ...body };
    if (nextCursor) {
      requestBody.start_cursor = nextCursor;
    }
    
    const response: NotionApiResponse = await notionApiRequest.call(this, method, endpoint, requestBody);
    
    if (response.results) {
      results.push(...response.results);
    }
    
    hasMore = response.has_more || false;
    nextCursor = response.next_cursor || undefined;
  }
  
  return results;
}

/**
 * Creates page input from parameters for validation
 */
export function createPageInput(
  title: string,
  parent: string,
  properties?: { [key: string]: any },
  children?: BlockInput[],
  icon?: string,
  cover?: string,
): PageInput {
  return {
    title,
    parent,
    properties,
    children,
    icon,
    cover,
  };
}

/**
 * Gets blocks with full metadata including IDs
 */
export async function getBlocksWithIds(
  this: IExecuteFunctions,
  blockId: string,
): Promise<BlockWithId[]> {
  const response: NotionBlockChildrenResponse = await notionApiRequest.call(
    this,
    'GET',
    `/blocks/${blockId}/children`,
  );
  
  return response.results;
}

/**
 * Creates execution data from results
 */
export function createExecutionData(data: IDataObject[]): INodeExecutionData[] {
  return data.map(item => ({ json: item }));
}