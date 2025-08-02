const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('=== TESTING FULL XML PROCESSING PIPELINE ===\n');

const content = '<ul><li>Main Item 1<ul><li>Sub Item 1</li><li>Sub Item 2</li></ul></li><li>Main Item 2<ol><li>Sub Step 1</li><li>Sub Step 2</li></ol></li></ul>';

console.log('Input content:');
console.log(content);
console.log();

const blocks = [];

console.log('=== CALLING processXmlTags ===');
const processedContent = NotionAITool.processXmlTags(content, blocks);

console.log('\n=== RESULTS ===');
console.log(`Generated ${blocks.length} blocks:`);
blocks.forEach((block, index) => {
  const type = block.type;
  let text = '';
  if (block[type] && block[type].rich_text && block[type].rich_text[0]) {
    text = block[type].rich_text[0].text?.content || block[type].rich_text[0].plain_text || 'No text content';
  }
  console.log(`  ${index + 1}. [${type}] "${text}"`);
});

console.log('\nProcessed content:');
console.log(`"${processedContent}"`);

console.log('\n=== EXPECTED vs ACTUAL ===');
const expected = ['Main Item 1', 'Sub Item 1', 'Sub Item 2', 'Main Item 2', 'Sub Step 1', 'Sub Step 2'];
const actual = blocks.map(block => {
  const type = block.type;
  if (block[type] && block[type].rich_text && block[type].rich_text[0]) {
    return block[type].rich_text[0].text?.content || block[type].rich_text[0].plain_text || '';
  }
  return '';
});

console.log('Expected:', expected);
console.log('Actual:  ', actual);

expected.forEach(item => {
  const found = actual.includes(item);
  console.log(`"${item}": ${found ? '✅' : '❌'} ${found ? 'Found' : 'Missing'}`);
});

// Check for XML fragments
const hasXmlFragments = actual.some(item => /<[^>]*>/.test(item));
console.log(`\nXML fragments present: ${hasXmlFragments ? '❌ Yes' : '✅ No'}`);
if (hasXmlFragments) {
  actual.forEach((item, index) => {
    if (/<[^>]*>/.test(item)) {
      console.log(`  Block ${index + 1} has XML: "${item}"`);
    }
  });
}