const { NotionAITool } = require('../dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('=== TESTING VISUAL NESTING STRUCTURE ===\n');

const input = `<h2>Nested List Example</h2>
<ul>
<li>Parent item
  <ul>
    <li>Child item one</li>
    <li>Child item two</li>
  </ul>
</li>
<li>Another parent item</li>
</ul>`;

console.log('Input:');
console.log(input);
console.log();

const blocks = NotionAITool.parseContentToBlocks(input);

console.log(`Generated ${blocks.length} blocks:`);
blocks.forEach((block, index) => {
  console.log(`\n${index + 1}. Block type: ${block.type}`);
  
  if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
    const listType = block.type;
    const text = block[listType]?.rich_text?.[0]?.text?.content || '';
    const hasChildren = block[listType]?.children && block[listType].children.length > 0;
    console.log(`   Text: "${text}"`);
    console.log(`   Has children: ${hasChildren}`);
    if (hasChildren) {
      console.log(`   Children count: ${block[listType].children.length}`);
    }
  } else if (block.type === 'heading_2') {
    const text = block.heading_2?.rich_text?.[0]?.text?.content || '';
    console.log(`   Text: "${text}"`);
  }
});

console.log('\n=== ANALYSIS ===');
console.log('Expected structure:');
console.log('  1. Heading: "Nested List Example"');
console.log('  2. Bulleted list item: "Parent item" WITH children');
console.log('  3. Bulleted list item: "Another parent item" WITHOUT children');
console.log('  Total: 3 blocks (parent items should contain child items as nested children)');

console.log('\nActual structure:');
const listBlocks = blocks.filter(b => b.type === 'bulleted_list_item');
console.log(`  ${listBlocks.length} list items found`);
listBlocks.forEach((block, i) => {
  const text = block.bulleted_list_item?.rich_text?.[0]?.text?.content || '';
  const hasChildren = block.bulleted_list_item?.children && block.bulleted_list_item.children.length > 0;
  console.log(`    ${i + 1}. "${text}" - Children: ${hasChildren ? 'YES' : 'NO'}`);
});

const issue = listBlocks.length > 2 || !listBlocks.some(b => 
  b.bulleted_list_item?.children && b.bulleted_list_item.children.length > 0
);

console.log(`\n${issue ? '❌ ISSUE' : '✅ CORRECT'}: ${issue ? 'Flat structure instead of nested' : 'Proper nested structure'}`);