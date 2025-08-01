# AI Agent XML Formatting Guide

## ⚡ Quick Rules

**CRITICAL**: Use `<p>` tags for standalone paragraphs, but NOT inside other XML tags.

✅ **CORRECT**: `<p>This is a paragraph with <strong>bold text</strong>.</p>`
✅ **CORRECT**: `<callout type="info">This is callout content</callout>`
❌ **WRONG**: `This is plain text without tags.`
❌ **WRONG**: `<callout type="info"><p>Content</p></callout>`

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

<blockquote>Quote text here</blockquote>

<divider/>
```

## 📋 Quick Templates

### Basic Content
```
<h1>Title</h1>
<p>Description paragraph</p>
<callout type="info">Important notice</callout>
<ul><li><p>List item description</p></li></ul>
```

### Documentation
```
<h1>Documentation Title</h1>
<p>Brief description</p>
<callout type="info">Overview</callout>
<h2>Getting Started</h2>
<callout type="warning">Prerequisites</callout>
<code language="bash">npm install package</code>
<callout type="error">Common issues</callout>
```

### Tasks & Lists
```
<h1>Project Tasks</h1>
<p>Project overview</p>
<ul>
<li><strong>Feature A:</strong> <p>Implementation completed</p></li>
</ul>
<todo checked="false">Complete feature B</todo>
<todo checked="true">Deploy to staging</todo>
<callout type="tip">Best practices</callout>
```

## 📖 Reference

**Callout Types**: `info`, `warning`, `success`, `error`, `tip`, `note`
**Languages**: `javascript`, `python`, `sql`, `bash`, `json`, `yaml`, `html`, `css`

**Must Remember**:
1. Standalone text in `<p>` tags
2. Lists: `<li><p>content</p></li>`
3. Callouts: `type` attribute (NO `<p>` inside)
4. Code: `language` attribute (NO `<p>` inside)
5. Todos: `checked` attribute (NO `<p>` inside)

**Structure**: `<h1>` → `<h2>` → `<h3>` → content blocks
**Rule**: Use `<p>` for standalone paragraphs, NOT inside XML tags