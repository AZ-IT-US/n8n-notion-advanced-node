const { NotionAITool } = require('../dist/nodes/NotionAdvanced/NotionAITool.node.js');

// Test the exact content from the screenshot
const testContent = `<h1>Notion Complex List Examples</h1>
<p>This page showcases examples of complex lists in Notion using legal and supported XML formatting.</p>
<h2>Nested Lists</h2>
<ul>
<li>Fruits
  <ul>
  <li>Apple</li>
  <li>Banana</li>
  <li>Citrus
    <ul>
    <li>Orange</li>
    <li>Lemon</li>
    <li>Lime</li>
    </ul>
  </li>
  </ul>
</li>
<li>Vegetables
  <ul>
  <li>Carrot</li>
  <li>Broccoli</li>
  <li>Spinach</li>
  </ul>
</li>
</ul>`;

console.log('=== DEBUGGING LIST PROCESSING ===');
console.log('Input content:');
console.log(testContent);
console.log('\n=== PROCESSING ===');

try {
  const blocks = NotionAITool.parseContentToBlocks(testContent);
  
  console.log(`\nGenerated ${blocks.length} blocks:`);
  blocks.forEach((block, index) => {
    console.log(`Block ${index + 1}:`, JSON.stringify(block, null, 2));
  });
  
  // Also test just the list part
  console.log('\n=== TESTING JUST THE LIST ===');
  const listContent = `<ul>
<li>Fruits
  <ul>
  <li>Apple</li>
  <li>Banana</li>
  </ul>
</li>
<li>Vegetables
  <ul>
  <li>Carrot</li>
  <li>Broccoli</li>
  </ul>
</li>
</ul>`;

  const listBlocks = NotionAITool.parseContentToBlocks(listContent);
  console.log(`\nList generated ${listBlocks.length} blocks:`);
  listBlocks.forEach((block, index) => {
    console.log(`List Block ${index + 1}:`, JSON.stringify(block, null, 2));
  });

} catch (error) {
  console.error('Error during processing:', error);
}