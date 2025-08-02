const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

const testContent = `<h1>Complex Lists Examples in Notion</h1>
<p>This page demonstrates advanced examples of using lists in Notion, including nested lists, mixed ordered and unordered lists, and descriptive list items.</p>
<callout type="info">Understanding complex list structures can help create organized and clear documents in Notion.</callout>
<h2>Nested Unordered Lists</h2>
<ul>
<li>Level 1 Item
  <ul>
    <li>Level 2 Item
      <ul>
        <li>Level 3 Item</li>
        <li>Another Level 3 Item</li>
      </ul>
    </li>
    <li>Another Level 2 Item</li>
  </ul>
</li>
<li>Another Level 1 Item</li>
</ul>
<h2>Mixed Ordered and Unordered Lists</h2>
<ol>
<li>Main Step 1
  <ul>
    <li>Substep A</li>
    <li>Substep B</li>
  </ul>
</li>
<li>Main Step 2
  <ol>
    <li>Detailed Step 2.1</li>
    <li>Detailed Step 2.2</li>
  </ol>
</li>
<li>Main Step 3</li>
</ol>
<h2>Descriptive List Items</h2>
<ul>
<li><strong>Feature A:</strong> Allows <em>customization</em> and <strong>flexibility</strong> in projects.</li>
<li><strong>Feature B:</strong> Supports various <code>programming languages</code>.</li>
<li><strong>Feature C:</strong> Easy integration with <a href="https://www.notion.so">Notion</a> workflow.</li>
</ul>
<callout type="tip">Use bold and italic formatting inside list items to emphasize important terms.</callout>`;

console.log('=== TESTING MISSING HEADINGS AND CALLOUTS ===');
console.log('Input content (first 200 chars):', testContent.substring(0, 200));

try {
  const blocks = NotionAITool.parseContentToBlocks(testContent);
  
  console.log('\n=== GENERATED BLOCKS ===');
  console.log(`Total blocks created: ${blocks.length}`);
  
  blocks.forEach((block, index) => {
    console.log(`\nBlock ${index + 1}:`);
    console.log(`  Type: ${block.type}`);
    
    if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
      const headingData = block[block.type];
      const text = headingData.rich_text?.[0]?.text?.content || 'NO TEXT';
      console.log(`  Text: "${text}"`);
    } else if (block.type === 'callout') {
      const calloutData = block.callout;
      const text = calloutData.rich_text?.[0]?.text?.content || 'NO TEXT';
      const emoji = calloutData.icon?.emoji || 'NO EMOJI';
      console.log(`  Text: "${text}"`);
      console.log(`  Emoji: ${emoji}`);
    } else if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
      const listData = block[block.type];
      const text = listData.rich_text?.[0]?.text?.content || 'NO TEXT';
      const hasChildren = listData.children ? listData.children.length : 0;
      console.log(`  Text: "${text}"`);
      console.log(`  Children: ${hasChildren}`);
    } else if (block.type === 'paragraph') {
      const paragraphData = block.paragraph;
      const text = paragraphData.rich_text?.[0]?.text?.content || 'NO TEXT';
      console.log(`  Text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    }
  });
  
  // Check what types of blocks we got
  const blockTypes = blocks.map(b => b.type);
  const typeCounts = blockTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n=== BLOCK TYPE SUMMARY ===');
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  // Specifically check for missing types
  const expectedTypes = ['heading_1', 'heading_2', 'callout'];
  console.log('\n=== MISSING TYPES CHECK ===');
  expectedTypes.forEach(type => {
    if (!blockTypes.includes(type)) {
      console.log(`  ❌ MISSING: ${type}`);
    } else {
      console.log(`  ✅ FOUND: ${type}`);
    }
  });
  
} catch (error) {
  console.error('❌ Error in parsing:', error);
  console.error('Stack:', error.stack);
}