const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('=== DEBUGGING BRANCHING EXTRACTION ===\n');

// Test the exact problematic patterns
const testPatterns = [
  {
    name: "Simple nested",
    content: `<li>Main Item 1<ul><li>Sub Item 1</li><li>Sub Item 2</li></ul></li>`
  },
  {
    name: "Mixed nested", 
    content: `<li>Main Item 2<ol><li>Sub Step 1</li><li>Sub Step 2</li></ol></li>`
  },
  {
    name: "Multiple items",
    content: `<li>Main Item 1<ul><li>Sub Item 1</li><li>Sub Item 2</li></ul></li><li>Main Item 2<ol><li>Sub Step 1</li><li>Sub Step 2</li></ol></li>`
  }
];

testPatterns.forEach((pattern, index) => {
  console.log(`🔍 TEST ${index + 1}: ${pattern.name}`);
  console.log('Input:', JSON.stringify(pattern.content));
  
  try {
    // Test the extractListItemsWithBranching function directly
    const items = NotionAITool.extractListItemsWithBranching(pattern.content);
    console.log(`Extracted ${items.length} items:`);
    
    items.forEach((item, itemIndex) => {
      console.log(`  Item ${itemIndex + 1}:`);
      console.log(`    Text: ${JSON.stringify(item.text)}`);
      console.log(`    Children: ${item.children.length}`);
      item.children.forEach((child, childIndex) => {
        console.log(`      Child ${childIndex + 1}: ${child.type} -> ${JSON.stringify(child.content.substring(0, 50))}...`);
      });
    });
    
    // Test the full processNestedList flow
    const blocks = [];
    NotionAITool.processNestedList(pattern.content, 'bulleted_list_item', blocks);
    
    console.log(`Generated ${blocks.length} blocks:`);
    blocks.forEach((block, blockIndex) => {
      const content = block.bulleted_list_item?.rich_text[0]?.text?.content || 
                     block.numbered_list_item?.rich_text[0]?.text?.content || 
                     'No content';
      console.log(`    Block ${blockIndex + 1}: ${JSON.stringify(content)}`);
    });
    
  } catch (error) {
    console.error(`Error in test ${index + 1}:`, error.message);
  }
  
  console.log('');
});

// Test the exact nested list from the failing case
console.log('🔍 FULL NESTED LIST TEST');
const fullNestedList = `<li>Main Item 1<ul><li>Sub Item 1</li><li>Sub Item 2</li></ul></li><li>Main Item 2<ol><li>Sub Step 1</li><li>Sub Step 2</li></ol></li>`;

console.log('Processing full nested list...');
const blocks = [];
NotionAITool.processNestedList(fullNestedList, 'bulleted_list_item', blocks);

console.log(`Generated ${blocks.length} blocks:`);
blocks.forEach((block, index) => {
  const listType = block.type;
  const content = block[listType].rich_text[0].text.content;
  console.log(`  ${index + 1}. [${listType}] "${content}"`);
});

// Check for our specific items
const allContent = blocks.map(b => {
  const listType = b.type;
  return b[listType].rich_text[0].text.content;
});

console.log('\nChecking for required items:');
console.log('Has "Main Item 1":', allContent.some(c => c.includes('Main Item 1') && !c.includes('Sub')));
console.log('Has "Main Item 2":', allContent.some(c => c.includes('Main Item 2') && !c.includes('Sub')));
console.log('Has "Sub Item 1":', allContent.some(c => c === 'Sub Item 1'));
console.log('Has "Sub Item 2":', allContent.some(c => c === 'Sub Item 2'));
console.log('Has "Sub Step 1":', allContent.some(c => c === 'Sub Step 1'));
console.log('Has "Sub Step 2":', allContent.some(c => c === 'Sub Step 2'));