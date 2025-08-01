# XML-Style Formatting Guide for AI Agents

## Overview

The Notion AI Tool now supports advanced XML-like tag formatting for precise, unambiguous content parsing. This eliminates formatting conflicts and ensures consistent results across all block types.

## Why XML-Style Tags?

### Problems with Traditional Markdown
- **Ambiguity**: `> [!info]` vs `>` quotes can conflict
- **Context Sensitivity**: Parsing depends on surrounding content
- **Edge Cases**: Complex patterns fail with mixed content

### Benefits of XML Tags
- **Explicit Intent**: `<callout type="info">` is unambiguous
- **Reliable Parsing**: No conflicts between similar patterns
- **Enhanced Features**: Better attribute support (types, languages, etc.)
- **Future-Proof**: Extensible for new block types

## Complete XML Tag Reference

### 1. Headings
```xml
<h1>Main Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>
```

**Attributes**: None  
**Content**: Plain text with rich formatting support  
**Example**: `<h1>Project **Alpha** Documentation</h1>`

### 2. Callouts
```xml
<callout type="info">Information callout with clear purpose</callout>
<callout type="warning">Warning about potential issues</callout>
<callout type="tip">Helpful advice for users</callout>
<callout type="success">Success confirmation message</callout>
<callout type="error">Error notification or problem</callout>
<callout type="note">General note or observation</callout>
<callout type="danger">Critical warning about dangerous operations</callout>
<callout type="question">Question for consideration or discussion</callout>
```

**Required Attributes**: `type` (info, warning, tip, success, error, note, danger, question)  
**Content**: Rich text with full markdown formatting support  
**Icons**: Automatically assigned based on type  
**Colors**: Automatically assigned based on type

### 3. Code Blocks
```xml
<code language="javascript">
function example() {
    console.log('Hello, World!');
    return true;
}
</code>

<code language="python">
def calculate_metrics():
    data = fetch_data()
    return process(data)
</code>

<code language="sql">
SELECT users.name, COUNT(orders.id) as order_count
FROM users
LEFT JOIN orders ON users.id = orders.user_id
GROUP BY users.id;
</code>

<code>
Plain text code without syntax highlighting
</code>
```

**Optional Attributes**: `language` (javascript, python, sql, bash, json, yaml, etc.)  
**Content**: Raw code content  
**Default**: If no language specified, uses `plain_text`

### 4. Images
```xml
<!-- Full image with caption -->
<image src="https://example.com/diagram.jpg" alt="System Architecture">
This diagram shows the complete system architecture with **microservices** and *database* connections.
</image>

<!-- Self-closing without caption -->
<image src="https://example.com/logo.png" alt="Company Logo"/>

<!-- Minimal required attributes -->
<image src="https://example.com/chart.png"/>
```

**Required Attributes**: `src` (image URL)  
**Optional Attributes**: `alt` (description for accessibility)  
**Content**: Optional caption with rich text formatting  
**Fallback**: Alt text used as caption if no content provided

### 5. Equations
```xml
<equation>E = mc^2</equation>
<equation>\int_{a}^{b} x^2 dx = \frac{b^3 - a^3}{3}</equation>
<equation>\sum_{i=1}^{n} x_i = \bar{x} \cdot n</equation>
<equation>f(x) = \frac{1}{\sqrt{2\pi\sigma^2}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}</equation>
```

**Attributes**: None  
**Content**: LaTeX mathematical expressions  
**Support**: Full LaTeX equation syntax

### 6. Embeds and Bookmarks
```xml
<!-- Embeds for interactive/video content -->
<embed>https://youtube.com/watch?v=dQw4w9WgXcQ</embed>
<embed>https://vimeo.com/123456789</embed>
<embed>https://loom.com/share/abc123def456</embed>
<embed>https://figma.com/file/abc123/Design-System</embed>
<embed>https://miro.com/app/board/abc123</embed>
<embed>https://codepen.io/user/pen/abc123</embed>

<!-- Bookmarks for regular websites -->
<bookmark>https://docs.example.com/api-reference</bookmark>
<bookmark>https://github.com/organization/repository</bookmark>
<bookmark>https://example.com/important-article</bookmark>
```

**Attributes**: None  
**Content**: URL only  
**Automatic Detection**: Videos/interactive tools become embeds, others become bookmarks

### 7. Toggles
```xml
<toggle>Click to expand configuration details</toggle>
<toggle>FAQ: How do I configure authentication?</toggle>
<toggle>Advanced Settings and Options</toggle>
<toggle>**Important:** Security Considerations</toggle>
```

**Attributes**: None  
**Content**: Toggle title with rich text formatting support  
**Behavior**: Creates collapsible section in Notion

### 8. Quotes
```xml
<quote>The best code is **well-documented** and *self-explanatory*.</quote>
<quote>Innovation distinguishes between a leader and a follower. - Steve Jobs</quote>
<quote>Visit our [documentation](https://docs.example.com) for detailed guides.</quote>
```

**Attributes**: None  
**Content**: Quote text with full rich text formatting support  
**Use Case**: Citations, important statements, testimonials

### 9. Dividers
```xml
<divider/>
<!-- or -->
<divider></divider>
```

**Attributes**: None  
**Content**: None (self-closing or empty)  
**Purpose**: Visual separation between content sections

### 10. To-Do Items
```xml
<todo checked="false">Complete project documentation</todo>
<todo checked="true">Review code implementation</todo>
<todo checked="false">Test **critical features** thoroughly</todo>
<todo checked="true">Deploy to staging environment</todo>
```

**Required Attributes**: `checked` ("true" or "false")  
**Content**: Task description with rich text formatting support  
**Visual**: Checkboxes in Notion interface

## Rich Text Formatting Within XML

All XML tags support rich text formatting using markdown syntax:

### Supported Patterns
- `**bold text**` - Bold formatting
- `*italic text*` - Italic formatting  
- `***bold and italic***` - Combined formatting
- `~~strikethrough~~` - Strikethrough text
- `` `inline code` `` - Code formatting
- `[link text](https://url.com)` - Hyperlinks

### Examples in Context
```xml
<callout type="tip">
Use **proper authentication** when accessing the API. 
See our [security guide](https://docs.example.com/security) for details.
</callout>

<h2>Installation with `npm install` Command</h2>

<quote>
***Quality*** is not an act, it is a *habit*. Always `test your code` thoroughly.
</quote>

<todo checked="false">
Review the **deployment checklist** and update [documentation](https://wiki.company.com)
</todo>
```

## AI Agent Prompt Templates

### Template 1: XML-First Approach (Recommended)
```
You are creating content for a Notion page using XML-style formatting for maximum reliability.

FORMATTING REQUIREMENTS:
- Use XML tags for ALL block types: <h1>, <h2>, <h3>, <callout>, <code>, <image>, <equation>, <embed>, <bookmark>, <toggle>, <quote>, <divider/>, <todo>
- Specify callout types: <callout type="info|warning|tip|success|error|note|danger|question">
- Include language in code blocks: <code language="javascript|python|sql|etc">
- Use proper attributes: <image src="url" alt="description">, <todo checked="true|false">
- Rich text formatting works inside XML tags using markdown syntax

CONTENT STRUCTURE:
1. Start with <h1> main title
2. Use <callout type="info"> for overviews
3. Organize with <h2> sections and <h3> subsections
4. Use appropriate callout types for different message types
5. Include <code language="..."> for all code examples
6. Add <divider/> between major sections
7. Use <todo> for action items and checklists

Create well-structured, professional content using XML formatting.
```

### Template 2: Documentation Generator
```
Generate comprehensive technical documentation using XML formatting:

REQUIRED STRUCTURE:
<h1>Documentation Title</h1>
<callout type="info">Brief overview of the topic</callout>

<h2>Getting Started</h2>
<callout type="warning">Prerequisites and requirements</callout>

<h3>Installation</h3>
<code language="bash">installation commands</code>

<h3>Configuration</h3>
<code language="json">configuration examples</code>

<h2>Usage Examples</h2>
<code language="javascript">practical examples</code>

<h2>API Reference</h2>
<callout type="tip">Best practices and tips</callout>

<h2>Troubleshooting</h2>
<callout type="error">Common error solutions</callout>

<h2>Resources</h2>
<bookmark>https://external-documentation.com</bookmark>
<embed>https://tutorial-video.com</embed>

Use proper XML formatting throughout with appropriate callout types and rich text formatting.
```

### Template 3: Project Planning
```
Create a comprehensive project plan using XML formatting:

STRUCTURE:
<h1>Project Name</h1>
<callout type="info">Project overview and objectives</callout>

<h2>Objectives</h2>
<todo checked="false">Primary objective with **priority**</todo>
<todo checked="false">Secondary objective with *timeline*</todo>

<h2>Timeline</h2>
<h3>Phase 1: Planning</h3>
<callout type="note">Phase description and requirements</callout>

<h3>Phase 2: Development</h3>
<callout type="warning">Critical milestones and dependencies</callout>

<h3>Phase 3: Testing</h3>
<callout type="tip">Testing strategies and success criteria</callout>

<h3>Phase 4: Deployment</h3>
<callout type="success">Go-live checklist and metrics</callout>

<h2>Risk Assessment</h2>
<callout type="danger">High-priority risks and mitigation strategies</callout>

<h2>Resources</h2>
<toggle>Team Contacts and Documentation</toggle>

Format everything using proper XML tags with rich text formatting for emphasis.
```

### Template 4: Technical Report
```
Generate a structured technical report using XML formatting:

REPORT STRUCTURE:
<h1>Report Title</h1>
<callout type="info">Executive summary and key findings</callout>

<h2>Methodology</h2>
Description of research methods and approach.

<h2>Data Analysis</h2>
<h3>Statistical Results</h3>
<equation>Statistical formulas and calculations</equation>

<h3>Performance Metrics</h3>
<code language="sql">Data queries and analysis code</code>

<h2>Findings</h2>
<callout type="success">Positive outcomes and achievements</callout>
<callout type="warning">Areas of concern or improvement</callout>

<h2>Recommendations</h2>
<todo checked="false">**High priority** recommendation</todo>
<todo checked="false">*Medium priority* recommendation</todo>

<h2>Conclusion</h2>
<quote>Key takeaway or impactful statement</quote>

<h2>Appendices</h2>
<toggle>Additional Data and References</toggle>

<divider/>

<h2>Resources</h2>
<bookmark>https://research-source.com</bookmark>

Use XML formatting with appropriate callout types and rich text emphasis.
```

## Content Strategy Guidelines

### When to Use XML vs Traditional Markdown

#### Use XML Tags For:
- **Callouts**: Always use `<callout type="...">` for reliable parsing
- **Code Blocks**: Use `<code language="...">` for proper syntax highlighting
- **Complex Content**: Images, embeds, equations, toggles
- **Professional Documents**: Reports, documentation, project plans
- **Mixed Content**: When combining multiple block types

#### Traditional Markdown Still Works For:
- **Simple Lists**: Basic bullet points and numbered lists
- **Basic Text**: When only paragraphs with simple formatting needed
- **Legacy Content**: Existing workflows that use markdown patterns
- **Quick Notes**: Informal content with minimal formatting needs

### Best Practices

#### Content Organization
1. **Start with Structure**: Use headings to create clear hierarchy
2. **Guide with Callouts**: Use appropriate callout types for different messages
3. **Break Up Content**: Use dividers to separate major sections
4. **Include Actions**: Add todo items for actionable content
5. **Provide Resources**: Link to external documentation and tools

#### XML Tag Usage
- **Be Explicit**: Use specific callout types rather than generic ones
- **Include Attributes**: Always specify language for code blocks
- **Rich Text Within**: Use markdown formatting inside XML tags
- **Consistent Style**: Maintain consistent XML usage throughout documents
- **Validate Content**: Ensure all tags are properly closed

#### Error Prevention
- **Check Attributes**: Verify required attributes are included
- **Match Tag Types**: Use correct callout types (info, warning, tip, etc.)
- **Close Tags**: Ensure all opening tags have closing tags (except self-closing)
- **Escape Content**: Be careful with special characters in URLs and code

## Advanced Examples

### Complete Technical Guide
```xml
<h1>API Integration Guide</h1>

<callout type="info">
This guide covers complete integration with our **REST API** using modern authentication methods.
</callout>

<h2>Authentication</h2>

<callout type="warning">
**Security Notice**: Never expose API keys in client-side code or public repositories.
</callout>

<h3>OAuth 2.0 Setup</h3>

<code language="javascript">
const authConfig = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: 'https://yourapp.com/callback',
  scope: 'read write'
};

async function authenticate() {
  const response = await fetch('/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(authConfig)
  });
  return response.json();
}
</code>

<h3>Rate Limiting</h3>

<equation>rate\_limit = \frac{requests}{window} \leq 1000</equation>

<callout type="tip">
Implement **exponential backoff** when hitting rate limits to ensure reliable API access.
</callout>

<h2>Endpoints</h2>

<h3>User Management</h3>

<code language="bash">
# Get user information
GET /api/v1/users/{user_id}

# Update user profile
PUT /api/v1/users/{user_id}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
</code>

<h3>Data Retrieval</h3>

<code language="python">
import requests
import json

def get_user_data(user_id, token):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.get(
        f'https://api.example.com/v1/users/{user_id}',
        headers=headers
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f'API Error: {response.status_code}')
</code>

<h2>Error Handling</h2>

<callout type="error">
**Common Errors**: Always implement proper error handling for 401 (Unauthorized), 429 (Rate Limited), and 500 (Server Error) responses.
</callout>

<h3>Error Response Format</h3>

<code language="json">
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The provided authentication token is invalid or expired",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
</code>

<h2>Testing Your Integration</h2>

<todo checked="false">Set up authentication in development environment</todo>
<todo checked="false">Test all **CRUD operations** with sample data</todo>
<todo checked="false">Implement error handling for all API calls</todo>
<todo checked="false">Add *rate limiting* and retry logic</todo>
<todo checked="false">Test with production-like data volumes</todo>

<divider/>

<h2>Additional Resources</h2>

<callout type="success">
**Ready to Go Live?** Contact our support team for production API key activation.
</callout>

<toggle>Complete SDK Documentation and Examples</toggle>

<bookmark>https://api-docs.example.com/reference</bookmark>
<embed>https://youtube.com/watch?v=API_TUTORIAL_VIDEO</embed>

<quote>
***Well-integrated APIs*** create seamless user experiences. Test thoroughly and *handle errors gracefully*.
</quote>
```

### Project Status Report
```xml
<h1>Q4 Development Sprint Report</h1>

<callout type="info">
**Sprint Duration**: October 1 - December 31, 2024  
**Team Size**: 8 developers, 2 QA engineers, 1 DevOps specialist
</callout>

<h2>Sprint Objectives</h2>

<todo checked="true">Complete user authentication system</todo>
<todo checked="true">Implement **real-time notifications**</todo>
<todo checked="false">Deploy advanced *analytics dashboard*</todo>
<todo checked="false">Optimize database performance</todo>

<h2>Key Achievements</h2>

<callout type="success">
**Major Milestone**: Successfully launched authentication system with **99.9% uptime** in production.
</callout>

<h3>Technical Accomplishments</h3>

<code language="javascript">
// New authentication middleware implementation
const authMetrics = {
  totalLogins: 15847,
  successRate: 99.3,
  avgResponseTime: '45ms',
  securityIncidents: 0
};
</code>

<h3>Performance Improvements</h3>

<equation>response\_time\_improvement = \frac{old\_time - new\_time}{old\_time} \times 100 = 67\%</equation>

<h2>Challenges Encountered</h2>

<callout type="warning">
**Database Scaling**: Encountered performance bottlenecks with concurrent user sessions exceeding 10,000.
</callout>

<h3>Resolution Strategy</h3>

<code language="sql">
-- Optimized query implementation
CREATE INDEX CONCURRENTLY idx_user_sessions_active 
ON user_sessions (user_id, created_at) 
WHERE status = 'active';

-- Connection pooling configuration
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
</code>

<h2>Metrics and Analytics</h2>

<h3>Code Quality</h3>

<callout type="tip">
**Test Coverage**: Achieved **94% code coverage** with comprehensive unit and integration tests.
</callout>

<h3>User Engagement</h3>

<image src="https://charts.example.com/user-engagement.png" alt="User Engagement Metrics">
Monthly active users increased by **45%** following the authentication system launch.
</image>

<h2>Next Sprint Planning</h2>

<callout type="note">
**Focus Areas**: Database optimization, analytics dashboard completion, and mobile app integration.
</callout>

<todo checked="false">Implement **Redis caching** for session management</todo>
<todo checked="false">Complete analytics dashboard with *real-time updates*</todo>
<todo checked="false">Develop mobile API endpoints</todo>
<todo checked="false">Conduct performance testing with 50K concurrent users</todo>

<h2>Risk Assessment</h2>

<callout type="danger">
**Critical Risk**: Potential database migration required for scaling may cause **2-hour downtime** during deployment.
</callout>

<h3>Mitigation Plan</h3>

<toggle>Detailed Database Migration Strategy</toggle>

<divider/>

<h2>Team Recognition</h2>

<quote>
**Outstanding Performance**: Special recognition to the DevOps team for achieving ***zero-downtime deployments*** throughout the entire sprint.
</quote>

<h2>Resources and Documentation</h2>

<bookmark>https://github.com/company/project-docs</bookmark>
<bookmark>https://confluence.company.com/sprint-retrospective</bookmark>
<embed>https://loom.com/share/sprint-demo-video</embed>

<callout type="success">
**Overall Sprint Rating**: Exceeded expectations with **95% objective completion** and zero critical incidents.
</callout>
```

## Migration from Traditional Markdown

### Quick Reference Conversion

| Traditional Markdown | XML Equivalent |
|---------------------|----------------|
| `> [!info] text` | `<callout type="info">text</callout>` |
| ````javascript` | `<code language="javascript">` |
| `![alt](url)` | `<image src="url" alt="alt"/>` |
| `$$equation$$` | `<equation>equation</equation>` |
| `▶ toggle` | `<toggle>toggle</toggle>` |
| `> quote` | `<quote>quote</quote>` |
| `---` | `<divider/>` |
| `- [ ] task` | `<todo checked="false">task</todo>` |

### Gradual Migration Strategy

1. **Start with Callouts**: Replace `> [!type]` with `<callout type="type">`
2. **Update Code Blocks**: Add language attributes to `<code>` tags
3. **Convert Complex Blocks**: Migrate images, equations, embeds
4. **Maintain Simple Content**: Keep basic lists and paragraphs as markdown
5. **Full XML Adoption**: Gradually move to complete XML formatting

This comprehensive guide ensures AI agents can leverage the full power of XML-style formatting for reliable, professional Notion content creation.