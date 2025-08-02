const { NotionAITool } = require('../dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('=== DEBUGGING SPLIT ISSUE ===');

// Test the exact splitting logic that's causing the problem
const itemContent = `Fruits
  <ul>
  <li>Apple</li>
  <li>Banana</li>
  </ul>`;

console.log('Original item content:');
console.log(JSON.stringify(itemContent));

// Test the regex split
const parts = itemContent.split(/(<[uo]l\s*[^>]*>[\s\S]*?<\/[uo]l>)/gi);
console.log('\nSplit parts:');
parts.forEach((part, index) => {
  console.log(`Part ${index}:`, JSON.stringify(part));
});

// Test each part processing
console.log('\nProcessing each part:');
const blocks = [];
for (let i = 0; i < parts.length; i++) {
  const part = parts[i].trim();
  if (!part) continue;
  
  console.log(`\n--- Processing part ${i}: ${JSON.stringify(part)} ---`);
  
  // Check if this part is a nested list
  const isNestedList = /<[uo]l\s*[^>]*>[\s\S]*?<\/[uo]l>/gi.test(part);
  console.log('Is nested list:', isNestedList);
  
  if (isNestedList) {
    console.log('Processing as nested list...');
    // Extract nested list content
    const nestedListMatch = part.match(/<([uo]l)\s*[^>]*>([\s\S]*?)<\/\1>/i);
    if (nestedListMatch) {
      const [, listTag, innerContent] = nestedListMatch;
      console.log('List tag:', listTag);
      console.log('Inner content:', JSON.stringify(innerContent));
      
      // Process inner content
      const nestedListType = listTag === 'ul' ? 'bulleted_list_item' : 'numbered_list_item';
      console.log('Recursively processing nested list as', nestedListType);
      NotionAITool.processNestedList(innerContent, nestedListType, blocks);
    }
  } else {
    console.log('Processing as text content...');
    const cleanContent = NotionAITool.processNestedHtmlInListItem(part);
    console.log('Cleaned content:', JSON.stringify(cleanContent));
    if (cleanContent) {
      const block = {
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: NotionAITool.parseBasicMarkdown(cleanContent),
        },
      };
      blocks.push(block);
      console.log('Added block for:', cleanContent);
    }
  }
}

console.log(`\nFinal blocks generated: ${blocks.length}`);
blocks.forEach((block, index) => {
  const content = block.bulleted_list_item.rich_text[0].text.content;
  console.log(`Block ${index + 1}: "${content}"`);
});