const { NotionAITool } = require('../dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('=== TESTING MIXED NESTED LIST FORMATS ===\n');

// Test case 1: Ordered list containing unordered sub-lists
const test1 = '<ol><li>Step 1<ul><li>Bullet A</li><li>Bullet B</li></ul></li><li>Step 2<ul><li>Bullet C</li><li>Bullet D</li></ul></li></ol>';

// Test case 2: Unordered list containing ordered sub-lists  
const test2 = '<ul><li>Category A<ol><li>First step</li><li>Second step</li></ol></li><li>Category B<ol><li>Third step</li><li>Fourth step</li></ol></li></ul>';

// Test case 3: Deep nesting with alternating types
const test3 = '<ul><li>Level 1 Bullet<ol><li>Level 2 Step 1<ul><li>Level 3 Bullet A</li><li>Level 3 Bullet B</li></ul></li><li>Level 2 Step 2</li></ol></li></ul>';

// Test case 4: Complex mixed content
const test4 = '<h2>Mixed List Example</h2><ol><li>Main Task 1<ul><li>Sub-task A</li><li>Sub-task B<ol><li>Detail 1</li><li>Detail 2</li></ol></li></ul></li><li>Main Task 2</li></ol><p>End of list</p>';

const testCases = [
  { name: 'OL containing UL', content: test1, expected: ['Step 1', 'Bullet A', 'Bullet B', 'Step 2', 'Bullet C', 'Bullet D'] },
  { name: 'UL containing OL', content: test2, expected: ['Category A', 'First step', 'Second step', 'Category B', 'Third step', 'Fourth step'] },
  { name: 'Deep alternating nesting', content: test3, expected: ['Level 1 Bullet', 'Level 2 Step 1', 'Level 3 Bullet A', 'Level 3 Bullet B', 'Level 2 Step 2'] },
  { name: 'Complex mixed content', content: test4, expected: ['Main Task 1', 'Sub-task A', 'Sub-task B', 'Detail 1', 'Detail 2', 'Main Task 2'] }
];

testCases.forEach((testCase, index) => {
  console.log(`\n=== TEST ${index + 1}: ${testCase.name} ===`);
  console.log(`Input: ${testCase.content.substring(0, 100)}...`);
  
  try {
    const blocks = NotionAITool.parseContentToBlocks(testCase.content);
    
    // Extract text content from list item blocks recursively
    const extractListItems = (blocks) => {
      const items = [];
      for (const block of blocks) {
        if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
          const listType = block.type;
          if (block[listType] && block[listType].rich_text && block[listType].rich_text[0]) {
            const text = block[listType].rich_text[0].text?.content || block[listType].rich_text[0].plain_text || '';
            if (text) items.push(text);
          }
          
          // Recursively extract from children
          if (block[listType] && block[listType].children) {
            items.push(...extractListItems(block[listType].children));
          }
        }
      }
      return items;
    };
    
    const listItems = extractListItems(blocks);
    
    console.log(`Generated ${blocks.length} total blocks, ${listItems.length} list items:`);
    listItems.forEach((item, i) => {
      console.log(`  ${i + 1}. "${item}"`);
    });
    
    // Check if all expected items are present
    console.log('\nValidation:');
    const allFound = testCase.expected.every(expectedItem => {
      const found = listItems.includes(expectedItem);
      console.log(`  "${expectedItem}": ${found ? '✅' : '❌'}`);
      return found;
    });
    
    // Check for XML fragments
    const hasXmlFragments = listItems.some(item => /<[^>]*>/.test(item));
    console.log(`  XML fragments: ${hasXmlFragments ? '❌ Present' : '✅ None'}`);
    
    // Overall result
    console.log(`  Overall: ${allFound && !hasXmlFragments ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!allFound) {
      console.log(`  Expected: [${testCase.expected.join(', ')}]`);
      console.log(`  Actual:   [${listItems.join(', ')}]`);
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
});

console.log('\n=== SUMMARY ===');
console.log('This test verifies that nested lists with mixed formats (ul/ol) are processed correctly');
console.log('and that the hierarchical structure is preserved without XML fragments.');