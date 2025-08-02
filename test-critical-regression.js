const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('=== TESTING CRITICAL REGRESSION ===\n');

// Test the exact input that's failing
const testContent = `<h1>List Format Types in Notion</h1><p>This page provides examples of different list formats you can use in Notion to organize information effectively.</p><h2>Unordered List</h2><ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul><h2>Ordered List</h2><ol><li>First Step</li><li>Second Step</li><li>Third Step</li></ol><h2>Nested Lists</h2><ul><li>Main Item 1<ul><li>Sub Item 1</li><li>Sub Item 2</li></ul></li><li>Main Item 2<ol><li>Sub Step 1</li><li>Sub Step 2</li></ol></li></ul><h2>Checklist</h2><todo checked="false">Incomplete Task</todo><todo checked="true">Completed Task</todo><h2>Additional Notes</h2><callout type="info">Use lists to keep your content structured and easy to follow. Nested lists help to show hierarchy clearly.</callout>`;

console.log('Input content:');
console.log(testContent);

console.log('\n=== PROCESSING WITH parseContentToBlocks ===');
const blocks = NotionAITool.parseContentToBlocks(testContent);

console.log(`\nGenerated ${blocks.length} blocks:`);
blocks.forEach((block, index) => {
  const blockType = block.type;
  let content = '';
  
  switch (blockType) {
    case 'heading_1':
      content = `[H1] ${block.heading_1.rich_text[0].text.content}`;
      break;
    case 'heading_2':
      content = `[H2] ${block.heading_2.rich_text[0].text.content}`;
      break;
    case 'paragraph':
      content = `[P] ${block.paragraph.rich_text[0].text.content}`;
      break;
    case 'bulleted_list_item':
      content = `[UL] ${block.bulleted_list_item.rich_text[0].text.content}`;
      break;
    case 'numbered_list_item':
      content = `[OL] ${block.numbered_list_item.rich_text[0].text.content}`;
      break;
    case 'to_do':
      const checked = block.to_do.checked ? '✓' : '☐';
      content = `[TODO ${checked}] ${block.to_do.rich_text[0].text.content}`;
      break;
    case 'callout':
      content = `[CALLOUT] ${block.callout.rich_text[0].text.content}`;
      break;
    default:
      content = `[${blockType}] (content)`;
  }
  
  console.log(`  ${index + 1}. ${content}`);
});

// Focus on the nested lists section
console.log('\n=== CHECKING FOR MISSING MAIN ITEMS ===');
const listItems = blocks.filter(b => b.type === 'bulleted_list_item' || b.type === 'numbered_list_item');
const listContents = listItems.map(item => {
  const itemType = item.type;
  return item[itemType].rich_text[0].text.content;
});

console.log('All list items found:', listContents);

// Check if we have the main items
const hasMainItem1 = listContents.some(content => content.includes('Main Item 1'));
const hasMainItem2 = listContents.some(content => content.includes('Main Item 2'));

console.log(`Main Item 1 present: ${hasMainItem1}`);
console.log(`Main Item 2 present: ${hasMainItem2}`);

if (!hasMainItem1 || !hasMainItem2) {
  console.log('\n🚨 CRITICAL REGRESSION: Main list items are missing!');
} else {
  console.log('\n✅ Main list items are preserved');
}