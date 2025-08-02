const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

// Test with a simple nested list to debug the issue
const simpleNestedList = `<ul>
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
</li>
</ul>`;

console.log('=== DEBUGGING DETAILED LIST PROCESSING ===');
console.log('Simple nested list input:');
console.log(simpleNestedList);

// Test the processNestedList function directly
const blocks = [];

console.log('\n=== TESTING processNestedList DIRECTLY ===');

// Extract the content that would be passed to processNestedList
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

console.log('List content to be processed:');
console.log(JSON.stringify(listContent));

try {
  // Call processNestedList directly
  NotionAITool.processNestedList(listContent, 'bulleted_list_item', blocks);
  
  console.log(`\nGenerated ${blocks.length} blocks:`);
  blocks.forEach((block, index) => {
    console.log(`Block ${index + 1}:`, JSON.stringify(block, null, 2));
  });
} catch (error) {
  console.error('Error in processNestedList:', error);
}

// Test individual list item processing
console.log('\n=== TESTING INDIVIDUAL LIST ITEM ===');
const singleItemContent = `Fruits
  <ul>
  <li>Apple</li>
  <li>Banana</li>
  </ul>`;

console.log('Single item content:');
console.log(JSON.stringify(singleItemContent));

// Test nested list detection
const hasNestedList = /<[uo]l\s*[^>]*>/i.test(singleItemContent);
console.log('Has nested list:', hasNestedList);

// Test splitting
const parts = singleItemContent.split(/(<[uo]l\s*[^>]*>[\s\S]*?<\/[uo]l>)/gi);
console.log('Split parts:', parts.map(p => JSON.stringify(p)));

// Test the processNestedHtmlInListItem function
console.log('\n=== TESTING processNestedHtmlInListItem ===');
const testContent = "Fruits\n  <ul>\n  <li>Apple</li>\n  </ul>";
const cleaned = NotionAITool.processNestedHtmlInListItem(testContent);
console.log('Input:', JSON.stringify(testContent));
console.log('Cleaned:', JSON.stringify(cleaned));