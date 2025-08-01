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
  <li>Simple list item</li>
  <li><strong>Bold item:</strong> description text</li>
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
<callout type="tip">Tip message</callout>
<callout type="note">Note message</callout>

<code language="javascript">console.log('Hello');</code>
<code language="python">print("Hello")</code>

<todo checked="false">Incomplete task</todo>
<todo checked="true">Completed task</todo>

<divider/>
```

### Advanced Blocks
```xml
<image src="https://example.com/image.jpg" alt="Description"/>
<image src="url" alt="text">Caption with formatting</image>

<equation>E = mc^2</equation>
<equation>\int_{a}^{b} x^2 dx</equation>

<embed>https://youtube.com/watch?v=abc123</embed>
<bookmark>https://github.com/example/repo</bookmark>

<toggle>Click to expand details</toggle>
```

## 📋 Quick Templates

### Basic Content
```xml
<h1>Title</h1>
<p>Description paragraph</p>
<callout type="info">Important notice</callout>
<ul><li>List item</li></ul>
```

### Documentation
```xml
<h1>Documentation Title</h1>
<p>Brief description</p>
<callout type="info">Overview</callout>
<h2>Getting Started</h2>
<callout type="warning">Prerequisites</callout>
<code language="bash">npm install package</code>
<callout type="error">Common issues</callout>
```

### Tasks & Lists
```xml
<h1>Project Tasks</h1>
<p>Project overview</p>
<ul>
<li><strong>Feature A:</strong> Implementation completed</li>
</ul>
<todo checked="false">Complete feature B</todo>
<todo checked="true">Deploy to staging</todo>
<callout type="tip">Best practices</callout>
```

### Technical Content
```xml
<h1>API Guide</h1>
<p>Integration instructions</p>
<h2>Authentication</h2>
<callout type="warning">Store keys securely</callout>
<code language="javascript">
const apiKey = process.env.API_KEY;
const response = await fetch('/api/data');
</code>
<h2>Examples</h2>
<image src="https://example.com/diagram.png" alt="API Flow"/>
<bookmark>https://docs.example.com/api</bookmark>
```

## 📖 Reference

**All Block Types**:
- Text: `<p>`, `<h1>`, `<h2>`, `<h3>`, `<blockquote>`
- Lists: `<ul><li>`, `<ol><li>`
- Callouts: `<callout type="info|warning|success|error|tip|note">`
- Code: `<code language="javascript|python|sql|bash|json|yaml">`
- Tasks: `<todo checked="true|false">`
- Media: `<image src="url" alt="text">`, `<embed>`, `<bookmark>`
- Math: `<equation>LaTeX formula</equation>`
- Layout: `<divider/>`, `<toggle>expandable content</toggle>`

**Formatting Rules**:
1. Standalone text in `<p>` tags
2. Lists: `<li>content</li>` (NO `<p>` inside)
3. Callouts: `type` attribute (NO `<p>` inside)
4. Code: `language` attribute (NO `<p>` inside)
5. Todos: `checked` attribute (NO `<p>` inside)

**Inline Formatting**: Use `<strong>`, `<em>`, `<code>`, `<a href="">` inside text content
**Structure**: `<h1>` → `<h2>` → `<h3>` → content blocks
**Rule**: Use `<p>` for standalone paragraphs, NOT inside XML tags