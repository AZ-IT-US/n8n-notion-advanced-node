const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('=== TESTING extractListItemsWithBranching ONLY ===\n');

// Test the exact failing case
const content = '<ul><li>Main Item 1<ul><li>Sub Item 1</li><li>Sub Item 2</li></ul></li><li>Main Item 2<ol><li>Sub Step 1</li><li>Sub Step 2</li></ol></li></ul>';

console.log('Input content:');
console.log(content);
console.log('\n=== EXTRACTING LIST ITEMS ===');

// Strip outer ul tags to get the li content
const innerContent = content.replace(/^<ul[^>]*>/, '').replace(/<\/ul>$/, '');
console.log('Inner content after stripping <ul></ul>:');
console.log(innerContent);

console.log('\n=== CALLING extractListItemsWithBranching ===');
const items = NotionAITool.extractListItemsWithBranching(innerContent);

console.log(`\nExtracted ${items.length} items:`);
items.forEach((item, index) => {
  console.log(`  ${index + 1}. Text: "${item.text}"`);
  console.log(`     Children: ${item.children.length}`);
  item.children.forEach((child, childIndex) => {
    console.log(`       ${childIndex + 1}. Type: ${child.type}, Content: "${child.content}"`);
  });
});

console.log('\n=== ANALYSIS ===');
console.log('Expected:');
console.log('  Item 1: text="Main Item 1", children=[{type:"ul", content:"<li>Sub Item 1</li><li>Sub Item 2</li>"}]');
console.log('  Item 2: text="Main Item 2", children=[{type:"ol", content:"<li>Sub Step 1</li><li>Sub Step 2</li>"}]');

console.log('\nActual:');
items.forEach((item, index) => {
  console.log(`  Item ${index + 1}: text="${item.text}", children=${JSON.stringify(item.children)}`);
});