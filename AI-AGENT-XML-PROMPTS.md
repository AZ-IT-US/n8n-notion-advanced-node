# AI Agent XML Formatting Guide

## ⚡ Quick Rules

**CRITICAL**: Always wrap text in `<p>` tags. Never use plain text without HTML tags.

✅ **CORRECT**: `<p>This is a paragraph with <strong>bold text</strong>.</p>`  
❌ **WRONG**: `This is plain text without tags.`

## 🏷️ Essential Tags

### Text Content
```xml
<p>Paragraph text with <strong>bold</strong> and <em>italic</em></p>
<h1>Main Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>
<blockquote>Quote text here</blockquote>
```

### Lists
```xml
<ul>
  <li><strong>Bold item:</strong> <p>Description in paragraph</p></li>
  <li><em>Italic item:</em> <p>Another description</p></li>
</ul>

<ol>
  <li>First numbered item</li>
  <li>Second numbered item</li>
</ol>
```

### Special Blocks
```xml
<callout type="info">Information message</callout>
<callout type="warning">Warning message</callout>
<callout type="success">Success message</callout>
<callout type="error">Error message</callout>

<code language="javascript">console.log('Hello');</code>
<code language="python">print("Hello")</code>

<todo checked="false">Incomplete task</todo>
<todo checked="true">Completed task</todo>

<divider/>
```

## 📋 AI Agent Templates

### Template 1: Basic Content
```
Create content using these rules:
- Wrap ALL text in <p> tags
- Use <h1>, <h2>, <h3> for headings
- Use <ul><li> for lists
- Use <callout type="info|warning|success|error"> for notices
- Use <code language="..."> for code
- Use <todo checked="true|false"> for tasks

Example structure:
<h1>Title</h1>
<p>Description paragraph</p>
<callout type="info">Important notice</callout>
<ul>
<li><p>List item description</p></li>
</ul>
```

### Template 2: Documentation
```
Generate documentation with this structure:

<h1>Documentation Title</h1>
<p>Brief description of the topic</p>
<callout type="info">Overview and purpose</callout>

<h2>Getting Started</h2>
<p>Introduction paragraph</p>
<callout type="warning">Prerequisites or requirements</callout>

<h3>Installation</h3>
<code language="bash">npm install package-name</code>

<h3>Basic Usage</h3>
<code language="javascript">
const example = require('package');
example.run();
</code>

<h2>Examples</h2>
<p>Practical examples and use cases</p>

<h2>Troubleshooting</h2>
<callout type="error">Common issues and solutions</callout>

REQUIREMENTS:
- Use <p> for ALL explanatory text
- Use appropriate callout types
- Include language in code blocks
- Structure with clear headings
```

### Template 3: Lists & Tasks
```
For content with lists and tasks:

<h1>Project Tasks</h1>
<p>Project overview and description</p>

<h2>Completed Items</h2>
<ul>
<li><strong>Feature A:</strong> <p>Implementation completed</p></li>
<li><strong>Testing:</strong> <p>All tests passing</p></li>
</ul>

<h2>Action Items</h2>
<todo checked="false">Complete feature B implementation</todo>
<todo checked="false">Update documentation</todo>
<todo checked="true">Deploy to staging</todo>

<h2>Notes</h2>
<callout type="tip">Best practices and recommendations</callout>

CRITICAL RULES:
- Always use <p> inside <li> for descriptions
- Use <strong> and <em> for emphasis in lists
- Use appropriate callout types
- Use checked="true|false" for todos
```

## 🎯 Callout Types

| Type | Use For |
|------|---------|
| `info` | General information, overviews |
| `warning` | Cautions, prerequisites |
| `success` | Achievements, confirmations |
| `error` | Problems, failures |
| `tip` | Best practices, advice |
| `note` | Additional information |

## 💻 Code Languages

Common values for `language` attribute:
- `javascript`, `python`, `sql`, `bash`, `json`, `yaml`, `html`, `css`, `typescript`

## ⚠️ Common Mistakes

❌ **DON'T**:
```xml
Plain text without tags
<li>List item without paragraph tags</li>
<callout>Missing type attribute</callout>
<code>Missing language attribute</code>
```

✅ **DO**:
```xml
<p>Text wrapped in paragraph tags</p>
<li><p>List item with paragraph tags</p></li>
<callout type="info">Callout with type</callout>
<code language="javascript">Code with language</code>
```

## 🚀 Quick Examples

### Simple Page
```xml
<h1>Welcome Guide</h1>
<p>This guide covers the essential features.</p>
<callout type="info">Start here for basic setup</callout>

<h2>First Steps</h2>
<ul>
<li><p>Install the software</p></li>
<li><p>Configure your settings</p></li>
<li><p>Run your first test</p></li>
</ul>

<h2>Next Steps</h2>
<todo checked="false">Complete advanced configuration</todo>
<todo checked="false">Explore additional features</todo>
```

### Technical Content
```xml
<h1>API Integration</h1>
<p>Learn how to integrate with our API</p>

<h2>Authentication</h2>
<callout type="warning">Store API keys securely</callout>

<code language="javascript">
const apiKey = process.env.API_KEY;
const response = await fetch('/api/data', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
</code>

<h2>Error Handling</h2>
<callout type="error">Always handle 401 and 429 status codes</callout>
```

## 📖 Reference Card

**Must Remember**:
1. All text in `<p>` tags
2. Lists need `<li><p>content</p></li>`
3. Callouts need `type` attribute
4. Code needs `language` attribute
5. Todos need `checked` attribute

**Structure**: `<h1>` → `<h2>` → `<h3>` → content blocks

**Safety**: When in doubt, wrap in `<p>` tags