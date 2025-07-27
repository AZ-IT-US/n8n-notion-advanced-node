# n8n Notion Advanced Nodes

A comprehensive n8n community package that provides complete access to the Notion API v2022-06-28 with support for all block types, rich text formatting, and CRUD operations. Includes both a full-featured workflow node and an AI Agent Tool for intelligent automation.

## What's Included

### 1. **Notion Advanced** - Full-Featured Workflow Node
Complete Notion integration for traditional n8n workflows with comprehensive CRUD operations and all 25+ block types.

### 2. **Notion AI Tool** - AI Agent Integration
Specialized tool designed for n8n's AI Agent Nodes, enabling natural language Notion automation.

📖 **For AI Agent usage, see [AI-TOOL-USAGE.md](./AI-TOOL-USAGE.md)**

## Features

### Complete Block Type Support
- **Basic Text Blocks**: paragraph, heading_1/2/3, bulleted_list_item, numbered_list_item, to_do, toggle, quote, callout, divider
- **Code Blocks**: code with syntax highlighting support for 170+ languages
- **Media Blocks**: image, video, audio, file, pdf with upload and external URL support
- **Interactive Blocks**: bookmark, embed, link_preview, equation (LaTeX)
- **Advanced Layout**: table, table_row, column_list, column, synced_block, template, table_of_contents
- **Database Integration**: child_database, child_page references

### Rich Text Formatting
- **Annotations**: bold, italic, strikethrough, underline, code
- **Colors**: All 10 text colors and 9 background colors
- **Links**: Internal page links and external URLs
- **Mentions**: User, page, database, and date mentions
- **Equations**: Inline and block LaTeX math expressions

### Operations
- **Pages**: Create, read, update, archive, search with full property support
- **Blocks**: Create, read, update, delete, get children, append children
- **Databases**: Get, query, create with complete schema support
- **Users**: Get, list workspace users

## Installation

### Via n8n GUI (Recommended)
1. Open n8n Settings → Community Nodes
2. Click "Install a community node"
3. Enter: `n8n-nodes-notion-advanced`
4. Click Install

### Via npm
```bash
npm install n8n-nodes-notion-advanced
```

📖 **For detailed installation instructions including Docker setup, development mode, and troubleshooting, see [INSTALLATION.md](./INSTALLATION.md)**

## Quick Start

### For AI Agents
```markdown
1. Add AI Agent Node to your workflow
2. Configure your chat model (OpenAI, Anthropic, etc.)
3. Add "Notion AI Tool" from available tools
4. Configure Notion credentials
5. AI Agent can now create/manage Notion content with natural language!

Example: "Create a project plan page with timeline and milestones"
```

### For Traditional Workflows
```markdown
1. Add "Notion Advanced" node to your workflow
2. Configure Notion credentials
3. Choose resource (Page/Block/Database/User)
4. Select operation and configure parameters
5. Execute comprehensive Notion operations
```

## Prerequisites

- n8n instance (self-hosted or cloud)
- Notion API integration with appropriate permissions
- Existing `notionApi` credentials configured in n8n

## Usage

### Setting up Credentials

This node uses the existing n8n Notion API credentials. Ensure you have:

1. Created a Notion integration at https://developers.notion.com/
2. Added the integration to your Notion workspace
3. Configured the `notionApi` credential in n8n with your integration token

### Basic Examples

#### Creating a Page

```json
{
  "resource": "page",
  "operation": "create",
  "parent": "page-id-or-url",
  "title": "My New Page",
  "properties": {
    "property": [
      {
        "name": "Status",
        "type": "select",
        "value": "{\"name\": \"In Progress\"}"
      }
    ]
  }
}
```

#### Adding Blocks to a Page

```json
{
  "resource": "block",
  "operation": "create",
  "parentId": "page-id",
  "blocks": {
    "block": [
      {
        "type": "paragraph",
        "content": "This is a simple paragraph"
      },
      {
        "type": "heading_1",
        "content": "Main Heading",
        "properties": "{\"color\": \"blue\"}"
      },
      {
        "type": "code",
        "content": "console.log('Hello World');",
        "properties": "{\"language\": \"javascript\"}"
      }
    ]
  }
}
```

#### Rich Text with Formatting

```json
{
  "type": "paragraph",
  "richText": "[{\"type\": \"text\", \"text\": {\"content\": \"Bold text\"}, \"annotations\": {\"bold\": true}}, {\"type\": \"text\", \"text\": {\"content\": \" and \"}, \"annotations\": {}}, {\"type\": \"text\", \"text\": {\"content\": \"italic text\", \"link\": {\"url\": \"https://example.com\"}}, \"annotations\": {\"italic\": true, \"color\": \"blue\"}}]"
}
```

## Block Types Reference

### Text Blocks

| Block Type | Properties | Description |
|------------|-----------|-------------|
| `paragraph` | `rich_text`, `color`, `children` | Basic text paragraph |
| `heading_1` | `rich_text`, `color`, `is_toggleable` | Top-level heading |
| `heading_2` | `rich_text`, `color`, `is_toggleable` | Second-level heading |
| `heading_3` | `rich_text`, `color`, `is_toggleable` | Third-level heading |
| `bulleted_list_item` | `rich_text`, `color`, `children` | Bullet point list item |
| `numbered_list_item` | `rich_text`, `color`, `children` | Numbered list item |
| `to_do` | `rich_text`, `checked`, `color`, `children` | Checkbox item |
| `toggle` | `rich_text`, `color`, `children` | Collapsible section |
| `quote` | `rich_text`, `color`, `children` | Block quote |
| `callout` | `rich_text`, `icon`, `color`, `children` | Highlighted callout |

### Code Blocks

| Block Type | Properties | Description |
|------------|-----------|-------------|
| `code` | `rich_text`, `language`, `caption` | Code block with syntax highlighting |

**Supported Languages**: JavaScript, Python, Java, C++, HTML, CSS, SQL, JSON, XML, and 160+ more.

### Media Blocks

| Block Type | Properties | Description |
|------------|-----------|-------------|
| `image` | `url`, `caption` | Image from URL or upload |
| `video` | `url`, `caption` | Video embed or upload |
| `audio` | `url`, `caption` | Audio file |
| `file` | `url`, `caption` | Generic file attachment |
| `pdf` | `url`, `caption` | PDF document |

### Interactive Blocks

| Block Type | Properties | Description |
|------------|-----------|-------------|
| `bookmark` | `url`, `caption` | Website bookmark with preview |
| `embed` | `url`, `caption` | Embedded content |
| `link_preview` | `url` | Auto-generated link preview |
| `equation` | `expression` | LaTeX mathematical expression |

### Layout Blocks

| Block Type | Properties | Description |
|------------|-----------|-------------|
| `table` | `table_width`, `has_column_header`, `has_row_header`, `children` | Data table |
| `table_row` | `cells` | Table row with cells |
| `column_list` | `children` | Container for columns |
| `column` | `children` | Individual column |
| `divider` | None | Horizontal divider line |

### Advanced Blocks

| Block Type | Properties | Description |
|------------|-----------|-------------|
| `synced_block` | `synced_from`, `children` | Synchronized content block |
| `template` | `rich_text`, `children` | Template block |
| `table_of_contents` | `color` | Auto-generated table of contents |
| `child_database` | `title` | Inline database |
| `child_page` | `title` | Child page reference |

## Rich Text Formatting

### Annotations

```json
{
  "annotations": {
    "bold": true,
    "italic": false,
    "strikethrough": false,
    "underline": true,
    "code": false,
    "color": "blue"
  }
}
```

### Colors

**Text Colors**: `default`, `gray`, `brown`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`, `red`

**Background Colors**: `gray_background`, `brown_background`, `orange_background`, `yellow_background`, `green_background`, `blue_background`, `purple_background`, `pink_background`, `red_background`

### Links

```json
{
  "text": {
    "content": "Link text",
    "link": {
      "url": "https://example.com"
    }
  }
}
```

## Error Handling

The node provides comprehensive error handling:

- **Credential Validation**: Automatically validates API credentials
- **Input Validation**: Validates all required fields and block structures
- **API Error Mapping**: Maps Notion API errors to user-friendly messages
- **Graceful Degradation**: Continues processing with `continueOnFail` option

## Performance Features

- **Pagination Support**: Automatically handles paginated responses
- **Batch Operations**: Efficient bulk block creation and updates
- **Credential Caching**: Reuses authentication across requests
- **Request Optimization**: Minimizes API calls with intelligent batching

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure your Notion integration has access to the target pages/databases
2. **Invalid Block Types**: Check that all block properties match the expected schema
3. **Rate Limiting**: The node respects Notion's rate limits automatically
4. **Large Content**: For pages with many blocks, consider using batch operations

### Debug Tips

- Enable n8n's debug mode to see full API requests/responses
- Validate JSON strings in block properties before sending
- Test with simple blocks before adding complex formatting
- Check Notion's API documentation for the latest block schemas

## API Reference

This node implements Notion API version `2022-06-28`. For the most up-to-date API documentation, visit:
https://developers.notion.com/reference

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review Notion's API documentation
- Open an issue on GitHub
- Join the n8n community forum