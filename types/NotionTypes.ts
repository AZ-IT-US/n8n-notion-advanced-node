// Notion API Types for complete block and formatting support

export type NotionColor = 
  | 'default' | 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red'
  | 'gray_background' | 'brown_background' | 'orange_background' | 'yellow_background' 
  | 'green_background' | 'blue_background' | 'purple_background' | 'pink_background' | 'red_background';

export interface RichTextAnnotations {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  code?: boolean;
  color?: NotionColor;
}

export interface TextLink {
  url: string;
}

export interface RichTextText {
  content: string;
  link?: TextLink | null;
}

export interface RichTextMention {
  type: 'user' | 'page' | 'database' | 'date' | 'link_preview' | 'template_mention';
  user?: { id: string };
  page?: { id: string };
  database?: { id: string };
  date?: { start: string; end?: string; time_zone?: string };
  link_preview?: { url: string };
  template_mention?: { type: 'template_mention_date' | 'template_mention_user'; template_mention_date?: string; template_mention_user?: string };
}

export interface RichTextEquation {
  expression: string;
}

export interface RichTextObject {
  type: 'text' | 'mention' | 'equation';
  text?: RichTextText;
  mention?: RichTextMention;
  equation?: RichTextEquation;
  annotations: RichTextAnnotations;
  plain_text: string;
  href?: string | null;
}

export interface FileObject {
  type: 'external' | 'file';
  external?: { url: string };
  file?: { url: string; expiry_time?: string };
  caption?: RichTextObject[];
}

export interface EmojiObject {
  type: 'emoji';
  emoji: string;
}

export interface Parent {
  type: 'database_id' | 'page_id' | 'workspace' | 'block_id';
  database_id?: string;
  page_id?: string;
  workspace?: boolean;
  block_id?: string;
}

// Block Type Definitions
export interface ParagraphBlock {
  type: 'paragraph';
  paragraph: {
    rich_text: RichTextObject[];
    color?: NotionColor;
    children?: Block[];
  };
}

export interface HeadingBlock {
  type: 'heading_1' | 'heading_2' | 'heading_3';
  heading_1?: {
    rich_text: RichTextObject[];
    color?: NotionColor;
    is_toggleable?: boolean;
  };
  heading_2?: {
    rich_text: RichTextObject[];
    color?: NotionColor;
    is_toggleable?: boolean;
  };
  heading_3?: {
    rich_text: RichTextObject[];
    color?: NotionColor;
    is_toggleable?: boolean;
  };
}

export interface BulletedListItemBlock {
  type: 'bulleted_list_item';
  bulleted_list_item: {
    rich_text: RichTextObject[];
    color?: NotionColor;
    children?: Block[];
  };
}

export interface NumberedListItemBlock {
  type: 'numbered_list_item';
  numbered_list_item: {
    rich_text: RichTextObject[];
    color?: NotionColor;
    children?: Block[];
  };
}

export interface ToDoBlock {
  type: 'to_do';
  to_do: {
    rich_text: RichTextObject[];
    checked?: boolean;
    color?: NotionColor;
    children?: Block[];
  };
}

export interface ToggleBlock {
  type: 'toggle';
  toggle: {
    rich_text: RichTextObject[];
    color?: NotionColor;
    children?: Block[];
  };
}

export interface QuoteBlock {
  type: 'quote';
  quote: {
    rich_text: RichTextObject[];
    color?: NotionColor;
    children?: Block[];
  };
}

export interface CalloutBlock {
  type: 'callout';
  callout: {
    rich_text: RichTextObject[];
    icon?: EmojiObject | FileObject;
    color?: NotionColor;
    children?: Block[];
  };
}

export interface CodeBlock {
  type: 'code';
  code: {
    rich_text: RichTextObject[];
    language?: string;
    caption?: RichTextObject[];
  };
}

export interface DividerBlock {
  type: 'divider';
  divider: Record<string, never>;
}

export interface ImageBlock {
  type: 'image';
  image: FileObject;
}

export interface VideoBlock {
  type: 'video';
  video: FileObject;
}

export interface AudioBlock {
  type: 'audio';
  audio: FileObject;
}

export interface FileBlock {
  type: 'file';
  file: FileObject;
}

export interface PdfBlock {
  type: 'pdf';
  pdf: FileObject;
}

export interface BookmarkBlock {
  type: 'bookmark';
  bookmark: {
    url: string;
    caption?: RichTextObject[];
  };
}

export interface EmbedBlock {
  type: 'embed';
  embed: {
    url: string;
    caption?: RichTextObject[];
  };
}

export interface LinkPreviewBlock {
  type: 'link_preview';
  link_preview: {
    url: string;
  };
}

export interface EquationBlock {
  type: 'equation';
  equation: {
    expression: string;
  };
}

export interface TableBlock {
  type: 'table';
  table: {
    table_width: number;
    has_column_header?: boolean;
    has_row_header?: boolean;
    children?: TableRowBlock[];
  };
}

export interface TableRowBlock {
  type: 'table_row';
  table_row: {
    cells: RichTextObject[][];
  };
}

export interface ColumnListBlock {
  type: 'column_list';
  column_list: {
    children?: ColumnBlock[];
  };
}

export interface ColumnBlock {
  type: 'column';
  column: {
    children?: Block[];
  };
}

export interface SyncedBlock {
  type: 'synced_block';
  synced_block: {
    synced_from?: {
      type: 'block_id';
      block_id: string;
    } | null;
    children?: Block[];
  };
}

export interface TemplateBlock {
  type: 'template';
  template: {
    rich_text: RichTextObject[];
    children?: Block[];
  };
}

export interface TableOfContentsBlock {
  type: 'table_of_contents';
  table_of_contents: {
    color?: NotionColor;
  };
}

export interface ChildDatabaseBlock {
  type: 'child_database';
  child_database: {
    title: string;
  };
}

export interface ChildPageBlock {
  type: 'child_page';
  child_page: {
    title: string;
  };
}

export interface BaseBlock {
  object: 'block';
  id: string;
  parent: Parent;
  created_time: string;
  created_by: { object: 'user'; id: string };
  last_edited_time: string;
  last_edited_by: { object: 'user'; id: string };
  archived: boolean;
  has_children: boolean;
}

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | BulletedListItemBlock
  | NumberedListItemBlock
  | ToDoBlock
  | ToggleBlock
  | QuoteBlock
  | CalloutBlock
  | CodeBlock
  | DividerBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | FileBlock
  | PdfBlock
  | BookmarkBlock
  | EmbedBlock
  | LinkPreviewBlock
  | EquationBlock
  | TableBlock
  | TableRowBlock
  | ColumnListBlock
  | ColumnBlock
  | SyncedBlock
  | TemplateBlock
  | TableOfContentsBlock
  | ChildDatabaseBlock
  | ChildPageBlock;

export type BlockWithId = Block & BaseBlock;

// Page Property Types
export interface PropertyValue {
  id: string;
  type: string;
  [key: string]: any;
}

export interface PageProperties {
  [key: string]: PropertyValue;
}

export interface NotionPage {
  object: 'page';
  id: string;
  created_time: string;
  created_by: { object: 'user'; id: string };
  last_edited_time: string;
  last_edited_by: { object: 'user'; id: string };
  archived: boolean;
  properties: PageProperties;
  parent: Parent;
  url: string;
  icon?: EmojiObject | FileObject | null;
  cover?: FileObject | null;
}

// API Response Types
export interface NotionApiResponse<T = any> {
  object: string;
  results?: T[];
  next_cursor?: string | null;
  has_more?: boolean;
  type?: string;
  [key: string]: any;
}

export interface NotionSearchResponse extends NotionApiResponse {
  results: (NotionPage | any)[];
}

export interface NotionBlockChildrenResponse extends NotionApiResponse {
  results: BlockWithId[];
}

// Operation Types for n8n
export type NotionResource = 'page' | 'block' | 'database' | 'user';

export type NotionPageOperation = 'create' | 'get' | 'update' | 'archive' | 'search';
export type NotionBlockOperation = 'create' | 'get' | 'update' | 'delete' | 'getChildren' | 'append';
export type NotionDatabaseOperation = 'get' | 'query' | 'create';
export type NotionUserOperation = 'get' | 'list';

export interface NotionCredentials {
  apiKey: string;
}

// Block Creation Input Types
export interface BlockInput {
  type: string;
  content?: string;
  richText?: RichTextObject[];
  properties?: { [key: string]: any };
  children?: BlockInput[];
}

export interface PageInput {
  title: string;
  parent: string; // Page ID or Database ID
  properties?: { [key: string]: any };
  children?: BlockInput[];
  icon?: string;
  cover?: string;
}