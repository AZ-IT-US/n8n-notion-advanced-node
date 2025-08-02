const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

// Test content with MULTIPLE child block types in single list items
const testContent = `
<ul>
<li>
<p>This is a paragraph</p>
<h2>Followed by a heading</h2>
<quote>And then a quote block</quote>
</li>
<li>
<callout type="warning">Important callout</callout>
<code language="javascript">console.log('code example');</code>
<embed>https://www.youtube.com/watch?v=dQw4w9WgXcQ</embed>
</li>
<li>
<todo checked="true">Completed task</todo>
<equation>E=mc^2</equation>
<bookmark>https://example.com</bookmark>
<divider/>
</li>
<li>
<image src="https://example.com/image.jpg" alt="test">Image caption</image>
<toggle>Toggle section</toggle>
</li>
<li>
Some regular text content
<p>Mixed with a paragraph</p>
<callout type="info">And a callout</callout>
</li>
</ul>
`;

console.log('🔍 MIXED CHILD BLOCK TYPES TEST');
console.log('================================================================================');
console.log('📝 Testing MULTIPLE child block types within single list items:');
console.log(testContent.trim());
console.log('\n');

try {
  const blocks = NotionAITool.parseContentToBlocks(testContent);
  
  console.log(`📊 Result Summary:`);
  console.log(`Total blocks: ${blocks.length}`);
  console.log('\n');
  
  console.log('🔍 Detailed Block Analysis:');
  
  let totalChildBlocks = 0;
  const childBlockTypes = new Set();
  
  blocks.forEach((block, index) => {
    console.log(`\n=== List Item ${index + 1} ===`);
    console.log(`Block type: ${block.type}`);
    
    if (block.type === 'bulleted_list_item') {
      const listData = block.bulleted_list_item;
      const textContent = listData.rich_text && listData.rich_text.length > 0 
        ? listData.rich_text.map(rt => rt.text?.content || '').join('') 
        : 'N/A';
      console.log(`Parent text: "${textContent}"`);
      
      if (listData.children && listData.children.length > 0) {
        console.log(`Children count: ${listData.children.length}`);
        
        listData.children.forEach((child, childIndex) => {
          console.log(`  Child ${childIndex + 1}: ${child.type}`);
          childBlockTypes.add(child.type);
          totalChildBlocks++;
          
          // Show child block details
          switch (child.type) {
            case 'paragraph':
              const pText = child.paragraph.rich_text.map(rt => rt.text?.content || '').join('');
              console.log(`    Content: "${pText}"`);
              break;
            case 'heading_1':
            case 'heading_2': 
            case 'heading_3':
              const hText = child[child.type].rich_text.map(rt => rt.text?.content || '').join('');
              console.log(`    Content: "${hText}"`);
              break;
            case 'quote':
              const qText = child.quote.rich_text.map(rt => rt.text?.content || '').join('');
              console.log(`    Content: "${qText}"`);
              break;
            case 'callout':
              const cText = child.callout.rich_text.map(rt => rt.text?.content || '').join('');
              const cEmoji = child.callout.icon?.emoji || '';
              const cColor = child.callout.color || '';
              console.log(`    Content: "${cText}" (${cEmoji}, ${cColor})`);
              break;
            case 'code':
              const codeText = child.code.rich_text.map(rt => rt.text?.content || '').join('');
              const lang = child.code.language || '';
              console.log(`    Code: "${codeText}" (${lang})`);
              break;
            case 'to_do':
              const todoText = child.to_do.rich_text.map(rt => rt.text?.content || '').join('');
              const checked = child.to_do.checked ? 'checked' : 'unchecked';
              console.log(`    Todo: "${todoText}" (${checked})`);
              break;
            case 'toggle':
              const toggleText = child.toggle.rich_text.map(rt => rt.text?.content || '').join('');
              console.log(`    Toggle: "${toggleText}"`);
              break;
            case 'equation':
              console.log(`    Expression: "${child.equation.expression}"`);
              break;
            case 'embed':
              console.log(`    URL: ${child.embed.url}`);
              break;
            case 'bookmark':
              console.log(`    URL: ${child.bookmark.url}`);
              break;
            case 'image':
              console.log(`    URL: ${child.image.external.url}`);
              if (child.image.caption && child.image.caption.length > 0) {
                const caption = child.image.caption.map(rt => rt.text?.content || '').join('');
                console.log(`    Caption: "${caption}"`);
              }
              break;
            case 'divider':
              console.log(`    Divider block`);
              break;
          }
        });
      } else {
        console.log(`Children count: 0`);
      }
    }
  });
  
  console.log('\n📈 COMPREHENSIVE SUMMARY:');
  console.log(`Total list items: ${blocks.length}`);
  console.log(`Total child blocks: ${totalChildBlocks}`);
  console.log(`Unique child block types: ${childBlockTypes.size}`);
  console.log(`Child block types found: ${Array.from(childBlockTypes).sort().join(', ')}`);
  
  console.log('\n🎯 MIXED BLOCK ANALYSIS:');
  let itemsWithMultipleChildren = 0;
  let maxChildrenInItem = 0;
  
  blocks.forEach((block, index) => {
    if (block.type === 'bulleted_list_item') {
      const listData = block.bulleted_list_item;
      const childCount = listData.children ? listData.children.length : 0;
      
      if (childCount > 1) {
        itemsWithMultipleChildren++;
      }
      
      if (childCount > maxChildrenInItem) {
        maxChildrenInItem = childCount;
      }
      
      console.log(`List item ${index + 1}: ${childCount} child blocks`);
    }
  });
  
  console.log(`\n✅ MIXED CONTENT RESULTS:`);
  console.log(`Items with multiple child blocks: ${itemsWithMultipleChildren}`);
  console.log(`Maximum child blocks in single item: ${maxChildrenInItem}`);
  
  if (itemsWithMultipleChildren > 0) {
    console.log(`✅ SUCCESS: Mixed child block types working correctly!`);
  } else {
    console.log(`⚠️ WARNING: No items with multiple child blocks found`);
  }
  
} catch (error) {
  console.error('❌ Error during processing:', error);
  console.error('Stack:', error.stack);
}