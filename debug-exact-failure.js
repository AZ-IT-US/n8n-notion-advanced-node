const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('=== DEBUGGING EXACT FAILURE CASE ===\n');

// Extract just the nested lists section that's failing
const nestedListsSection = `<ul><li>Main Item 1<ul><li>Sub Item 1</li><li>Sub Item 2</li></ul></li><li>Main Item 2<ol><li>Sub Step 1</li><li>Sub Step 2</li></ol></li></ul>`;

console.log('Input nested lists section:');
console.log(nestedListsSection);

console.log('\n=== PROCESSING THROUGH parseContentToBlocks ===');
const blocks = NotionAITool.parseContentToBlocks(nestedListsSection);

console.log(`Generated ${blocks.length} blocks:`);
blocks.forEach((block, index) => {
  const content = block.bulleted_list_item?.rich_text[0]?.text?.content || 
                 block.numbered_list_item?.rich_text[0]?.text?.content ||
                 'No content';
  const type = block.type;
  console.log(`  ${index + 1}. [${type}] "${content}"`);
});

// Check what we should have vs what we got
const expectedItems = ['Main Item 1', 'Sub Item 1', 'Sub Item 2', 'Main Item 2', 'Sub Step 1', 'Sub Step 2'];
const actualItems = blocks.map(b => {
  const type = b.type;
  return b[type].rich_text[0].text.content;
});

console.log('\n=== COMPARISON ===');
console.log('Expected items:', expectedItems);
console.log('Actual items:', actualItems);

expectedItems.forEach(expected => {
  const found = actualItems.some(actual => actual === expected);
  console.log(`"${expected}": ${found ? '✅ Found' : '❌ Missing'}`);
});

// Check for XML fragments
const hasXmlFragments = actualItems.some(item => /<[^>]*>/.test(item));
console.log(`\nXML fragments present: ${hasXmlFragments ? '❌ Yes' : '✅ No'}`);

if (hasXmlFragments) {
  actualItems.forEach((item, index) => {
    if (/<[^>]*>/.test(item)) {
      console.log(`  Block ${index + 1} has XML: "${item}"`);
    }
  });
}