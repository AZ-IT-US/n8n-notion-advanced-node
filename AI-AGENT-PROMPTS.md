# AI Agent Prompts for Notion Advanced Tool

## Using the "Add Content to Page" Function

When using the Notion AI Tool to add content to existing pages, follow these formatting guidelines to ensure proper block creation in Notion.

### ✅ Supported Content Formatting

The AI Tool parses content using markdown-like syntax. Here are the supported formats:

#### **Headings**
```
# Main Heading (H1)
## Section Heading (H2)
### Subsection Heading (H3)
```

#### **To-Do Lists**
```
- [ ] Incomplete task
- [x] Completed task
- [ ] Another task to do
```

#### **Bullet Lists**
```
- First bullet point
- Second bullet point
- Third bullet point
```

#### **Numbered Lists**
```
1. First numbered item
2. Second numbered item
3. Third numbered item
```

#### **Quotes**
```
> This is a quote block
> Multi-line quotes work too
```

#### **Code Blocks**
```
```javascript
function example() {
    return "Code blocks preserve formatting";
}
```
```

#### **Callout Blocks**
```
> [!info] Information callout with blue styling
> [!warning] Warning callout with yellow styling
> [!danger] Danger callout with red styling
> [!note] Note callout with gray styling
> [!tip] Tip callout with green styling
> [!success] Success callout with green styling
```

#### **Dividers**
```
---
or
***
```

#### **Images**
```
![Alt text description](https://example.com/image.jpg)
```

#### **Equations**
```
$$E = mc^2$$
$$\sum_{i=1}^{n} x_i$$
```

#### **Bookmarks**
```
https://example.com/article
```

#### **Toggle Blocks**
```
▶ Toggle title with collapsible content
or
<details>Toggle title</details>
```

#### **Tables** (Basic Support)
```
| Column 1 | Column 2 | Column 3 |
| Cell A1  | Cell B1  | Cell C1  |
```

#### **Regular Paragraphs**
```
This is a regular paragraph.

This is another paragraph separated by a blank line.
```

---

## 🤖 **AI Agent Prompt Template**

Use this prompt template when instructing AI agents to add content to Notion pages:

```
When adding content to the Notion page, format your content using the following syntax:

**For headings:** Use # for main headings, ## for sections, ### for subsections
**For tasks:** Use - [ ] for incomplete tasks, - [x] for completed tasks
**For lists:** Use - for bullet points, or 1. 2. 3. for numbered lists
**For quotes:** Use > at the start of lines for quote blocks
**For code:** Use triple backticks ``` to wrap code blocks
**For callouts:** Use > [!type] for special callouts (info, warning, danger, note, tip, success)
**For dividers:** Use --- or *** for horizontal rules
**For images:** Use ![alt text](url) for images
**For equations:** Use $$equation$$ for mathematical expressions
**For bookmarks:** Use standalone URLs for bookmark blocks
**For toggles:** Use ▶ title or <details>title</details> for collapsible content
**For paragraphs:** Separate paragraphs with blank lines

Example formatted content:
# Project Update

> [!info] This is the weekly project status report

## Completed Tasks
- [x] Research phase completed
- [x] Initial design approved
- [ ] Development in progress

## Key Insights
> The user feedback was overwhelmingly positive about the new interface design.

---

## Technical Implementation
```javascript
const projectStatus = {
    phase: "development",
    completion: "65%"
};
```

## Mathematical Formula
$$Progress = \frac{Completed Tasks}{Total Tasks} \times 100$$

## Next Steps
1. Finalize development
2. Conduct user testing
3. Prepare for launch

▶ Additional Resources
Reference documentation: https://docs.example.com

Please format all content this way before adding it to the Notion page.
```

---

## 📝 **Example AI Prompt for Content Addition**

```
Add the following content to the Notion page with proper formatting:

# Weekly Report - January 2025

> [!info] Weekly project status update for development team

## Summary
This week we made significant progress on the project roadmap.

## Accomplishments
- [x] Completed user research interviews
- [x] Finalized design mockups
- [x] Set up development environment
- [ ] Begin core feature development

## Key Findings
> Users prefer a more minimalist interface with cleaner navigation.

---

## Technical Notes
```javascript
// New authentication flow
const authenticateUser = (credentials) => {
    return validateCredentials(credentials);
};
```

## Performance Metrics
$$Efficiency = \frac{Tasks Completed}{Total Planned Tasks} \times 100$$

Current efficiency: 75%

## Screenshots
![UI Mockup](https://example.com/mockup-screenshot.png)

## Reference Materials
https://docs.example.com/project-guidelines

▶ Detailed Technical Specifications
Additional technical details are available in the project documentation.

> [!warning] Important deadline reminder: Final review is scheduled for next Friday

## Next Week Goals
1. Start core development
2. Create initial prototypes
3. Schedule stakeholder review

Please add this content to the specified Notion page using the proper block formatting.
```

---

## ⚠️ **Important Notes**

1. **Line Breaks Matter**: Each content block should be on its own line
2. **Spacing**: Use blank lines to separate different content sections
3. **Consistency**: Stick to the exact syntax shown above for proper parsing
4. **Mixed Content**: You can combine different block types in a single content addition

## 🔧 **Troubleshooting**

If content isn't formatting properly:
- Check for proper spacing between sections
- Ensure to-do items use exactly `- [ ]` and `- [x]` syntax
- Verify code blocks use triple backticks on separate lines
- Make sure headings have proper # spacing
- For callouts, ensure exact syntax: `> [!type] content`
- For equations, use proper double dollar signs: `$$equation$$`
- For images, verify URL format: `![alt text](valid-url)`
- For dividers, use at least 3 dashes `---` or asterisks `***`
- For bookmarks, ensure URL is standalone on its own line
- For toggles, use exact syntax: `▶ title` or `<details>title</details>`

---

*This guide ensures AI agents will properly format content for the Notion Advanced Tool's parseContentToBlocks function.*