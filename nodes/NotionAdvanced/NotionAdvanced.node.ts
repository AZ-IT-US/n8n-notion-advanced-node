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
  parseRichTextInput,
  convertBlockInput,
  resolvePageId,
  validateBlock,
  paginatedRequest,
  createRichText,
  createPageInput,
  getBlocksWithIds,
  createExecutionData,
  // Block creation functions - used indirectly via convertBlockInput
  createParagraphBlock,
  createHeadingBlock,
  createListItemBlock,
  createToDoBlock,
  createCodeBlock,
  createQuoteBlock,
  createCalloutBlock,
  createDividerBlock,
  createEquationBlock,
  createImageBlock,
  createBookmarkBlock,
  createEmbedBlock,
  createTableBlock,
} from './NotionUtils';

import type {
  Block,
  BlockInput,
  BlockWithId,
  NotionPage,
  NotionApiResponse,
  NotionBlockChildrenResponse,
  NotionSearchResponse,
  PageInput,
} from '../../types/NotionTypes';

// Ensure all block creation functions are available for dynamic usage
const blockCreators = {
  createParagraphBlock,
  createHeadingBlock,
  createListItemBlock,
  createToDoBlock,
  createCodeBlock,
  createQuoteBlock,
  createCalloutBlock,
  createDividerBlock,
  createEquationBlock,
  createImageBlock,
  createBookmarkBlock,
  createEmbedBlock,
  createTableBlock,
};

// Prevent unused variable warning
void blockCreators;

export class NotionAdvanced implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Notion Advanced',
    name: 'notionAdvanced',
    icon: 'file:notion.svg',
    group: ['productivity'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Full-featured Notion node with exhaustive block and formatting support using existing credentials',
    defaults: {
      name: 'Notion Advanced',
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
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Page',
            value: 'page',
          },
          {
            name: 'Block',
            value: 'block',
          },
          {
            name: 'Database',
            value: 'database',
          },
          {
            name: 'User',
            value: 'user',
          },
        ],
        default: 'page',
      },
      // PAGE OPERATIONS
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['page'],
          },
        },
        options: [
          {
            name: 'Create',
            value: 'create',
            description: 'Create a new page',
            action: 'Create a page',
          },
          {
            name: 'Get',
            value: 'get',
            description: 'Get a page',
            action: 'Get a page',
          },
          {
            name: 'Update',
            value: 'update',
            description: 'Update page properties',
            action: 'Update a page',
          },
          {
            name: 'Archive',
            value: 'archive',
            description: 'Archive a page',
            action: 'Archive a page',
          },
          {
            name: 'Search',
            value: 'search',
            description: 'Search pages',
            action: 'Search pages',
          },
        ],
        default: 'create',
      },
      // BLOCK OPERATIONS
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['block'],
          },
        },
        options: [
          {
            name: 'Create',
            value: 'create',
            description: 'Create new blocks',
            action: 'Create blocks',
          },
          {
            name: 'Get',
            value: 'get',
            description: 'Get a block',
            action: 'Get a block',
          },
          {
            name: 'Update',
            value: 'update',
            description: 'Update a block',
            action: 'Update a block',
          },
          {
            name: 'Delete',
            value: 'delete',
            description: 'Delete a block',
            action: 'Delete a block',
          },
          {
            name: 'Get Children',
            value: 'getChildren',
            description: 'Get child blocks',
            action: 'Get child blocks',
          },
          {
            name: 'Append Children',
            value: 'appendChildren',
            description: 'Append children to a block',
            action: 'Append children to a block',
          },
        ],
        default: 'create',
      },
      // DATABASE OPERATIONS
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['database'],
          },
        },
        options: [
          {
            name: 'Get',
            value: 'get',
            description: 'Get a database',
            action: 'Get a database',
          },
          {
            name: 'Query',
            value: 'query',
            description: 'Query a database',
            action: 'Query a database',
          },
          {
            name: 'Create',
            value: 'create',
            description: 'Create a database',
            action: 'Create a database',
          },
        ],
        default: 'get',
      },
      // USER OPERATIONS
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['user'],
          },
        },
        options: [
          {
            name: 'Get',
            value: 'get',
            description: 'Get a user',
            action: 'Get a user',
          },
          {
            name: 'List',
            value: 'list',
            description: 'List all users',
            action: 'List users',
          },
        ],
        default: 'get',
      },

      // PAGE FIELDS
      {
        displayName: 'Parent Page/Database',
        name: 'parent',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['page'],
            operation: ['create'],
          },
        },
        default: '',
        description: 'Page ID, Database ID, or search term for the parent',
      },
      {
        displayName: 'Page ID',
        name: 'pageId',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['page'],
            operation: ['get', 'update', 'archive'],
          },
        },
        default: '',
        description: 'Page ID or URL',
      },
      {
        displayName: 'Title',
        name: 'title',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['page'],
            operation: ['create'],
          },
        },
        default: '',
        description: 'Page title',
      },
      {
        displayName: 'Properties',
        name: 'properties',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        displayOptions: {
          show: {
            resource: ['page'],
            operation: ['create', 'update'],
          },
        },
        default: {},
        options: [
          {
            name: 'property',
            displayName: 'Property',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: '',
                description: 'Property name',
              },
              {
                displayName: 'Type',
                name: 'type',
                type: 'options',
                options: [
                  { name: 'Title', value: 'title' },
                  { name: 'Rich Text', value: 'rich_text' },
                  { name: 'Number', value: 'number' },
                  { name: 'Select', value: 'select' },
                  { name: 'Multi-select', value: 'multi_select' },
                  { name: 'Date', value: 'date' },
                  { name: 'People', value: 'people' },
                  { name: 'Files', value: 'files' },
                  { name: 'Checkbox', value: 'checkbox' },
                  { name: 'URL', value: 'url' },
                  { name: 'Email', value: 'email' },
                  { name: 'Phone', value: 'phone_number' },
                  { name: 'Formula', value: 'formula' },
                  { name: 'Relation', value: 'relation' },
                  { name: 'Rollup', value: 'rollup' },
                  { name: 'Created Time', value: 'created_time' },
                  { name: 'Created By', value: 'created_by' },
                  { name: 'Last Edited Time', value: 'last_edited_time' },
                  { name: 'Last Edited By', value: 'last_edited_by' },
                ],
                default: 'rich_text',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
                description: 'Property value (JSON for complex types)',
              },
            ],
          },
        ],
      },

      // BLOCK FIELDS
      {
        displayName: 'Block ID',
        name: 'blockId',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['block'],
            operation: ['get', 'update', 'delete', 'getChildren', 'appendChildren'],
          },
        },
        default: '',
        description: 'Block ID',
      },
      {
        displayName: 'Parent ID',
        name: 'parentId',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['block'],
            operation: ['create'],
          },
        },
        default: '',
        description: 'Parent page or block ID',
      },
      {
        displayName: 'Blocks',
        name: 'blocks',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        displayOptions: {
          show: {
            resource: ['block'],
            operation: ['create', 'appendChildren'],
          },
        },
        default: {},
        options: [
          {
            name: 'block',
            displayName: 'Block',
            values: [
              {
                displayName: 'Type',
                name: 'type',
                type: 'options',
                options: [
                  { name: 'Paragraph', value: 'paragraph' },
                  { name: 'Heading 1', value: 'heading_1' },
                  { name: 'Heading 2', value: 'heading_2' },
                  { name: 'Heading 3', value: 'heading_3' },
                  { name: 'Bulleted List Item', value: 'bulleted_list_item' },
                  { name: 'Numbered List Item', value: 'numbered_list_item' },
                  { name: 'To Do', value: 'to_do' },
                  { name: 'Toggle', value: 'toggle' },
                  { name: 'Quote', value: 'quote' },
                  { name: 'Callout', value: 'callout' },
                  { name: 'Code', value: 'code' },
                  { name: 'Divider', value: 'divider' },
                  { name: 'Image', value: 'image' },
                  { name: 'Video', value: 'video' },
                  { name: 'Audio', value: 'audio' },
                  { name: 'File', value: 'file' },
                  { name: 'PDF', value: 'pdf' },
                  { name: 'Bookmark', value: 'bookmark' },
                  { name: 'Embed', value: 'embed' },
                  { name: 'Link Preview', value: 'link_preview' },
                  { name: 'Equation', value: 'equation' },
                  { name: 'Table', value: 'table' },
                  { name: 'Column List', value: 'column_list' },
                  { name: 'Synced Block', value: 'synced_block' },
                  { name: 'Template', value: 'template' },
                  { name: 'Table of Contents', value: 'table_of_contents' },
                ],
                default: 'paragraph',
              },
              {
                displayName: 'Content',
                name: 'content',
                type: 'string',
                default: '',
                description: 'Block content (text, code, URL, etc.)',
              },
              {
                displayName: 'Rich Text (JSON)',
                name: 'richText',
                type: 'string',
                default: '',
                description: 'Rich text as JSON array with formatting',
              },
              {
                displayName: 'Properties (JSON)',
                name: 'properties',
                type: 'string',
                default: '{}',
                description: 'Block properties as JSON (color, checked, language, etc.)',
              },
              {
                displayName: 'Children (JSON)',
                name: 'children',
                type: 'string',
                default: '',
                description: 'Child blocks as JSON array',
              },
            ],
          },
        ],
      },

      // SEARCH FIELDS
      {
        displayName: 'Search Query',
        name: 'query',
        type: 'string',
        displayOptions: {
          show: {
            resource: ['page'],
            operation: ['search'],
          },
        },
        default: '',
        description: 'Search query',
      },
      {
        displayName: 'Filter',
        name: 'filter',
        type: 'string',
        displayOptions: {
          show: {
            resource: ['page'],
            operation: ['search'],
          },
        },
        default: '',
        description: 'Search filter as JSON',
      },

      // DATABASE FIELDS
      {
        displayName: 'Database ID',
        name: 'databaseId',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['database'],
            operation: ['get', 'query'],
          },
        },
        default: '',
        description: 'Database ID',
      },

      // USER FIELDS
      {
        displayName: 'User ID',
        name: 'userId',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['user'],
            operation: ['get'],
          },
        },
        default: '',
        description: 'User ID',
      },

      // COMMON OPTIONS
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        options: [
          {
            displayName: 'Icon',
            name: 'icon',
            type: 'string',
            default: '',
            description: 'Page icon (emoji or image URL)',
          },
          {
            displayName: 'Cover',
            name: 'cover',
            type: 'string',
            default: '',
            description: 'Page cover image URL',
          },
          {
            displayName: 'Archive',
            name: 'archived',
            type: 'boolean',
            default: false,
            description: 'Whether to archive the page',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    let responseData: IDataObject[] = [];

    // Validate credentials first
    const isValid = await validateCredentials.call(this);
    if (!isValid) {
      throw new NodeOperationError(this.getNode(), 'Invalid Notion API credentials');
    }

    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter('resource', i) as string;
        const operation = this.getNodeParameter('operation', i) as string;

        let item: IDataObject;

        const nodeInstance = this.constructor.prototype;
        if (resource === 'page') {
          item = await nodeInstance.executePage.call(nodeInstance, this, operation, i);
        } else if (resource === 'block') {
          item = await nodeInstance.executeBlock.call(nodeInstance, this, operation, i);
        } else if (resource === 'database') {
          item = await nodeInstance.executeDatabase.call(nodeInstance, this, operation, i);
        } else if (resource === 'user') {
          item = await nodeInstance.executeUser.call(nodeInstance, this, operation, i);
        } else {
          throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);
        }

        responseData.push(item);
      } catch (error) {
        if (this.continueOnFail()) {
          responseData.push({ error: (error as Error).message });
        } else {
          throw error;
        }
      }
    }

    // Convert to proper execution data format
    const executionData = createExecutionData(responseData);
    return [executionData];
  }

  private async executePage(executeFunctions: IExecuteFunctions, operation: string, itemIndex: number): Promise<IDataObject> {
    switch (operation) {
      case 'create':
        return this.createPage(executeFunctions, itemIndex);
      case 'get':
        return this.getPage(executeFunctions, itemIndex);
      case 'update':
        return this.updatePage(executeFunctions, itemIndex);
      case 'archive':
        return this.archivePage(executeFunctions, itemIndex);
      case 'search':
        return this.searchPages(executeFunctions, itemIndex);
      default:
        throw new NodeOperationError(executeFunctions.getNode(), `Unknown page operation: ${operation}`);
    }
  }

  private async executeBlock(executeFunctions: IExecuteFunctions, operation: string, itemIndex: number): Promise<IDataObject> {
    switch (operation) {
      case 'create':
        return this.createBlocks(executeFunctions, itemIndex);
      case 'get':
        return this.getBlock(executeFunctions, itemIndex);
      case 'update':
        return this.updateBlock(executeFunctions, itemIndex);
      case 'delete':
        return this.deleteBlock(executeFunctions, itemIndex);
      case 'getChildren':
        return this.getBlockChildren(executeFunctions, itemIndex);
      case 'appendChildren':
        return this.appendBlockChildren(executeFunctions, itemIndex);
      default:
        throw new NodeOperationError(executeFunctions.getNode(), `Unknown block operation: ${operation}`);
    }
  }

  private async executeDatabase(executeFunctions: IExecuteFunctions, operation: string, itemIndex: number): Promise<IDataObject> {
    switch (operation) {
      case 'get':
        return this.getDatabase(executeFunctions, itemIndex);
      case 'query':
        return this.queryDatabase(executeFunctions, itemIndex);
      case 'create':
        return this.createDatabase(executeFunctions, itemIndex);
      default:
        throw new NodeOperationError(executeFunctions.getNode(), `Unknown database operation: ${operation}`);
    }
  }

  private async executeUser(executeFunctions: IExecuteFunctions, operation: string, itemIndex: number): Promise<IDataObject> {
    switch (operation) {
      case 'get':
        return this.getUser(executeFunctions, itemIndex);
      case 'list':
        return this.listUsers(executeFunctions, itemIndex);
      default:
        throw new NodeOperationError(executeFunctions.getNode(), `Unknown user operation: ${operation}`);
    }
  }

  // PAGE OPERATIONS
  private async createPage(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const parent = executeFunctions.getNodeParameter('parent', itemIndex) as string;
    const title = executeFunctions.getNodeParameter('title', itemIndex) as string;
    const properties = executeFunctions.getNodeParameter('properties', itemIndex, {}) as IDataObject;
    const additionalFields = executeFunctions.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

    // Create structured page input for validation
    const pageInput: PageInput = createPageInput(
      title,
      parent,
      properties,
      undefined,
      additionalFields.icon as string,
      additionalFields.cover as string,
    );

    const parentId = await resolvePageId.call(executeFunctions, pageInput.parent);
    
    const body: IDataObject = {
      parent: { page_id: parentId },
      properties: {
        title: {
          title: [createRichText(pageInput.title)],
        },
      },
    };

    // Add additional properties
    if (properties.property && Array.isArray(properties.property)) {
      for (const prop of properties.property) {
        const { name, type, value } = prop;
        try {
          const parsedValue = JSON.parse(value);
          body.properties[name] = { [type]: parsedValue };
        } catch {
          if (type === 'rich_text') {
            body.properties[name] = { rich_text: [createRichText(value)] };
          } else {
            body.properties[name] = { [type]: value };
          }
        }
      }
    }

    // Add icon and cover if provided
    if (additionalFields.icon) {
      body.icon = { type: 'emoji', emoji: additionalFields.icon as string };
    }
    if (additionalFields.cover) {
      body.cover = { type: 'external', external: { url: additionalFields.cover as string } };
    }

    return await notionApiRequest.call(executeFunctions, 'POST', '/pages', body);
  }

  private async getPage(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const pageId = executeFunctions.getNodeParameter('pageId', itemIndex) as string;
    const resolvedId = await resolvePageId.call(executeFunctions, pageId);
    
    const page: NotionPage = await notionApiRequest.call(executeFunctions, 'GET', `/pages/${resolvedId}`);
    return page;
  }

  private async updatePage(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const pageId = executeFunctions.getNodeParameter('pageId', itemIndex) as string;
    const properties = executeFunctions.getNodeParameter('properties', itemIndex, {}) as IDataObject;
    const additionalFields = executeFunctions.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

    const resolvedId = await resolvePageId.call(executeFunctions, pageId);
    
    const body: IDataObject = { properties: {} };

    // Add properties
    if (properties.property && Array.isArray(properties.property)) {
      for (const prop of properties.property) {
        const { name, type, value } = prop;
        try {
          const parsedValue = JSON.parse(value);
          body.properties[name] = { [type]: parsedValue };
        } catch {
          if (type === 'rich_text') {
            body.properties[name] = { rich_text: [createRichText(value)] };
          } else {
            body.properties[name] = { [type]: value };
          }
        }
      }
    }

    // Add archived flag if provided
    if (additionalFields.archived !== undefined) {
      body.archived = additionalFields.archived;
    }

    return await notionApiRequest.call(executeFunctions, 'PATCH', `/pages/${resolvedId}`, body);
  }

  private async archivePage(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const pageId = executeFunctions.getNodeParameter('pageId', itemIndex) as string;
    const resolvedId = await resolvePageId.call(executeFunctions, pageId);
    
    return await notionApiRequest.call(executeFunctions, 'PATCH', `/pages/${resolvedId}`, {
      archived: true,
    });
  }

  private async searchPages(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const query = executeFunctions.getNodeParameter('query', itemIndex, '') as string;
    const filter = executeFunctions.getNodeParameter('filter', itemIndex, '') as string;

    const body: IDataObject = {};
    
    if (query) {
      body.query = query;
    }
    
    if (filter) {
      try {
        body.filter = JSON.parse(filter);
      } catch {
        body.filter = { property: 'object', value: 'page' };
      }
    } else {
      body.filter = { property: 'object', value: 'page' };
    }

    const results = await paginatedRequest.call(executeFunctions, 'POST', '/search', body);
    const searchResponse: NotionSearchResponse = {
      object: 'list',
      results,
      count: results.length
    };
    return searchResponse;
  }

  // BLOCK OPERATIONS
  private async createBlocks(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const parentId = executeFunctions.getNodeParameter('parentId', itemIndex) as string;
    const blocks = executeFunctions.getNodeParameter('blocks', itemIndex, {}) as IDataObject;

    const resolvedParentId = await resolvePageId.call(executeFunctions, parentId);
    
    if (!blocks.block || !Array.isArray(blocks.block)) {
      throw new NodeOperationError(executeFunctions.getNode(), 'No blocks provided');
    }

    const blockData: Block[] = [];
    
    for (const blockInputRaw of blocks.block) {
      try {
        // Parse properties and children if they are JSON strings
        const properties = blockInputRaw.properties ? JSON.parse(blockInputRaw.properties) : {};
        const children = blockInputRaw.children ? JSON.parse(blockInputRaw.children) : undefined;
        const richText = blockInputRaw.richText ? parseRichTextInput(blockInputRaw.richText) : undefined;

        // Create proper BlockInput structure
        const blockInput: BlockInput = {
          type: blockInputRaw.type,
          content: blockInputRaw.content,
          richText,
          properties,
          children,
        };

        const block = convertBlockInput(blockInput);

        validateBlock(block);
        blockData.push(block);
      } catch (error) {
        throw new NodeOperationError(
          executeFunctions.getNode(),
          `Error processing block: ${(error as Error).message}`,
        );
      }
    }

    return await notionApiRequest.call(executeFunctions, 'PATCH', `/blocks/${resolvedParentId}/children`, {
      children: blockData,
    });
  }

  private async getBlock(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const blockId = executeFunctions.getNodeParameter('blockId', itemIndex) as string;
    
    return await notionApiRequest.call(executeFunctions, 'GET', `/blocks/${blockId}`);
  }

  private async updateBlock(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const blockId = executeFunctions.getNodeParameter('blockId', itemIndex) as string;
    const blocks = executeFunctions.getNodeParameter('blocks', itemIndex, {}) as IDataObject;

    if (!blocks.block || !Array.isArray(blocks.block) || blocks.block.length === 0) {
      throw new NodeOperationError(executeFunctions.getNode(), 'No block data provided for update');
    }

    const blockInput = blocks.block[0];
    const properties = blockInput.properties ? JSON.parse(blockInput.properties) : {};
    const richText = blockInput.richText ? parseRichTextInput(blockInput.richText) : undefined;

    const block = convertBlockInput({
      type: blockInput.type,
      content: blockInput.content,
      richText,
      properties,
    });

    validateBlock(block);
    
    return await notionApiRequest.call(executeFunctions, 'PATCH', `/blocks/${blockId}`, block);
  }

  private async deleteBlock(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const blockId = executeFunctions.getNodeParameter('blockId', itemIndex) as string;
    
    return await notionApiRequest.call(executeFunctions, 'DELETE', `/blocks/${blockId}`);
  }

  private async getBlockChildren(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const blockId = executeFunctions.getNodeParameter('blockId', itemIndex) as string;
    
    const results: BlockWithId[] = await getBlocksWithIds.call(executeFunctions, blockId);
    return { results, count: results.length };
  }

  private async appendBlockChildren(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const blockId = executeFunctions.getNodeParameter('blockId', itemIndex) as string;
    const blocks = executeFunctions.getNodeParameter('blocks', itemIndex, {}) as IDataObject;

    if (!blocks.block || !Array.isArray(blocks.block)) {
      throw new NodeOperationError(executeFunctions.getNode(), 'No blocks provided');
    }

    const blockData: Block[] = [];
    
    for (const blockInput of blocks.block) {
      const properties = blockInput.properties ? JSON.parse(blockInput.properties) : {};
      const children = blockInput.children ? JSON.parse(blockInput.children) : undefined;
      const richText = blockInput.richText ? parseRichTextInput(blockInput.richText) : undefined;

      const block = convertBlockInput({
        type: blockInput.type,
        content: blockInput.content,
        richText,
        properties,
        children,
      });

      validateBlock(block);
      blockData.push(block);
    }

    return await notionApiRequest.call(executeFunctions, 'PATCH', `/blocks/${blockId}/children`, {
      children: blockData,
    });
  }

  // DATABASE OPERATIONS
  private async getDatabase(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const databaseId = executeFunctions.getNodeParameter('databaseId', itemIndex) as string;
    
    return await notionApiRequest.call(executeFunctions, 'GET', `/databases/${databaseId}`);
  }

  private async queryDatabase(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const databaseId = executeFunctions.getNodeParameter('databaseId', itemIndex) as string;
    const filter = executeFunctions.getNodeParameter('filter', itemIndex, '') as string;

    const body: IDataObject = {};
    
    if (filter) {
      try {
        body.filter = JSON.parse(filter);
      } catch (error) {
        throw new NodeOperationError(executeFunctions.getNode(), `Invalid filter JSON: ${(error as Error).message}`);
      }
    }

    const results = await paginatedRequest.call(executeFunctions, 'POST', `/databases/${databaseId}/query`, body);
    const response: NotionBlockChildrenResponse = {
      object: 'list',
      results,
      count: results.length,
      has_more: false,
      next_cursor: null
    };
    return response;
  }

  private async createDatabase(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const parent = executeFunctions.getNodeParameter('parent', itemIndex) as string;
    const title = executeFunctions.getNodeParameter('title', itemIndex) as string;
    const properties = executeFunctions.getNodeParameter('properties', itemIndex, {}) as IDataObject;

    const parentId = await resolvePageId.call(executeFunctions, parent);
    
    const body: IDataObject = {
      parent: { page_id: parentId },
      title: [createRichText(title)],
      properties: {},
    };

    // Add properties schema
    if (properties.property && Array.isArray(properties.property)) {
      for (const prop of properties.property) {
        const { name, type, value } = prop;
        try {
          const parsedValue = JSON.parse(value);
          body.properties[name] = { [type]: parsedValue };
        } catch {
          body.properties[name] = { [type]: {} };
        }
      }
    }

    return await notionApiRequest.call(executeFunctions, 'POST', '/databases', body);
  }

  // USER OPERATIONS
  private async getUser(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
    const userId = executeFunctions.getNodeParameter('userId', itemIndex) as string;
    
    return await notionApiRequest.call(executeFunctions, 'GET', `/users/${userId}`);
  }

  private async listUsers(executeFunctions: IExecuteFunctions, _itemIndex: number): Promise<IDataObject> {
    const results = await paginatedRequest.call(executeFunctions, 'GET', '/users');
    return { results, count: results.length };
  }
}