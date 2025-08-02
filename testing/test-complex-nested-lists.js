const { NotionAITool } = require('../dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('=== COMPREHENSIVE COMPLEX NESTED LIST TEST ===\n');

// Test 1: Deep nesting (3 levels)
console.log('🔸 TEST 1: Deep Nesting (3 levels)');
const deepNested = `<ul>
<li>Level 1: Main Category
  <ul>
  <li>Level 2: Subcategory A
    <ul>
    <li>Level 3: Item A1</li>
    <li>Level 3: Item A2</li>
    </ul>
  </li>
  <li>Level 2: Subcategory B
    <ul>
    <li>Level 3: Item B1</li>
    </ul>
  </li>
  </ul>
</li>
<li>Level 1: Another Category</li>
</ul>`;

const blocks1 = NotionAITool.parseContentToBlocks(deepNested);
console.log(`Generated ${blocks1.length} blocks:`);
blocks1.forEach((block, index) => {
  if (block.type === 'bulleted_list_item') {
    const content = block.bulleted_list_item.rich_text[0].text.content;
    console.log(`  ${index + 1}. "${content}"`);
  }
});

// Test 2: Mixed numbered and bulleted lists
console.log('\n🔸 TEST 2: Mixed Numbered and Bulleted Lists');
const mixedLists = `<ol>
<li>First step: Preparation
  <ul>
  <li>Gather ingredients</li>
  <li>Prepare workspace</li>
  </ul>
</li>
<li>Second step: Cooking
  <ul>
  <li>Heat the pan</li>
  <li>Add ingredients</li>
  </ul>
</li>
</ol>`;

const blocks2 = NotionAITool.parseContentToBlocks(mixedLists);
console.log(`Generated ${blocks2.length} blocks:`);
blocks2.forEach((block, index) => {
  const listType = block.type;
  const content = block[listType].rich_text[0].text.content;
  console.log(`  ${index + 1}. [${listType}] "${content}"`);
});

// Test 3: Lists with complex HTML content
console.log('\n🔸 TEST 3: Lists with Complex HTML Content');
const complexContent = `<ul>
<li><strong>Bold Item</strong>: Description with <em>italic</em> text
  <ul>
  <li>Nested item with <code>code</code></li>
  <li>Another nested item</li>
  </ul>
</li>
<li>Simple item</li>
<li>Item with <a href="https://example.com">link</a></li>
</ul>`;

const blocks3 = NotionAITool.parseContentToBlocks(complexContent);
console.log(`Generated ${blocks3.length} blocks:`);
blocks3.forEach((block, index) => {
  if (block.type === 'bulleted_list_item') {
    const richText = block.bulleted_list_item.rich_text;
    const content = richText.map(rt => rt.text.content).join('');
    console.log(`  ${index + 1}. "${content}"`);
  }
});

// Test 4: Edge cases
console.log('\n🔸 TEST 4: Edge Cases');

// Empty nested list
const emptyNested = `<ul>
<li>Item with empty nested list
  <ul>
  </ul>
</li>
<li>Normal item</li>
</ul>`;

const blocks4a = NotionAITool.parseContentToBlocks(emptyNested);
console.log(`Empty nested list: ${blocks4a.length} blocks`);
blocks4a.forEach((block, index) => {
  if (block.type === 'bulleted_list_item') {
    const content = block.bulleted_list_item.rich_text[0].text.content;
    console.log(`  ${index + 1}. "${content}"`);
  }
});

// Single item with nesting
const singleNested = `<ul>
<li>Only item
  <ul>
  <li>Single nested</li>
  </ul>
</li>
</ul>`;

const blocks4b = NotionAITool.parseContentToBlocks(singleNested);
console.log(`Single nested: ${blocks4b.length} blocks`);
blocks4b.forEach((block, index) => {
  if (block.type === 'bulleted_list_item') {
    const content = block.bulleted_list_item.rich_text[0].text.content;
    console.log(`  ${index + 1}. "${content}"`);
  }
});

// Test 5: Lists mixed with other content
console.log('\n🔸 TEST 5: Lists Mixed with Other Content');
const mixedContent = `<h1>Project Structure</h1>
<p>Here's how we organize our project:</p>
<ul>
<li>Frontend
  <ul>
  <li>React components</li>
  <li>Styles</li>
  </ul>
</li>
<li>Backend
  <ul>
  <li>API routes</li>
  <li>Database models</li>
  </ul>
</li>
</ul>
<p>That's the basic structure.</p>`;

const blocks5 = NotionAITool.parseContentToBlocks(mixedContent);
console.log(`Mixed content: ${blocks5.length} blocks`);
blocks5.forEach((block, index) => {
  let content = '';
  switch (block.type) {
    case 'heading_1':
      content = `[H1] ${block.heading_1.rich_text[0].text.content}`;
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
    default:
      content = `[${block.type}] Content`;
  }
  console.log(`  ${index + 1}. ${content}`);
});

// Test 6: Stress test with complex nesting
console.log('\n🔸 TEST 6: Stress Test - Complex Nesting');
const stressTest = `<ul>
<li>Architecture
  <ol>
  <li>Frontend
    <ul>
    <li>React
      <ul>
      <li>Components</li>
      <li>Hooks</li>
      </ul>
    </li>
    <li>Vue</li>
    </ul>
  </li>
  <li>Backend
    <ul>
    <li>Node.js</li>
    <li>Python</li>
    </ul>
  </li>
  </ol>
</li>
<li>Database
  <ul>
  <li>SQL
    <ol>
    <li>PostgreSQL</li>
    <li>MySQL</li>
    </ol>
  </li>
  <li>NoSQL</li>
  </ul>
</li>
</ul>`;

const blocks6 = NotionAITool.parseContentToBlocks(stressTest);
console.log(`Stress test: ${blocks6.length} blocks`);
blocks6.forEach((block, index) => {
  const listType = block.type;
  if (listType.includes('list_item')) {
    const content = block[listType].rich_text[0].text.content;
    console.log(`  ${index + 1}. [${listType}] "${content}"`);
  }
});

console.log('\n✅ All complex nested list tests completed!');
console.log('\n📊 Summary:');
console.log(`Test 1 (Deep nesting): ${blocks1.length} blocks`);
console.log(`Test 2 (Mixed lists): ${blocks2.length} blocks`);
console.log(`Test 3 (Complex HTML): ${blocks3.length} blocks`);
console.log(`Test 4a (Empty nested): ${blocks4a.length} blocks`);
console.log(`Test 4b (Single nested): ${blocks4b.length} blocks`);
console.log(`Test 5 (Mixed content): ${blocks5.length} blocks`);
console.log(`Test 6 (Stress test): ${blocks6.length} blocks`);