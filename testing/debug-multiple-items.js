const { NotionAITool } = require('../dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('=== DEBUGGING MULTIPLE ITEMS PROCESSING ===');

// This is the exact content from debug-detailed-list.js
const listContent = `
<li>Fruits
  <ul>
  <li>Apple</li>
  <li>Banana</li>
  </ul>
</li>
<li>Vegetables
  <ul>
  <li>Carrot</li>
  </ul>
</li>`;

console.log('Full list content:');
console.log(JSON.stringify(listContent));

// Test the actual processNestedList function call that's happening
const blocks = [];
console.log('\n=== CALLING processNestedList ===');
NotionAITool.processNestedList(listContent, 'bulleted_list_item', blocks);

console.log(`\nGenerated ${blocks.length} blocks:`);
blocks.forEach((block, index) => {
  const content = block.bulleted_list_item.rich_text[0].text.content;
  console.log(`Block ${index + 1}: "${content}"`);
});

// Let's trace through the regex matching
console.log('\n=== TRACING REGEX MATCHES ===');
const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
let match;
let matchIndex = 0;

while ((match = liRegex.exec(listContent)) !== null) {
  matchIndex++;
  console.log(`\nMatch ${matchIndex}:`);
  console.log('Full match:', JSON.stringify(match[0]));
  console.log('Captured content:', JSON.stringify(match[1]));
  
  const itemContent = match[1].trim();
  console.log('Trimmed content:', JSON.stringify(itemContent));
  
  // Check if it has nested lists
  const hasNestedList = /<[uo]l\s*[^>]*>/i.test(itemContent);
  console.log('Has nested list:', hasNestedList);
  
  if (hasNestedList) {
    console.log('Processing nested item...');
    const parts = itemContent.split(/(<[uo]l\s*[^>]*>[\s\S]*?<\/[uo]l>)/gi);
    console.log('Split into parts:', parts.map(p => JSON.stringify(p)));
  }
}