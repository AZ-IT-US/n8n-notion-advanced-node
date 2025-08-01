# Complete AI Agent Prompt for Notion Advanced Tool

## 🎯 **Universal Prompt for All Situations**

Use this comprehensive prompt when instructing AI agents to work with the Notion AI Tool. This prompt applies to all operations: creating pages, adding content, or any content formatting task.

---

## 📋 **Complete Block Types Reference**

```
When working with Notion content, you can create the following block types using this EXACT syntax:

**1. HEADINGS (3 levels):**
# Main Heading (creates heading_1 block)
## Section Heading (creates heading_2 block)  
### Subsection Heading (creates heading_3 block)

**2. TEXT FORMATTING in paragraphs:**
**Bold Text** (bold annotation)
*Italic Text* (italic annotation)
***Bold Italic Text*** (both annotations)
~~Strikethrough Text~~ (strikethrough annotation)
`Inline Code` (code annotation)
[Link Text](https://example.com) (clickable link)

**3. LISTS:**
- [ ] Incomplete task (creates to_do block, unchecked)
- [x] Completed task (creates to_do block, checked)
* [ ] Alternative todo syntax (creates to_do block, unchecked)
* [x] Alternative completed task (creates to_do block, checked)
- Bullet point (creates bulleted_list_item block)
* Alternative bullet syntax (creates bulleted_list_item block)
1. First numbered item (creates numbered_list_item block)
2. Second numbered item (creates numbered_list_item block)

**4. QUOTES:**
> This is a quote block (creates quote block)
> Multi-line quotes work too

**5. CALLOUTS (8 types with different colors/icons):**
> [!info] Information callout (blue, ℹ️ icon)
> [!warning] Warning callout (yellow, ⚠️ icon)
> [!danger] Danger callout (red, 🚨 icon)
> [!error] Error callout (red, ❌ icon)
> [!note] Note callout (gray, 📝 icon)
> [!tip] Tip callout (green, 💡 icon)
> [!success] Success callout (green, ✅ icon)
> [!question] Question callout (purple, ❓ icon)

**6. CODE BLOCKS:**
```javascript
function example() {
    return "Code block with syntax highlighting";
}
```

**7. MATHEMATICAL EQUATIONS:**
$$E = mc^2$$ (creates equation block)
$$\sum_{i=1}^{n} x_i$$ (supports LaTeX syntax)

**8. VISUAL ELEMENTS:**
![Image description](https://image-url.com/image.jpg) (creates image block)
---
(creates divider block - requires 3+ dashes or asterisks)
***
(alternative divider syntax - requires 3+ asterisks)

**9. INTERACTIVE BLOCKS:**
▶ Toggle title (creates toggle block - collapsible)
<details>Alternative toggle syntax</details> (creates toggle block)
<details>Simple toggle (creates toggle block with just opening tag)

**10. MEDIA & LINKS:**
https://youtube.com/watch?v=abc123 (creates embed block)
https://youtu.be/abc123 (creates embed block)
https://vimeo.com/123456789 (creates embed block)
https://twitch.tv/videos/123456 (creates embed block)
https://loom.com/share/abc123 (creates embed block)
https://figma.com/file/abc123 (creates embed block)
https://miro.com/app/board/abc123 (creates embed block)
https://codepen.io/user/pen/abc123 (creates embed block)
https://docs.example.com (creates bookmark block for non-embeddable URLs)

**11. TABLES:**
| Column 1 | Column 2 | Column 3 | (creates table representation)
| Cell A1  | Cell B1  | Cell C1  | (each row processed)

**12. PARAGRAPHS:**
Regular text becomes paragraph blocks with rich text formatting support.

**CRITICAL FORMATTING RULES:**
- Each block type must be on its own line
- Separate different content blocks with blank lines
- URLs must be standalone (no surrounding text) to become embeds/bookmarks
- Callout types: info, warning, danger, error, note, tip, success, question
- Use 3+ dashes (---) or asterisks (***) for dividers
- Code blocks need language specified after opening ```
- Flexible spacing allowed for lists and callouts
- Both `- [ ]` and `* [ ]` work for todo items

**EXAMPLE WITH ALL BLOCK TYPES:**
# Project Documentation

> [!info] This demonstrates all available Notion block types

## Overview
This is a **bold** paragraph with *italic* text and `inline code`.

### Task Progress
- [x] Research completed
- [x] Design finalized  
- [ ] Development in progress
- [ ] Testing pending

## Key Information
> Important quote: "Quality is not an act, it is a habit."

### Technical Details
```python
def calculate_progress():
    completed = 3
    total = 5
    return (completed / total) * 100
```

## Mathematical Formula
$$Progress = \frac{Completed Tasks}{Total Tasks} \times 100$$

---

## Resources
Project repository: https://github.com/example/project
Demo video: https://youtube.com/watch?v=example123

▶ Additional Configuration
Click to expand for advanced settings and configurations.

![Architecture Diagram](https://example.com/diagram.png)

> [!warning] Remember to test all features before deployment

| Feature | Status | Priority |
| Auth | Complete | High |
| UI | In Progress | Medium |

Always format content using these exact patterns for proper Notion block creation.
```

---

## 🚀 **Implementation Guide**

### **For AI Agent System Prompts:**
Copy the complete block reference above into your AI agent's system prompt. This ensures the agent knows all available formatting options.

### **For n8n Workflows:**
Use this prompt in any workflow where AI agents create Notion content. The comprehensive format list guarantees proper block creation.

### **For Dynamic Content:**
Whether creating meeting notes, project updates, documentation, or reports, this universal format covers all possibilities.

---

## ✅ **Why This Complete Reference Works**

- **Exhaustive Coverage**: Lists every supported Notion block type
- **Exact Syntax**: Shows precise formatting requirements
- **Visual Examples**: Demonstrates correct usage patterns
- **Error Prevention**: Clear rules prevent common formatting mistakes
- **Reliable Results**: Tested syntax that works with parseContentToBlocks function

---

## 🔧 **Troubleshooting Guide**

### **Text Formatting Issues:**
- Ensure markdown syntax is exact: `**bold**`, `*italic*`, `` `code` ``
- Links: `[text](url)` - both text and URL required
- Strikethrough: `~~text~~` - requires double tildes
- Use proper spacing around formatting markers

### **Block Creation Problems:**
- Callouts: Use `> [!type]` format (flexible spacing after > allowed)
- Ensure blank lines separate different content blocks
- URLs must be standalone for proper embed/bookmark creation
- Code blocks: Use triple backticks (```) on separate lines with language
- Equations: Use double dollar signs: `$$equation$$`
- Dividers: Require 3+ dashes (---) or asterisks (***)

### **List and Task Issues:**
- To-do items: `- [ ]` / `- [x]` or `* [ ]` / `* [x]` (flexible spacing)
- Regular lists: `- item` or `* item` (flexible spacing after marker)
- Numbered lists: `1. item`, `2. item`, etc. (flexible spacing after number)

### **Callout Problems:**
- Supported types: info, warning, danger, error, note, tip, success, question
- Format: `> [!type] content` (flexible spacing after > allowed)
- Content follows immediately after the type declaration
- Case insensitive: `[!INFO]` and `[!info]` both work

---

*This complete reference ensures AI agents can create any supported Notion block type with perfect formatting.*